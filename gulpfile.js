var gulp = require('gulp');
var gutil = require('gulp-util');
var watch= require('gulp-watch');
var plumber= require('gulp-plumber');
var coffee= require('gulp-coffee');
var concat= require('gulp-concat');
var uglify= require('gulp-uglify');
var spawn = require('child_process').spawn;
var livereload = require('gulp-livereload');
var server = livereload();

var paths = {
	coffee: ['coffee/xmlUtil.coffee','coffee/templaterState.coffee','coffee/imgManager.coffee','coffee/docxgen.coffee','coffee/docUtils.coffee','coffee/imgReplacer.coffee','coffee/docxQrCode.coffee','coffee/xmlTemplater.coffee','coffee/docxTemplater.coffee'], // compile individually into dest, maintaining folder structure
	coffeeTest: ['coffee/docxgenTest.coffee'], // compile individually into dest, maintaining folder structure
	testDirectory:__dirname+'\\test\\spec'
};

gulp.task('watch', function () {
	gulp.watch(paths.coffee,['coffee','jasmine','livereload']);
	gulp.watch(paths.coffeeTest,['coffeeTest']);
});

gulp.task('coffeeTest', function() {
	// Minify and copy all JavaScript (except vendor scripts)
	return gulp.src(paths.coffeeTest)
		.pipe(coffee())
		.pipe(uglify())
		.pipe(concat('docxgenTest.spec.js'))
		.pipe(gulp.dest('./test/spec'));
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

gulp.task('livereload',['coffee'],function(cb)
		{
			server.changed('SpecRunner.html');
			cb()
		})

gulp.task('jasmine', ['coffee'], function(cb) {
	time=new Date();
	var child = spawn("cmd", ["/c","jasmine-node","docxgenTest.spec.js"], {cwd:paths.testDirectory});
	stdout = '',
	stderr = '';
	totalData=""
	child.stdout.setEncoding('utf8');
	child.stdout.on('data', function (data) {
		totalData+=data;
	});

	child.on('error',function(err){
		console.log('error executing jasmine',err);
	});

	child.stderr.setEncoding('utf8');

	child.on('close', function(code) {
		regex=/([0-9]+) tests, ([0-9]+) assertions, ([0-9]+) failures, ([0-9]+) skipped/;
		if(regex.test(totalData))
		{
			matches=regex.exec(totalData);
			fullText=matches[0]
			tests=parseInt(matches[1]);
			assertions=parseInt(matches[2]);
			failures=parseInt(matches[3]);
			skipped=parseInt(matches[4]);

			if (failures==0)
			{
				try
				{
				var subChild = spawn("cmd", ["/c","cmdmp3.exe","success.mp3"], {cwd:process.cwd()});
				}
				catch (exception)
				{
					console.log("couldn't play success sound")
				}
				gutil.log(gutil.colors.green(fullText));
			}
			else
			{
				gutil.log(gutil.colors.red(fullText));
				gutil.beep()
			}
		}
		else
			{
				gutil.log(gutil.colors.red(totalData))
				gutil.beep()
			}
		cb();
	});
});

gulp.task('default',['coffeeTest','coffee','jasmine','watch','livereload']);
