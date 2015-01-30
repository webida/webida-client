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
    'webida',
    'q'
], function (webida, Q) {
    'use strict';
    var FS = function () {};

    function convertToError(e) {
        if (!e) {
            e = '{ reason: "Unknown error!" }';
        }

        return new Error(e);
    }

    $.extend(FS.prototype, {
        init: function () {
            var _this = this;
            var fs = webida.fs;
            var defer = Q.defer();

            if (_this.fs) {
                defer.resolve();
            } else {
                fs.getMyFSInfos(function (e, fsInfos) {
                    if (e || fsInfos.length === 0) {
                        fs.addMyFS(function (err, fsinfo) {
                            if (err || !fsinfo) {
                                defer.reject(convertToError(e));

                            } else {
                                _this.fs = fs.mountByFSID(fsinfo.fsid);
                                defer.resolve();
                            }
                        });

                    } else {
                        _this.fs = fs.mountByFSID(fsInfos[0].fsid);
                        defer.resolve();
                    }
                });
            }

            return defer.promise;
        },

        _wrapFunction: function (func) {
            var _this = this;
            var defer = Q.defer();
            var args = Array.prototype.slice.call(arguments, 1);
            args.unshift(defer);

            _this.init().then(function () {
                func.apply(_this, args);
            });

            return defer.promise;
        },

        getFSId: function () {
            return this._wrapFunction(function (defer) {
                defer.resolve(this.fs.fsid);
            });
        },

        readFile: function (filePath) {
            return this._wrapFunction(function (defer, filePath) {
                this.fs.readFile(filePath, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, filePath);
        },

        list: function (filePath, isRecursive) {
            return this._wrapFunction(function (defer, filePath, isRecursive) {
                this.fs.list(filePath, isRecursive, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, filePath, isRecursive);
        },

        addAlias: function (projPath, expire) {
            return this._wrapFunction(function (defer, projPath, expire) {
                this.fs.addAlias(projPath, expire, function (e, info) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(info);
                    }
                });
            }, projPath, expire);
        },

        createDirectory: function (path, isRecursive) {
            return this._wrapFunction(function (defer, path, isRecursive) {
                this.fs.createDirectory(path, isRecursive, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, isRecursive);
        },

        writeFile: function (path, data) {
            return this._wrapFunction(function (defer, path, data) {
                this.fs.writeFile(path, data, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, data);
        },

        stat: function (pathList) {
            return this._wrapFunction(function (defer, pathList) {
                this.fs.stat(pathList, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, pathList);
        },

        exists: function (path) {
            return this._wrapFunction(function (defer, path) {
                this.fs.exists(path, function (e, flag) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        if (flag) {
                            defer.resolve();
                        } else {
                            defer.reject();
                        }
                    }
                });
            }, path);
        },

        getQuotaLimit: function () {
            return this._wrapFunction(function (defer) {
                this.fs.getQuotaLimit(function (e, limit) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(limit);
                    }
                });
            });
        },

        getQuotaUsage: function () {
            return this._wrapFunction(function (defer) {
                this.fs.getQuotaUsage(function (e, usage) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(usage);
                    }
                });
            });
        },

        exec: function (path, opts) {
            return this._wrapFunction(function (defer, path, opts) {
                this.fs.exec(path, opts, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, path, opts);
        },

        delete: function (path, isRecursive) {
            return this._wrapFunction(function (defer, path, isRecursive) {
                this.fs.delete(path, isRecursive, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, isRecursive);
        }
    });

    if (FS.instance === undefined) {
        FS.instance = new FS();
    }

    return FS.instance;
});
