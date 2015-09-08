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
 * Preference pages in the preference dialog per extension declare
 * @since: 15. 9. 1
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([], function () {
    'use strict';

    /**
     * Preference Page constructor
     *
     * @param store
     * @param pageData
     * @constructor
     */
    function PreferencePage(store, pageData) {
        this.store = store;
        this.pageData = pageData;
        this.store.setValidator(function (values) {
            return;
        });

        this.ui = $('<div></div>').get(0);
    }

    /**
     * Get sub page to be attached in the preference dialog
     *
     * @returns {DOMElement}
     */
    PreferencePage.prototype.getPage = function () {
        return this.ui;
    };

    /**
     * It will be called after sub page is appended to the preference dialog.
     * You can add UI event listeners in this method.
     */
    PreferencePage.prototype.onPageAppended = function () {
    };

    /**
     * It will be called after sub page is detached from the preference dialog.
     * You can remove UI event listeners or destroy some UI elements in this method.
     */
    PreferencePage.prototype.onPageRemoved = function () {
        $(this.ui).empty();
    };

    /**
     * Reload UI components with its store
     * For instance, It can be called after restoring the store data.
     */
    PreferencePage.prototype.reload = function () {
    };

    return PreferencePage;
});
