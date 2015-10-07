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

define([
	'require',
    'dojo/topic',
    'webida-lib/plugins/workspace/plugin',
    './git-core',
    'webida-lib/app',
    'webida-lib/util/path',
    'plugins/webida.notification/notification-message',
    'webida-lib/util/logger/logger-client'
], function (
	require, 
	topic, 
	wv, 
	git, 
	ide, 
	pathUtil, 
	toastr, 
	Logger
) {

    'use strict';

	var singleLogger = new Logger.getSingleton();
	//var logger = new Logger();
	//logger.setConfig('level', Logger.LEVELS.log);
	//logger.off();

    var THROTTLE_DELAY = 100;
    var EMPTY_MAP = {};
    var GIT_OVERLAY_ICON_STATE_MAP_KEY = 'gitStatus';
    var pendingIconUpdates = {};
    var lastGitStatusResults = {};
    var fsCache = ide.getFSCache();

    function _loadCss(url) {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    _loadCss(require.toUrl('./git.css'));

    function codeToIconInfo(code) {
        switch (code) {
        case 'DD':
        case 'AU':
        case 'UD':
        case 'UA':
        case 'DU':
        case 'AA':
        case 'UU':
            return 'gitConflicted';
        default:
            var indexCode = code[0];
            if (indexCode === ' ') {
                console.assert(code[1] === 'M', 'Assertion fail: working set code must be M');
                return 'gitModified';
            } else {
                switch (indexCode) {
                case 'D' :
                    return 'gitRemoved';
                case 'A' :
                    return 'gitAdded';
                default:	// M, R, C
                    return 'gitChanged';
                }
            }
        }
    }
    
    function setGitOverlayIconState(nodePath, newState) {
        topic.publish('workspace.node.overlayicon.state.changed', nodePath, GIT_OVERLAY_ICON_STATE_MAP_KEY, newState); 
    }

    function unsetIconInfoWithin(path, repoPath) {
        console.assert(pathUtil.isDirPath(path));

        var myRepoPath = git.findGitRootPath(path);
        if (myRepoPath === repoPath) {
            setGitOverlayIconState(path, undefined);
            var subpaths;
            if ((subpaths = wv.getChildrenPaths(path))) {
                subpaths.forEach(function (subpath) {
                    if (pathUtil.isDirPath(subpath)) {
                        unsetIconInfoWithin(subpath, repoPath);
                    } else {                        
                        setGitOverlayIconState(subpath, undefined);
                    }
                });
            }
        }
    }

    function unsetIconInfo(repoPath) {
        if (wv.exists(repoPath) && pathUtil.isDirPath(repoPath)) {            
            setGitOverlayIconState(repoPath, undefined);
            var subpaths = wv.getChildrenPaths(repoPath);
            if (subpaths) {
                subpaths.forEach(function (subpath) {
                    if (pathUtil.getName(subpath) !== '.git') {
                        if (pathUtil.isDirPath(subpath)) {
                            unsetIconInfoWithin(subpath, repoPath);
                        } else {                            
                            setGitOverlayIconState(subpath, undefined);
                        }
                    }
                });
            }
        } else {
            console.warn('No directory node in the workspace at ' + repoPath);
            console.warn('Cannot upset icon info withint that path');
        }
    }

    function setIconInfo(repoPath, pathToCode) {
        function setIconInfoOfSubnodes(path) {
            var ret = false;
            var subpaths = wv.getChildrenPaths(path);
            var len = subpaths.length;
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    ret = setIconInfoWithin(subpaths[i]) || ret;
                }
            } else {
                var absPath = pathUtil.detachSlash(path);
                var relPath = absPath.substr(repoPath.length);
                var paths = Object.keys(pathToCode);
                ret = paths.some(function (p) {
                    var code;
                    return p.indexOf(relPath) === 0 &&
                        (code = pathToCode[p]) !== '??' && code !== '!!';
                });
            }
            return ret;
        }

        function setIconInfoWithin(path) {
            var myRepoPath = git.findGitRootPath(path);
            if (myRepoPath !== repoPath) {
                return;		// another git repo in a subdirectory
            }

            var absPath = pathUtil.detachSlash(path);
            if (absPath === repoPath + '.git') {
                if (pathUtil.isDirPath(path)) {
                    unsetIconInfoWithin(path, repoPath);
                } else {                    
                    setGitOverlayIconState(path, undefined);
                }
            } else {
                var relPath = absPath.substr(repoPath.length);
                var code = pathToCode[relPath] || pathToCode[relPath + '/'];
                if (code === '??') {
                    // untracked
                    setFixedIconInfoWithin(path, 'gitUntracked');
                    return false;
                } else if (code === '!!') {
                    // ignored
                    setFixedIconInfoWithin(path, 'gitIgnored');
                    return false;
                } else {
                    var modified = false;
                    if (pathUtil.isDirPath(path)) {
                        modified = setIconInfoOfSubnodes(path);
                        if (modified) {                            
                            setGitOverlayIconState(path, 'gitModified');
                        } else {                            
                            setGitOverlayIconState(path, 'gitTracked');
                        }
                    } else {
                        if (code) {
                            modified = true;                            
                            setGitOverlayIconState(path, codeToIconInfo(code));
                        } else {
                            setGitOverlayIconState(path, 'gitTracked');
                        }
                    }
                    return modified;
                }
            }
        }

        function setFixedIconInfoWithin(path, iconInfo) {
            setGitOverlayIconState(path, iconInfo);
            if (pathUtil.isDirPath(path)) {
                var subpaths = wv.getChildrenPaths(path);
                subpaths.forEach(function (p) {
                    setFixedIconInfoWithin(p, iconInfo);
                });
            }
        }

        if (wv.exists(repoPath)) {
            setIconInfoOfSubnodes(repoPath);
        } else {
            console.warn('The node ' + repoPath + ' was gone during the throttle delay');
        }

        singleLogger.log('done with setting icon info for repo "' + repoPath + '"');
    }

    function callSetIconInfo(repoPath) {
        var update = pendingIconUpdates[repoPath];
        if (update) {
            if (update.pathToCode) {
                setIconInfo(repoPath, update.pathToCode);
                pendingIconUpdates[repoPath] = null;
            } else {
                singleLogger.log('sending git status request for ' + repoPath);
                git.exec(repoPath, ['status', '--ignored', '-z'], function (err, stdout, stderr) {
                    singleLogger.log('received the response to the git status request for ' + repoPath);
                    if (err) {
                        toastr.error('git status failed for ' + repoPath + ' (' + err + ')');
                    } else if (stderr) {
                        console.log('git status emitted stderr msg for ' + repoPath + ' (' + stderr + ')');
                    } else {
                        var pathToCode = stdout ? git.parseStatusZ(stdout) : EMPTY_MAP;
                        if (pathToCode) {
                            lastGitStatusResults[repoPath] = pathToCode;
                            setIconInfo(repoPath, pathToCode);
                        } else {
                            console.error('failed to parse a git status result for ' + repoPath);
                            console.log('	stdout = "' + stdout + '"');
                        }
                    }

                    pendingIconUpdates[repoPath] = null;
                });
            }
        }
    }

    function throttleIconInfoSetting(repoPath, initiator, pathToCode) {
        //console.log('hina temp: entering throttleIconInfoSetting(), initiator = ' + initiator);
        var pendingUpdate = pendingIconUpdates[repoPath];
        if (pendingUpdate) {
            //console.log('hina temp: returning in throttleIconInfoSetting()');
            if (!pendingUpdate.pathToCode && pathToCode) {
                console.warn('note: pathToCode is set later.');
            }
            pendingUpdate.pathToCode = pathToCode;
            return;
        } else {
            pendingIconUpdates[repoPath] = { pathToCode: pathToCode };
            setTimeout(callSetIconInfo.bind(null, repoPath), THROTTLE_DELAY);
        }
    }

    function detectGitRepo(path) {
        if (pathUtil.getName(path) === '.git') {
            var parentPath = pathUtil.getParentPath(path);
            singleLogger.log('sending the first git status request for ' + parentPath);
            git.exec(parentPath, ['status', '--ignored', '-z'], function (err, stdout, stderr) {
                function restoreSubmoduleIcons(path, repoPath) {
                    if (git.findGitRootPath(path) !== repoPath) {
                        return;
                    }

                    var subpaths = wv.getChildrenPaths(path);
                    if (subpaths) {
                        subpaths.forEach(function (p) {
                            if (pathUtil.isDirPath(p)) {
                                restoreSubmoduleIcons(p, repoPath);
                            } else {
                                if (pathUtil.getName(p) === '.git') {
                                    detectGitRepo(p);
                                }
                            }
                        });
                    }
                }

                singleLogger.log('received the response to the first git status request for ' +
                                parentPath);
                if (err) {
                    toastr.error('git status failed for ' + parentPath + ' (' + err + ')');
                } else if (stderr) {
                    console.log('git status emitted stderr msg for ' + parentPath + ' (' +
                                stderr + ')');
                } else {
                    var pathToCode = stdout ? git.parseStatusZ(stdout) : EMPTY_MAP;
                    if (pathToCode) {
                        lastGitStatusResults[parentPath] = pathToCode;
                        if (pathUtil.isDirPath(path)) {
                            git.recordGitRepoPath(parentPath);
                            setGitOverlayIconState(parentPath, 'gitRepoTop');
                            throttleIconInfoSetting(parentPath, path + '@A', pathToCode);
                            var subpaths = wv.getChildrenPaths(parentPath);
                            if (subpaths) {
                                subpaths.forEach(function (p) {
                                    if (pathUtil.isDirPath(p) && pathUtil.getName(p) !== '.git') {
                                        restoreSubmoduleIcons(p, parentPath);
                                    }
                                });
                            }
                        } else {
                            fsCache.readFile(path, function (err, content) {
                                function getRepoTopPath(content) {
                                    var i = content.indexOf('gitdir: ');
                                    if (i < 0) {
                                        return null;
                                    }

                                    i += 8;
                                    var level = 0;
                                    var repoTopPath = parentPath;
                                    while (content.indexOf('../', i) === i) {
                                        level++;
                                        i += 3;
                                        repoTopPath = pathUtil.getParentPath(repoTopPath);
                                    }

                                    return (content.indexOf('.git/modules/', i) === i) ?
                                        repoTopPath : null;
                                }

                                if (err) {
                                    toastr.error('Failed to read a file ' + path + ' (' +
                                                 err + ')');
                                } else {
                                    var repoTopPath = getRepoTopPath(content);
                                    if (repoTopPath) {
                                        //console.log('hina temp: found a git repo top: ' +
                                        //            repoTopNode.getPath());
                                        git.recordGitRepoPath(parentPath, repoTopPath);                                        
                                        setGitOverlayIconState(parentPath, 'gitSubmodule');
                                        
                                    } else {
                                        console.warn('Expected ' + path + ' to be a git submodule, ' +
                                                     'but could not find its top repository');
                                        git.recordGitRepoPath(parentPath);                                        
                                        setGitOverlayIconState(parentPath, 'gitRepoTop');
                                    }
                                    throttleIconInfoSetting(parentPath, path + '@A-Sub', pathToCode);
                                }
                            });
                        }
                    } else {
                        console.error('failed to parse a git status result for ' + parentPath);
                        console.log('	stdout = "' + stdout + '"');
                    }
                }
            });
        }
    }

    function detectGitRepoDeletion(path) {
        // CAUTION: node was detached from the tree
        var repoPath;
        var isDir = pathUtil.isDirPath(path);
        if (pathUtil.getName(path) === '.git' &&
            (repoPath = git.findGitRootPath(path)) &&
            repoPath + '.git' === pathUtil.detachSlash(path)) {
            if (isDir) {
                var submodules = git.getSubmodules(repoPath);
                if (submodules) {
                    submodules.forEach(function (submodule) {
                        unsetIconInfo(submodule);
                    });
                }
                unsetIconInfo(repoPath);
            }

            git.unrecordGitRepoPath(repoPath);

            if (!isDir) {
                refreshGitIconsInRepoOf(path);
            }

        } else if (isDir) {
            git.unrecordGitRepoPathsUnder(path);
        }
    }

    // mainly for the case when a directory node is expanded and its subentries appear.
    function detectNodeWithoutIcon(path, maybeCreated) {
        var repoPath = git.findGitRootPath(path);
        if (repoPath && !git.isInDotGitDir(path) && !wv.getNodeOverlayIconInfo(path, GIT_OVERLAY_ICON_STATE_MAP_KEY)) {
            throttleIconInfoSetting(repoPath, path + '@B',
                                    maybeCreated ? undefined : lastGitStatusResults[repoPath]);
        }
    }

    function handleNodeAddEventInGitRepo(fsURL, targetDir, name, type, maybeCreated) {
        if (maybeCreated) {
            refreshGitIconsInRepoOf(targetDir + name);
        }
    }

    function handleNodeDelEventInGitRepo(fsURL, targetDir, name/*, type*/) {
        refreshGitIconsInRepoOf(targetDir + name);
    }

    function handleNodeChangesEventInGitRepo(fsURL, targetDir) {
        refreshGitIconsInRepoOf(targetDir);
    }

    function handleFileSetEventInGitRepo(fsURL, target, case_, maybeModified) {
        if (maybeModified) {
            refreshGitIconsInRepoOf(target);
        }
    }

    function refreshGitIconsInRepoOf(path, mayConvertUntrackedToTracked) {
        var repoPath = git.findGitRootPath(path);
        if (repoPath && !git.isInDotGitDir(path)) {
            if (wv.exists(path) && pathUtil.getName(path) !== '.gitignore') {
                var iconInfo = wv.getNodeOverlayIconInfo(path, GIT_OVERLAY_ICON_STATE_MAP_KEY);
                if (iconInfo === 'gitIgnored' ||
                    (iconInfo === 'gitUntracked' && !mayConvertUntrackedToTracked)) {
                    return;		// do nothing. just ignore
                }
            }

            throttleIconInfoSetting(repoPath, path + '@C');
        }
    }

    return {
        detectGitRepo: detectGitRepo,
        detectNodeWithoutIcon: detectNodeWithoutIcon,
        detectGitRepoDeletion: detectGitRepoDeletion,
        handleNodeAddEventInGitRepo: handleNodeAddEventInGitRepo,
        handleNodeDelEventInGitRepo: handleNodeDelEventInGitRepo,
        handleNodeChangesEventInGitRepo: handleNodeChangesEventInGitRepo,
        handleFileSetEventInGitRepo: handleFileSetEventInGitRepo,

        refreshGitIconsInRepoOf: refreshGitIconsInRepoOf
    };
});
