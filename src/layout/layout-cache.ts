/**
 * Layout Caching System
 * 
 * Implements intelligent caching for layout results to improve performance
 * in complex widget trees with frequent relayouts.
 * 
 * @packageDocumentation
 */

import type { Size } from '../types/geometry.js';
import type { BoxConstraints, LayoutResult, LayoutContext } from '../types/layout.js';
import type { Widget } from '../widgets/widget.js';
import type { RenderObject } from './render-pipeline.js';

/**
 * Cache key for layout results
 */
interface LayoutCacheKey {
    widgetId: string;
    constraintsHash: string;
    contextHash: string;
}

/**
 * Cached layout entry
 */
interface LayoutCacheEntry {
    key: LayoutCacheKey;
    result: LayoutResult;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    dependencies: Set<string>;
}

/**
 * Cache invalidation reason
 */
export enum InvalidationReason {
    WidgetChanged = 'widget-changed',
    ConstraintsChanged = 'constraints-changed',
    ContextChanged = 'context-changed',
    DependencyChanged = 'dependency-changed',
    Manual = 'manual',
    Expired = 'expired',
}

/**
 * Cache statistics
 */
export interface CacheStats {
    totalEntries: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    evictionCount: number;
    memoryUsage: number;
}

/**
 * Advanced layout cache with dependency tracking and intelligent eviction
 */
export class LayoutCache {
    private readonly cache = new Map<string, LayoutCacheEntry>();
    private readonly maxEntries: number;
    private readonly maxAge: number;
    private readonly dependencyGraph = new Map<string, Set<string>>();

    private hitCount = 0;
    private missCount = 0;
    private evictionCount = 0;

    constructor(options: {
        maxEntries?: number;
        maxAge?: number; // in milliseconds
    } = {}) {
        this.maxEntries = options.maxEntries ?? 1000;
        this.maxAge = options.maxAge ?? 60000; // 1 minute default
    }

    /**
     * Get layout result from cache
     */
    get(
        widget: Widget,
        constraints: BoxConstraints,
        context: LayoutContext
    ): LayoutResult | undefined {
        const key = this.createCacheKey(widget, constraints, context);
        const cacheKey = this.keyToString(key);
        const entry = this.cache.get(cacheKey);

        if (!entry) {
            this.missCount++;
            return undefined;
        }

        // Check if entry is expired
        if (this.isExpired(entry)) {
            this.cache.delete(cacheKey);
            this.evictionCount++;
            this.missCount++;
            return undefined;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.hitCount++;

        return entry.result;
    }

    /**
     * Store layout result in cache
     */
    set(
        widget: Widget,
        constraints: BoxConstraints,
        context: LayoutContext,
        result: LayoutResult,
        dependencies: string[] = []
    ): void {
        const key = this.createCacheKey(widget, constraints, context);
        const cacheKey = this.keyToString(key);

        // Create cache entry
        const entry: LayoutCacheEntry = {
            key,
            result,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: Date.now(),
            dependencies: new Set(dependencies),
        };

        // Evict if cache is full
        if (this.cache.size >= this.maxEntries) {
            this.evictLeastRecentlyUsed();
        }

        // Store entry
        this.cache.set(cacheKey, entry);

        // Update dependency graph
        this.updateDependencyGraph(cacheKey, dependencies);
    }

    /**
     * Invalidate cache entries
     */
    invalidate(
        criteria: {
            widgetId?: string;
            reason?: InvalidationReason;
            dependency?: string;
        } = {}
    ): number {
        let invalidatedCount = 0;
        const toDelete: string[] = [];

        for (const [cacheKey, entry] of this.cache) {
            let shouldInvalidate = false;

            // Check widget ID match
            if (criteria.widgetId && entry.key.widgetId === criteria.widgetId) {
                shouldInvalidate = true;
            }

            // Check dependency match
            if (criteria.dependency && entry.dependencies.has(criteria.dependency)) {
                shouldInvalidate = true;
            }

            // Check expiration
            if (criteria.reason === InvalidationReason.Expired && this.isExpired(entry)) {
                shouldInvalidate = true;
            }

            if (shouldInvalidate) {
                toDelete.push(cacheKey);
            }
        }

        // Delete invalidated entries
        for (const cacheKey of toDelete) {
            this.cache.delete(cacheKey);
            this.removeDependencies(cacheKey);
            invalidatedCount++;
        }

        return invalidatedCount;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.dependencyGraph.clear();
        this.hitCount = 0;
        this.missCount = 0;
        this.evictionCount = 0;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const totalRequests = this.hitCount + this.missCount;
        const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;

        // Estimate memory usage (rough calculation)
        const memoryUsage = this.cache.size * 200; // Approximate bytes per entry

        return {
            totalEntries: this.cache.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate,
            evictionCount: this.evictionCount,
            memoryUsage,
        };
    }

    /**
     * Optimize cache by removing expired and rarely used entries
     */
    optimize(): number {
        let removedCount = 0;
        const now = Date.now();
        const toDelete: string[] = [];

        for (const [cacheKey, entry] of this.cache) {
            // Remove expired entries
            if (this.isExpired(entry)) {
                toDelete.push(cacheKey);
                continue;
            }

            // Remove rarely accessed entries that are old
            const age = now - entry.timestamp;
            const accessFrequency = entry.accessCount / Math.max(1, age / 1000); // accesses per second

            if (age > this.maxAge / 2 && accessFrequency < 0.001) { // Less than 1 access per 1000 seconds
                toDelete.push(cacheKey);
            }
        }

        // Delete identified entries
        for (const cacheKey of toDelete) {
            this.cache.delete(cacheKey);
            this.removeDependencies(cacheKey);
            removedCount++;
        }

        this.evictionCount += removedCount;
        return removedCount;
    }

    /**
     * Warm up cache with pre-computed layouts
     */
    warmUp(
        precomputedLayouts: Array<{
            widget: Widget;
            constraints: BoxConstraints;
            context: LayoutContext;
            result: LayoutResult;
            dependencies?: string[];
        }>
    ): void {
        for (const layout of precomputedLayouts) {
            this.set(
                layout.widget,
                layout.constraints,
                layout.context,
                layout.result,
                layout.dependencies
            );
        }
    }

    /**
     * Create cache key for widget, constraints, and context
     */
    private createCacheKey(
        widget: Widget,
        constraints: BoxConstraints,
        context: LayoutContext
    ): LayoutCacheKey {
        const widgetId = this.getWidgetId(widget);
        const constraintsHash = this.hashConstraints(constraints);
        const contextHash = this.hashContext(context);

        return {
            widgetId,
            constraintsHash,
            contextHash,
        };
    }

    /**
     * Convert cache key to string
     */
    private keyToString(key: LayoutCacheKey): string {
        return `${key.widgetId}:${key.constraintsHash}:${key.contextHash}`;
    }

    /**
     * Get unique identifier for widget
     */
    private getWidgetId(widget: Widget): string {
        return widget.key || widget.debugLabel || `${widget.constructor.name}@${this.hashObject(widget)}`;
    }

    /**
     * Hash constraints to string
     */
    private hashConstraints(constraints: BoxConstraints): string {
        return `${constraints.minWidth},${constraints.maxWidth},${constraints.minHeight},${constraints.maxHeight}`;
    }

    /**
     * Hash context to string
     */
    private hashContext(context: LayoutContext): string {
        return `${context.textDirection},${this.hashObject(context.theme)}`;
    }

    /**
     * Simple object hash function
     */
    private hashObject(obj: any): string {
        return JSON.stringify(obj).split('').reduce((hash, char) => {
            const charCode = char.charCodeAt(0);
            return ((hash << 5) - hash) + charCode;
        }, 0).toString(36);
    }

    /**
     * Check if cache entry is expired
     */
    private isExpired(entry: LayoutCacheEntry): boolean {
        return (Date.now() - entry.timestamp) > this.maxAge;
    }

    /**
     * Evict least recently used entry
     */
    private evictLeastRecentlyUsed(): void {
        let lruKey: string | undefined = undefined;
        let lruTime = Number.MAX_SAFE_INTEGER;

        for (const [cacheKey, entry] of this.cache) {
            if (entry.lastAccessed < lruTime) {
                lruTime = entry.lastAccessed;
                lruKey = cacheKey;
            }
        }

        if (lruKey) {
            this.cache.delete(lruKey);
            this.removeDependencies(lruKey);
            this.evictionCount++;
        }
    }

    /**
     * Update dependency graph
     */
    private updateDependencyGraph(cacheKey: string, dependencies: string[]): void {
        for (const dependency of dependencies) {
            if (!this.dependencyGraph.has(dependency)) {
                this.dependencyGraph.set(dependency, new Set());
            }
            this.dependencyGraph.get(dependency)!.add(cacheKey);
        }
    }

    /**
     * Remove dependencies for a cache key
     */
    private removeDependencies(cacheKey: string): void {
        for (const [dependency, dependents] of this.dependencyGraph) {
            dependents.delete(cacheKey);
            if (dependents.size === 0) {
                this.dependencyGraph.delete(dependency);
            }
        }
    }
}

/**
 * Smart cache that automatically manages multiple cache instances
 */
export class SmartLayoutCache {
    private readonly mainCache: LayoutCache;
    private readonly temporaryCache: LayoutCache;
    private readonly renderObjectCache = new Map<string, RenderObject>();

    constructor(options: {
        mainCacheSize?: number;
        temporaryCacheSize?: number;
        maxAge?: number;
    } = {}) {
        this.mainCache = new LayoutCache({
            maxEntries: options.mainCacheSize ?? 5000,
            maxAge: options.maxAge ?? 300000, // 5 minutes
        });

        this.temporaryCache = new LayoutCache({
            maxEntries: options.temporaryCacheSize ?? 1000,
            maxAge: options.maxAge ?? 30000, // 30 seconds
        });
    }

    /**
     * Get layout result, checking both caches
     */
    get(
        widget: Widget,
        constraints: BoxConstraints,
        context: LayoutContext
    ): LayoutResult | undefined {
        // Check main cache first
        let result = this.mainCache.get(widget, constraints, context);
        if (result) {
            return result;
        }

        // Check temporary cache
        result = this.temporaryCache.get(widget, constraints, context);
        if (result) {
            // Promote to main cache if accessed multiple times
            this.promoteToMainCache(widget, constraints, context, result);
            return result;
        }

        return undefined;
    }

    /**
     * Set layout result in appropriate cache
     */
    set(
        widget: Widget,
        constraints: BoxConstraints,
        context: LayoutContext,
        result: LayoutResult,
        options: {
            permanent?: boolean;
            dependencies?: string[];
        } = {}
    ): void {
        const cache = options.permanent ? this.mainCache : this.temporaryCache;
        cache.set(widget, constraints, context, result, options.dependencies);
    }

    /**
     * Invalidate entries in both caches
     */
    invalidate(criteria: Parameters<LayoutCache['invalidate']>[0] = {}): number {
        const mainInvalidated = this.mainCache.invalidate(criteria);
        const tempInvalidated = this.temporaryCache.invalidate(criteria);
        return mainInvalidated + tempInvalidated;
    }

    /**
     * Get combined cache statistics
     */
    getStats(): { main: CacheStats; temporary: CacheStats; combined: CacheStats } {
        const mainStats = this.mainCache.getStats();
        const tempStats = this.temporaryCache.getStats();

        const combined: CacheStats = {
            totalEntries: mainStats.totalEntries + tempStats.totalEntries,
            hitCount: mainStats.hitCount + tempStats.hitCount,
            missCount: mainStats.missCount + tempStats.missCount,
            hitRate: (mainStats.hitCount + tempStats.hitCount) /
                Math.max(1, mainStats.hitCount + tempStats.hitCount + mainStats.missCount + tempStats.missCount),
            evictionCount: mainStats.evictionCount + tempStats.evictionCount,
            memoryUsage: mainStats.memoryUsage + tempStats.memoryUsage,
        };

        return { main: mainStats, temporary: tempStats, combined };
    }

    /**
     * Optimize both caches
     */
    optimize(): number {
        return this.mainCache.optimize() + this.temporaryCache.optimize();
    }

    /**
     * Clear both caches
     */
    clear(): void {
        this.mainCache.clear();
        this.temporaryCache.clear();
        this.renderObjectCache.clear();
    }

    /**
     * Promote frequently accessed entry to main cache
     */
    private promoteToMainCache(
        widget: Widget,
        constraints: BoxConstraints,
        context: LayoutContext,
        result: LayoutResult
    ): void {
        this.mainCache.set(widget, constraints, context, result);
    }
}

/**
 * Global layout cache instance
 */
export const globalLayoutCache = new SmartLayoutCache();