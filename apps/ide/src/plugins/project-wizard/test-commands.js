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
 * @file Manage actions and UI for test commands
 * @since 1.0.0
 * @author kh5325.kim@samsung.com
 * @extends module:ProjectWizard/ViewCommands
 */
define([
    'dojo',
    'dojo/Deferred',
    'dojo/topic',
    'lib/test/bootstrap/bootstrap.custom',
    'lib/test/bootstrap/bootstrap-multiselect',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/path',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/server-api',
    'webida-lib/widgets/views/view',
    'webida-lib/widgets/views/viewmanager',
    'text!./layer/test-layout.html',
    'text!./layer/test-toolbar.html',
    'text!./frames.json',
    './messages',
    './view-commands',
    './lib/clipboard',
    './lib/util'
], function (
    dojo,
    Deferred,
    topic,
    bootstrap,
    bootstrapMultiselect,
    Logger,
    pathUtil,
    wv,
    webida,
    View,
    vm,
    tplLayout,
    tplToolbar,
    frames,
    Messages,
    ViewCommand,
    Clipboard,
    Util
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    var VIEW_ID = 'VIEW_TEST';

    var FRAMES = JSON.parse(frames).frames;

    function TestViewCommand() {
        this.$resolutions = null;
        this.url = null;
    }

    // inherit ViewCommand
    var _super = TestViewCommand.prototype = new ViewCommand(VIEW_ID);
    // correct the constructor pointer because it points to ViewCommand
    TestViewCommand.prototype.constructor = TestViewCommand;

    TestViewCommand.prototype.doTest = function () {
        var curDir = wv.getSelectedPath();
        logger.log('doTest', curDir || null);

        _super.setHandler();
        _super.createView('Test', 'Test Center', tplLayout);
        _super.getView().select();
    }; // doTest

    TestViewCommand.prototype.onViewAppended = function () {
        var self = this;
        _super.initView(tplToolbar, function (selectedProjectPath) {
            if (self.getProjectPath() === selectedProjectPath) {
                return;
            }
            self.refreshView();
            // FIXME use directly `reg.byId('testTab').selectChild()` method
            Util.selectTab('testTab', 'testPreview');
        });

        self.$resolutions = $('#testResolutions');
        self.$resolutions.multiselect({
            includeSelectAllOption: false,
            enableCaseInsensitiveFiltering: false
        });

        self.init(); // Event listeners should be attached once
        self.refreshView();
        _super.getView().select();
    };

    TestViewCommand.prototype.init = function () {
        logger.log('init');
        var self = this;

        this.setProjectPath(pathUtil.getProjectRootPath(wv.getSelectedPath()));
        var projectPath = this.getProjectPath();
        if (!projectPath) {
            logger.log(Messages.NO_PROJECT);
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
            // FIXME use directly `reg.byId('testTab').selectChild()` method
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
        logger.log('refreshView');
        var self = this;
        this.refresh().then(
            function () {
                $('#testAppTitle').text(pathUtil.getName(self.getProjectPath()));
                $('#testFrames').empty();
            }
        );
    };

    TestViewCommand.prototype.refresh = function () {
        logger.log('refresh');
        var self = this;
        var deferred = new Deferred();
        this.setProjectPath(pathUtil.getProjectRootPath(wv.getSelectedPath()));
        var projectPath = this.getProjectPath();
        if (!projectPath) {
            logger.log(Messages.NO_PROJECT);
            return deferred.reject(new Error(Messages.NO_PROJECT));
        }

        var path = pathUtil.detachSlash(projectPath);
        Util.getAliasPathForIndexFile(path, function (url) {
            self.url = url;
            $('#testQRCode').attr('src', '//chart.googleapis.com/chart?cht=qr&chs=150x150&chl=' + url);

            Clipboard.destroy();
            // init ZeroClipboard
            new Clipboard('.js-zeroclipboard', url); //jshint ignore:line

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
            /* jshint -W031 */
            new Frames({
                'url': url,
                target: '#testFrames',
                frames: selectedFrames
            });
             /* jshint +W031 */
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
