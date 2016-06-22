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

        this._basepath = null; // will be filled later

        // when building tree with entries
        // parent property will be set later and initially undefined
        // root entry should have 'null' (not empty) parent
        this.parent = parent || null;
    }
    
    WfsEntry.prototype = {
        // not implemented yet
        refreshStats : function() {
            throw new Error('do not use this abstract method');
        },
        
        isRoot : function isRoot() {  return !this.parent; },

        // for compatiblity with webida 1.x client
        // (will be replaced to function as node.js does, later )
        get path() {
            if (this.parent) {
                return this.parent.path + '/' + this.name;
            } else {
                var basePath = this.basePath || '/';
                return basePath + this.name;
            }
        },

        get basepath() {
            return this.parent ? null : this._basepath;
        },

        // basepath should be set to root of tree, only
        set basepath(value) {
            if (!this.parent) {
                // when tree is /some/path/dir
                // this.name = dir
                // basepath = /some/path
                this._basepath = value.split('/');
            }
        },

        get isFile() { return !this.isDirectory; },
        
        get isDirectory() { return (this.stats.type === 'DIRECTORY'); },

        hasChildren : function hasChildren() {
            return this.children; // remember again, [] is falsy
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

    WfsEntry.getBasePathOf = function getBasePathOf(path) {
        var segments = path.split('/');
        segments.pop();
        return segments.join('/');
    };

    // later, we should extend this class to WfsFile & WfsDirectory
    // we also need WfsTree to handle WfsEntry trees and subtree
    //
    return WfsEntry;
}); 
        
