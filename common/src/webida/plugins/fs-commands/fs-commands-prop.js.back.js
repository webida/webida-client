/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(['require',
        'webida-lib/app',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
        'webida-lib/plugins/workbench/plugin',
        'webida-lib/util/notify',
        'external/lodash/lodash.min',
        'external/moment/min/moment.min',
        'webida-lib/plugins/workspace/plugin',
        'dojo/Deferred',
        'dijit/registry',
        'text!./layer/filePropertiesForm.html'
       ],
function (require, ide, ButtonedDialog, workbench, notify, _, moment,
           wv, Deferred, reg, fPropertiesForm) {
    'use strict';
    /* global timedLogger:true */

    var fsMount = ide.getFSCache();

    // constructor
    var FileProp = function () {
    };

    FileProp.prototype.execute = function (paths, selectedNode) {

        function _getSizeInfo(byte) {
            var sizesType = ['Byte', 'KB', 'MB', 'GB', 'TB'];
            var byteString = byte.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') +
                ' ' + sizesType[0];
            var calString = byteString;

            if (byte === 0) {
                return calString + ' (' + byteString + ')';
            }
            var i = parseInt(Math.floor(Math.log(byte) / Math.log(1024)));
            calString = Math.round((byte / Math.pow(1024, i)).toPrecision(3)) + ' ' + sizesType[i];

            return calString + ' (' + byteString + ')';
        }

        /*
         * SINGLE_FILE - single file selected
         * SINGLE_DIRECTORY - single directoy selected
         * MULTIPLE_FILE - multiple file selected
         * MULTIPLE_DIRECTORY - multiple directory selected
         * COMPLEX - complex selected, file, directory mixed
         */
        var FP_DIALOG_TYPES = {
            SINGLE_FILE: 0,
            SINGLE_DIRECTORY: 1,
            MULTIPLE_FILE: 2,
            MULTIPLE_DIRECTORY: 3,
            COMPLEX: 4,

            toString : function (/* FP_DIALOG_TYPES */type) {
                var str = '';
                switch (type) {
                case FP_DIALOG_TYPES.SINGLE_FILE:
                    str = 'Single File';
                    break;
                case FP_DIALOG_TYPES.SINGLE_DIRECTORY:
                    str = 'Directory';
                    break;
                case FP_DIALOG_TYPES.MULTIPLE_FILE:
                    str = 'Multiple File';
                    break;
                case FP_DIALOG_TYPES.MULTIPLE_DIRECTORY:
                    str = 'Multiple Directory';
                    break;
                case FP_DIALOG_TYPES.COMPLEX:
                    str = 'Multiple File And Directory';
                    break;
                }
                return str;
            }
        };
        var FP_DIALOG_MSG = {
            FORCE_STOP: 'Force Stop',
            ERROR: 'Error',
            OPERATION_FAILED: 'Failed to file properties operation.',
            NO_SELECTED: 'Can not find selected file or directory.',
            NO_CHILD: 'Failed to find sub file or directory.'
        };
        var FP_DIALOG_ID = 'fpfdlg';
        var FP_DIALOG_TIME_FORMAT = 'YYYY/MM/DD hh:mm:ss A';
        var FP_DIALOG_TIME_NULL = '0000-00-00T00:00:00.000Z';

        var progressByte = 0;
        var progressFCnt = 0;
        var progressDCnt = 0;
        var progressQueue = [];
        var resolve = {
            name: '',
            type: '',
            loc: '',                        /* full path */
            ploc: '',                       /* parent path */
            ctime: FP_DIALOG_TIME_NULL,     /* create time */
            mtime: FP_DIALOG_TIME_NULL,     /* last modify time */
            atime: FP_DIALOG_TIME_NULL,     /* last access time */
            byte: 0,                        /* size count */
            fcnt: 0,                        /* file count */
            dcnt: 0,                        /* directory count */
            size: _getSizeInfo(0)           /* text style size, GB, MB, KB, BYTE */
        };

        var type = null; // file selection type
        var filePathList = [];
        var dirPathList = [];
        var worker = null;
        var procList = [];

        var nodes = [];
        console.log('selectedNode', selectedNode);
        if (selectedNode) {
            nodes.push(selectedNode);
        } else {
            try {
                if (!!paths) {
                    if (_.isString(paths) || (_.isArray(paths) && paths.length === 1)) {
                        var nd = wv.getNode(paths);
                        if (!!nd) {
                            nodes.push(nd);
                        }
                    }
                } else {
                    nodes = wv.getSelectedNodes();
                }
                if (!nodes || nodes.length < 1) {
                    notify.error(FP_DIALOG_MSG.NO_SELECTED, FP_DIALOG_MSG.ERROR);
                    return;
                }
            } catch (err) { // workspace can be disabled
                console.warn('Failed to get node', err);
            }
        }

        function _getFileExt(name) {
            var ext = (/^.+\.([^.]+)$/.exec(name));
            return (ext && _.isArray(ext) && ext.length > 1) ? ext[1] : '';
        }

        function _getType(name) {
            var type;
            var ext = _getFileExt(name);
            ext = ext.toLowerCase();

            switch (ext) {
            case 'js':
                type = 'Javascript file';
                break;
            case 'html':
            case 'htm':
                type = 'HTML file';
                break;
            case 'css':
                type = 'CSS file';
                break;
            case 'json':
                type = 'JSON file';
                break;
            case 'text':
            case 'txt':
                type = 'text file';
                break;
            case 'md':
                type = 'Markdown file';
                break;
            case 'png':
            case 'gif':
            case 'jpg':
            case 'jpeg':
                type = 'image file';
                break;
            default:
                type = 'file of an unknown type';
                break;
            }

            return type;
        }

        function _getParentLocation(/* current path */loc, /* current file name */name) {
            return loc.substr(0, loc.length - name.length);
        }

        function _getSlicePathLists(/* array */pathList) {
            var pathsLists = [];
            var startIndex = 0;
            var endIndex = 200;
            var sliceList = null;

            while ((sliceList = pathList.slice(startIndex, endIndex)) &&
                   sliceList.length > 0) {
                pathsLists.push(sliceList);
                startIndex = endIndex;
                endIndex += 200;
            }

            return pathsLists;
        }

        function _initProgressValue() {
            progressByte = 0;
            progressFCnt = 0;
            progressDCnt = 0;
        }

        function _asyncGetStat(/* array */pathList) {
            var deferred = new Deferred();
            procList.push(deferred.promise);

            if (pathList.length > 200) {
                var pLists = _getSlicePathLists(pathList);
                var checksum = pLists.length;
                var completeList = [];
                _initProgressValue();

                _.each(pLists, function (list) {
                    _asyncGetStat(list)
                    .then(
                        function (resolve) {
                            completeList.push(resolve);

                            if (completeList.length === checksum) {
                                var o = {
                                    name: '',
                                    type: '',
                                    loc: '',   /* full path */
                                    ploc: '',  /* parent path */
                                    ctime: '', /* create time */
                                    mtime: '', /* last modify time */
                                    atime: '', /* last access time */
                                    byte: 0,   /* size count */
                                    fcnt: 0,   /* file count */
                                    dcnt: 0,   /* directory count */
                                    size: '',  /* text style size, GB, MB, KB, BYTE */
                                };
                                _.each(completeList, function (content) {
                                    o.name = content.name;
                                    o.type = content.isFile ? _getType(o.name) : FP_DIALOG_TYPES.toString(type);
                                    o.loc = content.loc;
                                    o.ploc = _getParentLocation(o.loc, o.name);

                                    // time info
                                    o.ctime = content.ctime;
                                    o.mtime = content.mtime;
                                    o.atime = content.atime;

                                    // size sum And direcnty, file count
                                    o.byte += content.byte;
                                    o.dcnt += content.dcnt;
                                    o.fcnt += content.fcnt;

                                    // text style size info
                                    o.size = _getSizeInfo(o.byte);
                                });

                                deferred.resolve(o);
                            }
                        },
                        function (err) {
                            deferred.reject(err);
                        },
                        function (progress) {
                            deferred.progress(progress);
                        }
                    );
                });
            } else {
                var robj = {
                    name: '',
                    type: '',
                    loc: '',   /* full path */
                    ploc: '',  /* parent path */
                    ctime: '', /* create time */
                    mtime: '', /* last modify time */
                    atime: '', /* last access time */
                    byte: 0,   /* size count */
                    fcnt: 0,   /* file count */
                    dcnt: 0,   /* directory count */
                    size: '',  /* text style size, GB, MB, KB, BYTE */
                }; /* return object */
                // call aync 'stat' function
                fsMount.stat(pathList, function (err, contents) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        _.each(contents, function (content) {
                            // basic info
                            robj.name = content.name;
                            robj.type = content.isFile ? _getType(robj.name) : FP_DIALOG_TYPES.toString(type);
                            robj.loc = content.path;
                            robj.ploc = _getParentLocation(robj.loc, robj.name);

                            // time info
                            robj.ctime = content.ctime;
                            robj.mtime = content.mtime;
                            robj.atime = content.atime;

                            // size sum And direcnty, file count
                            robj.byte += content.size;
                            robj.dcnt = (content.isDirectory ? ++robj.dcnt : robj.dcnt);
                            robj.fcnt = (content.isFile ? ++robj.fcnt : robj.fcnt);

                            progressByte += content.size;
                            progressDCnt = (content.isDirectory ? ++progressDCnt : progressDCnt);
                            progressFCnt = (content.isFile ? ++progressFCnt : progressFCnt);

                            // text style size info
                            robj.size = _getSizeInfo(robj.byte);

                            // update info
                            deferred.progress(robj);
                        });

                        deferred.resolve(robj);
                    }
                });
            }

            return deferred.promise;
        }

        function _asyncGetList(/* array */paths) {
            var deferred = new Deferred();
            procList.push(deferred.promise);
            var sendCnt = 0;
            var receiveCnt = 0;
            var robj = {
                pathList: []
            }; /* return object */

            // support worker
            if (typeof(Worker)) {
                // create worker
                if (!worker) {
                    worker = new Worker(require.toUrl('webida-lib/plugins/fs-commands/filePropertiesWorker.js'));
                }

                // receive
                worker.onmessage = function (event) {
                    receiveCnt++;

                    if (!!event && !!event.data) {
                        var data = event.data;

                        if (data.type === 'log') {
                            // data is log then don't close worker
                            console.log(data.message);
                            return;
                        } else if (data.msg === 'progress') {
                            return;
                        } else if (data.msg === 'success') {
                            robj.pathList = _.union(robj.pathList, JSON.parse(data.pathList));

                            if (sendCnt === receiveCnt) {
                                deferred.resolve(robj);
                            }
                        }
                    } else {
                        // error
                        deferred.reject('woker operation failed');
                    }
                };

                // all paths getlist logic
                _.each(paths, function (path) {
                    fsMount.list(path, true, function (err, contents) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            if (contents.length < 1) {
                                deferred.reject(FP_DIALOG_MSG.NO_CHILD);
                            } else {
                                // send, start worker
                                var data = {
                                    msg: 'start',
                                    basePath: path,
                                    contents: JSON.stringify(contents)
                                };
                                sendCnt++;
                                worker.postMessage(data);
                            }
                        }
                    });
                });
            } else {
                // not support worker
                deferred.reject('web worker not supported');
            }

            return deferred.promise;
        }

        function _asyncGetRecursiveDirectoryStat(/* must input directory path array*/paths) {
            var deferred = new Deferred();
            procList.push(deferred.promise);

            // paths check
            if (!paths || !_.isArray(paths)) {
                return deferred.reject('wrong path');
            }

            var cbErr = function (err) {
                deferred.reject(err);
            };

            var cbProgress = function (progress) {
                deferred.progress(progress);
            };

            // paths check already before call
            _asyncGetList(paths).then(function (resolve) {
                    _initProgressValue();
                    return _asyncGetStat(resolve.pathList);
                },
                // _asyncGetList reject
                cbErr
            ).then(function (resolve) {
                    deferred.resolve(resolve);
                },
                // _asyncGetStat reject
                cbErr,
                // _asyncGetStat progress
                cbProgress
            );

            return deferred.promise;
        }

        function _showFilePropertiesDialogInfo(dialogType) {
            var el = $('.fpfContentsPane');
            if (!!el) {
                el.show();

                if (dialogType === FP_DIALOG_TYPES.SINGLE_FILE) {
                    el.find('.SINGLE_FILE').show();
                } else if (dialogType === FP_DIALOG_TYPES.SINGLE_DIRECTORY) {
                    el.find('.SINGLE_DIRECTORY').show();
                } else {
                    el.find('.MULTIPLE').show();
                }
            }
        }

        function _updateFilePropertiesDialogInfo(infoObj) {
            var el = $('.fpfContentsPane');
            if (!!infoObj && !!el) {
                el.find('#fpfContents')
                .text('File ' + infoObj.fcnt + ', ' + 'Directoy ' + infoObj.dcnt);

                el.find('#fpfName').text(infoObj.name);
                el.find('#fpfType').text(infoObj.type);
                el.find('#fpfLoc').text(infoObj.ploc);
                el.find('#fpfSize').text(infoObj.size);
                el.find('#fpfCDate').text(moment(infoObj.ctime).format(FP_DIALOG_TIME_FORMAT));
                el.find('#fpfMDate').text(moment(infoObj.mtime).format(FP_DIALOG_TIME_FORMAT));
                el.find('#fpfADate').text(moment(infoObj.atime).format(FP_DIALOG_TIME_FORMAT));
            }
        }

        function _openFilePropertiesDialog(infoObj, dialogType) {
            var filePropertiesDlg =  new ButtonedDialog({
                buttons: [{
                    caption: 'Close',
                    methodOnClick: 'hide'
                }],
                methodOnEnter: 'hide',

                id: FP_DIALOG_ID,
                title: 'Properties',
                onCancel: function () {
                    filePropertiesDlg.hide();
                },

                onHide: function () {
                    // worker terminate
                    if (worker) {
                        worker.terminate();
                        worker = null;
                    }

                    // promise close
                    if (procList && procList.length > 0) {
                        _.each(procList, function (proc) {
                            proc.cancel(FP_DIALOG_MSG.FORCE_STOP);
                        });
                    }

                    // processQueue clear
                    progressQueue = [];

                    filePropertiesDlg.destroyRecursive();
                    workbench.focusLastWidget();
                },

                onLoad: function () {
                    // dialog info setting
                    _showFilePropertiesDialogInfo(dialogType);
                    _updateFilePropertiesDialogInfo(infoObj);
                }
            });
            filePropertiesDlg.set('doLayout', false);
            filePropertiesDlg.setContentArea(fPropertiesForm);
            filePropertiesDlg.show();
        }

        function _closeLoadingMessage() {
            time = timedLogger.log('file properties whole stat complate time', time);
            $('.loading').fadeOut(1000);
            $('.opa').css('opacity', 1);
        }

        function _progress(stop, dialogType) {
            // stop progress
            if (!!stop && !!progressQueue && progressQueue.length < 1) {
                // loading message close
                _closeLoadingMessage();
                return;
            }

            if (!!progressQueue && progressQueue.length > 0) {
                var info = progressQueue.shift();

                // all infomation collected
                _updateFilePropertiesDialogInfo(info, dialogType);

                if (!!stop) {
                    _progress(stop, dialogType);
                }
            }
        }

        // define callback function
        var cbProgress = function (/*progress*/) {
            // some infomation collected, dialog's info update
            resolve.byte = progressByte;
            resolve.dcnt = progressDCnt;
            resolve.fcnt = progressFCnt;
            resolve.size = _getSizeInfo(progressByte);

            if (type !== FP_DIALOG_TYPES.SINGLE_DIRECTORY &&
                type !== FP_DIALOG_TYPES.SINGLE_FILE) {
                resolve.type = FP_DIALOG_TYPES.toString(type);
            }

            progressQueue.push(_.clone(resolve, true));
            _progress(false, type);
        };

        var cbErr = function (err) {
            var dlg = reg.byId(FP_DIALOG_ID);
            if (dlg) {
                dlg.onCancel();
            }

            if (err !== FP_DIALOG_MSG.FORCE_STOP) {
                // error state close dialog and error message popup
                notify.error(err, FP_DIALOG_MSG.OPERATION_FAILED);
            }
        };

        var cbResolveCore = function () {
            // all infomation collected
            progressQueue.push(_.clone(resolve, true));

            _progress(true, type);
        };

        var cbResolve = function (/*done*/) {
            if (type === FP_DIALOG_TYPES.MULTIPLE_DIRECTORY ||
                type === FP_DIALOG_TYPES.COMPLEX) {
                progressDCnt += dirPathList.length;
                resolve.dcnt = progressDCnt;

                if (filePathList.length > 0) {
                    _asyncGetStat(filePathList)
                    .then(cbResolveCore, cbErr, cbProgress);
                    return;
                }
            }
            cbResolveCore();
        };

        if (nodes && nodes.length > 0) {
            var firstPath = [];
            var bSelectDirectory = false;
            var bSelectFile = false;
            var node = null;

            // collect paths and type check
            if (nodes.length === 1) {
                // single selection
                node = nodes[0];

                // type
                if (!node.isInternal) {
                    // select single file
                    type = FP_DIALOG_TYPES.SINGLE_FILE;
                } else if (!!node.isInternal) {
                    // select single directory
                    type = FP_DIALOG_TYPES.SINGLE_DIRECTORY;
                }
            } else if (nodes.length > 1) {
                // multiple selection
                _.each(nodes, function (node) {
                    if (!!node.id) {
                        if (node.isInternal) {
                            if (!bSelectDirectory) {
                                bSelectDirectory = true;
                            }
                            if (node.hasSubnode()) {
                                dirPathList.push(node.id);
                            } else {
                                filePathList.push(node.id);
                            }
                        } else if (!node.isInternal) {
                            if (!bSelectFile) {
                                bSelectFile = true;
                            }
                            filePathList.push(node.id);
                        }
                    }
                });

                // type
                if (bSelectDirectory && bSelectFile) {
                    type = FP_DIALOG_TYPES.COMPLEX;
                } else if (bSelectDirectory && !bSelectFile) {
                    type = FP_DIALOG_TYPES.MULTIPLE_DIRECTORY;
                } else if (!bSelectDirectory && bSelectFile) {
                    type = FP_DIALOG_TYPES.MULTIPLE_FILE;
                }
            }

            // init progress value
            _initProgressValue();

            // get first path info
            switch (type) {
            case FP_DIALOG_TYPES.SINGLE_FILE:
            case FP_DIALOG_TYPES.SINGLE_DIRECTORY:
                firstPath.push(node.id);

                // default value setting
                resolve.name = node.name;
                resolve.ploc = node.parent + '/';
                break;
            case FP_DIALOG_TYPES.MULTIPLE_FILE:
            case FP_DIALOG_TYPES.MULTIPLE_DIRECTORY:
            case FP_DIALOG_TYPES.COMPLEX:
                if (dirPathList.length > 0) {
                    firstPath.push(dirPathList[0]);
                } else {
                    firstPath.push(filePathList.shift());
                }

                // default value setting
                resolve.ploc = nodes[0].parent + '/';
                break;
            }
            resolve.type = (type === FP_DIALOG_TYPES.SINGLE_FILE) ?
                            _getType(resolve.name) :
                            FP_DIALOG_TYPES.toString(type);

            // start then open dialog
            _openFilePropertiesDialog(resolve, type);
            _progress(false, type);

            var time = timedLogger.getLoggerTime();
            _asyncGetStat(firstPath).then(function (complete) {
                    time = timedLogger.log('file properties first stat complate time', time);
                    resolve = _.clone(complete, true);
                    //var firstStat = _.clone(complete, true);

                    /* open dialog with basic info */
                    //_openFilePropertiesDialog(resolve, type);
                    //_progress(false, type);

                    /* update basic info */
                    _updateFilePropertiesDialogInfo(resolve, type);

                    if (type === FP_DIALOG_TYPES.SINGLE_FILE) {
                        // loading message close
                        _closeLoadingMessage();
                    } else if (type === FP_DIALOG_TYPES.SINGLE_DIRECTORY) {
                        if (node.hasSubnode()) {
                            // has child diretory
                            _asyncGetRecursiveDirectoryStat(firstPath).then(cbResolve, cbErr, cbProgress);
                        } else {
                            // empty directory
                            _closeLoadingMessage();
                        }
                    } else if (type === FP_DIALOG_TYPES.MULTIPLE_FILE) {
                        _asyncGetStat(filePathList).then(cbResolve, cbErr, cbProgress);
                    } else if (type === FP_DIALOG_TYPES.MULTIPLE_DIRECTORY ||
                               type === FP_DIALOG_TYPES.COMPLEX) {
                        if (dirPathList.length > 0) {
                            _asyncGetRecursiveDirectoryStat(dirPathList).then(cbResolve, cbErr, cbProgress);
                        } else {
                            var emptyDirList = _.clone(filePathList, true);
                            filePathList = [];
                            _asyncGetStat(emptyDirList).then(cbResolve, cbErr, cbProgress);
                        }
                    }
                },
                cbErr
            );
        }
    };

    return FileProp;
});
