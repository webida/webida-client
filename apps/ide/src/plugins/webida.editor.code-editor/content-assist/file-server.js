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

define(['external/lodash/lodash.min',
        'webida-lib/util/path',
        './reference',
        './html-io',
        'lib/css-parse-stringify/css-parse',
        ],
function (_, pathUtil, reference, htmlio, cssParse) {
    'use strict';

    function getRemoteFile(path, c) {
        require(['webida-lib/app'], function (ide) {
            //ide.getMount().readFile(path, function (error, content) {
            ide.getFSCache().readFile(path, function (error, content) {
                if (content === undefined) {
                    content = null;
                }
                c(error, content);
            });
        });
    }

    var FileServer = {
        files: {},
        getRemoteFileCallback: getRemoteFile,
        listenersForReferencesUpdate: []
    };

    /**
     * @contructor
     * @param {string} path the file path of this text
     */
    function FileModel(path) {
        this.path = path;
        this.version = undefined;
        this.text = undefined;
        this.html = {};
        this.css = {};
    }


    FileModel.prototype.getHtmlDom = function () {
        if (this.html.version === this.version && this.html.dom !== undefined) {
            return this.html.dom;
        }

        var dom = htmlio.parse(this.text);
        this.html = {};
        this.html.dom = dom;
        this.html.version = this.version;

        return dom;
    };

    FileModel.prototype.getHtmlScripts = function () {
        if (this.html.version === this.version && this.html.scripts !== undefined) {
            return this.html.scripts;
        }

        var dom = this.getHtmlDom();
        var scripts = [];

        if (dom) {
            scripts = dom.getElementsByTagName('script');
        }
        this.html.scripts = scripts;

        return scripts;
    };

    FileModel.prototype._getTextLineEnds = function () {
        if (this.textLineEndsVersion && this.textLineEndsVersion === this.version) {
            return this.textLineEnds;
        }

        var ends = [];
        var lastIndex = 0;
        var re = /\r?\n/g;

        while (re.test(this.text)) {
            ends.push(re.lastIndex);
            lastIndex = re.lastIndex;
        }

        ends.push(this.text.length - 1);


        this.textLineEnds = ends;
        this.textLineEndsVersion = this.version;

        return ends;
    };

    FileModel.prototype.getPositionFromIndex = function (index) {
        var ends = this._getTextLineEnds();

        for (var i = 0; i < ends.length; i++) {
            if (ends[i] > index) {
                return {
                    line : i,
                    ch : index - ends[i]
                };
            }
        }

        return {
            line : ends.length - 1,
            ch : 0
        };
    };

    FileModel.prototype.getIndexFromPosition = function (line, ch) {
        var ends = this._getTextLineEnds();

        var beforeLine = line - 1;
        if (beforeLine >= 0 && beforeLine < ends.length) {
            return ends[beforeLine] + ch;
        }

        return -1;
    };

    FileModel.prototype.isSubfile = function () {
        return this.parent;
    };

    /**
     * @return {[FileModel]} sub files (script) of html
     **/
    FileModel.prototype.getHtmlScriptSubfiles = function () {
        if (this.html.version === this.version && this.html.scriptSubfiles !== undefined) {
            return this.html.scriptSubfiles;
        }

        var scriptSubfiles = [];

        var scripts = this.getHtmlScripts();
        var i = 1000;

        if (scripts) {
            _.each(scripts, function (script) {
                if (script.closingStart - script.openingEnd > 1) {
                    var subpath = this.path + '*' + (++i) + '.js';
                    var startIndex = script.openingEnd + 1;
                    var endIndex = script.closingStart - 1;
                    var subfile = FileServer.setText(subpath, this.text.substring(startIndex, endIndex));
                    subfile.subfileStartPosition = this.getPositionFromIndex(startIndex);
                    subfile.subfileEndPosition = this.getPositionFromIndex(endIndex);
                    subfile.parent = this;
                    scriptSubfiles.push(subfile);
                    reference.addReference(this.path, subpath);
                }
            }, this);
        }

        var subpath, subfile;
        for (i = scriptSubfiles.length; true; i++) {
            subpath = this.path + '*' + (++i) + '.js';
            subfile = FileServer.getLocalFile(subpath);
            if (subfile) {
                FileServer.setText(subpath, null);
                reference.removeReference(this.path, subpath);
            } else {
                break;
            }
        }

        this.html.scriptSubfiles = scriptSubfiles;

        return scriptSubfiles;
    };

    FileModel.prototype.getHtmlScriptPaths = function () {
        if (this.html.version === this.version && this.html.scriptPaths !== undefined) {
            return this.html.scriptPaths;
        }

        var scripts = this.getHtmlScripts();
        var scriptPaths = [];

        if (scripts) {
            var dirPath = pathUtil.getDirPath(this.path);
            _.each(scripts, function (script) {
                var src = script.getAttribute('src');
                if (src) {
                    var abspath = pathUtil.flatten(pathUtil.combine(dirPath, src));
                    scriptPaths.push(abspath);
                }
            });
        }
        this.html.scriptPaths = scriptPaths;

        return scriptPaths;
    };

    FileModel.prototype.getHtmlLinks = function () {
        if (this.html.version === this.version && this.html.links !== undefined) {
            return this.html.links;
        }

        var dom = this.getHtmlDom();
        var links = [];
        if (dom) {
            links = dom.getElementsByTagName('link');
        }
        this.html.links = links;

        return links;
    };

    FileModel.prototype.getHtmlLinkPaths = function () {
        if (this.html.version === this.version && this.html.linkPaths !== undefined) {
            return this.html.linkPaths;
        }

        var links = this.getHtmlLinks();
        var linkPaths = [];

        if (links) {
            var dirPath = pathUtil.getDirPath(this.path);
            _.each(links, function (link) {
                var href = link.getAttribute('href');
                if (href) {
                    var abspath = pathUtil.flatten(pathUtil.combine(dirPath, href));
                    linkPaths.push(abspath);
                }
            });
        }

        this.html.linkPaths = linkPaths;

        return linkPaths;
    };

    FileModel.prototype.getHtmlIds = function () {
        if (this.html.version === this.version && this.html.ids !== undefined) {
            return this.html.ids;
        }

        var dom = this.getHtmlDom();
        var elems = dom.getElementsByTagName('*');
        var ids = [];

        _.each(elems, function (elem) {
            if (elem.hasAttribute('id')) {
                ids.push(elem.getAttribute('id'));
            }
        });

        this.html.ids = ids;

        return ids;
    };

    FileModel.prototype.getHtmlClasses = function () {
        if (this.html.version === this.version && this.html.classes !== undefined) {
            return this.html.classes;
        }

        var dom = this.getHtmlDom();
        var elems = dom.getElementsByTagName('*');
        var classes = [];

        _.each(elems, function (elem) {
            if (elem.hasAttribute('class')) {
                classes = _.union(classes, elem.getAttribute('class').split(/\s+/));
            }
        });

        this.html.classes = classes;

        return classes;
    };

    function getHtmlNodeOfIndex(nodes, index) {
        if (nodes) {
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].openingStart < index && (nodes[i].openingEnd >= index || nodes[i].closingEnd >= index)) {
                    var childnode = getHtmlNodeOfIndex(nodes[i].children, index);
                    if (childnode) {
                        return childnode;
                    } else {
                        return nodes[i];
                    }
                }
            }
        }
        return null;
    }

    FileModel.prototype.getHtmlNodeOfIndex = function (index) {
        var dom = this.getHtmlDom();
        return getHtmlNodeOfIndex(dom.children, index);
    };

    FileModel.prototype.getHtmlNodeOfPos = function (line, ch) {
        var index = this.getIndexFromPosition(line, ch);
        return this.getHtmlNodeOfIndex(index);
    };



    // CSS methods

    FileModel.prototype.getCssom = function () {
        if (this.css.version === this.version && this.css.cssom !== undefined) {
            return this.css.cssom;
        }

        var cssom = cssParse(this.text);
        this.css = {};
        this.css.cssom = cssom;
        this.css.version = this.version;

        return cssom;
    };

    FileModel.prototype.getCssIds = function () {
        if (this.css.version === this.version && this.css.ids !== undefined) {
            return this.css.ids;
        }

        var cssom = this.getCssom();
        var ids = [];

        if (cssom && cssom.stylesheet && cssom.stylesheet.rules) {
            _.each(cssom.stylesheet.rules, function (rule) {
                _.each(rule.selectors, function (selector) {
                    var regexp = /#(\w*)/g;
                    var match;
                    while ((match = regexp.exec(selector))) {
                        if (match.length > 1) {
                            ids.push(match[1]);
                        }
                    }
                });
            });
        }

        this.css.ids = ids;

        return ids;
    };

    FileModel.prototype.getCssClasses = function () {
        if (this.css.version === this.version && this.css.classes !== undefined) {
            return this.css.classes;
        }

        var cssom = this.getCssom();
        var classes = [];

        if (cssom && cssom.stylesheet && cssom.stylesheet.rules) {
            _.each(cssom.stylesheet.rules, function (rule) {
                _.each(rule.selectors, function (selector) {
                    var regexp = /\.(\w*)/g;
                    var match;
                    while ((match = regexp.exec(selector))) {
                        if (match.length > 1) {
                            classes.push(match[1]);
                        }
                    }
                });
            });
        }

        this.css.classes = classes;

        return classes;
    };



    /**
     @param {function} getRemoteFileCallback callback function for get remote file
     */
    FileServer.init = function (getRemoteFileCallback) {
        FileServer.getRemoteFileCallback = getRemoteFileCallback;
    };

    FileServer._newFile = function (path) {
        var file = new FileModel(path);
        FileServer.files[path] = file;
        return file;
    };

    FileServer.setText = function (path, text) {
        var file = this.getLocalFile(path);
        if (!file) {
            file = this._newFile(path);
        }

        if (text === undefined) {
            console.error('## cc : text should not be undefined');
            return file;
        }

        var newversion = new Date().getTime();
        file.version = newversion;
        file.text = text;

        _updateReferences(file);

        return file;
    };

    FileServer.setUpdated = function (path) {
        var file = this.getLocalFile(path);
        if (file) {
            var newversion = new Date().getTime();
            file.version = newversion;
        }
        return file;
    };


    var _updateReferences = function (file) {
        if (pathUtil.endsWith(file.path, '.html', true)) {
            var oldrefs = reference.getReferenceTos(file.path) || [];

            /*if (pathUtil.isJavaScript(file.path)) {
            } else if (pathUtil.isJson(file.path)) {
                // TODO impl
            } else */
            if (pathUtil.isHtml(file.path)) {
                reference.removeReferences(file.path);

                _.each(file.getHtmlScriptSubfiles(), function (subfile) {
                    reference.addReference(file.path, subfile.path);
                });
                _.each(file.getHtmlScriptPaths(), function (scriptpath) {
                    reference.addReference(file.path, scriptpath);
                });
                _.each(file.getHtmlLinkPaths(), function (csspath) {
                    reference.addReference(file.path, csspath);
                });
            }

            var newrefs = reference.getReferenceTos(file.path) || [];
            _.each(FileServer.listenersForReferencesUpdate, function (listener) {
                listener(file, newrefs, oldrefs);
            });
        }
    };

    FileServer.addReferenceUpdateListener = function (c) {
        FileServer.listenersForReferencesUpdate.push(c);
    };

    FileServer.removeReferenceUpdateListener = function (c) {
        FileServer.listenersForReferencesUpdate = _.without(FileServer.listenersForReferencesUpdate, c);
    };

    /**
     @param {Fn(error,file)} c
     **/
    FileServer.getFile = function (path, c) {
        var file = FileServer.files[path];
        if (!file) {
            file = this._newFile(path);
        }
        if (file.text !== undefined) {
            c(undefined, file);
        } else if (file.waitings) {
            file.waitings.push(c);
        } else {
            file.waitings = [];
            file.waitings.push(c);

            var self = this;
            FileServer.getRemoteFileCallback(path, function (error, data) {
                if (error) {
                    console.warn(path + ' : ' + error);
                }
                self.setText(path, data);
                _.each(file.waitings, function (c) {
                    c(error, file);
                });
                delete file.waitings;
            });
        }
    };

    FileServer.getLocalFile = function (path) {
        return FileServer.files[path];
    };

    FileServer.getUpdatedFile = function (path, version) {
        var file = this.getLocalFile(path);
        if (file) {
            if (version && file.version === version) {
                file = null;
            }
        } else {
            console.warn('## cc : unknown file requested [' + path + ']');
        }
        return file;
    };

    return FileServer;
});
