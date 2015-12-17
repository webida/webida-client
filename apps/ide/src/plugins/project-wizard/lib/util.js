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
 * @file Utils for project wizard
 * // FIXME It is better to be refactored and renamed to more specific name. This module is playing too much roles.
 * @since 1.0.0 (2014.04.18)
 * @author kh5325.kim@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'dijit/registry',
    'dojo/Deferred',
    'plugins/project-configurator/projectConfigurator',
    'plugins/webida.ide.project-management.run/run-configuration-manager',
    'popup-dialog',
    'webida-lib/app',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/notify',
    'webida-lib/util/path',
    'webida-lib/util/logger/logger-client'
], function (
    _,
    reg,
    Deferred,
    projectConfigurator,
    runConfiguration,
    PopupDialog,
    ide,
    workbench,
    workspace,
    notify,
    pathUtil,
    Logger
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    function Util() {}

    // FIXME This method used in one place. It's better to move to there.
    // It has too much code to just call `ide.getFSCache().addAlias()`.
    Util.getAliasPath = function (oriPath, expireTime) {
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

    /**
     * Find the index.html first met.
     *
     * @param {string} path - project path
     * @callback cb
     * // FIXME In error case, the callback function never be called.
     */
    Util.findIndexFile = function (path, cb) {
        Util.findFile(path, 'index.html').then(function (files) {
            var indexFile;
            if (files.length > 1) {
                // TODO: Show selection dialog?
                logger.log('findFile', 'Detected two or more \'index.html\' files.');
            } else {
                indexFile = files[0];
                cb(indexFile);
            }
        });
    };

    /**
     * Get the real url for index.html file
     *
     * @param {string} path - project path
     * @callback cb
     * // FIXME In error case, the callback function never be called.
     */
    Util.getAliasPathForIndexFile = function (path, cb) {
        Util.findIndexFile(path, function (indexFile) {
            var parentPath = indexFile.substring(0, indexFile.lastIndexOf('/'));
            var filePath = indexFile.substring(indexFile.lastIndexOf('/') + 1);

            Util.getAliasPath(parentPath).then(
                function (resolve) {
                    cb(resolve.url + '/' + filePath);
                },
                function (err) {
                    logger.log(err);
                }
            );
        });
    };

    /**
     * Find files recursively from base path with pattern
     *
     * @param {string} path - base path to find
     * @param {string} pattern - file name pattern to filter
     * @return {promise} - promise that will be finally resolved with the file list
     */
    Util.findFile = function (path, pattern) {
        var files = [];
        var deferred = new Deferred();
        if (!path) {
            return deferred.reject();
        }

        ide.getFSCache().list(path, true, function (err, lists) {
            if (err) {
                return deferred.reject(err);
            } else {
                files = files.concat(Util._findFileInChildren(lists, path, pattern));
                return deferred.resolve(files);
            }
        });

        return deferred.promise;
    };

    /**
     * Find files recursively from path list with pattern
     * //FIXME This method can be merged with `Util.findFile()`
     *
     * @param {string} children - file list as the base to start
     * @param {string} path - base path
     * @param {string} pattern - file name pattern to filter
     * @return {Array} - file list matched
     */
    Util._findFileInChildren = function (children, path, pattern) {
        var files = [];
        var regex = new RegExp(pattern);
        $.each(children, function (index, child) {
            if (!child.isDirectory) {
                if (regex.test(child.name)) {
                    files.push(path + '/' + child.name);
                }
            } else if (child.isDirectory) {
                // This method does not change the existing arrays, but returns a new
                // array, containing the values of the joined arrays.
                files = files.concat(Util._findFileInChildren(child.children, path + '/' + child.name, pattern));
            }
        });
        return files;
    };

    /**
     * Start to download
     *
     * @param {String} uri - uri string for file content.
            Its format is "data:<mime_type>,<data>". E.g., data:image/png;base64,xxxx... or data:text/plain,Hello World
     * @param {String} name - file name to be downloaed
     */
    Util.downloadFile = function (uri, name) {
        logger.log('downloadFile', name);
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

    /**
     * Load dependencies and start tour widget
     * // FIXME this has too many dependencies. It's better to use pure dojo widgets.
     * // FIXME And it's hardly related with DOM manipulation.
     * @callback cb - It will be called after all dependencies are loaded.
     * @private
     */
    Util._doTour = function (cb) {
        require(['lib/tour/jquery.cookie', 'lib/tour/bootstrap-tooltip'], function () {
            require(['lib/tour/bootstrap-popover'], function () {
                require(['lib/tour/bootstrap-tour.wrapper'], function (Tour) {
                    cb(new Tour());
                });
            });
        });
    };

    /**
     * Add steps to the tour widget and start the widget
     *
     * @param steps
     * @return {deferred.promise|{then, catch, finally}}
     */
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

    /**
     * @deprecated
     *  FIXME It seems hardly binded a specific DOM element. It's not good to be included here.
     *  It's better to use `Util.startTour()` method as an alternative option.
     */
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

    /**
     * Concat all paths and normalize
     *
     * // FIXME It may be replaced with other utils. like `normalize()` functions in a kind of path utils.
     * // FIXME its name 'WFS' is not matched with the real usage cases.
     * @param {Array} WFSPathList - path list to cancat
     * @return {string} - path string to be combined
     */
    Util.concatWFSPath = function (WFSPathList) {
        if (WFSPathList.length === 0) {
            return '';
        }
        var basePath = WFSPathList.shift();
        // TODO to change to array.reduce in the future (JS 1.6 is all available)
        return _.reduce(WFSPathList, function (path, str) {
            var sep = '/';
            if (path.charAt(path.length - 1) === '/') {
                sep = '';
            }
            if (str.length > 2 && str.charAt(0) === '.' && str.charAt(1) === '/') {
                str = str.slice(2);
            }
            return (path + sep + str);
        }, basePath);
    };

    /**
     * Open 'error' typed confirm dialog
     * @deprecated
     * // FIXME it is too much encapsulated. Just call `PopupDialog.yesno()`.
     */
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

    /**
     * @deprecated
     * // FIXME It is too much wrapped too.
     */
    Util.clone = function (obj) {
        var newObject = jQuery.extend(true, {}, obj);
        return newObject;
    };

    /**
     * @deprecated
     * //FIXME It is too much wrapped.
     */
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

    /**
     * @deprecated
     * //FIXME That seems to misuse id attribute. and nowhere using it.
     */
    /** Add a tooltip to the parents of all form elements with the given
    name. The tooltips will show even if the element is disabled,
    provided the parent is not disabled. */
    Util.addParentTooltip = function (/*string*/id, /*string*/text) {
        var nodes = dojo.query('[id="' + id + '"]');
        var parents = dojo.map(nodes, function (node) {
            return node.parentNode;
        });
        // FIXME just use `dijit.Tooltip`
        Util.addTooltip(parents, text);
    };

    /**
     * Get Workspace Name from projectPath
     *
     * @param {string} projectPath - path to project directory
     * @return {string} - Workspace name
     */
    Util.getWorkspaceName = function (projectPath) {
        if (!projectPath) {
            throw new Error('projectPath is null');
        }
        return pathUtil.getName(pathUtil.getParentPath(projectPath));
    };

    /**
     * Create Ajax request
     *
     * // FIXME it is being used in one place(launcher.js). I think it's better to move this method to the file
     * // or make it as a common lib. And `cb` function will never be called when there is an error.
     * @param {string} method - HTTP method name
     * @param {string} url - url
     * @param cb
     * @return {XMLHttpRequest}
     */
    Util.createXHR = function (method, url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.onload = function () {
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    logger.error('Error loading url: ' + xhr.status);
                    notify.error('Error loading url: ' + xhr.status);
                }
                if (cb) {
                    cb(xhr.responseText);
                }
            }
        };
        xhr.onerror = function (e) {
            logger.error('createXHR', e);
            notify.error('Error: ' + e);
        };
        return xhr;
    };

    /**
     * Set nested property by period-separated string path
     *
     *  e.g. If the `path` parameter is 'name1.name2', this function's result is equals below:
     *      baseObject['name1']['name2'] = val;
     *
     * @param {object} baseObject - base object
     * @param {string} path - period-separated string path for searching property in the base object
     * @param {object} val - value to set to target property
     */
    Util.setNestedObject = function (baseObject, path, val) {
        var names = path.split('.');
        for (var i = 0; i < names.length; i++) {
            if (!baseObject[names[i]]) {
                baseObject[names[i]] = {};
            }
            if (i === (names.length - 1)) {
                baseObject = baseObject[names[i]] = val;
            }
            baseObject = baseObject[names[i]];
        }
    };

    /**
     * @deprecated
     * Reset all item in the store of a widget specified by its id
     * // FIXME It is better to initialize new store than reset store manually like this.
     *
     * @param {string} id - widget id
     * @callback cb
     */
    Util.resetCombo = function (id, cb) {
        var e = reg.byId(id);
        if (e) {
            var store = e.get('store');
            store.fetch({ query: { id: '*' },
                onComplete: function (items) {
                    // remove all items in the store
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        store.remove(item.id);
                    }
                    dijit.byId(id).reset();
                    cb(store);
                }
            });
        } else {
            logger.warn('Element not defined: ' + id);
        }
    };

    /**
     * @deprecated
     * //FIXME It is too much wrapped. and too much specialized. There is only one usage place.
     */
    Util.selectTab = function (mainId, subId) {
        var mainTab = dijit.byId(mainId);
        var subTab = dijit.byId(subId);
        mainTab.selectChild(subTab);
    };

    /**
     * @deprecated
     * //FIXME It is too much wrapped. Just use `pathUtil.getProjectRootPath(paths[0])`
     * @param paths
     * @return {*}
     */
    Util.getProjectPath = function (paths) {
        if (paths && paths.length === 1) {
            var path = paths[0];
            return pathUtil.getProjectRootPath(path);
        }
        return null;
    };

    /**
     * Get run configuration by projectName
     * @param {string} projectName
     * @callback cb
     */
    Util.getRunConfiguration = function (projectName, cb) {
        runConfiguration.getByProjectName(projectName, cb);
    };

    /**
     * Get project configuration by projectName
     * @param {string} projectName
     * @callback cb
     */
    Util.getProjectConfiguration = function (projectName, cb) {
        projectConfigurator.getConfigurationObjectByProjectName(projectName, cb);
    };

    /**
     * Save project information
     *
     * @param projectInfo
     * @param cb
     */
    Util.saveProjectBuild = function (projectInfo, cb) {
        projectConfigurator.saveProjectProperty(projectInfo.name, projectInfo, cb);
    };

    /**
     * Save project run configuration
     *
     * @param projectName
     * @param runConf
     * @param cb
     */
    Util.saveProjectRun = function (projectName, runConf, cb) {
        runConfiguration.set(projectName, runConf, cb);
    };

    /**
     * Create new run configuration
     * // FIXME It's better to move main.js file. Or It can be moved to each extensions of run configuration.
     *
     * @param {object} conf - base configuration
     * @param template
     * @return {{}}
     */
    Util.createRunConfiguration = function (conf, template) {
        var run = {};
        var listItem = {};
        listItem.name = conf.name + '_run';
        /* jshint camelcase: false */
        listItem.path = template.app_main;
        /* jshint camelcase: true */
        listItem.type = conf.type;
        listItem.project = conf.name;
        if (conf.type === 'org.webida.run.java') {
            listItem.srcDir = template.srcDir;
            listItem.outputDir = template.outputDir;
        }
        run.list = [];
        run.list.push(listItem);
        run.selectedId = listItem.name;
        return run;
    };

    /**
     * Add or update run configuration from provided parameters
     *
     * @param {string} projectName
     * @param {object} run - run configuration object to add or update
     * @param {string} name - run configuration name
     * @param {string} path - run configuration path to start to run
     * @param {boolean} selected - set this run object to be selected (@deprecated not working currently)
     * @param {boolean} updateIfExist
     */
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

    /**
     * Generate new uuid
     *
     * @return {string} - uuid
     */
    Util.newuuid = function () {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = '0123456789abcdef';
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
        /*jshint bitwise: false*/
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
        /*jshint bitwise: true*/
        s[8] = s[13] = s[18] = s[23] = '-';
        return s.join('');
    };

    /**
     * Get file name from full path
     * @deprecated
     * //FIXME use pathUtil's `getName()` method
     * @param {string} path
     * @return {string} - file name
     */
    Util.getFileName = function (path) {
        var filename = path.replace(/^.*[\\\/]/, '');
        return filename;
    };

    /**
     * Expand all ancestors of the path and select the path in the workspace view
     * // TODO Doesn't just calling selectNode() method expand workspace tree?
     * @param {string} path - target path to select
     * @param {boolean} select - whether select the path or not
     * @callback cb
     */
    Util.expandWorkspaceTreeTo = function (path, select, cb) {
        workspace.expandAncestors(path).then(function (result) {
            if (result === true) {
                if (workspace.exists(path)) {
                    logger.log('exists', path);
                    if (select) {
                        workspace.selectNode(path);
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
