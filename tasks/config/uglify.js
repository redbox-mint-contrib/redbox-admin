/**
 * Minify files with UglifyJS.
 *
 * ---------------------------------------------------------------
 *
 * Minifies client-side javascript `assets`.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-uglify
 *
 */
module.exports = function(grunt) {

	grunt.config.set('uglify', {
		dist: {
			src: ['.tmp/public/redbox-admin/concat/production.js'],
			dest: '.tmp/public/redbox-admin/min/production.min.js'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
};
