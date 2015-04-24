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

/* jshint ignore: start */
({
    appDir: './',
    baseUrl: 'src',
    dir: 'requireOptimize',
    paths: {
        'plugin-manager' : 'empty:',
        'underscore' : 'lib/lodash.min',
        'webida-lib/webida-0.3' : 'empty:',
        'dojo' : 'empty:',
    },
    modules: [
        {
            name: 'main'
        }
    ],
    optimize: 'none',
    optimizeCss: 'none',
})
/* jshint ignore:end */