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
 * Dom utility
 *
 * @see
 * @since: 2015.09.02
 * @author: hw.shim
 */

// @formatter:off
define(function(module) {
    "use strict";
// @formatter:on

    return {

        byId: function(id) {
            return document.getElementById(id);
        },

        byTag: function(tagName) {
            return document.getElementsByTagName(tagName);
        },

        bySelector: function(selector, element) {
            element = element || document;
            return element.querySelectorAll(selector);
        },

        getAppliedStyleClone: function(element) {
            var prop, result = new Object();
            for (prop in element.style) {
                result[prop] = element.style[prop];
            }
            return result;
        },

        getComputedStyleClone: function(element) {
            var styles = window.getComputedStyle(element), len = styles.length, i, prop, result = {};
            for ( i = 0; i < len; i++) {
                prop = styles[i];
                //result[prop] = styles[prop];
                result[prop] = styles.getPropertyValue(prop);
            }
            return result;
        },

        getComputedStyleDiff: function(styleOrg, styleVar) {
            var prop, result = {};
            for (prop in styleOrg) {
                if (styleOrg[prop] != styleVar[prop]) {
                    result[prop] = styleVar[prop];
                }
            }
            return result;
        },

        checkComputedStyleDiff: function(styleOrg, styleVar) {
            var i, check = false, result = this.getComputedStyleDiff(styleOrg, styleVar);
            for (i in result) {
                //console.log(i+' = '+result[i]);
                check = true;
            }
            return check;
        },

        getStyle: function(element, prop) {
            var styles = window.getComputedStyle(element);
            //return styles[prop];
            return styles.getPropertyValue(prop);
        },

        setStyles: function(element, propSet) {
            //console.log('dom.setStyles('+element.id+', propSet)');
            var prop, style = element.style;
            for (prop in propSet) {
                style.setProperty(prop, propSet[prop]);
            }
        },

        setAttributes: function(element, propSet) {
            var prop;
            for (prop in propSet) {
                element.setAttribute(prop, propSet[prop]);
            }
        },

        makeElementNs: function(tag, namespace, properties) {
            var element = document.createElementNS(namespace, tag);
            if (properties) {
                for (var p in properties) {
                    element.setAttribute(p, properties[p]);
                }
            }
            return element;
        },

        makeSvgElement: function(tag, properties) {
            return this.makeElementNs(tag, 'http://www.w3.org/2000/svg', properties);
        },

        makeElement: function(tag, properties, where, win) {
            if ( typeof win == 'undefined') {
                win = window;
            }
            var element = win.document.createElement(tag);
            if (properties) {
                for (var p in properties) {
                    element.setAttribute(p, properties[p]);
                }
            }
            if (where) {
                this.addElement(element, where.element, where.position);
            }
            return element;
        }
    };
});
