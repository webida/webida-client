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

define([
	'webida-lib/plugins/workbench/preference-system/store', // TODO: issue #12055
	'webida-lib/util/logger/logger-client'
], function (preferences, Logger) {
    'use strict';

	var logger = new Logger();
	//logger.setConfig('level', Logger.LEVELS.log);
	//logger.off();

    // preferece value
    var PREFERENCE_AUTO_CONTENTS = 'preview:autoContentsChange';
    var PREFERENCE_LIVE_RELOAD = 'preview:liveReload';
    var options = {};
    options[PREFERENCE_AUTO_CONTENTS] = false;
    options[PREFERENCE_LIVE_RELOAD] = true;

    function applyPreferences(value, id) {
        if (typeof value === 'boolean') {
            options[id] = value;
        } else {
            logger.log('Non-boolean value was tried to set an option ' + id + '. Ignored.');
        }
    }

    preferences.addLoadedListener(function () {
        applyPreferences(preferences.getValue(PREFERENCE_AUTO_CONTENTS), PREFERENCE_AUTO_CONTENTS);
        applyPreferences(preferences.getValue(PREFERENCE_LIVE_RELOAD), PREFERENCE_LIVE_RELOAD);

        preferences.addFieldChangeListener(PREFERENCE_AUTO_CONTENTS, applyPreferences);
        preferences.addFieldChangeListener(PREFERENCE_LIVE_RELOAD, applyPreferences);
    });

    return options;
});

