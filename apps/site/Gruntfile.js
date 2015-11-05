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

module.exports = function (grunt) {
    'use strict';
    
    grunt.initConfig({
        // for jshint check based on .jshintrc
        // package.json doesn't have jshint-stylish and grunt-contrib-jshint plugins.
        // Therefore, users of jshint must install these plugins by using npm install ...
        jshint : {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish'),
                ignores: ['**/**/*.min.js', '**/*.min.js', 'Gruntfile.js']
            },
            files: {
                src: ['**/*.js', '*.js', '!**/lib/**/*.js', '!**/lib/*.js', '!node_modules/**']
            }
        },
        copy: {
            all : {
                files: [
                    {
                        expand: true,
                        cwd: './',
                        src: ['**'],
                        dest: 'deploy/',
                    }
                ]
            },
            uncompressed: {
                files: [
                    {
                        expand: true,
                        cwd: './',
                        src: ['*.js', '**/*.js', '!src/lib/**', '!node_modules/**', '!deploy/**'],
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
                        src: ['*.js', '**/*.js', '!node_modules/*.js', '!node_modules/**/*.js', '!src/lib/**/*.js',
                              '!src/lib/*.js', '!*.uncompressed.js', '!**/*.uncompressed.js'],
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
                        src: ['*.js', '**/*.js', '!node_modules/**/*.js', '!node_modules/*.js',
                              '!src/lib/**/*.js', '!src/lib/*.js'],
                        dest: 'deploy/'
                    }
                ]
            }
        },
        clean: {
            all : ['deploy'],
            unnecessary: ['deploy/Gruntfile.js', 'deploy/node_modules']
        },
        fixSourceMaps: {
            files: {
                expand: true,
                cwd: 'deploy/',
                src: ['*.map', '**/*.map'],
                dest: 'deploy'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerMultiTask('fixSourceMaps', 'Fixes uglified source maps', function () {
        this.files.forEach(function (f) {
            var json, src;
            src = f.src.filter(function (filepath) {
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            });
            json = grunt.file.readJSON(src);
            var length = json.sources.length;
            for (var i = 0; i < length; i++) {
                json.sources[i] = json.sources[i].substring(json.sources[i].lastIndexOf('/') + 1);
                json.sources[i] = json.sources[i].substring(0, json.sources[i].lastIndexOf('.js')) + '.uncompressed.js';
            }
            json.file = json.file.substring(json.file.lastIndexOf('/') + 1);
            grunt.file.write(f.dest, JSON.stringify(json));
            grunt.log.writeln('Source map in ' + src + ' fixed');
        });
    });

    grunt.registerTask('default', ['clean:all', 'copy:all', 'copy:uncompressed', 
                                   'clean:unnecessary', 'uglify:debug', 'fix_source_maps']);
    grunt.registerTask('release', ['clean:all', 'copy:all', 'clean:unnecessary', 'uglify:release']);
    grunt.registerTask('convention', ['jshint']);
};

