/**
 * Font Loading and Caching System
 * 
 * Handles loading TTF fonts from various sources and caches them for reuse.
 * Supports both Node.js and browser environments.
 * 
 * @packageDocumentation
 */

import { TtfParser } from './ttf-parser.js';
import type { PdfDocument } from './document.js';

/**
 * Font source types
 */
export type FontSource = ArrayBuffer | Uint8Array | string;

/**
 * Font loading options
 */
export interface FontLoadOptions {
    /** Font family name (for identification) */
    family?: string;
    /** Font weight */
    weight?: 'normal' | 'bold';
    /** Font style */
    style?: 'normal' | 'italic';
    /** Whether to cache the font */
    cache?: boolean;
}

/**
 * Cached font entry
 */
interface CachedFont {
    /** Font parser instance */
    parser: TtfParser;
    /** Font family name */
    family: string;
    /** Font weight */
    weight: string;
    /** Font style */
    style: string;
    /** Raw font data */
    data: ArrayBuffer;
    /** Load timestamp */
    loadTime: number;
}

/**
 * Font loading statistics
 */
export interface FontLoadStats {
    /** Number of fonts loaded */
    fontsLoaded: number;
    /** Number of fonts cached */
    fontsCached: number;
    /** Total cache size in bytes */
    cacheSize: number;
    /** Cache hit rate (0-1) */
    hitRate: number;
}

/**
 * Font loader class for managing TTF fonts
 */
export class FontLoader {
    private static readonly cache = new Map<string, CachedFont>();
    private static loadCount = 0;
    private static hitCount = 0;

    /**
     * Load a font from various sources
     */
    static async loadFont(source: FontSource, options: FontLoadOptions = {}): Promise<TtfParser> {
        this.loadCount++;

        const cacheKey = this.generateCacheKey(source, options);

        // Check cache first
        if (options.cache !== false) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this.hitCount++;
                return cached.parser;
            }
        }

        // Load font data
        const fontData = await this.loadFontData(source);

        // Parse font
        const parser = new TtfParser(fontData);

        // Cache if enabled
        if (options.cache !== false) {
            const family = options.family || parser.fontName;
            const weight = options.weight || 'normal';
            const style = options.style || 'normal';

            this.cache.set(cacheKey, {
                parser,
                family,
                weight,
                style,
                data: fontData,
                loadTime: Date.now(),
            });
        }

        return parser;
    }

    /**
     * Load font from file path (Node.js only)
     */
    static async loadFromFile(filePath: string, options: FontLoadOptions = {}): Promise<TtfParser> {
        if (typeof window !== 'undefined') {
            throw new Error('File loading is not supported in browser environment');
        }

        return this.loadFont(filePath, options);
    }

    /**
     * Load font from URL (browser only)
     */
    static async loadFromUrl(url: string, options: FontLoadOptions = {}): Promise<TtfParser> {
        if (typeof window === 'undefined') {
            throw new Error('URL loading is not supported in Node.js environment');
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load font from URL: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return this.loadFont(arrayBuffer, options);
    }

    /**
     * Load font from base64 encoded data
     */
    static async loadFromBase64(base64Data: string, options: FontLoadOptions = {}): Promise<TtfParser> {
        // Remove data URL prefix if present
        const base64String = base64Data.replace(/^data:.*?;base64,/, '');

        // Decode base64
        const binaryString = typeof window !== 'undefined'
            ? atob(base64String)
            : Buffer.from(base64String, 'base64').toString('binary');

        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return this.loadFont(bytes.buffer, options);
    }

    /**
     * Get a cached font by family, weight, and style
     */
    static getCachedFont(family: string, weight = 'normal', style = 'normal'): TtfParser | undefined {
        for (const cached of this.cache.values()) {
            if (cached.family === family && cached.weight === weight && cached.style === style) {
                this.hitCount++;
                return cached.parser;
            }
        }
        return undefined;
    }

    /**
     * Preload multiple fonts
     */
    static async preloadFonts(fontSpecs: Array<{ source: FontSource; options?: FontLoadOptions }>): Promise<TtfParser[]> {
        const loadPromises = fontSpecs.map(({ source, options }) => this.loadFont(source, options));
        return Promise.all(loadPromises);
    }

    /**
     * Clear font cache
     */
    static clearCache(): void {
        this.cache.clear();
        this.loadCount = 0;
        this.hitCount = 0;
    }

    /**
     * Get font loading statistics
     */
    static getStats(): FontLoadStats {
        const cacheSize = Array.from(this.cache.values())
            .reduce((total, font) => total + font.data.byteLength, 0);

        return {
            fontsLoaded: this.loadCount,
            fontsCached: this.cache.size,
            cacheSize,
            hitRate: this.loadCount > 0 ? this.hitCount / this.loadCount : 0,
        };
    }

    /**
     * Get all cached font families
     */
    static getCachedFamilies(): string[] {
        const families = new Set<string>();
        for (const cached of this.cache.values()) {
            families.add(cached.family);
        }
        return Array.from(families).sort();
    }

    /**
     * Remove old fonts from cache (older than specified time)
     */
    static cleanCache(maxAge = 24 * 60 * 60 * 1000): void { // Default: 24 hours
        const cutoff = Date.now() - maxAge;
        const toRemove: string[] = [];

        for (const [key, cached] of this.cache.entries()) {
            if (cached.loadTime < cutoff) {
                toRemove.push(key);
            }
        }

        for (const key of toRemove) {
            this.cache.delete(key);
        }
    }

    /**
     * Load font data from various sources
     */
    private static async loadFontData(source: FontSource): Promise<ArrayBuffer> {
        if (source instanceof ArrayBuffer) {
            return source;
        }

        if (source instanceof Uint8Array) {
            return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
        }

        if (typeof source === 'string') {
            // Try to determine if it's a file path or URL
            if (source.startsWith('http://') || source.startsWith('https://')) {
                // URL - browser environment
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error(`Failed to load font from URL: ${response.statusText}`);
                }
                return response.arrayBuffer();
            } else {
                // File path - Node.js environment
                if (typeof window !== 'undefined') {
                    throw new Error('File path loading is not supported in browser environment');
                }

                // Dynamic import for Node.js
                const fs = await import('fs');
                const data = await fs.promises.readFile(source);
                return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            }
        }

        throw new Error('Unsupported font source type');
    }

    /**
     * Generate cache key for font
     */
    private static generateCacheKey(source: FontSource, options: FontLoadOptions): string {
        let sourceKey: string;

        if (source instanceof ArrayBuffer) {
            // Use hash of first few bytes for ArrayBuffer
            const bytes = new Uint8Array(source, 0, Math.min(32, source.byteLength));
            sourceKey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        } else if (source instanceof Uint8Array) {
            // Use hash of first few bytes for Uint8Array
            const bytes = source.slice(0, Math.min(32, source.length));
            sourceKey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Use string directly for paths/URLs
            sourceKey = source;
        }

        const optionsKey = JSON.stringify({
            family: options.family,
            weight: options.weight,
            style: options.style,
        });

        return `${sourceKey}:${optionsKey}`;
    }
}

/**
 * Font registry for managing fonts in a document
 */
export class FontRegistry {
    private readonly fonts = new Map<string, TtfParser>();
    private readonly document: PdfDocument;

    constructor(document: PdfDocument) {
        this.document = document;
    }

    /**
     * Register a font with the document
     */
    async registerFont(
        name: string,
        source: FontSource,
        options: FontLoadOptions = {}
    ): Promise<TtfParser> {
        if (this.fonts.has(name)) {
            return this.fonts.get(name)!;
        }

        const parser = await FontLoader.loadFont(source, options);
        this.fonts.set(name, parser);
        return parser;
    }

    /**
     * Get a registered font by name
     */
    getFont(name: string): TtfParser | undefined {
        return this.fonts.get(name);
    }

    /**
     * Get all registered font names
     */
    getFontNames(): string[] {
        return Array.from(this.fonts.keys());
    }

    /**
     * Check if a font is registered
     */
    hasFont(name: string): boolean {
        return this.fonts.has(name);
    }

    /**
     * Remove a font from the registry
     */
    removeFont(name: string): boolean {
        return this.fonts.delete(name);
    }

    /**
     * Clear all fonts from the registry
     */
    clear(): void {
        this.fonts.clear();
    }
}