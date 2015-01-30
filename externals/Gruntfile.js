module.exports = function (grunt) {
    grunt.initConfig({
        copy: {
            all : {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**'],
                        dest: 'deploy/',
                    }
                ]
            },
            uncompressed: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['*.js', '**/*.js', '!node_modules/**', '!deploy/**'],
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
                    sourceMap: function(path) {
                        return path + '.map';
                    },
                    sourceMappingURL: function(path) {
                        return path.substring(path.lastIndexOf('/') + 1) + '.map';
                    }
                },
                files: [
                    {
                        expand: true,
                        cwd: 'deploy/',
                        src: ['*.js', '**/*.js', '!node_modules/*.js', '!node_modules/**/*.js', '!*.uncompressed.js', '!**/*.uncompressed.js'],
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
                        src: ['*.js', '**/*.js', '!node_modules/**/*.js', '!node_modules/*.js'],
                        dest: 'deploy/'
                    }
                ]
            }
        },
        clean: {
            all : ['deploy'],
            unnecessary: ['deploy/Gruntfile.js', 'deploy/node_modules']
        },
        fix_source_maps: {
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

    grunt.registerTask('default', ['clean:all', 'copy:all', 'copy:uncompressed', 'clean:unnecessary', 'uglify:debug', 'fix_source_maps']);
    grunt.registerTask('release', ['clean:all', 'copy:all', 'clean:unnecessary', 'uglify:release']);
};

