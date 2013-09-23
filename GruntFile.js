/*global module:false*/
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks("grunt-contrib-watch");
  // Project configuration.
  grunt.initConfig({
    meta: {
      version: '0.1.0',
      banner: '/*! PROJECT_NAME - v<%= meta.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '* http://PROJECT_WEBSITE/\n' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
        'YOUR_NAME; Licensed MIT */'
    },
    

    coffee: {
      compile: {
                options: {
      sourceMap: true
    },
        files: {
         'js/docxgen.js': ['coffee/docxgen.coffee','coffee/docUtils.coffee','coffee/imgReplacer.coffee','coffee/docxQrCode.coffee','coffee/xmlTemplater.coffee','coffee/docxTemplater.coffee'] // compile individually into dest, maintaining folder structure
          }
        }
    },
   
      watch: {
        cof:{
         files: 'coffee/*.coffee',
         tasks: 'coffee'
        }
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min');

};
