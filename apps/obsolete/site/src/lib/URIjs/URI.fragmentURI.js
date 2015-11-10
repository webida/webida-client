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

/*
 * Extending URI.js for fragment abuse
 */

// --------------------------------------------------------------------------------
// EXAMPLE: storing a relative URL in the fragment ("FragmentURI")
// possibly helpful when working with backbone.js or sammy.js
// inspired by https://github.com/medialize/URI.js/pull/2
// --------------------------------------------------------------------------------

// Note: make sure this is the last file loaded!

// USAGE:
// var uri = URI("http://example.org/#!/foo/bar/baz.html");
// var furi = uri.fragment(true);
// furi.pathname() === '/foo/bar/baz.html';
// furi.pathname('/hello.html');
// uri.toString() === "http://example.org/#!/hello.html"

(function (root, factory) {
    // https://github.com/umdjs/umd/blob/master/returnExports.js
    if (typeof exports === 'object') {
        // Node
        module.exports = factory(require('./URI'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./URI'], factory);
    } else {
        // Browser globals (root is window)
        factory(root.URI);
    }
}(this, function (URI) {
"use strict";

var p = URI.prototype;
// old handlers we need to wrap
var f = p.fragment;
var b = p.build;

// make fragmentPrefix configurable
URI.fragmentPrefix = '!';
var _parts = URI._parts;
URI._parts = function() {
    var parts = _parts();
    parts.fragmentPrefix = URI.fragmentPrefix;
    return parts;
};
p.fragmentPrefix = function(v) {
    this._parts.fragmentPrefix = v;
    return this;
};

// add fragment(true) and fragment(URI) signatures    
p.fragment = function(v, build) {
    var prefix = this._parts.fragmentPrefix;
    var fragment = this._parts.fragment || "";
    var furi;

    if (v === true) {
        if (fragment.substring(0, prefix.length) !== prefix) {
            furi = URI("");
        } else {
            furi = new URI(fragment.substring(prefix.length));
        }
        
        this._fragmentURI = furi;
        furi._parentURI = this;
        return furi;
    } else if (v !== undefined && typeof v !== "string") {
        this._fragmentURI = v;
        v._parentURI = v;
        this._parts.fragment = prefix + v.toString();
        this.build(!build);
        return this;
    } else if (typeof v === "string") {
        this._fragmentURI = undefined;
    }

    return f.call(this, v, build);
};

// make .build() of the actual URI aware of the FragmentURI
p.build = function(deferBuild) {
    var t = b.call(this, deferBuild);
    
    if (deferBuild !== false && this._parentURI) {
        // update the parent
        this._parentURI.fragment(this);
    }

    return t;
};

// extending existing object rather than defining something new
return {};
}));