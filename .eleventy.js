const yaml = require('js-yaml');
const path = require('path');
const p = (...args) => path.join(__dirname, ...args);
const MediaIcons = require(p('tags.js'));

module.exports = eleventyConfig => {
    eleventyConfig.addDataExtension('yml', data => yaml.safeLoad(data));

    eleventyConfig.addPassthroughCopy({ 'dist/icons.css': 'css/icons.css' });
    eleventyConfig.addPlugin(MediaIcons.eleventy);

    return {
        dir: {
            input: './eleventy',
            output: './eleventy/_site'
        },
        htmlTemplateEngine: 'njk'
    };
};
