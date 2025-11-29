"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAG_SUFFIX = exports.ANY = exports.SP_BR = exports.BR = exports.SP = void 0;
exports.escape = escape;
const escapeCache = new Map();
/**
 * Escapes a given string for use in a regular expression
 * @param input The input string to be escaped
 * @returns {string} The escaped string
 */
function escape(input) {
    let escaped = escapeCache.get(input);
    if (!escaped) {
        escaped = input.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'); // $& means the whole matched string
        escapeCache.set(input, escaped);
    }
    return escaped;
}
exports.SP = '[ \\t]';
exports.BR = '(?:\\r?\\n)';
exports.SP_BR = '[ \\t\\r\\n]';
exports.ANY = '[\\s\\S]';
exports.TAG_SUFFIX = '[ \\t:：]';
//# sourceMappingURL=regex.js.map