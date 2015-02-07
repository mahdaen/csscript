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
            dist: {
                options: {
                    mangle: true
                },
                files: {
                    'dist/csscript.min.js': 'source/csscript.js'
                }
            },
            clean: {
                options: {
                    mangle: false,
                    beautify: true
                },
                files: {
                    'dist/csscript.js': 'source/csscript.js'
                }
            }
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
