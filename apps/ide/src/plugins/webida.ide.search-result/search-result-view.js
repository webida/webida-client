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
 * @since 1.4.1
 * @author minsung.jin@samsung.com
 */
define([
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/form/ComboBox',
    'dijit/registry',
    'dijit/tree/ObjectStoreModel',
    'dojo/html',
    'dojo/i18n!./nls/resource',
    'dojo/keys',
    'dojo/on',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'dojo/topic',
    'text!./layout/search-result.html',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/locale',
    'webida-lib/widgets/checkbox-tree/CheckBoxTree',
    'webida-lib/widgets/views/view',
    './search-result-controller',
    'xstyle/css!./style/search-result.css',
], function (
    button,
    checkBox,
    comboBox,
    registry,
    ObjectStoreModel,
    html,
    i18n,
    keys,
    on,
    Memory,
    Observable,
    topic,
    Template,
    workbench,
    locale,
    Tree,
    View,
    controller
) {
    'use strict';

    var SearchResultView;
    /**
     * Get restricted search-result view
     */
    function getView() {

        if (!SearchResultView) {
            var view = new View('searchResultTab', i18n.search);
            view.setContent(Template);
            SearchResultView = view;
        }

        return SearchResultView;
    }
    /**
     * Called when view is appended
     */
    function onViewAppended() {

        var view = SearchResultView;
        if (view) {
            var opt = {
                title: i18n.search,
                key: 'N'
            };
            workbench.registToViewFocusList(view, opt);
        }

        var pressFindButton;
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
            { name: i18n.workspace, id: 'W' },
            { name: i18n.project, id: 'P' },
            { name: i18n.selection, id: 'S'}
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

        findInput.set('placeHolder', i18n.keyword);
        findButton.set('label', i18n.find);
        replaceInput.set('placeHolder', i18n.with);
        replaceButton.set('label', i18n.replace);
        clearButton.set('label', i18n.clear);

        locale.convertMessage(i18n, 'data-message');

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

        function _openEditor(item) {
            if (item.type === 'directory') {
                return;
            }

            topic.publish('editor/open', item.path, {}, function (part) {
                var viewer = part.getViewer();
                if (typeof viewer.setCursor === 'function') {
                    viewer.setCursor({row: item.line - 1, col: 0});
                }

                if (typeof viewer.setHighlight === 'function') {
                    var metadata = _getMetadata();
                    var options = {
                        caseSensitive: metadata.ignoreCase,
                        regexp: metadata.regEx,
                        wholeWord: metadata.wholeWord
                    };
                    var pattern;
                    if (pressFindButton) {
                        pattern = findInput.getValue();
                    } else {
                        pattern = replaceInput.getValue();
                    }
                    viewer.setHighlight(pattern, options);
                }
            });
        }

        function _setChecked(node) {

            node.getChildren().forEach(function (value) {
                if (value.item.type !== 'text') {
                    value._checkbox.set('checked', true);
                }
                _setChecked(value);
            });
        }

        function _checkParent(node) {

            var parent = node.getParent();
            if (!parent._checkbox) {
                return;
            }
            var children = parent.getChildren();
            var checked = true;
            for (var i = 0; i < children.length; i++) {
                if (children[i]._checkbox.checked === false) {
                    checked = false;
                    break;
                }
            }
            parent._checkbox.set('checked', checked);
            if (checked) {
                _checkParent(parent);
            }
        }

        function _setUnchecked(node, tree) {

            var parent = node.getParent();
            if (parent.id !== tree.rootNode.id) {
                parent._checkbox.set('checked', false);
                _setUnchecked(parent, tree);
            }
        }

        function _uncheckChildren(node) {

            var children = node.getChildren();
            if (children && children.length) {
                children.forEach(function (child) {
                    if (child.item.type !== 'text') {
                        child._checkbox.set('checked', false);
                    }
                    _uncheckChildren(child);
                });
            }
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
                labelAttr: 'label'
            });

            var isCheckable = true;
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
                    if (!isCheckable) {
                        return;
                    }

                    _setChecked(node);
                    _checkParent(node);
                    isCheckable = false;
                    controller.handleCheckbox(item, true, function () {
                        isCheckable = true;
                    });
                },

                onNodeUnchecked: function (item, node) {
                    if (!isCheckable) {
                        return;
                    }

                    var tree = this;
                    _setUnchecked(node, tree);
                    _uncheckChildren(node);
                    isCheckable = false;
                    controller.handleCheckbox(item, false, function () {
                        isCheckable = true;
                    });
                },

                onNodeDblClicked: function (item) {
                    _openEditor(item);
                },

                onNodeEnterKey: function (item) {
                    _openEditor(item);
                },

                addCheckbox: function (item) {
                    return item.type !== 'text';
                }
            }, $('.search-result-tree').get(0)).startup();
        }

        function _startSearch() {
            _removeTreePanel();
            pressFindButton = true;
            var jobId = workbench.addJob(i18n.searching);
            controller.handleFind(_getMetadata(), function (err, data) {
                _setTree(err, data);
                workbench.removeJob(jobId);
            });
        }

        on(findInput, 'keydown', function (e) {

            switch (e.keyCode) {
            case keys.ENTER:
                e.preventDefault();
                _startSearch();
                break;

            default:
                break;
            }
        });

        dojo.connect(findButton, 'onClick', function () {

            _startSearch();
        });

        dojo.connect(replaceButton, 'onClick', function () {

            _removeTreePanel();
            pressFindButton = false;
            var jobId = workbench.addJob(i18n.replacing);
            var metadata = _getMetadata();
            controller.handleReplace(metadata, function (err, title) {
                if (err) {
                    $('<div class="search-result-title"></div>').appendTo(
                        $('.search-result-tree-panel').get(0));
                    html.set($('.search-result-title').get(0), err,
                             {parseContent: true});
                } else {
                    metadata.pattern = metadata.replaceWith;
                    controller.handleFind(metadata, function (err, data) {
                        data.title = title;
                        _setTree(err, data);
                    });
                    workbench.removeJob(jobId);
                }
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

