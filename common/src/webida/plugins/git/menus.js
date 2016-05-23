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
 * @file This file manages dynamic menus.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/path',
    './git-core'
], function (
    commandSystem,
    workspace,
    pathUtil,
    git
) {
    'use strict';

    var commandService = commandSystem.service;

    function updateTopMenu() {
        var gitRootPath;
        var gitAdd = commandService.getTopMenuModel('git-add');
        var gitUntrack = commandService.getTopMenuModel('git-untrack');
        var gitRemove = commandService.getTopMenuModel('git-remove');
        var gitCommit = commandService.getTopMenuModel('git-commit');
        var gitResetToCommit = commandService.getTopMenuModel('git-reset-to-commit');
        var gitStash = commandService.getTopMenuModel('git-stash');
        var gitUnstash = commandService.getTopMenuModel('git-unstash');
        var gitCheckout = commandService.getTopMenuModel('git-checkout');
        var gitRebase = commandService.getTopMenuModel('git-rebase');
        var gitMerge = commandService.getTopMenuModel('git-merge');
        var gitBranch = commandService.getTopMenuModel('git-branch');
        var gitStatus = commandService.getTopMenuModel('git-status');
        var gitFileHistory = commandService.getTopMenuModel('git-file-history');
        var gitRepositoryHistory = commandService.getTopMenuModel('git-repository-history');
        var gitConfigure = commandService.getTopMenuModel('git-configure');
        var gitPush = commandService.getTopMenuModel('git-push');
        var gitFetch = commandService.getTopMenuModel('git-fetch');
        var gitPull = commandService.getTopMenuModel('git-pull');
        var gitUpdateSubmodule = commandService.getTopMenuModel('git-update-submodule');
        var gitRemote = commandService.getTopMenuModel('git-remote');
        var gitBlame = commandService.getTopMenuModel('git-blame');
        var gitCompare = commandService.getTopMenuModel('git-compare');
        var gitRun = commandService.getTopMenuModel('git-run');
        var gitClone = commandService.getTopMenuModel('git-clone');
        var gitCreateRepository = commandService.getTopMenuModel('git-create-repository');
        var path = workspace.getSelectedPath() || workspace.getRootPath();
        if (path && !git.isInDotGitDir(path)) {
            gitRootPath = git.findGitRootPath(path);
            if (gitRootPath) {
                gitAdd.disabled = false;
                gitUntrack.disabled = false;
                gitRemove.disabled = false;
                gitCommit.disabled = false;
                gitResetToCommit.disabled = false;
                gitStash.disabled = false;
                gitUnstash.disabled = false;
                gitCheckout.disabled = false;
                gitRebase.disabled = false;
                gitMerge.disabled = false;
                gitBranch.disabled = false;
                gitStatus.disabled = false;
                gitFileHistory.disabled = false;
                gitRepositoryHistory.disabled = false;
                gitConfigure.disabled = false;
                gitPush.disabled = false;
                gitFetch.disabled = false;
                gitPull.disabled = false;
                gitUpdateSubmodule.disabled = false;
                gitRemote.disabled = false;
                if (!pathUtil.isDirPath(path)) {
                    gitBlame.disabled = false;
                    gitCompare.disabled = false;
                } else {
                    gitBlame.disabled = true;
                    gitCompare.disabled = true;
                }
            } else {
                gitAdd.disabled = true;
                gitUntrack.disabled = true;
                gitRemove.disabled = true;
                gitCommit.disabled = true;
                gitResetToCommit.disabled = true;
                gitStash.disabled = true;
                gitUnstash.disabled = true;
                gitCheckout.disabled = true;
                gitRebase.disabled = true;
                gitMerge.disabled = true;
                gitBranch.disabled = true;
                gitStatus.disabled = true;
                gitFileHistory.disabled = true;
                gitRepositoryHistory.disabled = true;
                gitConfigure.disabled = true;
                gitPush.disabled = true;
                gitFetch.disabled = true;
                gitPull.disabled = true;
                gitUpdateSubmodule.disabled = true;
                gitRemote.disabled = true;
                gitBlame.disabled = true;
                gitCompare.disabled = true;
            }
            if (pathUtil.isDirPath(path)) {
                gitRun.disabled = false;
                gitClone.disabled = false;
                gitCreateRepository.disabled = false;
            } else {
                gitRun.disabled = true;
                gitClone.disabled = true;
                gitCreateRepository.disabled = true;
            }
        }
    }

    function updateContextMenu() {
        var gitRootPath;
        var gitRoot = commandService.getContextMenuModel('git');
        var gitAddDelimiter = commandService.getContextMenuModel('git-add-delimiter');
        var gitAdd = commandService.getContextMenuModel('git-add');
        var gitUntrack = commandService.getContextMenuModel('git-untrack');
        var gitRemove = commandService.getContextMenuModel('git-remove');
        var gitCommitDelimiter = commandService.getContextMenuModel('git-commit-delimiter');
        var gitCommit = commandService.getContextMenuModel('git-commit');
        var gitResetToCommit = commandService.getContextMenuModel('git-reset-to-commit');
        var gitStashDelimiter = commandService.getContextMenuModel('git-stash-delimiter');
        var gitStash = commandService.getContextMenuModel('git-stash');
        var gitUnstash = commandService.getContextMenuModel('git-unstash');
        var gitCheckout = commandService.getContextMenuModel('git-checkout');
        var gitRebase = commandService.getContextMenuModel('git-rebase');
        var gitMerge = commandService.getContextMenuModel('git-merge');
        var gitBranch = commandService.getContextMenuModel('git-branch');
        var gitStatus = commandService.getContextMenuModel('git-status');
        var gitFileHistory = commandService.getContextMenuModel('git-file-history');
        var gitRepositoryHistory = commandService.getContextMenuModel('git-repository-history');
        var gitConfigureDelimiter = commandService.getContextMenuModel('git-configure-delimiter');
        var gitConfigure = commandService.getContextMenuModel('git-configure');
        var gitPushDelimiter = commandService.getContextMenuModel('git-push-delimiter');
        var gitPush = commandService.getContextMenuModel('git-push');
        var gitFetch = commandService.getContextMenuModel('git-fetch');
        var gitPull = commandService.getContextMenuModel('git-pull');
        var gitUpdateSubmodule = commandService.getContextMenuModel('git-update-submodule');
        var gitRemote = commandService.getContextMenuModel('git-remote');
        var gitBlame = commandService.getContextMenuModel('git-blame');
        var gitCompare = commandService.getContextMenuModel('git-compare');
        var gitRun = commandService.getContextMenuModel('git-run');
        var gitCloneDelimiter = commandService.getContextMenuModel('git-clone-delimiter');
        var gitClone = commandService.getContextMenuModel('git-clone');
        var gitCreateRepository = commandService.getContextMenuModel('git-create-repository');
        var path = workspace.getSelectedPath() || workspace.getRootPath();
        if (path && !git.isInDotGitDir(path)) {
            gitRootPath = git.findGitRootPath(path);
            if (gitRootPath) {
                gitAddDelimiter.invisible = false;
                gitAdd.invisible = false;
                gitUntrack.invisible = false;
                gitRemove.invisible = false;
                gitCommitDelimiter.invisible = false;
                gitCommit.invisible = false;
                gitResetToCommit.invisible = false;
                gitStashDelimiter.invisible = false;
                gitStash.invisible = false;
                gitUnstash.invisible = false;
                gitCheckout.invisible = false;
                gitRebase.invisible = false;
                gitMerge.invisible = false;
                gitBranch.invisible = false;
                gitStatus.invisible = false;
                gitFileHistory.invisible = false;
                gitRepositoryHistory.invisible = false;
                gitConfigureDelimiter.invisible = false;
                gitConfigure.invisible = false;
                gitPushDelimiter.invisible = false;
                gitPush.invisible = false;
                gitFetch.invisible = false;
                gitPull.invisible = false;
                gitUpdateSubmodule.invisible = false;
                gitRemote.invisible = false;
                gitCloneDelimiter.invisible = false;
                if (!pathUtil.isDirPath(path)) {
                    gitBlame.invisible = false;
                    gitCompare.invisible = false;
                } else {
                    gitBlame.invisible = true;
                    gitCompare.invisible = true;
                }
            } else {
                gitAddDelimiter.invisible = true;
                gitAdd.invisible = true;
                gitUntrack.invisible = true;
                gitRemove.invisible = true;
                gitCommitDelimiter.invisible = true;
                gitCommit.invisible = true;
                gitResetToCommit.invisible = true;
                gitStashDelimiter.invisible = true;
                gitStash.invisible = true;
                gitUnstash.invisible = true;
                gitCheckout.invisible = true;
                gitRebase.invisible = true;
                gitMerge.invisible = true;
                gitBranch.invisible = true;
                gitStatus.invisible = true;
                gitFileHistory.invisible = true;
                gitRepositoryHistory.invisible = true;
                gitConfigureDelimiter.invisible = true;
                gitConfigure.invisible = true;
                gitPushDelimiter.invisible = true;
                gitPush.invisible = true;
                gitFetch.invisible = true;
                gitPull.invisible = true;
                gitUpdateSubmodule.invisible = true;
                gitRemote.invisible = true;
                gitCloneDelimiter.invisible = true;
                gitBlame.invisible = true;
                gitCompare.invisible = true;
            }
        } else {
            if (pathUtil.isDirPath(path)) {
                gitRoot.invisible = false;
                gitRun.invisible = false;
                gitClone.invisible = false;
                gitCreateRepository.invisible = false;
            } else {
                gitRoot.invisible = true;
                gitRun.invisible = true;
                gitClone.invisible = true;
                gitCreateRepository.invisible = true;
            }
        }
    }

    return {
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});
