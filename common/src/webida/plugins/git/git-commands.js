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
 * webida - git handle plugin
 *
 */
/* jshint ignore:start */
define(['require',
    'external/lodash/lodash.min',
    'webida-lib/webida-0.3',
    'webida-lib/app',
    'webida-lib/util/path',
    'webida-lib/plugins/workspace/plugin',
    './git-core',
    './gitview-log',
    'external/async/dist/async.min',
    './git-icon',
    './lib/github',
    './lib/jsdifflib/diffview',
    './lib/jsdifflib/difflib',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/arrays/BubblingArray',
    'webida-lib/util/notify',
    'popup-dialog',
    'dijit/registry',
    'dojo/i18n!./nls/resource',
    'dojo/string',
    'dojo/store/Memory',
    'dojo/data/ObjectStore',
    'dojo/store/Observable',
    'dijit/tree/ObjectStoreModel',
    'dojo/data/ItemFileWriteStore',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog', // ButtonedDialog
    'dijit/Tree',
    'dojox/grid/DataGrid',
    'dojox/grid/EnhancedGrid',
    'dijit/Menu',
    'dijit/MenuItem',
    'dojox/grid/enhanced/plugins/IndirectSelection',
    'dojox/grid/enhanced/plugins/Pagination',
    'dojox/grid/enhanced/plugins/Search',
    'dijit/form/RadioButton',
    'dijit/form/Select',
    'dijit/form/ComboBox',
    'dijit/form/ComboButton',
    'dijit/DropDownMenu',
    'dijit/form/CheckBox',
    'dijit/form/SimpleTextarea',
], function (
    require,
    _,
    webida,
    ide,
    pathUtil,
    wv,
    git,
    gitviewlog,
    async,
    gitIcon,
    Github,
    diffview,
    difflib,
    workbench,
    BubblingArray,
    notify,
    PopupDialog,
    registry,
    i18n,
    string,
    Memory,
    ObjectStore,
    Observable,
    ObjectStoreModel,
    ItemFileWriteStore,
    ButtonedDialog,
    Tree,
    DataGrid,
    EnhancedGrid
) {

    'use strict';

    var fsCache = ide.getFSCache();   // ide.getMount();
    var globalStatus = ide.registerStatusContributorAndGetLastStatus('git-commands', function () {
        return globalStatus;
    }) || {
        pushHistory: { }
    };
    Object.keys(globalStatus).forEach(function (kind) {
        switch (kind) {
            case 'pushHistory':
                Object.keys(globalStatus.pushHistory).forEach(function (repoPath) {
                    var history = globalStatus.pushHistory[repoPath];
                    history.repos = new BubblingArray().importFromPlainArray(history.repos);
                    history.dests = new BubblingArray().importFromPlainArray(history.dests);
                });
                break;
            default:
                throw new Error('assertion fail: unreachable');

        }
    });

    var HELP_KEY_SETTING = 'Verify your \'Public SSH Key\' setting in Development Center.';
    var COMMIT_TEMPLATE_PATH = '/.userinfo/.gitmessage';

    // css load routine
    function _loadCss(url) {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    // Auto detecting mode
    function _looksLikeScheme(code) {
        return !/^\s*\(\s*function\b/.test(code) && /^\s*[;\(]/.test(code);
    }

    /*
    * - load the specified css stylesheet.
    * - check git user.name, user.email infomation,
    * - then if git infomation is not setting, set the user.name, user.email.
    */
    function _init() {
        // loading css stylesheet, using diff mode
        _loadCss(require.toUrl('./lib/jsdifflib/diffview.css'));

        var auth = webida.auth;
        var username = null;
        var useremail = null;
        var COMMIT_FORMAT = '[BUGFIX|FEATURE|TASK] \n[DESC.] ';

        // if user.name and user.email is not set, set the user information
        async.waterfall([
            function (next) {
                auth.getMyInfo(function (err, data) {
                    if (err) {
                        next(err);
                    } else {

                        useremail = data.email;
                        var m = useremail.match(/(.*)@(.*)/);
                        if (m) {
                            username = m[1];
                        }

                        next();
                    }
                });
            },
            function (next) {
                git.exec('', ['config', '-l'], function (err, data) {
                    if (err) {
                        next(err);
                    } else {
                        var userinfo = git.parseConfig(data);
                        next(null, userinfo);
                    }
                });
            },
            function (userinfo, next) {
                if (userinfo.name === undefined) {
                    git.exec('', ['config', '--global', 'user.name', username], function (err, data) {
                        if (err) {
                            next('config --global user.name setting: ' + err);
                        } else {
                            next(null, userinfo);
                        }
                    });
                } else {
                    next(null, userinfo);
                }
            },
            function (userinfo, next) {
                if (userinfo.email === undefined) {
                    git.exec('', ['config', '--global', 'user.email', useremail], function (err, data) {
                        if (err) {
                            next('config --global user.email setting: ' + err);
                        } else {
                            next();
                        }
                    });
                } else {
                    next();
                }
            },
            function (next) {
                git.exec('', ['config', '--global', 'core.quotepath', 'false'], function (err, data) {
                    if (err) {
                        next('config --global core.quotepath setting ' + err);
                    } else {
                        next();
                    }
                });
            },
            function (next) {
                fsCache.exists(COMMIT_TEMPLATE_PATH, function (err, exist) {
                    if (err) {
                        next('exists: ' + err);
                    } else {
                        if (!exist) {
                            fsCache.writeFile(COMMIT_TEMPLATE_PATH, COMMIT_FORMAT, function (err) {
                                if (err) {
                                    next('writeFile: ' + err);
                                } else {
                                    next();
                                }
                            });
                        } else {
                            next();
                        }
                    }
                });
            }
        ], function (err) {
            if (err) {
                if (err.reason === 'Require login') {
                    gitviewlog.error('', '', 'Require login');
                } else {
                    gitviewlog.error('Failed to initilize Git plug-in');
                    console.log('ERROR - ' + err);
                }
            }
        });
    }

    // do initilize
    _init();

    // make a gerrit change-id
    function _makeChangeId() {
        var arr = 'a,b,c,d,e,f,0,1,2,3,4,5,6,7,8,9'.split(',');
        var rnd = '';
        for (var i = 0; i < 40; i++) {
            rnd += arr[Math.floor(Math.random() * arr.length)];
        }

        return rnd;
    }

    // refresh the specified node in workspace
    function refresh(path, mayConvertUntrackedToTracked) {
        fsCache.refresh(path, { level: -1 }, function () {
            gitIcon.refreshGitIconsInRepoOf(path, mayConvertUntrackedToTracked);
        });
    }

    function currentBranch(path, elementId) {
        git.exec(path, ['branch', '-l'], function (err, branchResult) {
            if (err) {
                gitviewlog.error(path, 'branch', err);
            } else {
                var branch = git.parseBranch(branchResult);
                var curBranch = '';

                for (var i in branch) {
                    if (branch.hasOwnProperty(i)) {
                        if (branch[i].current) {
                            curBranch = branch[i].name;
                        }
                    }
                }

                $(elementId).text(curBranch);
            }
        });
    }

    function _selectedGitInfo(path) {
        var statusbar = $('.gv-toolbar-statusbar .gv-selectedpath');
        var gitroot = git.findGitRootPath(path);

        if (gitroot) {
            var GIT_DIR = gitroot.substr(1);

            git.exec(GIT_DIR, ['branch', '--no-color', '-l'], function (err, data) {
                if (!err) {
                    var branch = git.parseBranch(data);
                    var curBranch = '';

                    for (var i in branch) {
                        if (branch.hasOwnProperty(i)) {
                            if (branch[i].current) {
                                curBranch = branch[i].name;
                            }
                        }
                    }

                    var msg = 'Selected Git project: ' + GIT_DIR + ' [' + curBranch + ']';
                    statusbar.text(msg);
                }
            });
        } else {
            statusbar.text('Selected Git project: none');
        }
    }

    //
    // Git Commands
    //

    function _stash(gitRootPath) {
        require(['text!./layer/stash.html'], function (stashView) {

            var stashButton, stashMsgInput, stashCheckBox;
            function stashEvent(path) {
                var stashArgs = [];
                var msg = stashMsgInput.get('value').trim();

                if (stashCheckBox.checked) {
                    stashArgs.push('--keep-index');
                }

                stashArgs.push(msg);

                git.exec(path, ['stash', 'save'].concat(stashArgs), function (err, stdout, stderr) {
                    if (err) {
                        gitviewlog.error(path, 'stash', err);
                        notify.error(i18n.forMoreDetails, i18n.gitStashError);
                    } else {
                        var data = stdout + stderr;
                        if (data.match(/(fatal|error): .*/)) {
                            gitviewlog.error(path, 'stash', data);
                            notify.error(i18n.forMoreDetails, i18n.gitStashError);
                        } else {
                            if (data.match('No local changes to save')) {
                                notify.info(i18n.noLocalChangesToSave, i18n.gitStashInfo);
                                gitviewlog.info(path, 'stash', data);
                            } else {
                                notify.success('', i18n.gitStashSuccess);
                                gitviewlog.success(path, 'stash', data);
                                refresh(gitRootPath, true);
                            }
                        }
                    }
                });
            }
            var GIT_DIR = gitRootPath;
            var stashDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitStashBtn',
                        caption: i18n.apply,
                        methodOnClick: 'gitStash',
                        disabledOnShow: true
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'gitStash',
                gitStash: function () {
                    if (stashButton.disabled) {
                        return;
                    }

                    stashEvent(GIT_DIR);
                    stashDialog.hide();
                },

                title: i18n.stashChanges,
                onHide: function (evt) {
                    stashDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            stashDialog.setContentArea(stashView);
            stashMsgInput = registry.byId('GitStashMsgInput');
            stashCheckBox = registry.byId('GitStashKeepCheckbox');
            stashButton = registry.byId('GitStashBtn');

            currentBranch(GIT_DIR, '#GitStashBranchInfo');
            stashDialog.show();

            dojo.connect(stashMsgInput, 'onKeyUp', function (event) {
                var inputValue = stashMsgInput.get('value');
                if (inputValue === '') {
                    stashButton.set({
                        disabled: true
                    });
                } else {
                    stashButton.set({
                        disabled: false
                    });
                }
            });
        });
    }

    function _unstash(gitRootPath) {
        require(['text!./layer/unstash.html'], function (unstashView) {
            var unstashDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitUnStashApplyBtn',
                        caption: i18n.apply,
                        methodOnClick: 'gitUnstash',
                        disabledOnShow: true
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'gitUnstash',
                gitUnstash: function () {
                    if (applyButton.disabled) {
                        return;
                    }

                    if (branchCheckbox.get('checked') && !branchInput.get('value')) {
                        notify.error(i18n.enterANewBranchName);
                        return;
                    }

                    applyEvent(GIT_DIR);
                    unstashDialog.hide();
                },

                title: i18n.unstashChanges,
                onHide: function (evt) {
                    unstashDialog.destroyRecursive();
                }
            });
            unstashDialog.setContentArea(unstashView);
            var keepCheckBox = registry.byId('GitUnStashKeepCheckbox');
            var popCheckbox = registry.byId('GitUnStashPopCheckbox');
            var branchCheckbox = registry.byId('GitUnStashBranchCheckbox');
            var dropButton = registry.byId('GitUnStashDropBtn');
            var clearButton = registry.byId('GitUnStashClearBtn');
            var applyButton = registry.byId('GitUnStashApplyBtn');
            var branchInput = registry.byId('GitUnStashBranchInput');
            var GIT_DIR = gitRootPath;
            var grid = null;

            function dropEvent(path) {
                var item = grid.selection.getSelected();
                var reflog = item[0].reflog;
                var warningMsg = 'Do you want to remove ' + reflog + ' ?';

                PopupDialog.yesno({
                    title: i18n.unstash,
                    message: warningMsg,
                    type: 'info'
                }).then(function () {
                    git.exec(path, ['stash', 'drop', reflog], function (err, stdout, stderr) {
                        if (err) {
                            gitviewlog.error(path, 'unstash', err);
                            notify.error(i18n.forMoreDetails, i18n.gitUnstashDropError);
                        } else {
                            var data = stdout + stderr;
                            if (data.match(/(fatal|error): .*/)) {
                                gitviewlog.error(path, 'unstash', data);
                                notify.error(i18n.forMoreDetails, i18n.gitUnstashDropError);
                            } else {
                                grid.store.deleteItem(item[0]);
                                gitviewlog.success(path, 'unstash', data);
                                notify.success('', i18n.gitStashDropSuccess);
                            }
                        }
                    });
                }, function () {
                    return;
                });
            }

            function clearEvent(path) {
                if (grid.rowCount === 0) {
                    notify.warning(i18n.noStashStatesExist, i18n.gitStashClearWarning);
                    return;
                }

                var warningMsg = 'Do you want to remove all stashed states?';

                PopupDialog.yesno({
                    title: i18n.clearStash,
                    message: warningMsg,
                    type: 'info'
                }).then(function () {
                    git.exec(path, ['stash', 'clear'], function (err, stdout, stderr) {
                        if (err) {
                            gitviewlog.error(path, 'unstash', err);
                            notify.error(i18n.forMoreDetails, i18n.gitUnstashClearError);
                        } else {
                            var data = stdout + stderr;
                            if (data.match(/(fatal|error): .*/)) {
                                gitviewlog.error(path, 'unstash', data);
                                notify.error(i18n.forMoreDetails, i18n.gitUnstashClearError);
                            } else {
                                gitviewlog.success(path, 'unstash', 'Removed all the stashed states');
                                notify.success('', i18n.gitStashClearSuccess);
                                grid.setStore(null);
                                applyButton.set('disabled', true);
                                dropButton.set('disabled', true);
                            }
                        }
                    });
                }, function () {
                    return;
                });
            }

            function applyEvent(path) {
                var branchName = branchInput.get('value');
                var stashArgs = ['stash'];

                if (branchName !== '') {
                    stashArgs.push('branch');
                    stashArgs.push(branchName);
                } else {
                    if (popCheckbox.checked) {
                        stashArgs.push('pop');
                    } else {
                        stashArgs.push('apply');
                    }

                    if (keepCheckBox.checked) {
                        stashArgs.push('--index');
                    }
                }

                var item = grid.selection.getSelected();
                var reflog = item[0].reflog;

                git.exec(path, stashArgs, function (err, stdout, stderr) {
                    if (err) {
                        gitviewlog.error(path, 'unstash', err);
                        notify.error(i18n.forMoreDetails, i18n.gitUnstashError);
                    } else {
                        var data = stdout + stderr;
                        if (data.match(/(fatal|error): .*/)) {
                            gitviewlog.error(path, 'unstash', data);
                            notify.error(i18n.forMoreDetails, i18n.gitUnstashError);
                        } else {
                            gitviewlog.success(path, 'unstash', data);
                            notify.success('', i18n.gitUnstashSuccess);

                            refresh(gitRootPath, true);

                            _selectedGitInfo(gitRootPath);
                        }
                    }
                });
            }

            async.waterfall([
                function (next) {
                    currentBranch(GIT_DIR, '#GitUnStashBranchInfo');
                    next();
                },
                function (next) {
                    git.exec(GIT_DIR, ['stash', 'list', '--no-color', '--format=raw'], function (err, stashResult) {
                        if (err) {
                            next(err);
                        } else {
                            next(null, git.parseStash(stashResult));
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'unstash', err);
                } else {
                    var dataStore = new ObjectStore({
                        objectStore: new Memory({ data: result })
                    });

                    dataStore = new Observable(dataStore);

                    var layout = [[
                        {
                            'name': 'Index',
                            'field': 'reflog',
                            'width': '25%'
                        }, {
                            'name': 'Message',
                            'field': 'reflogMsg',
                            'width': 'auto'
                        }
                    ]];

                    grid = new DataGrid({
                        store: dataStore,
                        structure: layout,
                        noDataMessage: i18n.noDataToDisplay,
                        selectionMode: 'single',
                        onSelectionChanged: function () {
                            var item = this.selection.getSelected();
                            if (item.length) {
                                dropButton.set('disabled', false);
                                applyButton.set('disabled', false);
                            } else {
                                dropButton.set('disabled', true);
                                applyButton.set('disabled', true);
                            }
                        }
                    }, dojo.query('#GitUnStashListGrid')[0]);

                    grid.startup();

                    unstashDialog.show();
                }
            });

            dojo.connect(branchCheckbox, 'onClick', function (event) {
                var val = branchCheckbox.get('checked');
                if (val) {
                    keepCheckBox.set('disabled', true);
                    keepCheckBox.set('checked', false);
                    popCheckbox.set('disabled', true);
                    popCheckbox.set('checked', false);
                    branchInput.set('disabled', false);
                } else {
                    keepCheckBox.set('disabled', false);
                    popCheckbox.set('disabled', false);
                    branchInput.set('disabled', true);
                    branchInput.set('value', '');
                }
            });

            dojo.connect(dropButton, 'onClick', function () {
                dropEvent(GIT_DIR);
            });

            dojo.connect(clearButton, 'onClick', function () {
                clearEvent(GIT_DIR);
            });
        });
    }

    function _revert(gitRootPath) {
        require(['text!./layer/revert.html'], function (revertView) {
            var GIT_DIR = gitRootPath;
            var grid = null;
            function revertEvent(path) {
                var items = grid.selection.getSelected();
                var checklist = [];

                items.forEach(function (item) {
                    checklist.push(item.filename);
                });

                git.exec(path, ['checkout'].concat(checklist), function (err, stdout, stderr) {
                    if (err) {
                        gitviewlog.error(path, 'checkout', err);
                        notify.error(i18n.forMoreDetails, i18n.gitCheckoutError);
                    } else {
                        var data = stdout + stderr;
                        if (data.match(/(fatal|error): .*/)) {
                            gitviewlog.error(path, 'checkout', data);
                            notify.error(i18n.forMoreDetails, i18n.gitCheckoutError);
                        } else {
                            var msg = checklist.join(': checkout\n') + ': checkout';

                            gitviewlog.success(path, 'checkout', msg);
                            notify.success('', i18n.gitCheckoutSuccess);

                            refresh(gitRootPath);
                        }
                    }
                });
            }

            var revertButton;
            var revertDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitRevertBtn',
                        caption: i18n.apply,
                        methodOnClick: 'checkout',
                        disabledOnShow: true
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'checkout',
                checkout: function () {
                    if (revertButton.disabled) {
                        return;
                    }

                    revertEvent(GIT_DIR);
                    revertDialog.hide();
                },

                title: i18n.checkoutFromStage,
                onHide: function (evt) {
                    revertDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            revertDialog.setContentArea(revertView);

            revertButton = registry.byId('GitRevertBtn');
            var searchQuery = registry.byId('GitRevertSearchInput');

            async.waterfall([
                function (next) {
                    git.exec(GIT_DIR, ['status', '-z'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var status = [];
                            var rt = git.parseStatusZ(data);

                            _.forEach(rt, function (elem, key) {
                                status.push({
                                    filename: key,
                                    action: elem,
                                    staged: elem.match(/[MADRC]./) ? true:false
                                });
                            });

                            next(null, status);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'checkout', err);
                } else {
                    var dataStore = new Observable(new Memory({ data: result }));
                    var layout = [[
                        {
                            'name': 'Status',
                            'field': 'action',
                            'width': '15%'
                        }, {
                            'name': 'File',
                            'field': 'filename',
                            'width': 'auto'
                        }
                    ]];

                    grid = new EnhancedGrid({
                        store:  new ObjectStore({ objectStore: dataStore }),
                        query: {
                            staged: false,
                            action: new RegExp(/[A-Z].?/)
                        },
                        structure: layout,
                        noDataMessage: i18n.noDataToDisplay,
                        rowSelector: '20px',
                        canSort: function () {
                            return false;
                        },
                        plugins: {
                            indirectSelection: {
                                headerSelector: true,
                                width: '40px',
                                style: 'text-align: center;'
                            }
                        },
                        onSelectionChanged: function () {
                            var items = this.selection.getSelected();

                            if (items.length && items[0]) {
                                revertButton.set({ disabled: false });
                            } else {
                                revertButton.set({ disabled: true });
                            }
                        },
                        onRowDblClick: function (event) {
                            var idx = event.rowIndex;
                            var rowData = grid.getItem(idx);
                            var filepath = rowData.filename;
                            var status = rowData.action;
                            var infoMsg;

                            if (status === '??') {
                                infoMsg = string.substitute(
                                    i18n.hasBeenNewlyAdded, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else if (status === 'D') {
                                infoMsg = string.substitute(
                                    i18n.hasBeenDeleted, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else {
                                _diff(gitRootPath, filepath);
                            }
                        }
                    }, dojo.query('#GitRevertGrid')[0]);

                    grid.startup();
                    $('.dojoxGridRowSelectorStatusText').text('');
                    revertDialog.show();
                }
            });

            function _filterFile() {
                var query = '*' + searchQuery.get('value') + '*';

                grid.setQuery({
                    filename: query,
                    staged: false,
                    action: new RegExp(/[A-Z].?/)
                }, { ignoreCase: true});
            }

            dojo.connect(searchQuery, 'onKeyUp', function (evt) {
                evt.stopPropagation();

                _filterFile();
            });
        });
    }

    function _history(gitRootPath, relPath) {
        require(['text!./layer/history.html', './lib/md5'], function (historyView) {
            var title;
            if (relPath === '.') {
                title = string.substitute(
                    i18n.showRepositoryHistory, {path: pathUtil.detachSlash(gitRootPath)});
            } else {
                title = string.substitute(
                    i18n.showFileHistory, {rootPath: gitRootPath, relPath: relPath});
            }
            var historyDialog = new ButtonedDialog({
                buttons: [{
                    caption: i18n.close,
                    methodOnClick: 'hide'
                }],
                methodOnEnter: 'hide',

                title: title,
                style: 'overflow:hidden;',
                onHide: function (evt) {
                    historyDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            historyDialog.setContentArea(historyView);

            var historyDiffTab = registry.byId('GitHistoryDiffTab');
            var GIT_DIR = gitRootPath;
            var historyGrid = null;
            var historyInfoGrid = null;
            var historyInfolayout = [
                [
                    {
                        'name': 'Status',
                        'field': 'action',
                        'width': '15%'
                    },
                    {
                        'name': 'File',
                        'field': 'filename',
                        'width': 'auto'
                    }
                ]
            ];

            historyInfoGrid = new EnhancedGrid({
                style: 'width: 100%; height: 100%;',
                noDataMessage: i18n.noDataToDisplay,
                structure: historyInfolayout,
                rowSelector: '20px',
                selectionMode: 'single'
            }, dojo.query('#GitHistoryInfoGrid')[0]);

            historyInfoGrid.startup();

            $('#GitHistoryTabContainer').css({
                width: $(window).width() * 0.7,
                height: $(window).height() * 0.8
            });

            historyDialog.show();

            function commitInfoEvent(path, commitID) {
                git.exec(path, ['log', '--format=raw', '--max-count=1', '--name-status', commitID],
                         function (err, logResult) {
                    if (err) {
                        gitviewlog.error(path, 'history', err);
                    } else {
                        var i, log = git.parseLog(logResult);
                        var parents = '';
                        var files = log[0].files;

                        if (log[0].parents === undefined) {
                            parents = 'none';
                        } else {
                            var length = log[0].parents.length;

                            for (i = 0; i < length; i++) {
                                parents += log[0].parents[i] + ' ';
                            }
                        }

                        var email = log[0].author.match(/<(.*)>$/)[1];
                        var md5 = $.md5(email);
                        var gravatar =
                            '<img style="border:1px solid #000;" src="https://secure.gravatar.com/avatar/' +
                            md5 + '?s=65&d=mm" />';
                        var template =
                            '<div>' +
                            '<div class="githistoryinfocontainer">' +
                            '<div class="githistoryinfo">' +
                            '<div>AUTHOR: ' + log[0].author + '</div>' +
                            '<div>DATE: ' + log[0].committerDate + '</div>' +
                            '<div>SHA: ' + log[0].id + '</div>' +
                            '<div>PARENTS: ' + parents + '</div>' +
                            '</div>' +
                            '<div class="githistorygravatar">' + gravatar + '</div>' +
                            '</div>' +
                            '<pre class="githistorysubject">' + log[0].message + '</pre>';


                        $('#GitHistoryInfo').empty();
                        $('#GitHistoryInfo').append(template);

                        if (files) {
                            files.forEach(function (file) {
                                file.commitId = commitID;
                            });

                            var data = {
                                identifier: 'id',
                                items: []
                            };

                            for (i = 0; i < files.length; i++) {
                                data.items.push(dojo.mixin({
                                    id: i + 1
                                }, files[i]));
                            }

                            var dataSource = new ItemFileWriteStore({
                                data: data
                            });

                            historyInfoGrid.setStore(dataSource);

                        } else {
                            historyInfoGrid.setStore(null);
                        }

                        historyInfoGrid.render();
                    }
                });
            }

            // Show Repository History 명령시
            if (relPath === '.') {
                relPath = '--all';
            }

            async.waterfall([
                function (next) {
                    git.exec(GIT_DIR, ['log', '--format=raw', '--decorate=short', relPath], function (err, logResult) {
                        if (err) {
                            next(err);
                        } else {
                            next(null, git.parseLog(logResult));
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(path, 'history', err);
                } else {
                    var data = {
                        identifier: 'id',
                        items: []
                    };

                    for (var i = 0; i < result.length; i++) {
                        data.items.push(dojo.mixin({
                            id: i + 1
                        }, result[i]));
                    }

                    var dataStore = new ItemFileWriteStore({
                        data: data
                    });

                    var layout = [
                        [
                            {
                                'name': 'Commit-id',
                                'field': 'id',
                                'width': '10%',
                                'formatter': function (data) {
                                    return data.substr(0, 10);
                                }
                            },
                            {
                                'name': 'Message',
                                'field': 'message',
                                'width': '43%',
                                'formatter': function (data) {
                                    var info = data.split('\0');
                                    if (info[1]) {
                                        info[1] = info[1].replace(/[()]/g, '');
                                        var ref = info[1].split(',').map(function (data) {
                                            return '<span class="gitrefinfo">' + data.trim() + '</span>';
                                        }).join('');
                                        return info[0] + ref;
                                    } else {
                                        return info[0];
                                    }
                                }
                            },
                            {
                                'name': 'Author',
                                'field': 'author',
                                'width': '25%'
                            },
                            {
                                'name': 'Date',
                                'field': 'authorDate',
                                'width': '22%'
                            }
                        ]
                    ];

                    historyGrid = new EnhancedGrid({
                        style: 'width: 100%; height: 100%;',
                        store: dataStore,
                        structure: layout,
                        noDataMessage: i18n.noDataToDisplay,
                        rowSelector: '20px',
                        plugins: {
                            pagination: {
                                defaultPageSize: 25,
                                pageSizes: ['25', '50', '100', 'All'],
                                description: true,
                                sizeSwitch: true,
                                pageStepper: true,
                                gotoButton: true,
                                position: 'bottom'
                            }
                        },
                        selectionMode: 'single'
                    }, dojo.query('#GitHistoryGrid')[0]);

                    historyGrid.startup();

                    dojo.connect(historyGrid, 'onRowClick', function (event) {
                        var idx = event.rowIndex;
                        var rowData = historyGrid.getItem(idx);
                        if (rowData) {  // without this check, pressing Enter on a row causes an exception.
                            commitInfoEvent(GIT_DIR, rowData.id[0]);
                        }
                    });
                }
            });

            dojo.connect(historyInfoGrid, 'onRowDblClick', function (event) {
                var idx = event.rowIndex;
                var rowData = historyInfoGrid.getItem(idx);
                var commitId = rowData.commitId[0];
                var filename = rowData.filename[0];

                _diff(gitRootPath, filename, commitId);
            });
        });
    }

    function _clone(selectedPath) {
        require(['text!./layer/clone.html'], function (cloneView) {
            function fetchGitHubURL() {
                var GITHUB_INFO_PATH = '/.userinfo/github.json';
                var MSG = 'You can fetch your repository list from GitHub by setting the GitHub token on ';
                //var visitURL = 'https://dashboard.' + webidaHost + '/#settings';
                var visitURL =  window.location.protocol + '//' + webidaHost + '/pages/main.html#settings';
                async.waterfall([
                    function (next) {
                        fsCache.exists(GITHUB_INFO_PATH, function (err, exist) {
                            if (err) {
                                next(err);
                            } else {
                                if (exist) {
                                    fsCache.readFile(GITHUB_INFO_PATH, function (err, data) {
                                        if (err) {
                                            next(err);
                                        } else {
                                            next(null, JSON.parse(data));
                                        }
                                    });
                                } else {
                                    next('Verify your GitHub setting in Development Center.\n');
                                }
                            }
                        });
                    }
                ], function (err, data) {
                    if (err) {
                        var msg = MSG + visitURL;

                        gitviewlog.info(GIT_DIR, 'clone', msg);
                        notify.info(i18n.forMoreDetails, i18n.gitCloneInfo);
                    } else {
                        var gt = new Github(data.tokenKey);

                        var user = gt.getUser();
                        user.repos(function (err, repos) {
                            if (err) {
                                var msg = MSG + visitURL;

                                gitviewlog.info(GIT_DIR, 'clone', msg);
                                notify.info(i18n.forMoreDetails, i18n.gitCloneInfo);
                            } else {
                                var sshURL = _.pluck(repos, 'ssh_url');
                                var httpsURL = _.pluck(repos, 'clone_url');
                                var GitHubURL = _.union(sshURL, httpsURL);

                                var existingURL = _.pluck(URLSource, 'name');

                                // Removing duplicate clone url
                                var unionURL = _.union(existingURL, GitHubURL);
                                var diffURL = _.difference(unionURL, existingURL);

                                diffURL.forEach(function (url) {
                                    URLSource.push({
                                        name: url
                                    });
                                });

                                sessionStorage.setItem('GIT_URL_HISTORY', JSON.stringify(URLSource));
                                notify.success(i18n.fetchedYourRepository, i18n.sucess);

                                fetchFlag = true;
                            }
                        });
                    }
                });
            }

            var GIT_DIR = selectedPath;
            var cloneDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitCloneBtn',
                        caption: i18n.apply,
                        methodOnClick: 'gitClone',
                        disabledOnShow: true
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'gitClone',
                gitClone: function () {
                    if (cloneButton.disabled) {
                        return;
                    }

                    cloneEvent(GIT_DIR);
                    cloneDialog.hide();
                },

                title: i18n.cloneFromURL,
                onHide: function (evt) {
                    cloneDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });

            cloneDialog.setContentArea(cloneView);

            var URLComboBox = registry.byId('GitURLInput');
            var cloneButton = registry.byId('GitCloneBtn');
            var TargetTextBox = registry.byId('GitTargetInput');
            var recursiveCheckBox = registry.byId('GitCloneRecursiveCheckbox');
            var depthChk = registry.byId('GitCloneDepthChk');
            var depthInput = registry.byId('GitCloneDepthInput');
            var inputUsername = registry.byId('GitInputUsername');
            var inputPasswd = registry.byId('GitInputPassword');

            var storedData = sessionStorage.getItem('GIT_URL_HISTORY');
            var URLSource;
            var fetchFlag = false;
            var cloneProgress = null;
            var Authentication = $('#GitAuthentication');

            $('#GitCloneCurrentDirectory').text(GIT_DIR);

            if (storedData) {
                URLSource = JSON.parse(storedData);
            } else {
                URLSource = [];
                sessionStorage.setItem('GIT_URL_HISTORY', JSON.stringify(URLSource));
            }

            fetchGitHubURL();

            function checkTargetInput(value) {
                if (value === '' || TargetTextBox.get('value') === '') {
                    cloneButton.set('disabled', true);
                } else if (value.match(/^ssh:.*/)) {
                    fsCache.exists('/.userinfo/id_rsa', function (err, exists) {
                        if (err) {
                            gitviewlog.error(GIT_DIR, 'clone', err);
                        } else {
                            if (!exists) {
                                gitviewlog.warning(GIT_DIR, 'clone', HELP_KEY_SETTING);

                                // if the id_rsa file is not existed, disable the clone button widget.
                                cloneButton.set('disabled', true);
                            }
                        }
                    });
                } else {
                    cloneButton.set('disabled', false);
                }

                var m = value.match(/^(ssh|http|https|git).*\/(.*)$/);
                if (m) {
                    TargetTextBox.setValue(m[2]);
                    if (m[1].match(/http/)) {
                        inputUsername.set('disabled', false);
                        inputPasswd.set('disabled', false);
                    } else {
                        inputUsername.set('disabled', true);
                        inputPasswd.set('disabled', true);
                    }

                    if (cloneButton.disabled) {
                        cloneButton.set('disabled', false);
                    }
                }
            }


            function cloneEvent(path) {
                var url = URLComboBox.get('value');
                var target = TargetTextBox.get('value');
                var recursive = recursiveCheckBox.checked;
                var depth = depthChk.checked;
                var options = [];

                if (recursive) {
                    options.push('--recursive');
                }

                if (depth) {
                    options = options.concat(['--depth', depthInput.get('value')]);
                }

                var m = url.match(/^(http|https):\/\/(.*)/);
                if (m) {
                    var protocol = m[1];
                    url = m[2];
                    var user = encodeURIComponent(inputUsername.get('value'));
                    var pw = encodeURIComponent(inputPasswd.get('value'));
                    var eURL;

                    if (user.length === 0 && pw.length === 0) {
                        options.push(protocol + '://' + url);
                    } else {
                        eURL = protocol + '://' + user + ':' +  pw + '@' + url;
                        options.push(eURL);
                    }
                } else {
                    options.push(url);
                }
                options.push(target);

                var jobId = workbench.addJob('git clone : ' + url + ' into ' + target, i18n.processing);

                git.exec(path, ['clone'].concat(options), function (err, stdout, stderr) {
                    if (err) {
                        workbench.removeJob(jobId);
                        notify.error(i18n.forMoreDetails, i18n.gitCloneError);
                        gitviewlog.error(path, 'clone', err);
                    } else {
                        var data = stdout + stderr;
                        if (data.match(/(fatal|error): .*/)) {
                            workbench.removeJob(jobId);

                            fsCache.refreshHierarchy(selectedPath, { level: 1 });
                            notify.error(i18n.forMoreDetails, i18n.gitCloneError);

                            /*
                            if (data.match(/correct access rights/)) {
                                gitviewlog.error(target, 'clone', HELP_KEY_SETTING);
                            } else {
                                gitviewlog.error(target, 'clone', data);
                            }
                             */
                            gitviewlog.error(target, 'clone', data);
                        } else {
                            workbench.removeJob(jobId);
                            fsCache.refreshHierarchy(selectedPath, { level: 1 });
                            URLSource.push({
                                name: url
                            });

                            // Removing duplicate clone url
                            URLSource = _.uniq(URLSource, false, function (url) {
                                return url.name;
                            });

                            sessionStorage.setItem('GIT_URL_HISTORY', JSON.stringify(URLSource));

                            var msg = data + '\n\'' + url + '\' cloned.';
                            notify.success('', i18n.gitCloneSuccess);
                            gitviewlog.success(target, 'clone', msg);
                        }
                    }
                });
            }

            var dataAdapter = new Memory({
                data: URLSource
            });

            URLComboBox.set({
                regExp: '(^http|^https|^git|^ssh).*',
                invalidMessage: i18n.verifyTheProtocol,
                placeHolder: 'eg: (protocol)://[user:password@](servername)[:port]/(path)',
                store: dataAdapter,
                searchAttr: 'name',
                queryExpr: '*${0}*',
                autoComplete: false,
                trim: true,
                searchDelay: 500
            });

            dojo.connect(depthChk, 'onChange', function (value) {
                if (value) {
                    depthInput.set('disabled', false);
                } else {
                    depthInput.set('disabled', true);
                }
            });

            dojo.connect(URLComboBox, 'onKeyUp', function (event) {
                checkTargetInput(URLComboBox.get('value'));
            });

            dojo.connect(URLComboBox, 'onChange', function (value) {
                checkTargetInput(value);
            });

            dojo.connect(TargetTextBox, 'onKeyUp', function (event) {
                var inputValue = TargetTextBox.get('value');
                if (inputValue === '' || URLComboBox.get('value') === '') {
                    cloneButton.set('disabled', true);
                } else {
                    cloneButton.set('disabled', false);
                }
            });

            cloneDialog.show();
        });
    }

    function _push(gitRootPath) {
        require(['text!./layer/push.html'], function (pushView) {
            var GIT_DIR = gitRootPath;
            var pushDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitPushBtn',
                        caption: i18n.apply,
                        methodOnClick: 'gitPush'
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'gitPush',
                gitPush: function () {
                    if (pushButton.disabled) {
                        return;
                    }

                    pushToRemoteEvent(GIT_DIR);
                    pushDialog.hide();
                },

                title: i18n.pushToRemote,
                onHide: function (evt) {
                    pushDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            pushDialog.setContentArea(pushView);

            var remoteRepoSelect = registry.byId('GitPushRemoteRepoSelect');
            var pushDestInput = registry.byId('GitPushDestInput');
            var pushButton = registry.byId('GitPushBtn');
            var tagChkBtn = registry.byId('GitPushTagsChk');

            function pushToRemoteEvent(path) {
                var selectRepo = remoteRepoSelect.get('value');
                var toBranch = pushDestInput.get('value');

                var jobId = workbench.addJob('git push : ' + GIT_DIR, i18n.processing);
                var cmd = ['push'];

                if (tagChkBtn.checked) {
                    cmd = cmd.concat(['--tags', selectRepo, toBranch]);
                } else {
                    cmd = cmd.concat([selectRepo, toBranch]);
                }

                var uptodate = false;

                if (selectRepo !== undefined && toBranch !== undefined) {
                    var history = globalStatus.pushHistory[GIT_DIR];
                    history.repos.put(selectRepo);
                    history.dests.put(toBranch);

                    git.exec(path, cmd, function (err, stdout, stderr) {
                        if (err) {
                            notify.error(i18n.forMoreDetails, i18n.gitPushError);
                            gitviewlog.error(path, 'push', err);
                        } else {
                            var data = stdout + stderr;
                            if (data.match(/(fatal|error): .*/)) {
                                notify.error(i18n.forMoreDetails, i18n.gitPushError);

                                /*
                                if (data.match(/correct access rights/)) {
                                    gitviewlog.error(path, 'push', HELP_KEY_SETTING);
                                } else {
                                    gitviewlog.error(path, 'push', data);
                                }
                                 */
                                gitviewlog.error(path, 'push', data);
                            } else {
                                if (data.match('Everything up-to-date')) {
                                    notify.info(i18n.everythingUpToDate, i18n.gitPushSuccess);
                                    gitviewlog.info(path, 'push', data);
                                } else {
                                    notify.success(i18n.forMoreDetails, i18n.gitPushSuccess);
                                    gitviewlog.success(path, 'push', data + '\nSuccessfully pushed.');

                                    refresh(gitRootPath);		// is this necessary?
                                }
                            }

                            workbench.removeJob(jobId);
                        }
                    });
                } else {
                    var errmsg = 'Source Ref: ' + selectRepo + '\nDestination Ref: ' + toBranch;
                    gitviewlog.error(path, 'push', errmsg);
                }
            }

            async.waterfall([
                function (next) {
                    currentBranch(GIT_DIR, '#GitPushBranchInfo');
                    next();
                },
                function (next) {
                    // search for current branch and push infomation
                    git.exec(GIT_DIR, ['status'], function (err, statusResult) {
                        if (err) {
                            next(err);
                        } else {
                            var status = {
                                aheadBy: 0,
                                behindBy: 0,
                                diverged: false,
                            };
                            var devergedBranch;
                            var m = statusResult.match(/Your branch is ahead of '.*' by ([0-9]*) commit/);
                            if (m) {
                                status.aheadBy = parseInt(m[1]);
                            }

                            m = statusResult.match(/Your branch is behind '.*' by ([0-9]*) commit/);
                            if (m) {
                                status.behindBy = parseInt(m[1]);
                            }

                            m = statusResult.match(/Your branch and '(.*)' have diverged/);
                            if (m) {
                                status.diverged = true;
                                devergedBranch = m[1];
                            }

                            var msg;
                            if (status.diverged) {
                                $('#GitPushInfo')
                                    .text('Warning: Before pushing, Run \'git pull\' or \'git merge\'.')
                                    .css({'color': 'red'});

                                msg = 'Your branch and \'' +
                                    devergedBranch +
                                    '\' have diverged.\nBefore pushing,\nRun \'git pull\' or \'git merge ' +
                                    devergedBranch + '\'';

                                notify.info(i18n.forMoreDetails, i18n.gitPushInfo);
                                gitviewlog.info(GIT_DIR, 'push', msg);

                                next(null, 0);
                            } else if (!status.aheadBy && !status.behindBy) {
                                $('#GitPushInfo')
                                    .text('※ Nohting to commit. (working directory clean)')
                                    .css({'color': 'blue'});
                                next(null, 0);
                            } else if (status.behindBy) {
                                $('#GitPushInfo')
                                    .text('※ Warning: This job is expected the result that Non-fast forward ' +
                                          'updates were rejected. Before pushing, Run \'git pull\'')
                                    .css({'color': 'red'});

                                msg = 'This job is expected the result that Non-fast forward updates were ' +
                                    'rejected, Run \'git pull\'.';

                                notify.info(i18n.forMoreDetails, i18n.gitPushInfo);
                                gitviewlog.info(GIT_DIR, 'push', msg);

                                next(null, 0);
                            } else if (status.aheadBy) {
                                $('#GitPushInfo')
                                    .text('Your branch has ' + status.aheadBy + ' commit(s).')
                                    .css({'color': 'blue'});
                                next(null, status.aheadBy);
                            }
                        }
                    });
                },
                function (count, next) {
                    if (count) {
                        git.exec(GIT_DIR, ['log', '--format=raw', '-' + count], function (err, logResult) {
                            if (err) {
                                next(err);
                            } else {
                                var rt = git.parseLog(logResult);

                                var dataStore = new ObjectStore({
                                    objectStore: new Observable(new Memory({ data: rt }))
                                });

                                var layout = [
                                    [
                                        {
                                            'name': 'Message',
                                            'field': 'message',
                                            'width': '300px'
                                        },
                                        {
                                            'name': 'Author',
                                            'field': 'author',
                                            'width': 'auto'
                                        }
                                    ]
                                ];

                                var grid = new DataGrid({
                                    store: dataStore,
                                    structure: layout,
                                    noDataMessage: i18n.noDataToDisplay
                                }, dojo.query('#GitPushGrid')[0]);

                                grid.startup();
                                $('#GitPushGrid').css('height', '100px');
                                next();
                            }
                        });
                    } else {
                        next();
                    }
                },
                function (next) {
                    git.exec(GIT_DIR, ['branch', '-a'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {

                            var history = globalStatus.pushHistory[GIT_DIR];
                            if (!history) {
                                history = globalStatus.pushHistory[GIT_DIR] = {
                                    repos: new BubblingArray(),
                                    dests: new BubblingArray()
                                };
                            }

                            var localBranches = git.parseBranch(data)
                            .filter(function (branch) {
                                var m = branch.name.match(/remotes\//);
                                return (!m && branch.name.length);
                            }).map(function (data) {
                                return 'refs/heads/' + data.name;
                            });

                            var branches = new BubblingArray().importFromPlainArray(localBranches);
                            for (var i = history.dests.length - 1; i > -1; i--) {
                                branches.put(history.dests[i]);
                            }
                            branches = branches.map(function (br) {
                                return { name: br };
                            });

                            pushDestInput.set({
                                store: new Observable(new Memory({ data: branches })),
                                searchAttr: 'name',
                                placeHolder: 'Select or enter a local branch',
                                queryExpr: '*${0}*',
                                autoComplete: false,
                                trim: true,
                                searchDelay: 500,
                                value: branches[0].name
                            });

                            next();
                        }
                    });
                },
                function (next) {
                    // search for remote branch
                    git.exec(GIT_DIR, ['remote'], function (err, remoteReuslt) {
                        if (err) {
                            next(err);
                        } else {
                            var history = globalStatus.pushHistory[GIT_DIR];
                            var remotes = _.compact(remoteReuslt.split('\n')).map(function (line) {
                                return line.trim();
                            })
                            remotes = new BubblingArray().importFromPlainArray(remotes);
                            for (var i = history.repos.length - 1; i >= 0; i--) {
                                if (remotes.indexOf(history.repos[i]) >= 0) {
                                    remotes.put(history.repos[i]);
                                }
                            }
                            var value = remotes[0] || '';
                            remotes = remotes.map(function (remote) {
                                return {
                                    label: remote,
                                    value: remote
                                };
                            });

                            remoteRepoSelect.set({
                                options: remotes,
                                value: value
                            });

                            next();
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'push', err);
                } else {
                    pushDialog.show();
                }
            });

            dojo.connect(pushDestInput, 'onKeyUp', function (event) {
                var inputValue = pushDestInput.get('value');
                if (inputValue === '') {
                    pushButton.set('disabled', true);
                } else {
                    pushButton.set('disabled', false);
                }
            });
        });
    }

    function _pull(gitRootPath) {
        require(['text!./layer/pull.html'], function (pullView) {
            var GIT_DIR = gitRootPath;
            var pullDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitPullBtn',
                        caption: i18n.apply,
                        methodOnClick: 'gitPull'
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'gitPull',
                gitPull: function () {
                    if (pullButton.disabled) {
                        return;
                    }

                    var repo = remoteRepoSelect.get('value');
                    var refspec = null;

                    pullEvent(GIT_DIR, repo);
                    pullDialog.hide();
                },

                title: i18n.pullFromRemote,
                onHide: function (evt) {
                    pullDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            pullDialog.setContentArea(pullView);

            var remoteRepoSelect = registry.byId('GitPullRemoteRepoSelect');
            var noCommitCheckBox = registry.byId('GitPullNoCommitCheckbox');
            var squashCheckBox = registry.byId('GitPullSquashCheckbox');
            var noFastFowardCheckBox = registry.byId('GitPullNoFFCheckbox');
            var pullButton = registry.byId('GitPullBtn');
            var sourceRefSelect = registry.byId('GitPullSourceRefSelect');
            var destinationRefSelect = registry.byId('GitPullDestinationRefSelect');

            var uptodate = false;

            function pullEvent(path, repo) {
                var noCommitOption = noCommitCheckBox.checked;
                var squashOption = squashCheckBox.checked;
                var noFastFoward = noFastFowardCheckBox.checked;
                var refspec = sourceRefSelect.get('value') + ':' + destinationRefSelect.get('value');
                var options = [];
                var jobId = workbench.addJob('git pull : ' + GIT_DIR, i18n.merge);

                if (noCommitOption) {
                    options.push('--no-commit');
                }

                if (squashOption) {
                    options.push('--squash');
                }

                if (noFastFoward) {
                    options.push('--no-ff');
                }

                options.push('--no-edit');
                options.push(repo);
                options.push(refspec);

                // run 'git pull' command
                git.exec(GIT_DIR, ['pull'].concat(options), function (err, stdout, stderr) {
                    if (err) {
                        workbench.removeJob(jobId);
                        gitviewlog.error(GIT_DIR, 'pull', err);
                        notify.error(i18n.forMoreDetails, i18n.gitPullError);
                    } else {
                        var data = stdout + stderr;
                        if (data.match(/(fatal|error): .*/)) {
                            notify.error(i18n.forMoreDetails, i18n.gitPullError);

                            /*
                            if (data.match(/correct access rights/)) {
                                gitviewlog.error(GIT_DIR, 'pull', HELP_KEY_SETTING);
                            } else {
                                gitviewlog.error(GIT_DIR, 'pull', data);
                            }
                             */
                            gitviewlog.error(GIT_DIR, 'pull', data);
                        } else if (data.match(/You asked to pull from the remote '.*'/)) {
                            notify.warning(i18n.forMoreDetails, i18n.gitPullWarning);
                            gitviewlog.warning(GIT_DIR, 'pull', data);
                        }  else if (data.match(/CONFLICT .*/)) {
                            gitviewlog.warning(GIT_DIR, 'pull', data);
                            notify.warning(i18n.forMoreDetails, i18n.gitPullConflict);

                            refresh(gitRootPath);
                        } else {
                            if (data.match(i18n.alreadyUpToDate)) {
                                uptodate = true;
                            }

                            if (!uptodate) {
                                refresh(gitRootPath);
                                notify.success('', i18n.gitPullSuccess);
                                gitviewlog.success(GIT_DIR, 'pull ' + repo, data + '\nSuccessfuly pulled');
                            } else {
                                notify.info(i18n.alreadyUpToDate, i18n.gitPullInfo);
                                gitviewlog.info(GIT_DIR, 'pull ' +  repo, i18n.alreadyUpToDate);
                            }
                        }

                        workbench.removeJob(jobId);
                    }
                });
            }

            async.waterfall([
                function (next) {
                    git.exec(GIT_DIR, ['branch', '-l'], function (err, branchResult) {
                        if (err) {
                            next(err);
                        } else {
                            var branch = git.parseBranch(branchResult);
                            var curBranch;

                            for (var i in branch) {
                                if (branch.hasOwnProperty(i)) {
                                    if (branch[i].current) {
                                        curBranch = branch[i].name;
                                    }
                                }
                            }

                            $('#GitPullBranchInfo').text(curBranch);

                            // search for remote repository
                            git.exec(GIT_DIR, ['remote'], function (err, data) {
                                if (err) {
                                    next(err);
                                } else {
                                    var remoteRepos = data.split(/\r*\n/).filter(function (repo) {
                                        if (repo.length) {
                                            return repo;
                                        }
                                    }).map(function (repo) {
                                        var option = {
                                            label: repo.trim(),
                                            value: repo.trim()
                                        };

                                        return option;
                                    });

                                    remoteRepoSelect.set({
                                        options: remoteRepos,
                                        value: 'origin'
                                    });

                                    next();
                                }
                            });
                        }
                    });
                },
                function (next) {
                    git.exec(GIT_DIR, ['branch', '-a'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var localBranch = git.parseBranch(data)
                            .filter(function (branch) {
                                var m = branch.name.match(/remotes\//);
                                if (!m && branch.name.length) {
                                    return branch;
                                }
                            }).map(function (data) {
                                data.name = 'refs/heads/' + data.name;
                                return data;
                            });

                            var remoteBranch = git.parseBranch(data)
                            .filter(function (branch) {
                                var m = branch.name.match(/HEAD/);
                                var m1 = branch.name.match(/remotes\//);
                                if (!m && m1 && branch.name.length) {
                                    return branch;
                                }
                            }).map(function (data) {
                                data.name = 'refs/' + data.name;
                                return data;
                            });

                            sourceRefSelect.set({
                                store: new Memory({ data: localBranch }),
                                searchAttr: 'name',
                                placeHolder: i18n.selectBranch,
                                queryExpr: '*${0}*',
                                autoComplete: false,
                                trim: true,
                                searchDelay: 500
                            });

                            destinationRefSelect.set({
                                store: new Memory({ data: remoteBranch }),
                                searchAttr: 'name',
                                placeHolder: i18n.selectRemote,
                                queryExpr: '*${0}*',
                                autoComplete: false,
                                trim: true,
                                searchDelay: 500
                            });

                            next();
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'pull', err);
                } else {
                    pullDialog.show();
                }
            });

            dojo.connect(remoteRepoSelect, 'onChange', function (repo) {
                var curBranch = $('#GitPullBranchInfo').text();
                var remote = 'refs/remotes/' + repo + '/' + curBranch;
                var local = 'refs/heads/' + curBranch;

                sourceRefSelect.set('value', local);
                destinationRefSelect.set('value', remote);
            });

            dojo.connect(squashCheckBox, 'onChange', function (checked) {
                if (checked) {
                    noFastFowardCheckBox.set('disabled', true);

                    noCommitCheckBox.set({
                        disabled: true,
                        checked: false
                    });
                } else {
                    noFastFowardCheckBox.set('disabled', false);

                    noCommitCheckBox.set({
                        disabled: false,
                        checked: false
                    });
                }
            });

            dojo.connect(noFastFowardCheckBox, 'onChange', function (checked) {
                if (checked) {
                    squashCheckBox.set('disabled', true);
                } else {
                    squashCheckBox.set('disabled', false);
                }
            });

            dojo.connect(destinationRefSelect, 'onKeyUp', function (event) {
                var inputValue = destinationRefSelect.get('value');
                if (inputValue.length && sourceRefSelect.get('value').length) {
                    pullButton.set('disabled', false);
                } else {
                    pullButton.set('disabled', true);
                }
            });

            dojo.connect(sourceRefSelect, 'onKeyUp', function (event) {
                var inputValue = sourceRefSelect.get('value');
                if (inputValue.length && destinationRefSelect.get('value').length) {
                    pullButton.set('disabled', false);
                } else {
                    pullButton.set('disabled', true);
                }
            });
        });
    }

    function _merge(gitRootPath) {
        var branchSelect, noCommitCheckBox, squashCheckBox, noFastFowardCheckBox,
            mergeMsgInput, mergeButton;

        var GIT_DIR = gitRootPath;

        function mergeEvent(path, repo) {
            var noCommitOption = noCommitCheckBox.checked;
            var squashOption = squashCheckBox.checked;
            var noFastFoward = noFastFowardCheckBox.checked;
            var mergeMsg = mergeMsgInput.get('value').trim();
            var options = [];

            if (noCommitOption) {
                options.push('--no-commit');
            }

            if (squashOption) {
                options.push('--squash');
            }

            if (noFastFoward) {
                options.push('--no-ff');
            }

            if (mergeMsg) {
                options.push('-m');
                options.push(mergeMsg);
            }

            options.push(repo);

            // run 'git merge' command
            git.exec(GIT_DIR, ['merge'].concat(options), function (err, stdout, stderr) {
                if (err) {
                    notify.error(i18n.forMoreDetails, i18n.gitMergeError);
                    gitviewlog.error(GIT_DIR, 'merge', err);
                } else {
                    var data = stdout + stderr;
                    if (data.match(/(fatal|error): .*/)) {
                        gitviewlog.error(GIT_DIR, 'merge', data);
                        notify.error(i18n.forMoreDetails, i18n.gitMergeError);
                    } else if (data.match(i18n.alreadyUpToDate)) {
                        gitviewlog.info(GIT_DIR, 'merge', data);
                        notify.info(i18n.alreadyUpToDate, i18n.gitMergeInfo);
                    } else if (data.match(/CONFLICT .*/)) {
                        gitviewlog.warning(GIT_DIR, 'merge', data);
                        notify.warning(i18n.forMoreDetails, i18n.gitMergeConflict);
                        refresh(gitRootPath);
                    } else {
                        notify.success('', i18n.gitMergeSuccess);
                        gitviewlog.success(GIT_DIR, 'merge', data);
                        refresh(gitRootPath);
                    }
                }
            });
        }

        function mergeAbortEvent(path) {
            git.exec(path, ['merge', '--abort'], function (err, stdout, stderr) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'merge --abort', err);
                    notify.error(i18n.forMoreDetails, i18n.gitMergeError);
                } else {
                    var data = stdout + stderr;
                    if (data.match(/(fatal|error): .*/)) {
                        gitviewlog.error(GIT_DIR, 'merge --abort', data);
                        notify.error(i18n.forMoreDetails, i18n.gitMergeError);
                    } else {
                        refresh(gitRootPath);
                        gitviewlog.success(GIT_DIR, 'merge --abort', data);
                        notify.success('', i18n.gitMergeAbort);
                    }
                }
            });
        }

        function mergeDlg() {
            require(['text!./layer/merge.html'], function (mergeView) {
                var mergeDialog = new ButtonedDialog({
                    buttons: [
                        {
                            id: 'GitMergeApplyBtn',
                            caption: i18n.apply,
                            methodOnClick: 'merge'
                        },
                        {
                            caption: i18n.close,
                            methodOnClick: 'hide'
                        }
                    ],
                    methodOnEnter: 'merge',
                    merge: function () {
                        if (!mergeButton.disabled) {
                            var repo = branchSelect.get('value');
                            mergeEvent(GIT_DIR, repo);
                            mergeDialog.hide();
                        }
                    },

                    title: i18n.merge,
                    style: 'width:500px;',
                    onHide: function (evt) {
                        mergeDialog.destroyRecursive();
                        workbench.focusLastWidget();
                    }
                });
                mergeDialog.setContentArea(mergeView);
                branchSelect = registry.byId('GitMergeBranchSelect');
                noCommitCheckBox = registry.byId('GitMergeNoCommitCheckbox');
                squashCheckBox = registry.byId('GitMergeSquashCheckbox');
                noFastFowardCheckBox = registry.byId('GitMergeNoFFCheckbox');
                mergeMsgInput = registry.byId('GitMergeMsgInput');
                mergeButton = registry.byId('GitMergeApplyBtn');

                async.waterfall([
                    function (next) {
                        currentBranch(GIT_DIR, '#GitMergeBranchInfo');
                        next();
                    },
                    function (next) {
                        git.exec(GIT_DIR, ['branch', '--no-color', '-a'], function (err, data) {
                            if (err) {
                                next(err);
                            } else {
                                var allBranch = git.parseBranch(data).filter(function (branch) {
                                    var m = branch.name.match(/HEAD/);
                                    if (!m && branch.name.length) {
                                        return branch;
                                    }
                                });

                                var options = allBranch.map(function (branch) {
                                    var option = {
                                        label: branch.name,
                                        value: branch.name,
                                        selected: false
                                    };

                                    if (branch.current) {
                                        option.selected = true;
                                    }

                                    return option;
                                });

                                branchSelect.set({
                                    options: options,
                                    value: ''
                                });

                                next();
                            }
                        });
                    }
                ], function (err) {
                    if (err) {
                        gitviewlog.error(GIT_DIR, 'merge', err);
                    } else {
                        mergeDialog.show();
                    }
                });

                dojo.connect(squashCheckBox, 'onChange', function (checked) {
                    if (checked) {
                        noFastFowardCheckBox.set('disabled', true);

                        noCommitCheckBox.set({
                            disabled: true,
                            checked: false
                        });
                    } else {
                        noFastFowardCheckBox.set('disabled', false);

                        noCommitCheckBox.set({
                            disabled: false,
                            checked: false
                        });
                    }
                });

                dojo.connect(noFastFowardCheckBox, 'onChange', function (checked) {
                    if (checked) {
                        squashCheckBox.set('disabled', true);
                    } else {
                        squashCheckBox.set('disabled', false);
                    }
                });

                //dojo.connect(mergeMsgInput, 'onKeyUp', function (event) {
                //    var msg = mergeMsgInput.get('value');
                //    if (msg === '') {
                //        mergeButton.set('disabled', true);
                //    } else {
                //        mergeButton.set('disabled', false);
                //    }
                //});
            });
        }

        function mergeProcessingDlg() {
            require(['text!./layer/mergeprocessing.html'], function (mergeProcessingView) {

                var mergeProcessingDialog = new ButtonedDialog({
                    buttons: [
                        {
                            caption: i18n.abort,
                            methodOnClick: 'mergeAbort',
                        },
                        {
                            caption: i18n.close,
                            methodOnClick: 'hide'
                        }
                    ],
                    methodOnEnter: 'mergeAbort',

                    mergeAbort: function () {
                        mergeAbortEvent(GIT_DIR);
                        mergeProcessingDialog.hide();
                    },

                    title: i18n.merge,
                    //style: 'width:500px;',
                    onHide: function (evt) {
                        mergeProcessingDialog.destroyRecursive();
                        workbench.focusLastWidget();
                    }
                });
                mergeProcessingDialog.setContentArea(mergeProcessingView);
                mergeProcessingDialog.show();
            });
        }

        git.exec(GIT_DIR, ['status'], function (err, data) {
            if (err) {
                gitviewlog.error(GIT_DIR, 'merge', err);
                notify.error(i18n.forMoreDetails, i18n.gitMergeError);
            } else {
                if (data.match(/All conflicts fixed but you are still merging./)) {
                    mergeProcessingDlg();
                } else if (data.match(/You have unmerged paths./)) {
                    mergeProcessingDlg();
                } else {
                    mergeDlg();
                }
            }
        });
    }

    function _fetch(gitRootPath) {
        require(['text!./layer/fetch.html'], function (fetchView) {
            var GIT_DIR = gitRootPath;
            var fetchDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitFetchComboBtn',
                        caption: i18n.fetch,
                        methodOnClick: 'gitFetchOnly',
                        subitems: [
                            {
                                caption: i18n.fetch,
                                methodOnClick: 'gitFetchOnly'
                            },
                            {
                                caption: i18n.fetchAndRebase,
                                methodOnClick: 'gitFetchAndRebase'
                            }
                        ]
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'gitFetchOnly',
                gitFetchOnly: function () {
                    if (fetchComboButton.disabled) {
                        return;
                    }

                    var repo = remoteRepoSelect.get('value');

                    fetchEvent(GIT_DIR, repo);
                    fetchDialog.hide();
                },
                gitFetchAndRebase: function () {
                    var repo = remoteRepoSelect.get('value');

                    rebaseFlag = true;
                    fetchEvent(GIT_DIR, repo);
                    fetchDialog.hide();
                },

                title: i18n.fetchFromRemote,
                onHide: function (evt) {
                    fetchDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            fetchDialog.setContentArea(fetchView);

            var remoteRepoSelect = registry.byId('GitFetchRemoteRepoSelect');
            var fetchComboButton = registry.byId('GitFetchComboBtn');
            var fetchAllChk = registry.byId('GitFetchAllChk');
            var fetchRefspec = registry.byId('GitFetchRefspecChk');
            var pruneChk = registry.byId('GitFetchPruneChk');
            var notTagChk = registry.byId('GitFetchNoTagChk');
            var sourceRefSelect = registry.byId('GitFetchSourceRefSelect');
            var destinationRefSelect = registry.byId('GitFetchDestinationRefSelect');

            var rebaseFlag = false;

            function fetchEvent(path, repo) {
                var options = [];
                var refspec;
                var jobId = workbench.addJob('git fetch : ' + GIT_DIR, i18n.processing);
                var sourceRef = sourceRefSelect.get('value');
                var destinationRef = destinationRefSelect.get('value');

                if (destinationRef) {
                    refspec = sourceRef + ':' + destinationRef;
                } else {
                    // This will fetch to FETCH_HEAD
                    refspec = sourceRef;
                }
                if (notTagChk.checked) {
                    options.push('--no-tags');
                }

                if (pruneChk.checked) {
                    options.push('--prune');
                }

                if (fetchAllChk.checked) {
                    options.push('--all');
                } else {
                    options.push(repo);
                    options.push(refspec);
                }

                // run 'git fetch' command
                git.exec(GIT_DIR, ['fetch', '-v'].concat(options), function (err, stdout, stderr) {
                    if (err) {
                        workbench.removeJob(jobId);
                        gitviewlog.error(GIT_DIR, 'fetch ' + repo, err);
                        notify.error(i18n.forMoreDetails, i18n.gitFetchError);
                    } else {
                        var data = stdout + stderr;
                        if (data.match(/(fatal|error): .*/)) {
                            notify.error(i18n.forMoreDetails, i18n.gitFetchError);

                            /*
                            if (data.match(/correct access rights/)) {
                                gitviewlog.error(GIT_DIR, 'fetch', HELP_KEY_SETTING);
                            } else {
                                gitviewlog.error(GIT_DIR, 'fetch ', data);
                            }
                             */
                            gitviewlog.error(GIT_DIR, 'fetch ', data);
                        } else {
                            gitviewlog.success(GIT_DIR, 'fetch ', data + '\nSuccessfully fetched');
                            notify.success(i18n.forMoreDetails, i18n.gitFetchSuccess);

                            if (rebaseFlag) {
                                _rebase(gitRootPath);
                            }
                        }

                        workbench.removeJob(jobId);
                    }
                });
            }

            async.parallel([
                function (next) {
                    git.exec(GIT_DIR, ['branch',  '-l'], function (err, branchResult) {
                        if (err) {
                            next(err);
                        } else {
                            var branch = git.parseBranch(branchResult);
                            var curBranch;

                            for (var i in branch) {
                                if (branch.hasOwnProperty(i)) {
                                    if (branch[i].current) {
                                        curBranch = branch[i].name;
                                    }
                                }
                            }

                            $('#GitFetchBranchInfo').text(curBranch);

                            // search for remote repository
                            git.exec(GIT_DIR, ['remote'], function (err, data) {
                                if (err) {
                                    next(err);
                                } else {
                                    var remoteRepos = data.split(/\r*\n/).filter(function (repo) {
                                        if (repo.length) {
                                            return repo;
                                        }
                                    }).map(function (repo) {
                                        var option = {
                                            label: repo.trim(),
                                            value: repo.trim()
                                        };

                                        return option;
                                    });

                                    remoteRepoSelect.set({
                                        options: remoteRepos,
                                        value: 'origin'
                                    });

                                    next();
                                }
                            });
                        }
                    });
                },
                function (next) {
                    git.exec(GIT_DIR, ['branch', '-a'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var localBranch = git.parseBranch(data)
                            .filter(function (branch) {
                                var m = branch.name.match(/remotes\//);
                                if (!m && branch.name.length) {
                                    return branch;
                                }
                            }).map(function (data) {
                                data.name = 'refs/heads/' + data.name;
                                return data;
                            });

                            var remoteBranch = git.parseBranch(data)
                            .filter(function (branch) {
                                var m = branch.name.match(/HEAD/);
                                var m1 = branch.name.match(/remotes\//);
                                if (!m && m1 && branch.name.length) {
                                    return branch;
                                }
                            }).map(function (data) {
                                data.name = 'refs/' + data.name;
                                return data;
                            });

                            sourceRefSelect.set({
                                store: new Memory({ data: localBranch }),
                                searchAttr: 'name',
                                placeHolder: i18n.selectBranch,
                                queryExpr: '*${0}*',
                                autoComplete: false,
                                trim: true,
                                searchDelay: 500
                            });

                            destinationRefSelect.set({
                                store: new Memory({ data: remoteBranch }),
                                searchAttr: 'name',
                                placeHolder: i18n.selectRemote,
                                queryExpr: '*${0}*',
                                autoComplete: false,
                                trim: true,
                                searchDelay: 500
                            });

                            next();
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'fetch ', err);
                } else {
                    fetchDialog.show();
                }
            });

            dojo.connect(remoteRepoSelect, 'onChange', function (repo) {
                var curBranch = $('#GitFetchBranchInfo').text();
                var remote = 'refs/remotes/' + repo + '/' + curBranch;
                var local = 'refs/heads/' + curBranch;

                sourceRefSelect.set('value', local);
                destinationRefSelect.set('value', remote);
            });

            dojo.connect(fetchAllChk, 'onChange', function (checked) {
                if (checked) {
                    remoteRepoSelect.set('disabled', true);
                    sourceRefSelect.set('disabled', true);
                    destinationRefSelect.set('disabled', true);
                }
            });

            dojo.connect(fetchRefspec, 'onChange', function (checked) {
                if (checked) {
                    remoteRepoSelect.set('disabled', false);
                    sourceRefSelect.set('disabled', false);
                    destinationRefSelect.set('disabled', false);
                }
            });

            dojo.connect(sourceRefSelect, 'onKeyUp', function (event) {
                var inputValue = sourceRefSelect.get('value');
                if (inputValue.length) {
                    fetchComboButton.set('disabled', false);
                } else {
                    fetchComboButton.set('disabled', true);
                }
            });
        });
    }

    function _rebase(gitRootPath) {
        var GIT_DIR = gitRootPath;

        function _rebaseEvent() {
            var localBranchSelect = registry.byId('GitRebaselocalBranchSelect');
            var GitRebasePreserveMergesCheckbox = registry.byId('GitRebasePreserveMergesCheckbox');
            if (!localBranchSelect || !GitRebasePreserveMergesCheckbox) {
                return;
            }

            var preserveMerge = GitRebasePreserveMergesCheckbox.checked;
            var upstramBranch = localBranchSelect.get('value');
            var option = [];

            if (preserveMerge) {
                option.push('-p');
            }

            option.push(upstramBranch);

            git.exec(GIT_DIR, ['rebase'].concat(option), function (err, stdout, stderr) {
                if (err) {
                    notify.error(i18n.forMoreDetails, i18n.gitRebaseError);
                    gitviewlog.error(GIT_DIR, 'rebase ' + upstramBranch, err);
                } else {
                    var data = stdout + stderr;
                    if (data.match(/(fatal|error): .*/)) {
                        notify.error(i18n.forMoreDetails, i18n.gitRebaseError);
                        gitviewlog.error(GIT_DIR, 'rebase ' + upstramBranch, data);
                    } else {
                        if (data.match(/CONFLICT .*/)) {
                            notify.warning(i18n.forMoreDetails, i18n.gitRebaseConflictWarning);
                            gitviewlog.warning(GIT_DIR, 'rebase ' + upstramBranch, data);

                            refresh(gitRootPath);
                        } else if (data.match(/Cannot rebase: .*/)) {
                            notify.warning(data, i18n.gitRebaseWarning);
                            gitviewlog.warning(GIT_DIR, 'rebase ' + upstramBranch, data);
                        } else if (data.match(/Applying: .*/)) {
                            notify.success('', i18n.gitRebaseSuccess);
                            gitviewlog.success(GIT_DIR, 'rebase ' + upstramBranch, data);

                            refresh(gitRootPath);
                        } else if (data.match(/Current branch .* is up to date./)) {
                            notify.info(data, i18n.gitRebaseInfo);
                            gitviewlog.info(GIT_DIR, 'rebase ' + upstramBranch, data);
                        } else if (data.match(/Fast-forwarded .* to .*/)) {
                            notify.success('', i18n.gitRebaseSuccess);
                            gitviewlog.success(GIT_DIR, 'rebase ' + upstramBranch, data);

                            refresh(gitRootPath);
                        } else if (data.match(/First, rewinding head .*/)) {
                            notify.success('', i18n.gitRebaseSuccess);
                            gitviewlog.success(GIT_DIR, 'rebase ' + upstramBranch, data);

                            refresh(gitRootPath);
                        }
                    }
                }
            });
        }

        function completeRebaseDlg() {
            async.waterfall([
                function (next) {
                    currentBranch(GIT_DIR, '#GitRebaseBranchInfo');
                    next();
                },
                function (next) {
                    git.exec(GIT_DIR, ['branch', '--no-color', '-r'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var rebaseButton = registry.byId('GitApplyBtn');
                            var localBranchSelect = registry.byId('GitRebaselocalBranchSelect');
                            if (rebaseButton && localBranchSelect) {
                                /*
                                // Why do you do the same thing twice?
                                git.exec(GIT_DIR, ['branch', '--no-color', '-r'], function (err, data) {
                                    if (err) {
                                        next(err);
                                    } else {
                                 */
                                var localBranches = data.split(/\r*\n/).filter(function (branch) {
                                    var m = branch.match('HEAD');
                                    if (!m) {
                                        return branch;
                                    }
                                }).map(function (branch) {
                                    return {
                                        label: branch.trim(),
                                        value: branch.trim()
                                    };
                                });

                                localBranchSelect.set({
                                    options: localBranches,
                                    value: ''
                                });
                                /*
                                    }
                                });
                                 */

                                rebaseButton.set('disabled', false);
                                next();
                            }
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'rebase', err);
                }
            });
        }

        function _rebaseContinueEvent() {
            git.exec(GIT_DIR, ['rebase', '--continue'], function (err, stdout, stderr) {
                if (err) {
                    notify.error(i18n.forMoreDetails, i18n.gitRebaseContinueError);
                    gitviewlog.error(GIT_DIR, 'rebase --continue', err);
                } else {
                    var data = stdout + stderr;
                    if (data.match(/(fatal|error): .*/)) {
                        notify.error(i18n.forMoreDetails, i18n.gitRebaseContinueError);
                        gitviewlog.error(GIT_DIR, 'rebase --continue', data);
                    } else {
                        if (data.match(/CONFLICT .*/)) {
                            notify.warning(i18n.forMoreDetails, i18n.gitRebaseConflictWarning);
                            gitviewlog.warning(GIT_DIR, 'rebase --continue', data);
                            refresh(gitRootPath);
                        } else if (data.match(/Cannot rebase: .*/)) {
                            notify.warning(data, 'Git Rebase Warning');
                            gitviewlog.warning(GIT_DIR, 'rebase --continue', data);
                        } else if (data.match(/Applying: .*/)) {
                            notify.success('', 'Git Rebase Success');
                            gitviewlog.success(GIT_DIR, 'rebase --continue', data);
                            refresh(gitRootPath);
                        } else if (/.* needs merge/) {
                            notify.warning(i18n.forMoreDetails, i18n.gitRebaseContinueWarning);
                            gitviewlog.warning(GIT_DIR, 'rebase --continue', data);
                            refresh(gitRootPath);
                        } else {
                            notify.success('', i18n.gitRebaseSuccess);
                            gitviewlog.success(GIT_DIR, 'rebase --continue', data);
                            refresh(gitRootPath);
                        }
                    }
                }
            });
        }

        function _rebaseSkipEvent() {
            git.exec(GIT_DIR, ['rebase', '--skip'], function (err, stdout, stderr) {
                if (err) {
                    notify.error(i18n.forMoreDetails, i18n.gitRebaseSkipError);
                    gitviewlog.error(GIT_DIR, 'rebase --skip', err);
                } else {
                    var data = stdout + stderr;
                    if (data.match(/(fatal|error): .*/)) {
                        notify.error(i18n.forMoreDetails, i18n.gitRebaseSkipError);
                        gitviewlog.error(GIT_DIR, 'rebase --skip', data);
                    } else {
                        if (data.match(/CONFLICT .*/)) {
                            notify.warning(i18n.forMoreDetails, i18n.gitRebaseConflictWarning);
                            gitviewlog.warning(GIT_DIR, 'rebase --skip', data);
                            refresh(gitRootPath);
                        } else {
                            notify.success('', i18n.gitRebaseSuccess);
                            gitviewlog.success(GIT_DIR, 'rebase --skip', data);
                            refresh(gitRootPath);
                        }
                    }
                }
            });
        }

        function _rebaseAbortEvent() {
            git.exec(GIT_DIR, ['rebase', '--abort'], function (err, stdout, stderr) {
                if (err) {
                    notify.error(i18n.forMoreDetails, i18n.gitRebaseAbortError);
                    gitviewlog.error(GIT_DIR, 'rebase --abort', err);
                } else {
                    var data = stdout + stderr;
                    if (data.match(/(fatal|error): .*/)) {
                        notify.error(i18n.forMoreDetails, i18n.gitRebaseAbortError);
                        gitviewlog.error(GIT_DIR, 'rebase --abort', data);
                    } else {
                        notify.success('', i18n.gitRebaseAbortSuccess);
                        gitviewlog.success(GIT_DIR, 'rebase --abort', data);
                        refresh(gitRootPath);
                    }
                }
            });
        }

        // initilize
        git.exec(GIT_DIR, ['status'], function (err, data) {
            if (err) {
                gitviewlog.error(GIT_DIR, '', err);
                notify.error(i18n.forMoreDetails, i18n.gitRebaseError);
            } else {
                if (data.match(/You are currently rebasing/)) {
                    require(['text!./layer/rebaseprocessing.html'], function (rebaseProcessingView) {
                        var rebaseProcessingDialog = new ButtonedDialog({
                            buttons: [
                                {
                                    caption: i18n.continue,
                                    methodOnClick: 'continueRebase'
                                },
                                {
                                    caption: i18n.skip,
                                    methodOnClick: 'skipRebase'
                                },
                                {
                                    caption: i18n.abort,
                                    methodOnClick: 'abortRebase'
                                }
                            ],
                            methodOnEnter: 'doNothing',
                            doNothing: function () { },
                            continueRebase: function () {
                                _rebaseContinueEvent();
                                this.hide();
                            },
                            skipRebase: function () {
                                _rebaseSkipEvent();
                                this.hide();
                            },
                            abortRebase: function () {
                                _rebaseAbortEvent();
                                this.hide();
                            },

                            title: i18n.rebase,
                            style: 'width:273px;',
                            onHide: function (evt) {
                                rebaseProcessingDialog.destroyRecursive();
                                workbench.focusLastWidget();
                            }
                        });
                        rebaseProcessingDialog.setContentArea(rebaseProcessingView);
                        rebaseProcessingDialog.show();
                    });
                } else {
                    require(['text!./layer/rebase.html'], function (rebaseView) {
                        var rebaseDialog = new ButtonedDialog({
                            buttons: [
                                {
                                    id: 'GitApplyBtn',
                                    caption: i18n.apply,
                                    methodOnClick: 'rebase',
                                    disabledOnShow: true
                                },
                                {
                                    caption: i18n.close,
                                    methodOnClick: 'hide'
                                }
                            ],
                            methodOnEnter: 'rebase',

                            rebase: function () {
                                var rebaseButton = registry.byId('GitApplyBtn');
                                if (rebaseButton && !rebaseButton.disabled) {
                                    _rebaseEvent();
                                    this.hide();
                                }
                            },

                            title: i18n.rebase,
                            style: 'width:450px;',
                            onHide: function (evt) {
                                rebaseDialog.destroyRecursive();
                                workbench.focusLastWidget();
                            }
                        });
                        rebaseDialog.setContentArea(rebaseView);
                        rebaseDialog.show();
                        completeRebaseDlg();
                    });
                }
            }
        });
    }

    function _add(gitRootPath) {
        require(['text!./layer/addtostage.html'], function (addToStageView) {

            var GIT_DIR = gitRootPath;
            var grid = null;

            function _addToStageEvent(path) {
                var items = grid.selection.getSelected();
                var addlist = [];
                var rmlist = [];

                items.forEach(function (item) {
                    if (item.action.match('D')) {
                        rmlist.push(item.filename);
                    } else {
                        addlist.push(item.filename);
                    }
                });

                async.parallel([
                    function (next) {
                        if (rmlist.length) {
                            git.exec(GIT_DIR, ['rm', '--cache'].concat(rmlist), function (err, data) {
                                if (err) {
                                    next(err);

                                } else {
                                    next();
                                }
                            });
                        } else {
                            next();
                        }
                    },
                    function (next) {
                        if (addlist.length) {
                            git.exec(GIT_DIR, ['add'].concat(addlist), function (err, data) {
                                if (err) {
                                    next(err);
                                } else {
                                    next();
                                }
                            });
                        } else {
                            next();
                        }
                    }
                ], function (err) {
                    if (err) {
                        gitviewlog.error(GIT_DIR, 'add', err);
                        notify.error(i18n.forMoreDetails, i18n.gitAddError);
                    } else {
                        var add;
                        var rm;

                        if (addlist.length) {
                            add = addlist.join(': add to stage\n') + ': add to stage\n';
                        } else {
                            add = '';
                        }
                        if (rmlist.length) {
                            rm = rmlist.join(': add to unstage\n') + ': add to unstage';
                        } else {
                            rm = '';
                        }

                        gitIcon.refreshGitIconsInRepoOf(path, true);

                        notify.success('', i18n.gitAddSuccess);
                        gitviewlog.success(GIT_DIR, 'add', add + rm);
                    }
                });
            }

            var addToStageButton;
            var addToStageDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitAddToStageBtn',
                        caption: i18n.apply,
                        methodOnClick: 'addToStage',
                        disabledOnShow: true
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'addToStage',
                addToStage: function () {
                    if (addToStageButton.disabled) {
                        return;
                    }

                    _addToStageEvent(GIT_DIR);
                    addToStageDialog.hide();
                },

                title: i18n.addToStage,
                onHide: function (evt) {
                    addToStageDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });

            addToStageDialog.setContentArea(addToStageView);
            addToStageButton = registry.byId('GitAddToStageBtn');
            var searchQuery = registry.byId('GitAddSearchInput');

            async.waterfall([
                function (next) {
                    git.exec(GIT_DIR, ['status', '-z'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var status = [];
                            var rt = git.parseStatusZ(data);

                            _.forEach(rt, function (elem, key) {
                                status.push({
                                    filename: key,
                                    action: elem,
                                    staged: elem.match(/[MADRC]./) ? true:false
                                });
                            });

                            next(null, status);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'add', err);
                } else {
                    var dataStore = new Observable(new Memory({ data: result }));

                    var layout = [[
                        {
                            'name': 'Status',
                            'field': 'action',
                            'width': '15%'
                        }, {
                            'name': 'File',
                            'field': 'filename',
                            'width': 'auto'
                        }
                    ]];

                    grid = new EnhancedGrid({
                        store: new ObjectStore({objectStore: dataStore}),
                        query: {
                            staged: false,
                            action: new RegExp(/[A-Z?].?/)
                        },
                        structure: layout,
                        noDataMessage: i18n.noDataToDisplay,
                        rowSelector: '20px',
                        canSort: function () {
                            return false;
                        },
                        loadingMessage: i18n.loading,
                        plugins: {
                            indirectSelection: {
                                headerSelector: true,
                                width: '40px',
                                style: 'text-align: center;'
                            }
                        },
                        onSelectionChanged: function () {
                            var items = this.selection.getSelected();

                            if (items.length && items[0]) {
                                addToStageButton.set('disabled', false);
                            } else {
                                addToStageButton.set('disabled', true);
                            }
                        },
                        onRowDblClick: function (event) {
                            var idx = event.rowIndex;
                            var rowData = grid.getItem(idx);
                            var filepath = rowData.filename;
                            var status = rowData.action;
                            var infoMsg;

                            if (status === '??') {
                                infoMsg = string.substitute(i18n.hasBeenNewlyAdded, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else if (status === 'A') {
                                infoMsg = string.substitute(i18n.hasBeenNewlyAdded, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else if (status === 'D') {
                                infoMsg = string.substitute(i18n.hasBeenDeleted, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else {
                                _diff(gitRootPath, filepath);
                            }
                        }
                    }, dojo.query('#GitAddToStageGrid')[0]);

                    grid.startup();

                    $('.dojoxGridRowSelectorStatusText').text('');

                    addToStageDialog.show();
                }
            });

            function _filterFile() {
                var query = '*' + searchQuery.get('value') + '*';

                grid.setQuery({
                    filename: query,
                    staged: false,
                    action: new RegExp(/[A-Z?].?/)
                }, { ignoreCase: true});
            }

            dojo.connect(searchQuery, 'onKeyUp', function (evt) {
                evt.stopPropagation();

                _filterFile();
            });
        });
    }

    function _untrack(gitRootPath, relPath) {
        var GIT_DIR = gitRootPath;

        function _untrackUX() {
            require(['text!./layer/untrack.html'], function (untrackView) {

                function _untrackEvent(path) {
                    var options = [];
                    var selectedPath = wv.getSelectedPath();
                    var refreshFlag = false;

                    if (cacheCheckBox.checked) {
                        options.push('--cache');
                    } else {
                        refreshFlag = true;
                    }

                    if (pathUtil.isDirPath(selectedPath)) {
                        options.push('-r');
                    }

                    git.exec(path, ['rm'].concat(options, relPath), function (err, stdout, stderr) {
                        if (err) {
                            gitviewlog.error(path, 'untrack', err);
                            notify.error(i18n.forMoreDetails, i18n.gitUntrackError);
                        } else {
                            var data = stdout + stderr;
                            if (data.match(/(fatal|error): .*/)) {
                                gitviewlog.error(path, 'untrack', data);
                                notify.error(i18n.forMoreDetails, i18n.gitUntrackError);
                            } else {
                                if (refreshFlag) {
                                    refresh(gitRootPath);
                                } else {
                                    gitIcon.refreshGitIconsInRepoOf(path);
                                }

                                gitviewlog.success(path, 'untrack', relPath + ': untracked');
                                notify.success('', i18n.gitUntrackSuccess);
                            }
                        }
                    });
                }

                var untrackDialog = new ButtonedDialog({
                    buttons: [
                        {
                            caption: i18n.apply,
                            methodOnClick: 'gitUntrack'
                        },
                        {
                            caption: i18n.close,
                            methodOnClick: 'hide'
                        }
                    ],
                    methodOnEnter: 'gitUntrack',

                    gitUntrack: function () {
                        _untrackEvent(GIT_DIR);
                        untrackDialog.hide();
                    },
                    title: i18n.untrack,
                    onHide: function (evt) {
                        untrackDialog.destroyRecursive();
                        workbench.focusLastWidget();
                    }
                });
                untrackDialog.setContentArea(untrackView);

                var cacheCheckBox = registry.byId('GitUntrackCacheCheckbox');

                if (relPath === '.') {
                    $('#GitUntrackFilehInfo').text(GIT_DIR);
                } else {
                    var files = '';
                    relPath.forEach(function (value) {
                        files = files + GIT_DIR + value + ' ';
                    });
                    $('#GitUntrackFilehInfo').text(files);
                }

                untrackDialog.show();
            });
        }

        if (relPath === '.git/') {
            notify.warning('Invalid path ' + relPath, 'Git Untrack Warning');
            return;
        } else if (relPath === '.') {
            _untrackUX();
        } else {
            git.exec(GIT_DIR, ['status', '--porcelain', '--ignored'].concat(relPath), function (err, data) {
                if (!err) {
                    var rt = git.parseStatus(data);

                    if (rt.length && rt[0].action.match(/[D?]/)) {
                        notify.warning(string.substitute(
                            i18n.isAlreadyUntrack, {path: relPath}), i18n.gitUntrackWarning);
                    } else if (rt.length && rt[0].action.match(/[!]/)) {
                        notify.warning(string.substitute(
                            i18n.isIgnored, {path: relPath}), i18n.gitUntrackWarning);
                    } else {
                        _untrackUX();
                    }
                }
            });
        }


    }

    function _remove(gitRootPath) {
        require(['text!./layer/removefromstage.html'], function (removeFromStageView) {

            var grid = null;
            var revertFlag = false;
            var GIT_DIR = gitRootPath;
            function _removeFromStageEvent(path) {
                var items = grid.selection.getSelected();
                var checklist = [];
                var refreshFlag = false;

                items.forEach(function (item) {
                    if (item.action.match('R')) {
                        refreshFlag = true;
                    }

                    checklist.push(item.filename);
                });

                // run 'git reset HEAD' command
                git.exec(GIT_DIR, ['reset', 'HEAD'].concat(checklist), function (err, stdout, stderr) {
                    console.log(err, stdout, stderr);
                    if (err) {
                        gitviewlog.error(GIT_DIR, 'remove from stage', err);
                        notify.error(i18n.forMoreDetails, i18n.gitResetError);
                    } else {
                        var data = stdout + stderr;
                        if (data.match(/(fatal|error): .*/)) {
                            gitviewlog.error(GIT_DIR, 'remove from stage', data);
                            notify.error(i18n.forMoreDetails, i18n.gitResetError);
                        } else {
                            if (refreshFlag) {
                                refresh(gitRootPath, true);
                            } else {
                                gitIcon.refreshGitIconsInRepoOf(path, true);
                            }

                            if (revertFlag) {
                                revert();
                            }

                            gitviewlog.success(GIT_DIR,
                                               'remove from stage',
                                               checklist.join(': remove from stage\n') + ': remove from stage');
                            notify.success('', i18n.gitRemoveSueecss);
                        }
                    }
                });
            }

            var removeFromStageComboBtn;
            var removeFromStageDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitRemoveFromStageComboBtn',
                        caption: i18n.remove,
                        methodOnClick: 'removeOnly',
                        disabledOnShow: true,
                        subitems: [
                            {
                                caption: i18n.remove,
                                methodOnClick: 'removeOnly'
                            },
                            {
                                caption: i18n.removeAndCheckout,
                                methodOnClick: 'removeAndCheckout'
                            }
                        ]
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'removeOnly',
                removeOnly: function () {
                    if (removeFromStageComboBtn.disabled) {
                        return;
                    }

                    _removeFromStageEvent(GIT_DIR);
                    removeFromStageDialog.hide();
                },
                removeAndCheckout: function () {
                    revertFlag = true;
                    _removeFromStageEvent(GIT_DIR);
                    removeFromStageDialog.hide();
                },

                title: i18n.removeFromStage,
                onHide: function (evt) {
                    removeFromStageDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            removeFromStageDialog.setContentArea(removeFromStageView);
            removeFromStageComboBtn = registry.byId('GitRemoveFromStageComboBtn');

            var searchQuery = registry.byId('GitRemoveSearchInput');

            async.waterfall([
                function (next) {
                    git.exec(GIT_DIR, ['status', '-z'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var status = [];
                            var rt = git.parseStatusZ(data);

                            _.forEach(rt, function (elem, key) {
                                status.push({
                                    filename: key,
                                    action: elem,
                                    staged: elem.match(/[MADRC]./) ? true:false
                                });
                            });

                            next(null, status);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'remove from stage', err);
                } else {
                    var dataStore = new Observable(new Memory({ data: result }));

                    var layout = [[
                        {
                            'name': 'Status',
                            'field': 'action',
                            'width': '15%'
                        }, {
                            'name': 'File',
                            'field': 'filename',
                            'width': 'auto'
                        }
                    ]];

                    grid = new EnhancedGrid({
                        store:  new ObjectStore({ objectStore: dataStore }),
                        query: {
                            staged: true,
                            action: new RegExp(/[A-Z?].?/)
                        },
                        structure: layout,
                        noDataMessage: i18n.noDataToDisplay,
                        rowSelector: '20px',
                        canSort: function () {
                            return false;
                        },
                        loadingMessage: i18n.loading,
                        plugins: {
                            indirectSelection: {
                                headerSelector: true,
                                width: '40px',
                                style: 'text-align: center;'
                            }
                        },
                        onSelectionChanged: function () {
                            var items = this.selection.getSelected();

                            if (items.length && items[0]) {
                                removeFromStageComboBtn.set('disabled', false);
                            } else {
                                removeFromStageComboBtn.set('disabled', true);
                            }
                        },
                        onRowDblClick: function (event) {
                            var idx = event.rowIndex;
                            var rowData = grid.getItem(idx);
                            var filepath = rowData.filename;
                            var status = rowData.action;
                            var infoMsg;

                            if (status === 'A') {
                                infoMsg = string.substitute(i18n.hasBeenNewlyAdded, {paht: filePath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else if (status === 'R') {
                                infoMsg = string.substitute(i18n.renamePath, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else if (status === 'D') {
                                infoMsg = string.substitute(i18n.hasBeenDeleted, {paht: filePath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else {
                                _diff(gitRootPath, filepath);
                            }
                        }
                    }, dojo.query('#GitRemoveFromStageGrid')[0]);

                    grid.startup();
                    $('.dojoxGridRowSelectorStatusText').text('');

                    removeFromStageDialog.show();
                }
            });

            function _filterFile() {
                var query = '*' + searchQuery.get('value') + '*';

                grid.setQuery({
                    filename: query,
                    staged: true,
                    action: new RegExp(/[A-Z?].?/)
                }, { ignoreCase: true});
            }

            dojo.connect(searchQuery, 'onKeyUp', function (evt) {
                evt.stopPropagation();

                _filterFile();
            });
        });
    }

    function _resetToCommit(gitRootPath) {
        require(['text!./layer/reset.html'], function (resetView) {
            function resetCommitEvent(path) {
                var item = grid.selection.getSelected();
                var id = grid.store.getValue(item[0], 'id');
                var warningMsg = i18n.resetToTheCommit;
                var resetType = null;

                if (softTypeRadioButton.checked) {
                    resetType = '--soft';
                } else if (mixedTypeRadioButton.checked) {
                    resetType = '--mixed';
                } else if (hardTypeRadioButton.checked) {
                    resetType = '--hard';
                } else {
                    resetType = '--mixed';
                }

                PopupDialog.yesno({
                    title: i18n.reset,
                    message: warningMsg,
                    type: 'info'
                }).then(function () {
                    git.exec(path, ['reset', '-q', resetType, id], function (err, stdout, stderr) {
                        var omittedID = id.substr(0, 10) + '...';

                        if (err) {
                            gitviewlog.error(path, 'reset to commit', err);
                            notify.error(i18n.forMoreDetails,
                                         string.substitute(i18n.gitResetCommitError, {id: ommittedID}));
                        } else {
                            var data = stdout + stderr;
                            if (data.match(/(fatal|error): .*/)) {
                                gitviewlog.error(path, 'reset to commit', err);
                                notify.error(i18n.forMoreDetails,
                                             string.substitute(i18n.gitResetCommitError, {id: ommittedID}));
                            } else  {
                                gitviewlog.success(path, 'reset to commit', 'Successfully Reset to ' + id);
                                notify.success('', string.substitute(i18n.gitResetCommitSuccess, {id: ommittedID}));

                                refresh(gitRootPath, resetType !== '--soft');
                            }
                        }
                    });

                    resetToDialog.destroyRecursive();
                }, function () {
                    return;
                });
            }

            var resetButton;
            var resetToDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitResetBtn',
                        caption: i18n.apply,
                        methodOnClick: 'resetCommit',
                        disabledOnShow: true
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: null,

                resetCommit: function () {
                    if (!resetButton.disabled) {
                        resetCommitEvent(gitRootPath);
                    }
                },

                title: i18n.resetToCommit,
                onHide: function (evt) {
                    resetToDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            resetToDialog.setContentArea(resetView);
            resetButton = registry.byId('GitResetBtn');
            resetToDialog.show();

            var softTypeRadioButton = registry.byId('GitResetTypeSoftRadioBtn');
            var mixedTypeRadioButton = registry.byId('GitResetTypeMixedRadioBtn');
            var hardTypeRadioButton = registry.byId('GitResetTypeHardRadioBtn');
            var selectedSearchCol = registry.byId('GitResetSearchSelectColumn');
            var searchInput = registry.byId('GitResetSearchInput');
            var GIT_DIR = gitRootPath;
            var grid = null;

            currentBranch(GIT_DIR, '#GitResetBranchInfo');

            async.waterfall([
                function (next) {
                    git.exec(GIT_DIR, ['log', '--format=raw', '--decorate=short'], function (err, logResult) {
                        if (err) {
                            next(err);
                        } else {
                            next(null, git.parseLog(logResult));
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(path, 'reset to commit', err);
                } else {
                    var dataStore = new ObjectStore({
                        objectStore: new Memory({ data: result })
                    });

                    dataStore = new Observable(dataStore);

                    var layout = [[
                        {
                            'name': 'Commit-id',
                            'field': 'id',
                            'width': '60px',
                            'formatter': function (data) {
                                return data.substr(0, 8);
                            }
                        },
                        {
                            'name': 'Date',
                            'field': 'authorDate',
                            'width': '22%'
                        },
                        {
                            'name': 'Author',
                            'field': 'author',
                            'width': '20%'
                        },
                        {
                            'name': 'Message',
                            'field': 'message',
                            'width': 'auto',
                            'formatter': function (data) {
                                var info = data.split('\0');
                                if (info[1]) {
                                    info[1] = info[1].replace(/[()]/g, '');
                                    var ref = info[1].split(',').map(function (data) {
                                        return '<span class="gitrefinfo">' + data.trim() + '</span>';
                                    }).join('');
                                    return info[0] + ref;
                                } else {
                                    return info[0];
                                }
                            }
                        }
                    ]];

                    grid = new EnhancedGrid({
                        style: 'width: 650px;',
                        store: dataStore,
                        structure: layout,
                        noDataMessage: i18n.noDataToDisplay,
                        selectionMode: 'single',
                        rowSelector: '20px',
                        plugins: {
                            pagination: {
                                defaultPageSize: 25,
                                pageSizes: ['25', '50', '100', 'All'],
                                description: true,
                                sizeSwitch: true,
                                pageStepper: true,
                                gotoButton: true,
                                position: 'bottom'
                            }
                        },
                        onSelectionChanged: function () {
                            var item = this.selection.getSelected();
                            if (item.length) {
                                resetButton.set('disabled', false);
                            } else {
                                resetButton.set('disabled', true);
                            }
                        }
                    }, dojo.query('#GitResetCommitGrid')[0]);

                    grid.startup();
                }
            });

            function _filterFile() {
                var column = selectedSearchCol.get('value');
                var query = '*' + searchInput.get('value') + '*';

                switch (column) {
                case 'id':
                    grid.setQuery({ id: query }, { ignoreCase: true });
                    break;
                case 'authorDate':
                    grid.setQuery({ authorDate: query }, {ignoreCase: true });
                    break;
                case 'author':
                    grid.setQuery({ author: query }, { ignoreCase: true });
                    break;
                case 'message':
                    grid.setQuery({ message: query }, { ignoreCase: true });
                    break;
                }
            }

            dojo.connect(searchInput, 'onKeyUp', function (evt) {
                evt.stopPropagation();

                _filterFile();
            });
        });
    }

    function _commit(gitRootPath) {
        require(['text!./layer/commit.html'], function (commitView) {
            var commitDialog = new ButtonedDialog({

                buttons: [
                    {id: 'GitCommitComboBtn',
                     caption: i18n.commit,
                     methodOnClick: 'commitOnly',
                     disabledOnShow: true,
                     subitems: [ { caption: i18n.commit, methodOnClick: 'commitOnly' },
                                { caption: i18n.commitToPush, methodOnClick: 'commitAndPush' } ]
                    },
                    { caption: i18n.close, methodOnClick: 'hide' }
                ],
                methodOnEnter: null,

                commitOnly: function () {
                    if (!commitComboBtn.disabled) {
                        pushFlag = false;
                        commitEvent(GIT_DIR);
                    }
                },

                commitAndPush: function () {
                    pushFlag = true;
                    commitEvent(GIT_DIR);
                },

                title: i18n.commit,
                onHide: function (evt) {
                    commitDialog.destroyRecursive();
                }
            });

            commitDialog.setContentArea(commitView);

            var commitComboBtn = registry.byId('GitCommitComboBtn');
            var commitMsgInput = registry.byId('GitCommitMessage');
            var authorInput = registry.byId('GitAuthorInput');
            var amendCheckbox = registry.byId('GitCommitAmendCheckbox');
            var changeIdCheckbox = registry.byId('GitCommitChangeIdCheckbox');
            var changeSignedOffCheckbox = registry.byId('GitCommitSignedOffByCheckbox');
            var pushFlag = false;
            var GIT_DIR = gitRootPath;
            var dataStore;
            var grid = null;

            async.parallel([
                function (next) {
                    currentBranch(GIT_DIR, '#GitCommitBranchInfo');
                    next();
                },
                function (next) {
                    // get the user information
                    git.exec(GIT_DIR, ['config', '--get-regexp', 'user'], function (err, configResult) {
                        if (err) {
                            next(err);
                        } else {
                            var name = '';
                            var email = '';
                            configResult.split(/\r*\n/).forEach(function (info) {
                                // get the info of user.name
                                var m = info.match(/user.name (.*)/);
                                if (m)  {
                                    name = m[1].trim();
                                }

                                // get the info of user.email
                                m = info.match(/user.email (.*)/);
                                if (m) {
                                    email = '<' + m[1].trim() + '>';
                                }
                            });

                            authorInput.setValue(name + ' ' + email);
                            next();
                        }
                    });
                },
                function (next) {
                    // Merge 충돌 해결후 commit 시에 merge시에 기록해놨던 commit msg 자동완성 위한 루틴
                    git.exec(GIT_DIR, ['status'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            if (data.match(/All conflicts fixed but you are still merging./) ||
                                data.match(/You have unmerged paths./)) {
                                var MERGE_MSG_FILEPATH = pathUtil.detachSlash(gitRootPath) + '/.git/MERGE_MSG';

                                fsCache.readFile(MERGE_MSG_FILEPATH, function (err, data) {
                                    if (err) {
                                        next(err);
                                    } else {
                                        commitMsgInput.setValue(data);
                                        commitComboBtn.set('disabled', false);
                                        next();
                                    }
                                });
                            } else {
                                var COMMIT_TEMPLATE_PATH = '/.userinfo/.gitmessage';

                                fsCache.exists(COMMIT_TEMPLATE_PATH, function (err, exists) {
                                    if (err) {
                                        next(err);
                                    } else {
                                        if (exists) {
                                            fsCache.readFile(COMMIT_TEMPLATE_PATH, function (err, data) {
                                                if (err) {
                                                    next(err);
                                                } else {
                                                    commitMsgInput.setValue(data);
                                                    commitComboBtn.set('disabled', false);
                                                    next();
                                                }
                                            });
                                        } else {
                                            next();
                                        }
                                    }
                                });
                            }
                        }
                    });
                },
                function (next) {
                    git.exec(GIT_DIR, ['status', '-z'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var status = [];
                            var rt = git.parseStatusZ(data);

                            _.forEach(rt, function (elem, key) {
                                status.push({
                                    id: key,
                                    filename: key,
                                    action: elem,
                                    staged: elem.match(/[MADRC]./) ? true:false
                                });
                            });

                            next(null, status);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'commit', err);
                } else {
                    dataStore = new Observable(new Memory({ data: result[3] }));
                    var layout = [[
                        {
                            'name': 'Status',
                            'field': 'action',
                            'width': '15%'
                        },
                        {
                            'name': 'File',
                            'field': 'filename',
                            'width': 'auto'
                        }
                    ]];

                    grid = new EnhancedGrid({
                        style: 'height:230px;',
                        store:  new ObjectStore({ objectStore: dataStore }),
                        structure: layout,
                        noDataMessage: i18n.noDataToDisplay,
                        rowSelector: '20px',
                        canSort: function () {
                            return false;
                        },
                        plugins: {
                            indirectSelection: {
                                headerSelector: true,
                                width: '40px',
                                style: 'text-align: center;'
                            }
                        },
                        onRowDblClick: function (event) {
                            var idx = event.rowIndex;
                            var rowData = grid.getItem(idx);
                            var filepath = rowData.filename;
                            var status = rowData.action;
                            var infoMsg;

                            if (status === '??') {
                                infoMsg = string.substitute(i18n.hasBeenDeleted, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else if (status === 'D') {
                                infoMsg = string.substitute(i18n.hasBeenDeleted, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else if (status === 'R') {
                                infoMsg = string.substitute(i18n.renamePath, {path: filepath});
                                notify.info(infoMsg, i18n.gitDiffInfo);
                            } else {
                                _diff(gitRootPath, filepath);
                            }
                        }
                    }, dojo.query('#GitCommitGrid')[0]);

                    dojo.connect(grid.selection, 'onSelected', function (rowIndex) {
                        var data = dataStore.data[rowIndex];
                        data.staged = true;
                    });

                    dojo.connect(grid.selection, 'onDeselected', function (rowIndex) {
                        var data = dataStore.data[rowIndex];
                        data.staged = false;
                    });

                    dataStore.data.forEach(function (obj, idx) {
                        if (obj.staged) {
                            grid.selection.setSelected(idx, true);
                        }
                    });

                    grid.startup();
                    commitDialog.show();
                }
            });

            var commitOption = '';
            var previousMsg = '';
            var previousAuthor = '';

            function amendEvent(path, checked) {
                if (checked) {
                    // change commitOption value from '' to '--amend'
                    commitOption = '--amend';

                    // get a latest commit message
                    git.exec(path, ['log', '-n1', 'HEAD', '--format=raw'], function (err, logResult) {
                        if (err) {
                            gitviewlog.error(path, 'commit', err);
                        } else {
                            var log = git.parseLog(logResult);

                            previousMsg = commitMsgInput.displayedValue;
                            previousAuthor = authorInput.get('value');

                            commitMsgInput.setValue(log[0].message);
                            authorInput.setValue(log[0].author);

                            if (commitMsgInput.displayedValue.length) {
                                commitComboBtn.set('disabled', false);
                            } else {
                                commitComboBtn.set('disabled', true);
                            }
                        }
                    });
                } else {
                    commitMsgInput.setValue(previousMsg);
                    authorInput.setValue(previousAuthor);

                    commitOption = '';

                    if (commitMsgInput.displayedValue.length) {
                        commitComboBtn.set('disabled', false);
                    } else {
                        commitComboBtn.set('disabled', true);
                    }
                }
            }

            function signedOffByEvent(checked) {
                var msg = '', signedOffByMsg = '';
                if (checked) {
                    msg = previousMsg = commitMsgInput.get('value');
                    signedOffByMsg = '\nSigned-off-by: ' + authorInput.get('value');
                    commitMsgInput.setValue(msg.trim() + signedOffByMsg);
                } else {
                    commitMsgInput.setValue(previousMsg);
                }
            }

            function commitEvent(path) {
                var commitMsg = commitMsgInput.displayedValue;
                var author = authorInput.get('value');
                var commitArgs = ['commit', '-m', commitMsg];

                if (commitOption !== '') {
                    commitArgs.push(commitOption);
                }

                // check whether the author-info is empty or not
                if (author === '') {
                    notify.warning(i18n.authorSpecified, i18n.gitCommitWarning);
                    return;
                }

                // check whether the template of author-info is valid or not
                var m = author.match(/^(.*) ?<(.*)>$/);
                if (m) {
                    commitArgs.push('--author=' + author);
                } else {
                    notify.warning(i18n.verifyTheAuthor, i18n.gitCommitWarning);
                    gitviewlog.warning(path,
                       'commit', 'Specify author information\n\nEx.) AuthorName <AuthorName@Email.li>');
                    return;
                }

                var addlist = [];
                //var resetlist = [];
                var rmlist = [];
                var changes = dataStore.query({ staged: true }).length;

                dataStore.data.forEach(function (item) {
                    if (item.staged) {
                        if (item.action.match('D')) {
                            //console.log('hina temp: to rmlist - ' + item.filename);
                            rmlist.push(item.filename);
                        } else {
                            //console.log('hina temp: to addlist - ' + item.filename);
                            addlist.push(item.filename);
                        }
                    }
                    /* else {
                        console.log('hina temp: to resetlist - ' + item.filename);
                        resetlist.push(item.filename);
                    } */
                });


                if (!changes && commitOption === '') {
                    notify.info(i18n.noChangeDetect);
                    return;
                }

                async.waterfall([
                    /*
                    function (next) {
                        if (resetlist.length) {
                            git.exec(path, ['reset', '-q', 'HEAD'].concat(resetlist), function (err, data) {
                                if (err) {
                                    next(err);
                                } else {
                                    next();
                                }
                            });
                        } else {
                            next();
                        }
                    },
                     */
                    function (next) {
                        if (addlist.length) {
                            git.exec(path, ['add'].concat(addlist), function (err, data) {
                                if (err) {
                                    next(err);
                                } else {
                                    next();
                                }
                            });
                        } else {
                            next();
                        }
                    },
                    function (next) {
                        if (rmlist.length) {
                            git.exec(path, ['rm', '--cache'].concat(rmlist), function (err, data) {
                                if (err) {
                                    next(err);
                                } else {
                                    next();
                                }
                            });
                        } else {
                            next();
                        }
                    }
                ], function (err) {
                    if (err) {
                        gitviewlog.error(path, 'commit', err);
                    } else {
                        git.exec(path, commitArgs, function (err, stdout, stderr) {
                            if (err) {
                                gitviewlog.error(path, 'commit', err);
                                notify.error(i18n.forMoreDetails, i18n.gitCommitError);
                            } else {
                                var data = stdout + stderr;
                                if (data.match(/(fatal|error): .*/)) {
                                    gitviewlog.error(path, 'commit', data);
                                    notify.error(i18n.forMoreDetails, i18n.gitCommitError);
                                } else {
                                    gitIcon.refreshGitIconsInRepoOf(path, true);

                                    notify.success(i18n.forMoreDetails, i18n.gitCommitSuccess);
                                    gitviewlog.success(path, 'commit', data);

                                    if (pushFlag) {
                                        _push(gitRootPath);
                                    }
                                }
                            }
                        });
                    }

                    commitDialog.destroyRecursive();
                });
            }

            dojo.connect(changeIdCheckbox, 'onClick', function () {
                var checked = this.checked;
                var msg = commitMsgInput.get('value');
                var amendChecked = amendCheckbox.get('value');

                if (checked && !amendChecked) {
                    amendCheckbox.set('disabled', true);
                } else {
                    amendCheckbox.set('disabled', false);
                }

                var m = msg.match(/Change-Id: I[a-f0-9]*/);
                if (checked && !m) {
                    var changeId = '\n\nChange-Id: I' + _makeChangeId();

                    commitMsgInput.setValue(msg.trim() + changeId);
                } else if (checked && m) {
                    notify.info(i18n.changeIdExist, i18n.gitChangeIdInfo);
                }
            });

            dojo.connect(commitMsgInput, 'onKeyUp', function (event) {
                var inputValue = commitMsgInput.get('value');
                if (inputValue === '') {
                    commitComboBtn.set('disabled', true);
                } else {
                    commitComboBtn.set('disabled', false);
                }
            });

            dojo.connect(amendCheckbox, 'onClick', function () {
                var checked = this.checked;

                amendEvent(GIT_DIR, checked);
            });

            dojo.connect(changeSignedOffCheckbox, 'onClick', function () {
                var checked = this.checked;

                signedOffByEvent(checked);
            });
        });
    }

    function _compare(gitRootPath, filepath) {
        require(['text!./layer/compare.html',
                 'external/codemirror/lib/codemirror',
                 'external/codemirror/mode/scheme/scheme',
                 'external/codemirror/mode/diff/diff',
                 'external/codemirror/mode/javascript/javascript',
                 'external/codemirror/addon/merge/merge'
                ], function (compareView, codemirror) {
            _loadCss(require.toUrl('external/codemirror/lib/codemirror.css'));

            var GIT_DIR = gitRootPath;
            var path = wv.getSelectedPath();
            var relativeFilepath = null;
            var absoluteFilepath = null;
            var theme = 'default';
            var title = i18n.compare;

            if (filepath) {
                // commit 에서 compare 호출시
                relativeFilepath = filepath;
                absoluteFilepath = GIT_DIR + filepath;
            } else {
                // project-view의 context-menu를 통해 호출시
                relativeFilepath = path.replace(GIT_DIR, '');
                absoluteFilepath = path;
            }

            title += absoluteFilepath;

            var compareDialog = new ButtonedDialog({
                buttons: [{
                    caption: i18n.close,
                    methodOnClick: 'hide'
                }],
                methodOnEnter: 'hide',

                title: title,
                style: 'overflow:hidden;',
                onHide: function (evt) {
                    compareDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            compareDialog.setContentArea(compareView);

            var compareRevisionSelect = registry.byId('GitCompareRevision');

            $('#GitCompare').css({
                width: $(window).width() * 0.9,
                height: $(window).height() * 0.8
            });

            $('#GitCompareView').height($('#GitCompare').height() - 45);
            var height = $('#GitCompareView').height() + 8;
            var width = $('#GitCompare').width() - 20;

            var revisionList = [];
            git.exec(GIT_DIR, ['log', '--format=raw', relativeFilepath], function (err, result) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'compare with...', err);
                } else {
                    var rev = git.parseLog(result);
                    var len = rev.length;

                    for (var i = 0; i < len; i++) {
                        var title = 'Author: ' + rev[i].author + '\nDate: ' +
                            rev[i].authorDate + '\nMessage: ' + rev[i].message;
                        var label = rev[i].authorDate + ' (Author: ' + rev[i].author + ')';
                        revisionList.push({
                            label: label,
                            value: rev[i].id
                        });
                    }

                    compareRevisionSelect.set({
                        options: revisionList,
                        value: revisionList[0]
                    });

                    compareDialog.show();
                }
            });

            var mergeView = codemirror.MergeView($('#GitCompareView')[0], {
                value: '',
                orig: '',
                lineNumbers: true,
                readOnly: true,
                styleActiveLine: true,
                mode: 'scheme',
                theme: theme,
                extraKeys: {
                    "Esc": function (c) {
                        compareDialog.destroyRecursive();
                        workbench.focusLastWidget();
                    }
                }
            });

            mergeView.rightOriginal().setSize('100%', height);
            mergeView.editor().setSize('100%', height);
            $('#GitCompareView .CodeMirror-merge').width(width);
            $('#GitCompareView .CodeMirror-merge').height(height);

            var original = null;
            fsCache.readFile(absoluteFilepath, function (err, data) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'compare with...', err);
                } else {
                    original = data;
                    mergeView.editor().setValue(original);
                    mergeView.editor().setOption('mode', _looksLikeScheme(original) ? 'scheme' : 'javascript');
                }
            });

            dojo.connect(compareRevisionSelect, 'onChange', function (value) {
                $('#GitView').css({
                    width: $(window).width() * 0.9
                });

                git.exec(GIT_DIR, ['show', value + ':' + relativeFilepath], function (err, data) {
                    if (err) {
                        gitviewlog.error(GIT_DIR, 'compare with...', err);
                    } else {
                        mergeView.editor().setValue(original);
                        mergeView.editor().setCursor({
                            line: 0,
                            ch: ''
                        });
                        mergeView.rightOriginal().setValue(data);
                        mergeView.rightOriginal().setOption('mode', _looksLikeScheme(data) ? 'scheme' : 'javascript');
                        mergeView.rightOriginal().setCursor({
                            line: 0,
                            ch: ''
                        });
                    }
                });
            });
        });
    }

    function _createRepo(selectedPath) {
        require(['text!./layer/createrepo.html',
                 'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States'], function (createRepoView, FileDialog) {
            var createDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitCreateRepoBtn',
                        caption: i18n.apply,
                        methodOnClick: 'gitCreateRepo'
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'gitCreateRepo',
                gitCreateRepo: function () {
                    if (createButton.disabled) {
                        return;
                    }

                    if (createSelection.get('value').match('github')) {
                        createRepoGithub();
                        createDialog.hide();
                    } else {
                        if (checkMode === CURRENT) {
                            createRepoLocal(nodePath, null);
                            createDialog.hide();
                        } else {
                            var dirName = projectNameInput.get('value');

                            if (dirName) {
                                createRepoLocal(nodePath, dirName);
                                createDialog.hide();
                            } else {
                                notify.error(i18n.selectADirectoryToMakeARepository);
                            }
                        }
                    }

                },

                title: 'New Repository',
                onHide: function (evt) {
                    createDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            createDialog.setContentArea(createRepoView);

            var CURRENT = 0;
            var NEW = 1;
            var LOCAL = 2;
            var GITHUB = 3;

            var createSelection = registry.byId('GitCreateSelect');
            var curRadioButton = registry.byId('GitCreateCurDirRadioBtn');
            var newRadioButton = registry.byId('GitCreateNewDirRadioBtn');
            var projectNameInput = registry.byId('GitCreateProjectName');
            var createButton = registry.byId('GitCreateRepoBtn');
            var localSelection = registry.byId('GitCreateLocal');
            var nodePath = selectedPath;
            var gitRootPath = git.findGitRootPath(selectedPath);
            var resultString = '';
            var checkMode = CURRENT; // mode is CURRENT | NEW (default = CURRENT)
            $('#GitCurrentDirectoryInfo').text(nodePath);

            var githubNameInput = registry.byId('GitGithubName');
            var githubDescInput = registry.byId('GitGithubDescription');
            var githubPrivateSelect = registry.byId('GitGithubPrivate');
            var githubWikiSelect = registry.byId('GitGithubWiki');
            var githubIssueSelect = registry.byId('GitGithubIssue');
            var githubDownloadSelect = registry.byId('GitGithubDownload');
            var githubAutoInitSelect = registry.byId('GitGithubAutoInit');
            var githubSelection = registry.byId('GitCreateGithub');

            var fileDlgBtn = registry.byId('GitFileDialogBtn');

            function createRepoGithub() {
                /* jshint camelcase: false */
                var options = {
                    name: githubNameInput.get('value').trim(),
                    description: githubDescInput.get('value').trim(),
                    private: githubPrivateSelect.get('value') === 'true',
                    has_issues: githubIssueSelect.get('value') === 'true',
                    has_wiki: githubWikiSelect.get('value') === 'true',
                    has_downloads: githubDownloadSelect.get('value') === 'true',
                    auto_init: githubAutoInitSelect.get('value') === 'true'
                };
                /* jshint camelcase: true */

                var GITHUB_INFO_PATH = '/.userinfo/github.json';

                async.waterfall([
                    function (next) {
                        fsCache.exists(GITHUB_INFO_PATH, function (err, exist) {
                            if (err) {
                                next('Check whether the GitHub setting is done in Development Center.\n');
                            } else {
                                if (exist) {
                                    fsCache.readFile(GITHUB_INFO_PATH, function (err, data) {
                                        if (err) {
                                            next('Check whether the GitHub setting is done in Development Center.\n');
                                        } else {
                                            next(null, JSON.parse(data));
                                        }
                                    });
                                } else {
                                    next('Verify the GitHub setting in Development Center.\n');
                                }
                            }
                        });
                    }
                ], function (err, data) {
                    if (err) {
                        gitviewlog.error('', 'create git repository', err);
                    } else {
                        var gt = new Github(data.tokenKey);

                        var repo = gt.getRepo();
                        repo.create(options, function (err, repo) {
                            if (err) {
                                console.error('Failed to create a repo', err);
                                var errorMsg = JSON.parse(err.request.responseText).message;
                                gitviewlog.error('', 'create repository',  '\'' + options.name + '\' ' + errorMsg);
                                notify.error(i18n.forMoreDetails, 'Git Create Repository Error');
                            } else {
                                /* jshint camelcase: false */
                                var msg = 'Successfully created repository to GitHub.\n\n' +
                                    'Full Name: ' + repo.full_name + '\n' +
                                    'HTML URL: ' + repo.html_url + '\n' +
                                    'SSH URL: ' + repo.ssh_url + '\n' +
                                    'GIT URL: ' + repo.git_url + '\n' +
                                    'Description: ' + repo.description + '\n' +
                                    'Private: ' + repo.private + '\n' +
                                    'Has Wiki: ' + repo.has_wiki + '\n' +
                                    'Has Issues: ' + repo.has_issues + '\n\n' +
                                    'For more information, visit ' + repo.html_url;
                                /* jshint camelcase: true */

                                notify.success(i18n.forMoreDetails,
                                               'Git Create Repository Success');
                                gitviewlog.success('', 'create repository', msg);

                            }
                        });
                    }
                });
            }

            // To Do
            //  - check whether where argument is valid or not
            //  - change intiRepo UX design

            function createRepoLocal(path, where) {
                var GIT_DIR;

                if (where) {
                    GIT_DIR = where;
                } else {
                    GIT_DIR = path;
                }

                var jobId = workbench.addJob('git init ' + GIT_DIR, i18n.processing);
                async.waterfall([
                    function (next) {
                        if (where) {
                            git.exec('', ['init', '-q', where], function (err, data) {
                                if (err) {
                                    return next(err);
                                } else {
                                    next();
                                }
                            });
                        } else {
                            git.exec(path, ['init', '-q'], function (err, data) {
                                if (err) {
                                    return next(err);
                                } else {
                                    next();
                                }
                            });
                        }
                    },
                    function (next) {
                        git.exec(GIT_DIR, ['rev-parse', 'HEAD'], function (err, stdout, stderr) {
                            var data = stdout + stderr;

                            if (err || data.match(/fatal: .*/)) {
                                return next(null, true);
                            } else {
                                next(null, false);
                            }
                        });
                    },
                    function (isNeedInitCommit, next) {
                        if (isNeedInitCommit) {
                            var newFile;

                            if (where) {
                                newFile = where + '.gitignore';
                            } else {
                                newFile = path + '.gitignore';
                            }

                            async.waterfall([
                                function (next1) {
                                    fsCache.writeFile(newFile, '', function (err) {
                                        if (err) {
                                            return next(err);
                                        }
                                        next1();
                                    });
                                },
                                function (next1) {
                                    git.exec(GIT_DIR, ['add', '.'], function (err, addResult) {
                                        if (err) {
                                            return next(err);
                                        }
                                        next1();
                                    });
                                },
                                function (next1) {
                                    git.exec(GIT_DIR, ['commit', '-m', 'Initial commit'], function (err, commitResult) {
                                        if (err) {
                                            return next(err);
                                        }
                                        next();
                                    });
                                }
                            ]);
                        } else {
                            next();
                        }
                    }
                ], function (err) {
                    if (err) {
                        workbench.removeJob(jobId);
                        gitviewlog.error(GIT_DIR, 'create git repository', err);
                        notify.error(i18n.forMoreDetails, 'Git Create Repository Error');
                    } else {
                        workbench.removeJob(jobId);
                        gitviewlog.success(GIT_DIR, 'create git repository', resultString);
                        notify.success('', 'Git Create Repository Success');
                        refresh(selectedPath);
                    }
                });
            }

            if (nodePath === gitRootPath) {
                resultString = 'Reinitialized an existing Git repository.';
            } else {
                resultString = 'Initialized a new Git repository.';
            }

            dojo.connect(createSelection, 'onChange', function () {
                var self = this;

                if (self.get('value') === 'local') {
                    $('#GitCreateGithub').hide();
                    $('#GitCreateLocal').show();

                    if (checkMode === CURRENT) {
                        projectNameInput.set('disabled', true);
                        createButton.set('disabled', false);
                    } else {
                        if (projectNameInput.get('value') === '') {
                            createButton.set('disabled', true);
                        }
                    }
                } else {
                    $('#GitCreateLocal').hide();
                    $('#GitCreateGithub').show();

                    if (githubNameInput.get('value') === '') {
                        createButton.set('disabled', true);
                    } else {
                        createButton.set('disabled', false);
                    }
                }
            });

            dojo.connect(newRadioButton, 'onChange', function () {
                if (this.checked) {
                    checkMode = NEW;

                    //                    projectNameInput.set('disabled', false);
                    fileDlgBtn.set('disabled', false);

                    if (projectNameInput.get('value') === '') {
                        createButton.set('disabled', true);
                    }
                } else {
                    checkMode = CURRENT;

                    //                    projectNameInput.set('disabled', true);
                    fileDlgBtn.set('disabled', true);
                    createButton.set('disabled', false);
                }
            });

            dojo.connect(projectNameInput, 'onKeyUp', function (event) {
                if (createSelection.get('value') === 'local') {
                    var inputValue = projectNameInput.get('value');
                    if (inputValue === '') {
                        createButton.set('disabled', true);
                    } else {
                        createButton.set('disabled', false);
                    }
                }
            });

            dojo.connect(githubNameInput, 'onKeyUp', function (event) {
                if (createSelection.get('value') === 'github') {
                    var inputValue = githubNameInput.get('value');
                    if (inputValue === '') {
                        createButton.set('disabled', true);
                    } else {
                        createButton.set('disabled', false);
                    }
                }
            });

            dojo.connect(fileDlgBtn, 'onClick', function () {
                var rootPath = ide.getPath();

                var dlg = new FileDialog({
                    mount : fsCache,
                    root: rootPath,
                    title: i18n.selectADirectory,
                    singular: true,
                    dirOnly: true
                });

                dlg.open(function (selected) {
                    projectNameInput.setValue(selected[0].substr(1) + '/');
                    createButton.set('disabled', false);
                });
            });

            createDialog.show();
        });
    }

    function _blame(gitRootPath, relPath) {
        require(['text!./layer/blame.html',
                 'external/codemirror/lib/codemirror',
                 'external/codemirror/mode/scheme/scheme',
                 'external/codemirror/mode/diff/diff',
                 'external/codemirror/mode/javascript/javascript',
                 'external/codemirror/addon/merge/merge'
                ], function (blameView, codemirror) {
            _loadCss(require.toUrl('external/codemirror/lib/codemirror.css'));

            var blameDialog = new ButtonedDialog({
                buttons: [{
                    caption: i18n.close,
                    methodOnClick: 'hide'
                }],
                methodOnEnter: 'hide',

                style: 'overflow:hidden;',
                title: string.substitute(i18n.blamePath, {rootPath: gitRootPath, path: relPath}),
                onHide: function (evt) {
                    blameDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            blameDialog.setContentArea(blameView);

            var blameNode = $('#GitBlame');
            var theme = 'default';

            blameNode.css({
                width: $(window).width() * 0.9,
                height: $(window).height() * 0.8
            });

            var GIT_DIR = gitRootPath;
            var blameLog = null;

            async.waterfall([
                function (next) {
                    git.exec(GIT_DIR, ['blame', '--line-porcelain', relPath], function (err, blameResult) {
                        if (err) {
                            next(err);
                        } else {
                            blameLog = git.parseBlame(blameResult);
                            next();
                        }
                    });
                },
                function (next) {
                    git.exec(GIT_DIR, ['show', 'HEAD:' + relPath], function (err, result) {
                        if (err) {
                            next(err);
                        } else {
                            next(null, result);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'blame', err);
                } else {
                    blameDialog.show();

                    var cm = codemirror($('#GitBlame')[0], {
                        lineNumbers: true,
                        readOnly: true,
                        gutters: [ 'note-gutter', 'CodeMirror-linenumbers'],
                        value: result,
                        styleActiveLine: true,
                        mode: 'scheme',
                        theme: theme,
                        extraKeys: {
                            "Esc": function (c) {
                                blameDialog.destroyRecursive();
                                workbench.focusLastWidget();
                            }
                        }
                    });

                    blameLog.forEach(function (blame, idx) {
                        var div = document.createElement('div');
                        div.title = blame.commit + ' > ' + blame.author + ' ' +
                            blame.authorMail + '\n' + blame.authorTime + '\n' + blame.summary;
                        var text = document.createTextNode(blame.authorTime + ' ' + blame.author);
                        div.appendChild(text);

                        cm.setGutterMarker(idx, 'note-gutter', div);
                    });

                    cm.setOption('mode', _looksLikeScheme(result) ? 'scheme' : 'javascript');
                    cm.setSize('100%', '100%');
                }
            });

            blameNode.height(blameNode.height() + 15);
        });
    }

    function _remote(gitRootPath) {
        require(['text!./layer/remote.html', 'text!./layer/remoteadd.html'], function (remoteView, remoteAddView) {
            var GIT_DIR = gitRootPath;
            var remoteDialog = new ButtonedDialog({
                buttons: [
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: null,
                title: 'Remotes',
                onHide: function (evt) {
                    remoteDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            remoteDialog.setContentArea(remoteView);

            var addBtn = registry.byId('GitRemoteAddBtn');
            var removeBtn = registry.byId('GitRemoteRemoveBtn');
            var grid;

            // register remote repository information
            dojo.connect(addBtn, 'onClick', function () {
                var remoteAddDlg = new ButtonedDialog({
                    buttons: [
                        {
                            caption: i18n.apply,
                            methodOnClick: 'gitRemoteAdd'
                        },
                        {
                            caption: i18n.close,
                            methodOnClick: 'hide'
                        }
                    ],
                    methodOnEnter: 'gitRemoteAdd',
                    gitRemoteAdd: function () {
                        var remoteName = strName.get('value');
                        var remoteLOC = strLoc.get('value');
                        var remoteUser = userInput.get('value');
                        var remotePw = pwInput.get('value');
                        var authLOC;
                        var options = [];

                        if (!remoteName) {
                            notify.warning(string.substitute(i18n.enterRemoteRepositoryArg, {arg: 'name'}));
                            return;
                        } else if (!remoteLOC) {
                            notify.warning(string.substitute(i18n.enterRemoteRepositoryArg, {arg: 'URL'}));
                            return;
                        }

                        var m = remoteLOC.match(/^(http|https):\/\/(.*)/);
                        if (m) {
                            var protocol = m[1];
                            var url = m[2];

                            if (remoteUser.length === 0 && remotePw.length === 0) {
                                authLOC = remoteLOC;
                            } else {
                                authLOC = protocol + '://' + remoteUser + ':' +  remotePw + '@' + url;
                            }
                        } else {
                            authLOC = remoteLOC;
                        }

                        if (fetchChk.checked) {
                            options = options.concat(['--fetch', remoteName, authLOC]);
                        } else {
                            options = options.concat([remoteName, authLOC]);
                        }

                        remoteAddDlg.hide();

                        var jobId = workbench.addJob('git remote add ' + remoteName + ' ' + remoteLOC, i18n.processing);
                        git.exec(GIT_DIR, ['remote', 'add'].concat(options), function (err, stdout, stderr) {
                            if (err) {
                                workbench.removeJob(jobId);
                                notify.error(err, i18n.gitRemoteError);
                                gitviewlog.error(GIT_DIR, 'remote', err);
                            } else {
                                var data = stdout + stderr;

                                if (data.match(/(fatal|error): .*/)) {
                                    workbench.removeJob(jobId);
                                    if (data.match(/Could not fetch/)) {
                                        var WARN_MSG = i18n.checkRemoteRepository;

                                        notify.warning(i18n.forMoreDetails,
                                                       'Git Remote Warning');
                                        gitviewlog.warning(GIT_DIR, 'remote', WARN_MSG + '\n' + data);

                                        grid.store.newItem({
                                            name: remoteName,
                                            location: remoteLOC
                                        });

                                    } else {
                                        gitviewlog.error(GIT_DIR, 'remote rm', data);
                                        notify.error(i18n.forMoreDetails, i18n.gitRemoteError);
                                    }
                                } else {
                                    workbench.removeJob(jobId);
                                    grid.store.newItem({
                                        name: remoteName,
                                        location: remoteLOC
                                    });

                                    notify.success(i18n.forMoreDetails, i18n.gitRemoteSuccess);
                                    gitviewlog.success(GIT_DIR, 'remote add',
                                                       'Successfully added remote \'' + remoteName + '\' repository.');
                                }
                            }
                        });
                    },
                    title: 'Add',
                    onHide: function () {
                        remoteAddDlg.destroyRecursive();
                    }
                });
                remoteAddDlg.setContentArea(remoteAddView);

                var strName = registry.byId('GitRemoteNameInput');
                var strLoc = registry.byId('GitRemoteLocationInput');
                var fetchChk = registry.byId('GitRemoteFetchCheckbox');
                var userInput = registry.byId('GitRemoteUser');
                var pwInput = registry.byId('GitRemotePW');

                dojo.connect(strLoc, 'onKeyUp', function () {
                    var remoteURL = strLoc.get('value');
                    var m = remoteURL.match(/^(http|https):\/\/(.*)/);

                    if (m) {
                        userInput.set('disabled', false);
                        pwInput.set('disabled', false);
                    } else {
                        userInput.set('disabled', true);
                        pwInput.set('disabled', true);
                    }
                });

                remoteAddDlg.show();
            });

            // remove the selected remote repository infomation
            dojo.connect(removeBtn, 'onClick', function () {
                var item = grid.selection.getSelected();
                var remoteName = grid.store.getValue(item[0], 'name');
                var WARN_MSG = 'Do you want to remove remote \'' + remoteName + '\' repository ?';

                PopupDialog.yesno({
                    title: 'Remove',
                    message: string.substitute(i18n.removeRemoteRepository, {name: remoteName}),
                    type: 'info'
                }).then(function () {
                    git.exec(GIT_DIR, ['remote', 'rm', remoteName], function (err, stdout, stderr) {
                        if (err) {
                            gitviewlog.error(GIT_DIR, 'remote', err);
                            notify.error(i18n.forMoreDetails, i18n.gitRemoteError);
                        } else {
                            var data = stdout + stderr;
                            if (data.match(/(fatal|error): .*/)) {
                                gitviewlog.error(GIT_DIR, 'remote rm', data);
                                notify.error(i18n.forMoreDetails, i18n.gitRemoteError);
                            } else {
                                grid.store.deleteItem(item[0]);

                                notify.success(i18n.forMoreDetails, i18n.gitRemoteSuccess);
                                gitviewlog.success(GIT_DIR, 'remote rm', 'Successfully removed remote \'' +
                                                   remoteName + '\' repository.');
                            }
                        }
                    });
                }, function () {
                    return;
                });
            });

            async.waterfall([
                function (next) {
                    git.exec(GIT_DIR, ['remote', '-v'], function (err, stdout) {
                        if (err) {
                            next(err);
                        } else {
                            next(null, git.parseRemote(stdout));
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    gitviewlog.error(gitRootPath, 'remote', err);
                } else {
                    var dataStore = new ObjectStore({
                        objectStore: new Memory({ data: result })
                    });

                    dataStore = new Observable(dataStore);

                    var layout = [[
                        {
                            'name': 'Name',
                            'field': 'name',
                            'width': '20%'
                        },
                        {
                            'name': 'URL',
                            'field': 'location',
                            'width': 'auto',
                            'formatter': function (data) {
                                var m = data.match(/^(http|https):\/\/(.*):(.*)@(.*)/);
                                if (m) {
                                    return m[1] + '://' + m[4];
                                } else {
                                    return data;
                                }
                            }
                        }
                    ]];

                    grid = new EnhancedGrid({
                        style: 'width: 100%;',
                        store: dataStore,
                        structure: layout,
                        noDataMessage: i18n.noDataToDisplay,
                        selectionMode: 'single',
                        onSelectionChanged: function () {
                            var items = this.selection.getSelected();
                            if (items.length) {
                                removeBtn.set('disabled', false);
                            } else {
                                removeBtn.set('disabled', true);
                            }
                        },
                        rowSelector: '20px'
                    }, dojo.query('#GitRemoteGird')[0]);

                    grid.startup();

                    remoteDialog.show();
                }
            });
        });
    }

    function _preference(gitRootPath) {
        require(['text!./layer/configure.html'], function (configureView) {
            var configDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitConfigApplyBtn',
                        caption: i18n.apply,
                        methodOnClick: 'gitConfigure',
                        disabledOnShow: true
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: null,
                gitConfigure: function () {
                    var name = userNameInput.get('value');
                    var email = userEmailInput.get('value');
                    var options = ['config'];

                    if (globalChk.checked) {
                        options.push('--global');
                    } else {
                        options.push('--local');
                    }

                    async.parallel([
                        function (cb) {
                            if (name) {
                                git.exec(GIT_DIR, options.concat(['user.name', name]), function (err, data) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        cb();
                                    }
                                });
                            } else {
                                git.exec(GIT_DIR, options.concat(['--unset', 'user.name']), function (err, data) {
                                    cb();
                                });
                            }
                        },
                        function (cb) {
                            if (email) {
                                git.exec(GIT_DIR, options.concat(['user.email', email]), function (err, data) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        cb();
                                    }
                                });
                            } else {
                                git.exec(GIT_DIR, options.concat(['--unset', 'user.email']), function (err, data) {
                                    cb();
                                });
                            }
                        },
                        function (cb) {
                            fsCache.writeFile(COMMIT_TEMPLATE_PATH, commitTemplate.get('value'), function (err) {
                                if (err) {
                                    cb(err);
                                } else {
                                    cb();
                                }
                            });
                        }
                    ], function (err) {
                        if (err) {
                            gitviewlog.error(GIT_DIR, 'configure', err);
                            notify.error('', i18n.gitConfigureError);
                        } else {
                            gitviewlog.success(GIT_DIR, 'configure', 'Successfully changed git configure.');
                            notify.success('', i18n.gitConfigureError);
                        }
                    });
                },
                title: 'Configure',
                onHide: function (evt) {
                    configDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            configDialog.setContentArea(configureView);

            var userNameInput = registry.byId('GitConfigUserName');
            var userEmailInput = registry.byId('GitConfigUserEmail');
            var applyButton = registry.byId('GitConfigApplyBtn');
            var closeButton = registry.byId('GitConfigCloseBtn');
            var commitTemplate = registry.byId('GitConfigCommitTemplate');
            var globalChk = registry.byId('GitConfigGlobalChk');
            var GIT_DIR = gitRootPath;

            async.parallel([
                function (cb) {
                    fsCache.exists(COMMIT_TEMPLATE_PATH, function (err, data) {
                        if (err) {
                            cb(err);
                        } else {
                            if (data) {
                                fsCache.readFile(COMMIT_TEMPLATE_PATH, function (err, data) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        commitTemplate.setValue(data);
                                        cb();
                                    }
                                });
                            } else {
                                cb();
                            }
                        }
                    });
                },
                function (cb) {
                    git.exec(GIT_DIR, ['config', '--local', '-l'], function (err, data) {
                        if (err) {
                            cb(err);
                        } else {
                            var rt = git.parseConfig(data);

                            userNameInput.setValue(rt.name);
                            userEmailInput.setValue(rt.email);

                            cb();
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'preference', err);
                } else {
                    configDialog.show();
                }
            });

            dojo.connect(globalChk, 'onChange', function () {
                var options = ['config'];
                if (globalChk.checked) {
                    options = options.concat(['--global', '--list']);
                } else {
                    options = options.concat(['--local', '--list']);
                }

                git.exec(GIT_DIR, options, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        var rt = git.parseConfig(data);

                        if (rt.hasOwnProperty('name')) {
                            if (rt.name.length) {
                                userNameInput.setValue(rt.name);
                            } else {
                                userNameInput.setValue('');
                            }
                        } else {
                            userNameInput.setValue('');
                        }

                        if (rt.hasOwnProperty('email')) {
                            if (rt.email.length) {
                                userEmailInput.setValue(rt.email);
                            } else {
                                userEmailInput.setValue('');
                            }
                        } else {
                            userEmailInput.setValue('');
                        }
                    }
                });

                applyButton.set({ disabled: false });
            });

            dojo.connect(userNameInput, 'onKeyUp', function () {
                applyButton.set({ disabled: false });
            });

            dojo.connect(userEmailInput, 'onKeyUp', function () {
                applyButton.set({ disabled: false });
            });

            dojo.connect(commitTemplate, 'onKeyUp', function () {
                applyButton.set({ disabled: false });
            });
        });
    }

    function _branch(gitRootPath) {
        var GIT_DIR = gitRootPath;
        var tree, grid, gridStore;
        var treeStore = new Observable(
            new Memory({
                data: [
                    { id: 'Repo', name: 'Branches' },
                    { id: 'LR', name: 'Local branches', parent: 'Repo' },
                    { id: 'RR', name: 'Remote branches', parent: 'Repo' }
                ],
                getChildren: function (object) {
                    // Add a getChildren() method to store for the data model where
                    // children objects point to their parent (aka relational model)
                    return this.query({parent: object.id});
                }
            }));

        require(['text!./layer/branch.html',
                 'text!./layer/createbranch.html'], function (branchView, createBranchView) {
            var branchDialog = new ButtonedDialog({
                buttons: [
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: null,
                title: i18n.branchOrTag,
                onHide: function (evt) {
                    branchDialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            branchDialog.setContentArea(branchView);

            var branchRBtn = registry.byId('GitBranchRadioBtn');
            var tagRBtn = registry.byId('GitTagRadioBtn');
            var checkoutBtn = registry.byId('GitCheckoutBtn');
            var createBtn = registry.byId('GitCreateBtn');
            var removeBtn = registry.byId('GitRemoveBtn');

            function redrawTree() {
                var data = treeStore.query({
                    parent: new RegExp(/(L|R)R/)
                });

                if (data.length) {
                    data.forEach(function (data) {
                        treeStore.remove(data.id);
                    });
                }

                git.exec(GIT_DIR, ['branch', '-a'], function (err, data) {
                    if (err) {
                        gitviewlog.error(GIT_DIR, 'branch', err);
                    } else {
                        var localBranch = git.parseBranch(data)
                        .filter(function (branch) {
                            var m = branch.name.match(/remotes\//);
                            if (!m && branch.name.length) {
                                return branch;
                            }
                        }).forEach(function (branch) {
                            var node = {
                                id: 'lr_' + branch.name,
                                name: branch.name,
                                parent: 'LR',
                                current: false
                            };

                            if (branch.current) {
                                node.current = true;
                            }

                            treeStore.put(node);
                        });

                        var remoteBranch = git.parseBranch(data)
                        .filter(function (branch) {
                            var m = branch.name.match(/HEAD/);
                            var m1 = branch.name.match(/remotes\//);
                            if (!m && m1 && branch.name.length) {
                                return branch;
                            }
                        }).forEach(function (branch) {
                            var node = {
                                id: 'rr_' + branch.name,
                                name: branch.name,
                                parent: 'RR'
                            };

                            treeStore.put(node);
                        });
                    }
                });
            }

            dojo.connect(tagRBtn, 'onChange', function () {
                if (tagRBtn.checked) {
                    grid.selection.clear();
                    $('#GitTagGrid').show();
                } else {
                    $('#GitTagGrid').hide();
                }
            });

            dojo.connect(branchRBtn, 'onChange', function () {
                if (branchRBtn.checked) {
                    $('#GitBranchTree').show();
                    redrawTree();
                } else {
                    $('#GitBranchTree').hide();
                }
            });

            dojo.connect(createBtn, 'onClick', function () {
                var title;

                if (branchRBtn.checked) {
                    title = i18n.createBranch;
                } else {
                    title = i18n.createTag;
                }

                var createBranchDialog = new ButtonedDialog({
                    buttons: [
                        {
                            id: 'GitCreateBranchBtn',
                            caption: i18n.apply,
                            methodOnClick: 'gitCreate'
                        },
                        {
                            caption: i18n.close,
                            methodOnClick: 'hide'
                        }
                    ],
                    gitCreate: function () {
                        var target = createText.get('value');
                        var message = tagMsgText.get('value');
                        var sha = cCommitIdText.get('value');
                        var stBranch = cBranchSelect.get('value');
                        var stTag = cTagSelect.get('value');
                        var cmd = [];

                        if (target === '') {
                            notify.warning(i18n.enterName);
                            return;
                        }

                        if (branchRBtn.checked) {
                            if (cCheckoutChk.checked) {
                                cmd = cmd.concat(['checkout', '-b']);
                            } else {
                                cmd.push('branch');
                            }
                        } else {
                            if (message.length === 0) {
                                notify.warning(i18n.enterMessage);
                                return;
                            }

                            cmd.push('tag');
                        }

                        if (tagRBtn.checked) {
                            cmd = cmd.concat('-m', message);
                        }

                        if (cForceChk.checked) {
                            cmd.push('-f');
                        }

                        cmd.push(target);

                        switch (startPoint) {
                            case STR_HEAD:
                                cmd.push('HEAD');
                                break;
                            case STR_BRANCH:
                                cmd.push(stBranch);
                                break;
                            case STR_TAG:
                                if (stTag === '') {
                                    notify.warning(i18n.selectATag);
                                    return;
                                }

                                cmd.push(stTag);
                                break;
                            case STR_COMMIT:
                                if (sha === '') {
                                    notify.warning(i18n.enterCommitId);
                                    return;
                                }
                                cmd.push(sha);
                                break;
                        }

                        git.exec(GIT_DIR, cmd, function (err, stdout, stderr) {
                            if (err) {
                                gitviewlog.error(GIT_DIR, cmd[0], err);
                            } else {
                                var data = stdout + stderr;

                                if (data.match(/(fatal|error): .*/)) {
                                    notify.error(i18n.forMoreDetails, gitCreateError);
                                    gitviewlog.error(GIT_DIR, cmd[0], data);
                                } else {
                                    if (branchRBtn.checked) {
                                        redrawTree();
                                        refresh(gitRootPath);
                                        _selectedGitInfo(gitRootPath);
                                        gitviewlog.success(GIT_DIR, cmd[0], data);
                                    } else {
                                        gridStore.put({
                                            id: target,
                                            name: target,
                                            message: message
                                        });
                                        gitviewlog.success(GIT_DIR, cmd[0],
                                                           'Sucessfully ' + '\'' + target + '\' taged.');
                                    }

                                    notify.success(i18n.forMoreDetails, i18n.gitCreageSuccess);

                                }
                            }
                        });

                        createBranchDialog.hide();
                    },
                    methodOnEnter: null,
                    title: title,
                    onHide: function (evt) {
                        createBranchDialog.destroyRecursive();
                    }
                });
                createBranchDialog.setContentArea(createBranchView);

                var STR_HEAD = 0;
                var STR_BRANCH = 1;
                var STR_TAG = 2;
                var STR_COMMIT = 3;
                var createText = registry.byId('GitCreateTargetText');
                var cHEADRBtn = registry.byId('GitCreateHEADRadioBtn');
                var cBranchRBtn = registry.byId('GitCreateBranchRadioBtn');
                var cTagRBtn = registry.byId('GitCreateTagRadioBtn');
                var cCommitIdRBtn = registry.byId('GitCreateIdRadioBtn');
                var cCheckoutChk = registry.byId('GitCreateCheckoutChk');
                var cForceChk = registry.byId('GitCreateForce');
                var tagMsgText = registry.byId('GitCreateTagMsgText');
                var cBranchSelect = registry.byId('GitCreateBranchSelect');
                var cTagSelect = registry.byId('GitCreateTagsSelect');
                var cCommitIdText = registry.byId('GitCreateIdText');
                var createApplyBtn = registry.byId('GitCreateBranchBtn');
                var startPoint = STR_HEAD;

                //                var cCommitInfoBtn = registry.byId('GitCommitInfoBtn');

                if (branchRBtn.checked) {
                    createText.set('placeHolder',
                                   string.substitute(i18n.enterArgName, {arg: 'branch'}));
                } else {
                    $('#GitTagMessage').show();
                    createText.set('placeHolder',
                                   string.substitute(i18n.enterArgName, {arg: 'tag'}));
                    cCheckoutChk.set('disabled', true);
                }

                var branchQuery = treeStore.query({
                    parent: new RegExp(/(L|R)R/)
                });
                var tagData = gridStore.data.map(function (data) {
                    return {
                        label: data.name,
                        value: data.name
                    };
                });

                var branchData = branchQuery.map(function (data) {
                    return {
                        label: data.name,
                        value: data.name
                    };
                });

                cBranchSelect.set('options', branchData);
                cTagSelect.set('options', tagData);
                createBranchDialog.show();

                dojo.connect(cHEADRBtn, 'onChange', function () {
                    if (cHEADRBtn.checked) {
                        startPoint = STR_HEAD;
                    }
                });

                dojo.connect(cBranchRBtn, 'onChange', function () {
                    if (cBranchRBtn.checked) {
                        cBranchSelect.set('disabled', false);
                        startPoint = STR_BRANCH;
                    } else {
                        cBranchSelect.set('disabled', true);
                    }
                });

                dojo.connect(cTagRBtn, 'onChange', function () {
                    if (cTagRBtn.checked) {
                        cTagSelect.set('disabled', false);
                        startPoint = STR_TAG;
                    } else {
                        cTagSelect.set('disabled', true);
                    }
                });

                dojo.connect(cCommitIdRBtn, 'onChange', function () {
                    if (cCommitIdRBtn.checked) {
                        cCommitIdText.set('disabled', false);
                        startPoint = STR_COMMIT;
                        //                        cCommitInfoBtn.set('disabled', false);
                    } else {
                        cCommitIdText.set('disabled', true);
                        //                        cCommitInfoBtn.set('disabled', true);
                    }
                });

                dojo.connect(createText, 'onKeyUp', function () {
                    var tmp = createText.get('value');
                    var rt, MSG;

                    if (branchRBtn.checked) {
                        rt = treeStore.query({
                            parent: 'LR',
                            name: tmp
                        });

                        if (rt.length) {
                            MSG = string.substitute(i18n.alreadyExist, {arg: 'branch', name: tmp});
                            createApplyBtn.set('disabled', true);
                            $('#GitTargetInfoText').text(MSG).css({'color': 'red'});
                        } else {
                            $('#GitTargetInfoText').text('');
                            createApplyBtn.set('disabled', false);
                        }
                    } else {
                        rt = gridStore.query({
                            id: tmp
                        });

                        if (rt.length) {
                            MSG = string.substitute(i18n.alreadyExist, {arg: 'tag', name: tmp});
                            $('#GitTargetInfoText').text(MSG).css({'color': 'red'});
                            createApplyBtn.set('disabled', true);
                        } else {
                            $('#GitTargetInfoText').text('');
                            createApplyBtn.set('disabled', false);
                        }
                    }
                });
            });

            dojo.connect(checkoutBtn, 'onClick', function () {
                var MSG, targetName;

                // if branch radio button checked
                if (branchRBtn.checked) {
                    targetName = tree.selectedNode.label;
                    MSG = string.substitute(i18n.checkoutArg, {arg: 'branch', name: targetName});
                } else {
                    // if tag radio buttion checked
                    var item = grid.selection.getSelected();
                    targetName = item[0].name;
                    MSG = string.substitute(i18n.checkoutArg, {arg: 'tag', name: targetName});
                }

                PopupDialog.yesno({
                    title: 'Checkout',
                    message: MSG,
                    type: 'info'
                }).then(function () {
                    git.exec(GIT_DIR, ['checkout', targetName], function (err, stdout, stderr) {
                        if (err) {
                            gitviewlog.error(GIT_DIR, 'checkout', err);
                        } else {
                            var data = stdout + stderr;
                            if (data) {
                                if (data.match(/(fatal|error): .*/)) {
                                    notify.error(i18n.forMoreDetails, i18n.gitCheckoutError);
                                    gitviewlog.error(GIT_DIR, 'checkout', data);
                                } else {
                                    redrawTree();

                                    refresh(gitRootPath);
                                    _selectedGitInfo(gitRootPath);
                                    removeBtn.set('disabled', true);
                                    checkoutBtn.set('disabled', true);

                                    notify.success(i18n.forMoreDetails, i18n.gitCheckoutSuccess);
                                    gitviewlog.success(GIT_DIR, 'checkout', data);
                                }
                            }
                        }
                    });
                }, function () {
                    return;
                });
            });

            dojo.connect(removeBtn, 'onClick', function () {
                var MSG, targetName;

                if (branchRBtn.checked) {
                    targetName = tree.selectedNode.label;
                    MSG = string.substitute(i18n.deleteArg, {arg: 'branch', name: targetName});
                } else {
                    var item = grid.selection.getSelected();
                    targetName = item[0].name;
                    MSG = string.substitute(i18n.deleteArg, {arg: 'tag', name: targetName});
                }

                PopupDialog.yesno({
                    title: 'Remove',
                    message: MSG,
                    type: 'info'
                }).then(function () {
                    if (branchRBtn.checked) {
                        git.exec(GIT_DIR, ['branch', '-D', targetName], function (err, stdout, stderr) {
                            if (err) {
                                gitviewlog.error(GIT_DIR, 'branch delete', err);
                                notify.error(i18n.forMoreDetails, i18n.gitBranchDeleteError);
                            } else {
                                var data = stdout + stderr;
                                if (data.match(/(fatal|error): .*/)) {
                                    gitviewlog.error(GIT_DIR, 'branch delete', data);
                                    notify.error(i18n.forMoreDetails, i18n.gitBranchDeleteError);
                                } else {
                                    treeStore.remove(tree.selectedNode.item.id);
                                    removeBtn.set('disabled', true);
                                    checkoutBtn.set('disabled', true);

                                    notify.success('', i18n.gitBranchDeleteSuccess);
                                    gitviewlog.success(GIT_DIR, 'branch delete', data);
                                }
                            }
                        });
                    } else {
                        git.exec(GIT_DIR, ['tag', '-d', targetName], function (err, stdout, stderr) {
                            if (err) {
                                gitviewlog.error(GIT_DIR, 'tag delete', err);
                                notify.error(i18n.forMoreDetails, i18n.gitTagDeleteError);
                            } else {
                                var data = stdout + stderr;
                                if (data.match(/(fatal|error): .*/)) {
                                    gitviewlog.error(GIT_DIR, 'tag delete', data);
                                    notify.error(i18n.forMoreDetails, i18n.gitTagDeleteError);
                                } else {
                                    gridStore.remove(targetName);
                                    removeBtn.set('disabled', true);
                                    checkoutBtn.set('disabled', true);

                                    notify.success('', i18n.gitTagDeleteSuccess);
                                    gitviewlog.success(GIT_DIR, 'branch delete', data);
                                }
                            }
                        });
                    }
                }, function () {
                    return;
                });
            });

            async.parallel([
                function (next) {
                    git.exec(GIT_DIR, ['branch', '-a'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var localBranch = git.parseBranch(data)
                            .filter(function (branch) {
                                var m = branch.name.match(/remotes\//);
                                if (!m && branch.name.length) {
                                    return branch;
                                }
                            }).forEach(function (branch) {
                                var node = {
                                    id: 'lr_' + branch.name,
                                    name: branch.name,
                                    parent: 'LR',
                                    current: false
                                };

                                if (branch.current) {
                                    node.current = true;
                                }

                                treeStore.put(node);
                            });

                            var remoteBranch = git.parseBranch(data)
                            .filter(function (branch) {
                                var m = branch.name.match(/HEAD/);
                                var m1 = branch.name.match(/remotes\//);
                                if (!m && m1 && branch.name.length) {
                                    return branch;
                                }
                            }).forEach(function (branch) {
                                var node = {
                                    id: 'rr_' + branch.name,
                                    name: branch.name,
                                    parent: 'RR'
                                };

                                treeStore.put(node);
                            });

                            var myModel = new ObjectStoreModel({
                                store: treeStore,
                                query: { id: 'Repo' },
                                mayHaveChildren: function (item) {
                                    var children = this.store.getChildren(item);
                                    return children.length === 0 ? false : true;
                                }
                            });

                            tree = new Tree({
                                model: myModel,
                                style: 'height:250px;background:#fff;border:1px solid rgb(168, 168, 168);',
                                getLabelStyle: function (item, opened) {
                                    if (item.current === true) {
                                        return {
                                            'color': 'red',
                                            'font-weight': 'bold',
                                            'backgroundColor': 'yellow',
                                            'padding': '1px 5px 1px 5px',
                                            'border-radius': '3px'
                                        };
                                    } else {
                                        return {
                                            'color': 'black',
                                            'font-weight': '',
                                            'backgroundColor': ''
                                        };
                                    }
                                },
                                getIconClass: function (item, opened) {
                                    return (!item || this.model.mayHaveChildren(item)) ?
                                            (opened ? 'dijitFolderOpened' : 'dijitFolderClosed') :
                                            'dijitLeaf';
                                },
                                showRoot: false,
                                persist: false,
                                autoExpand: true,
                                openOnClick: true
                            }, dojo.query('#GitBranchTree')[0]);

                            tree.startup();

                            dojo.connect(tree, 'onClick', function (item) {
                                if (item.parent === 'LR') {
                                    if (item.current === true) {
                                        removeBtn.set('disabled', true);
                                        checkoutBtn.set('disabled', true);
                                    } else {
                                        removeBtn.set('disabled', false);
                                        checkoutBtn.set('disabled', false);
                                    }
                                } else {
                                    checkoutBtn.set('disabled', true);
                                    removeBtn.set('disabled', true);
                                }
                            });

                            next();
                        }
                    });
                },
                function (next) {
                    git.exec(GIT_DIR, ['tag', '-n', '--no-column'], function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var tag = git.parseTag(data);

                            gridStore = new Observable(new Memory({ data: tag }));

                            var layout = [[
                                {
                                    'name': 'Name',
                                    'field': 'name',
                                    'width': '25%'
                                }, {
                                    'name': 'Message',
                                    'field': 'message',
                                    'width': 'auto'
                                }
                            ]];

                            grid = new DataGrid({
                                store: new ObjectStore({ objectStore: gridStore }),
                                structure: layout,
                                noDataMessage: i18n.noDataToDisplay,
                                selectionMode: 'single',
                                style: 'width:100%',
                                onSelectionChanged: function () {
                                    var item = grid.selection.getSelected();

                                    if (item.length) {
                                        removeBtn.set('disabled', false);
                                        checkoutBtn.set('disabled', false);
                                    } else {
                                        removeBtn.set('disabled', true);
                                        checkoutBtn.set('disabled', true);
                                    }
                                }
                            }, dojo.query('#GitTagGrid')[0]);

                            grid.startup();
                            next();
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    gitviewlog.error(GIT_DIR, 'branch', err);
                } else {
                    branchDialog.show();
                    $('#GitTagGrid').css({ 'display' : 'none' });
                }
            });
        });
    }

    function _diff(gitRootPath, file, commitId) {
        require(['./git-commands-diff'], function (GitDiff) {
            var diff = new GitDiff();
            diff.execute(gitRootPath, file, commitId);
        });
    }

    function _status(gitRootPath) {
        var GIT_DIR = gitRootPath;

        git.exec(GIT_DIR, ['status'], function (err, data) {
            if (err) {
                gitviewlog.error(GIT_DIR, 'status', err);
            } else {
                gitviewlog.success(GIT_DIR, 'status', data);
            }
        });
    }

    function _submodule(gitRootPath) {
        var GIT_DIR = gitRootPath;

        git.exec(GIT_DIR, ['submodule', 'update'], function (err, stdout, stderr) {
            if (err) {
                notify.error('', i18n.gitSubmoduleError);
                gitviewlog.error(GIT_DIR, 'submodule', err);
            } else {
                var data = stdout + stderr;

                if (data) {
                    if (data.match(/(fatal|error): .*/)) {
                        gitviewlog.error(GIT_DIR, 'submodule', data);
                        notify.error(i18n.forMoreDetails, i18n.gitSubmoduleError);
                    } else {
                        notify.success('', 'Git Submodule Success');
                        gitviewlog.success(GIT_DIR, 'submodule', data);
                    }
                } else {
                    notify.info('', i18n.gitSubmoduleError);
                    gitviewlog.info(GIT_DIR, 'submodule', 'Already up-to-date.');
                }
            }
        });
    }

    function _runCommand(selectedPath, gitRootPath) {
        require(['text!./layer/runcommand.html'], function (runCommandView) {
            var button, commandInput;

            function parse(str, lookForQuotes) {
                var args = [];
                var readingPart = false;
                var part = '';
                for (var i = 0; i < str.length; i++) {
                    if (str.charAt(i) === ' ' && !readingPart) {
                        args.push(part);
                        part = '';
                    } else {
                        if (str.charAt(i) === '\"' && lookForQuotes) {
                            readingPart = !readingPart;
                        } else {
                            part += str.charAt(i);
                        }
                    }
                }
                if (part !== '') {
                    args.push(part);
                }
                return args;
            }

            function runEvent() {
                var argStr = commandInput.get('value').trim();
                var args = parse(argStr, true);
                var path = gitRootPath || selectedPath;
                var jobId = workbench.addJob(string.substitute(i18n.gitProcessing, {arg: argStr}));

                git.exec(path, args, function (err, stdout, stderr) {
                    var logTitle = 'command: git ' + argStr;
                    workbench.removeJob(jobId);
                    if (err) {
                        gitviewlog.error(path, logTitle, err);
                        notify.error(i18n.forMoreDetails, i18n.gitCommandError);
                    } else {
                        var data = stdout + stderr;
                        if (data.match(/(fatal|error): .*/)) {
                            gitviewlog.error(path, logTitle, data);
                            notify.error(i18n.forMoreDetails, i18n.gitCommandError);
                        } else {
                            notify.success('', i18n.gitCommandSuccess);
                            gitviewlog.success(path, logTitle, data);
                            refresh(path, true);
                        }
                    }
                });
            }
            var dialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'GitRunCommandBtn',
                        caption: i18n.run,
                        methodOnClick: 'runGitCommand',
                        disabledOnShow: true
                    },
                    {
                        caption: i18n.close,
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: 'runGitCommand',
                runGitCommand: function () {
                    if (button.disabled) {
                        return;
                    }
                    runEvent();
                    dialog.hide();
                },

                title: i18n.runGitCommand,
                onHide: function (evt) {
                    dialog.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });
            dialog.setContentArea(runCommandView);
            commandInput = registry.byId('GitRunCommandInput');
            button = registry.byId('GitRunCommandBtn');
            dialog.show();
            commandInput.set('placeHolder', '<Git command arguments> eg. commit -a -m "test"');

            dojo.connect(commandInput, 'onKeyUp', function (event) {
                var inputValue = commandInput.get('value');
                if (inputValue === '') {
                    button.set({
                        disabled: true
                    });
                } else {
                    button.set({
                        disabled: false
                    });
                }
            });
        });
    }

    // end of Git commands

    //
    // Git Extension
    //

    // convert context menu function
    function add() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _add(gitRootPath);
        }
    }
    function untrack() {
        var selectedPaths = wv.getSelectedPaths();
        if (selectedPaths[0]) {
            var gitRootPath = git.findGitRootPath(selectedPaths[0]);
            var relPaths;

            // if node is git Root directory
            if (gitRootPath === selectedPaths[0]) {
                relPaths = ['.'];
            } else {
                // extract relative path
                relPaths = selectedPaths.map(function (value) {
                    return value.replace(gitRootPath, '');
                })
            }

            _untrack(gitRootPath, relPaths);
        }
    }
    function remove() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _remove(gitRootPath);
        }
    }
    function commit() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _commit(gitRootPath);
        }
    }
    function resetToCommit() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _resetToCommit(gitRootPath);
        }
    }
    function stash() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _stash(gitRootPath);
        }
    }
    function unstash() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _unstash(gitRootPath);
        }
    }
    function revert() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _revert(gitRootPath);
        }
    }
    function rebase() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _rebase(gitRootPath);
        }
    }
    function merge() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _merge(gitRootPath);
        }
    }
    function branch() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _branch(gitRootPath);
        }
    }
    function historyFile() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            var relPath = null;

            // if node is git Root directory
            if (gitRootPath === selectedPath) {
                relPath = '.';
            } else {
                // extract relative path
                relPath = selectedPath.replace(gitRootPath, '');
            }

            _history(gitRootPath, relPath);
        }
    }
    function historyRepo() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _history(gitRootPath, '.');
        }
    }
    function preference() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _preference(gitRootPath);
        }
    }
    function push() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _push(gitRootPath);
        }
    }
    function fetch() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _fetch(gitRootPath);
        }
    }
    function pull() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _pull(gitRootPath);
        }
    }
    function remote() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _remote(gitRootPath);
        }
    }
    function clone() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            _clone(selectedPath);
        } else {
            _clone(wv.getRootPath());
        }
    }
    function createRepo() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            _createRepo(selectedPath);
        } else {
            _createRepo(wv.getRootPath());
        }
    }
    function blame() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            var relPath = selectedPath.replace(gitRootPath, '');
            _blame(gitRootPath, relPath);
        }
    }
    function compare() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _compare(gitRootPath, false);
        }
    }
    function status() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _status(gitRootPath);
        }
    }

    function submodule() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _submodule(gitRootPath);
        }
    }
    function runCommand() {
        var selectedPath = wv.getSelectedPath();
        if (selectedPath) {
            var gitRootPath = git.findGitRootPath(selectedPath);
            _runCommand(selectedPath, gitRootPath);
        }
    }
    // End - convert context menu function

    return {
        add: add,
        remove: remove,
        untrack: untrack,
        commit: commit,
        resetToCommit: resetToCommit,
        stash: stash,
        status: status,
        unstash: unstash,
        revert: revert,
        rebase: rebase,
        merge: merge,
        branch: branch,
        historyFile: historyFile,
        historyRepo: historyRepo,
        preference: preference,
        push: push,
        fetch: fetch,
        pull: pull,
        remote: remote,
        clone: clone,
        createRepo: createRepo,
        blame: blame,
        compare: compare,
        submodule: submodule,
        runCommand: runCommand
    };
});
