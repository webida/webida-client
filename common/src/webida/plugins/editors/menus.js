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
    'external/lodash/lodash.min',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/workbench/plugin',
    './plugin'
], function (
    _,
    commandSystem,
    workbench,
    editors
) {
    'use strict';

    var commandService = commandSystem.service;

    function updateFileTopMenu(registry) {
        var currentEditorPart;
        var editorParts;
        var saveFileMenuItem = commandService.getTopMenuModel('save-file');
        var saveAllMenuItem = commandService.getTopMenuModel('save-all');
        var closeCurrentMenuItem = commandService.getTopMenuModel('close-current');
        var closeAllMenuItem = commandService.getTopMenuModel('close-all');
        var closeOthersMenuItem = commandService.getTopMenuModel('close-others');
        if (registry) {
            currentEditorPart = registry.getCurrentEditorPart();
            if (currentEditorPart) {
                if (currentEditorPart.isDirty()) {
                    saveFileMenuItem.disabled = false;
                } else {
                    saveFileMenuItem.disabled = true;
                }
            } else {
                saveFileMenuItem.disabled = true;
            }
            if (registry.getDirtyParts().length > 0) {
                saveAllMenuItem.disabled = false;
            } else {
                saveAllMenuItem.disabled = true;
            }
            editorParts = registry.getEditorParts();
            if (editorParts) {
                if (editorParts.length === 1) {
                    closeCurrentMenuItem.disabled = false;
                    closeAllMenuItem.disabled = false;
                } else if (editorParts.length > 1) {
                    closeCurrentMenuItem.disabled = false;
                    closeAllMenuItem.disabled = false;
                    closeOthersMenuItem.disabled = false;
                } else {
                    closeCurrentMenuItem.disabled = true;
                    closeAllMenuItem.disabled = true;
                    closeOthersMenuItem.disabled = true;
                }
            }
        }
        if (!registry || !editorParts) {
            if (!registry) {
                saveFileMenuItem.disabled = true;
                saveAllMenuItem.disabled = true;
            }
            closeCurrentMenuItem.disabled = true;
            closeAllMenuItem.disabled = true;
            closeOthersMenuItem.disabled = true;
        }
    }

    function updateRecentFilesTopMenu() {
        var fileList;
        var id;
        var itemIndex = 0;
        var menuItem = {
            id: '',
            name: '',
            commandId: ''
        };
        var commandItem = {
            id: '',
            plugin: ''
        };
        var recentListMenuItem = commandService.getTopMenuModel('recent-files');
        recentListMenuItem.items = [];
        if (editors.recentFiles.length > 0) {
            fileList = editors.recentFiles;
            _.each(fileList, function (item) {
                id = recentListMenuItem.id + ':' + itemIndex;
                menuItem.id = id;
                menuItem.name = item;
                menuItem.commandId = id;
                commandService.addMenuModel(menuItem, recentListMenuItem);
                commandItem.id = id;
                commandItem.plugin = 'webida-lib/plugins/editors';
                commandService.setCommandRegistry(commandItem);
                itemIndex++;
            });
        }
    }

    function updateNavigateEditorsTopMenu(parts) {
        var splitContainer;
        var focusedViewContainer;
        var selectedView;
        var showedViewContainerList;
        var navigateEditorsMenuItem = commandService.getTopMenuModel('navigate-editors');
        var exSelectedTabMenuItem = commandService.getTopMenuModel('ex-selected-tab');
        var goPreviousTabMenuItem = commandService.getTopMenuModel('go-previous-tab');
        var goNextTabMenuItem = commandService.getTopMenuModel('go-next-tab');
        var switchEditorTabMenuItem = commandService.getTopMenuModel('switch-editor-tab');
        var switchNextTabContainerMenuItem = commandService.getTopMenuModel('switch-next-tab-container');
        var moveTabContainerMenuItem = commandService.getTopMenuModel('move-tab-container');
        if (parts.length >= 2) {
            navigateEditorsMenuItem.disabled = false;
            exSelectedTabMenuItem.disabled = false;
        } else {
            navigateEditorsMenuItem.disabled = true;
            exSelectedTabMenuItem.disabled = true;
        }
        splitContainer = editors.splitViewContainer;
        focusedViewContainer = splitContainer.getFocusedViewContainer();
        if (focusedViewContainer.getChildren().length > 1) {
            goPreviousTabMenuItem.disabled = false;
            goNextTabMenuItem.disabled = false;
        } else {
            goPreviousTabMenuItem.disabled = true;
            goNextTabMenuItem.disabled = true;
        }
        if (editors.editorTabFocustContainer) {
            if (editors.editorTabFocusContainer.getViewList().length > 1) {
                switchEditorTabMenuItem.disabled = false;
            } else {
                switchEditorTabMenuItem.disabled = true;
            }
        } else {
            switchEditorTabMenuItem.disabled = true;
        }
        if (splitContainer.getShowedViewContainers().legth > 1) {
            switchNextTabContainerMenuItem.disabled = false;
        } else {
            switchNextTabContainerMenuItem.disabled = true;
        }
        selectedView = focusedViewContainer.getSelectedView();
        showedViewContainerList = splitContainer.getShowedViewContainers();
        if (focusedViewContainer && selectedView) {
            if (showedViewContainerList.length === 1 &&
                showedViewContainerList[0].getChildren().length > 1) {
                moveTabContainerMenuItem.disabled = false;
            } else if (showedViewContainerList.length > 1) {
                moveTabContainerMenuItem.disabled = false;
            } else {
                moveTabContainerMenuItem.disabled = true;
            }
        } else {
            moveTabContainerMenuItem.disabled = true;
        }
    }

    function updateViewTopMenu(partRegistry) {
        var splitEditorsMenuItem = commandService.getTopMenuModel('split-editors');
        var splitVerticalMenuItem = commandService.getTopMenuModel('split-vertical');
        var splitHorizontalMenuItem = commandService.getTopMenuModel('split-horizontal');
        if (partRegistry.getEditorParts().length <= 1) {
            splitEditorsMenuItem.disabled = true;
            splitVerticalMenuItem.disabled = true;
            splitHorizontalMenuItem.disabled = true;
        } else {
            splitEditorsMenuItem.disabled = false;
            if (editors.splitViewContainer.getShowedViewContainers().length > 1) {
                if (editors.splitViewContainer.get('verticalSplit') === true) {
                    splitVerticalMenuItem.disabled = false;
                    splitHorizontalMenuItem.disabled = true;
                } else {
                    splitVerticalMenuItem.disabled = true;
                    splitHorizontalMenuItem.disabled = false;
                }
            } else {
                splitVerticalMenuItem.disabled = false;
                splitHorizontalMenuItem.disabled = false;
            }
        }
    }

    function updateFileContextMenu(registry) {
        var currentEditorPart;
        var editorParts;
        var closeOthersMenuItem = commandService.getContextMenuModel('close-others');
        var closeAllMenuItem = commandService.getContextMenuModel('close-all');
        var saveFileMenuItem = commandService.getContextMenuModel('save-file');
        if (registry) {
            currentEditorPart = registry.getCurrentEditorPart();
            if (currentEditorPart) {
                if (currentEditorPart.isDirty()) {
                    saveFileMenuItem.invisible = false;
                } else {
                    saveFileMenuItem.invisible = true;
                }
            } else {
                saveFileMenuItem.invisible = true;
            }
            editorParts = registry.getEditorParts();
            if (editorParts) {
                if (editorParts.length > 1) {
                    closeAllMenuItem.invisible = false;
                    closeOthersMenuItem.invisible = false;
                } else {
                    closeAllMenuItem.invisible = true;
                    closeOthersMenuItem.invisible = true;
                }
            }
        }
        if (!registry || !editorParts) {
            saveFileMenuItem.invisible = true;
            closeAllMenuItem.invisible = true;
            closeOthersMenuItem.invisible = true;
        }
    }

    function updateTopMenu() {
        var page;
        var partRegistry;
        var editorParts;
        var currentEditorPart;
        var currentViewer;
        page = workbench.getCurrentPage();
        if (page) {
            partRegistry = page.getPartRegistry();
            if (partRegistry) {
                editorParts = partRegistry.getEditorParts();
                currentEditorPart = partRegistry.getCurrentEditorPart();
                if (currentEditorPart) {
                    currentViewer = currentEditorPart.getViewer();
                }
            }
        }
        updateFileTopMenu(partRegistry);
        updateRecentFilesTopMenu();
        updateNavigateEditorsTopMenu(editorParts);
        updateViewTopMenu(partRegistry);
    }

    function updateContextMenu() {
        var page;
        var partRegistry;
        var editorParts;
        var currentEditorPart;
        var currentViewer;
        page = workbench.getCurrentPage();
        if (page) {
            partRegistry = page.getPartRegistry();
            if (partRegistry) {
                editorParts = partRegistry.getEditorParts();
                currentEditorPart = partRegistry.getCurrentEditorPart();
                if (currentEditorPart) {
                    currentViewer = currentEditorPart.getViewer();
                }
            }
        }
        updateFileContextMenu(partRegistry);
    }

    return {
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});
