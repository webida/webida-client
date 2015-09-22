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
 * @since: 2015.09.03
 * @author : minsung-jin
 */
define([
    './search-result-model',
], function (
    model
) {
    'use strict';

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

    function handleReplace(metadata, callback) {

        model.sendReplaceData(metadata, function (err, title, store) {
            if (err) {
                callback(err);
            } else {
                callback(null, {
                    title: title,
                    store : store
                });
            }
        });
    }

    function handleSelection(scope, callback) {

        model.makeScopePath(scope, function (err, scope) {
            if (err) {
                callback(err);
            } else {
                callback(null, scope);
            }
        });
    }

    return {
        handleFind : handleFind,
        handleReplace : handleReplace,
        handleSelection : handleSelection
    };
});
