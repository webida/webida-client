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
 * @file Provides some light-weight theme related tools(It may be used before introducing theme system.)
 * @since 15. 11. 24
 * @author Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
    'external/lodash/lodash.min',
    'webida-lib/app-config'
], function (
    _,
    config
) {
    'use strict';
    var theme = config.theme;

    function _createLinkElement(href, rel, type) {
        var linkElement = document.createElement('link');
        linkElement.href = href;
        linkElement.rel = rel || 'stylesheet';
        linkElement.type = type || 'text/css';
        document.getElementsByTagName('head')[0].appendChild(linkElement);
    }

    return {
        /**
         * @public
         * Apply theme to template string that has placeholders
         *
         * @exmaple
         * <pre>
         *      require(['webida-lib/theme'], function(theme) {
         *          ...
         *          var themeAppliedTemplate = theme.apply('<img src="<%=themePath%>/images/logo.png">');
         *          // '<img src="/apps/ide/src/styles/theme/webida-light/images/logo.png">'
         *          var themeAppliedImageUrl = theme.apply('<%=themePath%>/images/icon/someIcon.png');
         *          // '/apps/ide/src/styles/theme/webida-light/images/icon/someIcon.png'
         *          var themeName = theme.apply('<%=theme%> is applied!');
         *          // 'webida-light is applied!'
         *          ...
         *      });
         * </pre>
         *
         * @param {string} template - template string that has theme related placeholders
         * @return the variables(<%= theme %> or <%= themePath %>) related with theme applied string
         */
        apply: function (template) {
            return _.template(template)({theme: theme.name, themePath: theme.basePath});
        },

        /**
         * @public
         * Loads all theme related resources
         */
        loadTheme: function () {
            _createLinkElement(theme.basePath + '/css/theme.css');
            _createLinkElement(theme.basePath + '/images/icons/webida_favicon_16.png', 'shorcut icon', 'image/x-icon');
        }
    };
});