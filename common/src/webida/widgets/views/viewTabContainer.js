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
 * ViewTabContainer
 *
 * @see
 * @since 2015.08.03
 * @author minsung.jin
 */
define([
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dijit/layout/TabContainer',
    './viewTabController',
], function (
    lang,
    declare,
    TabContainer,
    ViewTabController
) {
    'use strict';

    /**
     * A container with tabs to select each child (only one of which is displayed at a time).
     *
     * @return {Object}
     */
    return declare(TabContainer, {

        /**
         * Instantiate tablist controller widget and return reference to it.
         *
         * @return {Object}
         */
        _makeController: function (srcNode) {
            var cls = this.baseClass + '-tabs' + (this.doLayout ? '' : ' dijitTabNoLayout'),
                ViewTabController = typeof this.controllerWidget === 'string' ? lang.getObject(this.controllerWidget) :
            this.controllerWidget;

            return new ViewTabController({
                id: this.id + '_tablist',
                ownerDocument: this.ownerDocument,
                dir: this.dir,
                lang: this.lang,
                textDir: this.textDir,
                tabPosition: this.tabPosition,
                doLayout: this.doLayout,
                containerId: this.id,
                'class': cls,
                nested: this.nested,
                useMenu: this.useMenu,
                useSlider: this.useSlider,
                tabStripClass: this.tabStrip ? this.baseClass + (this.tabStrip ? '':'No') + 'Strip': null
            }, srcNode);
        }
    });
});
