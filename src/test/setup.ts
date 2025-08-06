/**
 * Test setup configuration for typescript-pdf tests
 *
 * This file is automatically loaded by Vitest to set up the test environment.
 */

import { setupTestDOM } from '@/test/test-utils.js';

// Global test setup
globalThis.performance = globalThis.performance || {
    now: () => Date.now(),
};

// Setup DOM mocks using typed utilities
setupTestDOM();

// Re-export test utilities for convenience
export {
    createTestLayoutContext,
    createTestPaintContext,
    setupTestDOM,
    type TestPageFormat,
    type TestOrientation,
    type TestAlignment,
    type TestAxisAlignment,
    type TestCrossAxisAlignment,
    type TestStackFit,
    type TestChartMarker,
    type TestColumnWidthType,
} from '@/test/test-utils.js';
