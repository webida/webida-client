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
 * This file is supported of locale API
 *
 * @see support locale-sensitive languages.
 * @since: 2015.10.27
 * @author: minsung.jin
*/

define([
    'dojo/string'
], function (
    string
) {
    'use strict';

    var DEFAULT_ATTR_NAME = 'data-message';

    function _setMessage(resources, attrName, domNode) {
        var messageAttr = attrName || DEFAULT_ATTR_NAME;
        $('[' + messageAttr + ']', domNode).each(function () {
            var key = $(this).attr(messageAttr);
            $(this).text.call($(this), resources[key]);
        });
    }

    function LocaleUtil(resources) {
        this.resources = resources;
    }

    /**
     * Set messages to the DOM elements according to current locale option
     *
     * @param {{Element|Jquery}} [domNode] - Top level DOM node element to set message
     * @param {string} [attrName=data-message] - attribute name of any element that has messageKey  of
     *      the resource object as its value. It's optional parameter. And default value is 'data-message'.
     *
     * e.g. In HTML document, You can write like below.
     *      <pre>
     *          <div id="container">
     *              <button data-message="labelOk"></button>
     *          </div>
     *      </pre>
     *      And you also have `labelOK` key in your resources object.
     *      <pre>
     *          var resources = { ..., labelOk: 'OK', ...};
     *      </pre>
     *      You can transit button's label as doing this.
     *      <pre>
     *          var localeUtil = new LocaleUtil(resources);
     *          localeUtil.convertMessage(document.getElementById('container'), 'data-message');
     *      </pre>
     */
    LocaleUtil.prototype.convertMessage = function (domNode, attrName) {
        if (typeof domNode === 'string') {
            domNode = document.getElementById(domNode);
        }
        _setMessage(this.resources, attrName, domNode);
    };

    /**
     * Get formatted message
     *
     * @param {string} messageKey - key name of the resource object
     * @param {object} [formatValues] - variables for formatting. If it is not set, it will raw message.
     * @returns {string} - formatted message
     */
    LocaleUtil.prototype.formatMessage = function (messageKey, formatValues) {
        var message = this.resources[messageKey] || '';
        return (formatValues) ? string.substitute(message, formatValues) : message;
    };

    /**
     * Original method
     * @param resources
     * @param attrName
     */
    LocaleUtil.convertMessage = function (resources, attrName, domNode) {
        _setMessage(resources, attrName, domNode);
    };

    return LocaleUtil;
});