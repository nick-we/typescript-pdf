import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import filesize from 'rollup-plugin-filesize';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve as pathResolve } from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = require('./package.json');

const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    /^node:/
];

const plugins = [
    resolve({
        browser: false,
        preferBuiltins: true
    }),
    commonjs(),
    typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false
    }),
    esbuild({
        target: 'es2020',
        minify: false
    }),
    filesize({
        showMinifiedSize: false,
        showGzippedSize: true
    })
];

export default defineConfig([
    // ESM build
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.esm.js',
            format: 'es',
            sourcemap: true,
            exports: 'named'
        },
        external,
        plugins
    },

    // CommonJS build
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.cjs.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'named'
        },
        external,
        plugins
    },

    // UMD build (for browser)
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.umd.js',
            format: 'umd',
            name: 'TypescriptPdf',
            sourcemap: true,
            exports: 'named',
            globals: {
                // Define globals for external dependencies if needed
            }
        },
        external: external.filter(dep => typeof dep === 'string' && !dep.startsWith('node:')),
        plugins: [
            ...plugins,
            esbuild({
                target: 'es2020',
                minify: true
            })
        ]
    },

    // TypeScript declarations
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es'
        },
        external,
        plugins: [
            dts({
                tsconfig: './tsconfig.build.json'
            })
        ]
    }
]);