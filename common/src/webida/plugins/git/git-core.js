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
    'webida-lib/app',
    'webida-lib/plugins/workspace/plugin',
    'external/lodash/lodash.min',
    'external/moment/min/moment.min',
    'webida-lib/util/arrays/SortedArray'
], function (ide, wv, _, moment, SortedArray) {
    'use strict';

    var FS = ide.getMount();
    var gitRepoPaths = new SortedArray();
    var mapToSubmodules = {};

    var git = {
        exec: function (gitRoot, args, callback) {
            var info = {
                cmd: 'git.sh',
                args: args
            };

            FS.exec(gitRoot, info, function (e, stdout, stderr) {
                if (e) {
                    callback(e, stdout, stderr);
                } else {
                    callback(null, stdout, stderr);
                }
            });
        },

        parseTag: function (rawData) {
            var tags = [];
            var lines = rawData.split(/\r*\n/).filter(function (line) {
                return line;
            });

            lines.forEach(function (line) {
                var m = line.match(/(.*) {4,10}(.*)/);
                if (m) {
                    tags.push({
                        id: m[1].trim(),
                        name: m[1].trim(),
                        message: m[2]
                    });
                }
            });

            return tags;
        },

        parseStash: function (rawData) {
            var lines = rawData.split(/\r*\n/).filter(function (line) {
                return line;
            });

            var logs = [];
            var log = null;

            lines.forEach(function (line) {
                var m = line.match(/^commit ([a-f0-9]*)/);
                if (m) {
                    if (log) {
                        log.message = log.message.trim();
                        logs.push(log);
                    }

                    log = {
                        id: m[1],
                        message: ''
                    };
                    return;
                }

                m = line.match(/^Reflog: refs\/(.*) \(.*\)/);
                if (m && log) {
                    log.reflog = m[1].trim();
                    return;
                }

                m = line.match(/^Reflog message: (.*)/);
                if (m && log) {
                    log.reflogMsg = m[1].trim();
                    return;
                }

                m = line.match(/^tree ([a-f0-9]*)/);
                if (m && log) {
                    log.tree = m[1].trim();
                    return;
                }

                m = line.match(/^parent ([a-f0-9]*)/);
                if (m && log) {
                    log.parents = log.parents || [];
                    log.parents.push(m[1].trim());
                    return;
                }

                m = line.match(/^author (.*) ([0-9]*) (-?[0-9]*)/);
                if (m && log) {
                    log.author = m[1].trim();
                    log.authorDate = new Date(m[2] * 1000);
                    return;
                }

                m = line.match(/^committer (.*) ([0-9]*) (-?[0-9]*)/);
                if (m && log) {
                    log.committer = m[1].trim();
                    log.committerDate = new Date(m[2] * 1000);
                    return;
                }

                m = line.match(/^([A-Z])\t(.*)/);
                if (m && log) {
                    log.files = log.files || [];
                    log.files.push({
                        action: m[1].trim(),
                        filename: m[2]
                    });
                    return;
                }

                if (log) {
                    log.message += '\n' + line;
                }
            });

            if (log) {
                log.message = log.message.trim();
                logs.push(log);
            }

            return logs;
        },

        parseStatus: function (rawData) {
            if (rawData === null) {
                rawData = '';
            }

            var rt = rawData
            .split(/\r*\n/)
            .map(function (line) {
                var m = line.match(/^(..) (.*)/);
                if (m) {
                    var action = m[1].trim();

                    return {
                        action: action,
                        staged: m[1][0] !== ' ' && m[1][0] !== '?' && m[1][1] === ' ',
                        filename: m[2]
                    };
                }
            });

            // remove false, null, 0, ''
            return _.compact(rt);
        },

        parseStatusZ: function (rawData) {
            if (rawData) {
                var ret = {};
                var lines = rawData.match(/([ MADRCU]{2}|\?\?|\!\!) ([^\0]+\0){1,2}?/g);
                if (lines) {
                    lines.forEach(function (line) {
                        var nullPos = line.indexOf('\0');
                        var code = line.substring(0, 2);
                        var path = line.substring(3, nullPos);
                        if (ret[path]) {
                            if (code !== '??') {
                                console.warn('unexpected second code ' + code + ' for ' + path +
                                             ' which had a code ' + ret[path]);
                            }
                        } else {
                            ret[path] = code;
                        }
                    });
                    return ret;
                }
            }

            return null;
        },

        parseBranch: function (rawData) {
            if (rawData === null) {
                rawData = '';
            }

            var rt = rawData
            .split(/\r*\n/)
            .map(function (line) {
                var current = false;

                if (line.indexOf('* ') === 0) {
                    current = true;
                    line = line.substr('* '.length);
                }
                line = line.trim();

                return {
                    name: line,
                    current: current
                };
            });

            // remove false, null, 0, ''
            return _.compact(rt);
        },

        parseLog: function (rawData) {
            var lines = rawData.split(/\r*\n/).filter(function (line) {
                return line;
            });

            // remove false, null, 0, ''
            lines = _.compact(lines);
            var logs = [];
            var log = null;
            var refInfo;

            lines.forEach(function (line) {
                var m = line.match(/^commit ([a-f0-9]*) ?(.*)/);
                if (m) {
                    if (log) {
                        if (refInfo) {
                            log.message += '\0' + refInfo;
                        }

                        log.message = log.message.trim();
                        logs.push(log);
                    }

                    if (m[2]) {
                        refInfo = m[2];
                    } else {
                        refInfo = null;
                    }

                    log = {
                        id: m[1],
                        message: ''
                    };
                    return;
                }

                m = line.match(/^tree ([a-f0-9]*)/);
                if (m && log) {
                    log.tree = m[1].trim();
                    return;
                }

                m = line.match(/^parent ([a-f0-9]*)/);
                if (m && log) {
                    log.parents = log.parents || [];
                    log.parents.push(m[1].trim());
                    return;
                }

                m = line.match(/^author (.*) ([0-9]*) (-?[0-9]*)/);
                if (m && log) {
                    log.author = m[1].trim();
                    log.authorDate = moment.unix(m[2]).format('YYYY/MM/DD h:mm:ss A');
                    return;
                }

                m = line.match(/^committer (.*) ([0-9]*) (-?[0-9]*)/);
                if (m && log) {
                    log.committer = m[1].trim();
                    log.committerDate = moment.unix(m[2]).format('YYYY/MM/DD h:mm:ss A');
                    return;
                }

                m = line.match(/^([A-Z])\t(.*)/);
                if (m && log) {
                    log.files = log.files || [];
                    log.files.push({
                        action: m[1].trim(),
                        filename: m[2]
                    });
                    return;
                }

                if (log) {
                    log.message += '\n' + line.substr(4); // remove prefix 4 spaces inserted by 'git log'
                }
            });

            if (log) {
                log.message = log.message.trim();
                logs.push(log);
            }

            return logs;
        },

        parseBlame: function (rawData) {
            var lines = rawData.split(/\r*\n/).filter(function (line) {
                return line;
            });

            var rt = [];
            var blame = null;

            lines.forEach(function (line) {
                var m =  line.match(/^[0-9a-f]* \d+ \d+/);
                if (m) {
                    if (blame) {
                        rt.push(blame);
                    }

                    blame = {
                        commit: line.substr(0, 8)
                    };

                    return;
                }

                m = line.match(/^author (.*)/);
                if (m) {
                    blame.author = m[1].trim();
                    return;
                }

                m = line.match(/^author-mail (.*)/);
                if (m) {
                    blame.authorMail = m[1].trim();
                    return;
                }

                m = line.match(/^author-time (.*)/);
                if (m) {
                    blame.authorTime = moment.unix(m[1]).format('YYYY-MM-DD');
                    return;
                }

                m = line.match(/^summary (.*)/);
                if (m) {
                    blame.summary = m[1].trim();
                    return;
                }
            });

            if (blame) {
                rt.push(blame);
            }

            return rt;
        },

        parseConfig: function (rawData) {
            var lines = rawData.split(/\r*\n/).filter(function (line) {
                return line;
            });

            var config = {};

            lines.forEach(function (line) {
                var m =  line.match(/^user.name=(.*)$/);
                if (m) {
                    config.name = m[1].trim();
                    return;
                }

                m = line.match(/^user.email=(.*)$/);
                if (m) {
                    config.email = m[1].trim();
                    return;
                }
            });

            return config;
        },

        parseRemote: function (rawData) {
            var lines = rawData.split(/\r*\n/).filter(function (line) {
                return line.match(/push/);
            });

            var remote  = [];

            lines.forEach(function (line) {
                var m = line.match(/^(.*)\t(.*) .*/);
                if (m) {
                    remote.push({
                        name: m[1],
                        location: m[2]
                    });
                }
            });

            return remote;
        },

        recordGitRepoPath: function (path, topRepoPath) {
            if (gitRepoPaths.indexOf(path) < 0) {
                gitRepoPaths.add(path);
                if (topRepoPath) {
                    // path is a submodule
                    var submodules = mapToSubmodules[topRepoPath];
                    if (!submodules) {
                        submodules = mapToSubmodules[topRepoPath] = new SortedArray();
                    }
                    submodules.add(path);
                }
            } else {
                console.log('note: already recorded git repository path :' + path);
            }
        },

        unrecordGitRepoPath: function (path) {
            var i = gitRepoPaths.indexOf(path);
            if (i >= 0) {
                gitRepoPaths.splice(i, 1);

                var submodules;
                var self = this;
                if ((submodules = mapToSubmodules[path])) {
                    submodules.forEach(function (submodule) {
                        self.unrecordGitRepoPath(submodule);
                    });
                    delete mapToSubmodules[path];
                }
            }
        },



        getSubmodules: function (repoPath) {
            return mapToSubmodules[repoPath];
        },

        // check whether selected node is '.git' direcotry or not
        isInDotGitDir: function (path) {
            var repoPath = this.findGitRootPath(path);
            if (repoPath) {
                return path.indexOf(repoPath + '.git/') === 0;
            } else {
                return false;
            }
        },

        // find the git's root directory path
        findGitRootPath: function (path) {
            var repoPaths = gitRepoPaths.filter(function (repoPath) {
                return path.indexOf(repoPath) === 0;
            });
            var len = repoPaths.length;
            if (len) {
                return repoPaths[len - 1];	// return the most nested one
            } else {
                return null;
            }
        },

        unrecordGitRepoPathsUnder: function (path) {
            var containedRepos = gitRepoPaths.filter(function (repoPath) {
                return repoPath.indexOf(path) === 0;
            });
            containedRepos.forEach(function (repo) {
                console.log('hina temp: a repo is to be unrecorded: ' + repo);
                var i = gitRepoPaths.indexOf(repo);
                gitRepoPaths.splice(i, 1);
                if (mapToSubmodules[repo]) {
                    delete mapToSubmodules[repo];
                }
            });
        },
    };

    return git;
});
