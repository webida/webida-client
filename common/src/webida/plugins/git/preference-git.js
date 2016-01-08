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
 * @file This file could get value for git preference
 * @since 1.0.0
 * @author hyunik.na@samsung.com, minsung.jin@samsung.com
 */
define([
], function (
) {
    'use strict';

    var GitPreferences = function () {
    };

    GitPreferences.PREFIX = 'git';
    GitPreferences.LINES_OF_CONTEXT = 'linesOfContext';
    /**
     * Get value of key in preference for git
     * @param {string} key
     */
    GitPreferences.getKey = function (key) {
        return GitPreferences.PREFIX + ':' + key;
    };
    /**
     * Set field of git for preference.
     * @param {Object} fieldCreator - field of git for preference.
     */
    GitPreferences.view = function (fieldCreator) {
        fieldCreator.addField(GitPreferences.getKey(GitPreferences.LINES_OF_CONTEXT), 'text', {
            title: 'Git',
            name: 'Lines of Context',
            'default': 10
        });
    };
    /**
     * Get default value of git.
     * @return {Object} - default value of git.
     */
    GitPreferences.getDefault = function () {
        return {
            'git:linesOfContext': 10
        };
    };
    /**
     * Get schema of git for preference.
     * @return {Array} - schema of git for preference.
     */
    GitPreferences.getSchema = function () {
        return [
            {
                key: 'git:linesOfContext',
                type: 'text',
                opt: {name: 'Lines of Context'}
            }
        ];
    };
    return GitPreferences;
});

