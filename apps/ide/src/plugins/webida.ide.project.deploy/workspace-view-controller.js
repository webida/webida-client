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
 * View controller on the workspace area that contains project list in the deploy dialog
 * @since 1.6.0
 * @author kyungmi.k@samsung.com
 * @module Deploy/workspaceViewController
 */
define([
    'dijit/registry',
    'dijit/TitlePane',
    'dojo/i18n!./nls/resource',
    'dojo/parser',
    'webida-lib/app',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    './content-view-controller'
], function (
    reg,
    TitlePane,
    i18n,
    parser,
    ide,
    Logger,
    notify,
    contentViewController
) {
    'use strict';
    var logger = new Logger();
    var oldSelected = null;
    var context;

    function _onChangeProject(path) {
        contentViewController.changeProjectPath(path);
    }

    function _addProject(name, selected) {
        var item = {
            path: null,
            elem: null
        };

        var path = context.workspacePath + '/' + name;
        item.path = path;
        item.elem = $('<div class="deploy-title-item" id=' + 'prjListItem' + path + '></div>');
        item.elem.attr('title', 'Project name : ' + name);
        item.elem.text(name);
        $('#workspace-list-box').append(item.elem);

        item.elem.bind('mousedown', function () {
            item.elem.addClass('deploy-title-item-pushed');
        });

        item.elem.bind('click', function () {
            if (oldSelected === item.elem) {
                return;
            }
            contentViewController.beforeChange(function (ret) {
                if (!ret) {
                    item.elem.removeClass('deploy-title-item-pushed');
                } else {
                    if (oldSelected) {
                        oldSelected.removeClass('deploy-title-item-selected');
                    }
                    item.elem.removeClass('deploy-title-item-pushed');
                    _onChangeProject(path);
                    item.elem.addClass('deploy-title-item-selected');
                    oldSelected = item.elem;
                }
            });
        });

        item.elem.bind('mouseup', function () {
            item.elem.removeClass('deploy-title-item-pushed');
        });

        item.elem.bind('mouseover', function () {
            item.elem.addClass('deploy-title-item-hover');
        });

        item.elem.bind('mouseout', function () {
            item.elem.removeClass('deploy-title-item-hover');
            item.elem.removeClass('deploy-title-item-pushed');
            //item.elem.attr('title' , '');
            //item.elem.removeAttr('title');
        });

        if (selected) {
            if (oldSelected) {
                oldSelected.removeClass('deploy-title-item-selected');
            }
            _onChangeProject(path);
            item.elem.addClass('deploy-title-item-selected');
            oldSelected = item.elem;
        }

    }

    function _onGetProject(err, lists) {
        if (err) {
            logger.log('failed to get project list.');
            notify.error(i18n.messageFailGetProjects);
        } else {
            if (!lists || lists.length <= 0) {
                notify.info(i18n.messageNoProject);
                return;
            }

            lists.sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });

            var list;
            for (var i = 0; i < lists.length; i++) {
                list = lists[i];
                if (list.isDirectory === true) {
                    if (list.name[0] !== '.') {
                        if (list.name === context.projectName) {
                            _addProject(list.name, true);
                        } else {
                            _addProject(list.name, false);
                        }
                    }
                }
            }
        }
    }

    return {
        onStart: function (deployContext) {
            context = deployContext;
            var workspaceName = context.workspaceName;
            if (!workspaceName) {
                return;
            }
            $('#workspace-list-title').text(workspaceName);
            ide.getFSCache().list('/' + workspaceName, _onGetProject);
        }
    };
});
