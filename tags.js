const { URL } = require('url');
const { join:p } = require('path');
const argParse = require('liquid-args');
const iconTypes = require(p(__dirname, 'dist', 'icon-types.json'));

class MediaIcons {
    constructor ({ data=iconTypes }={}) {
        this.types = data;
        this.parseTags = this.parseTags.bind(this);
        this.makeIcon = this.makeIcon.bind(this);
        this.makeIcons = this.makeIcons.bind(this);
        this.nunjucks = this.nunjucks.bind(this);
        this.liquid = this.liquid.bind(this);
    }

    parseTags(tag) {
        let tags = {};
        if (tag instanceof Object && Object.keys(tag) === [ 'single', 'multi' ]) {
            tags = { single: 'icon', ...tag };
        } else if (tag instanceof Array) {
            tags = { single: tag[0], multi: tag[1] };
        } else if (typeof tag === 'string') {
            tags = { single: tag };
        } else {
            throw new TypeError(`Couldn't parse tag, was ${tag}`);
        }
        tags.multi = tags.multi || tags.single+'s';
        return tags;
    }

    makeIcon (context, type, link, kwargs={}) {
        if (kwargs.__keywords && kwargs.__keywords !== true)
            throw new Error('Icon tag only takes a type and a link; found third positional arg.');
        let {
            data = this.types,
            style = '',
            linkText = link,
            list = false,
            showLink = false,
            microdata = false,
            newTab = type === 'phone',
            analytics:analyticsLabel
        } = kwargs;

        if (typeof data === 'string')
            data = context[data];
        const icon = data.find(i => i.type === type);

        if (!icon.type)
            throw new Error(`No data for icon of type ${type}.`);

        let href;
        try {
            href = new URL(link).href;
        } catch(e) {
            if (e.code !== 'ERR_INVALID_URL')
                throw e;
            if (type === 'email') {
                href = link.match(/^mailto:/) ? link : 'mailto:' + link;
            } else if (type === 'phone') {
                href = 'tel:' + link.replace(/^tel:/, '').replace(/[ -().]/g, '');
            } else if (type === 'twitter') {
                href = 'https://twitter.com/' + link.replace(/^@/, '');
            } else {
                throw e;
            }
        }

        let alt, analyticsCatagory;
        if (['email', 'phone'].includes(type)) {
            alt = icon.label.replace(/^./, l => l.toUpperCase()) + ' link';
            analyticsCatagory = 'Contact Link';
        } else {
            alt = `Visit our ${icon.label} page`;
            analyticsCatagory = 'Social Link';
        }

        let faStyle = 'fas', faClass = icon.fa.default;
        const iconStyles = style.split(' ');
        for (const style of iconStyles) {
            if (['regular', 'far', 'r'].includes(style)) {
                faStyle = 'far';
            } else if (['light', 'fal', 'l'].includes(style)) {
                faStyle = 'fal';
            } else {
                faClass = icon.fa[style] || faClass;
            }
        }
        if (icon.brand) faStyle = 'fab';

        analyticsLabel = analyticsLabel || `Clicked on ${icon.label} link to ${href}`;

        let html = `<a class="media-icon ${type}-icon"`;
        if (newTab) html += ' target="_blank"';
        if (microdata) {
            if (type === 'email')
                html += ' itemprop="email"';
            else if (type === 'phone')
                html += ' itemprop="telephone"';
        }
        if (context.site && context.site.google_analytics)
            html += ` data-analytics-catagory="${analyticsCatagory}" data-analytics-action="click" data-analytics-label="${analyticsLabel}"`; 
        if (!showLink)
            html += ` aria-label="${alt}"`;
        html += ` href="${href}"><i class="fa-icon ${faStyle} fa-${faClass} no-select${list ? ' fa-li' : ''}" aria-hidden="true"></i>`;
        if (showLink)
            html += `<span class="media-icon-text">${linkText}</span>`;
        html += '</a>';

        return html;
    }

    makeIcons (context, iconSet, kwargs={}) {
        if (kwargs.__keywords && kwargs.__keywords !== true)
            throw new Error('Icons tag only takes a type and a link; found third positional arg.');

        let icons = iconSet;
        if (typeof icons === 'string')
            icons = context[icons];
        if (icons instanceof Object && !(icons instanceof Array))
            icons = Object.entries(icons);
        if (icons instanceof Array && icons.every(i => i instanceof Array && i.length === 2))
            icons = icons.reduce((a, i) => [...a, { type: i[0], link: i[1] }], []);

        let html = '';
        for (const { type, link } of icons) {
            if (!link) continue;
            let iconHTML = this.makeIcon(context, type, link, kwargs);
            if (kwargs.list)
                iconHTML = `<li>${iconHTML}</li>`;
            html += iconHTML;
        }

        return html;
    }

    nunjucks (tag='icon') {
        const { makeIcon, makeIcons } = this;
        const tags = this.parseTags(tag);
        const tagFuncs = {};

        for (let type in tags) {
            const make = type === 'single' ? makeIcon : makeIcons;
            const tagName = tags[type];
            tagFuncs[tagName] = function (nunjucks) {
                return new function () {
                    this.tags = [ tagName ];
                    this.parse = function (parser, nodes) {
                        const tok = parser.nextToken();
                        const args = parser.parseSignature(null, true);
                        parser.advanceAfterBlockEnd(tok.value);
                        return new nodes.CallExtension(this, "run", args);
                    };
                    this.run = (context, ...args) =>
                        new nunjucks.runtime.SafeString(make(context.ctx, ...args));
                };
            };
        }

        return tagFuncs;
    }

    liquid (tag='icon') {
        const { makeIcon, makeIcons } = this;
        const tags = this.parseTags(tag);
        const tagFuncs = {};

        for (let type in tags) {
            const make = type === 'single' ? makeIcon : makeIcons;
            const tagName = tags[type];
            tagFuncs[tagName] = function (liquidEngine) {
                return {
                    parse: function (tagToken) {
                        this.args = tagToken.args;
                    },
                    render: async function (scope) {
                        const evalValue = arg => liquidEngine.evalValue(arg, scope);
                        const args = await Promise.all(argParse(this.args, evalValue));
                        return make(scope.contexts[0], ...args);
                    }
                };
            };
        }

        return tagFuncs;
    }
}

module.exports = MediaIcons;

module.exports.types = iconTypes;

module.exports.eleventy = (eleventyConfig, config={}) => {
    let {
        tagName = 'icon',
        ...options
    } = config;
    const icons = new MediaIcons(options);
    let nunjucksTags = icons.nunjucks(tagName);
    let liquidTags = icons.liquid(tagName);
    for (let tag in nunjucksTags) {
        eleventyConfig.addNunjucksTag(tag, nunjucksTags[tag]);
    }
    for (let tag in liquidTags) {
        eleventyConfig.addLiquidTag(tag, liquidTags[tag]);
    }
};
