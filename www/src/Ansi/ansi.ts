// Modified version from https://github.com/rburns/ansi-to-html
//
// Copyright (c) 2012 Rob Burns
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
import {encodeXML} from 'entities';

const defaults = {
    fg: '--base-terminal-color',
    bg: '#000',
    newline: false,
    escapeXML: false,
    stream: false,
    colors: getDefaultColors()
};

function getDefaultColors() {
    const colors = {
        0: '#000',
        1: '#F55',
        2: '#0A0',
        3: '#ea7c10',
        4: '#00A',
        5: '#A0A',
        6: '#0AA',
        7: '#AAA',
        8: '#555',
        9: '#F55',
        10: '#5F5',
        11: '#FF5',
        12: '#55F',
        13: '#F5F',
        14: '#5FF',
        15: '#FFF'
    };

    range(0, 5).forEach(red => {
        range(0, 5).forEach(green => {
            range(0, 5).forEach(blue => setStyleColor(red, green, blue, colors));
        });
    });

    range(0, 23).forEach(function (gray) {
        const c = gray + 232;
        const l = toHexString(gray * 10 + 8);

        colors[c] = '#' + l + l + l;
    });

    return colors;
}

function setStyleColor(red: any, green: any, blue: any, colors: any) {
    const c = 16 + (red * 36) + (green * 6) + blue;
    const r = red > 0 ? red * 40 + 55 : 0;
    const g = green > 0 ? green * 40 + 55 : 0;
    const b = blue > 0 ? blue * 40 + 55 : 0;

    colors[c] = toColorHexString([r, g, b]);
}

/**
 * Converts from a number like 15 to a hex string like 'F'
 */
function toHexString(num: number): string {
    let str = num.toString(16);

    while (str.length < 2) {
        str = '0' + str;
    }

    return str;
}

/**
 * Converts from an array of numbers like [15, 15, 15] to a hex string like 'FFF'
 */
function toColorHexString(ref: number[]): string {
    const results = [];

    for (const r of ref) {
        results.push(toHexString(r));
    }

    return '#' + results.join('');
}

function generateOutput(stack: any[], token: string, data: any, options: any) {
    let result;

    if (token === 'text') {
        result = pushText(data, options);
    } else if (token === 'display') {
        result = handleDisplay(stack, data, options);
    } else if (token === 'xterm256Foreground') {
        result = pushForegroundColor(stack, options.colors[data]);
    } else if (token === 'xterm256Background') {
        result = pushBackgroundColor(stack, options.colors[data]);
    } else if (token === 'rgb') {
        result = handleRgb(stack, data);
    }

    return result;
}

function handleRgb(stack: any[], data: string): string {
    data = data.substring(2).slice(0, -1);
    const operation = +data.substr(0, 2);

    const color = data.substring(5).split(';');
    const rgb = color.map(function (value) {
        return ('0' + Number(value).toString(16)).substr(-2);
    }).join('');

    return pushStyle(stack, (operation === 38 ? 'color:#' : 'background-color:#') + rgb);
}

function handleDisplay(stack: any[], codeStr: string, options: any) {
    let code = parseInt(codeStr, 10);

    const codeMap = {
        '-1': () => '<br/>',
        0: () => stack.length && resetStyles(stack),
        1: () => pushTag(stack, 'b'),
        3: () => pushTag(stack, 'i'),
        4: () => pushTag(stack, 'u'),
        8: () => pushStyle(stack, 'display:none'),
        9: () => pushTag(stack, 'strike'),
        22: () => pushStyle(stack, 'font-weight:normal;text-decoration:none;font-style:normal'),
        23: () => closeTag(stack, 'i'),
        24: () => closeTag(stack, 'u'),
        39: () => pushForegroundColor(stack, options.fg),
        49: () => pushBackgroundColor(stack, options.bg),
        53: () => pushStyle(stack, 'text-decoration:overline')
    };

    let result;
    if (codeMap[code]) {
        result = codeMap[code]();
    } else if (4 < code && code < 7) {
        result = pushTag(stack, 'blink');
    } else if (29 < code && code < 38) {
        result = pushForegroundColor(stack, options.colors[code - 30]);
    } else if ((39 < code && code < 48)) {
        result = pushBackgroundColor(stack, options.colors[code - 40]);
    } else if ((89 < code && code < 98)) {
        result = pushForegroundColor(stack, options.colors[8 + (code - 90)]);
    } else if ((99 < code && code < 108)) {
        result = pushBackgroundColor(stack, options.colors[8 + (code - 100)]);
    }

    return result;
}

/**
 * Clear all the styles
 * @returns {string}
 */
function resetStyles(stack) {
    const stackClone = stack.slice(0);

    stack.length = 0;

    return stackClone.reverse().map(function (tag) {
        return '</' + tag + '>';
    }).join('');
}

/**
 * Creates an array of numbers ranging from low to high
 * @param {number} low
 * @param {number} high
 * @returns {Array}
 * @example range(3, 7); // creates [3, 4, 5, 6, 7]
 */
function range(low: number, high: any) {
    const results = [];

    for (let j = low; j <= high; j++) {
        results.push(j);
    }

    return results;
}


/**
 * Returns a new function that is true if value is NOT the same category
 * @returns {function}
 */
function notCategory(category: string) {
    return function (e) {
        return (category === null || e.category !== category) && category !== 'all';
    };
}

/**
 * Converts a code into an ansi token type
 */
function categoryForCode(codeStr: string): string | null {
    let code = parseInt(codeStr, 10);
    let result = null;

    if (code === 0) {
        result = 'all';
    } else if (code === 1) {
        result = 'bold';
    } else if ((2 < code && code < 5)) {
        result = 'underline';
    } else if ((4 < code && code < 7)) {
        result = 'blink';
    } else if (code === 8) {
        result = 'hide';
    } else if (code === 9) {
        result = 'strike';
    } else if ((29 < code && code < 38) || code === 39 || (89 < code && code < 98)) {
        result = 'foreground-color';
    } else if ((39 < code && code < 48) || code === 49 || (99 < code && code < 108)) {
        result = 'background-color';
    }

    return result;
}

function pushText(text: string, options: { escapeXML: any; }): string {
    if (options.escapeXML) {
        return encodeXML(text);
    }

    return text;
}

function pushTag(stack: any[], tag: string, style: string = ''): string {
    stack.push(tag);

    return `<${tag}${style ? ` style="${style}"` : ''}>`;
}

function pushTagWithClass(stack: any[], tag: string, classes: string = ''): string {
    stack.push(tag);

    return `<${tag}${classes ? ` class="${classes}"` : ''}>`;
}

/**
 * @param {Array} stack
 * @param {string} style
 * @returns {string}
 */
function pushStyle(stack: any[], style: string): string {
    return pushTag(stack, 'span', style);
}

function pushForegroundColor(stack: any[], color: string): string {
    if (color.startsWith('--')) {
        return pushTagWithClass(stack, 'span', color.substring(2));
    }

    return pushTag(stack, 'span', 'color:' + color);
}

function pushBackgroundColor(stack: any[], color: string): string {
    return pushTag(stack, 'span', 'background-color:' + color);
}

function closeTag(stack: any[], style: string): string {
    let last;

    if (stack.slice(-1)[0] === style) {
        last = stack.pop();
    }

    if (last) {
        return '</' + style + '>';
    }

    return '';
}

/**
 * @param {string} text
 * @param {object} options
 * @param {function} callback
 * @returns {Array}
 */
function tokenize(text: string, options: { newline: any; }, callback: {
    (token: any, data: any): void;
    (arg0: string, arg1: number): void;
}) {
    let ansiMatch = false;
    const ansiHandler = 3;

    function remove() {
        return '';
    }

    function removeXterm256Foreground(m: any, g1: any) {
        callback('xterm256Foreground', g1);
        return '';
    }

    function removeXterm256Background(m: any, g1: any) {
        callback('xterm256Background', g1);
        return '';
    }

    function newline(m: any) {
        if (options.newline) {
            callback('display', -1);
        } else {
            callback('text', m);
        }

        return '';
    }

    function ansiMess(m: any, g1: string) {
        ansiMatch = true;
        if (g1.trim().length === 0) {
            g1 = '0';
        }

        const g2 = g1.trimRight(';').split(';');

        for (const g of g2) {
            callback('display', g);
        }

        return '';
    }

    function realText(m: any) {
        callback('text', m);

        return '';
    }

    function rgb(m: any) {
        callback('rgb', m);

        return '';
    }

    /* eslint no-control-regex:0 */
    const tokens = [{
        pattern: /^\x08+/,
        sub: remove
    }, {
        pattern: /^\x1b\[[012]?K/,
        sub: remove
    }, {
        pattern: /^\x1b\[\(B/,
        sub: remove
    }, {
        pattern: /^\x1b\[[34]8;2;\d+;\d+;\d+m/,
        sub: rgb
    }, {
        pattern: /^\x1b\[38;5;(\d+)m/,
        sub: removeXterm256Foreground
    }, {
        pattern: /^\x1b\[48;5;(\d+)m/,
        sub: removeXterm256Background
    }, {
        pattern: /^\n/,
        sub: newline
    }, {
        pattern: /^\r+\n/,
        sub: newline
    }, {
        pattern: /^\r/,
        sub: newline
    }, {
        pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
        sub: ansiMess
    }, {
        // CSI n J
        // ED - Erase in Display Clears part of the screen.
        // If n is 0 (or missing), clear from cursor to end of screen.
        // If n is 1, clear from cursor to beginning of the screen.
        // If n is 2, clear entire screen (and moves cursor to upper left on DOS ANSI.SYS).
        // If n is 3, clear entire screen and delete all lines saved in the scrollback buffer
        //   (this feature was added for xterm and is supported by other terminal applications).
        pattern: /^\x1b\[\d?J/,
        sub: remove
    }, {
        // CSI n ; m f
        // HVP - Horizontal Vertical Position Same as CUP
        pattern: /^\x1b\[\d{0,3};\d{0,3}f/,
        sub: remove
    }, {
        // catch-all for CSI sequences?
        pattern: /^\x1b\[?[\d;]{0,3}/,
        sub: remove
    }, {
        /**
         * extracts real text - not containing:
         * - `\x1b' - ESC - escape (Ascii 27)
         * - '\x08' - BS - backspace (Ascii 8)
         * - `\n` - Newline - linefeed (LF) (ascii 10)
         * - `\r` - Windows Carriage Return (CR)
         */
        pattern: /^(([^\x1b\x08\r\n])+)/,
        sub: realText
    }];

    function process(handler: { pattern: any; sub: any; }, i: number) {
        if (i > ansiHandler && ansiMatch) {
            return;
        }

        ansiMatch = false;

        text = text.replace(handler.pattern, handler.sub);
    }

    const results1 = [];
    let {length} = text;

    outer:
        while (length > 0) {
            for (let i = 0, o = 0, len = tokens.length; o < len; i = ++o) {
                const handler = tokens[i];
                process(handler, i);

                if (text.length !== length) {
                    // We matched a token and removed it from the text. We need to
                    // start matching *all* tokens against the new text.
                    length = text.length;
                    continue outer;
                }
            }

            if (text.length === length) {
                break;
            }
            results1.push(0);

            length = text.length;
        }

    return results1;
}

/**
 * If streaming, then the stack is "sticky"
 */
function updateStickyStack(stickyStack: any[], token: string, data: any): any[] {
    if (token !== 'text') {
        stickyStack = stickyStack.filter(notCategory(categoryForCode(data)));
        stickyStack.push({token, data, category: categoryForCode(data)});
    }

    return stickyStack;
}

export class Filter {
    options: any;
    stack: any[];
    stickyStack: any[];

    /**
     * @param {object} options
     * @param {string=} options.fg The default foreground color used when reset color codes are encountered.
     * @param {string=} options.bg The default background color used when reset color codes are encountered.
     * @param {boolean=} options.newline Convert newline characters to `<br/>`.
     * @param {boolean=} options.escapeXML Generate HTML/XML entities.
     * @param {boolean=} options.stream Save style state across invocations of `toHtml()`.
     * @param {(string[] | {[code: number]: string})=} options.colors Can override specific colors or the entire ANSI palette.
     */
    constructor(options: { colors?: any; }) {
        options = options || {};

        if (options.colors) {
            options.colors = Object.assign({}, defaults.colors, options.colors);
        }

        this.options = Object.assign({}, defaults, options);
        this.stack = [];
        this.stickyStack = [];
    }

    toHtml(input: string | string[]): string {
        input = typeof input === 'string' ? [input] : input;
        const {stack, options} = this;
        const buf = [];

        this.stickyStack.forEach(element => {
            const output = generateOutput(stack, element.token, element.data, options);

            if (output) {
                buf.push(output);
            }
        });

        tokenize(input.join(''), options, (token, data) => {
            const output = generateOutput(stack, token, data, options);

            if (output) {
                buf.push(output);
            }

            if (options.stream) {
                this.stickyStack = updateStickyStack(this.stickyStack, token, data);
            }
        });

        if (stack.length) {
            buf.push(resetStyles(stack));
        }

        return buf.join('');
    }
}
