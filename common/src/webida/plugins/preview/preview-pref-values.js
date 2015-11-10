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
 * webida - preview plugin
 *
 */
/* jshint unused:false */

define([
    'plugins/webida.preference/preference-service-factory',
	'webida-lib/util/logger/logger-client'
], function (
    PreferenceFactory,
    Logger
) {
    'use strict';

	var logger = new Logger();
	//logger.setConfig('level', Logger.LEVELS.log);
	//logger.off();
    var preferences = PreferenceFactory.get('WORKSPACE');

    // preferece value
    var PREFERENCE_ID = 'preview';
    var PREFERENCE_AUTO_CONTENTS = 'preview:autoContentsChange';
    var PREFERENCE_LIVE_RELOAD = 'preview:liveReload';
    var options = {};
    options[PREFERENCE_AUTO_CONTENTS] = false;
    options[PREFERENCE_LIVE_RELOAD] = true;

    function applyPreferences(values) {
        if (typeof values[PREFERENCE_AUTO_CONTENTS] === 'boolean') {
            options[PREFERENCE_AUTO_CONTENTS] = values[PREFERENCE_AUTO_CONTENTS];
        }
        if (typeof values[PREFERENCE_LIVE_RELOAD] === 'boolean') {
            options[PREFERENCE_LIVE_RELOAD] = values[PREFERENCE_LIVE_RELOAD];
        }
    }

    preferences.addFieldChangeListener(PREFERENCE_ID, applyPreferences);

    return options;
});

