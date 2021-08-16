const { join:p } = require('path');
const iconTypes = require(p(__dirname, 'generated', 'iconTypes.json'));

module.exports = iconTypes.map(i => ({
    type: i.type,
    link: 'https://example.com'
}));
