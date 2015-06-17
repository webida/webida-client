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

define([
    'webida-lib/util/path',
    'webida-lib/plugins/workspace/plugin',
    './git-core'
], function (pathUtil, wv, git) {

    'use strict';

    function gitTopLevelMenuItems() {
        var commands;
        var path = wv.getSelectedPath() || wv.getRootPath();

        if (path && !git.isInDotGitDir(path)) {
            var gitRootPath = git.findGitRootPath(path);
            // if directory is git project, show git command in the Context menu
            if (gitRootPath) {
                commands = {
                    '&Add to Stage': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'add' ],
                    'Remove from Stage': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'remove' ],
                    'Untrack': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'untrack' ],
                    '&Commit': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'commit' ],
                    'Reset to Commit': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'resetToCommit' ],
                    'Stash Changes': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'stash' ],
                    'Unstash Changes': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'unstash' ],
                    'Checkout from Stage': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'revert' ],
                    'Re&base': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'rebase' ],
                    '&Merge': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'merge' ],
                    'B&ranches': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'branch' ],
                    '&Status': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'status' ],
                    'Show File History': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'historyFile' ],
                    'Show Repository History': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'historyRepo' ],
                    'Confi&gure': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'preference' ],
                    'Run Git Command': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'runCommand' ],
                    '&Push': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'push' ],
                    '&Fetch': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'fetch' ],
                    'P&ull': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'pull' ],
                    'Update Submodules' : [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'submodule' ],
                    'Remotes': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'remote' ]
                };

                if (!pathUtil.isDirPath(path)) {
                    commands.Blame = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'blame' ];
                    commands['Compar&e'] = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'compare' ];
                }
            } else {
                commands = {};
            }

            // if node is directory, show git clone menu in the Context menu
            if (pathUtil.isDirPath(path)) {
                commands['Clone from URL'] = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'clone' ];
                commands['New Repository'] = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'createRepo' ];
                commands['Run Git Command'] = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'runCommand' ];
            }

            return commands;
        } else {
            return null;
        }
    }

    function gitContextMenuItems() {

        var commands;
        var path = wv.getSelectedPath() || wv.getRootPath();
        if (path && !git.isInDotGitDir(path)) {
            var gitRootPath = git.findGitRootPath(path);
            // if directory is git project, show git command in the Context menu
            if (gitRootPath) {
                commands = {
                    '&Add to Stage': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'add' ],
                    'Remove from Stage': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'remove' ],
                    'Untrack': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'untrack' ],
                    '&Commit': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'commit' ],
                    'Reset to Commit': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'resetToCommit' ],
                    'Stash Changes': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'stash' ],
                    'Unstash Changes': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'unstash' ],
                    'Checkout from Stage': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'revert' ],
                    'Re&base': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'rebase' ],
                    '&Merge': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'merge' ],
                    'B&ranches': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'branch' ],
                    '&Status': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'status' ],
                    'Show File History': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'historyFile' ],
                    'Show Repository History': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'historyRepo' ],
                    'Confi&gure': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'preference' ],
                    'Run Git Command': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'runCommand' ],
                    '&Push': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'push' ],
                    '&Fetch': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'fetch' ],
                    'P&ull': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'pull' ],
                    'Update Submodules' : [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'submodule' ],
                    'Remotes': [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'remote' ]
                };

                if (!pathUtil.isDirPath(path)) {
                    commands.Blame = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'blame' ];
                    commands['Compar&e'] = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'compare' ];
                }
            } else {
                commands = {};
            }

            // if node is directory, show git clone menu in the Context menu
            if (pathUtil.isDirPath(path)) {
                commands['Clone from URL'] = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'clone' ];
                commands['New Repository'] = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'createRepo' ];
                commands['Run Git Command'] = [ 'cmnd', 'webida-lib/plugins/git/git-commands', 'runCommand' ];
            }

            return {
                '&Git': commands
            };
        } else {
            return null;
        }
    }

    return {
        gitTopLevelMenuItems: gitTopLevelMenuItems,
        gitContextMenuItems: gitContextMenuItems,
    };
});
