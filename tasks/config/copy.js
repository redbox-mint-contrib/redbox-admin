/**
 * Copy files and folders.
 *
 * ---------------------------------------------------------------
 *
 * # dev task config
 * Copies all directories and files, exept coffescript and less fiels, from the sails
 * assets folder into the .tmp/public directory.
 *
 * # build task config
 * Copies all directories nd files from the .tmp/public directory into a www directory.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-copy
 */
module.exports = function(grunt) {
     grunt.config.set('copy', {
         dev: {
             files: [{
                 expand: true,
                 cwd: './assets',
                 src: ['**/*.!(coffee|less)'],
                 dest: '.tmp/public/redbox-admin'
             },{ 
                 expand: true,
                 cwd: './bower_components',
                 src: [
                 // add js and other dependencies
                 'angular/angular.js', 'angular-route/angular-route.js','angular-mocks/angular-mocks.js', 'angular-loader/angular-loader.js','angular-resource/angular-resource.js','jquery/dist/jquery.js', 'ng-file-upload/angular-file*', 'ng-file-upload/FileAPI*','angular-bootstrap/ui-bootstrap-tpls.min.js',
                   'angular-sanitize/angular-sanitize.js', 'tv4/tv4.js','objectpath/lib/ObjectPath.js', 'angular-schema-form/dist/schema-form.min.js', 'angular-schema-form/dist/bootstrap-decorator.min.js',
                   'angular-modal-service/dst/angular-modal-service.min.js',
                   'bootstrap/dist/js/bootstrap.min.js',
                 ],
                 flatten: true,
                 dest: '.tmp/public/redbox-admin/js/dependencies'
             },{ // add css 
                 expand: true,
                 cwd: './bower_components',
                 src: [
                 'bootstrap/dist/css/bootstrap.css',
                 'bootstrap/dist/css/bootstrap-theme.css'
                 ],
                 flatten: true,
                 dest: '.tmp/public/redbox-admin/styles'
             },{ // add fonts 
                 expand: true,
                 cwd: './bower_components',
                 src: [
                 'bootstrap/fonts/*'
                 ],
                 flatten: true,
                 dest: '.tmp/public/redbox-admin/fonts'
             }]
         },
         build: {
             files: [{
                 expand: true,
                 cwd: '.tmp/public',
                 src: ['**/*'],
                 dest: 'www'
             }]
         }
     });

     grunt.loadNpmTasks('grunt-contrib-copy');
 };