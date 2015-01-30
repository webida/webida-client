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
 * webida - progress plugin
 *
 * Src:
 *   plugins/progress/plugin.js
 */
define(['widgets/progress',
    	'widgets/views/view',
        'dojo/parser',
        'dijit/registry',
        'dijit/ProgressBar',
        'dijit/layout/TabContainer',
        'dijit/layout/ContentPane',
        'dojo/dom',
    	'plugins/workbench/plugin',
        'dojo/domReady!'
], function (progressDlg, View, parser, reg, progressBar, tabContainer,
    ContentPane, dom, workbench) {

    'use strict';
    // console.log('open progress');   please mark you name when adding a debug message
    var module = {};
    var view = null;
    var accordion = null;

    /**
     * @class Progress
     */
    var Progress = function (isShowDialog, titleText, labelText, indeterminate,
        max) {
        var progressDialog = null;
        var tabProgress = null;
        var pane = null;
        var showDialog = false;
    };

    Progress.prototype.init = function (isShowDialog, titleText, labelText,
        indeterminate, max) {
        this.showDialog = isShowDialog;
        if (this.showDialog === true) {
            this.progressDialog = new progressDlg();

            this.progressDialog.openDialog(titleText, labelText,
                indeterminate, max);
        }

        this.pane = new ContentPane({
            style: ' width:100%; height:50px',
            title: titleText,
            content: '<div style="height:20px">' + titleText + '</div>',
            closable: false
        });

        this.tabProgress = new progressBar({
            style: "right:5px; left:2px;  height:18px ",
            label: labelText,
            indeterminate: indeterminate,
            max: max
        });

        this.pane.addChild(this.tabProgress);

		var content = dom.byId("progress_tab_content");
        if(content){
        	dom.byId("progress_tab_content").appendChild(this.pane.domNode);
        }
    };

    Progress.prototype.setValue = function (value) {
        if (this.showDialog === true) {
        	this.progressDialog.setValue(value);
        }
        this.tabProgress.set('value', value);
    };

    Progress.prototype.setLabel = function (label) {
        if (this.showDialog === true) {
        	this.progressDialog.setLabel(label);
        }
        this.tabProgress.set('label', label);
    };

    Progress.prototype.setAttr = function (attr, value) {
        if (this.showDialog === true) {
        	this.progressDialog.setAttr(attr, value);
        }
        this.tabProgress.set(attr, value);
    };

    Progress.prototype.complete = function () {
        if (this.showDialog === true) {
        	this.progressDialog.complete();
        }
        var max = this.tabProgress.get('max');
        this.tabProgress.set('value', max);
    };

    Progress.prototype.titelText = function (title) {
        this.pane.set('content', '<div style="height:20px">' + title + '</div>');
    };

    module.newProgress = function (isShowDialog, titleText, labelText,
        indeterminate,
        max) {
        var Pro = new Progress();
        Pro.init(isShowDialog, titleText, labelText, indeterminate, max);
        return Pro;
    };

    module.getView = function () {
        var view = new View('progressTab', 'Progress');
        view.setContent('<div id="progress_tab_content" style="width:95%">');
        return view;
    }

    module.onViewAppended = function () {

    };

    return module;
});
