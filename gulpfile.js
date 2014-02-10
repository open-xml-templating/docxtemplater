var gulp = require('gulp');
var gutil = require('gulp-util');
var watch= require('gulp-watch');
var plumber= require('gulp-plumber');
var coffee= require('gulp-coffee');
var concat= require('gulp-concat');
var uglify= require('gulp-uglify');

var paths = {
  coffee: ['coffee/docxgen.coffee','coffee/docUtils.coffee','coffee/imgReplacer.coffee','coffee/docxQrCode.coffee','coffee/xmlTemplater.coffee','coffee/docxTemplater.coffee'], // compile individually into dest, maintaining folder structure
  coffeeTest: ['coffee/docxgenTest.coffee'], // compile individually into dest, maintaining folder structure
};

gulp.task('watch', function () {
	gulp.watch(paths.coffee,['coffee']);
	gulp.watch(paths.coffeeTest,['coffeeTest']);
});

gulp.task('coffee', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.coffee)
    .pipe(coffee())
    .pipe(uglify())
    .pipe(concat('docxgen.js'))
    .pipe(gulp.dest('./js/'));
});

gulp.task('coffeeTest', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.coffeeTest)
    .pipe(coffee())
    .pipe(uglify())
    .pipe(concat('docxgenTest.spec.js'))
    .pipe(gulp.dest('./test/spec'));
});



gulp.task('default',['coffeeTest','coffee','watch']);
