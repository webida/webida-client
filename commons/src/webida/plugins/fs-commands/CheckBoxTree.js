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
 * webida - CheckBoxTree.js
 *
 */

define(['dojo',
        'dojo/_base/declare',
        'dijit/Tree',
        'dojo/text!./templates/CheckBoxTreeNode.html',
        'dojo/text!./templates/CheckBoxTree.html'
       ],
function (dojo,
          declare,
          Tree,
          CheckBoxTreeNodeTemplate,
          CheckBoxTreeTemplate
         ) {
    'use strict';

    var webidaHost = decodeURIComponent(
        document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1')
    );

    var CheckBoxTreeNode = declare([Tree._TreeNode], {
        templateString: CheckBoxTreeNodeTemplate,

        _checkbox: null,

        _createCheckbox: function () {
            /*
            this._checkbox = dojo.doc.createElement('input');
            this._checkbox.type = 'checkbox';
            this._checkbox.checked = true;
            */

            /*
            width: auto;
            height: auto;
            position: relative;
            vertical-align: middle;
            */

            //dojo.place(this._checkbox, this.checkBoxNode);
        },

        postCreate: function () {
            this._createCheckbox();
            this.inherited(arguments);
        }
    });

    var _template = CheckBoxTreeTemplate.replace(/<%webida-host%>/g, webidaHost);
    var _checkBoxTree = declare([Tree], {

        templateString: _template,

        onNodeChecked: function (/*storeItem, nodeWidget*/) { },

        onNodeUnchecked: function (/*storeItem, nodeWidget*/) { },

        _onClick: function (nodeWidget, evt) {
            var domElement = evt.target;
            if (domElement.nodeName === 'INPUT') {
                //nodeWidget._checkbox.checked ^ true;	What is this?

                if (nodeWidget._checkbox.checked) {
                    this.onNodeChecked(nodeWidget.item, nodeWidget);
                } else {
                    this.onNodeUnchecked(nodeWidget.item, nodeWidget);
                }

                return;
            }

            var node = dojo.dijit.registry.getEnclosingWidget(evt.target);
            if (node.isInstanceOf(CheckBoxTreeNode)) {
                return this.inherited(arguments);
            }
        },

        _createTreeNode: function (args) {
            return new CheckBoxTreeNode(args);
        }
    });

    _checkBoxTree._TreeNode = CheckBoxTreeNode;

    return _checkBoxTree;
});
