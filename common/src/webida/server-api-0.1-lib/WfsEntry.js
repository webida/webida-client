"use strict"

define([
], function(
) {
    
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
            if (this._basepath) {
                return this._basepath;
            } else {
                return this.parent ? this.parent.basepath() : null;
            }

        },

        set basepath(value) {
            this._basepath = value;
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

    // later, we should extend this class to WfsFile & WfsDirectory
    // we also need WfsTree to handle WfsEntry trees and subtree
    //
    return WfsEntry;
}); 
        
