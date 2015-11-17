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
 * @since: 2015.10.21
 * @author: Se-won Kim
 */

/* jshint unused:false */

define([
    'external/calcium/dist/calcium',
    'webida-lib/util/logger/logger-client',
    '../webida.editor.code-editor/content-assist/file-server'
], function (
    calcium,
    Logger,
    fileServer
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    logger.info('CREATING SERVER');

    return {
        startServer: function (server) {
            logger.info('START');
        },
        stopServer: function (server) {
            logger.info('STOP');
        },
        addFile: function (server, path, text) {
            logger.info('ADDFILE');
        },
        delFile: function (server, path) {
            logger.info('DELFILE');
        },
        getFile: function (server, cb) {
            logger.info('GETFILE');
        },
        request: function (server, body, callback) {
            logger.info('REQUEST');

            var result = calcium.analyze(body.code, true);
            switch (body.type) {
                case 'variableOccurrences':
                    var refs = calcium.findVarRefsAt(result.AST, body.pos);
                    callback(undefined, refs);
                    break;
                case 'returnOccurrences':
                    var rets = calcium.findEscapingStatements(result.AST, body.pos);
                    callback(undefined, rets);
                    break;
                case 'thisOccurrences':
                    var thisExprs = calcium.findThisExpressions(result.AST, body.pos, true);
                    callback(undefined, thisExprs);
                    break;
                case 'showType':
                    var typeData = calcium.getTypeData(result.AST, result.Ĉ, body.start, body.end);
                    callback(undefined, typeData);
                    break;
                case 'structuredFnTypes':
                    var fns = calcium.getFnTypeStructuresAt(result.AST, result.Ĉ, body.pos);
                    callback(undefined, fns);
                    break;
                case 'definitionSites':
                    var sites = calcium.getDefinitionSitesAt(result.AST, result.Ĉ, body.start, body.end);
                    callback(undefined, sites);
                    break;
                case 'completions':
                    var completions = calcium.getCompletionAtPos(result, body.pos);
                    callback(undefined, completions);
                    break;
                default:
                    throw new Error('Unknown request type');
            }
        }
    };
});
