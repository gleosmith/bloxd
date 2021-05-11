const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const clean = require('gulp-clean')
const tsProject = ts.createProject('tsconfig.json');
const modifyFile = require('gulp-modify-file');

function cleanDist() {
    return gulp.src('dist', { read: false, allowEmpty: true })
        .pipe(clean())
}

function buildTsWithMaps() {

    const tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())

    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
}

function buildTsDeclarations() {

    const tsResult = tsProject.src()
        .pipe(tsProject())

    return tsResult.dts
        .pipe(gulp.dest('dist'));
}


function packageDotJson() {
    return gulp
        .src('package.json')
        .pipe(modifyFile((content, path, file) => {
            return JSON.stringify({
                ...JSON.parse(content),
            }, null, 4);
        }))
        .pipe(gulp.dest('dist'))
}

function readme() {
    return gulp
        .src('../../README.md')
        .pipe(gulp.dest('dist'))
}

function readme() {
    return gulp
        .src('../../LICENSE')
        .pipe(gulp.dest('dist'))
}





exports.default = gulp.series(cleanDist, buildTsWithMaps, buildTsDeclarations, packageDotJson, readme);