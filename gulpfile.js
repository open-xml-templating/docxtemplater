var gulp = require('gulp');
var gutil = require('gulp-util');
var watch= require('gulp-watch');
var plumber= require('gulp-plumber');
var coffee= require('gulp-coffee');
var concat= require('gulp-concat');
var uglify= require('gulp-uglify');
var spawn = require('child_process').spawn;

var paths = {
  coffee: ['coffee/templaterState.coffee','coffee/docxgen.coffee','coffee/docUtils.coffee','coffee/imgReplacer.coffee','coffee/docxQrCode.coffee','coffee/xmlTemplater.coffee','coffee/docxTemplater.coffee'], // compile individually into dest, maintaining folder structure
  coffeeTest: ['coffee/docxgenTest.coffee'], // compile individually into dest, maintaining folder structure
};

gulp.task('watch', function () {
	gulp.watch(paths.coffee,['coffee','jasmine']);
	gulp.watch(paths.coffeeTest,['coffeeTest']);
});

gulp.task('coffee', function(cb) {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.coffee)
    .pipe(coffee())
    .pipe(uglify())
    .pipe(concat('docxgen.js'))
    .pipe(gulp.dest('./js/'));
	cb(err)
});

gulp.task('jasmine', ['coffee'], function() {
 testDirectory=__dirname+'\\test\\spec';
	var child = spawn("cmd", ["/c","jasmine-node","docxgenTest.spec.js"], {cwd:testDirectory});
            stdout = '',
            stderr = '';

        child.stdout.setEncoding('utf8');

        child.stdout.on('data', function (data) {
        	regex=/([0-9]+) tests, ([0-9]+) assertions, ([0-9]+) failures, ([0-9]+) skipped/;
            if(regex.test(data))
        	{
        		matches=regex.exec(data);
        		tests=parseInt(matches[1]);
        		assertions=parseInt(matches[2]);
        		failures=parseInt(matches[3]);
        		skipped=parseInt(matches[4]);

				if (failures==0)
					{
            		gutil.log(gutil.colors.green(data));
            		}
            	else
        			{
            		gutil.log(gutil.colors.red(data));
            		gutil.beep()
            		}
        	}
        });

        child.on('error',function(err){
        	console.log('error executing jasmine',err);
        });

        child.stderr.setEncoding('utf8');
        child.stderr.on('data', function (data) {
            stderr += data;
            gutil.log(gutil.colors.red(data));
        });

        child.on('close', function(code) {
            gutil.log("Done with exit code", code);
            gutil.log("You access complete stdout and stderr from here"); // stdout, stderr
        });



});

gulp.task('coffeeTest', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.coffeeTest)
    .pipe(coffee())
    .pipe(uglify())
    .pipe(concat('docxgenTest.spec.js'))
    .pipe(gulp.dest('./test/spec'));
});



gulp.task('default',['coffeeTest','coffee','jasmine','watch']);
