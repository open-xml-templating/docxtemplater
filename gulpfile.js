var gulp = require('gulp');
var rename= require('gulp-rename');
var coffee= require('gulp-coffee');
var concat= require('gulp-concat');
var uglify= require('gulp-uglify');
var browserify = require('gulp-browserify');

var config={uglify:false}

var paths = {
	coffee: [
        'coffee/errors.coffee',
        'coffee/moduleManager.coffee',
        'coffee/index.coffee',
        'coffee/xmlUtil.coffee',
        'coffee/compiledTemplate.coffee',
        'coffee/compiledXmlTag.coffee',
        'coffee/templaterState.coffee',
        'coffee/docUtils.coffee',
        'coffee/docxgen.coffee',
        'coffee/pptxgen.coffee',
        'coffee/xmlTemplater.coffee',
        'coffee/docxTemplater.coffee',
        'coffee/pptxTemplater.coffee',
        'coffee/xmlMatcher.coffee',
        'coffee/scopeManager.coffee',
        'coffee/subContent.coffee',
        'coffee/cli.coffee'
    ],
	coffeeTest: ['coffee/docxgenTest.coffee'],
	testDirectory:__dirname+'/test/spec',
    js:'js/'
};


gulp.task('browserify', function() {
    browserified=gulp.src(__dirname+'/test/spec/docxgenTest.js')
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

gulp.task('default',['allCoffee']);
