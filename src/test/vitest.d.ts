/**
 * Vitest global types
 * 
 * This file provides type definitions for vitest globals when using
 * the globals: true configuration.
 */

import type {
    TestAPI,
    SuiteAPI,
    ExpectStatic,
    MockedFunction,
    SpyInstance,
} from 'vitest';

declare global {
    const describe: SuiteAPI;
    const it: TestAPI;
    const test: TestAPI;
    const expect: ExpectStatic;
    const beforeAll: (fn: () => void | Promise<void>) => void;
    const afterAll: (fn: () => void | Promise<void>) => void;
    const beforeEach: (fn: () => void | Promise<void>) => void;
    const afterEach: (fn: () => void | Promise<void>) => void;
    const vi: typeof import('vitest').vi;
}

export { };