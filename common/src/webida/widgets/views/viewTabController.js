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
 * Constructor
 * ViewTabController
 *
 * @see
 * @since 2015.08.03
 * @author minsung.jin
 */
define([
    'dojo/_base/declare',
    'dojo/keys',
    'dijit/layout/TabController'
], function (
    declare,
    keys,
    TabController
) {
    'use strict';

    /**
     * Set of tabs (the things whit titles and a close button, that you click to show a tab panel).
     * Use internally by 'dijit/layout/TabContainer'.
     *
     * @return {Object}
     */
    var ViewTabController = declare(TabController, {

        /**
         * Handle keystorkes on the list, for advancing to next/previous button
         * and closing the current page if the page is closable.
         *
         * @param {Event} e
         * @param {Boolean} fromContainer
         */
        onkeydown: function (e, fromContainer) {

            if (this.disabled || e.altKey) {
                return;
            }

            var forward = null;
            var children = null;
            var child = null;
            var idx = 0;

            if (e.ctrlKey || !e._djpage) {

                switch (e.keyCode) {
                case keys.LEFT_ARROW:
                case keys.UP_ARROW:
                    if (!e._djpage) {
                        forward = false;
                    }
                    break;

                case keys.PAGE_UP:
                    if (e.ctrlKey) {
                        forward = false;
                    }
                    break;

                case keys.RIGHT_ARROW:
                case keys.DOWN_ARROW:
                    if (!e._djpage) {
                        forward = true;
                    }
                    break;

                case keys.PAGE_DOWN:
                    if (e.ctrlKey) {
                        forward = true;
                    }
                    break;

                case keys.HOME:
                    children = this.getChildren();
                    for (idx = 0; idx < children.length; idx++) {
                        child = children[idx];
                        if (!child.disabled) {
                            this.onButtonClick(child.page);
                            break;
                        }
                    }
                    e.stopPropagation();
                    e.preventDefault();
                    break;

                case keys.END:
                    children = this.getChildren();
                    for (idx = children.length - 1; idx >= 0; idx--) {
                        child = children[idx];
                        if (!child.disabled) {
                            this.onButtonClick(child.page);
                            break;
                        }
                    }
                    e.stopPropagation();
                    e.preventDefault();
                    break;

                case keys.DELETE:
                    if (this._currentChild.closable &&
                        (e.keyCode === keys.DELETE || e.ctrlKey)) {
                        this.onCloseButtonClick(this._currentChild);
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    break;

                case keys.TAB:
                    if (e.ctrlKey) {
                        this.onButtonClick(this.adjacent(!e.shiftKey).page);
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    break;
                }

                if (forward !== null) {
                    this.onButtonClick(this.adjacent(forward).page);
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        }
    });

    return ViewTabController;
});
