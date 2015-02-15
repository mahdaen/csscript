/**
 * Untu SMVC.
 * Grunt Definitions.
 * Language: Javascript.
 * Created by mahdaen on 12/8/14.
 * License: GNU General Public License v2 or later.
 */

/* Gunt Module */
module.exports = function(grunt) {
    var source = 'source/';
	var libs = 'libraries/';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            distDL: {
                options: {
                    mangle: true,
                    sourceMap: true,
                    sourceMapName: 'dist/csscript.domlist.min.map'
                },
                files: {
                    'dist/csscript.domlist.min.js': 'source/csscript.domlist.js'
                }
            },
            cleanDL: {
                options: {
                    mangle: false,
                    beautify: true
                },
                files: {
                    'dist/csscript.domlist.js': 'source/csscript.domlist.js'
                }
            },
            distJQ: {
                options: {
                    mangle: true,
                    sourceMap: true,
                    sourceMapName: 'dist/csscript.jquery.min.map'
                },
                files: {
                    'dist/csscript.jquery.min.js': 'source/csscript.jquery.js'
                }
            },
            cleanJQ: {
                options: {
                    mangle: false,
                    beautify: true
                },
                files: {
                    'dist/csscript.jquery.js': 'source/csscript.jquery.js'
                }
            },
        },

        watch: {
            options: {
                livereload: 4334
            },
            core: {
                files: [source + '**/*.js'],
                tasks: ['uglify']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['uglify', 'watch']);
}
