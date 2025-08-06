import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
    // Base ESLint recommended rules
    eslint.configs.recommended,

    // TypeScript configuration
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: ['./tsconfig.json', './tsconfig.build.json'],
                tsconfigRootDir: '.',
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                NodeJS: 'readonly',
                performance: 'readonly',
                fetch: 'readonly',
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                File: 'readonly',
                FileReader: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'import': importPlugin,
        },
        rules: {
            // TypeScript specific rules
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    'argsIgnorePattern': '^_',
                    'varsIgnorePattern': '^_',
                    'caughtErrorsIgnorePattern': '^_',
                    'ignoreRestSiblings': true,
                    'args': 'after-used',
                    'vars': 'all',
                    'caughtErrors': 'all'
                }
            ],
            'no-unused-vars': 'off', // Turn off base rule as it conflicts with TypeScript version
            '@typescript-eslint/prefer-readonly': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    disallowTypeAnnotations: false,
                },
            ],
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
            '@typescript-eslint/array-type': [
                'error',
                {
                    default: 'array-simple',
                },
            ],
            '@typescript-eslint/prefer-for-of': 'error',
            '@typescript-eslint/prefer-includes': 'error',
            '@typescript-eslint/prefer-string-starts-ends-with': 'error',

            // General JavaScript rules
            'prefer-const': 'error',
            'no-var': 'error',
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-alert': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-script-url': 'error',
            'no-with': 'error',
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            "dot-notation": "off",
            "@typescript-eslint/dot-notation": [
                "error",
                {
                    "allowIndexSignaturePropertyAccess": true
                }
            ],
            'no-else-return': 'error',
            'no-empty-pattern': 'error',
            'no-lone-blocks': 'error',
            'no-multi-spaces': 'error',
            'no-new': 'error',
            'no-return-assign': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-throw-literal': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unused-expressions': 'error',
            'no-useless-call': 'error',
            'no-useless-concat': 'error',
            'no-useless-return': 'error',
            'radix': 'error',
            'yoda': 'error',

            // Import rules
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                    pathGroups: [
                        {
                            pattern: '@/**',
                            group: 'internal',
                            position: 'before',
                        },
                    ],
                    pathGroupsExcludedImportTypes: ['builtin'],
                },
            ],
            'import/no-duplicates': 'error',
            'import/no-unresolved': 'off',
            'import/named': 'off',
            'import/default': 'off',
            'import/namespace': 'off',
            // Enforce absolute imports for internal modules
            'import/no-relative-parent-imports': 'error',
            // Enforce no relative imports within the src directory
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['../*', './*'],
                            message: 'Relative imports are not allowed. Use absolute imports with @/ prefix instead.',
                        },
                    ],
                },
            ],
            // Custom rule to enforce @/ imports for internal modules
            'import/no-useless-path-segments': [
                'error',
                {
                    noUselessIndex: false,
                },
            ],
        },
    },

    // Test files configuration
    {
        files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly',
                vitest: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-console': 'off',
        },
    },

    // Config files
    {
        files: ['*.config.js', '*.config.ts', 'rollup.config.js'],
        languageOptions: {
            globals: {
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-var-requires': 'off',
            'no-console': 'off',
        },
    },

    // Ignore patterns
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            '**/*.d.ts',
            'docs/.vitepress/cache/**',
            'docs/.vitepress/dist/**',
        ],
    },
];