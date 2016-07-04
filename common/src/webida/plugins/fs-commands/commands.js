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
 * @file Manage actions for file handling commands
 * @since 1.6.0
 * @author minsung.jin@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/form/ComboBox',
    'dijit/registry',
    'dijit/Tooltip',
    'dojo/aspect',
    'dojo/Deferred',
    'dojo/i18n!./nls/resource',
    'dojo/string',
    'dojo/store/Memory',
    'dojo/topic',
    'text!./layer/goToFile.html',
    'text!./layer/searchFilesForm.html',
    'webida-lib/app',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/editors/ExtensionManager',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/arrays/BubblingArray',
    'webida-lib/util/genetic',
    'webida-lib/util/locale',
    'webida-lib/util/notify',
    'webida-lib/util/path',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States'
], function (
    _,
    Button,
    CheckBox,
    ComboBox,
    reg,
    Tooltip,
    aspect,
    Deferred,
    i18n,
    string,
    Memory,
    topic,
    goToFileForm,
    sFilesForm,
    ide,
    commandSystem,
    ExtensionManager,
    workbench,
    wv,
    BubblingArray,
    genetic,
    locale,
    notify,
    pathUtil,
    ButtonedDialog,
    FileDialog
) {
    'use strict';

    var Command = commandSystem.Command;

    var fsMount = ide.getFSCache();

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

    var gotoFileData = {
        lastDir: ide.getPath() + '/'
    };

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
                { caption: i18n.find, methodOnClick: 'onOkay' },
                { caption: i18n.cancel, methodOnClick: 'hide' }
            ],
            methodOnEnter: 'onOkay',
            style: 'width:500px;',
            title: i18n.findInFiles,

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
                    notify.warning(i18n.enterPatternToFind);
                } else if (!path) {
                    notify.warning(i18n.enterDirToSearch);
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

                    var jobId = workbench.addJob(i18n.findInFiles + ' : ' +
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
                            notify.error(i18n.searchFilesFailure);
                            console.log('Failed to search files (' + err + ')');
                        } else {
                            topic.publish('#REQUEST.log',
                                  string.substitute(i18n.resultOfFindingPattern,
                                            { pattern: encloser + origPattern + encloser, path: path }));
                            console.log('hina: result.length = ' + results.length);
                            if (results.length > 0) {
                                results.forEach(function (file) {
                                    var fileName = file.filename;

                                    // The following if paragraph is temporary.
                                    // TODO: remove the following when server is done.
                                    if (fileName.indexOf('/') !== 0) {
                                        fileName = '/' + fileName;
                                    }
                                    //console.log('hina: i = ' + i);
                                    topic.publish('#REQUEST.log', '\n' + i18n.matchedFile + ': ' + fileName);

                                    file.match.forEach(function (line) {
                                        //console.log('hina: j = ' + j);
                                        var lineNumber = line.line;
                                        var text = '\t- ' + i18n.atLine + ' ' + lineNumber + ': "' + line.text + '"';
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
                    title: i18n.selectDirectory,
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
                var defaults = {
                    searchAttr: 'name',
                    missingMessage: i18n.valueRequired,
                    ignoreCase: true,
                    autoComplete: false,
                    queryExpr: '*${0}*',
                    style: 'width: 300px'
                };
                // pattern of keywords to find
                patternComboElem = new ComboBox(defaults, 'sfDojoComboBoxPatternToFind');

                asRegExBtElem = new CheckBox({}, 'sfDojoCheckBoxRegEx');
                ignorCaseBtElem = new CheckBox({}, 'sfDojoCheckBoxIgnoreCase');
                wholewordBtElem = new CheckBox({}, 'sfDojoCheckBoxWholeWords');

                // search target directory
                folderComboElem = new ComboBox(defaults, 'sfDojoComboBoxRecentFolders');
                folderComboElem.set('style', 'width: 238px');
                // additional find options
                exFoldersComboElem = new ComboBox(defaults, 'sfDojoComboBoxFoldersToExclude');
                exFoldersAsRegExBtElem = new CheckBox({}, 'sfDojoCheckBoxExcludeRegEx');
                inFilesComboElem = new ComboBox(defaults, 'sfDojoComboBoxFilesToInclude');
                inFilesAsRegExBtElem = new CheckBox({}, 'sfDojoCheckBoxFilesRegEx');
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
                var required = {
                    required: true,
                    missingMessage: i18n.valueRequired
                };

                patternComboElem.set(required);
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

            }, // setElements close

            onLoad: function () {
                // event bind, dojo element
                var button = new Button({}, 'sfDojoFormBrowse');
                dojo.connect(button, 'onClick', this.onBrowse);

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

        handleFileInFilesDlg.setContentArea(sFilesForm);

        locale.convertMessage(i18n, 'data-message');
        handleFileInFilesDlg.show();

        patternComboElem.focusNode.select();

    } // handleFindInFiles

    function findInCurDir() {
        var selected = wv.getSelectedPaths();
        if (selected.length === 1) {
            handleFindInFiles(selected[0]);
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }

    function handleGotoFile() {
        var gotoFileDlg = new ButtonedDialog({
            buttons: [
                {
                    caption: i18n.go,
                    methodOnClick: 'goToFile'
                },
                {
                    caption: i18n.cancel,
                    methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'goToFile',

            goToFile: function () {
                var gotoFileInput = reg.byId('FsCommandFileToGoInput');
                var text = gotoFileInput.value;
                var bExist = this.inputStore.query({ id: text }).length === 1;

                if (bExist) {
                    topic.publish('editor/open', text);
                    this.hide();
                } else {
                    if (text === '') {
                        notify.error(i18n.noSuchFile);
                    } else {
                        notify.error(
                            string.substitute(i18n.noSuchFileAs, {filename: text}));
                    }
                }
            },

            title: i18n.goToFile,
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

                        // receive
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
                    $('#gotoFileLoadingLabel').text(i18n.loadingError).css('color', 'red');
                    $('#gotoFileLoadingSpinner').fadeOut();
                }, function (progress) {
                    //console.log('deffer progress...', progress);
                    $('#gotoFileLoadingLabel').text(string.substitute(i18n.loadingProgress, {progress: progress}));
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
            }, */
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
                    title: i18n.selectTargetDir,
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
                var placeHolder = i18n.enterSubstringOfFilePath;
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
            // currently opened tooltip clear
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
        locale.convertMessage(i18n, 'data-message');
        gotoFileDlg.show();
    } // handleGotoFile

    function getOpenWithParts() {
        var paths = wv.getSelectedPaths();
        var i = 0;
        var ext;

        // processing for open with
        var openWithEditorNames = [];
        var openWithParts = [];
        if (paths && paths.length > 0 && paths.every(function (n) {
            return !pathUtil.isDirPath(n);
        })) {
            var availableExtensions =
                ExtensionManager.getInstance().getExtensionsForType(pathUtil.getFileExt(paths[0]));
            for (i = 0; i < paths.length; i++) {
                if (i > 0) {
                    if (availableExtensions) {
                        var availableExtensions2 =
                            ExtensionManager.getInstance().getExtensionsForType(pathUtil.getFileExt(paths[i]));
                        if (availableExtensions2) {
                            availableExtensions = _.intersection(availableExtensions, availableExtensions2);
                        } else {
                            availableExtensions = null;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (availableExtensions) {
                for (i = 0; i < availableExtensions.length; i++) {
                    ext = availableExtensions[i];
                    openWithEditorNames.push(ext.name);
                    openWithParts.push(ext.__plugin__.loc + '/' + ext.editorPart);
                }
            }
        }
        return openWithParts;
    } // handleOpenWith

    function RefreshCommand(id) {
        RefreshCommand.id = id;
    }
    genetic.inherits(RefreshCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var path = wv.getSelectedPath();
                if (path) {
                    wv.refreshRecursively(path, true);
                }
                resolve();
            });
        }
    });

    function OpenFileCommand(id) {
        OpenFileCommand.id = id;
    }
    genetic.inherits(OpenFileCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var paths = wv.getSelectedPath();
                if (paths && paths.length > 0) {
                    paths.forEach(function (path) {
                        topic.publish('editor/open', path);
                    });
                }
                resolve();
            });
        }
    });

    function NewFileCommand(id) {
        NewFileCommand.id = id;
    }
    genetic.inherits(NewFileCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var path = wv.getSelectedPath();
                if (path) {
                    wv.createNodeInteractively(path, 'file');
                }
                resolve();
            });
        }
    });

    function NewDirectoryCommand(id) {
        NewDirectoryCommand.id = id;
    }
    genetic.inherits(NewDirectoryCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var path = wv.getSelectedPath();
                if (path) {
                    wv.createNodeInteractively(path, 'directory');
                }
                resolve();
            });
        }
    });

    function DuplicateCommand(id) {
        DuplicateCommand.id = id;
    }
    genetic.inherits(DuplicateCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var path = wv.getSelectedPath();
                if (path) {
                    wv.duplicateNode(path);
                }
                resolve();
            });
        }
    });

    function RenameCommand(id) {
        RenameCommand.id = id;
    }
    genetic.inherits(RenameCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var path = wv.getSelectedPath();
                if (path) {
                    wv.renameNodeInteractively(path);
                }
                resolve();
            });
        }
    });

    function UploadFilesCommand(id) {
        UploadFilesCommand.id = id;
    }
    genetic.inherits(UploadFilesCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                resolve();
            });
        }
    });

    function DownloadFilesCommand(id) {
        DownloadFilesCommand.id = id;
    }
    genetic.inherits(DownloadFilesCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
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
                resolve();
            });
        }
    });

    function FindInFilesCommand(id) {
        FindInFilesCommand.id = id;
    }
    genetic.inherits(FindInFilesCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                findInCurDir();
                resolve();
            });
        }
    });

    function GoToFileCommand(id) {
        GoToFileCommand.id = id;
    }
    genetic.inherits(GoToFileCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var selected = wv.getSelectedPaths();
                if (selected.length === 1) {
                    gotoFileData.lastDir = selected[0];
                    handleGotoFile();
                } else {
                    throw new Error('assertion fail: unreachable');
                }
                resolve();
            });
        }
    });

    function PropertiesCommand(id) {
        PropertiesCommand.id = id;
    }
    genetic.inherits(PropertiesCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                resolve();
            });
        }
    });

    function OpenCommand(id) {
        OpenCommand.id = id;
    }
    genetic.inherits(OpenCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
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
                                topic.publish('editor/open', path);
                            }
                        });
                    }
                }
                resolve();
            });
        }
    });

    function OpenWithEditorCommand(id, option) {
        OpenWithEditorCommand.id = id;
        OpenWithEditorCommand.option = option;
    }
    genetic.inherits(OpenWithEditorCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var paths = wv.getSelectedPaths();
                if (paths && paths.length > 0) {
                    if (!pathUtil.isDirPath(paths[0])) {
                        paths.forEach(function (path) {
                            if (pathUtil.isDirPath(path)) {
                                console.error('assertion fail: "' + path + '" must be a file');
                            } else {
                                var editorParts = getOpenWithParts();
                                var options = {openWithPart: editorParts[OpenWithEditorCommand.option]};
                                topic.publish('editor/open', path, options);
                            }
                        });
                    }
                }
                resolve();
            });
        }
    });

    function CopyCommand(id) {
        CopyCommand.id = id;
    }
    genetic.inherits(CopyCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                wv.copySelected();
                resolve();
            });
        }
    });

    function CutCommand(id) {
        CutCommand.id = id;
    }
    genetic.inherits(CutCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                wv.cutSelected();
                resolve();
            });
        }
    });

    function PasteCommand(id) {
        PasteCommand.id = id;
    }
    genetic.inherits(PasteCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                wv.pasteToSelected();
                resolve();
            });
        }
    });

    function DeleteFileCommand(id) {
        DeleteFileCommand.id = id;
    }
    genetic.inherits(DeleteFileCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                wv.removeInteractively();
                resolve();
            });
        }
    });

    return {
        RefreshCommand: RefreshCommand,
        OpenFileCommand: OpenFileCommand,
        NewFileCommand: NewFileCommand,
        NewDirectoryCommand: NewDirectoryCommand,
        DuplicateCommand: DuplicateCommand,
        RenameCommand: RenameCommand,
        UploadFilesCommand: UploadFilesCommand,
        DownloadFilesCommand: DownloadFilesCommand,
        FindInFilesCommand: FindInFilesCommand,
        GoToFileCommand: GoToFileCommand,
        PropertiesCommand: PropertiesCommand,
        OpenCommand: OpenCommand,
        OpenWithEditorCommand: OpenWithEditorCommand,
        CopyCommand: CopyCommand,
        CutCommand: CutCommand,
        PasteCommand: PasteCommand,
        DeleteFileCommand: DeleteFileCommand
    };
});
