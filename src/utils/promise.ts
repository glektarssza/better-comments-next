import {CancelError} from './utils';

export type Resolve = (value?: unknown) => void;

export interface PromiseCancelable<T = unknown> extends Promise<T> {
    cancel: () => PromiseCancelable<T>;
    isCancel: () => boolean;
}

export function Cancelable(task: Promise<unknown>) {
    let _reject: Resolve;
    let isCancel = false;
    const cancelP = new Promise((resolve, reject) => {
        _reject = reject;
    });
    const p = Promise.race([task, cancelP]) as PromiseCancelable;
    p.catch((reason) => {
        if (reason instanceof CancelError) {
            isCancel = true;
        }
    });

    p.cancel = () => {
        _reject(new CancelError());
        return p;
    };
    p.isCancel = () => {
        return isCancel;
    };
    return p;
}
