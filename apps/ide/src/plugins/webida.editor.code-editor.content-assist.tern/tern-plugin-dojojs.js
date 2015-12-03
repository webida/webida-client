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

define(['external/tern/lib/infer',
        'external/tern/lib/tern',
        'acorn/dist/walk',
        'webida-lib/util/path'],
function (infer, tern, walk, path) {
    'use strict';

    tern.registerPlugin('dojojs', function () {
        return {
            passes: {
                'preInfer': preInfer
            }
        };
    });

    function preInfer(ast/*, scope*/) {
        walk.simple(ast, {
            VariableDeclaration: function (node) {
                if (node.declarations && node.declarations.length > 0) {
                    var firstNode = node.declarations[0];
                    if (firstNode.id && firstNode.id.name === 'dojoConfig') {
                        refreshDojoConfig(firstNode);
                    }
                }
            }
        });
    }

    function refreshDojoConfigBaseUrl(value) {
        var baseurl = value && value.value;

        if (baseurl && value.type === 'Literal') {
            var server = infer.cx().parent;
            var options = server && server.mod.requireJS.options;

            if (baseurl && baseurl[0] !== '/') {
                baseurl = path.getDirPath(infer.cx().curOrigin) + baseurl;
            }
            if (options.baseUrl !== baseurl) {
                options.baseUrl = baseurl;
                return true;
            }
        }

        return false;
    }

    function refreshDojoConfigPaths(value) {
        var paths = value && value.properties;
        var retval = false;

        if (paths) {
            var server = infer.cx().parent;
            var options = server && server.mod.requireJS.options;
            options.paths = options.paths || {};

            for (var pathIndex in paths) {
                if (paths.hasOwnProperty(pathIndex)) {
                    var pathProperty = paths[pathIndex];
                    var pathKey = pathProperty.key && pathProperty.key.value;
                    var pathValue = pathProperty.value && pathProperty.value.value;
                    if (pathKey && pathValue && pathProperty.value.type === 'Literal') {
                        if (options.paths[pathKey] !== pathValue) {
                            options.paths[pathKey] = pathValue;
                            retval = true;
                        }
                    }
                }
            }
        }

        return retval;
    }

    function refreshDojoConfigPackages(value) {
        var packages = value && value.elements;
        var retval = false;

        if (packages) {
            var server = infer.cx().parent;
            var options = server && server.mod.requireJS.options;
            options.paths = options.paths || {};

            for (var i = 0; i < packages.length; i++) {
                var packProperties = packages[i].properties;
                var packName = null;
                var packLocation = null;
                for (var j = 0; j < packProperties.length; j++) {
                    if (packProperties[j].key) {
                        if (packProperties[j].key.name === 'name') {
                            packName = packProperties[j].value;
                        } else if (packProperties[j].key.name === 'location') {
                            packLocation = packProperties[j].value;
                        }
                    }
                }
                if (packName && packLocation && packName.type === 'Literal' && packLocation.type === 'Literal') {
                    if (options.paths[packName.value] !== packLocation.value) {
                        options.paths[packName.value] = packLocation.value;
                        retval = true;
                    }
                }
            }
        }

        return retval;
    }

    function refreshDojoConfig(node) {
        if (!node.init || !node.init.properties) {
            return;
        }

        var flushNeeded = false;
        var properties = node.init && node.init.properties;

        if (properties) {
            for (var propIndex in properties) {
                if (properties.hasOwnProperty(propIndex)) {
                    var prop = properties[propIndex];
                    if (prop.key && prop.value) {
                        if (prop.key.name === 'baseUrl') {
                            flushNeeded = refreshDojoConfigBaseUrl(prop.value) || flushNeeded;
                        } else if (prop.key.name === 'paths') {
                            flushNeeded = refreshDojoConfigPaths(prop.value) || flushNeeded;
                        } else if (prop.key.name === 'packages') {
                            flushNeeded = refreshDojoConfigPackages(prop.value) || flushNeeded;
                        }
                    }
                }
            }
        }

        if (flushNeeded) {
            var server = infer.cx().parent;
            if (server._ccFilePath) {
                var file = server.findFile(server._ccFilePath);
                if (file) {
                    file.scope = null;
                }
            }
        }
    }

});
