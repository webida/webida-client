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

// @formatter:off
define([
    'dojo/dom-style',
    'dojo/dom-geometry',
    'dojo/topic',
    'external/lodash/lodash.min',
    'webida-lib/app',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workbench/ui/editorDialog',
    'webida-lib/plugins/workbench/ui/promiseMap',
    'webida-lib/util/logger/logger-client',
    'webida-lib/widgets/views/splitviewcontainer',
    'webida-lib/widgets/views/viewmanager',
    './LifecycleManager',
    './plugin'
], function(
    domStyle,
    geometry,
    topic,
    _,
    ide,
    workbench,
    editorDialog,
    promiseMap,
    Logger,
    SplitViewContainer,
    vm,
    LifecycleManager,
    editors
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var lastStatus;

    var lifecycleManager = LifecycleManager.getInstance();

    var paneElement = $('<div id="editor" tabindex="0" style="position:absolute; ' +
    'overflow:hidden; width:100%; height:100%; padding:0px; border:0"/>')[0];

    /**
     * Compatibility
     */
    function _getPartRegistry() {
        var page = workbench.getCurrentPage();
        return page.getPartRegistry();
    }

    function getPanel() {
        var docFrag = document.createDocumentFragment();
        docFrag.appendChild(paneElement);
        return docFrag;
    }

    function onPanelAppended() {
        var $elemTab = $('<div id="editor-tab" style="width:100%; height:100%" class="editor-tab"></div>');
        $(paneElement).append($elemTab);

        editors.splitViewContainer = new SplitViewContainer();
        editors.splitViewContainer.init({
            'splitCount': 2,
            'verticalSplit': false,
            'smartVisible': true,
            'rotatable': true
        }, 'editor-tab');
        vm.addToGroup(editors.splitViewContainer, 'editorView');

        topic.subscribe('editor-panel-resize', function() {
            var borderContainer = editors.splitViewContainer.widgetObject;
            var children = borderContainer.getChildren();
            var totalW = 5;
            // including margin and splitter size
            var totalH = 5;
            // including margin and splitter size
            var width, height;
            var child;
            var i;
            var ratioW, ratioH;
            for ( i = 0; i < children.length; i++) {
                child = children[i];
                totalW += geometry.getMarginBox(child.domNode).w;
                totalH += geometry.getMarginBox(child.domNode).h;
            }

            for ( i = 1; i < children.length; i++) {
                child = children[i];
                width = geometry.getMarginBox(child.domNode).w;
                height = geometry.getMarginBox(child.domNode).h;
                ratioW = ((width - 2) * 100 / totalW) + '%';
                ratioH = ((height - 2) * 100 / totalH) + '%';
                //console.log('total : ' +totalW+ ', content : '+ i  + ' : ' +
                // width + ', ratio : '+ratioW);
                if (child.get('region') === 'right') {
                    if ($(child.domNode).css('width').split('%').length > 1) {
                        continue;
                    }
                    domStyle.set(child.domNode, 'width', ratioW);
                } else if (child.get('region') === 'bottom') {
                    if ($(child.domNode).css('height').split('%').length > 1) {
                        continue;
                    }
                    domStyle.set(child.domNode, 'height', ratioH);
                }
            }

        });

        /* viewcontainer supports 'dblclick' event
         var vcList = editors.splitViewContainer.getViewContainers();
         _.forEach(vcList, function (vc) {
         dojo.connect(vc.tabContainer, 'onDblClick', function (ev) {
         if (ev.currentTarget === vc.tabContainer.domNode) {
         var parent = ev.srcElement.parentNode;
         while (parent && parent.parentNode) {
         if (parent === vc.tabContainer.domNode.firstElementChild) {
         workbench.toggleFullScreen();
         break;
         }
         parent = parent.parentNode;
         }
         }
         });
         });
         */

        topic.subscribe('view.focused', function(event) {
            logger.info('view.focused');
            logger.trace();
            var view = event.view;
            //logger.info('view = ', view);
            var vc = event.viewContainer;
            if (!vc || (vc.getParent() !== editors.splitViewContainer)) {
                return;
            }
            if (view.partContainer) {
                var registry = _getPartRegistry();
                var part = view.partContainer.getPart();
                var currentPart = registry.getCurrentEditorPart();
                if (part !== currentPart) {
                    registry.setCurrentEditorPart(part);
                }
            }
        });

        function _getDirtyFileNames() {
            var dataSource, file, fileNames = [];
            var parts = _getPartRegistry().getDirtyParts();
            parts.forEach(function(part) {
                dataSource = part.getDataSource();
                file = dataSource.getPersistence();
                fileNames.push(file.getName());
            });
            return fileNames;
        }

        function checkDirtyFiles() {
            var dirtyFileNames = _getDirtyFileNames();
            if (dirtyFileNames.length > 0) {
                return "'" + dirtyFileNames.join(', ') + "' has been modified";
            }
        }


        topic.subscribe('view.quit', function() {
            logger.info('view.quit');

            var dirtyFileNames = _getDirtyFileNames();
            var action = function closeWindow() {
                try {
                    window.focus();
                    if (!window.opener) {
                        // @formatter:off
                        alert('Quit does not work when IDE was opened by a direct URL.\n'
                            + 'Please close the browser tab to quit the IDE.');
                            // @formatter:on
                    } else {
                        //window.opener = window;
                        window.close();
                    }
                } catch (e) {
                    logger.log('First try to close App failed', e);
                    try {
                        window.open('', '_self', '');
                        window.close();
                    } catch (e) {
                        logger.log('Second try to close App failed', e);
                    }
                }
            };
            var cancel = function cancelSaveBeforeUnload() {
                ide.registerBeforeUnloadChecker('checkDirtyFiles', checkDirtyFiles);
            };

            ide.unregisterBeforeUnloadChecker('checkDirtyFiles');

            if (dirtyFileNames.length > 0) {
                editorDialog.create(dirtyFileNames.join(', '), 'Quit', action, cancel);
            } else {
                action();
            }
        });

        ide.registerBeforeUnloadChecker('checkDirtyFiles', checkDirtyFiles);

        function getCurrentStatus() {
            logger.info('getCurrentStatus()');

            var status = {
                viewContainers: [],
                viewLayout: {},
                recentDataSources: []
            };

            var totalW = 0;
            var totalH = 0;
            var splitVc = editors.splitViewContainer;
            var viewContainers = splitVc.getViewContainers();
            var registry = _getPartRegistry();

            viewContainers.forEach(function(vc) {
                if (vc.getViewList().length > 0) {
                    totalW += geometry.getContentBox(vc.topContainer.domNode).w;
                    totalH += geometry.getContentBox(vc.topContainer.domNode).h;
                }
            });

            logger.info('totalW = ', totalW);
            logger.info('totalH = ', totalH);

            var tabs;
            var width = 0;
            var height = 0;
            var partContainer;

            // status.viewContainers
            viewContainers.forEach(function(vc) {
                tabs = [];
                width = 0;
                height = 0;
                vc.getViewList().forEach(function(view) {
                    partContainer = view.partContainer;
                    tabs.push({
                        dataSourceId: partContainer.getDataSource().getId(),
                        openWithPart: partContainer.getPart().constructor.classPath
                    });
                });
                width = geometry.getContentBox(vc.topContainer.domNode).w;
                height = geometry.getContentBox(vc.topContainer.domNode).h;
                if (width > 0) {
                    width = parseInt((width * 100 / totalW), 10) + '%';
                }
                if (height > 0) {
                    height = parseInt((height * 100 / totalH), 10) + '%';
                }
                status.viewContainers.push({
                    tabs: tabs,
                    width: width,
                    height: height
                });
            });

            // status.viewLayout
            if (viewContainers.length > 0) {
                status.viewLayout = {
                    count: splitVc.get('splitCount'),
                    vertical: splitVc.get('verticalSplit')
                };
            }

            // status.recentFiles
            status.recentDataSources = registry.getRecentDataSourceIds();

            logger.info('splitVc = ', splitVc);
            logger.info('viewContainers = ', viewContainers);
            logger.info('status = ', status);

            return status;
        }

        lastStatus = ide.registerStatusContributorAndGetLastStatus('editor-view', getCurrentStatus);

        logger.info('lastStatus => ', lastStatus);

        function recoverLastStatus() {
            logger.info('recoverLastStatus()');
            logger.info('lastStatus = ', lastStatus);

            if (lastStatus.viewLayout && lastStatus.viewLayout.vertical) {
                if (lastStatus.viewLayout.vertical === true) {
                    editors.splitViewContainer.set('verticalSplit', true);
                } else {
                    editors.splitViewContainer.set('verticalSplit', false);
                }
            }

            var option;

            lastStatus.viewContainers.forEach(function(vc, vcIndex) {
                var siblingList = [];
                vc.tabs.forEach(function(tab) {
                    siblingList.push(tab.dataSourceId);
                });
                vc.tabs.forEach(function(tab, index) {
                    option = {
                        cellIndex: vcIndex,
                        siblingList: siblingList,
                        openWithPart: tab.openWithPart
                    };
                    //setTimeout : after load preference store
                    //TODO Refactor (Use Promise)
                    setTimeout(function(dataSourceId, option) {
                        topic.publish('editor/open', dataSourceId, option);
                    }, 1000, tab.dataSourceId, option);
                });

                var viewContainers = editors.splitViewContainer.getViewContainers();
                //console.log($(viewContainers[i].topContainer.domNode).css('width'));
                if (vcIndex > 0 && (vc.tabs.length > 0)) {
                    $(viewContainers[vcIndex].topContainer.domNode).css('width', vc.width);
                    $(viewContainers[vcIndex].topContainer.domNode).css('height', vc.height);
                }
            });

            if (lastStatus.recentDataSources) {
                editors.recentFiles.importFromPlainArray(lastStatus.recentDataSources);
            }
        }

        if (lastStatus && lastStatus.viewContainers) {
            promiseMap.get('preference/load').then(function() {
                recoverLastStatus();
            });
        }
    }

    return {
        getPanel: getPanel,
        onPanelAppended: onPanelAppended
    };
});
