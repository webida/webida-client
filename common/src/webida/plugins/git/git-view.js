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
 * @file This file shows up the tab for git menu and git log
 * @since 1.0.0
 * @author hyunik.na@samsung.com
 * @author minsung.jin@samsung.com
 */
define([
    './git-core',
    './gitview-log',
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'dijit/form/Button',
    'require',
    'text!./layer/gitviewtoolbarcontent.html',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/path',
    'webida-lib/widgets/views/view',
    'webida-lib/widgets/views/viewToolbar'
], function (
    git,
    gitviewlog,
    i18n,
    topic,
    Button,
    require,
    toolbarContentTmpl,
    workbench,
    wv,
    Logger,
    pathUtil,
    View,
    ViewToolbar
) {
    'use strict';

    var singleLogger = new Logger.getSingleton();
    //var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    singleLogger.log('loaded modules required by git-view. initializing git-view\'s module');

    var oldGitDir = null;
    function _displayGitView(path) {
        var newGitDir = git.findGitRootPath(path);
        var blameNode = $('div.gv-menuitem[data-command="blame"]');
        var compareNode =  $('div.gv-menuitem[data-command="compare"]');
        var cloneNode =  $('div.gv-menuitem[data-command="clone"]');
        var createRespoNode =  $('div.gv-menuitem[data-command="createRepo"]');
        var tbIconList = $('div.gv-menuitem');

        var selected = wv.getSelectedPaths();
        if (selected && selected.length > 1) {
            tbIconList.each(function (idx, item) {
                var hasDisabled = $(item).hasClass('disabled');

                if (!hasDisabled) {
                    $(item).addClass('disabled');
                }
            });
            return;
        }

        // check whether selected node is git project
        if (newGitDir) {

            tbIconList.each(function (idx, item) {
                var hasDisabled = $(item).hasClass('disabled');

                if (hasDisabled) {
                    $(item).removeClass('disabled');
                }
            });

            // If the selected node was directory it to disable comprare, blame.
            if (pathUtil.isDirPath(path)) {
                blameNode.addClass('disabled');
                compareNode.addClass('disabled');
                cloneNode.removeClass('disabled');
                createRespoNode.removeClass('disabled');
            } else {
                // remove click event that was registered in the existing.
                blameNode.removeClass('disabled');
                compareNode.removeClass('disabled');
                cloneNode.addClass('disabled');
                createRespoNode.addClass('disabled');
            }
        } else {
            tbIconList.each(function (idx, item) {
                var hasDisabled = $(item).hasClass('disabled');

                if (hasDisabled) {
                    return;
                }

                $(item).addClass('disabled');
            });

            if (pathUtil.isDirPath(path)) {
                cloneNode.removeClass('disabled');
                createRespoNode.removeClass('disabled');
            } else {
                cloneNode.addClass('disabled');
                createRespoNode.addClass('disabled');
            }
        }

        oldGitDir = newGitDir;
    }

    var lastGitRoot;
    function _seletedGitinfo(path) {
        //console.log('hina temp: entering  _seletedGitinfo() with node ' + path);
        var statusbar = $('.gv-toolbar-statusbar .gv-selectedpath');
        var gitroot = git.findGitRootPath(path);

        if (gitroot !== lastGitRoot) {
            lastGitRoot = gitroot;
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

                        var path = i18n.selectedGitProject + GIT_DIR + ' [' + curBranch + ']';

                        statusbar.text(path);
                    }
                });
            } else {
                statusbar.text(i18n.selectedGitProject + i18n.none);
            }
        }
    }

    var gitView;
    /**
     * Get restricted git view
     */
    function getView() {
        var view = new View('gitviewTab', i18n.git);
        view.setContent('<div id="gitViewTab" style="width:100%; height:100%">');
        gitView = view;

        return view;
    }
    /**
     * Called when view is appended
     */
    function onViewAppended() {

        var GIT_TOOLBAR_MENU_WIDTH = 672;
        var view = gitView;
        if (view) {
            var opt = {};
            opt.title = i18n.git;
            opt.key = 'G';
            workbench.registToViewFocusList(view, opt);
        }
        require(['text!./layer/gitview.html'], function (gitView) {
            gitView = gitView.replace('%WEBIDA-LIB%', require.toUrl('webida-lib'));
            $('#gitViewTab').append(gitView);

            var vt = new ViewToolbar($('.gv-toolbar')[0], view.contentPane);
            vt.setContent(toolbarContentTmpl);
            vt.setContentSize(GIT_TOOLBAR_MENU_WIDTH);
            var selectedPath = wv.getSelectedPath();
            if (!selectedPath) {
                var tbIconList = $('div.gv-menuitem');

                tbIconList.each(function (idx, item) {
                    $(item).addClass('disabled');
                });
            }

            void new Button({
                label: i18n.clear,
                style: 'position:absolute; right:5px',
                onClick: function () {
                    var contents = dojo.query('.gv-contents');
                    contents.empty();
                    gitviewlog.clear();
                }
            }, dojo.query('.gv-clearbtn')[0]);

            $('div.gv-menuitem').click(function () {
                var self = this;

                var hasDisabled = $(self).hasClass('disabled');
                if (hasDisabled) {
                    return;
                }

                require(['webida-lib/plugins/command-system/system/command-system'],
                        function (commandSystem) {
                    var command = $(self).attr('data-command');
                    var commandService = commandSystem.service;
                    switch (command) {
                    case 'add':
                        commandService.requestExecution('git-add');
                        break;
                    case 'remove':
                        commandService.requestExecution('git-remove');
                        break;
                    case 'untrack':
                        commandService.requestExecution('git-untrack');
                        break;
                    case 'commit':
                        commandService.requestExecution('git-commit');
                        break;
                    case 'resetToCommit' :
                        commandService.requestExecution('git-reset-to-commit');
                        break;
                    case 'stash':
                        commandService.requestExecution('git-stash');
                        break;
                    case 'unstash':
                        commandService.requestExecution('git-unstash');
                        break;
                    case 'revert':
                        commandService.requestExecution('git-checkout');
                        break;
                    case 'rebase':
                        commandService.requestExecution('git-rebase');
                        break;
                    case 'merge':
                        commandService.requestExecution('git-merge');
                        break;
                    case 'branch':
                        commandService.requestExecution('git-branch');
                        break;
                    case 'status':
                        commandService.requestExecution('git-status');
                        break;
                    case 'historyFile':
                        commandService.requestExecution('git-file-history');
                        break;
                    case 'historyRepo':
                        commandService.requestExecution('git-repository-history');
                        break;
                    case 'preference':
                        commandService.requestExecution('git-configure');
                        break;
                    case 'push':
                        commandService.requestExecution('git-push');
                        break;
                    case 'fetch':
                        commandService.requestExecution('git-fetch');
                        break;
                    case 'pull':
                        commandService.requestExecution('git-pull');
                        break;
                    case 'remote':
                        commandService.requestExecution('git-remote');
                        break;
                    case 'clone':
                        commandService.requestExecution('git-clone');
                        break;
                    case 'createRepo':
                        commandService.requestExecution('git-create-repository');
                        break;
                    case 'blame':
                        commandService.requestExecution('git-blame');
                        break;
                    case 'compare':
                        commandService.requestExecution('git-compare');
                        break;
                    case 'submodule':
                        commandService.requestExecution('git-update-submodule');
                        break;
                    }
                });
            });

            topic.subscribe('workspace/node/selected', _displayGitView);
            topic.subscribe('workspace/node/selected', _seletedGitinfo);
        });
    }

    singleLogger.log('initialized git-view\'s module');

    return {
        getView: getView,
        onViewAppended: onViewAppended
    };
});

