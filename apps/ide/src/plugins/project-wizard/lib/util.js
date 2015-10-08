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
 * @Util
 *
 * @version: 1.0.0
 * @since: 2014.04.18
 *
 * Src:
 *   plugins/project-wizard/util.js
 */

define(['webida-lib/app',
        'webida-lib/webida-0.3',
        'webida-lib/util/path',
        'webida-lib/plugins/workbench/plugin',
        'webida-lib/util/notify',
        'external/lodash/lodash.min',
        'dojo/Deferred',
        'dijit/registry',
        'plugins/project-configurator/projectConfigurator',
        'plugins/webida.ide.project-management.run/run-configuration-manager',
        'webida-lib/plugins/workspace/plugin',
        'popup-dialog'
       ],
function (ide, webida, pathUtil, workbench, notify, _, Deferred, reg,
          projectConfigurator, runConfiguration, wv, PopupDialog) {
    'use strict';

    // constructor
    var Util = function () {
    };

    /* SHOULD move to webida-base.js (if exist) and use also in preview and project-configurator etc. */
    Util.getAliasPath = function (oriPath, expireTime) {
        console.log('getAliasPath', oriPath);
        var deferred = new Deferred();
        if (!oriPath) {
            return deferred.reject();
        }
        expireTime = !!expireTime ? expireTime : 3600;

        function cbSuccess(err, data) {
            if (err) {
                return deferred.reject(err);
            } else {
                return deferred.resolve(data);
            }
        }

        ide.getFSCache().addAlias(oriPath, expireTime, cbSuccess);

        return deferred.promise;
    };

    Util.findIndexFile = function (path, cb) {
        Util.findFile(path, 'index.html').then(function (files) {
            var indexFile;
            if (files.length > 1) {
                // TODO: Show selection dialog?
                console.log('findFile', 'Detected two or more \'index.html\' files.');
            } else {
                indexFile = files[0];
                cb(indexFile);
            }
        });
    };

    Util.getAliasPathForIndexFile = function (path, cb) {
        Util.findIndexFile(path, function (indexFile) {
            var parentPath = indexFile.substring(0, indexFile.lastIndexOf('/'));
            var filePath = indexFile.substring(indexFile.lastIndexOf('/') + 1);

            Util.getAliasPath(parentPath).then(
                function (resolve) {
                    cb(resolve.url + '/' + filePath);
                },
                function (err) {
                    console.log(err);
                }
            );
        });
    };

    Util.findFile = function (path, file) {
        var files = [];
        var deferred = new Deferred();
        if (!path) {
            return deferred.reject();
        }

        ide.getFSCache().list(path, true, function (err, lists) {
            if (err) {
                return deferred.reject(err);
            } else {
                files = files.concat(Util._findFileInChildren(lists, path, file));
                return deferred.resolve(files);
            }
        });

        return deferred.promise;
    };

    /**
     * @param {String} file - regex to find
     */
    Util._findFileInChildren = function (children, path, file) {
        var files = [];
        var regex = new RegExp(file);
        $.each(children, function (index, child) {
            if (!child.isDirectory) {
                if (regex.test(child.name)) {
                    files.push(path + '/' + child.name);
                }
            } else if (child.isDirectory) {
                // This method does not change the existing arrays, but returns a new
                // array, containing the values of the joined arrays.
                files = files.concat(Util._findFileInChildren(child.children, path + '/' + child.name, file));
            }
        });
        return files;
    };

    /**
     * @param {String} uri - uri string for file content.
            Its format is "data:<mime_type>,<data>". E.g., data:image/png;base64,xxxx... or data:text/plain,Hello World
     * @param {String} name - file name to be downloaed
     */
    Util.downloadFile = function (uri, name) {
        console.log('downloadFile', name);
        var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
        var isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;

        // If in Chrome or Safari - download via virtual link click
        if (isChrome || isSafari) {
            var link = document.createElement('a');
            link.href = uri;
            if (link.download !== undefined) {
                // Set HTML5 download attribute. This will prevent file from opening if supported.
                link.download = name;
            }

            if (document.createEvent) {
                var e = document.createEvent('MouseEvents');
                e.initEvent('click', true, true);
                link.dispatchEvent(e);
                return true;
            }
        }

        // Force file download (Firefox etc.)
        window.open(uri);
    };

    Util._doTour = function (cb) {
        require(['lib/tour/jquery.cookie', 'lib/tour/bootstrap-tooltip'], function () {
            require(['lib/tour/bootstrap-popover'], function () {
                require(['lib/tour/bootstrap-tour.wrapper'], function (Tour) {
                    cb(new Tour());
                });
            });
        });
    };

    Util.startTour = function (steps) {
        var deferred = new Deferred();
        Util._doTour(function (tour) {
            $.each(steps, function (index, step) {
                tour.addStep(step);
            });
            tour.restart();
            return deferred.resolve(tour);
        });

        return deferred.promise;
    };

    Util.showAssist = function (element, message, duration) {
        Util._doTour(function (tour) {
            var milliseconds = duration || 1500;
            tour.addStep({
                element: element,
                placement: 'top',
                title: 'Webida Assist',
                content: message
            });

            tour.restart();
            $('.popover-inner > h3').css('background', '#d9534f');
            setTimeout(function () {
                tour.end();
            }, milliseconds);
        });
    };

    Util.concatWFSPath = function (WFSPathList) {
        if (WFSPathList.length === 0) {
            return ('');
        }
        var hd = WFSPathList.shift();
            // to change to array.reduce in the future (JS 1.6 is all available)
        var ret =
            _.reduce(WFSPathList, function (path, str) {
                var sep = '/';
                if (path.charAt(path.length - 1) === '/') {
                    sep = '';
                }
                // if (str.charAt(0) === '/') { }
                if (str.length > 2 && str.charAt(0) === '.' && str.charAt(1) === '/') {
                    str = str.slice(2);
                }
                return (path + sep + str);
            }, hd);
        return ret;
    };

    Util.openDialog = function (title, msg, cbYes, cbNo) {
        var defaultCbNo = function () {
            workbench.focusLastWidget();
        };
        PopupDialog.yesno({
            title: title,
            message: msg,
            type: 'error'
        }).then(cbYes, cbNo ? cbNo : defaultCbNo);
    };

    Util.clone = function (obj) {
        var newObject = jQuery.extend(true, {}, obj);
        return newObject;
    };

    /** http://thunderguy.com/semicolon/2009/05/23/tooltips-on-disabled-buttons-with-dojo/ */
    /** Add a tooltip to any number of nodes passed directly or as IDs. */
    Util.addTooltip = function (/*node or string or array*/nodes, /*string*/text) {
        if (!dojo.isArray(nodes)) {
            nodes = [nodes];
        }
        // connectId can be an id or a node (not that you'd know from the
        // documentation) or an array of ids and nodes
        var tt = new dijit.Tooltip({connectId: nodes, label: text, position: ['below']});
        return tt;
    };

    /** Add a tooltip to the parents of all form elements with the given
    name. The tooltips will show even if the element is disabled,
    provided the parent is not disabled. */
    Util.addParentTooltip = function (/*string*/id, /*string*/text) {
        var nodes = dojo.query('[id="' + id + '"]');
        var parents = dojo.map(nodes, function (node) {
            return node.parentNode;
        });
        Util.addTooltip(parents, text);
    };

    Util.getWorkspaceName = function (projectPath) {
        if (!projectPath) {
            throw new Error('projectPath is null');
        }
        return pathUtil.getName(pathUtil.getParentPath(projectPath));
    };

    Util.createXHR = function (method, url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.onload = function () {
            //console.log('onload', xhr.readyState, xhr.status);
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    console.error('Error loading url: ' + xhr.status);
                    notify.error('Error loading url: ' + xhr.status);
                }
                if (cb) {
                    cb(xhr.responseText);
                }
            }
        };
        xhr.onerror = function (e) {
            console.error('createXHR', e);
            notify.error('Error: ' + e);
        };
        //xhr.upload.onprogress = progressCallback;
        return xhr;
    };

    Util.setNestedObject = function (base, names, val) {
        for (var i = 0; i < names.length; i++) {
            // base = base[names[i]] = base[names[i]] || ((i === (names.length - 1)) ? val : {});
            if (!base[names[i]]) {
                base[names[i]] = {};
            }
            if (i === (names.length - 1)) {
                base = base[names[i]] = val;
            }
            base = base[names[i]];
        }
    };

    Util.resetCombo = function (id, cb) {
        var e = reg.byId(id);
        if (e) {
            var store = e.get('store');
            store.fetch({ query: { id: '*' },
                onComplete: function (items) {
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        store.remove(item.id);
                    }
                    dijit.byId(id).reset();
                    cb(store);
                }
            });
        } else {
            console.warn('Element not defined: ' + id);
        }
    };

    Util.selectTab = function (mainId, subId) {
        var mainTab = dijit.byId(mainId);
        var subTab = dijit.byId(subId);
        mainTab.selectChild(subTab);
    };

    Util.getProjectPath = function (paths) {
        if (paths && paths.length === 1) {
            var path = paths[0];
            return pathUtil.getProjectRootPath(path);
        }
        return null;
    };

    Util.getRunConfiguration = function (projectName, cb) {
        runConfiguration.getByProjectName(projectName, cb);
    };

    Util.getProjectConfiguration = function (projectName, cb) {
        //console.log('getProjectConfiguration', projectName);
        projectConfigurator.getConfigurationObjectByProjectName(projectName, cb);
        /*
        if (!projectName) {
            cb(null);
            return;
        }

        var projectPath = concatWFSPath([ide.getPath(), projectName]);
        var fsMount = ide.getFSCache();
        fsMount.readFile(projectPath + '/.project/project.json', function (err, content) {
            if (err) {
                console.log(err);
                cb(null);
            } else {
                var obj = null;
                if (content !== '') {
                    obj = JSON.parse(content);
                }
                cb(obj);
            }
        });
        */
    };

    Util.saveProjectBuild = function (projectInfo, cb) {
        projectConfigurator.saveProjectProperty(projectInfo.name, projectInfo, cb);
    };

    Util.saveProjectRun = function (projectName, projectInfo, cb) {
        runConfiguration.set(projectName, projectInfo, cb);
    };

    Util.createRunConfiguration = function (conf, template) {
        var run = {};
        var listItem = {};
        listItem.name = conf.name + '_run';
        /* jshint camelcase: false */
        listItem.path = template.app_main;
        /* jshint camelcase: true */
        listItem.type = conf.type;
        listItem.project = conf.name;
        if(conf.type === 'org.webida.run.java'){
            listItem.srcDir = template.srcDir;
            listItem.outputDir = template.outputDir;
        }
        run.list = [];
        run.list.push(listItem);
        run.selectedId = listItem.name;
        return run;
    };

    Util.addRunConfiguration = function (projectName, run, name, path, selected, updateIfExist) {
        var result = $.grep(run, function (e) {
            return e.name === name;
        });

        var listItem;
        var update = updateIfExist && result[0];
        if (update) {
            listItem = run[run.indexOf(result[0])];
            listItem.path = path;
        } else {
            listItem = {};
            listItem.name = name;
            listItem.path = path;
            listItem.project = projectName;
            run.push(listItem);
        }

        if (selected) {
            run.selectedId = listItem.name;
        }
    };

    Util.newuuid = function () {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = '0123456789abcdef';
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = '-';
        return s.join('');
    };

    Util.getFileName = function (path) {
        var filename = path.replace(/^.*[\\\/]/, '');
        return filename;
    };

    Util.expandWorkspaceTreeTo = function (path, select, cb) {
        wv.expandAncestors(path).then(function (result) {
            if (result === true) {
                if (wv.exists(path)) {
                    console.log('exists', path);
                    if (select) {
                        wv.selectNode(path);
                    }
                    cb();
                } else {
                    notify.error('No such node "' + path + '" in the workspace');
                }
            } else {
                notify.error('Error while expanding to "' + path + '": ' + result);
            }
        });
    };

    return Util;
});
