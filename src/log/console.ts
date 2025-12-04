import * as vscode from 'vscode';

const channel = vscode.window.createOutputChannel('Better Comments');

function loggingValueFormatter(value: unknown): string {
    switch (typeof value) {
        case 'string':
            return value;
        case 'boolean':
            return value ? 'true' : 'false';
        case 'number':
        case 'bigint':
            return value.toString();
        case 'function':
            return `Function(${value.name ?? 'unknown'})`;
        case 'symbol':
            return `Symbol[${value.description ?? value.toString()}]`;
        case 'undefined':
            return 'undefined';
        case 'object':
            return JSON.stringify(value);
    }
}

function log(...args: unknown[]) {
    const line = args.map(loggingValueFormatter).join(' ');
    channel.appendLine(line);
}

export function info(...args: unknown[]) {
    log('[INFO]', ...args);
}

export function error(...args: unknown[]) {
    log('[ERROR]', ...args);
}

export function warn(...args: unknown[]) {
    log('[WARNING]', ...args);
}
