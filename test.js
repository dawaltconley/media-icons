const path = require('path');
const child = require('child_process');
const fs = require('fs');
const assert = require('assert').strict;

const p = (...args) => path.join(__dirname, ...args);

fs.rmdirSync(p('dist'), { recursive: true });

const compare = [
    [
        p('eleventy', '_site', 'index.html'),
        p('test', 'test.html')
    ], [
        p('dist', 'icons.css'),
        p('test', 'icons.css')
    ], [
        p('dist', '_icons.scss'),
        p('test', '_icons.scss')
    ]
];

child.exec('node build; npx eleventy', (err) => {
    if (err) throw err;
    compare.forEach(pair => {
        const output = fs.readFileSync(pair[0]).toString();
        const expected = fs.readFileSync(pair[1]).toString();
        assert.strictEqual(output, expected);
    });
});
