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
 * This file manages the search result data.
 *
 * @since 1.4.1
 * @author minsung.jin@samsung.com
 */
define([
], function (
) {
    'use strict';

    /**
     * constructor of search-result data
     */
    function Data() {
    }

    var searchResultData = new Data();
    /**
     * update the search results using the given data
     * @param {Object} data- value of search-result
     */
    function update(data) {

        if (data.scope) {
            searchResultData.scope = data.scope;
        }

        if (data.title) {
            searchResultData.title = data.title;
        }

        if (data.node) {
            searchResultData.treeNode = data.node;
        }

        if (data.store) {
            searchResultData.treeStore = data.store;
        }

        if (data.replacePaths) {
            searchResultData.replacePaths = data.replacePaths;
        }

        if (data.error) {
            searchResultData.error = data.error;
        }
    }
    /**
     * Get data for search-result
     * @return {Object}
     */
    function get() {
        return searchResultData;
    }
    /**
     * Clear data for search-result
     */
    function reset() {
        searchResultData = {};
    }

    return {
        update : update,
        get : get,
        reset : reset
    };
});

