/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* exported profile */
'use strict';
var profile = {
    basePath: 'deploy/bower_components',
    releaseDir: '../dojo-built',    // same with './deploy/dojo-built'
    action: 'release',

    packages: [{
        name: 'dojo',
        location: 'dojo'
    }, {
        name: 'dijit',
        location: 'dijit'
    }, {
        name: 'dojox',
        location: 'dojox'
    }],

    layers: {
        'dojo/dojo': {
            include: [
                'dojo/_base/declare',
                'dojo/_base/event',
                'dojo/_base/lang',
                'dojo/_base/window',
                'dojo/aspect',
                'dojo/cookie',
                'dojo/data/ItemFileWriteStore',
                'dojo/data/ObjectStore',
                'dojo/Deferred',
                'dojo/dom',
                'dojo/dom-attr',
                'dojo/dom-class',
                'dojo/dom-construct',
                'dojo/dom-geometry',
                'dojo/dom-style',
                'dojo/domReady',
                'dojo/fx/Toggler',
                'dojo/html',
                'dojo/i18n',
                'dojo/keys',
                'dojo/NodeList-traverse',
                'dojo/on',
                'dojo/parser',
                'dojo/promise/all',
                'dojo/query',
                'dojo/ready',
                'dojo/request',
                'dojo/store/Memory',
                'dojo/store/Observable',
                'dojo/string',
                'dojo/text',
                'dojo/topic',
                'dojo/when',
                'dojo/window'
            ]
        },
        'dijit/dijit': {
            include: [
                'dijit/_TemplatedMixin',
                'dijit/_WidgetsInTemplateMixin',
                'dijit/CheckedMenuItem',
                'dijit/Dialog',
                'dijit/DropDownMenu',
                'dijit/focus',
                'dijit/form/Button',
                'dijit/form/CheckBox',
                'dijit/form/ComboBox',
                'dijit/form/ComboButton',
                'dijit/form/DropDownButton',
                'dijit/form/Form',
                'dijit/form/HorizontalRule',
                'dijit/form/HorizontalRuleLabels',
                'dijit/form/HorizontalSlider',
                'dijit/form/RadioButton',
                'dijit/form/Select',
                'dijit/form/SimpleTextarea',
                'dijit/form/TextBox',
                'dijit/form/ValidationTextBox',
                'dijit/layout/BorderContainer',
                'dijit/layout/ContentPane',
                'dijit/layout/LinkPane',
                'dijit/layout/TabContainer',
                'dijit/Menu',
                'dijit/MenuBar',
                'dijit/MenuBarItem',
                'dijit/MenuItem',
                'dijit/MenuSeparator',
                'dijit/popup',
                'dijit/PopupMenuBarItem',
                'dijit/PopupMenuItem',
                'dijit/ProgressBar',
                'dijit/RadioMenuItem',
                'dijit/registry',
                'dijit/TitlePane',
                'dijit/Toolbar',
                'dijit/ToolbarSeparator',
                'dijit/Tooltip',
                'dijit/Tree',
                'dijit/tree/dndSource',
                'dijit/tree/ObjectStoreModel'
            ]
        },
        'dojox/dojox': {
            include: [
                'dojox/grid/DataGrid',
                'dojox/grid/enhanced/plugins/IndirectSelection',
                'dojox/grid/enhanced/plugins/Pagination',
                'dojox/grid/enhanced/plugins/Search',
                'dojox/grid/EnhancedGrid',
                'dojox/layout/ExpandoPane',
                'dojox/layout/FloatingPane',
                'dojox/layout/TableContainer',
                'dojox/layout/ToggleSplitter'
            ]
        }
    },
    mini: true,
    layerOptimize: 'closure',
    //optimize: 'closure',  // This option is too heavy to run for its effectiveness.
    cssOptimize: 'comments',
    stripConsole: 'warn',
    selectorEngine: 'lite'
};
