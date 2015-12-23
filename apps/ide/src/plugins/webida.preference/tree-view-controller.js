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
 * @file Controller for the tree view included in the preference dialog
 * @since 1.4.0
 * @author kyungmi.k@samsung.com
 */

define([
    'external/lodash/lodash.min',
    './preference-manager',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'text!./layout/preferences-tree.html',
    'xstyle/css!./style/style.css'
], function (
    _,
    manager,
    ButtonedDialog,
    template
) {
    'use strict';

    var module = {};
    var nodes = [];
    var selectedNode;
    var compiledTemplate = _.template(template);
    var listeners = [];
    var treeElement;
    var selectionBlocked = false;

    function setSelection(nodeId) {
        if (!selectionBlocked) {
            selectedNode = _.find(nodes, {id: nodeId});
            $('[data-id].selected').removeClass('selected');
            $('[data-id="' + nodeId + '"]').addClass('selected');
            for (var i = 0; i < listeners.length; i++) {
                listeners[i](selectedNode);
            }
        }
    }

    function toggleExpanded(nodeId) {
        var node = getNode(nodeId);
        if (node.hasChild){
            node.expanded = !node.expanded;
            if (node.expanded) {
                // to be expanded
                var children = getChildNodes(nodeId);
                _.forEach(children, function (child) {
                    $('[data-id="' + child.id + '"]').show();
                });
                $('[data-id="' + nodeId + '"]').removeClass('collapsed').addClass('expanded');
            } else {
                // to be collapsed
                var descendants = getAllDescendantNodes(nodeId);
                _.forEach(descendants, function (child) {
                    $('[data-id="' + child.id + '"]').hide();
                    child.expanded = false;
                    $('[data-id="' + child.id + '"]').removeClass('expanded').addClass('collapsed');
                });
                $('[data-id="' + nodeId + '"]').removeClass('expanded').addClass('collapsed');
            }
        }
    }

    function getNode(nodeId) {
        return _.find(nodes, {id: nodeId});
    }

    function getChildNodes(nodeId) {
        return _.filter(nodes, {parent: nodeId});
    }

    function getAllDescendantNodes(nodeId) {
        return _.filter(nodes, function (node) {
            return node.hierarchies.indexOf(nodeId) > -1;
        });
    }

    function makeNodes(preferenceTypes) {
        nodes = [];
        if (preferenceTypes.length > 0) {
            nodes = preferenceTypes.map(function (type) {
                var hierarchies = (type.hierarchy) ? type.hierarchy.split('/') : [];
                var parent = _.last(hierarchies);
                var hasChild = _.some(preferenceTypes, function (child) {
                    return child.hierarchy.indexOf(type.id) > -1;
                });

                return {
                    id: type.id,
                    name: type.name,
                    hierarchies: hierarchies,
                    parent: parent,
                    hasChild: hasChild,
                    expanded: false,
                    selected: false
                };
            });

            _.forEach(nodes, function (node) {
                var parentNode;
                var i;
                for (i = node.hierarchies.length - 1; i >= 0; i--) {
                    parentNode = getNode(node.hierarchies[i]);
                    if (parentNode) {
                        node.parent = parentNode.id;
                        break;
                    }
                }
                if (!parentNode) {
                    node.parent = '';
                    node.hierarchies = [];
                } else {
                    node.hierarchies = node.hierarchies.splice(0, i + 1);
                }
            });

            nodes[0].selected = true;
            setSelection(nodes[0].id);
        }
    }

    module.getPage = function (preferenceTypes) {
        makeNodes(preferenceTypes);
        treeElement = $(compiledTemplate({categories: nodes})).get(0);
        return treeElement;
    };

    module.onPageAppended = function () {
        $(treeElement).find('.preferenceview-category-item').on('click', function () {
            var nodeId = $(this).attr('data-id');
            setSelection(nodeId);
        });
        $(treeElement).find('.preferenceview-category-item__tree').on('click', function (event) {
            event.stopPropagation();
            var nodeId = $(this).attr('data-id');
            toggleExpanded(nodeId);
        });
    };

    module.onPageRemoved = function () {
        $(treeElement).find('.preferenceview-category-item').off();
        $(treeElement).find('.preferenceview-category-item__tree').off();
    };

    module.addSelectionChangedListener = function (listener) {
        if (listeners.indexOf(listener) === -1) {
            listeners.push(listener);
        }
    };

    module.removeSelectionChangedListener = function (listener) {
        var index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };

    module.blockTreeSelection = function (blocked) {
        selectionBlocked = blocked;
    };

    return module;
});
