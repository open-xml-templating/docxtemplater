var gulp = require('gulp');
var gutil = require('gulp-util');
var watch= require('gulp-watch');
var plumber= require('gulp-plumber');
var coffee= require('gulp-coffee');
var concat= require('gulp-concat');
var uglify= require('gulp-uglify');

var paths = {
  coffee: ['coffee/docxgen.coffee','coffee/docUtils.coffee','coffee/imgReplacer.coffee','coffee/docxQrCode.coffee','coffee/xmlTemplater.coffee','coffee/docxTemplater.coffee'], // compile individually into dest, maintaining folder structure
};

gulp.task('default', function () {
    gulp.src(paths.coffee, { read: false })
        .pipe(watch(function(files)
        {
        }));
});

gulp.task('coffee', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.coffee)
    .pipe(coffee())
    .pipe(uglify())
    .pipe(concat('docxgen.js'))
    .pipe(gulp.dest('./js/'));
});
