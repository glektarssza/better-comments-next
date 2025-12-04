// @ts-check

//-- NPM Packages
import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';

export default defineConfig(
    {
        ignores: ['**.js', '**.cjs', '**.mjs', '**/dist/**', '**/samples/**']
    },
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    {
        files: ['**/tests/*.ts', '**/tests/**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off'
        }
    },
    prettierConfig
);
