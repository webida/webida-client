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
 * @file WfsDirTree.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    './WfsEntry'
], function(
    WfsEntry
) {
    'use strict';

    // each root entry should have a path.
    function WfsDirTree (entry, clone, detached) {
        this.rootEntry = clone ? WfsEntry.clone(entry, null, detached) : entry;
    }

    WfsDirTree.prototype = {

        getEntryByPath : function getEntryByPath(entryPath) {
            if (typeof(entryPath) !== 'string') {
                return null;
            }
            var absPath = (entryPath[0] !== '/') ? ('/' + entryPath) : entryPath;
            var segments = absPath.split('/');

            // if root entry has name, the first element of segments should be a dir name,
            //  not an empty string
            if (this.rootEntry.name) {
                segments = segments.slice(1);
            }
            var entry = this.rootEntry;
            if (entry.name !== segments[0]) {
                return null;
            }
            for (var i=0; i < segments.length; i++) {
                if(!entry || i === segments.length-1) {
                    break;
                } else {
                    entry = entry.getChildByName(segments[i+1]);
                }
            }
            return entry;
        },

        // if some path are given in pathMap, then result will skip the entry
        // so, to exclude some paths, put them in pathMap as truthy value (like true)
        // this walk() method takes a little bit long time, if tree is very large.
        // we may need to introdude worker, some kind of generator that yields entries.
        // & we need event emitter to mimic generator in ES5.
        // Introducing generator ill charge us another painful refactoring, however.

        walk: function walk(pathMap, entry, predicate) {
            var target = entry || this.rootEntry;
            if (predicate(entry) && !pathMap[target.path]) {
                pathMap[target.path] = entry;
            }
            entry.children.forEach( function(child) {
                if (!pathMap[child.path]) {
                    walk(pathMap, child, predicate);
                }
            });
            return pathMap;
        }
    };

    return WfsDirTree;
}); 
        
