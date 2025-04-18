const { src, dest, series, parallel, watch } = require("gulp");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const data = require("gulp-data");
const htmlmin = require("gulp-htmlmin");
const clean = require("gulp-clean");
const sitemap = require("gulp-sitemap");
const fs = require("fs");
const path = require("path");
const gulpIf = require("gulp-if");

// 言語設定
const langs = [
  { code: "ja", path: "./", dataFile: "./src/data/ja.json" },
  { code: "en", path: "./en/", dataFile: "./src/data/en.json" },
];

// HTML圧縮設定
const htmlMinOptions = {
  collapseWhitespace: true,
  removeComments: true,
};

// テンプレートを言語ごとに処理
function buildPages() {
  return Promise.all(
    langs.map(
      (lang) =>
        new Promise((resolve) => {
          src("src/templates/*.ejs")
            .pipe(data(() => JSON.parse(fs.readFileSync(lang.dataFile))))
            .pipe(ejs({}, {}, { ext: ".html" }).on("error", console.error))
            .pipe(rename({ extname: ".html" }))
            .pipe(htmlmin(htmlMinOptions))
            .pipe(dest(`dist/${lang.code === "ja" ? "" : lang.code}`))
            .on("end", resolve);
        })
    )
  );
}

// アセットのコピー
function copyAssets() {
  return src("src/assets/**/*").pipe(dest("dist/assets"));
}

// sitemap.xml の生成
function generateSitemap() {
  return src(["dist/**/*.html"], { read: false })
    .pipe(
      sitemap({
        siteUrl: "https://rsports.jp",
      })
    )
    .pipe(dest("dist"));
}

// 出力先削除
function cleanDist() {
  return src("dist", { read: false, allowEmpty: true }).pipe(clean());
}

// ファイル監視（開発用）
function devWatch() {
  watch("src/templates/**/*.ejs", buildPages);
  watch("src/data/*.json", buildPages);
  watch("src/assets/**/*", copyAssets);
}

exports.clean = cleanDist;
exports.build = series(
  cleanDist,
  parallel(buildPages, copyAssets),
  generateSitemap
);
exports.dev = series(cleanDist, parallel(buildPages, copyAssets), devWatch);
