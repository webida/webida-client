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
 * @module plugin-manager-0.1
 * @fileoverview webida - app-library, plugin manager
 *
 * @version: 0.1.0
 * @since: 2013.09.26
 *
 */

define(['webida-lib/webida-0.3',
        'other-lib/underscore/lodash.min',
        'other-lib/URIjs/URI',
        'dojo/promise/all',
        'dojo/request',
        'dojo/topic'
       ],
function (webida, _, URI, all, request, topic) {

    'use strict';

    var wholePlugins = {}; // including disabled ones.
    var activePlugins = {};
    var wholeEP = {}, activeEP = {};
    var wholeExt = {}, activeExt = {};
    var appConfigs = {};


    function preparePlugins(appPath, locs, disabledLocs, startLocs, nextJob) {


        var dependency = locs.map(function (loc) { return 'dojo/text!' + loc + '/plugin.json'; });
        require(dependency, function () {

            function parseRequirement(str) {
                return str.split('|').map(function (c) {
                    return c.trim().split('&').map(function (d) { return d.trim(); }); // disjuncts
                });
            }

            // Get manifest objects and index them by the plugin name in 'plugins'.
            var manifests = _.toArray(arguments);
            manifests.forEach(function (manifestStr, i) {
                var manifest;
                try { manifest = JSON.parse(manifestStr); } catch (e) { }

                if (!manifest) {
                    alert('Error: Parsing plugin.json in ' + locs[i] + ' failed. Aborting');
                    throw new Error();
                }

                if (typeof manifest.name !== 'string') {
                    alert('Error: plugin.json in ' + locs[i] + ' lacks "name" property. Aborting');
                    throw new Error();
                }

                var matches = manifest.name.match(/(\w|-|\.)+/g);
                if (matches === null || matches.length > 1) {
                    alert('Error: The name property in plugin.json in ' + locs[i] +
                          ' must consist of alphanumeric characters, underscores, and dashes, ' +
                          'which is not the case for ' + manifest.name + '. Aborting');
                    throw new Error();
                }

                if (wholePlugins[manifest.name]) {
                    alert('Error: A plugin name (' + manifest.name + ') duplicates. Aborting');
                    throw new Error();
                }

                if (manifest.requirement) {
                    if (!_.isString(manifest.requirement) || !manifest.requirement.trim()) {
                        alert('Error: A plugin (' + manifest.name +
                              ') must have a non-empty string \'requirement\'. Aborting');
                        throw new Error();
                    }
                }

                var loc = locs[i];

                if (startLocs.indexOf(loc) >= 0 && manifest.requirement) {
                    alert('Error: A start plugin (' + manifest.name +
                          ') cannot declare an \'requirement\' clause. Aborting');
                    throw new Error();
                }

                if (manifest.requirement) {
                    manifest.requirement = parseRequirement(manifest.requirement);
                    if (_.flatten(manifest.requirement).some(function (a) { return !a; })) {
                        alert('Error: A plugin (' + manifest.name +
                              ') has an invalid \'requirement\' clause: misplaced +. Aborting');
                        throw new Error();
                    }
                }

                // end of the checks

                if (!manifest.module) {
                    manifest.module = loc + '/plugin';	// default of plugin's module
                }

                wholePlugins[manifest.name] = {
                    loc: loc,
                    manifest: manifest,
                    disabled: false,
                    inactive: false
                };

                manifests[i] = manifest;
            });

            // check if the requirement relation has a cycle
            var checkCycleInRequirement = function (next, seed) {
                if (next === seed) {
                    alert('Error: requirement relation among plugins makes a cycle (containing ' +
                          seed + '). Aborting');
                    throw new Error();
                }
                var plugin = wholePlugins[next];
                if (plugin.manifest.requirement) {
                    plugin.manifest.requirement.forEach(function (required) {
                        checkCycleInRequirement(required, seed);
                    });
                }
            };
            manifests.forEach(function (manifest) {
                if (manifest.requirement) {
                    _.flatten(manifest.requirement).forEach(function (name) {
                        if (wholePlugins[name]) {
                            checkCycleInRequirement(name, manifest.name);
                        } else {
                            alert('Error: Plugin ' + manifest.name +
                                  ' requires an unknown plugin ' + name + '. Aborting');
                            throw new Error();
                        }
                    });
                }
            });

            // inactivate plugins in 'disabledLocs'
            manifests.forEach(function (manifest) {
                if (disabledLocs.indexOf(wholePlugins[manifest.name].loc) >= 0) {
                    //console.log('hina temp: disabled: ' + loc);
                    var plugin = wholePlugins[manifest.name];
                    plugin.disabled = true;
                    plugin.inactive = true;
                }
            });

            // update inactive flag of plugins -
            //   inactive a plugin whose required are all inactive.
            var changed;
            var updateInactiveFlag = function (manifest) {
                var plugin = wholePlugins[manifest.name];
                if (!plugin.inactive && manifest.requirement) {
                    var toInactivate = manifest.requirement.every(function (required) {
                        return required.some(function (a) {
                            return wholePlugins[a].inactive;
                        });
                    });
                    if (toInactivate) {
                        plugin.inactive = true;
                        changed = true;
                    }
                }
            };
            do {
                changed = false;
                manifests.forEach(updateInactiveFlag);
            } while (changed);

            // make a list of extension points
            Object.keys(wholePlugins).forEach(function (pluginName) {
                var plugin = wholePlugins[pluginName], eps;
                if ((eps = plugin.manifest.extensionPoints)) {
                    if (typeof eps === 'object' && !_.isArray(eps)) {
                        Object.keys(eps).forEach(function (epId) {
                            if (epId.indexOf(pluginName + ':') !== 0) {
                                alert('Error: every extension point\'s name must start with the name of ' +
                                      'the plug-in in which it is declared, which is violated by ' + epId +
                                      ' of the plug-in ' + pluginName);
                                throw new Error();
                            } else if (wholeEP[epId]) {
                                alert('Error: Duplicate extension point ' + epId + ' in plugin ' + pluginName);
                                throw new Error();
                            } else {
                                //console.log('hina temp:   an e.p found: ' + epId);
                                var epProps = eps[epId];
                                var t = typeof epProps;
                                if (t === 'object' || t === 'string') {
                                    wholeEP[epId] = epProps;
                                } else {
                                    alert('Error: Invalid extension point specification of ' +
                                          epId + ' in plugin ' + pluginName);
                                    throw new Error();
                                }
                            }
                        });
                    } else {
                        alert('Error: Invalid extension points specification in plugin ' + pluginName);
                        throw new Error();
                    }
                }
            });

            // import definitions of extension points if necessary,
            // and check the list of extension points
            var promises = {};
            Object.keys(wholeEP).forEach(function (epId) {
                var val = wholeEP[epId];
                if (typeof val === 'string') {
                    var url = require.toUrl(val);
                    var promise = request(url).then(
                        function (data) {
                            try {
                                var epProps = JSON.parse(data);
                                wholeEP[epId] = epProps;
                                return epProps;
                            } catch (e) {
                                return 'Error while parsing the imported definition of an extension point "' +
                                      epId + '" (' + e + ')';
                            }
                        },
                        function (err) {
                            return 'Error while importing the definition of an extension point "' +
                                  epId + '" (' + err + ')';
                        });
                    promises[epId] = promise;
                }
            });
            all(promises).then(function (results) {
                Object.keys(results).forEach(function (epId) {
                    if (typeof results[epId] === 'string') {
                        alert(results[epId]);
                        throw new Error();
                    }
                });

                // now importing the definition of extension points is done

                Object.keys(wholeEP).forEach(function (epId) {
                    var epProps = wholeEP[epId];
                    if (!_.isArray(epProps)) {
                        epProps = [epProps];
                    }

                    epProps.forEach(function (epProp) {
                        if (!epProp.name || !epProp.type) {
                            alert('Error: \'name\' and \'type\' are mandatory ' +
                                  'properties in components of an extension point, ' +
                                  'which is violated in the definition of ' + epId);
                            throw new Error();
                        }
                    });

                    // if function property has no default value,
                    // then set the default value to the property name
                    epProps.forEach(function (epProp) {
                        if (epProp.type === 'function' && !epProp.default) {
                            epProp.default = epProp.name;
                        }
                    });

                    wholeEP[epId] = epProps;
                    wholeEP[epId]['__plugin__'] = epId.split(':')[0];
                    wholeExt[epId] = [];
                });
            }).then(function () {

                // bind each extension to its extension point
                Object.keys(wholePlugins).forEach(function (key) {
                    var plugin = wholePlugins[key], extSets;
                    if ((extSets = plugin.manifest.extensions)) {
                        if (typeof extSets === 'object' && !_.isArray(extSets)) {
                            Object.keys(extSets).forEach(function (epId) {
                                if (wholeEP[epId]) {
                                    var epProps = wholeEP[epId];
                                    var extSet = extSets[epId];

                                    if (typeof extSet === 'object') {
                                        if (!_.isArray(extSet)) {
                                            extSet = [extSet];
                                        }
                                        extSet.forEach(function (ext) {
                                            var extProps = Object.keys(ext);

                                            epProps.forEach(function (epProp) {
                                                if (extProps.indexOf(epProp.name) < 0) {
                                                    if (epProp.default) {
                                                        ext[epProp.name] = epProp.default;
                                                    } else {
                                                        alert('Error: An extension to the point ' + epId +
                                                              ' does not have a property ' + epProp.name +
                                                              ' in plugin ' + key + '. Aborting');
                                                        throw new Error();
                                                    }
                                                }
                                            });

                                            if (!ext.module) {
                                                ext.module = plugin.manifest.module;	// default of extension's module
                                            }

                                            ext['__plugin__'] = plugin;
                                            wholeExt[epId].push(ext);
                                        });

                                    } else {
                                        alert('Error: Invalid extension specification of ' +
                                              epId + ' in plugin ' + key);
                                        throw new Error();
                                    }

                                } else {
                                    alert('Error: Plugin ' + key + ' has an extension to an unknown point ' + epId);
                                    throw new Error();
                                }
                            });
                        } else {
                            alert('Error: Invalid extensions specification in plugin ' + key);
                            throw new Error();
                        }
                    }
                });

                // collect active plugins.
                Object.keys(wholePlugins).forEach(function (key) {
                    if (wholePlugins[key].inactive) {
                        console.log('Plugin \'' + key + '\' is inactive');
                    } else {
                        //console.log('hina temp: Plugin \'' + key + '\' is active');
                        activePlugins[key] = wholePlugins[key];
                    }
                });

                // collect active extension points
                Object.keys(wholeEP).forEach(function (epId) {
                    var ep = wholeEP[epId];
                    if (!ep.__plugin__.inactive) {
                        activeEP[epId] = ep;
                    }
                });

                // collct active extensions
                Object.keys(activeEP).forEach(function (epId) {
                    activeExt[epId] = wholeExt[epId].filter(function (ext) {
                        return !ext.__plugin__.inactive;
                    });
                });

                // handle subscriptions to topics (events)
                Object.keys(activePlugins).forEach(function (key) {
                    var plugin = activePlugins[key];
                    var manifest = plugin.manifest;
                    if (manifest.subscriptions) {
                        var subscrSets = manifest.subscriptions;
                        if (typeof subscrSets === 'object' && !_.isArray(subscrSets)) {
                            Object.keys(subscrSets).forEach(function (topicId) {
                                var subscrSet = subscrSets[topicId];
                                if (typeof subscrSet === 'object') {
                                    if (!_.isArray(subscrSet)) {
                                        subscrSet = [subscrSet];
                                    }

                                    subscrSet.forEach(function (subscr) {
                                        var handler;
                                        if (typeof (handler = subscr.handler) === 'string') {
                                            var handlerSet = false;
                                            var modName = subscr.module || manifest.module;
                                            var h =
                                                topic.subscribe(topicId, function () {
                                                    var args = arguments;
                                                    require([modName], function (mod) {
                                                        if (typeof mod[handler] === 'function') {
                                                            mod[handler].apply(null, args);
                                                            if (!handlerSet) {
                                                                handlerSet = true;
                                                                h.remove();	// immediately removed once called.
                                                                topic.subscribe(topicId, mod[handler]);
                                                            }
                                                        } else {
                                                            if (!handlerSet) {
                                                                handlerSet = true;
                                                                alert('Module \'' +  modName +
                                                                      '\' does not have a handler named \'' +
                                                                      handler + '\' for a topic \'' +
                                                                      topicId + '\'');
                                                                throw new Error();
                                                            }
                                                        }
                                                    });
                                                });
                                        } else {
                                            alert('A subscription to the topic \'' + topicId +
                                                  '\' in the plugin \'' + key +
                                                  '\' must specify a handler (function name)');
                                            throw new Error();
                                        }
                                    });
                                } else {
                                    alert('Error: Invalid subscriptions specification in plugin ' + key);
                                    throw new Error();
                                }
                            });
                        } else {
                            alert('Error: Invalid subscriptions specification in plugin ' + key);
                            throw new Error();
                        }
                    }
                });

                // read in config files for non-local plugins, and load start plugin modules
                var nonLocalPlugins = Object.keys(activePlugins).filter(function (pluginName) {
                    var plugin = activePlugins[pluginName];
                    return (plugin.loc.indexOf('plugins/') !== 0);
                });
                promises = {};
                nonLocalPlugins.forEach(function (pluginName) {
                    var configFile =  URI(appPath).segment('plugins/' + pluginName +
                                                           '/config.json').path();
                    var promise = request(configFile).then(function (data) {
                        //console.log('config.json read succ for ' + pluginName + ': ' + data);
                        return data;
                    }, function (err) {
                        console.warn('config.json read err for ' + pluginName + ': ' + err);
                        return '{}';
                    });
                    promises[pluginName] = promise;
                });
                all(promises).then(function (results) {
                    //console.debug('hina temp: ', results);
                    Object.keys(results).forEach(function (pluginName) {

                        var config, configStr;
                        if ((configStr = results[pluginName])) {
                            try {
                                config = JSON.parse(configStr);
                            } catch (e) {
                                alert('Error: cannot parse config.json file for the plugin \'' +
                                      pluginName + '\'');
                                throw new Error();
                            }
                            appConfigs[pluginName] = config;
                        } else {
                            alert('Error: cannot read config.json file for the plugin \'' +
                                  pluginName + '\'');
                            throw new Error();
                        }
                    });

                }).then(function () {
                    var activeStartPlugins = getActivePluginsByLocations(startLocs);
                    var modules = activeStartPlugins.map(function (plugin) {
                        return plugin.manifest.module;
                    });
                    modules = _.uniq(modules);
                    require(modules, function () {
                        console.log('Loaded start plug-ins');

                        // callback
                        if (nextJob) {
                            nextJob();
                        }
                    });
                });

            });
        });
    }

    function getActivePluginsByLocations(locs) {
        var bag = [];
        Object.keys(activePlugins).forEach(function (key) {
            var plugin = activePlugins[key];
            if (locs.indexOf(plugin.loc) >= 0) {
                bag.push(plugin);
            }
        });
        return bag;
    }

    return {
        /**
         * read and anlayze the manifest files (plugin.json's) of plugins
         *
         * @memberof plugin-manager-0.1
         * @method initPlugins
         *
         * @param {String} appPath - path of the app
         * @param {String} workspace - path of the workspace of the app being executed
         * @param {Function} nextJob - function to execute right after this method
         * @returns <nothing>
         */
        initPlugins: function (appPath, workspace, nextJob) {  //
            //console.log('hina temp: entering initPlugins()');
            var fsid, ws, mount;
            var appPluginSettings, userPluginSettings;

            var pluginSettingsProperties = ['plugins', 'start-plugins', 'disabled-plugins'];
            function trimPluginSettings(settings) {
                var trimed = {};

                pluginSettingsProperties.forEach(function (p) {
                    if (settings[p]) {
                        trimed[p] = settings[p].map(function (str) { return str.trim(); });
                    }
                });

                return trimed;
            }

            // read plugins/start-plugins.json and set startPlugins
            function readAppPluginSettings() {
                var settingsFile = URI(appPath).segment('plugins/plugin-settings.json').pathname();
                require(['dojo/text!' + settingsFile], function (text) {
                    var o;
                    try { o = JSON.parse(text); } catch (e) { }
                    if (o) {
                        appPluginSettings = trimPluginSettings(o);
                        readUserPluginSettings();
                    } else {
                        alert('Failed to parse the app plugin settings file ' + appPluginSettings);
                    }

                });
            }

            // read PLUGIN_SETTINGS_FILE in <ws>, set pluginDirs, plugins and disabledPlugins,
            // and update startPlugins
            function readUserPluginSettings() {
                var settingsFile = ws + '/.workspace/plugin-settings.json';
                mount.readFile(settingsFile, function (err, text) {
                    if (err) {
                        console.log('Unable to read user plugin settings (' + err + ')');
                        userPluginSettings = {};
                    } else {
                        var o;
                        try { o = JSON.parse(text); } catch (e) { }
                        if (o) {
                            userPluginSettings = trimPluginSettings(o);
                        } else {
                            console.log('Failed to parse user plugin settings (disabled)');
                        }
                    }

                    // merge settings and prepare plugins
                    var plugins =  _.union(appPluginSettings.plugins || [],
                                           userPluginSettings.plugins || []);
                    var disabledPlugins =  _.union(appPluginSettings['disabled-plugins'] || [],
                                                   userPluginSettings['disabled-plugins'] || []);
                    var startPlugins =  _.union(appPluginSettings['start-plugins'] || [],
                                                userPluginSettings['start-plugins'] || []);

                    preparePlugins(appPath, plugins, disabledPlugins, startPlugins, nextJob);
                });
            }

            fsid = workspace.substring(0, workspace.indexOf('/'));
            ws = workspace.substr(workspace.indexOf('/'));
            mount = webida.fs.mountByFSID(fsid);

            readAppPluginSettings();
        },

        /**
         * returns an array of objects which represent the extensions of the given
         * extension point
         *
         * @memberof plugin-manager-0.1
         * @method getExtensions
         *
         * @param {String} extPnt -
         *      the name of the extension point whose extensions are to be retrieved.
         * @returns the array of objects which represent the extensions.
         */
        getExtensions: function (extPnt) {
            return activeExt[extPnt] || [];
        },


        /**
         * returns a structure (an object) which keeps the information of the whole plugins's shortcut
         *
         * @memberof plugin-manager-0.1
         * @method getWholeShortCutInfo
         * @returns an object, key of shortcut's area, value is shortcut's info object
         */
        getExtensionPoints: function () {
            return activeEP;
        },

        getAppConfig: function (pluginName) {
            var plugin = activePlugins[pluginName];
            if (plugin) {
                return appConfigs[pluginName] || plugin.manifest.config || {};
            } else {
                return null;
            }
        }
    };
});
