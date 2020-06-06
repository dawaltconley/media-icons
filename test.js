const path = require('path');
const child = require('child_process');
const fs = require('fs');
const assert = require('assert').strict;

const p = (...args) => path.join(__dirname, ...args);

fs.rmdirSync(p('dist'), { recursive: true });

child.exec('node build; npx eleventy', (err) => {
    if (err) throw err;
    const result = fs.readFileSync(p('eleventy', '_site', 'index.html')).toString();
    const test = fs.readFileSync(p('test.html')).toString();
    assert.strictEqual(result, test);
});
