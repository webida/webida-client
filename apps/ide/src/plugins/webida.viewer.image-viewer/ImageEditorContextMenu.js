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
 * ImageEditorContextMenu
 *
 * @see
 * @since: 2015.11.24
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/Deferred',
    'webida-lib/plugins/workbench/ui/PartContextMenu',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function (
    Deferred,
    PartContextMenu,
    genetic, 
    Logger
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function ImageEditorContextMenu(menuItems, part) {
        logger.info('new ImageEditorContextMenu(menuItems, part)');
        PartContextMenu.apply(this, arguments);
    }


    genetic.inherits(ImageEditorContextMenu, PartContextMenu, {

        /**
         * Creates Available Menu Items then return Thenable
         * @return {Thenable}
         */
        getAvailableItems: function () {

            var items = {};
            var menuItems = this.getAllItems();
            var deferred = new Deferred();
            var part = this.getPart();
            var registry = this.getPartRegistry();
            var editorParts = registry.getEditorParts();
            
            if (editorParts.length > 1) {
                items['Close O&thers'] = menuItems['fileMenuItems']['Cl&ose Others'];
            }
            items['&Close All'] = menuItems['fileMenuItems']['C&lose All'];

            deferred.resolve(items);

            return deferred;
        }
    });

    return ImageEditorContextMenu;
});
