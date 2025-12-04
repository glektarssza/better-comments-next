import * as configuration from '@/configuration';
import * as vscode from 'vscode';
import * as handler from './handler';

export * from './event';
export * from './handler';

configuration.onDidChange(() => {
    for (const editor of vscode.window.visibleTextEditors) {
        handler.triggerUpdateDecorations({editor});
    }
});
