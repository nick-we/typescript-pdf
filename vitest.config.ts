/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: [
                'examples/**/*',
                'src/test/**/*',
                '**/*.test.ts',
                '**/*.spec.ts',
                '**/node_modules/**',
                'dist/**',
                'coverage/**',
                '**/*.d.ts'
            ],
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage'
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@/types': resolve(__dirname, 'src/types'),
            '@/core': resolve(__dirname, 'src/core'),
            '@/widgets': resolve(__dirname, 'src/widgets'),
            '@/utils': resolve(__dirname, 'src/utils')
        }
    }
});