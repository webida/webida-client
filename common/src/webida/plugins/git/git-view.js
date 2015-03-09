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

/* global timedLogger: true */

var time;
define([
    (time = timedLogger.getLoggerTime(), 'dojo/topic'),
    'webida-lib/plugins/workspace/plugin',
    './git-core',
    './gitview-log',
    'text!./layer/gitviewtoolbarcontent.html',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/widgets/views/view',
    'webida-lib/widgets/views/viewToolbar',
    'webida-lib/util/path',
    'dijit/form/Button',
    'require'
], function (topic,
              wv,
              git,
              gitviewlog,
              toolbarContentTmpl,
              workbench,
              View,
              ViewToolbar,
              pathUtil,
              Button,
              require) {

    'use strict';

    time = timedLogger.log('loaded modules required by git-view. initializing git-view\'s module', time);

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

            // 선택된 node가 디렉터리일 경우 blame / compare 기능 disable
            if (pathUtil.isDirPath(path)) {
                blameNode.addClass('disabled');
                compareNode.addClass('disabled');
                cloneNode.removeClass('disabled');
                createRespoNode.removeClass('disabled');
            } else {
                // 기존에 등록되어 있던 click 이벤트 제거
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

                        var path = 'Selected Git project: ' + GIT_DIR + ' [' + curBranch + ']';

                        statusbar.text(path);
                    }
                });
            } else {
                statusbar.text('Selected Git project: none');
            }
        }
    }

    var gitView;
    function getView() {
        var view = new View('gitviewTab', 'Git');
        view.setContent('<div id="gitViewTab" style="width:100%; height:100%">');
        gitView = view;

        return view;
    }

    function onViewAppended() {

        var view = gitView;
        if (view) {
            var opt = {};
            opt.title = 'Git';
            opt.key = 'G';
            workbench.registToViewFocusList(view, opt);
        }

        var GIT_TOOLBAR_MENU_WIDTH = 672;


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
                label: 'Clear',
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

                require(['./git-commands'], function (gitCmds) {
                    var command = $(self).attr('data-command');
                    switch (command) {
                    case 'add':
                        gitCmds.add();
                        break;
                    case 'remove':
                        gitCmds.remove();
                        break;
                    case 'untrack':
                        gitCmds.untrack();
                        break;
                    case 'commit':
                        gitCmds.commit();
                        break;
                    case 'resetToCommit' :
                        gitCmds.resetToCommit();
                        break;
                    case 'stash':
                        gitCmds.stash();
                        break;
                    case 'unstash':
                        gitCmds.unstash();
                        break;
                    case 'revert':
                        gitCmds.revert();
                        break;
                    case 'rebase':
                        gitCmds.rebase();
                        break;
                    case 'merge':
                        gitCmds.merge();
                        break;
                    case 'branch':
                        gitCmds.branch();
                        break;
                    case 'status':
                        gitCmds.status();
                        break;
                    case 'historyFile':
                        gitCmds.historyFile();
                        break;
                    case 'historyRepo':
                        gitCmds.historyRepo();
                        break;
                    case 'preference':
                        gitCmds.preference();
                        break;
                    case 'push':
                        gitCmds.push();
                        break;
                    case 'fetch':
                        gitCmds.fetch();
                        break;
                    case 'pull':
                        gitCmds.pull();
                        break;
                    case 'remote':
                        gitCmds.remote();
                        break;
                    case 'clone':
                        gitCmds.clone();
                        break;
                    case 'createRepo':
                        gitCmds.createRepo();
                        break;
                    case 'blame':
                        gitCmds.blame();
                        break;
                    case 'compare':
                        gitCmds.compare();
                        break;
                    case 'submodule':
                        gitCmds.submodule();
                        break;
                    }
                });
            });

            topic.subscribe('workspace.node.selected', _displayGitView);
            topic.subscribe('workspace.node.selected', _seletedGitinfo);
        });
    }

    timedLogger.log('initialized git-view\'s module', time);

    return {
        getView: getView,
        onViewAppended: onViewAppended
    };
});
