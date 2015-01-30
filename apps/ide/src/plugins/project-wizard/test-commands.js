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
 * @fileoverview webida - project wizard
 *
 * @version: 0.1.0
 * @since: 2013.10.01
 *
 * Src:
 *   plugins/project-wizard/test-commands.js
 */

/* global timedLogger: true */

var time;
define([(time = timedLogger.getLoggerTime(), 'webida-lib/webida-0.3'),
        'webida-lib/widgets/views/view',
        'webida-lib/widgets/views/viewmanager',
        'webida-lib/util/path',
        'dojo',
        'dojo/Deferred',
        'dojo/topic',
        'webida-lib/plugins/workspace/plugin',
        'plugins/project-configurator/projectConfigurator',
        'lib/test/bootstrap/bootstrap.custom',
        'lib/test/bootstrap/bootstrap-multiselect',
        'text!./layer/test-layout.html',
        'text!./layer/test-toolbar.html',
        'text!./frames.json',
        './messages',
        './view-commands',
        './lib/clipboard',
        './lib/util'
       ],
function (webida, View, vm, pathUtil, dojo, Deferred, topic, wv, projectConfigurator,
    bootstrap, bootstrapMultiselect, tplLayout, tplToolbar, frames,
    Messages, ViewCommand, Clipboard, Util) {
    'use strict';

    time = timedLogger.log('loaded modules required by test. initializing test plugin\'s module', time);

    var VIEW_ID = 'VIEW_TEST';

    var FRAMES = JSON.parse(frames).frames;

    function TestViewCommand() {
        _self = this;
        this.$resolutions = null;
        this.url = null;
    }

    // inherit ViewCommand
    var _super = TestViewCommand.prototype = new ViewCommand(VIEW_ID);
    // correct the constructor pointer because it points to ViewCommand
    TestViewCommand.prototype.constructor = TestViewCommand;
    var _self = null;

    TestViewCommand.prototype.doTest = function () {
        var curDir = wv.getSelectedPath();
        console.log('doTest', curDir || null);

        _super.setHandler();
        _super.createView('Test', 'Test Center', tplLayout);
        _super.getView().select();
    }; // doTest

    TestViewCommand.prototype.onViewAppended = function () {
        _super.initView(tplToolbar, function (selectedProjectPath) {
            if (_self.getProjectPath() === selectedProjectPath) {
                return;
            }
            _self.refreshView();
            Util.selectTab('testTab', 'testPreview');
        });

        _self.$resolutions = $('#testResolutions');
        _self.$resolutions.multiselect({
            includeSelectAllOption: false,
            enableCaseInsensitiveFiltering: false
        });

        _self.init(); // Event listeners should be attached once
        _self.refreshView();
        _super.getView().select();
    };

    TestViewCommand.prototype.init = function () {
        console.log('init');
        var self = this;

        this.setProjectPath(projectConfigurator.getProjectRootPath(wv.getSelectedPath()));
        var projectPath = this.getProjectPath();
        if (!projectPath) {
            console.log(Messages.NO_PROJECT);
            return;
        }

        $('#testAppTitle').text(pathUtil.getName(projectPath));

        $('#testFrames').empty();
        $('.device-list').empty();

        var cbResolutions = self.$resolutions;
        $.each(FRAMES, function (index, value) {
            var $option = $('<option value=\'' + value.label + '\'>' +
                            (value.width + ' x ' + value.height + ' ' + value.label) + '</option>');
            if (value.selected) {
                $option.attr('selected', '');
            }
            cbResolutions.append($option);
        });

        $('#testCapture').click(function () {
            require(['plugins/project-wizard/lib/capture'], function (Capture) {
                var capture = new Capture();
                capture.capture('#testFrames .frame',
                                { base: self.url.substring(0, self.url.lastIndexOf('/') + 1) }).then(
                    function (data) {
                        Util.downloadFile(data, 'screenshot.png');
                    },
                    function (err) {
                        switch (err.message) {
                        case Capture.NONE_SELECTED :
                            Util.showAssist('#testResolutions + .btn-group', Messages.SELECT_RESOLUTIONS);
                            break;
                        }
                    }
                );
            });
        });

        $('#testToolsCompAppPreview').click(function (e) {
            Util.selectTab('testTab', 'testPreview');
            // Stopping the click event from propagating to the document.
            // Bootstrap sets an event listener on the document that closes dropdowns.
            e.stopPropagation();
            $('#testViewOnPhone').find('[data-toggle=dropdown]').dropdown('toggle');
        });

        require(['plugins/project-wizard/device/device'], function (Device) {
            var device = new Device();
            device.init();
        });
    };

    TestViewCommand.prototype.refreshView = function () {
        console.log('refreshView');
        var self = this;
        this.refresh().then(
            function () {
                $('#testAppTitle').text(pathUtil.getName(self.getProjectPath()));
                $('#testFrames').empty();
            }
        );
    };

    TestViewCommand.prototype.refresh = function () {
        console.log('refresh');
        var self = this;
        var deferred = new Deferred();
        this.setProjectPath(projectConfigurator.getProjectRootPath(wv.getSelectedPath()));
        var projectPath = this.getProjectPath();
        if (!projectPath) {
            console.log(Messages.NO_PROJECT);
            return deferred.reject(new Error(Messages.NO_PROJECT));
        }

        var path = pathUtil.detachSlash(projectPath);
        Util.getAliasPathForIndexFile(path, function (url) {
            self.url = url;
            $('#testQRCode').attr('src', '//chart.googleapis.com/chart?cht=qr&chs=150x150&chl=' + url);

            Clipboard.destroy();
            // init ZeroClipboard
            new Clipboard('.js-zeroclipboard', url);

            var cbResolutions = self.$resolutions;
            cbResolutions.multiselect('setOptions', {
                onChange: function () {
                    cbResolutions.siblings('div').children('ul').dropdown('toggle');
                    self.reload(url);
                }
            });
            cbResolutions.multiselect('rebuild');
            // deselect all
            $('option', cbResolutions).each(function () {
                cbResolutions.multiselect('deselect', $(this).val());
            });

            $('#testCapture').prop('disabled', true);

            return deferred.resolve();
        });
        return deferred.promise;
    };

    TestViewCommand.prototype.reload = function (url) {
        var selectedFrames = [];
        $('#testFrames').empty();
        if (this.$resolutions.val()) {
            $('#testCapture').prop('disabled', false);
            $.each(this.$resolutions.val(), function (index, value) {
                var frame = _getFrame(value);
                if (frame) {
                    selectedFrames.push(frame);
                }
            });

            responsivate(url, selectedFrames);
        } else {
            $('#testCapture').prop('disabled', true);
        }
    };

    function responsivate(url, selectedFrames) {
        if (url.indexOf('http:') === -1 && url.indexOf('https:') === -1) {
            url = 'http://' + url;
        }

        require(['plugins/project-wizard/lib/frames'], function (Frames) {
            new Frames({
                'url': url,
                target: '#testFrames',
                frames: selectedFrames
            });
        });
    }

    function _getFrame(value) {
        var frame = null;
        $.each(FRAMES, function (index, FRAME) {
            if (value === FRAME.label) {
                frame = FRAME;
                return false;
            }
        });
        return frame;
    }

    return new TestViewCommand();
});
