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
 * The CheckBoxTree is a dijit widget extending the dijit/Tree.
 *
 * @since: 2015.09.03
 * @author : minsung-jin
 */

define([
    'dojo',
    'dojo/_base/declare',
    'dijit/registry',
    'dijit/Tree',
    'dijit/form/CheckBox',
    'dojo/text!./layout/CheckBoxTreeNode.html',
    'dojo/text!./layout/CheckBoxTree.html'
],
function (
    dojo,
    declare,
    registry,
    Tree,
    CheckBox,
    CheckBoxTreeNodeTemplate,
    CheckBoxTreeTemplate
) {
    'use strict';

    var webidaHost = decodeURIComponent(
        document.cookie.replace(
            /(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1')
    );

    var CheckBoxTreeNode = declare([Tree._TreeNode], {

        templateString: CheckBoxTreeNodeTemplate,

        _checkbox: null,

        _createCheckbox: function () {

            this._checkbox = new CheckBox({
                checked: true
            });

            dojo.place(this._checkbox.domNode, this.iconNode, 'before');
        },

        postCreate: function () {

            if (this.tree.isCheckable(this.item)) {
                this._createCheckbox();
            }

            Tree._TreeNode.prototype.postCreate.call(this);
        }
    });

    var _template =
        CheckBoxTreeTemplate.replace(/<%webida-host%>/g, webidaHost);

    var _checkBoxTree = declare([Tree], {
        openOnDbClick: true,

        templateString: _template,

        onNodeChecked: function (/*storeItem, node*/) { },

        onNodeUnchecked: function (/*storeItem, node*/) { },

        onNodeDblClicked: function (/*storeItem, node*/) { },

        onNodeEnterKey: function (/*storeItem, node*/) { },

        isCheckable: function (/*storeItem, node*/) {
            return true;
        },

        _onClick: function (node, e) {
            if (e.target.nodeName === 'INPUT') {
                if (node._checkbox.checked) {
                    this.onNodeChecked(node.item, node);
                } else {
                    this.onNodeUnchecked(node.item, node);
                }
                return;
            } else if (e._origType === 'keyup') {
                // 'Enter/Space' key pressed
                this.onNodeEnterKey(node.item, node);
            }

            var nodeWidget = registry.getEnclosingWidget(e.target);
            if (nodeWidget.isInstanceOf(CheckBoxTreeNode)) {
                return Tree.prototype._onClick.call(this, node, e);
            }
        },

        _onDblClick: function (node, e) {
            this.onNodeDblClicked(node.item, node);

            var nodeWidget = registry.getEnclosingWidget(e.target);
            if (nodeWidget.isInstanceOf(CheckBoxTreeNode)) {
                return Tree.prototype._onClick.call(this, node, e);
            }
        },

        _onDownArrow: function (e, node) {
            var nodeWidget = registry.getEnclosingWidget(e.target);
            if (nodeWidget.isInstanceOf(CheckBoxTreeNode)) {
                Tree.prototype._onDownArrow.call(this, e, node);
            }

            var path = this.focusedChild.getTreePath().map(function (obj) {
                return obj.id;
            });
            this.set('path', path);
        },

        _onUpArrow: function (e, node) {
            var nodeWidget = registry.getEnclosingWidget(e.target);
            if (nodeWidget.isInstanceOf(CheckBoxTreeNode)) {
                Tree.prototype._onUpArrow.call(this, e, node);
            }

            var path = this.focusedChild.getTreePath().map(function (obj) {
                return obj.id;
            });
            this.set('path', path);
        },

        _createTreeNode: function (args) {

            return new CheckBoxTreeNode(args);
        }

    });

    _checkBoxTree._TreeNode = CheckBoxTreeNode;

    return _checkBoxTree;
});
