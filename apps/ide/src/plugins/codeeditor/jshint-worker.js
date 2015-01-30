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

'use strict';
/* global importScripts: true */
/* global onmessage: true */
/* global postMessage: true */
/* global JSHINT: true */

importScripts('./lib/lints/jshint.js');

var bogus = [ 'Dangerous comment' ];

var warnings = [ [ 'Expected a {',
                  'Statement body should be inside braces.' ] ];

var errors = [ 'Missing semicolon', 'Extra comma', 'Missing property name',
              'Unmatched ', ' and instead saw', ' is not defined',
              'Unclosed string', 'Stopping, unable to continue' ];

function fixWith(error, fixes, severity, force) {
    var description, fix, find, replace, found;

    description = error.description;

    for (var i = 0; i < fixes.length; i++) {
        fix = fixes[i];
        find = (typeof fix === 'string' ? fix : fix[0]);
        replace = (typeof fix === 'string' ? null : fix[1]);
        found = description.indexOf(find) !== -1;

        if (force || found) {
            error.severity = severity;
        }
        if (found && replace) {
            error.description = replace;
        }
    }
}

function isBogus(error) {
    var description = error.description;
    for (var i = 0; i < bogus.length; i++) {
        if (description.indexOf(bogus[i]) !== -1) {
            return true;
        }
    }
    return false;
}

function cleanup(error) {
    // All problems are warnings by default
    fixWith(error, warnings, 'warning', true);
    fixWith(error, errors, 'error');

    return isBogus(error) ? null : error;
}

function parseErrors(errors, output) {
    errors.forEach(function (error) {
        if (error) {
            var linetabpositions, index;

            linetabpositions = [];

            // This next block is to fix a problem in jshint. Jshint
            // replaces
            // all tabs with spaces then performs some checks. The error
            // positions (character/space) are then reported incorrectly,
            // not taking the replacement step into account. Here we look
            // at the evidence line and try to adjust the character position
            // to the correct value.
            if (error.evidence) {
                // Tab positions are computed once per line and cached
                var tabpositions = linetabpositions[error.line];
                if (!tabpositions) {
                    var evidence = error.evidence;
                    tabpositions = [];
                    // ugggh phantomjs does not like this
                    // forEachChar(evidence, function (item, index) {
                    Array.prototype.forEach.call(evidence, function (item, index) {
                        if (item === '\t') {
                            // First col is 1 (not 0) to match error
                            // positions
                            tabpositions.push(index + 1);
                        }
                    });
                    linetabpositions[error.line] = tabpositions;
                }
                if (tabpositions.length > 0) {
                    var pos = error.character;
                    tabpositions.forEach(function (tabposition) {
                        if (pos > tabposition) {
                            pos -= 1;
                        }
                    });
                    error.character = pos;
                }
            }

            var start = error.character - 1, end = start + 1;
            if (error.evidence) {
                index = error.evidence.substring(start).search(/.\b/);
                if (index > -1) {
                    end += index;
                }
            }

            // Convert to format expected by validation service
            error.description = error.reason;// + '(jshint)';
            error.start = error.character;
            error.end = end;
            error = cleanup(error);

            if (error) {
                output.push({message: error.description,
                             severity: error.severity,
                             from: {line: error.line - 1, ch: start},
                             to: {line: error.line - 1, ch: end}});
            }
        }
    });
}

onmessage = function (event) {
    var data = event.data;
    var code = data.code;
    var options = data.options;
    var reqId = data.reqId;

    JSHINT(code, options);
    var errors = JSHINT.data().errors, result = [];
    if (errors) {
        parseErrors(errors, result);
    }
    postMessage({
        reqId: reqId,
        annotations: result
    });
};
