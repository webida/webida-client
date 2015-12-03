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
module.exports = function (grunt) {
    grunt.initConfig({
        // for jshint check based on .jshintrc
        // package.json doesn't have jshint-stylish and grunt-contrib-jshint plugins.
        // Therefore, users of jshint must install these plugins by using npm install ...
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            files: {
                expand: true,
                cwd: './',
                src: [
                    'apps/dashboard/**/*.js',  // dashboard
                    'apps/deploy/**/*.js',  //deploy
                    'apps/desktop/**/*.js', // desktop
                    'apps/ide/**/*.js',     // ide
                    'apps/site/**/*.js',   //site
                    'common/**/*.js',     // common
                    '!**/lib/**', '!**/custom-lib/**', '!**/Gruntfile.js',  // ignore lib and Gruntfile
                    '!**/*.min.js', '!**/*.back.js',    // ignore min/back.js files
                    '!**/ProjectWizard-templates/**',
                    '!apps/ide/obsolete-src/**',
                    '!apps/ide/r.js'
                ]
            }
        },
        bower: {
            install: {
                // just run grunt bower install
            },
            options: {
                copy: false
            }
        },
        copy: {
            all: {
                files: [
                    {
                        expand: true,
                        cwd: './',
                        src: ['**'],
                        dest: 'deploy/'
                    }
                ]
            },
            uncompressed: {
                files: [
                    {
                        expand: true,
                        cwd: './',
                        src: ['**/*.js', '**/lib/**', '!node_modules/**', '!deploy/**'],
                        dest: 'deploy/',
                        rename: function (dest, src) {
                            return dest + src.substring(0, src.lastIndexOf('.js')) + '.uncompressed.js';
                        }
                    }
                ]
            }
        },
        uglify: {
            debug: {
                options: {
                    mangle: true,
                    compress: true,
                    preserveComments: false,
                    sourceMap: function (path) {
                        return path + '.map';
                    },
                    sourceMappingURL: function (path) {
                        return path.substring(path.lastIndexOf('/') + 1) + '.map';
                    }
                },
                files: [
                    {
                        expand: true,
                        cwd: 'deploy/',
                        src: ['**/*.js', '!node_modules/*.js', '!node_modules/**/*.js', '!bower_components/**/*.js',
                                '!**/lib/**/*.js', '!&&/lib/*.js', '!*.uncompressed.js', '!**/*.uncompressed.js',
                                '!**/Gruntfile.js', '!apps/deploy/**/*.js', '!**/obsolete*/**/*.js',
                                '!apps/ide/ProjectWizard-templates/**/*.js', '!**/spec/**/*.js', '!**/nls/**/resource.js'],
                        dest: 'deploy/'
                    }
                ]
            },
            release: {
                options: {
                    mangle: true,
                    compress: true,
                    preserveCommnets: false
                },
                files: [
                    {
                        expand: true,
                        cwd: 'deploy/',
                        src: ['**/*.js', '!node_modules/*.js', '!node_modules/**/*.js', '!bower_components/**/*.js',
                                '!node_modules/*.js', '!**/lib/**/*.js', '!**/lib/*.js', '!**/Gruntfile.js',
                                '!apps/deploy/**/*.js', '!**/obsolete*/**/*.js',
                                '!apps/ide/ProjectWizard-templates/**/*.js', '!**/spec/**/*.js',
                                '!**/nls/**/resource.js'],
                        dest: 'deploy/'
                    }
                ]
            }
        },
        clean: {
            all: ['deploy', '<%= themeConf.targetDir %>'],
            unnecessary: ['deploy/Gruntfile.js', 'deploy/node_modules'],
            style: ['apps/ide/src/styles/dist']
        },
        fixSourceMaps: {
            files: {
                expand: true,
                cwd: 'deploy/',
                src: ['*.map', '**/*.map'],
                dest: 'deploy'
            }
        },
        themeConf: {
            rootPath: 'apps/ide/src/styles/theme',
            targetDir: 'apps/ide/src/styles/dist',
            dirPattern: ['theme-*', '!theme-set'],
            getThemeName: function (dirName) {
                var result = dirName.match(/^theme-(.+)$/);
                return result ? result[1] : null;
            },
            lessTemplate: {
                options: {
                    modifyVars: {theme: '<%= themeConf.themeName %>'},
                    compress: true
                },
                files: [{
                    src: '<%= themeConf.rootPath %>/theme-set/theme.less',
                    dest: '<%= themeConf.targetDir %>/<%= themeConf.themeName %>/css/theme.css'
                }]
            },
            copyTemplate: {
                files: [{
                    expand: true,
                    cwd: '<%= themeConf.rootPath %>/<%= themeConf.themeDir %>',
                    src: ['images/**', 'plugins/**', '!**/*.less'],
                    dest: '<%= themeConf.targetDir %>/<%= themeConf.themeName %>/'
                }]
            }
        },
        watch: {
            lessFiles: {
                files: ['**/*.less'],
                tasks: ['themeBuild:less'],
                options: {
                    cwd: 'apps/ide/src/styles/theme'
                }
            },
            themeResources: {
                files: ['theme-*/images/*', 'theme-*/plugins/*', '!theme-*/**/*.less'],
                tasks: ['themeBuild:resource'],
                options: {
                    cwd: 'apps/ide/src/styles/theme'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerMultiTask('fixSourceMaps', 'Fixes uglified source maps', function () {
        this.files.forEach(function (f) {
            var src = f.src.filter(function (filepath) {
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            });
            var json = grunt.file.readJSON(src);
            var length = json.sources.length;
            var i;
            for (i = 0; i < length; i++) {
                json.sources[i] = json.sources[i].substring(json.sources[i].lastIndexOf('/') + 1);
                json.sources[i] = json.sources[i].substring(0, json.sources[i].lastIndexOf('.js')) + '.uncompressed.js';
            }
            json.file = json.file.substring(json.file.lastIndexOf('/') + 1);
            grunt.file.write(f.dest, JSON.stringify(json));
            grunt.log.writeln('Source map in ' + src + ' fixed');
        });
    });

    grunt.registerTask('theme', 'Generate tasks and run for themes', function (scope) {
        grunt.config.requires('themeConf');

        var scopes = scope ? [scope] : ['less', 'resource']; // 'less', 'resource'

        var themeDirs = grunt.file.expand({
            filter: 'isDirectory',
            cwd: grunt.config('themeConf.rootPath')
        }, grunt.config('themeConf.dirPattern'));

        var addedTasks = [];
        themeDirs.forEach(function (themeDir) {
            var themeName = grunt.config('themeConf.getThemeName')(themeDir);
            grunt.config.set('themeConf.themeName', themeName);
            grunt.config.set('themeConf.themeDir', themeDir);
            if (scopes.indexOf('less') > -1) {
                grunt.config('less.' + themeName, grunt.config.get('themeConf.lessTemplate'));
                addedTasks.push('less:' + themeName);
            }
            if (scopes.indexOf('resource') > -1) {
                grunt.config('copy.' + themeDir, grunt.config.get('themeConf.copyTemplate'));
                addedTasks.push('copy:' + themeDir);
            }
        });

        grunt.task.run(addedTasks);
    });

    grunt.registerTask('default', ['clean:all', 'bower', 'theme', 'copy:all'/*, 'copy:uncompressed',
     'clean:unnecessary', 'uglify:debug', 'fix_source_maps'*/]);
    grunt.registerTask('release', ['clean:all', 'bower', 'theme', 'copy:all', 'clean:unnecessary',
        'uglify:release']);
    grunt.registerTask('convention', ['jshint']);
};
