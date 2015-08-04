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

define([
	'external/lodash/lodash.min',
	'plugins/webida.notification/notification-message',
	'webida-lib/util/logger/logger-client'
], function (
	_, 
	toastr,
	Logger
) {
    'use strict';

    // css and modules manager

	var logger = new Logger();
	//logger.setConfig('level', Logger.LEVELS.log);
	//logger.off();
    var loadedItems = [];
    var loadingItems = [];
    var deferredDones = {};
    var processedDones = [];
    var __counter = 1;
    function loadCSSList(items, done) {
        function checkDone(doneItems) {
            return function () {
                _.each(doneItems, function (newDone) {
                    if (_.contains(loadedItems, newDone)) {
                        toastr.error('Not good ' + newDone + ' in ' + loadedItems);
                    } else {
                        loadedItems.push(newDone);
                    }
                });
                _.each(doneItems, function (newDone) {
                    _.each(deferredDones[newDone], function (listener) {
                        if (!_.contains(processedDones, listener.id)) {
                            var containsAll = _.every(listener.neededs, function (x) {
                                return _.contains(loadedItems, x);
                            });
                            if (containsAll) {
                                processedDones.push(listener.id);
                                listener.done();
                            }
                        }
                    });
                });
            };
        }

        function setOnLoadToCssTag(head, link, onload) {
            var failedCounter = 0;
            var intervalId = setInterval(function () {
                try {
                    var sheet;
                    if ('sheet' in link) {
                        sheet = 'sheet';
                    } else {
                        sheet = 'styleSheet';
                    }

                    if (link[sheet]) {
                        clearInterval(intervalId);
                        logger.log(link.href+' loaded');
                        onload(true);
                    } else {
                        failedCounter++;
                        if (failedCounter > 1500) {
                            clearInterval(intervalId);
                            head.removeChild(link);
                            console.error('Failed to load a CSS ' + link.href);
                            onload(false);
                        }
                    }
                } catch (e) {
                    console.error('exception while checking the load of a CSS file ' + link.href + ': ' + e);
                }
            }, 10);
        }

        //---

        if ((typeof done) !== 'function') {
            done = function () {};
        }

        var deferred = {
            neededs: _.map(items, _.identity),
            done: done,
            id: __counter++,
        };

        _.each(items, function (x) {
            if (!deferredDones[x]) {
                deferredDones[x] = [];
            }
            deferredDones[x].push(deferred);
        });

        var toLoad = _.filter(items, function (x) {
            return !_.contains(loadedItems, x) && !_.contains(loadingItems, x);
        });
        if (toLoad.length > 0) {
            loadingItems = loadingItems.concat(toLoad);
            _.each(toLoad, function (x) {
                var cssTag = document.createElement('link');
                cssTag.setAttribute('rel', 'stylesheet');
                cssTag.setAttribute('type', 'text/css');
                cssTag.setAttribute('href', x);
                var head = document.getElementsByTagName('head')[0];
                setOnLoadToCssTag(head, cssTag, checkDone([x]));
                head.appendChild(cssTag);
            });
        } else {
            // Nothing to load more
            done();
        }
    }
    return loadCSSList;
});
