"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelError = void 0;
exports.sleep = sleep;
exports.debounce = debounce;
exports.generateUUID = generateUUID;
/**
 * Sleep micro second
 * @param ms micro second to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
class CancelError extends Error {
    constructor(message = 'Operation canceled') {
        super(message);
    }
}
exports.CancelError = CancelError;
//# sourceMappingURL=utils.js.map