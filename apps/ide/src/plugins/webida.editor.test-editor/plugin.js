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
 * TODO: Describe it
 * @class plugins.codeEditor
 * @constructor
 * @module plugins
 * @param {object} fm blabal
 * @param {object} store blabla
 * @param {object} amrkup blabla
 */
define(['dojo/topic',
        'dojo/domReady!'
], function (topic) {
    'use strict';

    topic.subscribe('file.opened', function(/*file*/){

    });
    topic.subscribe('file.saved', function(/*file*/){

    });

    var self = {
        create: function (file, content, elem/*, started*/) {
            console.info('create()', elem, content);
            file.tabTitle += ' :: XML Editor';
            var pre = document.createElement('pre');
            pre.contentEditable = true;
            pre.style.fontSize = '8pt';
            pre.innerText = content;
            elem.appendChild(pre);
            return pre;
        },

        show: function (file) {
            console.info('show()');
            file.tabTitle += ' :: XML Editor';
        },

        hide: function (/*file*/) {
            console.info('hide()');
        },

        destroy: function (/*file*/) {
            console.info('destroy()');
        },

        getValue: function (/*file*/) {
            console.info('getValue()');
        },

        addChangeListener: function (/*file, callback*/) {
            console.info('addChangeListener()');
        },

        focus: function (/*file*/) {
            console.info('focus()');
        },

        pushCursorLocation: function (/*file, cursor, forced*/) {
            console.info('pushCursorLocation()');
        },

        moveBack: function () {
            console.info('moveBack()');
        },
        moveForth: function () {
            console.info('moveForth()');
        },
        moveTo: function (/*location*/) {
            console.info('moveTo()');
        },

        getLastSavedFoldingStatus: function () {
            console.info('getLastSavedFoldingStatus()');
        },

        markClean: function (/*file*/) {
            console.info('markClean()');
        },

        isClean: function (/*file*/) {
            console.info('isClean()');
        },

        setMode: function(){
            console.info('setMode()');
        }
    };
    return self;
});
