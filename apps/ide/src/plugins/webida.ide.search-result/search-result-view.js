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
 * This file shows up the search result list.
 *
 * @since: 2015.09.03
 * @author : minsung-jin
 */
define([
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/widgets/checkbox-tree/CheckBoxTree',
    'webida-lib/widgets/views/view',
    'webida-lib/widgets/views/viewToolbar',
    'text!./layout/search-result.html',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/form/ComboBox',
    'dijit/registry',
    'dijit/tree/ObjectStoreModel',
    'dojo/html',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'dojo/topic',
    './search-result-controller',
    'xstyle/css!./style/search-result.css',
], function (
    workbench,
    Tree,
    View,
    ViewToolbar,
    Template,
    button,
    checkBox,
    comboBox,
    registry,
    ObjectStoreModel,
    html,
    Memory,
    Observable,
    topic,
    controller
) {
    'use strict';

    var SearchResultView;

    function getView() {

        if (!SearchResultView) {
            var view = new View('searchResultTab', 'Search');
            view.setContent(Template);
            SearchResultView = view;
        }

        return SearchResultView;
    }

    function onViewAppended() {

        var view = SearchResultView;
        if (view) {
            var opt = {
                title: 'Search',
                key: 'N'
            };
            workbench.registToViewFocusList(view, opt);
        }

        var findInput = registry.byId('find-input');
        var findButton = registry.byId('find-button');
        var replaceInput = registry.byId('replace-input');
        var replaceButton = registry.byId('replace-button');
        var scopeSelect = registry.byId('scope-select');
        var regEx = registry.byId('regular-expression');
        var ignoreCase = registry.byId('ignore-case');
        var wholeWord = registry.byId('whole-word');
        var clearButton = registry.byId('clear-button');

        var scopeStore = [
            { name: 'Workspace', id: 'W' },
            { name: 'Project', id: 'P' },
            { name: 'Selection', id: 'S'}
        ];

        scopeSelect.set({
            store: new Observable(new Memory({ data: scopeStore })),
            searchAttr: 'name',
            placeHolder: 'Select or enter a full path',
            queryExpr: '*${0}*',
            autoComplete: false,
            trim: true,
            searchDelay: 300,
            value: scopeStore[2].name
        });

        function _removeTreePanel() {
            while ($('.search-result-tree-panel').get(0).hasChildNodes()) {
                $('.search-result-tree-panel').get(0).removeChild(
                    $('.search-result-tree-panel').get(0).lastChild);
            }
        }

        function _getScopePath() {

            var path;
            controller.handleSelection(
                scopeSelect.getValue(),
                function (err, data) {
                if (!err) {
                    path = data;
                }
            });

            return path;
        }

        function _getMetadata() {

            var metadata = {
                pattern : findInput.getValue(),
                replaceWith : replaceInput.getValue(),
                path : _getScopePath(),
                regEx : regEx.checked,
                ignoreCase : ignoreCase.checked,
                wholeWord : wholeWord.checked,
            };

            return metadata;
        }

        function _setTree(err, data) {

            var title = err ? err : data.title;
            $('<div class="search-result-title"></div>').appendTo(
                $('.search-result-tree-panel').get(0));

            html.set($('.search-result-title').get(0), title,
                     {parseContent: true});

            if (err) {
                return;
            }

            var store = data.store;
            $('<div class="search-result-tree"></div>').appendTo(
                $('.search-result-tree-panel').get(0));

            store = new Observable(store);

            var resultModel = new ObjectStoreModel({
                store: store,
                query: { id: 'id0' },
            });

            void new Tree({
                model: resultModel,

                style: 'hight:100px;padding-left:0px;',

                getIconClass: function (item, opened) {

                    return (!item || (item.type === 'directory')) ?
                        (opened ? 'dijitFolderOpened' : 'dijitFolderClosed') :
                        (item.type === 'file') ? 'dijitLeaf' : 'none';
                },

                showRoot: false,

                persist: false,

                autoExpand: true,

                openOnClick: false,

                onNodeChecked: function (item, node) {

                    function setChecked(node) {

                        node.getChildren().forEach(function (value) {
                            if (value.item.type !== 'text') {
                                value._checkbox.set('checked', true);
                            }
                            setChecked(value);
                        });
                    }

                    function checkParent(node) {

                        var parentNode = node.getParent();
                        if (!parentNode._checkbox) {
                            return;
                        }

                        var children = parentNode.getChildren();
                        var checked = true;
                        for (var i = 0; i < children.length; i++) {
                            if (children[i]._checkbox.checked === false) {
                                checked = false;
                                break;
                            }
                        }

                        parentNode._checkbox.set('checked', checked);
                        if (checked) {
                            checkParent(parentNode);
                        }
                    }

                    setChecked(node);
                    checkParent(node);
                },

                onNodeUnchecked: function (item, node) {
                    var self = this;

                    function setUnchecked(node) {

                        var parent = node.getParent();
                        if (parent.id !== self.rootNode.id) {
                            parent._checkbox.set('checked', false);
                            setUnchecked(parent);
                        }
                    }

                    function checkChildren(node) {

                        var children = node.getChildren();
                        if (children && children.length) {
                            children.forEach(function (child) {
                                if (child.item.type !== 'text') {
                                    child._checkbox.set('checked', false);
                                }
                                checkChildren(child);
                            });
                        }
                    }

                    setUnchecked(node);
                    checkChildren(node);
                },

                onNodeDblClicked: function (item) {
                    topic.publish('editor/open', item.path);
                },

                onNodeEnterKey: function (item) {
                    if (item.type !== 'directory') {
                        topic.publish('editor/open', item.path);
                    }
                },

                isCheckable: function (item) {
                    return item.type !== 'text';
                }
            }, $('.search-result-tree').get(0)).startup();
        }

        dojo.connect(findButton, 'onClick', function () {

            _removeTreePanel();
            var jobId = workbench.addJob('Searching... ');
            controller.handleFind(_getMetadata(), function (err, data) {
                if (err) {
                    _setTree(err, data);
                } else {
                    _setTree(err, data);
                }
                workbench.removeJob(jobId);
            });
        });

        dojo.connect(replaceButton, 'onClick', function () {

            _removeTreePanel();
            var jobId = workbench.addJob('Replacing... ');
            controller.handleReplace(_getMetadata(), function (err, data) {
                if (err) {
                    _setTree(err, data);
                } else {
                    _setTree(err, data);
                }
                workbench.removeJob(jobId);
            });
        });

        dojo.connect(clearButton, 'onClick', function () {

            _removeTreePanel();
        });
    }

    return {
        getView : getView,
        onViewAppended : onViewAppended,
    };
});
