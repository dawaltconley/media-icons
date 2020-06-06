const child = require('child_process');
const fs = require('fs');
const assert = require('assert').strict;

child.exec('node build; npx eleventy', (err) => {
    if (err) throw err;
    const result = fs.readFileSync('./eleventy/_site/index.html').toString();
    const test = fs.readFileSync('./test.html').toString();
    assert.strictEqual(result, test);
});
