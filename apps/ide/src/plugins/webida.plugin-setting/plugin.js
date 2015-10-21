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
 * This is the main module for a plugin named "Plugin configurator"
 *
 * @since: 15. 10. 19
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
], function (
) {
    'use strict';

    return {
        /**
         * Used by plugin manager for displaying menu items
         */
        getViableItems: function () {
            return {
                'Plugin Setting': [
                    'cmnd',
                    'plugins/webida.plugin-setting/dialog-controller',
                    'openDialog'
                ]
            };
        }
    };
});