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

// @formatter:off
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
// @formatter:on

    var logger = new Logger();

    function TestEditor(container) {
        logger.info('new TestEditor(' + container + ')');
        EditorPart.apply(this, arguments);
        var dataSource = container.getDataSource();
        var file = dataSource.getPersistence();
        this.setFile(file);
    }


    genetic.inherits(TestEditor, EditorPart, {

        /**
         * @Override
         */
		prepareVM: function(){
			logger.info('%cprepareVM()', 'color:orange');
			var container = this.getContainer();
			this.createViewer(container.getContentNode());
		},

        createViewer: function(parentNode, callback) {
            logger.info('createViewer(' + parentNode + ', callback)');
            var dataSource = this.getDataSource();
            var pre = document.createElement('pre');
            dataSource.getData(function(data) {
                pre.textContent = data;
            });
            pre.contentEditable = true;
            pre.style.fontSize = '8pt';
            parentNode.appendChild(pre);
        },

        destroy: function() {
            console.info('destroy()');
        },

        hide: function() {
            console.info('hide()');
        },

        addChangeListener: function(callback) {
            console.info('addChangeListener()');
        },

        focus: function() {
            console.info('focus()');
        },

        isClean: function() {
            console.info('isClean()');
        }
    });

    return TestEditor;
});

