import {defineConfig} from 'tsup';
import {dependencies} from '../package.json';

export default defineConfig((options) => {
    return {
        entry: {
            'extension.web': 'src/extension.ts'
        },
        external: ['vscode'],
        noExternal: Object.keys(dependencies),
        bundle: true,
        outDir: 'dist',
        format: ['cjs'],
        platform: 'browser',
        target: ['chrome108'],
        minify: !options.watch,
        sourcemap: !!options.watch,
        replaceNodeEnv: true,
        inject: ['process/browser'],
        treeshake: true
    };
});
