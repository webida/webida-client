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
    'webida-lib/util/loading-screen',
    'other-lib/toastr/toastr',
    'src/plugin-manager-0.1',
    'dojo/topic',
    'dojo/domReady!',
    'webida-lib/util/timedLogger'
], function(loadingScreen, toastr, pm, topic) {
    'use strict';
    /* global timedLogger: true */

    var exports = {};

    var wellOpened = false;

    // init toastr
    toastr.options = {
        'closeButton': true,
        'positionClass': 'toast-top-right'
    };

    // loading screen
    topic.subscribe('#REQUEST.showApp', function() {
        timedLogger.log('showApp request');
        setTimeout(function() {
            timedLogger.log('Hiding loading screen');
            topic.publish('app.showing');
            loadingScreen.hideLoadingScreen();
        }, 200);
    });

    // beforeunload checker (브라우져 종료 시도시 처리)
    var beforeUnloadCheckers = {};
    window.addEventListener('beforeunload', function(e) {

    });

    function startup( /*clientID, redirectUrl, */ options) {
        init(options);
    }

    function init(options) {
        var time = timedLogger.log('(A) initializing app');

        pm.initPlugins(function() {
            timedLogger.log('(E) initialized plug-ins', time);

            // TODO: is the following necessary?
            // suppress DnD on the window (but, an inner element can accept DnD).
            window.ondragenter = window.ondragover = window.ondrop = function() {
                return false;
            };

            wellOpened = true;
        });
    }


    /**
     * provides a mean to check if Webida App can be safely unloaded when a user
     * initiates the App unload.
     * By this method, a part of the App (usually, a module or plug-in) can register
     * a callback function which will be called when the App is about to be unloaded
     * (in 'beforeunload' event handler).
     * The unload can be canceled depending on the results of the callback functions
     * registered by this method and the user's reaction to the confirmation dialog.
     * Such a callback function should eturn a non-empty string if the App part has any reason
     * to prevent the App unload.
     *
     * @callback register_before_unload_checker
     * @param {before_unload_checker} checker - a callback function whoich will be called
     *      in the 'beforeunload' event handler and should return a non-empty string
     *      which describes the reason, if any, to prevent the page unload.
     *      The string (message) will be shown to the user in a dialog which confirms
     *      that the user really wants to unload the App in spite of the reason
     *      (e.g. unsaved changes in a file).
     * @returns {undefined}
     */

    function registerBeforeUnloadChecker(checker) {
        var key = 'key' + Object.keys(beforeUnloadCheckers).length;
        beforeUnloadCheckers[key] = checker;
    }

    /**
     * the type of the callback function given to app.registerStatusContributorAndGetLastStatus
     * method
     *
     * @callback status_contributor
     * @returns {object} any JSON-serializable object that encodes the status of the App part
     *      that registers this callback function
     */

    /**
     * provides a mean to save and restore the status of a part (usually, a module or plug-in)
     * of Webida App.
     * The effect of this method is twofold: (1) it registers a callback function which
     * returns the status of the App part which a user wants to save when the App is unloaded,
     * and (2) it returns the last status of the part which was saved when the App was
     * unloaded last time.
     *
     * @callback register_status_contributor
     * @param {string} key - a key string to identify the App part whose status is
     *      to be saved when the App is unloaded and restored when the App is loaded next time.
     * @param {status_contributor} contributor - a callback function that returns an object
     *      which encodes the last status of the App part. The object has
     *      no constraint except that it must be JSON-serializable. This callback function
     *      is called when the App is unloaded (in 'unload' event handler)
     * @returns {object} the object which the callback function returned at the last unload of the App.
     */
    function registerStatusContributorAndGetLastStatus(key, contributor) {
        timedLogger.log('entering registerStatusContributorAndGetLastStatus() with a key ' + key);

        if (lastStatusContributors[key]) {
            console.log('A last status contributor function was already registed with the key \'' + key + '\'');
            return null;
        } else {
            lastStatusContributors[key] = contributor;
        }

        if (appLastStatus) {
            return appLastStatus[key];
        } else {
            return null;
        }
    }

    function quit() {
        // only support NON-IE browser
        try {
            window.focus();
            window.opener = window;
            window.close();
        } catch (e) {
            console.log('First try to close App failed', e);

            try {
                window.open('', '_self', '');
                window.close();
            } catch (e) {
                console.log('Second try to close App failed', e);
            }
        }
    }

    function reload() {
        window.location.reload();
    }

    /**
     * A function that boots Webida App with given workspace
     * @type {open_workspace}
     */
    exports.startup = startup;

    /**
     * A function that registers a callback which checks whether Webida App can safely be unloaded
     * @type {register_before_unload_checker}
     */
    exports.registerBeforeUnloadChecker = registerBeforeUnloadChecker;

    /**
     * A function that quits the App. TODO: document
     */
    exports.quit = quit;

    /**
     * A function that quits the App. TODO: document
     */
    exports.reload = reload;

    return exports;
});