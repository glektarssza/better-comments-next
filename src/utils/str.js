"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trim = trim;
exports.trimLeft = trimLeft;
exports.trimRight = trimRight;
exports.replaceWithSpace = replaceWithSpace;
exports.isString = isString;
const regex_1 = require("./regex");
function trim(str, char) {
    const excaped = char !== undefined ? (0, regex_1.escape)(char) : '\\s';
    return str.replace(new RegExp(`^${excaped}+|${excaped}+$`, 'g'), '');
}
function trimLeft(str, char) {
    const excaped = char !== undefined ? (0, regex_1.escape)(char) : '\\s';
    return str.replace(new RegExp(`^${excaped}+`, 'g'), '');
}
function trimRight(str, char) {
    const excaped = char !== undefined ? (0, regex_1.escape)(char) : '\\s';
    return str.replace(new RegExp(`${excaped}+$`, 'g'), '');
}
function replaceWithSpace(input, startIndex, endIndex) {
    if (startIndex < 0 || endIndex >= input.length || startIndex > endIndex) {
        throw new RangeError('Invalid range specified');
    }
    let result = input.slice(0, startIndex);
    for (let i = startIndex; i <= endIndex; i++) {
        const char = input[i];
        if (char !== ' ' && char !== '\t' && char !== '\n') {
            result += ' ';
        }
        else {
            result += char;
        }
    }
    result += input.slice(endIndex + 1);
    return result;
}
function isString(value) {
    return typeof value === 'string' || value instanceof String;
}
//# sourceMappingURL=str.js.map