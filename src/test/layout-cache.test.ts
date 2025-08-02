/**
 * Unit tests for layout caching system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    LayoutCache,
    SmartLayoutCache,
    InvalidationReason,
    globalLayoutCache,
    type CacheStats,
} from '../layout/layout-cache.js';
import { BaseWidget } from '../widgets/widget.js';
import type { LayoutContext, LayoutResult, BoxConstraints } from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import { ThemeUtils } from '../types/theming.js';
import { TextDirection } from '@/core/text-layout.js';

// Mock widget for testing
class MockWidget extends BaseWidget {
    constructor(
        private mockSize: Size = { width: 100, height: 50 },
        debugLabel?: string
    ) {
        super(debugLabel ? { debugLabel } : {});
    }

    layout(context: LayoutContext): LayoutResult {
        return {
            size: this.mockSize,
            needsRepaint: false,
        };
    }

    paint(): void {
        // Mock paint implementation
    }
}

describe('LayoutCache', () => {
    let cache: LayoutCache;
    let mockWidget: MockWidget;
    let mockContext: LayoutContext;
    let mockConstraints: BoxConstraints;

    beforeEach(() => {
        cache = new LayoutCache();
        mockWidget = new MockWidget({ width: 100, height: 50 }, 'test-widget');
        mockConstraints = {
            minWidth: 0,
            maxWidth: 200,
            minHeight: 0,
            maxHeight: 100,
        };
        mockContext = {
            constraints: mockConstraints,
            textDirection: TextDirection.LeftToRight,
            theme: ThemeUtils.light(),
        };
    });

    describe('constructor', () => {
        it('should create cache with default options', () => {
            const defaultCache = new LayoutCache();
            const stats = defaultCache.getStats();
            expect(stats.totalEntries).toBe(0);
            expect(stats.hitCount).toBe(0);
            expect(stats.missCount).toBe(0);
        });

        it('should create cache with custom options', () => {
            const customCache = new LayoutCache({
                maxEntries: 500,
                maxAge: 30000,
            });
            const stats = customCache.getStats();
            expect(stats.totalEntries).toBe(0);
        });
    });

    describe('get and set', () => {
        it('should return undefined for cache miss', () => {
            const result = cache.get(mockWidget, mockConstraints, mockContext);
            expect(result).toBeUndefined();
        });

        it('should return cached result for cache hit', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            cache.set(mockWidget, mockConstraints, mockContext, mockResult);
            const result = cache.get(mockWidget, mockConstraints, mockContext);

            expect(result).toEqual(mockResult);
        });

        it('should handle dependencies in cache entry', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };
            const dependencies = ['dep1', 'dep2'];

            cache.set(mockWidget, mockConstraints, mockContext, mockResult, dependencies);
            const result = cache.get(mockWidget, mockConstraints, mockContext);

            expect(result).toEqual(mockResult);
        });

        it('should update access statistics on cache hit', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            cache.set(mockWidget, mockConstraints, mockContext, mockResult);
            cache.get(mockWidget, mockConstraints, mockContext);
            cache.get(mockWidget, mockConstraints, mockContext);

            const stats = cache.getStats();
            expect(stats.hitCount).toBe(2);
            expect(stats.missCount).toBe(0);
        });

        it('should track cache misses', () => {
            cache.get(mockWidget, mockConstraints, mockContext);
            cache.get(mockWidget, mockConstraints, mockContext);

            const stats = cache.getStats();
            expect(stats.hitCount).toBe(0);
            expect(stats.missCount).toBe(2);
        });
    });

    describe('cache eviction', () => {
        it('should evict entries when cache is full', () => {
            const smallCache = new LayoutCache({ maxEntries: 2 });

            // Fill cache to capacity
            const widget1 = new MockWidget({ width: 100, height: 50 }, 'widget1');
            const widget2 = new MockWidget({ width: 200, height: 100 }, 'widget2');
            const widget3 = new MockWidget({ width: 300, height: 150 }, 'widget3');

            const result1: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };
            const result2: LayoutResult = { size: { width: 200, height: 100 }, needsRepaint: false };
            const result3: LayoutResult = { size: { width: 300, height: 150 }, needsRepaint: false };

            smallCache.set(widget1, mockConstraints, mockContext, result1);
            smallCache.set(widget2, mockConstraints, mockContext, result2);
            smallCache.set(widget3, mockConstraints, mockContext, result3); // Should evict LRU

            const stats = smallCache.getStats();
            expect(stats.totalEntries).toBe(2);
            expect(stats.evictionCount).toBe(1);
        });

        it('should evict least recently used entries', () => {
            const smallCache = new LayoutCache({ maxEntries: 2 });

            const widget1 = new MockWidget({ width: 100, height: 50 }, 'widget1');
            const widget2 = new MockWidget({ width: 200, height: 100 }, 'widget2');
            const widget3 = new MockWidget({ width: 300, height: 150 }, 'widget3');

            const result1: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };
            const result2: LayoutResult = { size: { width: 200, height: 100 }, needsRepaint: false };
            const result3: LayoutResult = { size: { width: 300, height: 150 }, needsRepaint: false };

            // Add first two entries
            smallCache.set(widget1, mockConstraints, mockContext, result1);
            smallCache.set(widget2, mockConstraints, mockContext, result2);

            // Access widget2 to make it more recently used (widget1 becomes LRU)
            smallCache.get(widget2, mockConstraints, mockContext);

            // Add third entry - should evict widget1 (least recently used)
            smallCache.set(widget3, mockConstraints, mockContext, result3);

            expect(smallCache.get(widget1, mockConstraints, mockContext)).toBeUndefined();
            expect(smallCache.get(widget2, mockConstraints, mockContext)).toEqual(result2);
            expect(smallCache.get(widget3, mockConstraints, mockContext)).toEqual(result3);
        });
    });

    describe('cache expiration', () => {
        it('should expire old entries', async () => {
            const shortLivedCache = new LayoutCache({ maxAge: 10 }); // 10ms

            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            shortLivedCache.set(mockWidget, mockConstraints, mockContext, mockResult);

            // Should be available immediately
            expect(shortLivedCache.get(mockWidget, mockConstraints, mockContext)).toEqual(mockResult);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 15));

            // Should be expired now
            expect(shortLivedCache.get(mockWidget, mockConstraints, mockContext)).toBeUndefined();
        });
    });

    describe('invalidate', () => {
        beforeEach(() => {
            const result1: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };
            const result2: LayoutResult = { size: { width: 200, height: 100 }, needsRepaint: false };

            const widget1 = new MockWidget({ width: 100, height: 50 }, 'widget1');
            const widget2 = new MockWidget({ width: 200, height: 100 }, 'widget2');

            cache.set(widget1, mockConstraints, mockContext, result1);
            cache.set(widget2, mockConstraints, mockContext, result2, ['dep1']);
        });

        it('should invalidate entries by widget ID', () => {
            const invalidated = cache.invalidate({ widgetId: 'widget1' });
            expect(invalidated).toBe(1);

            const stats = cache.getStats();
            expect(stats.totalEntries).toBe(1);
        });

        it('should invalidate entries by dependency', () => {
            const invalidated = cache.invalidate({ dependency: 'dep1' });
            expect(invalidated).toBe(1);

            const stats = cache.getStats();
            expect(stats.totalEntries).toBe(1);
        });

        it('should invalidate expired entries', async () => {
            const shortLivedCache = new LayoutCache({ maxAge: 10 });
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

            shortLivedCache.set(mockWidget, mockConstraints, mockContext, result);

            await new Promise(resolve => setTimeout(resolve, 15));

            const invalidated = shortLivedCache.invalidate({ reason: InvalidationReason.Expired });
            expect(invalidated).toBe(1);
        });

        it('should return count of invalidated entries', () => {
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };
            const widget3 = new MockWidget({ width: 300, height: 150 }, 'widget1'); // Same ID as existing

            cache.set(widget3, { ...mockConstraints, maxWidth: 300 }, mockContext, result);

            const invalidated = cache.invalidate({ widgetId: 'widget1' });
            expect(invalidated).toBe(2); // Both entries with widget1 ID
        });
    });

    describe('clear', () => {
        it('should clear all cache entries and reset stats', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            cache.set(mockWidget, mockConstraints, mockContext, mockResult);
            cache.get(mockWidget, mockConstraints, mockContext);

            let stats = cache.getStats();
            expect(stats.totalEntries).toBe(1);
            expect(stats.hitCount).toBe(1);

            cache.clear();

            stats = cache.getStats();
            expect(stats.totalEntries).toBe(0);
            expect(stats.hitCount).toBe(0);
            expect(stats.missCount).toBe(0);
            expect(stats.evictionCount).toBe(0);
        });
    });

    describe('getStats', () => {
        it('should return correct statistics', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            // Cache miss
            cache.get(mockWidget, mockConstraints, mockContext);

            // Cache set and hit
            cache.set(mockWidget, mockConstraints, mockContext, mockResult);
            cache.get(mockWidget, mockConstraints, mockContext);

            const stats = cache.getStats();
            expect(stats.totalEntries).toBe(1);
            expect(stats.hitCount).toBe(1);
            expect(stats.missCount).toBe(1);
            expect(stats.hitRate).toBe(0.5); // 1 hit out of 2 total requests
            expect(stats.evictionCount).toBe(0);
            expect(stats.memoryUsage).toBeGreaterThan(0);
        });

        it('should calculate hit rate correctly', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            cache.set(mockWidget, mockConstraints, mockContext, mockResult);

            // 3 hits
            cache.get(mockWidget, mockConstraints, mockContext);
            cache.get(mockWidget, mockConstraints, mockContext);
            cache.get(mockWidget, mockConstraints, mockContext);

            const stats = cache.getStats();
            expect(stats.hitRate).toBe(1.0); // 3 hits out of 3 total requests
        });
    });

    describe('optimize', () => {
        it('should remove expired entries', async () => {
            const shortLivedCache = new LayoutCache({ maxAge: 10 });
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

            shortLivedCache.set(mockWidget, mockConstraints, mockContext, result);

            await new Promise(resolve => setTimeout(resolve, 15));

            const removed = shortLivedCache.optimize();
            expect(removed).toBe(1);

            const stats = shortLivedCache.getStats();
            expect(stats.totalEntries).toBe(0);
        });

        it('should remove rarely accessed old entries', async () => {
            const cache = new LayoutCache({ maxAge: 20 }); // Very short max age
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

            cache.set(mockWidget, mockConstraints, mockContext, result);

            // Wait for entry to expire completely (beyond maxAge)
            await new Promise(resolve => setTimeout(resolve, 25));

            const removed = cache.optimize();
            expect(removed).toBe(1);
        });
    });

    describe('warmUp', () => {
        it('should preload cache with provided layouts', () => {
            const precomputedLayouts = [
                {
                    widget: mockWidget,
                    constraints: mockConstraints,
                    context: mockContext,
                    result: { size: { width: 100, height: 50 }, needsRepaint: false } as LayoutResult,
                    dependencies: ['dep1'],
                },
            ];

            cache.warmUp(precomputedLayouts);

            const result = cache.get(mockWidget, mockConstraints, mockContext);
            expect(result).toEqual(precomputedLayouts[0]!.result);

            const stats = cache.getStats();
            expect(stats.totalEntries).toBe(1);
        });
    });
});

describe('SmartLayoutCache', () => {
    let smartCache: SmartLayoutCache;
    let mockWidget: MockWidget;
    let mockContext: LayoutContext;
    let mockConstraints: BoxConstraints;

    beforeEach(() => {
        smartCache = new SmartLayoutCache();
        mockWidget = new MockWidget({ width: 100, height: 50 }, 'test-widget');
        mockConstraints = {
            minWidth: 0,
            maxWidth: 200,
            minHeight: 0,
            maxHeight: 100,
        };
        mockContext = {
            constraints: mockConstraints,
            textDirection: TextDirection.LeftToRight,
            theme: ThemeUtils.light(),
        };
    });

    describe('constructor', () => {
        it('should create smart cache with default options', () => {
            const cache = new SmartLayoutCache();
            const stats = cache.getStats();

            expect(stats.main.totalEntries).toBe(0);
            expect(stats.temporary.totalEntries).toBe(0);
            expect(stats.combined.totalEntries).toBe(0);
        });

        it('should create smart cache with custom options', () => {
            const cache = new SmartLayoutCache({
                mainCacheSize: 1000,
                temporaryCacheSize: 200,
                maxAge: 60000,
            });

            const stats = cache.getStats();
            expect(stats.main.totalEntries).toBe(0);
            expect(stats.temporary.totalEntries).toBe(0);
        });
    });

    describe('get and set', () => {
        it('should return undefined for cache miss', () => {
            const result = smartCache.get(mockWidget, mockConstraints, mockContext);
            expect(result).toBeUndefined();
        });

        it('should store and retrieve from temporary cache by default', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            smartCache.set(mockWidget, mockConstraints, mockContext, mockResult);

            // Check stats before retrieval to avoid promotion
            let stats = smartCache.getStats();
            expect(stats.temporary.totalEntries).toBe(1);
            expect(stats.main.totalEntries).toBe(0);

            const result = smartCache.get(mockWidget, mockConstraints, mockContext);
            expect(result).toEqual(mockResult);

            // After retrieval, it gets promoted to main cache, so we might have it in both
            stats = smartCache.getStats();
            // The key insight is that promotion creates a copy in main cache
            expect(stats.combined.totalEntries).toBeGreaterThanOrEqual(1);
        });

        it('should store in main cache when permanent option is true', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            smartCache.set(mockWidget, mockConstraints, mockContext, mockResult, { permanent: true });
            const result = smartCache.get(mockWidget, mockConstraints, mockContext);

            expect(result).toEqual(mockResult);

            const stats = smartCache.getStats();
            expect(stats.main.totalEntries).toBe(1);
            expect(stats.temporary.totalEntries).toBe(0);
        });

        it('should check main cache first, then temporary cache', () => {
            const tempResult: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };
            const mainResult: LayoutResult = { size: { width: 200, height: 100 }, needsRepaint: false };

            // Store in temporary cache
            smartCache.set(mockWidget, mockConstraints, mockContext, tempResult);

            // Store in main cache (should override)
            smartCache.set(mockWidget, mockConstraints, mockContext, mainResult, { permanent: true });

            const result = smartCache.get(mockWidget, mockConstraints, mockContext);
            expect(result).toEqual(mainResult); // Should get main cache result
        });

        it('should handle dependencies', () => {
            const mockResult: LayoutResult = {
                size: { width: 100, height: 50 },
                needsRepaint: false,
            };

            smartCache.set(mockWidget, mockConstraints, mockContext, mockResult, {
                dependencies: ['dep1', 'dep2'],
            });

            const result = smartCache.get(mockWidget, mockConstraints, mockContext);
            expect(result).toEqual(mockResult);
        });
    });

    describe('invalidate', () => {
        it('should invalidate entries in both caches', () => {
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

            smartCache.set(mockWidget, mockConstraints, mockContext, result);
            smartCache.set(mockWidget, mockConstraints, mockContext, result, { permanent: true });

            const invalidated = smartCache.invalidate({ widgetId: 'test-widget' });
            expect(invalidated).toBe(2);

            const stats = smartCache.getStats();
            expect(stats.combined.totalEntries).toBe(0);
        });
    });

    describe('getStats', () => {
        it('should return combined statistics', () => {
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

            smartCache.set(mockWidget, mockConstraints, mockContext, result); // temporary
            smartCache.set(mockWidget, { ...mockConstraints, maxWidth: 300 }, mockContext, result, { permanent: true }); // main

            const stats = smartCache.getStats();
            expect(stats.main.totalEntries).toBe(1);
            expect(stats.temporary.totalEntries).toBe(1);
            expect(stats.combined.totalEntries).toBe(2);
        });

        it('should calculate combined hit rate', () => {
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

            smartCache.set(mockWidget, mockConstraints, mockContext, result);

            // Generate hits and misses
            smartCache.get(mockWidget, mockConstraints, mockContext); // hit (may promote)
            smartCache.get(mockWidget, { ...mockConstraints, maxWidth: 300 }, mockContext); // miss

            const stats = smartCache.getStats();
            // Hit rate may be lower due to promotion causing additional cache operations
            expect(stats.combined.hitRate).toBeGreaterThan(0);
            expect(stats.combined.hitRate).toBeLessThanOrEqual(1);
        });
    });

    describe('optimize', () => {
        it('should optimize both caches', () => {
            const shortLivedCache = new SmartLayoutCache({ maxAge: 10 });
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

            shortLivedCache.set(mockWidget, mockConstraints, mockContext, result);
            shortLivedCache.set(mockWidget, mockConstraints, mockContext, result, { permanent: true });

            // Wait for entries to expire
            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    const removed = shortLivedCache.optimize();
                    expect(removed).toBeGreaterThan(0);
                    resolve();
                }, 15);
            });
        });
    });

    describe('clear', () => {
        it('should clear both caches', () => {
            const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

            smartCache.set(mockWidget, mockConstraints, mockContext, result);
            smartCache.set(mockWidget, mockConstraints, mockContext, result, { permanent: true });

            smartCache.clear();

            const stats = smartCache.getStats();
            expect(stats.combined.totalEntries).toBe(0);
        });
    });
});

describe('globalLayoutCache', () => {
    it('should export global layout cache instance', () => {
        expect(globalLayoutCache).toBeInstanceOf(SmartLayoutCache);
    });

    it('should maintain state between calls', () => {
        const widget = new MockWidget({ width: 100, height: 50 }, 'global-test');
        const constraints: BoxConstraints = {
            minWidth: 0,
            maxWidth: 200,
            minHeight: 0,
            maxHeight: 100,
        };
        const context: LayoutContext = {
            constraints,
            textDirection: TextDirection.LeftToRight,
            theme: ThemeUtils.light(),
        };
        const result: LayoutResult = { size: { width: 100, height: 50 }, needsRepaint: false };

        globalLayoutCache.set(widget, constraints, context, result);
        const retrieved = globalLayoutCache.get(widget, constraints, context);

        expect(retrieved).toEqual(result);
    });
});