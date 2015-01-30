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

'use strict';

/**
 * The Webida core provides plugin management and ...
 *
 * @module core
 */

/**
 * The Webida plugins are set of code/data that contribute functionality to the webida ide.
 *
 * @module plugins
 */

require(['other-lib/URIjs/URI', 'core/deploy'], function (URI, deploy) {
    var uri = URI(window.location.href);
    var appPath = uri.segment(-1, '').pathname();
    var projectPath = uri.search(true).project; 
    if (projectPath) { 
        var redirectUrl = window.location.origin + window.location.pathname;
        redirectUrl = redirectUrl.replace(/index.html/g, 'auth.html');
        deploy.openDeploy(appPath, projectPath, redirectUrl);
    } else { 
        alert('Error: Project specification is invalid');
    } 
});