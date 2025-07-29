import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    test: {
        // Test environment
        environment: 'happy-dom',

        // Global test settings
        globals: true,

        // Setup files
        setupFiles: ['./src/test/setup.ts'],

        // Include and exclude patterns
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
        ],
        exclude: [
            'node_modules',
            'dist',
            '.idea',
            '.git',
            '.cache',
            '**/node_modules/**'
        ],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                'coverage/**',
                'dist/**',
                '**/node_modules/**',
                '**/test/**',
                '**/*.d.ts',
                '**/*.config.*',
                '**/*.test.*',
                '**/*.spec.*',
                '**/types/**',
                'src/test/**'
            ],
            threshold: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            },
            all: true,
            src: ['src']
        },

        // Test timeout
        testTimeout: 10000,
        hookTimeout: 10000,

        // Reporter configuration
        reporter: ['default', 'verbose'],

        // Watch mode settings
        watch: true,

        // Concurrent test execution
        threads: true,
        maxThreads: 4,
        minThreads: 1,

        // Mock settings
        clearMocks: true,
        restoreMocks: true,

        // Snapshot settings
        resolveSnapshotPath: (testPath, snapExtension) => {
            return testPath.replace(/\.test\.([tj]sx?)/, `.test${snapExtension}`);
        }
    },

    // Path resolution (same as main config)
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@/types': resolve(__dirname, 'src/types'),
            '@/core': resolve(__dirname, 'src/core'),
            '@/widgets': resolve(__dirname, 'src/widgets'),
            '@/utils': resolve(__dirname, 'src/utils')
        }
    },

    // Define global constants for tests
    define: {
        __VERSION__: JSON.stringify('test'),
        __DEV__: JSON.stringify(true)
    }
});