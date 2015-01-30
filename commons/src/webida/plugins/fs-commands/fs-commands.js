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

/**
 * webida - file handle plugin
 *
 */

define(['require',
        'other-lib/underscore/lodash.min',          // _
        'webida-lib/app',                           // ide
        'webida-lib/util/path',                           // pathUtil
        'other-lib/async',                                // async
        'webida-lib/util/arrays/BubblingArray',     // BubblingArray
        'webida-lib/plugins/workspace/plugin',                 // wv
        'webida-lib/plugins/workbench/plugin',      // workbench
        './CheckBoxTree',                           // CheckBoxTree
        'text!./layer/searchFilesForm.html',        // sFilesForm
        'text!./layer/filesSelectForm.html',        // fSelectForm
        'text!./layer/goToFile.html',               // goToFileForm
        'dojo',                                     // dojo
        'dojo/dom',                                 // dom
        'dojo/dom-class',                           // domClass
        'dojo/aspect',                              // aspect
        'dojo/topic',                               // topic
        'dojo/Deferred',                            // Deferred
        'dojo/store/Memory',                        // Memory
        'dojo/store/Observable',                    // Observable
        'dijit/tree/ObjectStoreModel',              // ObjectStoreModel
        'dijit/Tree',                               // Tree
        'dijit/registry',                           // reg
        'dijit/Tooltip',                            // Tooltip
        'other-lib/toastr/toastr',                  // Toastr
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',   // ButtonedDialog
        'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States'  // FileDialog
        ],
function (require, _,
          ide,
           pathUtil,
          async,
          BubblingArray,
          wv,
          workbench,
          CheckBoxTree,
          sFilesForm,
          fSelectForm,
          goToFileForm,
          dojo,
          dom,
          domClass,
          aspect,
          topic,
          Deferred,
          Memory,
          Observable,
          ObjectStoreModel,
          Tree,
          reg,
          Tooltip,
          toastr,
          ButtonedDialog,
          FileDialog
         )
{
    'use strict';

    //console.log('hina: Loading fs-commands module');

    var fsMount = ide.getFSCache();

    //
    // handlers for folder commands
    //

    function handleCopy() {
        wv.copySelected();
    }

    function handleCut() {
        wv.cutSelected();
    }

    function handlePaste() {
        wv.pasteToSelected();
    }

    function handleNewFile() {
        var path = wv.getSelectedPath();
        if (path) {
            wv.createNodeInteractively(path, 'file');
        }
    }

    function handleNewFolder() {
        var path = wv.getSelectedPath();
        if (path) {
            wv.createNodeInteractively(path, 'directory');
        }
    }

    function handleRename() { // also for files
        var path = wv.getSelectedPath();
        if (path) {
            wv.renameNodeInteractively(path);
        }
    }

    function handleRefresh() {
        var path = wv.getSelectedPath();
        if (path) {
            wv.refreshRecursively(path, true);
        }
    }

    /**
     * Definitions relating to 'Find in Files' command
     */

    var fiFData = {
        patterns : new BubblingArray(11),
        asRegEx : false,
        ignoreCase : false,
        wordMatch: false,
        dirs: new BubblingArray(11),
        excludedDirs : new BubblingArray(11),
        exFoldersAsRegEx : false,
        includedFiles : new BubblingArray(11),
        inFilesAsRegEx : false
    };

    function findInCurDir() {
        var selected = wv.getSelectedPaths();
        if (selected.length === 1) {
            handleFindInFiles(selected[0]);
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }

    function handleFindInFiles(rootPath) {
        function restoreCombobox(combobox, data) {
            var storeData = [];
            var toShift = false;
            data.forEach(function (item, i) {
                if (i === 0) {
                    if (item) {
                        combobox.set('value', item);
                    } else {
                        toShift = true;
                    }
                } else {
                    storeData.push({name: item});
                }
            });
            if (toShift) {
                data.shift();
            }
            var store = new Memory({data: storeData});
            combobox.set('store', store);
        }
        var patternComboElem = null;
        var asRegExBtElem = null;
        var ignorCaseBtElem = null;
        var wholewordBtElem = null;
        var folderComboElem = null;
        var exFoldersComboElem = null;
        var exFoldersAsRegExBtElem = null;
        var inFilesComboElem = null;
        var inFilesAsRegExBtElem = null;

        var handleFileInFilesDlg = new ButtonedDialog({
            buttons: [
                { caption: 'Find', methodOnClick: 'onOkay' },
                { caption: 'Cancel', methodOnClick: 'hide' }
            ],
            methodOnEnter: 'onOkay',

            title: 'Find in Files',

            refocus: false,

            onHide: function () {
                // clear tooltip
                patternComboElem.displayMessage('');
                folderComboElem.displayMessage('');

                // this dialog object destory in DOM
                handleFileInFilesDlg.destroyRecursive();
                workbench.focusLastWidget();
            },

            onOkay: function () {
                function convertToNormalizedString(s) {
                    return s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
                }

                var pattern = patternComboElem.getValue();
                var asRegEx = asRegExBtElem.checked;
                var ignorCase = ignorCaseBtElem.checked;
                var wholeword = wholewordBtElem.checked;
                var path = folderComboElem.getValue();
                var exFolders = exFoldersComboElem.getValue();
                var exFoldersAsRegEx = exFoldersAsRegExBtElem.checked;
                var inFiles = inFilesComboElem.getValue();
                var inFilesAsRegEx = inFilesAsRegExBtElem.checked;

                if (!pattern) {
                    toastr.warning('Enter the pattern to find.');
                } else if (!path) {
                    toastr.warning('Enter the directory to search.');
                } else {
                    // save current values
                    fiFData.patterns.put(pattern);
                    fiFData.asRegEx = asRegEx;
                    fiFData.ignoreCase = ignorCase;
                    fiFData.wordMatch = wholeword;
                    fiFData.dirs.put(path);
                    if (exFolders) {
                        fiFData.excludedDirs.put(exFolders);
                    } else {
                        fiFData.excludedDirs.put('');
                    }
                    fiFData.exFoldersAsRegEx = exFoldersAsRegEx;
                    if (inFiles) {
                        fiFData.includedFiles.put(inFiles);
                    } else {
                        fiFData.includedFiles.put('');
                    }
                    fiFData.inFilesAsRegEx = inFilesAsRegEx;

                    var encloser, origPattern = pattern;
                    if (asRegEx) {
                        encloser = '/';
                    } else {
                        encloser = '"';
                        pattern = convertToNormalizedString(pattern);
                    }

                    var jobId = workbench.addJob('Find in Files : ' +
                                                 encloser + origPattern + encloser);
                    var options = {};

                    if (exFolders) {
                        if (!exFoldersAsRegEx) {
                            exFolders = convertToNormalizedString(exFolders);
                        }

                        options.excludedir = exFolders;
                    }

                    if (inFiles) {
                        if (!inFilesAsRegEx) {
                            inFiles = convertToNormalizedString(inFiles);
                        }
                        options.includefile = inFiles;
                    }
                    options.ignorecase = ignorCase;
                    options.wholeword = wholeword;
                    fsMount.searchFiles(pattern, path, options, function (err, results) {
                        if (err) {
                            toastr.error('Failed to search files.');
                            console.log('Failed to search files (' + err + ')');
                        } else {
                            topic.publish('#REQUEST.log', '# Result of finding pattern ' +
                                          encloser + origPattern + encloser +
                                          ' in files within a directory ' + path);
                            console.log('hina: result.length = ' + results.length);
                            if (results.length > 0) {
                                results.forEach(function (file) {
                                    var fileName = file.filename;

                                    // The following if paragarph is temporary.
                                    // TODO: remove the following when server is done.
                                    if (fileName.indexOf('/') !== 0) {
                                        fileName = '/' + fileName;
                                    }
                                    //console.log('hina: i = ' + i);
                                    topic.publish('#REQUEST.log', '\nMatched File: ' + fileName);

                                    file.match.forEach(function (line) {
                                        //console.log('hina: j = ' + j);
                                        var lineNumber = line.line;
                                        var text = '\t- at line ' + lineNumber + ': "' + line.text + '"';
                                        var filelocInfo = {
                                            type: 'fileloc',
                                            path: fileName,
                                            line: lineNumber,
                                            text: text
                                        };
                                        topic.publish('#REQUEST.log', filelocInfo);
                                    });
                                });
                            } else {
                                topic.publish('#REQUEST.log', '  Not found');
                            }
                            topic.publish('#REQUEST.log', '\n');
                        }

                        workbench.removeJob(jobId);
                    });

                    // close
                    this.hide();
                }
            }, // onOkay close

            onBrowse: function () {
                var rootPath = ide.getPath();
                var curPath = folderComboElem.get('value');
                var dlg = new FileDialog({
                    mount : fsMount,
                    root: rootPath,
                    initialSelection: [curPath],
                    title: 'Select a Directory',
                    singular: true,
                    dirOnly: true
                });
                dlg.open(function (selected) {
                    //console.log('hina temp: selected = ' + selected);
                    if (selected) {
                        folderComboElem.set('value', selected + '/');
                    }
                });
            },

            initElements: function () {
                // pattern of keywords to find
                patternComboElem = reg.byId('sfDojoComboBoxPatternToFind');

                asRegExBtElem = reg.byId('sfDojoCheckBoxRegEx');
                ignorCaseBtElem = reg.byId('sfDojoCheckBoxIgnoreCase');
                wholewordBtElem = reg.byId('sfDojoCheckBoxWholeWords');

                // search target directory
                folderComboElem = reg.byId('sfDojoComboBoxRecentFolders');

                // additional find options
                exFoldersComboElem = reg.byId('sfDojoComboBoxFoldersToExclude');
                exFoldersAsRegExBtElem = reg.byId('sfDojoCheckBoxExcludeRegEx');
                inFilesComboElem = reg.byId('sfDojoComboBoxFilesToInclude');
                inFilesAsRegExBtElem = reg.byId('sfDojoCheckBoxFilesRegEx');
            }, // initElements close

            restoreElementValues: function () {
                var text = this.getSelectedText();

                if (text !== '') {
                    restoreCombobox(patternComboElem, [text]);
                } else {
                    restoreCombobox(patternComboElem, fiFData.patterns);
                }

                asRegExBtElem.set('checked', fiFData.asRegEx);
                ignorCaseBtElem.set('checked', fiFData.ignoreCase);
                wholewordBtElem.set('checked', fiFData.wordMatch);
                restoreCombobox(folderComboElem, fiFData.dirs);
                restoreCombobox(exFoldersComboElem, fiFData.excludedDirs);
                exFoldersAsRegExBtElem.set('checked', fiFData.exFoldersAsRegEx);
                restoreCombobox(inFilesComboElem, fiFData.includedFiles);
                inFilesAsRegExBtElem.set('checked', fiFData.inFilesAsRegEx);

            }, // restoreElementValues close

            getSelectedText: function () {
                var text = '';

                if (window.getSelection) {
                    text = window.getSelection().toString();
                } else if (document.selection && document.selection.type !== 'Control') {
                    text = document.selection.createRange().text;
                }

                return text;
            },

            setElements: function () {
                // setting element value
                var defaults = {
                    searchAttr: 'name',
                    missingMessage: 'A value is required',
                    ignoreCase: true,
                    autoComplete: false,
                    queryExpr: '*${0}*',
                };

                var required = {
                    required: true,
                    missingMessage: 'A value is required'
                };

                patternComboElem.set(defaults);
                patternComboElem.set(required);

                folderComboElem.set(defaults);
                folderComboElem.set(required);

                // override displayMessage function
                patternComboElem.displayMessage = function (/*String*/message) {
                    // summary:
                    //    Overridable method to display validation errors/hints.
                    //    By default uses a tooltip.
                    // tags:
                    //    extension
                    if (message && patternComboElem.focused) {
                        Tooltip.show(message,
                                     patternComboElem.domNode,
                                     patternComboElem.tooltipPosition,
                                     !patternComboElem.isLeftToRight());
                        patternComboElem.isTooltipShow = true;
                    } else {
                        Tooltip.hide(patternComboElem.domNode);
                        patternComboElem.isTooltipShow = false;
                    }
                };

                folderComboElem.displayMessage = function (/*String*/message) {
                    // summary:
                    //    Overridable method to display validation errors/hints.
                    //    By default uses a tooltip.
                    // tags:
                    //    extension
                    if (message && folderComboElem.focused) {
                        Tooltip.show(message,
                                     folderComboElem.domNode,
                                     folderComboElem.tooltipPosition,
                                     !folderComboElem.isLeftToRight());
                        folderComboElem.isTooltipShow = true;
                    } else {
                        Tooltip.hide(folderComboElem.domNode);
                        folderComboElem.isTooltipShow = false;
                    }
                };

                exFoldersComboElem.set(defaults);
                inFilesComboElem.set(defaults);
            }, // setElements close

            onLoad: function () {
                // event bind, dojo element
                var id = reg.byId('sfDojoFormBrowse');
                dojo.connect(id, 'onClick', this.onBrowse);

                // init elements
                this.initElements();

                // restore previous value in this dialog's elements
                this.restoreElementValues();
                if (rootPath) {
                    folderComboElem.set('value', rootPath);
                }

                // setting default value in this dialog's elements
                this.setElements();
            } // onLoad close
        });

        aspect.after(handleFileInFilesDlg, '_endDrag', function () {
            var tooltipHandle = function (elem, state) {
                if (!elem.isValid(elem.focused)) {
                    // show new error tooltip
                    var errorMessage = elem.getErrorMessage();
                    if (!!errorMessage &&
                        !!state &&
                        !!elem.focusNode.getAttribute('aria-invalid')) {
                        elem.displayMessage(errorMessage);
                    }
                }
            };

            // currently opend tooltip clear
            var pTooltipState = patternComboElem.isTooltipShow;
            var fTooltipState = folderComboElem.isTooltipShow;

            patternComboElem.displayMessage('');
            folderComboElem.displayMessage('');

            // patternCombo tooltip handle
            tooltipHandle(patternComboElem, pTooltipState);

            // folderCombo tooltip handle
            tooltipHandle(folderComboElem, fTooltipState);
        });

        handleFileInFilesDlg.set('doLayout', false);
        //handleFileInFilesDlg.set('content', sFilesForm);
        handleFileInFilesDlg.setContentArea(sFilesForm);
        handleFileInFilesDlg.show();

        patternComboElem.focusNode.select();

    } // handleFindInFiles

    //
    // handlers for file commands
    //

    function handleEdit() {
        var paths = wv.getSelectedPaths();
        if (paths && paths.length > 0) {
            paths.forEach(function (path) {
                topic.publish('#REQUEST.openFile', path);
            });
        }
    }

    function handleOpen() {
        var paths = wv.getSelectedPaths();
        if (paths && paths.length > 0) {
            if (pathUtil.isDirPath(paths[0])) {
                paths.forEach(function (path) {
                    if (!pathUtil.isDirPath(path)) {
                        console.error('assertion fail: "' + path + '" must be a directory');
                    } else {
                        if (wv.isExpandedNode(path)) {
                            wv.collapseNode(path);
                        } else {
                            wv.expandNode(path);
                        }
                    }
                });
            } else {
                paths.forEach(function (path) {
                    if (pathUtil.isDirPath(path)) {
                        console.error('assertion fail: "' + path + '" must be a file');
                    } else {
                        topic.publish('#REQUEST.openFile', path);
                    }
                });
            }
        }
    }

    function handleDelete() {
        wv.removeInteractively();
    }

    function handleDuplicate() {
        var path = wv.getSelectedPath();
        if (path) {
            wv.duplicateNode(path);
        }
    }

    function handleDownloadZip() {
        var paths = wv.getSelectedPaths();
        if (paths && paths.length > 0) {
            paths = paths.map(function (p) { return pathUtil.detachSlash(p); });

            var exportName;
            if (paths.length > 1) {
                //exportName = paths[0].getParentNode().name + '.zip';
                exportName = pathUtil.getName(pathUtil.getParentPath(paths[0])) + '.zip';
            } else {
                exportName = pathUtil.getName(paths[0]) + '.zip';
            }
            exportName = encodeURI(exportName); // match decodeURI at Node constructor for server
            fsMount.exportZip(paths, exportName);
        }
    }

    var gotoFileData = {
        lastDir : ide.getPath() + '/'
    };

    function gotoFileInCurDir() {
        var selected = wv.getSelectedPaths();
        if (selected.length === 1) {
            gotoFileData.lastDir = selected[0];
            handleGotoFile();
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }

    function handleGotoFile() {
        var gotoFileDlg = new ButtonedDialog({
            buttons: [
                {
                    caption: 'Go',
                    methodOnClick: 'goToFile'
                },
                {
                    caption: 'Cancel',
                    methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'goToFile',

            goToFile: function () {
                var gotoFileInput = reg.byId('FsCommandFileToGoInput');
                var text = gotoFileInput.value;
                var bExist = this.inputStore.query({ id: text }).length === 1 ? true : false;

                if (bExist) {
                    topic.publish('#REQUEST.openFile', text);
                    this.hide();
                } else {
                    toastr.error(text + ': No such file.');
                }
            },

            title: 'Go to File',
            refocus: false,
            autofocus: false,
            inputStore : new Memory({
                removeAll: function () {
                    this.data = null;
                }
            }),
            inputStoreDataCache : {},

            dataLoad: function () {
                // input filed store's data update
                var _self = this;
                var gotoFileInput = reg.byId('FsCommandFileToGoInput');
                var targetDir = gotoFileData.lastDir;
                var cbResolve = function () {
                    $('#gotoFileLoadingPane').fadeOut();
                    gotoFileInput.set('disabled', false);
                    gotoFileInput.focus();

                    Tooltip.hide(gotoFileInput.domNode);
                    gotoFileInput.isTooltipShow = false;
                };

                if (!!_self.inputStore && !!_self.inputStore.data) {
                    _self.inputStore.removeAll();
                }

                var cacheData = _self.inputStoreDataCache[targetDir];
                if (!!cacheData) {
                    _self.inputStore.setData(cacheData);
                    cbResolve();
                    return;
                }

                var asyncProcess = function () {
                    //console.log('async called...!');
                    var deferred = new Deferred();
                    var loadingWorker;

                    if (typeof(Worker)) {
                        // create worker
                        loadingWorker = new Worker(require.toUrl('webida-lib/plugins/fs-commands/goToFileWorker.js'));

                        // recive
                        loadingWorker.onmessage = function (event) {
                            if (event && event.data) {
                                var data = event.data;

                                if (data.type === 'log') {
                                    // data is log then don't close worker
                                    console.log(data.message);
                                    return;
                                } else if (data.msg === 'progress') {
                                    deferred.progress(data.list);
                                    return;
                                } else if (data.msg === 'success') {
                                    var list = JSON.parse(data.list);
                                    _self.inputStoreDataCache[targetDir] = list;
                                    _self.inputStore.setData(list);
                                    deferred.resolve();
                                }
                            } else {
                                deferred.reject();
                            }

                            loadingWorker.terminate();
                        };

                        // async method call and worker start
                        fsMount.list(targetDir, true, function (err, result) {
                            if (err) {
                                deferred.reject(err);
                            } else {
                                if (result.length < 1) {
                                    // don't have file
                                    console.error();
                                } else {
                                    // send, start worker
                                    var data = {
                                        msg: 'start',
                                        targetDir: targetDir,
                                        files: JSON.stringify(result)
                                    };
                                    loadingWorker.postMessage(data);
                                }
                            }
                        });
                    } else {
                        // worker not support
                        fsMount.list(targetDir, true, function (err, result) {
                            function getFileList(basePath, fileObj) {
                                // param check
                                if (!basePath || !fileObj) {
                                    return null;
                                }

                                var list = [];
                                var path = basePath + fileObj.name;
                                if (fileObj.isFile) {
                                    // file, ex) /webida/directory/filename.txt
                                    list.push({ value: path });
                                } else if (fileObj.isDirectory &&
                                           fileObj.children &&
                                           fileObj.children.length > 0
                                          ) {
                                    // Directory
                                    _.each(fileObj.children, function (childFileObj) {
                                        var subList = getFileList(path + '/', childFileObj);
                                        list = _.union(list, subList);
                                    });
                                }

                                return list;
                            }

                            if (err) {
                                console.error(err);
                                deferred.reject(err);
                            } else {
                                console.log(result);
                                if (result.length > 0) {
                                    var list = [];
                                    _.each(result, function (childFileObj) {
                                        var subList = getFileList(targetDir, childFileObj);
                                        list = _.union(list, subList);
                                    });

                                    _self.inputStore.setData(_.uniq(list));
                                    deferred.resolve();
                                }
                            }
                        });
                    }

                    return deferred.promise;
                };
                var process = asyncProcess();

                // async controll, then(callback, errback, progback)
                process.then(cbResolve, function () {
                    //console.log('deffer error...', err);
                    $('#gotoFileLoadingLabel').text('Loading error...').css('color', 'red');
                    $('#gotoFileLoadingSpinner').fadeOut();
                }, function (progress) {
                    //console.log('deffer progress...', progress);
                    $('#gotoFileLoadingLabel').text('Loading ' + progress);
                });
            },

            /*
            onCancel: function (event) {
                /
                var gotoFileInput = reg.byId('FsCommandFileToGoInput');
                gotoFileInput.closeDropDown();

                gotoFileDlg.inputStore.removeAll();
                gotoFileDlg.inputStore = null;
                gotoFileDlg.hide();
                workbench.focusLastWidget();
            },
             */
            onHide: function () {
                var gotoFileInput = reg.byId('FsCommandFileToGoInput');
                gotoFileInput.closeDropDown();
                gotoFileInput.displayMessage('');

                gotoFileDlg.inputStore.removeAll();
                gotoFileDlg.inputStore = null;
                gotoFileDlg.destroyRecursive();
                workbench.focusLastWidget();
            },

            onBrowse : function () {
                var _self = this;
                var rootPath = wv.getRootPath();

                var dlg = new FileDialog({
                    mount : fsMount,
                    root: rootPath,
                    initialSelection: [gotoFileData.lastDir],
                    title: 'Select a target directory',
                    singular: true,
                    dirOnly: true
                });
                dlg.open(function (selected) {
                    if (!!selected && _.isArray(selected) && selected.length > 0) {
                        var str = selected[0];
                        if (!!str && str.length > 0) {
                            str += (str.charAt(str.length - 1) !== '/' ? '/' : '');
                            gotoFileData.lastDir = str;
                            _self.reLoad();
                        }
                    }
                });
            }, // onBrowse

            reLoad: function () {
                $('#gotoFileLoadingPane').fadeIn();

                var gotoFileInput = reg.byId('FsCommandFileToGoInput');
                gotoFileInput.set('disabled', true);

                var target = reg.byId('gotoFileTargetInputBox');
                target.setValue(gotoFileData.lastDir);

                this.dataLoad();
            },

            onLoad: function () {
                var _self = this;
                var gotoFileInput = reg.byId('FsCommandFileToGoInput');
                var target = reg.byId('gotoFileTargetInputBox');
                target.setValue(gotoFileData.lastDir);

                // input filed data set
                var placeHolder = 'Enter a substring of the file path.';
                gotoFileInput.set({
                    placeHolder: placeHolder,
                    store: _self.inputStore,
                    searchAttr: 'id',
                    queryExpr: '*${0}*',
                    autoComplete: false,
                    trim: true,
                    disabled: true,
                    searchDelay: 500,
                    maxHeight: 300,
                    forceWidth : true,
                });

                gotoFileInput.displayMessage = function (/*String*/message) {
                    // summary:
                    //    Overridable method to display validation errors/hints.
                    //    By default uses a tooltip.
                    // tags:
                    //    extension
                    if (message && gotoFileInput.focused) {
                        Tooltip.show(message,
                                     gotoFileInput.domNode,
                                     gotoFileInput.tooltipPosition,
                                     !gotoFileInput.isLeftToRight());
                        gotoFileInput.isTooltipShow = true;
                    } else {
                        Tooltip.hide(gotoFileInput.domNode);
                        gotoFileInput.isTooltipShow = false;
                    }
                };

                // event bind, browse button
                var browseBt = reg.byId('gotoFileTargetBrowseBt');
                dojo.connect(browseBt, 'onClick', dojo.hitch(_self, _self.onBrowse));
            } // onLoad

        });

        aspect.after(gotoFileDlg, 'onLoad', dojo.hitch(gotoFileDlg, gotoFileDlg.dataLoad));
        aspect.after(gotoFileDlg, '_endDrag', function () {
            // currently opend tooltip clear
            var gotoFileInput = reg.byId('FsCommandFileToGoInput');
            var tooltipState = gotoFileInput.isTooltipShow;
            gotoFileInput.displayMessage('');

            if (!gotoFileInput.isValid(gotoFileInput.focused)) {
                // show new error tooltip
                var errorMessage = gotoFileInput.getErrorMessage();
                if (!!errorMessage &&
                    !!tooltipState &&
                    !!gotoFileInput.focusNode.getAttribute('aria-invalid')) {
                    gotoFileInput.displayMessage(errorMessage);
                }
            }
        });

        //gotoFileDlg.set('content', goToFileForm);
        gotoFileDlg.setContentArea(goToFileForm);
        gotoFileDlg.show();
    }

    function handleFileProperties(paths, selectedNode) {
        require(['webida-lib/plugins/fs-commands/fs-commands-prop'], function (FileProp) {
            var fileProp = new FileProp();
            fileProp.execute(paths, selectedNode);
        });
    } /* handleFileProperties close */

    var module = {
        handleCopy: handleCopy,
        handleCut: handleCut,
        handleDelete: handleDelete,
        handleDownloadZip: handleDownloadZip,
        handleDuplicate: handleDuplicate,
        handleFindInFiles: handleFindInFiles,
        findInCurDir: findInCurDir,
        handleEdit: handleEdit,
        handleOpen: handleOpen,
        handleNewFile: handleNewFile,
        handleNewFolder: handleNewFolder,
        handlePaste: handlePaste,
        handleRefresh: handleRefresh,
        handleRename: handleRename,

        gotoFileInCurDir: gotoFileInCurDir,
        handleGotoFile: handleGotoFile,
        handleFileProperties: handleFileProperties
    };

    return module;
});
