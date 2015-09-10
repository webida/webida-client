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

define(['webida-lib/app',
    'webida-lib/plugin-manager-0.1',
    'external/lodash/lodash.min'],
function (app, pm, _) {
    'use strict';

    var preferences;
    var listeners = {};

    var prefFileDir = app.getPath() + '/.workspace/';
    var prefFilePath = prefFileDir + 'settings.json';

    var bind = app.getFSCache();

    var validValType = ['number', 'string', 'boolean'];
    function isValidValue(value) {
        return validValType.indexOf(typeof value) >= 0;
    }

    function load(done) {
        bind.createDirectory(prefFileDir, true, function () {
            bind.readFile(prefFilePath, function (err, content) {
                if (err) {
                    done(err);
                } else {
                    try {
                        preferences = JSON.parse(content);
                        console.info('preferences = ', preferences);
                        if (typeof preferences !== 'object') {
                            throw 'Malformed preferences: preferences must be stored in an object';
                        }
                        _.each(preferences, function (value, key) {
                            if (typeof key !== 'string') {
                                throw 'Malformed settings.json: Key type must be string';
                            }
                            if (!isValidValue(value)) {
                                throw 'Malformed settings.json: Value type must be number, string or boolean';
                            }
                        });

                        done();
                    } catch (e) {
                        console.log('content = ' + content);
                        done(e);
                    }
                }
            });
        });
    }

    var savedListeners = [];
    function save() {
        bind.createDirectory(prefFileDir, true, function () {
            bind.writeFile(prefFilePath, JSON.stringify(preferences), function (err) {
                if (err) {
                    console.error(err);
                } else {
                    if (savedListeners && savedListeners.length > 0) {
                        _.each(savedListeners, function (listener) {
                            listener();
                        });
                    }
                }
            });
        });
    }

    function callListener(fieldId, value) {
        if (listeners[fieldId] !== undefined) {
            _.each(listeners[fieldId], function (listener) {
                try {
                    listener(value, fieldId);
                } catch (e) {
                    console.error(e);
                }
            });
        }
    }

    function generateDefaults() {
        console.log('Generating preference defaults...');
        preferences = {};
        (function () {
            var pages = pm.getExtensions('workbench:preference-page');
            pages = _.sortBy(pages, function (page) { return page.hierarchy; });

            _.each(pages, function (page) {
                require([page.module], function (mod) {
                    var fieldCreator = {
                        page: page,
                        addField: function (fieldId, fieldType, opt) {
                            preferences[fieldId] = opt['default'];
                        }
                    };
                    if (typeof mod[page.handler] === 'function') {
                        mod[page.handler](fieldCreator);
                    }
                });
            });
        })();
    }

    var loadedListeners = [];
    load(function (err) {
        if (err) {
            console.warn('Failed to load preferences: ' + err);
            generateDefaults();
        }
        _.each(loadedListeners, function (listener) {
            listener();
        });
        loadedListeners = false;
    });

    return {
        updateValues: function (obj) {
            _.each(obj, function (value) {
                if (!isValidValue(value)) {
                    throw 'An invalid argument to the updateValues function';
                }
            });
            _.extend(preferences, obj);
            _.each(obj, function (value, key) {
                callListener(key, value);
            });
            save();
        },

        getValue: function (keys) {
            if (typeof keys === 'string') {
                return preferences[keys];
            }
            return _.map(keys, function (key) {
                return preferences[key];
            });
        },

        addLoadedListener: function (done) {
            if (loadedListeners === false) {
                done();
            } else {
                loadedListeners.push(done);
            }
        },

        addSavedListener: function (listener) {
            savedListeners.push(listener);
        },

        addFieldChangeListener: function (fieldId, listener) {
            if (listeners[fieldId] === undefined) {
                listeners[fieldId] = [];
            }
            listeners[fieldId].push(listener);
        },
        removeFieldChangeListener: function (fieldId, listener) {
            listeners[fieldId] = _.without(listeners[fieldId], listener);
        }
    };
});
