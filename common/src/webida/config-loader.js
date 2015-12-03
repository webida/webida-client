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
 * @file Get server-side configuration in advance of bootstrapping the app
 *
 * This is a kind of loader plugin of Require.js.
 *
 * @since 15. 12. 3
 * @author Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
    'webida-lib/webida-0.3'
], function (
    webida
) {
    'use strict';

    return {
        load: function (name, req, onLoad) {
            req([webida.conf.appApiBaseUrl + '/configs?callback=define'], function (configs) {
                onLoad(configs);
            });
        }
    };
});