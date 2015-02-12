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
    'lodash',
    'moment',
    'services/WorkspaceManager',
    'toastr',
    'webida',
    'q',
    'webida-lib/app-config'
], function (_, moment, WorkspaceManager, toastr, webida, Q) {
    'use strict';
    var WorkspaceController = function () {};

    $.extend(WorkspaceController.prototype, {

        execute: function () {
            var _this = this;

            $('.section > div').hide();
            $('#area-workspace').show();

            $('.add-ws-button').on('click', function () {
                _this.openAddWSDialog();
            });

            this.listWorkspaces();
        },

        listWorkspaces: function (doReload) {
            var defer = Q.defer();
            var _this = this;
            var body = $('#area-workspace .body').html('');

            var loading = $('<div class="row info">Loading workspaces...</div>');
            body.append(loading);

            WorkspaceManager.loadWorkspaces(doReload).then(function (list) {
                loading.remove();

                if (list.length === 0) {
                    var template =
                        '<div class="info center" style="line-height: 60px">' +
                        '		<div class="contents" style="vertical-align: middle">No workspaces found.</div>' +
                        '</div>';

                    body.append(template);
                }

                _.forEach(list, function (ws) {
                    var id = _.uniqueId();
                    var birth = ws.birth ? moment(ws.birth).fromNow() : '';
                    var desc = ws.desc ? ws.desc : '';

                    /* jshint maxlen:200 */
                    var template =
                        '<div class="row closed" data-id="' + id + '">' +
                        '    <div class="contents clickable-contents" data-ws="' + ws.name + '">' +
                        '        <div class="col span1"><span class="arrow"></span></div>' +
                        '        <div class="col span6" title=' + ws.name + '>' + ws.name + '</div>' +
                        '        <div class="col span6 centered">' + birth + '</div>' +
                        '        <div class="col span7" title=' + desc + '>' + desc + '</div>' +
                        '    </div>' +
                        '    <div class="button-area span2 launch-button centered" data-ws="' + ws.name + '" title="Open">' +
                        '        Open' +
                        '    </div>' +
                        '<div class="button-area span2 edit-button" data-ws="' + ws.name + '" data-desc="' + desc + '" title="Edit">' +
                        '        <span class="button-icon icon-edit"></span><span>Edit</span>' +
                        '    </div>' +
                        '    <div class="button-area span2 delete-button" data-ws="' + ws.name + '" title="Delete">' +
                        '        <span class="button-icon icon-delete"></span><span>Delete</span>' +
                        '    </div>' +
                        '</div>' +
                        '<div class="project-pane"></div>';
                    /* jshint maxlen: 120 */

                    body.append(template);
                });

                body.find('.row > .clickable-contents').on('click', function () {
                    var $this = $(this);
                    var arrow = $this.find('span.arrow');

                    if ($this.attr('is-open') === 'true') {
                        var pjPane = $this.parent().next();

                        $this.attr('is-open', false);
                        arrow.removeClass('selected');

                        pjPane.fadeOut(100);
                    } else {
                        $this.attr('is-open', true);
                        arrow.addClass('selected');

                        _this.listProjects(this);
                    }
                });

                body.find('.row > .launch-button').on('click', function () {
                    var name = $(this).attr('data-ws');
                    var workspacePath = WorkspaceManager.getWorkspacePath(name);
                    if (workspacePath) {
                        _this.launchIDE(workspacePath);
                    } else {
                        toastr.error('failed to get workspace path');
                    }
                });

                body.find('.row > .edit-button').on('click', function () {
                    _this.openEditWSDialog($(this));
                });

                body.find('.row > .delete-button').on('click', function () {
                    _this.openRemoveWSDialog($(this));
                });
                defer.resolve();
            });
            return defer.promise;
        },

        listProjects: function (wsNode) {
            var _this = this;
            var wsName = $(wsNode).attr('data-ws');
            var wsRow = $(wsNode).parent();
            var prjPane = wsRow.next();
            prjPane.show();

            WorkspaceManager.loadWorkspaces().then(function (list) {
                _.forEach(list, function (ws) {
                    if (ws.name === wsName) {
                        prjPane.html('');

                        var delay = 0;

                        _.forEach(ws.projects, function (proj) {
                            var projImg = proj.isProject ? '<span class="project"> </span>' : '';
                            var path = proj.path ? proj.path : '';
                            /* jshint maxlen : 200 */
                            var template =
                                '<div class="row" style="display: none">' +
                                '    <div class="contents span15 ' + (proj.isProject ? 'wp' : '') + '" data-prjpath="' + path + '">' +
                                '        <div class="col span1"></div>' +
                                '        <div class="col span6 ' + (proj.isProject ? '' : 'na') + '">' + proj.name + projImg + '</div>' +
                                '        <div class="col span8 options"></div>' +
                                '    </div>' +
                                '</div>';
                            /* jshint maxlen: 120 */
                            
                            var row = $(template);

                            if (proj.isProject) {
                                //var confButton = _this._createProjectOption('Run settings');
                                //row.find('.options').append(confButton);

                                var runButton = _this._createProjectOption('Run', 'green', 'icon-run');
                                row.find('.options').append(runButton);

                                runButton.off('click').on('click', function (e) {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    var projPath = '/' /* FIXME WorkspaceManager.WORKSPACE_PATH */ + ws.name + '/' + proj.name;

                                    _this.runProject(proj, projPath);
                                });
                            } /*else {
                                //var button = _this._createProjectOption('Convert to Webida project');
                                //row.find('.options').append(button);
                            }*/

                            prjPane.append(row);

                            row.delay(delay).fadeIn(100);
                            delay += 30;
                        });

                        if (!ws.projects || ws.projects.length === 0) {
                            var none = 
                                '<div class="row"><div class="contents span15 info">No projects found</div></div>';
                            prjPane.html(none);
                        }
                    }
                });
            });
        },
        _createProjectOption: function (text, btnClass, iconClass) {
            btnClass = btnClass ? btnClass : '';

            var template = '<button class="btn ' + btnClass + '">';
            if (iconClass) {
                template += '<span class="btn-icon ' + iconClass + '"></span>';
            }
            template += '<span>' + text + '</span></button>';
            var button = $(template);

            return button;
        },

        openProjectInfo: function (elem) {
            var pane = $('<div class="project-info span14"><span class="info">Loading...</span></div>');
            pane.insertAfter(elem);
        },

        openAddWSDialog: function () {
            var _this = this;
            var dialog = $('#add-ws-dialog');
            var overlay = $('.overlay');

            overlay.fadeIn(100);
            dialog.fadeIn(100);

            var closeButton = $('#add-ws-dialog').find('.dialog-close');

            closeButton.off('click').on('click', function () {
                overlay.fadeOut(100);
                dialog.fadeOut(100);
            });

            var nameInput = $('#ws-name-input').val('').focus().off('keydown').on('keydown', function (e) {
                if (e.keyCode === 13) {
                    dialog.find('.submit').trigger('click');
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

            var descInput = $('#ws-desc-input').val('').off('keydown').on('keydown', function (e) {
                if (e.keyCode === 13) {
                    dialog.find('.submit').trigger('click');
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

            dialog.find('.submit').off('click').on('click', function () {
                var wsName = nameInput.val();
                var wsDesc = descInput.val();

                if (!wsName) {
                    toastr.error('Workspace name cannot be blank!');
                    return;
                }

                if (WorkspaceManager.exists(wsName)) {
                    toastr.error('Workspace with the same name already exists!');
                    return;
                }

                WorkspaceManager.createWorkspace(wsName, wsDesc).then(function () {
                    closeButton.trigger('click');
                    _this.listWorkspaces(true).then(function () {
                        toastr.success('Successfully created the workspace!');
                    });
                }).fail(function () {
                    toastr.error('Failed to create new workspace!');
                });
            });
        },

        openEditWSDialog: function (ws) {
            var _this = this;
            var dialog = $('#edit-ws-dialog');
            var overlay = $('.overlay');

            overlay.fadeIn(100);
            dialog.fadeIn(100);

            var closeButton = $('#edit-ws-dialog').find('.dialog-close');

            closeButton.off('click').on('click', function () {
                overlay.fadeOut(100);
                dialog.fadeOut(100);
            });

            var oldDescVal = ws.attr('data-desc');

            var descInput = $('#edit-ws-desc-input').val(oldDescVal).focus().off('keydown').on('keydown', function (e) {
                if (e.keyCode === 13) {
                    dialog.find('.submit').trigger('click');
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

            dialog.find('.submit').off('click').on('click', function () {
                var wsName = ws.attr('data-ws');
                var wsDesc = descInput.val();
                if (wsDesc === oldDescVal) {
                    closeButton.trigger('click');
                } else {
                    WorkspaceManager.editWorkspace(wsName, wsDesc).then(function () {
                        closeButton.trigger('click');
                        toastr.success('Successfully edited the workspace!');
                        _this.listWorkspaces(true);
                    }).fail(function () {
                        toastr.error('Failed to edit workspace!');
                    });
                }
            });
        },

        openRemoveWSDialog: function (ws) {
            var _this = this;
            var dialog = $('#remove-ws-dialog');
            var overlay = $('.overlay');

            overlay.fadeIn(100);
            dialog.fadeIn(100);

            var closeButton = $('#remove-ws-dialog').find('.dialog-close');

            closeButton.off('click').on('click', function () {
                overlay.fadeOut(100);
                dialog.fadeOut(100);
            });

            var confirmInput = $('#ws-confirm-input').val('').focus().off('keydown').on('keydown', function (e) {
                if (e.keyCode === 13) {
                    dialog.find('.submit').trigger('click');
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

            dialog.find('.submit').off('click').on('click', function () {
                var confirmValue = confirmInput.val();
                var wsName = ws.attr('data-ws');

                if (!confirmValue) {
                    toastr.error('Please type in the name of the workspace!');
                    return;
                }

                if (confirmValue !== wsName) {
                    toastr.error('The inserted name does not match with the actual workspace name!');
                    return;
                }

                WorkspaceManager.removeWorkspace(wsName).then(function () {
                    closeButton.trigger('click');

                    _this.listWorkspaces(true).then(function () {
                        toastr.success('Successfully removed the workspace!');
                    });
                }).fail(function () {
                    toastr.error('Failed to remove the workspace!');
                });
            });
        },

        launchIDE: function (path) {
            // webida.app.launchApp('devenv', true, '?workspace=' + path);
						window.open("../ide/src/?workspace=" + path);
        },

        runProject: function (proj, projPath) {
            var runOpts = proj.run;

            if (!runOpts || !runOpts.list || runOpts.list.length === 0) {
                alert('Run configuration is not available!');
                return;
            }

            var curRunOpt = runOpts.list[0];

            _.forEach(runOpts.list, function (opt) {
                if (opt.name === runOpts.selectedId) {
                    curRunOpt = opt;
                    return false;
                }
            });

            WorkspaceManager.runProject(projPath, curRunOpt).then(function () {
                toastr.success('\'' + proj.name + '\' successfully launched');
            }).fail(function (e) {
                toastr.error('Could not run "' + proj.name + '".<br />' + e.message);
            });
        }
    });

    return WorkspaceController;
});
