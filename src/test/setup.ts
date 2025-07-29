/**
 * Vitest test setup file
 * 
 * This file is executed before all tests and can be used
 * to configure global test environment settings.
 */

// Global test configuration
beforeEach(() => {
    // Reset any global state before each test
});

afterEach(() => {
    // Clean up after each test
});

// Mock global constants for tests
global.__VERSION__ = 'test';
global.__DEV__ = true;

// Extend expect with custom matchers if needed
// expect.extend({
//   // Custom matchers can be added here
// });