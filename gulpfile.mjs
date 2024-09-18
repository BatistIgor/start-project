import { src, dest, watch, parallel, series } from 'gulp';
import gulpSass from 'gulp-sass';             
import * as sass from 'sass';                 
import concat from 'gulp-concat';             // gulp-concat - переименнование и склейка файлов 
import uglify from 'gulp-uglify-es';          // gulp-uglify-es - минификация и склейка js файлов
import browserSync from 'browser-sync';       
import autoprefixer from 'gulp-autoprefixer'; 
import fileInclude from 'gulp-file-include';  // gulp-file-include - склейка html файлов (и не только)
import clean from 'gulp-clean';               // gulp-clean - для удаления файлов и директорий
import webp from 'gulp-webp';                 // gulp-webp - для работы с webp
import gulpAvif from 'gulp-avif';             // gulp-avif - для конвертации изображений PNG и JPG в AVIF.
import imagemin from 'gulp-imagemin';         // gulp-imagemin - уменьшаeт изображения PNG, JPEG, GIF и SVG
import newer from 'gulp-newer';               // gulp-newer - сохраняет кэш в памяти файлов (и их содержимого), которые прошли через него
import svgSprite from 'gulp-svg-sprite';      // берет несколько файлов SVG , оптимизирует их и объединяет в спрайты SVG нескольких типов
import ttf2woff2 from 'gulp-ttf2woff2';       
import ttf2woff from 'gulp-ttf2woff';         

// Инициализация плагинов
const sassCompiler = gulpSass(sass);  // gulpSass не будет работать если в него не передать sass
const uglifyJs = uglify.default;      // uglify экспортируется по default, соответственно нужно импортировать по default
const browser = browserSync.create(); // необходимо для инициализации экземпляра BrowserSync


// Функции конвертации ttf в woff,woff2
function fonts2woff() {
    return src('dev/assets/fonts/*.ttf',{
        encoding: false, // Important!
        removeBOM: false,
      })
        .pipe(newer('build/assets/img'))
        .pipe(ttf2woff())
        .pipe(dest('build/assets/fonts'))
}

function fonts2woff2() {
    return src('dev/assets/fonts/*.ttf', {
        encoding: false, // Important!
        removeBOM: false,
      })
        .pipe(newer('build/assets/img'))
        .pipe(ttf2woff2())
        .pipe(dest('build/assets/fonts'))
}


// Склейка svg в один спрайт. Запускать отдельно 
function sprite() {
    return src('build/assets/img/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg',
                    example: true
                }
            } 
        }))
        .pipe(dest('build/assets/img'))
}


//Функции работы с изображениями. Сжатие png,jpg,svg и конвертация png,jpg в форматы webp и Avif
function minifyImages() {
    return src('dev/assets/img/*.{png,jpg,svg}', {encoding: false})
        .pipe(newer('build/assets/img'))
        .pipe(imagemin())
        .pipe(dest('build/assets/img'));
}

function convertToWebp() {
    return src('dev/assets/img/*.{png,jpg}', {encoding: false})
        .pipe(newer('build/assets/img'))
        .pipe(webp())
        .pipe(dest('build/assets/img'));
}

function convertToAvif() {
    return src('dev/assets/img/*.{png,jpg}', {encoding: false})
        .pipe(newer('build/assets/img'))
        .pipe(gulpAvif({ quality: 50 }))
        .pipe(dest('build/assets/img'))
        .pipe(browser.stream());
}


// Функция обработки JS
function scripts() {
    return src(['dev/assets/js/main.js'])  
        .pipe(concat('main.min.js')) 
        .pipe(uglifyJs())               
        .pipe(dest('build/assets/js'))  
        .pipe(browser.stream());        
}

// Функция обработки стилей
function styles() {
    return src('dev/style.scss')
        .pipe(concat('style.min.css'))
        .pipe(sassCompiler({ outputStyle: 'compressed' }).on('error', sassCompiler.logError))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 version'] }))
        .pipe(dest('build/assets/css'))
        .pipe(browser.stream());
}

// Функция обработки HTML
function buildHtml() {
    return src(['dev/*.html'])
        .pipe(fileInclude({
            prefix: '@@',
            basepath: '@file' // или './templates' для отдельной папки с шаблонами
        }))
        .pipe(dest('build'))
        .pipe(browser.stream());
}

//Удаление папки build
function cleanDist() {
    return src('build', { allowEmpty: true }) 
        .pipe(clean());
}



// Наблюдение за файлами
function watching() {
    browser.init({
        server: {
            baseDir: "build/"
        }
    });
    watch(['dev/**/*.scss'], styles);
    watch(['dev/assets/js/**/*.js'], scripts);
    watch(['dev/**/*.html'], buildHtml);
    watch(['dev/assets/img/**/*.*'], series(parallel(minifyImages, convertToWebp, convertToAvif),browser.stream));
    watch(['dev/assets/fonts/*.*'], series(parallel(fonts2woff, fonts2woff2), browser.stream));
}

// Экспорт задач
export {fonts2woff, fonts2woff2, sprite, minifyImages, convertToWebp, convertToAvif, styles, scripts, buildHtml, cleanDist, watching};

// Экспорт по умолчанию
export default series(cleanDist, parallel(fonts2woff, fonts2woff2, minifyImages, convertToWebp, convertToAvif, styles, scripts, buildHtml), watching);