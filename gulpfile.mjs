import { src, dest, watch, parallel, series } from 'gulp';
import gulpSass from 'gulp-sass';             // импортируем gulp-sass
import * as sass from 'sass';                 // импортируем sass
import concat from 'gulp-concat';             // импортируем gulp-concat
import uglify from 'gulp-uglify-es';          // импортируем gulp-uglify-es
import browserSync from 'browser-sync';       // импортируем browser-sync
import autoprefixer from 'gulp-autoprefixer'; // импортируем autoprefixer
import fileInclude from 'gulp-file-include';  // импортируем gulp-file-include
import clean from 'gulp-clean';               // импортируем gulp-clean


// Инициализация плагинов
const sassCompiler = gulpSass(sass);  // gulpSass не будет работать если в него не передать sass
const uglifyJs = uglify.default;      // uglify экспортируется по default, соответственно нужно импортировать по default
const browser = browserSync.create(); // необходимо для инициализации экземпляра BrowserSync

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
    return src('build')
        .pipe(clean())
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
}

// Экспорт задач
export { styles, scripts, buildHtml, cleanDist, watching };

// Экспорт по умолчанию
export default series(cleanDist, parallel(styles, scripts, buildHtml, watching));