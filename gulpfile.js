var gulp = require('gulp');
var gutil = require('gulp-util');
var watch= require('gulp-watch');
var rename= require('gulp-rename');
var coffee= require('gulp-coffee');
var concat= require('gulp-concat');
var uglify= require('gulp-uglify');
var spawn = require('child_process').spawn;
var livereload = require('gulp-livereload');
var browserify = require('gulp-browserify');
var server=null;

try {
    var Blink1 = require('node-blink1');
    var blink1 = new Blink1();
} catch (e) {
    blink1={
        fadeToRGB:function(){
    }};
}


var config={uglify:false}

var paths = {
	coffee: ['coffee/moduleManager.coffee','coffee/index.coffee','coffee/xmlUtil.coffee','coffee/templaterState.coffee','coffee/docUtils.coffee','coffee/docxgen.coffee','coffee/pptxgen.coffee','coffee/xmlTemplater.coffee','coffee/docxTemplater.coffee','coffee/pptxTemplater.coffee','coffee/xmlMatcher.coffee','coffee/scopeManager.coffee','coffee/subContent.coffee','coffee/cli.coffee'],
	coffeeTest: ['coffee/docxgenTest.coffee'],
	testDirectory:__dirname+'/test/spec',
    js:'js/'
};


gulp.task('browserify', function() {
    browserified=gulp.src(__dirname+'/test/spec/docxgenTest.spec.js')
        .pipe(browserify({}))

    browserified
        .pipe(gulp.dest(__dirname+'/browser/'))

    // Single entry point to browserify
    browserified=gulp.src(__dirname+'/examples/main.js')
        .pipe(browserify({}))

    browserified
        .pipe(uglify())
        .pipe(rename('main.min.js'))
        .pipe(gulp.dest(__dirname+'/browser'))

    browserified
        .pipe(gulp.dest(__dirname+'/browser/'))
});

gulp.task('allCoffee', function () {
	gulp.src(paths.coffee)
        .pipe(coffee({bare:true}))
        .pipe(gulp.dest(paths.js))

	a=gulp.src(paths.coffeeTest)
		.pipe(coffee({map:true}))

	if(config.uglify)
		a=a.pipe(uglify())

	a=a.pipe(concat('docxgenTest.spec.js'))
		.pipe(gulp.dest('./test/spec'));
});

gulp.task('watch', function () {
	gulp.src(paths.coffee)
		.pipe(watch(function(files) {
			var f=files.pipe(coffee({bare:true}))
				.pipe(gulp.dest(paths.js))
			gulp.run('browserify');
			gulp.run('jasmine');
			gulp.run('livereload');
			return f;
		}));

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

gulp.task('livereload',function(cb) {
	if (server==null)
		server=livereload();
	server.changed('SpecRunner.html');
	cb()
})

gulp.task('jasmine',function(cb) {
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
		regex=/([0-9]+) tests?, ([0-9]+) assertions?, ([0-9]+) failures?, ([0-9]+) skipped/;
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

gulp.task('default',['coffeeTest','jasmine','watch','livereload']);
