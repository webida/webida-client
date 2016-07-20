/*
 * Copyright (c) 2012-2016 S-Core Co., Ltd.
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
 * @file WfsEntry.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
], function(
) {
    'use strict';

    function WfsEntry (stats, name, parent) {

        // currently hidden stats property that controls everthing
        Object.defineProperty(this, 'stats', {
            value: stats,
            writable:true,
            enumerable : false,
            configurable : false
        });
        this.children = [];
        this.name = name;
        this._path = null; // will be filled later

        // when building tree with entries
        // parent property will be set later and initially undefined
        // root entry should have 'null' (not empty) parent
        this.parent = parent || null;
    }
    
    WfsEntry.prototype = {

        isRoot : function isRoot() {  return !this.parent; },

        isDetached: function isDetached() { return !this._path; },

        detach : function detach() {
            this._path = null;
        },

        // for compatiblity with webida 1.x client
        // (will be replaced to function as node.js does, later )
        get path() {
            if (this.isRoot()) {
                return this._path || '/';
            } else {
                return this.parent._path + this.name;
            }
        },

        // entry always have 'absolute path'
        // so, root entry should have '/' or '/***/ as _path property
        set path(value) {
            if (this.isRoot()) {
                if (!value || value === '/') {
                    return;
                }
                if (value.length > 1 && value[value.length-1] !== '/') {
                    value += '/';
                }
                if (value[0] !== '/') {
                    value = '/' + value;
                }
                this._path = value;
            }
        },

        get isFile() { return !this.isDirectory; },
        
        get isDirectory() { return (this.stats.type === 'DIRECTORY'); },

        hasChildren : function hasChildren() {
            return this.children; // remember again, [] is falsy
        },

        getChildByName: function getChildByName(name) {
           var found = null;
           this.children.some( function(child) {
               if (child.name === name) {
                   found = child;
                   return true;
               }
           });
        }
    };

    WfsEntry.fromJson = function fromJson(obj, parent) {
        var entry = new WfsEntry(obj.stats, obj.name, parent);
        entry.children = obj.children.map( function (child) {
            var childEntry = WfsEntry.fromJson(child, entry);
            return childEntry;
        });
        return entry;
    };

    WfsEntry.clone = function clone(entry, parent, withPath) {
        // we don't have to clone name, for string is immutable
        var cloned = new WfsEntry( new WfsStats(entry.stats), entry.name );
        cloned.children = entry.children.map( function(child) {
            return WfsEntry.clone(child, cloned);
        });
        cloned.parent = parent;
        if (withPath) {
            clone._path = entry._path;
        }
        return cloned;
    };

    // later, we should extend this class to WfsFile & WfsDirectory
    // we also need WfsTree to handle WfsEntry trees and subtree
    return WfsEntry;
}); 
        
