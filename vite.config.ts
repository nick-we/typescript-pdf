/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    // Build configuration
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'TypescriptPdf',
            fileName: (format) => `typescript-pdf.${format}.js`,
            formats: ['es', 'cjs', 'umd']
        },
        rollupOptions: {
            // External dependencies that shouldn't be bundled
            external: [],
            output: {
                globals: {}
            }
        },
        // Target modern browsers and Node.js
        target: 'es2020',
        // Generate source maps
        sourcemap: true,
        // Minify output
        minify: 'esbuild',
        // Clear dist folder before build
        emptyOutDir: true
    },

    // Development server configuration
    server: {
        port: 3000,
        open: true,
        cors: true,
        hmr: {
            overlay: true
        }
    },

    // Path resolution
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@/types': resolve(__dirname, 'src/types'),
            '@/core': resolve(__dirname, 'src/core'),
            '@/widgets': resolve(__dirname, 'src/widgets'),
            '@/utils': resolve(__dirname, 'src/utils')
        }
    },

    // TypeScript configuration
    esbuild: {
        target: 'es2020',
        format: 'esm'
    },

    // Plugin configuration
    plugins: [],

    // Define global constants
    define: {
        __VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
        __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
    },

    // CSS configuration
    css: {
        devSourcemap: true
    },

    // Test configuration (for Vitest integration)
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
            include: ['src/**/*.ts'],
            exclude: [
                'examples/**',
                'src/test/**',
                '**/*.test.ts',
                '**/*.spec.ts',
                '**/node_modules/**',
                'dist/**',
                'coverage/**'
            ]
        }
    }
});