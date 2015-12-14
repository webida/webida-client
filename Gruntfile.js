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
    var SOURCES = [
        'apps/ide/*.js', 'apps/ide/**/*.js',                    // ide
        'common/*.js', 'common/**/*.js',                        // common
        '!**/lib/**', '!**/custom-lib/**', '!**/Gruntfile.js',  // ignore lib and Gruntfile
        '!**/*.min.js', '!**/*.back.js',                        // ignore min/back.js files
        '!**/ProjectWizard-templates/**',                       // ignore project templates files
        '!**/obsolete*/**',                                     // ignore all obsolete files
        '!apps/ide/r.js'
    ];
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
                src: SOURCES
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
            // Copy all built files to the directory(deploy) for distribution.
            all: {
                files: [{
                    expand: true,
                    src: ['**', '!scripts/**', '!node_modules/**', '!deploy/**', '!Gruntfile.js'],
                    dest: 'deploy/'
                }]
            },
            // Rename original js files to *.uncompressed.js for source map of uglification phase
            uncompressed: {
                files: [{
                    expand: true,
                    src: SOURCES,
                    dest: 'deploy/',
                    rename: function (dest, src) {
                        return dest + src.substring(0, src.lastIndexOf('.js')) + '.uncompressed.js';
                    }
                }]
            }
        },
        rename: {
            // Move the result of dojo built to the proper location
            dojoBuilt: {
                files: {
                    'deploy/bower_components/dojo': 'deploy/dojo-built/dojo',
                    'deploy/bower_components/dijit': 'deploy/dojo-built/dijit',
                    'deploy/bower_components/dojox': 'deploy/dojo-built/dojox'
                }
            }
        },
        uglify: {
            // Make source maps for debugging, no code obfuscation(mangle), and compressing without comments
            // at the directory(deploy) for distribution
            debug: {
                options: {
                    mangle: false,
                    compress: true,
                    preserveComments: false,
                    sourceMap: true,
                    sourceMapIncludeSources: false
                },
                files: [
                    {
                        expand: true,
                        cwd: 'deploy/',
                        src: SOURCES,
                        dest: 'deploy/'
                    }
                ]
            },
            // Compress dropping all console.* usages without all comments, do the code obfuscation(mangle) and
            // make no source maps at the directory(deploy) for distribution
            release: {
                options: {
                    mangle: true,
                    compress: {
                        drop_console: true
                    },
                    preserveComments: false,
                    sourceMap: false
                },
                files: [
                    {
                        expand: true,
                        cwd: 'deploy/',
                        src: SOURCES,
                        dest: 'deploy/'
                    }
                ]
            }
        },
        clean: {
            // Clean all directories for pre-build and distribution
            all: ['deploy', '<%= themeConf.targetDir %>'],
            // Clean directory for pre-build style files
            style: ['<%= themeConf.targetDir %>'],
            // Clean distributed dojo sources for build
            dojoSource: [
                'deploy/bower_components/dojo',
                'deploy/bower_components/dijit',
                'deploy/bower_components/dojox'
            ]
        },
        // Configurations for fixing wrong sources property for all source map files built by Grunt
        fixSourceMaps: {
            files: {
                expand: true,
                cwd: 'deploy/',
                src: SOURCES.map(function (src) {
                    return (src.endsWith('.js')) ? src + '.map' : src;
                }),
                dest: 'deploy'
            }
        },
        // Configurations for theme build
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
        // Watching changes on less files and build them to the css files
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
        },
        // Dojo build including minimum modules for using
        dojo: {
            dist: { },
            options: {
                dojo: 'bower_components/dojo/dojo.js',  // Path to dojo.js file in dojo source
                profile: 'dojo.profile.js'              // Profile for build
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
    grunt.loadNpmTasks('grunt-dojo');
    grunt.loadNpmTasks('grunt-contrib-rename');

    grunt.registerMultiTask('fixSourceMaps', 'Fix sources property in the source map files(*.js.map) with the proper' +
            ' uncompressed javascript file', function () {
        this.files.forEach(function (file) {
            var sourceMapFiles = file.src.filter(function (filePath) {
                if (!grunt.file.exists(filePath)) {
                    grunt.log.warn('Source file "' + filePath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            });
            var sourceMapJson = grunt.file.readJSON(sourceMapFiles);
            sourceMapJson.sources = sourceMapJson.sources.map(function (source) {
                return source.substring(0, source.lastIndexOf('.js')) + '.uncompressed.js';
            });
            sourceMapJson.file = sourceMapJson.file.substring(sourceMapJson.file.lastIndexOf('/') + 1);
            grunt.file.write(file.dest, JSON.stringify(sourceMapJson));
            grunt.log.writeln('Source map in ' + sourceMapFiles + ' fixed');
        });
        grunt.task.run('copy:uncompressed');
    });

    grunt.registerTask('theme', 'Generate tasks for theme build and run them', function (scope) {
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

    grunt.registerTask('dev', [/* mandatory */'bower', /* optional */'theme']);
    grunt.registerTask('distDojo', ['dojo', 'clean:dojoSource', 'rename:dojoBuilt']);
    grunt.registerTask('default', ['clean:all', 'dev', 'copy:all', 'distDojo'/*, 'uglify:debug', 'fixSourceMaps'*/]);
    grunt.registerTask('release', ['clean:all', 'dev', 'copy:all', 'distDojo', 'uglify:release']);
    grunt.registerTask('convention', ['jshint']);
};
