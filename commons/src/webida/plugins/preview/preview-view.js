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

/* global timedLogger:true */

var t;
define([(t = timedLogger.getLoggerTime(), 'require'),
        'webida-lib/plugins/workbench/plugin',
        'webida-lib/widgets/views/view',              // View
        'webida-lib/widgets/views/viewToolbar',       // ViewToolbar
        'text!./layout/preview.html',                 // previewTemplate
        'text!./layout/preview-toolbar.html',         // previewToolbarTemplate
       ],
function (require,
          workbench,
          View,
          ViewToolbar,
          previewTemplate,
          previewToolbarTemplate) {
    'use strict';

    t = timedLogger.log('loaded modules required by preview. initializing preview\'s module', t);

    var previewView;
    function getView() {
        if (!previewView) {
            previewView = new View('previewTab', 'Preview');
            previewView.setContent('<div id="PreviewTab" style="width:100%; height:100%">');
        }
        return previewView;
    }

    function onViewAppended() {
        console.assert(previewView, 'assertion fail: getView must be called previously');
        var opt = {};
        opt.title = 'Preview';
        opt.key = 'P';
        workbench.registToViewFocusList(previewView, opt);

        // default view template append
        $('#PreviewTab').append(previewTemplate);

        // default preview toolbar append
        var vt = new ViewToolbar($('.preview-toolbar-panel')[0],
                                 previewView.contentPane);
        vt.setContent(previewToolbarTemplate);

        require(['./preview-pref-values', './preview-commands'], function () { });
    }

    timedLogger.log('initialized preview\'s module', t);

    return {
        getView: getView,
        onViewAppended: onViewAppended,
    };
});

