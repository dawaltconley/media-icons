const fs = require('fs');
const yaml = require('js-yaml');
const sass = require('node-sass');
const sassUtils = require('node-sass-utils')(sass);
const { join } = require('path');

const p = (...args) => join(__dirname, ...args)
const dist = 'dist';
const iconTypes =  yaml.safeLoad(fs.readFileSync(p('icon-types.yml')).toString());

let sassData = sassUtils.sassString(sassUtils.castToSass(iconTypes));
sassData = `$icon-types: ${sassData} !default;\n`;
sassData += fs.readFileSync(p('icons.scss'));

if (!fs.existsSync(p(dist)))
    fs.mkdirSync(p(dist));
fs.writeFileSync(p(dist, '_icons.scss'), sassData);
fs.writeFileSync(p(dist, 'icons.css'), sass.renderSync({ data: sassData }).css);

const data = JSON.stringify(iconTypes);
fs.writeFileSync(p(dist, 'icon-types.json'), data);
fs.mkdirSync(p('eleventy', '_data', 'generated'), { recursive: true });
fs.writeFileSync(p('eleventy', '_data', 'generated', 'iconTypes.json'), data);
