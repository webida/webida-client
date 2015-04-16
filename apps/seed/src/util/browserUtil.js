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
 * @BrowserUtil
 *
 * @version: 1.0.0
 * @since: 2014.08.25
 *
 * Src:
 *   util/browserUtil.js
 */

define([],
function () {
    'use strict';

    // constructor
    var BrowserUtil = function () {
    };

    BrowserUtil.getOffsetX = function (e) {
        var offX  = (e.offsetX || e.clientX - $(e.target).offset().left);
        return offX;
    };

    BrowserUtil.getTarget = function (e) {
        return e.target || e.srcElement;
    };

    BrowserUtil.getPosition = function (position) {
        // position.x can be read-only, so return another object
        if (position.cancelBubble) { // Internet Explorer's DragEvent
            // Internet Explorer's DragEvent has both x and clientX, and we use clientX for the drop
            return {
                x: position.clientX,
                y: position.clientY
            };
        } else {
            return {
                x: position.x || position.clientX,
                y: position.y || position.clientY
            };
        }
    };

    BrowserUtil.getLocationOrigin = function () {
        if (!window.location.origin) { // in case of Internet Explorer
            console.log('location.origin is undefined');
            window.location.origin = window.location.protocol + '//' +
                window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        }
        return window.location.origin;
    };

    BrowserUtil.getChildren = function (df) {
        // Internet Explorer does not support 'children' property for DocumentFragment
        //  cf.)) https://developer.mozilla.org/en-US/docs/Web/API/ParentNode.children
        if (!df.children) {
            df.children = [];
            var children = df.childNodes;
            for (var i = 0; i < children.length; i++) {
                if (children[i].nodeType === 1) { // ELEMENT_NODE
                    df.children.push(children[i]);
                }
            }
        }
        return df.children;
    };

    return BrowserUtil;
});
