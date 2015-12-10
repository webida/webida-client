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
 * webida - preview plugin
 *
 */

define([
    'require',
    'dojo/i18n!./nls/resource',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/widgets/views/view',              // View
    'webida-lib/widgets/views/viewToolbar',       // ViewToolbar
    'text!./layout/preview.html',                 // previewTemplate
    'text!./layout/preview-toolbar.html',         // previewToolbarTemplate
    'webida-lib/util/locale',
    'webida-lib/util/logger/logger-client'
], function (
    require,
    i18n,
    workbench,
    View,
    ViewToolbar,
    previewTemplate,
    previewToolbarTemplate,
    locale,
    Logger
) {
    'use strict';

    function _loadCss(url) {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    _loadCss(require.toUrl('./style/preview.css'));

    var singleLogger = new Logger.getSingleton();
    //var logger = new Logger.getSingleton();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    singleLogger.log('loaded modules required by preview. initializing preview\'s module');

    var previewView;
    function getView() {
        if (!previewView) {
            previewView = new View('previewTab', i18n.preview);
            previewView.setContent('<div id="PreviewTab" style="width:100%; height:100%">');
        }
        return previewView;
    }

    function onViewAppended() {
        console.assert(previewView, 'assertion fail: getView must be called previously');
        var opt = {};
        opt.title = i18n.preview;
        opt.key = 'P';
        workbench.registToViewFocusList(previewView, opt);

        // default view template append
        $('#PreviewTab').append(previewTemplate);

        // default preview toolbar append
        var vt = new ViewToolbar($('.preview-toolbar-panel')[0],
                                 previewView.contentPane);
        vt.setContent(previewToolbarTemplate);
        locale.convertMessage(i18n, 'data-message');

        require(['./preview-pref-values', './preview-commands'], function () { });
    }

    singleLogger.log('initialized preview\'s module');

    return {
        getView: getView,
        onViewAppended: onViewAppended,
    };
});

