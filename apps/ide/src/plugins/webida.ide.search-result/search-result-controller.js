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
 * This file handles the search result data.
 *
 * @since 1.4.1
 * @author minsung.jin@samsung.com
 */
define([
    './search-result-model',
], function (
    model
) {
    'use strict';
    /**
     * search with the given metadata.
     * @param {Object} metadata - search condition(keyword, replace with, scope, options)
     * @param {viewCallback} callback - out-param(search results)
     */
    function handleFind(metadata, callback) {

        model.makeFindData(metadata, function (err, title, store) {
            if (err) {
                callback(err);
            } else {
                callback(null, {
                    title : title,
                    store : store
                });
            }
        });
    }
    /**
     * replace the code with the given metadata.
     * @param {Object} metadata - replacing condition(keyword, replace with, scope, options)
     * @param {viewCallback} callback - out-param(the replacement result)
     */
    function handleReplace(metadata, callback) {

        model.makeReplaceData(metadata, function (err, title) {
            if (err) {
                callback(err);
            } else {
                callback(null, title);
            }
        });
    }
    /**
     * set the search scope
     * @param {string} scope - set the range of scope(selection, project, workspace)
     * @param {ViewCallback} callback - out-param(a path of scope)
     */
    function handleSelection(scope, callback) {

        model.getScopePath(scope, function (err, scope) {
            if (err) {
                callback(err);
            } else {
                callback(null, scope);
            }
        });
    }
    /**
     * select item replaced
     * @param {object} item - item replaced or not
     * @param {boolean} checked - item value
     * @param {ViewCallback} callback - set a value in the view.
     */
    function handleCheckbox(item, checked, callback) {

        model.updateReplacePaths(item, checked, function () {
            callback();
        });
    }

    return {
        handleFind : handleFind,
        handleReplace : handleReplace,
        handleSelection : handleSelection,
        handleCheckbox : handleCheckbox
    };
});

