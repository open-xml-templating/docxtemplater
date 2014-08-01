var gulp = require('gulp');
var gutil = require('gulp-util');
var watch= require('gulp-watch');
var coffee= require('gulp-coffee');
var concat= require('gulp-concat');
var uglify= require('gulp-uglify');
var spawn = require('child_process').spawn;
var livereload = require('gulp-livereload');
var server=null;

try {
    var Blink1 = require('node-blink1');
    var blink1 = new Blink1('20002C4A');
} catch (e) {
    blink1={
        fadeToRGB:function(){
    }};
}


var config={uglify:false}

var paths = {
<<<<<<< HEAD
	coffee: ['coffee/xmlUtil.coffee','coffee/templaterState.coffee','coffee/docUtils.coffee','coffee/fileManager.coffee','coffee/docxgen.coffee','coffee/chartReplacer.coffee','coffee/imgReplacer.coffee','coffee/docxQrCode.coffee','coffee/xmlTemplater.coffee','coffee/docxTemplater.coffee','coffee/xmlMatcher.coffee','coffee/scopeManager.coffee','coffee/subContent.coffee'],
=======
	coffee: ['coffee/xmlUtil.coffee','coffee/templaterState.coffee','coffee/docUtils.coffee','coffee/imgManager.coffee','coffee/chartManager.coffee','coffee/docxgen.coffee','coffee/imgReplacer.coffee','coffee/docxQrCode.coffee','coffee/xmlTemplater.coffee','coffee/docxTemplater.coffee','coffee/xmlMatcher.coffee','coffee/scopeManager.coffee','coffee/subContent.coffee'],
>>>>>>> ff257a3e2f833b0d10972af753682f6c89437319
	coffeeTest: ['coffee/docxgenTest.coffee'],
	testDirectory:__dirname+'/test/spec'
};

gulp.task('watch', function () {
	gulp.watch(paths.coffee,['coffee','jasmine','livereload']);
	gulp.watch(paths.coffeeTest,['coffeeTest']);
});

gulp.task('coffeeTest', function() {
	a=gulp.src(paths.coffeeTest)
		.pipe(coffee({map:true}))

	if(config.uglify)
		a=a.pipe(uglify())

	a=a.pipe(concat('docxgenTest.spec.js'))
		.pipe(gulp.dest('./test/spec'));

	gulp.run('livereload');
	gulp.run('jasmine');
	return a;
});

gulp.task('coffee', function(cb) {
    blink1.fadeToRGB(40, 120, 120, 0); // r, g, b: 0 - 255
	a= gulp.src(paths.coffee)
		.pipe(coffee({map:true}))

	fileName='docxgen.js'
	if (config.uglify)
		{
			fileName='docxgen.min.js'
			a=a.pipe(uglify())
		}

	a=a
		.pipe(concat(fileName))
		.pipe(gulp.dest('./js/'));

	return a;
	cb(err)
});


gulp.task('allCoffee', function(cb) {
	a= gulp.src(paths.coffee)
		.pipe(coffee({map:true}))
		.pipe(uglify())
		.pipe(concat('docxgen.min.js'))
		.pipe(gulp.dest('./js/'));

	b= gulp.src(paths.coffee)
		.pipe(coffee({map:true}))
		.pipe(concat('docxgen.js'))
		.pipe(gulp.dest('./js/'));

	a=gulp.src(paths.coffeeTest)
		.pipe(coffee({map:true}))

	if(config.uglify)
		a=a.pipe(uglify())

	a=a.pipe(concat('docxgenTest.spec.js'))
		.pipe(gulp.dest('./test/spec'));

	return a
});

gulp.task('livereload',['coffee'],function(cb) {
	if (server==null)
		server=livereload();
	server.changed('SpecRunner.html');
	cb()
})

gulp.task('jasmine', ['coffee'], function(cb) {
	time=new Date();
	var child = spawn( "jasmine-node",["docxgenTest.spec.js"], {cwd:paths.testDirectory});
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
		var now=new Date();
		var nowTime="---"+now.getHours()+":"+now.getMinutes()
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
				gutil.log(gutil.colors.green(fullText+nowTime));
                blink1.fadeToRGB(40, 0, 120, 0); // r, g, b: 0 - 255
			}
			else
			{
                blink1.fadeToRGB(40, 120, 0, 0); // r, g, b: 0 - 255
				gutil.log(gutil.colors.red(fullText+nowTime));
			}
		}
		else
			{
				gutil.log(gutil.colors.red(totalData+nowTime))
                blink1.fadeToRGB(40, 120, 0, 0); // r, g, b: 0 - 255
			}
		cb();
	});
});

gulp.task('default',['coffeeTest','coffee','jasmine','watch','livereload']);
