"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cancelable = Cancelable;
const utils_1 = require("./utils");
/**
 * 将一个promise转换为一个可取消的promise
 * @param {Promise} task 希望被转换的promise实例
 * @returns {Promise} 返回具有cancel()&isCancel()的promise对象
 */
function Cancelable(task) {
    let _reject;
    let isCancel = false;
    const cancelP = new Promise((resolve, reject) => {
        _reject = reject;
    });
    const p = Promise.race([task, cancelP]);
    /***
       * 调用cancel时可能promise状态已经变为成功,
       * 所以不能在cancel里面改变isCancel
       * 只有catch的原因是cancel才代表被取消成功了
       */
    p.catch((reason) => {
        if (reason instanceof utils_1.CancelError) {
            isCancel = true;
        }
    });
    p.cancel = () => {
        _reject(new utils_1.CancelError());
        return p;
    };
    p.isCancel = () => {
        return isCancel;
    };
    return p;
}
//# sourceMappingURL=promise.js.map