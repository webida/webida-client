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
    grunt.initConfig({
        // for jshint check based on .jshintrc
        // package.json doesn't have jshint-stylish and grunt-contrib-jshint plugins.
        // Therefore, users of jshint must install these plugins by using npm install ...
        jshint : {
            options: {
                jshintrc: ".jshintrc",
                reporter: require('jshint-stylish'),
                ignores: ['**/**/*.min.js','**/*.min.js', 'Gruntfile.js']
            },
            files: {
                src: ['**/*.js', '**/**/.js','!**/lib/**/*.js', '!**/lib/*.js','!node_modules/**']
            }
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**'],
                        dest: 'deploy/'
                    }
                ]
            },
            src: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['*.js', '**/*.js'],
                        dest: 'deploy/',
                        rename : function (dest, src) {
                            return dest + src.substring(0, src.indexOf('.js')) + '.uncompressed.js';
                        }
                    }
                ]
            },
            dojo: {
                files: [
                    {
                        expand: true,
                        cwd: 'dojo-built/',
                        src: ['**'],
                        dest: 'deploy/lib/dojo-release-1.9.1/'
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
                    sourceMap: true
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.js', '!lib/**/*.js', '!lib/*.js'],
                        dest: 'deploy/'
                    }
                ]
            },
            release: {
                options: {
                    mangle: true,
                    compress: true,
                    preserveComments: false
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.js', '!lib/**/*.js', '!lib/*.js'],
                        dest: 'deploy/'
                    }
                ]
            },
            codemirror: {
                options: {
                    mangle: true,
                    compress: true,
                    preserveCommnets: false,
                    sourceMap: true
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['lib/codemirror/**/*.js', 'lib/codemirror/*.js', '!lib/codemirror/demo/**', '!lib/codemirror/test/**', '!lib/codemirror/doc/**'],
                        dest: 'deploy/'
                    }
                ]
            },
            dgrid: {
                options: {
                    mangle: true,
                    compress: true,
                    preserveCommnets: false
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['lib/dgrid/**/*.js', 'lib/dgrid/*.js', '!lib/dgrid/test/**', '!lib/dgrid/demos/**'],
                        dest: 'deploy/'
                    }
                ]
            }
        },
        cssmin: {
            combine: {
                files: {
                    'deploy/styles/webida.css': [
                        'src/styles/webida-base.css',
                        'src/styles/dijit.css',
                        'src/styles/claro.css',
                        'src/styles/claro_webida.css',
                        'src/styles/dojo.css',
                        'src/styles/claroGrid.css',
                        'src/styles/EnhancedGrid.css',
                        'src/styles/EnhancedGrid_rtl.css',
                        'src/styles/CheckedMultiSelect.css',
                        'src/styles/ExpandoPane.css',
                        'src/styles/FloatingPane.css',
                        'src/styles/ResizeHandle.css',
                        'src/styles/ToggleSplitter.css',
                        'src/styles/toastr.min.css',
                        'src/lib/tour/tour.css',
                        'src/lib/test/bootstrap/bootstrap.custom.css',
                        'src/lib/test/ladda.min.css',
                        'src/styles/webida-project-wizard.css'
                    ]
                }
            },
            minify: {
                expand: true,
                cwd: 'deploy/',
                src: ['styles/webida.css'],
                dest: 'deploy/'
            }
        },
        clean: {
            all: ['deploy', 'dojo-built'],
            src : ['deploy/styles/*.css', '!deploy/styles/webida.css'],
            dojo : ['deploy/lib/dojo-release-1.9.1'],
            unnecessary : ['deploy/lib/codemirror/demo', 'deploy/lib/codemirror/doc', 'deploy/lib/codemirror/test', 'deploy/lib/dgrid/test', 'deploy/lib/dgrid/demos']
        },
        fix_source_maps: {
            files: {
                expand: true,
                cwd: 'deploy/',
                src: ['**/*.map'],
                dest: 'deploy/'
            }
        },
        exec: {
            build: {
                command: 'cd dojo-release-1.9.1-src/util/buildscripts && ./build.sh --profile ../../../dojo.profile.js && cd ../../../',
                stdout: true
            },
            getdojo: {
                command: 'scripts/getdojo.sh',
                stdout: true
            }
        },
        dom_munger: {
            index: {
                options: {
                    remove: '.source',
                    prepend: { selector: 'head', html: '<link rel="stylesheet" href="styles/webida.css" type="text/css"/><script src="./dojoConfigforDeploy.js"></script><script src="lib/dojo-release-1.9.1/dojo/dojo.js"></script><script src="lib/dojo-release-1.9.1/dijit/dijit.js"></script><script src="lib/dojo-release-1.9.1/dojox/dojox.js"></script>' }
                },
                src: 'src/index.html',
                dest: 'deploy/index.html'
            }
        },
        prettify: {
            options: {
                indent: 4,
                indent_char: ' ',
                condense: true
            },
            files: {
                src : 'deploy/index.html',
                dest : 'deploy/index.html'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-dom-munger');
    grunt.loadNpmTasks('grunt-prettify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerMultiTask('fix_source_maps', 'Fixes uglified source maps', function() {
        this.files.forEach(function(f) {
            var json, new_file_value, src;
            src = f.src.filter(function(filepath) {
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            });
            json = grunt.file.readJSON(src);
            var length = json.sources.length;
            for(var i = 0; i < length; i++) {
                json.sources[i] = json.sources[i].substring(json.sources[i].lastIndexOf('/') + 1);
                json.sources[i] = json.sources[i].substring(0, json.sources[i].lastIndexOf('.js')) + '.uncompressed.js';
            }
            json.file= json.file.substring(json.file.lastIndexOf('/') + 1);
            grunt.file.write(f.dest, JSON.stringify(json));
            grunt.log.writeln('Source map in ' + src + ' fixed');
        });
    });

    grunt.registerTask('default', ['clean:all',
                                   'exec:getdojo',
                                   'exec:build',
                                   'copy:main',
                                   'copy:src',
                                   'clean:unnecessary',
                                   'clean:dojo',
                                   'uglify:debug',
                                   'uglify:codemirror',
                                   'uglify:dgrid',
                                   'fix_source_maps',
                                   'cssmin',
                                   'dom_munger:index',
                                   'prettify',
                                   'clean:src',
                                   'copy:dojo'
                                  ]);
    grunt.registerTask('release', ['clean:all',
                                   'exec:build',
                                   'copy:main',
                                   'clean:unnecessary',
                                   'clean:dojo',
                                   'uglify:release',
                                   'uglify:codemirror',
                                   'uglify:dgrid',
                                   'cssmin',
                                   'dom_munger:index',
                                   'prettify',
                                   'clean:src',
                                   'copy:dojo'
                                  ]);
   grunt.registerTask('convention',['jshint']);

};

