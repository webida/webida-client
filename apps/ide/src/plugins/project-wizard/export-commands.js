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
 * @file Manage actions and UI for export commands
 * @since 1.0.0
 * @author kh5325.kim@samsung.com
 * @extends module:ProjectWizard/ViewCommands
 */

define([
    'dijit/registry',
    'dojo/Deferred',
    'dojo/store/Memory',
    'dojo/topic',
    'lib/test/bootstrap/bootstrap.custom',
    'lib/test/bootstrap/bootstrap-multiselect',
    'webida-lib/app',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/path',
    'webida-lib/widgets/views/viewmanager',
    'webida-lib/plugins/workspace/plugin',
    'text!./layer/export-layout.html',
    'text!./layer/export-toolbar.html',
    './constants',
    './messages',
    './view-commands',
    './build/build',
    './build/build-menu',
    './build/buildProfile',
    './lib/dropdown',
    './lib/util'
], function (
    reg,
    Deferred,
    Memory,
    topic,
    bootstrap,
    bootstrapMultiselect,
    ide,
    Logger,
    pathUtil,
    vm,
    wv,
    tplLayout,
    tplToolbar,
    Constants,
    Messages,
    ViewCommand,
    Build,
    BuildMenu,
    BuildProfile,
    DropDown,
    Util
) {
    'use strict';
    var logger = new Logger();
    logger.off();
    
    var VIEW_ID = 'VIEW_EXPORT';

    var fsMount = ide.getFSCache();

    var mBuildStore;
    var $mBuildProfiles;
    // Hold progressButton and taskId for each profile
    var monitor = {};

    function ExportViewCommand() {
        _self = this;

        this.projectInfo = null;
        this.buildMenu = null;
        this.dropdown = null;

        var self = this;
        topic.subscribe('project/build/start', function (data) {
            var profileName = data.profileName;
            monitor[profileName].taskIds.push(data.taskId);
            monitor[profileName].lastTaskId = data.taskId;
            if (monitor[profileName].progressButton) {
                monitor[profileName].progressButton.start();
                monitor[profileName].progressButton.setProgress(0.1);
            }
        });
        topic.subscribe('project/build/progress', function (data) {
            //logger.log('project/build/progress', data);
            var profileName = data.profileName;
            switch (data.state) {
            case 2 : // 'beforePlatformAdd'
                monitor[profileName].progressButton.setProgress(0.2);
                break;
            case 4 : // 'beforeBuild'
                monitor[profileName].progressButton.setProgress(0.5);
                break;
            case 5 : // 'beforeUploadPackage'
                monitor[profileName].progressButton.setProgress(0.9);
                break;
            }
        });
        topic.subscribe('project/build/end', function (data) {
            logger.log('project/build/end', data);
            var profileName = data.profileName;
            monitor[profileName].taskIds.splice(monitor[profileName].taskIds.indexOf(profileName), 1);
            if (monitor[profileName].progressButton) {
                monitor[profileName].progressButton.setProgress(1);
            }
            var nodeId = pathUtil.detachSlash(self.getProjectPath());
            if (data.pkg && wv.exists(nodeId)) {
                fsMount.refreshHierarchy(nodeId, { level: 1 }, function () {
                    fsMount.refresh(nodeId + '/' + Constants.OUTPUT_DIR, { level: -1 }, function () { });
                });
            }
        });
        topic.subscribe('project/build/cleaned', function (data) {
            var profileName = data.profileName;
            if (monitor[profileName].progressButton) {
                monitor[profileName].progressButton.setProgress(1);
            }
        });
        topic.subscribe('project/build/done', function (data) {
            var profileName = data.profileName;
            if (monitor[profileName].progressButton) {
                monitor[profileName].progressButton.stop();
            }
        });
    }

    // inherit ViewCommand
    var _super = ExportViewCommand.prototype = new ViewCommand(VIEW_ID);
    // correct the constructor pointer because it points to ViewCommand
    ExportViewCommand.prototype.constructor = ExportViewCommand;
    var _self = null;

    ExportViewCommand.prototype.doExport = function () {
        var curDir = wv.getSelectedPath();
        logger.log('doExport', curDir || null);

        _super.setHandler();
        _super.createView('Export', 'Export Center', tplLayout);
        _super.getView().select();
    }; // doExport

    ExportViewCommand.prototype.onViewAppended = function () {
        _super.initView(tplToolbar, function (selectedProjectPath) {
            if (_self.getProjectPath() === selectedProjectPath) {
                return;
            }
            _self.refreshView();
            // FIXME use directly `reg.byId('exportTab').selectChild()` method.
            Util.selectTab('exportTab', 'exportExport');
        });

        // onViewAppended is called from ViewCommand, so this is ViewCommand not ExportViewCommand.
        //this.init.call(_self);
        _self.init();
        _self.refreshView();
        _super.getView().select();
    };

    ExportViewCommand.prototype.init = function () {
        var self = this;
        $mBuildProfiles = $('#exportBuildProfilesCombo');

        $('#exportExportMWDownload').click(function () {
            self.downloadProject();
        });
        $('#exportExportMWDeploy').click(function () {
            self.deploy();
        });

        // click check box
        $('#exportBuildTargets').click(function (e) {
            if (e.target) {
                var $target = $(e.target);
                if ($target.is(':checkbox')) {
                    self._enableBuildSelected();
                }
            }
            e.stopPropagation();
        });
        $('#exportBuildAllChk').click(function () {
            var $chks = $('#exportBuildTargets :checkbox');
            $chks.prop('checked', this.checked);
            self._enableBuildSelected();
        });
        $('#exportBuildAllBtn').click(function () {
            $('input[name="export-chk"]:checked').each(function () {
                self.buildWithUI(this, Build.TYPE.BUILD);
            });
        });
        var dropdownId = '#chk-dropdown';
        var $dropdown = $(dropdownId);
        this.dropdown = new DropDown($dropdown);
        $(dropdownId + '-build').click(function () {
            $('input[name="export-chk"]:checked').each(function () {
                self.buildWithUI(this, Build.TYPE.BUILD);
            });
        });
        $(dropdownId + '-rebuild').click(function () {
            $('input[name="export-chk"]:checked').each(function () {
                self.buildWithUI(this, Build.TYPE.REBUILD);
            });
        });
        $(dropdownId + '-clean').click(function () {
            $('input[name="export-chk"]:checked').each(function () {
                self.buildWithUI(this, Build.TYPE.CLEAN);
            });
        });
        this.dropdown.disable();

        $('#exportBuildProfilesEdit').click(function () {
            self._editProfile(self.projectInfo, mBuildStore, $mBuildProfiles.val());
        });

        var tabs = reg.byId('exportTab');
        tabs.watch('selectedChildWidget', function (name, oval, nval) {
            if (nval.id === 'exportInstall') {
                // get a list of built packages
                var path = pathUtil.detachSlash(self.getProjectPath()) + '/' + Constants.OUTPUT_DIR;
                logger.log('exportInstall', path);
                var $downloadPane = $('#exportInstallDownload');
                $downloadPane.empty();
                $.each(BuildProfile.SUPPORTED_PLATFORMS, function (index, platform) {
                    Util.findFile(path, '\\.(' + BuildProfile.PACKAGE[platform] + ')$').then(function (files) {
                        var $div = $downloadPane.append('<div><label class="build__platform large ' +
                                                        platform + '"></label><span>' + platform + '</span></div>');
                        var map = {};
                        // collect package files under profile
                        $.each(files, function (index, file) {
                            var arr = file.replace(new RegExp('^' + path), '').split('/');
                            var download = {
                                profName: arr[1],
                                uri: arr[2],
                                file: file,
                                id: null
                            };
                            if (!map[download.profName]) {
                                map[download.profName] = [];
                            }
                            var downloadId = 'export-' + index + '-download';
                            map[download.profName].push($.extend(download, { id: downloadId }));
                        });
                        $.each(map, function (profile, downloads) {
                            var $divProfile = $div.append('<div class="pkg-download profile">' + profile + '</div>');
                            $.each(downloads, function (index, download) {
                                var downloadToDeviceId = download.id + '-device';
                                $divProfile.append('<button class="pkg-download large to-pc" id="' +
                                                   download.id + '">' + download.uri + '</button>');
                                $divProfile.append('<button class="pkg-download large to-device" id="' +
                                                   downloadToDeviceId + '" title="' + Messages.INSTALL_TO_PHONE +
                                                   '"></button>');
                                $('#' + download.id).click(function () {
                                    Util.expandWorkspaceTreeTo(download.file, false, function () {
                                        var url = Constants.getFileDownloadUrl(ide.getFsid(), download.file);
                                        var name = download.uri;
                                        Util.downloadFile(url, name);
                                    });
                                });
                                $('#' + downloadToDeviceId).click(function () {
                                    var build = new Build();
                                    build.downloadPackageToDevice(self.getProjectPath(),
                                                                  build.getRelativeApkPath(download));
                                });
                            });
                        });
                    });
                });
            }
        });
    };

    ExportViewCommand.prototype.refreshView = function () {
        logger.log('refreshView');
        var self = this;
        this.refresh().then(
            function (data) {
                $('#exportAppTitle').text(pathUtil.getName(self.getProjectPath()));
                self._rebuildBuildProfileCombo(data);
            }
        );
    };

    ExportViewCommand.prototype.refresh = function () {
        logger.log('refresh');
        var self = this;
        var deferred = new Deferred();
        this.setProjectPath(pathUtil.getProjectRootPath(wv.getSelectedPath()));
        var projectPath = this.getProjectPath();
        if (!projectPath) {
            logger.log(Messages.NO_PROJECT);
            return deferred.reject(new Error(Messages.NO_PROJECT));
        }

        Util.getProjectConfiguration(pathUtil.getName(projectPath), function (obj) {
            if (obj !== null) {
                self.projectInfo = obj;
                self.buildMenu = new BuildMenu(self.projectInfo, projectPath);
                var data = [];
                if (self.projectInfo.build) {
                    data = $.map(self.projectInfo.build, function (e) {
                        return BuildProfile.newProfile(e);
                    });
                } else {
                    logger.log(Messages.NO_BUILD_INFO);
                }
                mBuildStore = new Memory({
                    data: data,
                    idProperty: 'name'
                });
                $.each(mBuildStore.data, function (index, profile) {
                    var profileName = profile.name;
                    monitor[profileName] = self._createMonitor();
                });
                if ($mBuildProfiles) {
                    $('option', $mBuildProfiles).each(function () {
                        $mBuildProfiles.multiselect('deselect', $(this).val());
                    });
                    $('#exportBuildTargets').find('table tbody').empty();
                }
                return deferred.resolve(data);
            }
        });
        return deferred.promise;
    };

    ExportViewCommand.prototype._enableBuildSelected = function () {
        var $chks = $('#exportBuildTargets :checkbox');
        var $checkeds = $('#exportBuildTargets :checkbox:checked');
        var $chkAll = $('#exportBuildAllChk');
        if ($checkeds.length > 0) {
            this.dropdown.enable();
            if ($checkeds.length === $chks.length) {
                $chkAll.prop('indeterminate', false);
                $chkAll.prop('checked', true);
            } else {
                $chkAll.prop('indeterminate', true);
            }
        } else {
            this.dropdown.disable();
            $chkAll.prop('indeterminate', false);
            $chkAll.prop('checked', false);
        }
    };

    ExportViewCommand.prototype._createMonitor = function () {
        return {
            taskIds: [],
            lastTaskId: null,
            progressButton: null
        };
    };

    ExportViewCommand.prototype.editProfile = function () {
        var self = this;
        this.refresh().then(
            function () {
                self._editProfile(self.projectInfo, mBuildStore, []);
            }
        );
    };

    ExportViewCommand.prototype.build = function () {
        this._build(false);
    };

    ExportViewCommand.prototype.rebuild = function () {
        this._build(true);
    };

    ExportViewCommand.prototype._error = function (msg) {
        topic.publish('#REQUEST.log', '<div style="color: #d9534f;">Build error occurred, build is stopped</div>');
        topic.publish('#REQUEST.log', '<div style="color: #d9534f;">' + msg + '</div>');
    };

    ExportViewCommand.prototype._build = function (rebuild, profile, signing) {
        var self = this;
        var start = new Date().getTime();
        var type = rebuild ? Build.TYPE.REBUILD : Build.TYPE.BUILD;
        var pfName;
        this.buildWithConsole(type, profile, signing,
            function (projectInfo, profileName) {
                topic.publish('#REQUEST.log', '[' + projectInfo.name + '][' + profileName + '] Building...');
                pfName = profileName;
            },
            function (err, result, builder) {
                logger.log('buildWithConsole', result);
                var done = false;
                if (err) {
                    self._error(err);
                    done = true;
                }
                else if (result.status) {
                    var message = '';
                    if (result.status.state !== undefined) {
                        message = BuildProfile.STATE[result.status.state].text;
                    } else {
                        message = result.status.ret;
                    }
                    var apkPath;
                    if (result.status.ret === BuildProfile.STATE_SUCCESS) {
                        apkPath = builder.getApkPath(result.status);
                        // Should append "void(0)" to prevent location change (<a href=>)
                        var script = 'require([\'plugins/project-wizard/build/build\'],' +
                            'function (Build) {' +
                                'var build = new Build();' +
                                'build.downloadPackageFile(\'' + apkPath + '\', \'' + result.status.uri + '\');' +
                            '}); void(0);';
                        topic.publish('#REQUEST.log', 'Output: <a href="javascript:' +
                                      script + '">' + apkPath + '</a>');
                        var end = new Date().getTime();
                        BuildMenu.printElapsedTime(end - start);
                        done = true;
                    } else if (result.status.ret === BuildProfile.STATE_ERROR) {
                        self._error(result.status[BuildProfile.STATE_ERROR_MESSAGE]);
                        done = true;
                    } else {
                        topic.publish('#REQUEST.log', '\t' + message);
                    }
                    if (done) {
                        topic.publish('project/build/end', {
                            profileName: pfName,
                            taskId: result.status.taskId,
                            pkg: apkPath
                        });
                    }
                }
                else {
                    topic.publish('project/build/start', {
                        profileName: pfName,
                        taskId: result
                    });
                }
                return done;
            }
        );
    };

    ExportViewCommand.prototype.buildClean = function () {
        var self = this;
        var start = new Date().getTime();
        var pfName;
        this.buildWithConsole(Build.TYPE.CLEAN, null, null,
            function (projectInfo, profileName) {
                topic.publish('#REQUEST.log', '[' + projectInfo.name + '][' + profileName + '] Cleaning...');
                pfName = profileName;
            },
            function (err, result) {
                if (err) {
                    self._error(err);
                } else {
                    topic.publish('#REQUEST.log', '\t' + result);
                    var end = new Date().getTime();
                    BuildMenu.printElapsedTime(end - start);
                    topic.publish('project/build/cleaned', {
                        profileName: pfName
                    });
                }
            }
        );
    };

    ExportViewCommand.prototype.buildWithConsole = function (buildType, profile, signing, beforeBuild, afterBuild) {
        var self = this;
        var fn = function (profile) {
            logger.log('buildWithConsole', profile);
            vm.getView('Output').select();
            if (profile) {
                var profileName = profile;
                beforeBuild(self.projectInfo, profileName);
                var buildProfile = BuildProfile.getBuildProfile(mBuildStore.data, profileName);
                self.buildMenu.requestBuild(buildType, buildProfile, signing, null, afterBuild, monitor);
            }
        };
        if (profile) {
            fn(profile);
        } else {
            this.selectProfile(fn);
        }
    };

    ExportViewCommand.prototype.buildWithUI = function (element, buildType) {
        $(element).next('.msg').removeClass('label-danger label-info').hide();
        var profileName = $(element).attr('data-build-profile');
        var buildProfile = BuildProfile.getBuildProfile(mBuildStore.data, profileName);
        this.buildMenu.requestBuild(buildType, buildProfile, null, element, null, monitor);
    };

    ExportViewCommand.prototype.buildSigned = function () {
        var self = this;
        this.selectSigning(function (profile, signing) {
            logger.log('buildSigned', profile, signing);
            vm.getView('Output').select();
            if (signing) {
                // rebuild with signing
                self._build(true, profile, signing);
            }
        });
    };

    ExportViewCommand.prototype.selectSigning = function (cb) {
        var self = this;
        var options = {
            filter: function (grid, data) { // to disable 'debug' profile
                //logger.log('grid filter', data);
                if (data) {
                    $.each(data, function (index, profile) {
                        if (profile && profile.type === BuildProfile.TYPE.DEBUG) {
                            grid.rowSelectCell.setDisabled(index, true);
                        }
                    });
                }
            },
            message: Messages.SELECT_RELEASE_CONFIGURATION
        };

        this.selectProfile(function (profile) {
            logger.log('selectSigning', profile);
            if (profile) {
                self.buildMenu.selectSigning(self.projectInfo, function (signing) {
                    cb(profile, signing);
                });
            }
        }, options);
    };

    ExportViewCommand.prototype.selectProfile = function (cb, options) {
        var self = this;
        this.refresh().then(
            function () {
                self.buildMenu.selectProfile(self.projectInfo, mBuildStore, options, function (profile) {
                    if (!profile) {
                        vm.getView('Output').select();
                        topic.publish('#REQUEST.log', Messages.NO_PROFILE);
                    }
                    cb(profile);
                });
            }
        );
    };

    ExportViewCommand.prototype._profileSelected = function () {
        var self = this;
        return function (element, checked) {
            var $BuildTable = $('#exportBuildTargets').find('table');
            var profileName = element.val();
            var id = 'export-' + profileName;
            if (checked) {
                var chkId = id + '-chk';
                var buildId = id + '-build';
                var rebuildId = id + '-rebuild';
                var cleanId = id + '-clean';
                var dropdownId = id + '-dropdown';
                var progressId = id + '-progress';
                if (!$('#' + id).get(0)) {
                    var buildProfile = BuildProfile.getBuildProfile(mBuildStore.data, profileName);
                    $BuildTable.find('tbody').append(
                        '<tr id="' + id + '">' +
                        '<td class="ItemCheck"><input name="export-chk" id="' + chkId +
                            '" type="checkbox" data-build-profile="' + profileName + '"></td>' +
                        '<td class="ItemTitle"><label>' + profileName + '</label></td>' +
                        '<td class="ItemPlatform"><label class="build__platform"></label><span>' +
                            buildProfile.platform + '</span><div class="pkg-download-pane"></div></td>' +
                        '<td class="ItemBuild">' +
                        '<div id="' + dropdownId + '" class="g__dropdown-build">' +
                            '<span>Build</span>' +
                            '<ul class="dropdown">' +
                                '<li><a href="#" id="' + buildId + '" data-build-profile="' +
                                    profileName + '">Build</a></li>' +
                                '<li><a href="#" id="' + rebuildId + '" data-build-profile="' +
                                    profileName + '">Rebuild</a></li>' +
                                '<li><a href="#" id="' + cleanId + '" data-build-profile="' +
                                    profileName + '">Clean</a></li>' +
                            '</ul>' +
                        '</div>' +
                        '<button id="' + progressId + '" class="ladda-button" data-color="mint" ' +
                            'data-style="expand-right" data-size="xs">Progress</button>' +
                        '<div class="msg label"></div>' +
                        '</td>' +
                        '</tr');

                    var $tr = $('#' + id);
                    $tr.find('.build__platform').addClass(buildProfile.platform);

                    var $build = $('#' + buildId);
                    $build.click(function () {
                        self.buildWithUI(this, Build.TYPE.BUILD);
                    });
                    var $rebuild = $('#' + rebuildId);
                    $rebuild.click(function () {
                        self.buildWithUI(this, Build.TYPE.REBUILD);
                    });
                    var $clean = $('#' + cleanId);
                    $clean.click(function () {
                        self.buildWithUI(this, Build.TYPE.CLEAN);
                    });

                    var progress = document.getElementById(progressId);
                    $(progress).hide();
                    if (!monitor[profileName]) { // added profile by user
                        monitor[profileName] = self._createMonitor();
                    }
                    require(['lib/test/ladda.min'], function (ProgressButton) {
                        var progressButton = ProgressButton.create(progress);
                        monitor[profileName].progressButton = progressButton;
                    });

                    var $dropdown = $('#' + dropdownId);
                    new DropDown($dropdown);  //jshint ignore: line
                }
            } else {
                $BuildTable.find('#' + id).remove();
                delete monitor[profileName].progressButton;
            }
            $mBuildProfiles.siblings('div').children('ul').dropdown('toggle');
        };
    };

    ExportViewCommand.prototype._rebuildBuildProfileCombo = function (build) {
        var self = this;
        if ($mBuildProfiles) {
            var selected = $mBuildProfiles.val();
            $mBuildProfiles.empty();
            var names = BuildProfile.getBuildProfileNames(build);
            //logger.log('names', names);
            $.each(names, function (index, value) {
                var $option = $('<option value=\'' + value + '\'>' + value + '</option>');
                $mBuildProfiles.append($option);
            });
            var _profileSelected = self._profileSelected();
            $mBuildProfiles.multiselect('setOptions', {
                includeSelectAllOption: false,
                enableCaseInsensitiveFiltering: false,
                onChange: _profileSelected
            });
            $mBuildProfiles.multiselect('rebuild');
            if (selected) {
                $.each(selected, function (index, value) {
                    $mBuildProfiles.multiselect('select', value);
                });
            }
        }
    };

    ExportViewCommand.prototype.downloadProject = function () {
        var projectPath = this.getProjectPath();
        var exportName = pathUtil.getName(projectPath) + '.zip';
        exportName = encodeURI(exportName); // match decodeURI at Node constructor for server
        logger.log('downloadProject', pathUtil.detachSlash(projectPath));
        fsMount.exportZip([pathUtil.detachSlash(projectPath)], exportName);
    };

    ExportViewCommand.prototype._editProfile = function (projectInfo, buildStore, selected) {
        var self = this;
        require(['plugins/project-wizard/build/buildProfile-edit'], function (EditBuildProfile) {
            var editBuildProfile = new EditBuildProfile(projectInfo, buildStore);
            editBuildProfile.doEdit(selected).then(
                function (data) {
                    self._rebuildBuildProfileCombo(data);
                }
            );
        });
    };

    ExportViewCommand.prototype.deploy = function () {
        require(['plugins/deploy/deploy-commands'], function (deployCommand) {
            deployCommand.deploy();
        });
    };

    return new ExportViewCommand();
});
