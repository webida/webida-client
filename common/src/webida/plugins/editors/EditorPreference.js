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
 * Constructor function
 * EditorPreference set or unset fields of editor preferences
 *
 * @constructor
 * @see TextEditorPart
 * @since: 2015.06.23
 * @author: hw.shim
 *
 */

define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'plugins/webida.preference/preference-service-factory'
], function (genetic,
             Logger,
             PreferenceFactory) {
    'use strict';

    var logger = new Logger();
    logger.off();

    var preferences = PreferenceFactory.get('WORKSPACE');

    function EditorPreference(preferenceIds, viewer) {
        var that = this;
        logger.info('new EditorPreference(' + preferenceIds + ', ' + viewer + ')');
        this.configs = null;
        this.preferenceIds = preferenceIds;
        this.viewer = viewer;
        this.listener = function (values) {
            for (var key in values) {
                if (values.hasOwnProperty(key)) {
                    that.setField(key, values[key]);
                }
            }
        };
    }

    genetic.inherits(EditorPreference, Object, {
        setFields: function (configs) {
            logger.info('setFields(' + configs + ')');
            var that = this;
            this.configs = configs;

            for (var i = 0; i < that.preferenceIds.length; i++) {
                preferences.getValues(that.preferenceIds[i], function (values) {
                    for (var key in values) {
                        if (values.hasOwnProperty(key)) {
                            that.setField(key, values[key]);
                        }
                    }
                });
                preferences.addFieldChangeListener(that.preferenceIds[i], that.listener);
            }
        },
        unsetFields: function () {
            logger.info('unsetFields()');
            var that = this;
            for (var i = 0; i < that.preferenceIds.length; i++) {
                preferences.addFieldChangeListener(that.preferenceIds[i], that.listener);
            }
        },
        setField: function (key, value) {
            //logger.info('setField('+key+', '+value+')');
            var config = this.configs[key];
            if (config) {
                var setter = config[0];
                /*if (value === undefined && config.length > 1) {
                    value = config[1];
                }*/
                this.viewer[setter](value);
            }
        },
        getField: function (id, key, callback) {
            return preferences.getValue(id, key, function (value) {
                if (callback) {
                    callback(value);
                }
            });
        }
    });

    return EditorPreference;
});
