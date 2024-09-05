import { src, dest, watch, parallel, series } from 'gulp';
import gulpSass from 'gulp-sass';             // импортируем gulp-sass
import * as sass from 'sass';                 // импортируем sass
import concat from 'gulp-concat';             // импортируем gulp-concat
import uglify from 'gulp-uglify-es';          // импортируем gulp-uglify-es - минификация и склейка js файлов
import browserSync from 'browser-sync';       // импортируем browser-sync
import autoprefixer from 'gulp-autoprefixer'; // импортируем autoprefixer 
import fileInclude from 'gulp-file-include';  // импортируем gulp-file-include - склейка html файлов (и не только)
import clean from 'gulp-clean';               // импортируем gulp-clean - для удаления файлов и директорий
import webp from 'gulp-webp';                 // импортируем gulp-webp - для работы с webp
import gulpAvif from 'gulp-avif';             // импортируем gulp-avif - для конвертации изображений PNG и JPG в AVIF.
import imagemin from 'gulp-imagemin';         // импортируем gulp-imagemin - меньшаeт изображения PNG, JPEG, GIF и SVG
import newer from 'gulp-newer';               // импортируем gulp-newer - сохраняет кэш в памяти файлов (и их содержимого), которые прошли через него

// Инициализация плагинов
const sassCompiler = gulpSass(sass);  // gulpSass не будет работать если в него не передать sass
const uglifyJs = uglify.default;      // uglify экспортируется по default, соответственно нужно импортировать по default
const browser = browserSync.create(); // необходимо для инициализации экземпляра BrowserSync

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
    return src(['node_modules/swiper/swiper-bundle.js', 'dev/assets/js/main.js'])  
        .pipe(concat('main.min.js'))    // меняем имя файла
        .pipe(uglifyJs())               // обработка (сжатие и обьединение js файлов в main.min.js)
        .pipe(dest('build/assets/js'))  // выплевываем финальный main.min.js по укеазаному пути 
        .pipe(browser.stream());        // перезагружаем liveserver 
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

// Переименованная функция обработки HTML
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
    watch(['dev/assets/img/**/*.*'], parallel(minifyImages, convertToWebp, convertToAvif));
}

// Экспорт задач
export {minifyImages, convertToWebp, convertToAvif, styles, scripts, buildHtml, cleanDist, watching };

// Экспорт по умолчанию
export default series(cleanDist, parallel(minifyImages, convertToWebp, convertToAvif, styles, scripts, buildHtml, watching));