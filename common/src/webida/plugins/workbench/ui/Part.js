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
 * Interface
 * An ancestor of all workbench UI parts
 *
 * @see View, Editor
 * @since: 2015.06.09
 * @author: hw.shim
 */

// @formatter:off
define([
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client'
], function(
	genetic,
	Logger
) {
	'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var _partId = 0;

    function Part() {
        logger.info('new Part()');
        this._partId = ++_partId;
        this.flags = null;
        this.parent = null;
    }


    genetic.inherits(Part, Object, {
        create: function(parent, started) {
            throw new Error('create() should be implemented by ' + this.constructor.name);
        },
        destroy: function() {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },
        show: function() {
            throw new Error('show() should be implemented by ' + this.constructor.name);
        },
        hide: function() {
            throw new Error('hide() should be implemented by ' + this.constructor.name);
        },
        focus: function() {
            throw new Error('focus() should be implemented by ' + this.constructor.name);
        },
        setFlag: function(/*int*/flag, /*boolean*/value) {
            if (!flag) {
                throw new Error('Invalid flag name');
            }
            if (value) {
                this.flags |= flag;
            } else {
                this.flags &= ~flag;
            }
        },
        getFlag: function(/*int*/flag) {
            return (this.flags & flag) != 0;
        },
        setParentElement: function(/*HtmlElement*/parent) {
            this.parent = parent;
        },
        getParentElement: function() {
            return this.parent;
        }
    });
    Part.CREATED = 1;
    return Part;
});
