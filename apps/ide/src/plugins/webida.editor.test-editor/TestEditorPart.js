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
 * Constructor function
 * Editor implementation of EditorPart for the test
 *
 * @constructor
 * @see EditorPart
 * @since: 2015.06.19
 * @author: hw.shim
 * 
 */

define([
    'webida-lib/util/genetic',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'dojo/topic',
    'webida-lib/util/logger/logger-client',
    'dojo/domReady!'
], function(
       genetic,
        EditorPart,
        topic,
        Logger
       ) {
    'use strict';

    topic.subscribe('file.opened', function(/*file*/){

    });
    topic.subscribe('file.saved', function(/*file*/){

    });

    var logger = new Logger();

    function TestEditor(file){
        logger.info('new TestEditor('+file+')');
        console.info('file = ', file);
        EditorPart.apply(this, arguments);
        this.setFile(file);
    }

    genetic.inherits(TestEditor, EditorPart, {
        create: function (parent, callback) {
            console.info(this.file);
            var pre = document.createElement('pre');
            pre.contentEditable = true;
            pre.style.fontSize = '8pt';
            pre.innerText = this.getFile().getContents();
            parent.appendChild(pre);
            return pre;
        },

        destroy: function () {
            console.info('destroy()');
        },

        show: function () {
            console.info('show()');
        },

        hide: function () {
            console.info('hide()');
        },

        getValue: function () {
            console.info('getValue()');
        },

        addChangeListener: function (callback) {
            console.info('addChangeListener()');
        },

        focus: function () {
            console.info('focus()');
        },

        markClean: function () {
            console.info('markClean()');
        },

        isClean: function () {
            console.info('isClean()');
        }

    });

    return TestEditor;
});







    
    
    
    
    
    
    
    
    
    
    
    
    
    
