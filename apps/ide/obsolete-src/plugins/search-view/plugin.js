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


define(['plugins/workbench/plugin', 'dojo/_base/declare', 'dgrid/Grid', 'dgrid/Selection', 'widgets/views/view', 'widgets/views/viewmanager', 'underscore'],
       function (workbench, declare, Grid, Selection, View, ViewManager, _) {

    var viewsById = {};

    var MyGrid = declare([Grid, Selection]);

    // TODO search history management
    //   -- using "search-view:result-type" extension

    return {
        /*
          result: {
            items: [{
              path?: string,
              location?: Pos | {start: Pos, end: Pos},
              -- additional info columns
            }],
            columns?: [{
              id: string,
              label: string,
              formatter?: (any) => string
            }]
          }
        */
        showResult: function (result, viewId) {
            if (viewId === undefined) {
                viewId = '_default';
            }

            var view;
            if (viewsById.hasOwnProperty(viewId)) {
                view = viewsById[viewId];
                if (! ViewManager.getView(view.id)) {
                    workbench.appendView(view, 'bottom');
                }
            } else {
                view = new View(_.uniqueId('search-view_'), 'Search');
                viewsById[viewId] = view;
                workbench.appendView(view, 'bottom');
            }
            view.getParent().select(view);

            var locationFormatter = function (loc) {
                var posFormatter = function (pos) {
                    return (pos.row + 1) + ':' + (pos.col + 1);
                };
                if (loc.start && loc.end) {
                    return posFormatter(loc.start) + '-' + posFormatter(loc.end);
                } else {
                    return posFormatter(loc);
                }
            };

            var columns;
            if (result.columns) {
                columns = _.map(result.columns, function (col) {
                    if (col.id === 'location' && col.formatter === undefined) {
                        col.formatter = locationFormatter;
                    }
                    return { field: col.id, label: col.label, formatter: col.formatter };
                });
            } else {
                columns = [
                    { field: 'path', label: 'Path' },
                    { field: 'location', label: 'Location', formatter: locationFormatter }
                ];
            }

            view.contentPane.destroyDescendants(false);
            var grid = new MyGrid({
                columns: columns,
                selectionMode: 'single'
            }, view.contentPane.domNode);
            grid.renderArray(result.items);

            grid.on('dgrid-select', function (e) {
                if (e.rows && e.rows.length === 1) {
                    var ref = e.rows[0];
                    require(['plugins/webida.editor.text-editor/TextEditor'], function (TextEditor) {
                        TextEditor.moveTo({
                            filepath: ref.data.path,
                            start: ref.data.location.start,
                            end: ref.data.location.end
                        });
                    });
                    setTimeout(function () {
                        grid.clearSelection();
                    }, 500);
                }
            });
        }
    };
});
