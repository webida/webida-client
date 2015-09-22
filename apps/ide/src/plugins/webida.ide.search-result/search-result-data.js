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
 * @since: 2015.09.03
 * @author : minsung-jin
 */
define([
], function (
) {
    'use strict';

    function Data() {
    }

    var searchResultData = new Data();

    function update(source) {

        if (source.scope) {
            searchResultData.scope = source.scope;
        }

        if (source.title) {
            searchResultData.title = source.title;
        }

        if (source.store) {
            searchResultData.treeStore = source.store;
        }

        if (source.node) {
            searchResultData.treeNode = source.node;
        }

        if (source.replacePaths) {
            searchResultData.replacePaths = source.replacePaths;
        }

        if (source.error) {
            searchResultData.error = source.error;
        }
    }

    function get() {
        return searchResultData;
    }

    function reset() {
        searchResultData = {};
    }

    return {
        update : update,
        get : get,
        reset : reset
    };
});
