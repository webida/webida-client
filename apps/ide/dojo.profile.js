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

var profile = (function () {
    return {
        basePath: "./",
        releaseDir: "dojo-built",
        action: "release",
        packages:[{
            name: "dojo",
            location: "dojo-release-1.9.1-src/dojo"
        }, {
            name: "dijit",
            location: "dojo-release-1.9.1-src/dijit"
        }, {
            name: "dojox",
            location: "dojo-release-1.9.1-src/dojox"
        }],
        layers: {
            "dojo/dojo": {
                include: [
                    'dojo/_base/lang',
                    'dojo/aspect',
                    'dojo/data/ItemFileWriteStore',
                    'dojo/data/ObjectStore',
                    'dojo/Deferred',
                    'dojo/dom',
                    'dojo/dom-attr',
                    'dojo/dom-class',
                    'dojo/dom-construct',
                    'dojo/dom-geometry',
                    'dojo/dom-style',
                    'dojo/fx/Toggler',
                    'dojo/html',
                    'dojo/keys',
                    'dojo/NodeList-traverse',
                    'dojo/on',
                    'dojo/parser',
                    'dojo/promise/all',
                    'dojo/query',
                    'dojo/store/Memory',
                    'dojo/store/Observable',
                    'dojo/topic',
                    'dojo/window'
                ],
            },
            "dijit/dijit": {
                include: [
                    'dijit/Dialog',
                    'dijit/focus',
                    'dijit/Menu',
                    'dijit/MenuItem',
                    'dijit/CheckedMenuItem',
                    'dijit/RadioMenuItem',
                    'dijit/PopupMenuItem',
                    'dijit/MenuBar',
                    'dijit/PopupMenuBarItem',
                    'dijit/MenuBarItem',
                    'dijit/DropDownMenu',
                    'dijit/MenuSeparator',
                    'dijit/registry',
                    'dijit/Toolbar',
                    'dijit/form/Button',
                    'dijit/form/DropDownButton',
                    'dijit/form/ComboButton',
                    'dijit/form/CheckBox',
                    'dijit/form/TextBox',
                    'dijit/form/Select',
                    'dijit/form/RadioButton',
                    'dijit/Tree',
                    'dijit/tree/dndSource',
                    'dijit/tree/ObjectStoreModel',
                    'dijit/TitlePane',
                    'dijit/ProgressBar',
                    'dijit/form/HorizontalSlider',
                    'dijit/form/HorizontalRule',
                    'dijit/form/HorizontalRuleLabels',
                    'dijit/form/SimpleTextarea',
                    'dijit/layout/TabContainer',
                    'dijit/layout/ContentPane',
                    'dijit/layout/BorderContainer',
                    'dijit/popup'
                ]
            },
            "dojox/dojox": {
                include: [
                    'dojox/layout/ExpandoPane',
                    'dojox/layout/ToggleSplitter',
                    'dojox/layout/FloatingPane',
                    'dojox/grid/DataGrid',
                    'dojox/grid/EnhancedGrid',
                    'dojox/grid/enhanced/plugins/IndirectSelection',
                    'dojox/grid/enhanced/plugins/Pagination',
                ]
            }
       }
    };
})();
