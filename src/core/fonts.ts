/**
 * Consolidated Font System
 * 
 * Complete font management system combining all font functionality:
 * - High-level font management API
 * - Font fallback and resolution system  
 * - Unified registry for standard and custom fonts
 * - Font loading, caching, and metrics
 * - Text layout and measurement
 * 
 * Replaces 9+ fragmented font files with single unified system.
 * 
 * @packageDocumentation
 */


import type { PdfDocument } from './pdf/font-engine.js';
import { PdfStandardFont, PdfFont } from './pdf/font-engine.js';

/**
 * Font weight enumeration
 */
export enum FontWeight {
    Thin = 100,
    ExtraLight = 200,
    Light = 300,
    Normal = 400,
    Medium = 500,
    SemiBold = 600,
    Bold = 700,
    ExtraBold = 800,
    Black = 900,
}

/**
 * Font style enumeration
 */
export enum FontStyle {
    Normal = 'normal',
    Italic = 'italic',
    Oblique = 'oblique',
}

/**
 * Font categories for fallback system
 */
export enum FontCategory {
    Serif = 'serif',
    SansSerif = 'sans-serif',
    Monospace = 'monospace',
    Cursive = 'cursive',
    Fantasy = 'fantasy',
}

/**
 * Font source types
 */
export type FontSource = ArrayBuffer | Uint8Array | string;

/**
 * Font loading options
 */
export interface FontLoadOptions {
    family?: string;
    weight?: FontWeight;
    style?: FontStyle;
    cache?: boolean;
}

/**
 * Font descriptor for registration
 */
export interface FontDescriptor {
    family: string;
    weight?: FontWeight;
    style?: FontStyle;
    source?: FontSource;
    displayName?: string;
    options?: FontLoadOptions;
}

/**
 * Text style configuration
 */
export interface TextStyleConfig {
    fontFamily?: string | string[];
    fontSize?: number;
    fontWeight?: FontWeight;
    fontStyle?: FontStyle;
    lineHeight?: number;
    letterSpacing?: number;
    wordSpacing?: number;
    color?: string;
}

/**
 * Font metrics information
 */
export interface FontMetrics {
    family: string;
    unitsPerEm: number;
    ascender: number;
    descender: number;
    lineGap: number;
    boundingBox: {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    };
    glyphCount: number;
}

/**
 * Universal font interface for both standard PDF fonts and custom TTF fonts
 */
export interface UniversalFont {
    name: string;
    fontFamily: string;
    type: 'standard' | 'ttf';
    measureTextWidth(text: string, fontSize: number): number;
    getFontHeight(fontSize: number): number;
    getAscender(fontSize: number): number;
    getDescender(fontSize: number): number;
    getUnderlyingFont(): PdfFont | FontParser;
}

/**
 * Font fallback rule
 */
interface FontFallbackRule {
    pattern: RegExp | string;
    fallbacks: PdfStandardFont[];
}

/**
 * Font loading statistics
 */
export interface FontLoadStats {
    fontsLoaded: number;
    fontsCached: number;
    cacheSize: number;
    hitRate: number;
}

/**
 * Cached font entry
 */
interface FontParser {
    fontName?: string;
    unitsPerEm: number;
    ascent: number;
    descent: number;
    measureText(text: string): number;
}

interface CachedFont {
    parser: FontParser;
    family: string;
    weight: string;
    style: string;
    data: ArrayBuffer;
    loadTime: number;
}

/**
 * Standard Font Adapter - wraps PdfFont as UniversalFont
 */
class StandardFontAdapter implements UniversalFont {
    public readonly type = 'standard' as const;
    private readonly pdfFont: PdfFont;

    constructor(pdfFont: PdfFont) {
        this.pdfFont = pdfFont;
    }

    get name(): string {
        return this.pdfFont.name;
    }

    get fontFamily(): string {
        return this.pdfFont.fontName;
    }

    measureTextWidth(text: string, fontSize: number): number {
        return this.pdfFont.measureTextWidth(text, fontSize);
    }

    getFontHeight(fontSize: number): number {
        return this.pdfFont.getFontHeight(fontSize);
    }

    getAscender(fontSize: number): number {
        return this.pdfFont.getAscender(fontSize);
    }

    getDescender(fontSize: number): number {
        return this.pdfFont.getDescender(fontSize);
    }

    getUnderlyingFont(): PdfFont {
        return this.pdfFont;
    }
}

/**
 * Font Fallback System
 * 
 * Provides intelligent font fallback when requested fonts are unavailable
 */
class FontFallbackSystem {
    private readonly fallbackRules: FontFallbackRule[] = [];
    private readonly genericFallbacks: Record<FontCategory, PdfStandardFont[]> = {
        [FontCategory.Serif]: [
            PdfStandardFont.TimesRoman,
            PdfStandardFont.TimesBold,
            PdfStandardFont.TimesItalic,
            PdfStandardFont.TimesBoldItalic,
        ],
        [FontCategory.SansSerif]: [
            PdfStandardFont.Helvetica,
            PdfStandardFont.HelveticaBold,
            PdfStandardFont.HelveticaOblique,
            PdfStandardFont.HelveticaBoldOblique,
        ],
        [FontCategory.Monospace]: [
            PdfStandardFont.Courier,
            PdfStandardFont.CourierBold,
            PdfStandardFont.CourierOblique,
            PdfStandardFont.CourierBoldOblique,
        ],
        [FontCategory.Cursive]: [
            PdfStandardFont.TimesItalic,
            PdfStandardFont.HelveticaOblique,
        ],
        [FontCategory.Fantasy]: [
            PdfStandardFont.Symbol,
            PdfStandardFont.ZapfDingbats,
            PdfStandardFont.Helvetica,
        ],
    };

    constructor() {
        this.initializeDefaultRules();
    }

    private initializeDefaultRules(): void {
        // Arial/Helvetica mappings
        this.addFallbackRule({
            pattern: /^(Arial|Helvetica)/i,
            fallbacks: [
                PdfStandardFont.Helvetica,
                PdfStandardFont.HelveticaBold,
                PdfStandardFont.HelveticaOblique,
                PdfStandardFont.HelveticaBoldOblique,
            ],
        });

        // Times/serif mappings
        this.addFallbackRule({
            pattern: /^(Times|Georgia|serif)/i,
            fallbacks: [
                PdfStandardFont.TimesRoman,
                PdfStandardFont.TimesBold,
                PdfStandardFont.TimesItalic,
                PdfStandardFont.TimesBoldItalic,
            ],
        });

        // Monospace mappings
        this.addFallbackRule({
            pattern: /^(Courier|Monaco|Consolas|monospace)/i,
            fallbacks: [
                PdfStandardFont.Courier,
                PdfStandardFont.CourierBold,
                PdfStandardFont.CourierOblique,
                PdfStandardFont.CourierBoldOblique,
            ],
        });

        // System font mappings
        this.addFallbackRule({
            pattern: /^(-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|sans-serif)/i,
            fallbacks: this.genericFallbacks[FontCategory.SansSerif],
        });
    }

    addFallbackRule(rule: FontFallbackRule): void {
        this.fallbackRules.push(rule);
    }

    resolveFontDescriptor(descriptor: FontDescriptor): PdfStandardFont {
        const { family, weight, style } = descriptor;

        // Try to find specific rule match
        for (const rule of this.fallbackRules) {
            let matches = false;
            if (typeof rule.pattern === 'string') {
                matches = family.toLowerCase().includes(rule.pattern.toLowerCase());
            } else {
                matches = rule.pattern.test(family);
            }

            if (matches) {
                return this.selectBestFontFromFallbacks(rule.fallbacks, weight, style);
            }
        }

        // Fall back to generic categories
        const category = this.categorizeFont(family);
        const fallbacks = this.genericFallbacks[category];
        return this.selectBestFontFromFallbacks(fallbacks, weight, style);
    }

    private categorizeFont(family: string): FontCategory {
        const lowerFamily = family.toLowerCase();

        if (lowerFamily.includes('mono') || lowerFamily.includes('courier') || lowerFamily.includes('console')) {
            return FontCategory.Monospace;
        }

        if ((lowerFamily.includes('serif') && !lowerFamily.includes('sans')) ||
            lowerFamily.includes('times') || lowerFamily.includes('georgia')) {
            return FontCategory.Serif;
        }

        if (lowerFamily.includes('sans') || lowerFamily.includes('arial') || lowerFamily.includes('helvetica')) {
            return FontCategory.SansSerif;
        }

        return FontCategory.SansSerif; // Default
    }

    private selectBestFontFromFallbacks(
        fallbacks: PdfStandardFont[],
        weight?: FontWeight,
        style?: FontStyle
    ): PdfStandardFont {
        const normalizedWeight = weight === FontWeight.Bold ? 'bold' : 'normal';
        const normalizedStyle = style === FontStyle.Italic ? 'italic' : 'normal';

        // Score each fallback font
        const scoredFonts = fallbacks.map(font => ({
            font,
            score: this.scoreFontMatch(font, normalizedWeight, normalizedStyle),
        }));

        // Sort by score and return best match
        scoredFonts.sort((a, b) => b.score - a.score);
        return scoredFonts[0]?.font ?? PdfStandardFont.Helvetica;
    }

    private scoreFontMatch(font: PdfStandardFont, targetWeight: string, targetStyle: string): number {
        let score = 10; // Base score

        // Weight matching
        const isBold = font.includes('Bold');
        if ((targetWeight === 'bold' && isBold) || (targetWeight === 'normal' && !isBold)) {
            score += 5;
        }

        // Style matching
        const isItalic = font.includes('Italic') || font.includes('Oblique');
        if ((targetStyle === 'italic' && isItalic) || (targetStyle === 'normal' && !isItalic)) {
            score += 5;
        }

        return score;
    }

    getFallbackChain(family: string): PdfStandardFont[] {
        const descriptor: FontDescriptor = { family, weight: FontWeight.Normal, style: FontStyle.Normal };
        const primaryFont = this.resolveFontDescriptor(descriptor);
        const category = this.categorizeFont(family);
        const categoryFallbacks = this.genericFallbacks[category];

        const chain = [primaryFont];
        for (const fallback of categoryFallbacks) {
            if (!chain.includes(fallback)) {
                chain.push(fallback);
            }
        }

        if (!chain.includes(PdfStandardFont.Helvetica)) {
            chain.push(PdfStandardFont.Helvetica);
        }

        return chain;
    }

    isNativelySupported(family: string): boolean {
        return Object.values(PdfStandardFont).includes(family as PdfStandardFont);
    }
}

/**
 * Font Loader for TTF fonts with caching
 */
class FontLoader {
    private static readonly cache = new Map<string, CachedFont>();
    private static loadCount = 0;
    private static hitCount = 0;

    static async loadFont(source: FontSource, options: FontLoadOptions = {}): Promise<unknown> {
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

        // For now, create a mock parser since TTF parsing is complex
        const parser = {
            fontName: options.family ?? 'CustomFont',
            unitsPerEm: 1000,
            ascent: 800,
            descent: -200,
            measureText: (text: string) => text.length * 500,
            isCharSupported: () => true,
        };

        // Cache if enabled
        if (options.cache !== false) {
            this.cache.set(cacheKey, {
                parser,
                family: options.family ?? 'CustomFont',
                weight: options.weight?.toString() ?? 'normal',
                style: options.style ?? 'normal',
                data: fontData,
                loadTime: Date.now(),
            });
        }

        return parser;
    }

    static clearCache(): void {
        this.cache.clear();
        this.loadCount = 0;
        this.hitCount = 0;
    }

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

    private static async loadFontData(source: FontSource): Promise<ArrayBuffer> {
        if (source instanceof ArrayBuffer) { return source; }

        if (source instanceof Uint8Array) {
            return (source.buffer as ArrayBuffer).slice(source.byteOffset, source.byteOffset + source.byteLength);
        }

        if (typeof source === 'string') {
            if (source.startsWith('http://') || source.startsWith('https://')) {
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error(`Failed to load font: ${response.statusText}`);
                }
                return response.arrayBuffer();
            }
            // File path for Node.js
            if (typeof window !== 'undefined') {
                throw new Error('File loading not supported in browser');
            }
            const fs = await import('fs');
            const data = await fs.promises.readFile(source);
            return (data.buffer as ArrayBuffer).slice(data.byteOffset, data.byteOffset + data.byteLength);

        }

        throw new Error('Unsupported font source type');
    }

    private static generateCacheKey(source: FontSource, options: FontLoadOptions): string {
        let sourceKey: string;

        if (source instanceof ArrayBuffer) {
            const bytes = new Uint8Array(source, 0, Math.min(32, source.byteLength));
            sourceKey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        } else if (source instanceof Uint8Array) {
            const bytes = source.slice(0, Math.min(32, source.length));
            sourceKey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
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
 * Unified Font System - Main API
 * 
 * Combines all font functionality into a single, easy-to-use system
 */
export class FontSystem {
    private readonly document: PdfDocument;
    private readonly fallbackSystem: FontFallbackSystem;
    private readonly standardFonts = new Map<string, PdfFont>();
    private readonly customFonts = new Map<string, unknown>();
    private readonly unifiedFonts = new Map<string, UniversalFont>();

    constructor(document: PdfDocument) {
        this.document = document;
        this.fallbackSystem = new FontFallbackSystem();
    }

    /**
     * Register a standard PDF font
     */
    registerStandardFont(fontName: PdfStandardFont, name?: string): UniversalFont {
        const registrationName = name ?? fontName;

        const font = this.unifiedFonts.get(registrationName);
        if (font) { return font; }

        // Create PDF font through engine
        const pdfFont = new PdfFont(this.document, fontName, name);
        this.standardFonts.set(registrationName, pdfFont);

        // Create universal adapter
        const adapter = new StandardFontAdapter(pdfFont);
        this.unifiedFonts.set(registrationName, adapter);

        return adapter;
    }

    /**
     * Register a custom TTF font
     */
    async registerCustomFont(name: string, source: FontSource, options: FontLoadOptions = {}): Promise<UniversalFont> {
        const font = this.unifiedFonts.get(name);
        if (font) { return font; }

        // Load TTF font
        const parser = await FontLoader.loadFont(source, options);
        this.customFonts.set(name, parser);

        // Create TTF adapter with proper type assertions
        const typedParser = parser as FontParser;
        const adapter: UniversalFont = {
            name,
            fontFamily: typedParser.fontName ?? name,
            type: 'ttf',
            measureTextWidth: (text: string, fontSize: number) => {
                const fontUnits = typedParser.measureText(text);
                return (fontUnits * fontSize) / typedParser.unitsPerEm;
            },
            getFontHeight: (fontSize: number) => {
                return ((typedParser.ascent - typedParser.descent) * fontSize) / typedParser.unitsPerEm;
            },
            getAscender: (fontSize: number) => {
                return (typedParser.ascent * fontSize) / typedParser.unitsPerEm;
            },
            getDescender: (fontSize: number) => {
                return (typedParser.descent * fontSize) / typedParser.unitsPerEm;
            },
            getUnderlyingFont: () => parser as FontParser,
        };

        this.unifiedFonts.set(name, adapter);
        return adapter;
    }

    /**
     * Get font with intelligent fallback
     */
    getFont(fontNameOrFamily: string | PdfStandardFont, name?: string): UniversalFont {
        // Check if it's a standard PDF font
        if (Object.values(PdfStandardFont).includes(fontNameOrFamily as PdfStandardFont)) {
            return this.registerStandardFont(fontNameOrFamily as PdfStandardFont, name);
        }

        // Check unified fonts
        const fontName = name ?? fontNameOrFamily;
        const font = this.unifiedFonts.get(fontName);
        if (font) { return font; }

        // Use fallback system
        const fallbackFont = this.fallbackSystem.resolveFontDescriptor({
            family: fontNameOrFamily,
            weight: FontWeight.Normal,
            style: FontStyle.Normal,
        });

        return this.registerStandardFont(fallbackFont);
    }

    /**
     * Get font with weight and style resolution
     */
    getFontWithStyle(
        family: string | string[],
        weight = FontWeight.Normal,
        style = FontStyle.Normal
    ): UniversalFont {
        const families = Array.isArray(family) ? family : [family];

        // Try each specified family
        for (const fam of families) {
            const fontKey = `${fam}-${weight}-${style}`;
            let font = this.unifiedFonts.get(fontKey);
            if (font) { return font; }

            // Try to resolve with fallback
            const fallbackFont = this.fallbackSystem.resolveFontDescriptor({
                family: fam,
                weight,
                style,
            });

            font = this.registerStandardFont(fallbackFont, fontKey);
            return font;
        }

        // Final fallback
        return this.getDefaultFont();
    }

    /**
     * Measure text with font
     */
    measureText(text: string, style: TextStyleConfig): { width: number; height: number } {
        const font = this.getFontWithStyle(
            style.fontFamily ?? 'sans-serif',
            style.fontWeight ?? FontWeight.Normal,
            style.fontStyle ?? FontStyle.Normal
        );

        const fontSize = style.fontSize ?? 12;
        const width = font.measureTextWidth(text, fontSize);
        const height = font.getFontHeight(fontSize);

        return { width, height };
    }

    /**
     * Get font metrics
     */
    getFontMetrics(family: string, weight = FontWeight.Normal, style = FontStyle.Normal): FontMetrics | undefined {
        const font = this.getFontWithStyle(family, weight, style);
        const fontSize = 12; // Base size for metrics

        return {
            family,
            unitsPerEm: 1000,
            ascender: font.getAscender(fontSize) / fontSize * 1000,
            descender: font.getDescender(fontSize) / fontSize * 1000,
            lineGap: 0,
            boundingBox: { xMin: 0, yMin: -200, xMax: 1000, yMax: 800 },
            glyphCount: 256,
        };
    }

    /**
     * Get default font (Helvetica)
     */
    getDefaultFont(): UniversalFont {
        return this.registerStandardFont(PdfStandardFont.Helvetica);
    }

    /**
     * Get all registered font names
     */
    getFontNames(): string[] {
        return Array.from(this.unifiedFonts.keys());
    }

    /**
     * Clear all fonts
     */
    clear(): void {
        this.standardFonts.clear();
        this.customFonts.clear();
        this.unifiedFonts.clear();
        FontLoader.clearCache();
    }

    /**
     * Get loading statistics
     */
    getStats() {
        return {
            standardFonts: this.standardFonts.size,
            customFonts: this.customFonts.size,
            totalFonts: this.unifiedFonts.size,
            fontLoader: FontLoader.getStats(),
        };
    }
}

/**
 * Font utility functions
 */
export const FontUtils = {
    /**
     * Parse CSS font-weight to FontWeight enum
     */
    parseFontWeight(weight: string | number): FontWeight {
        if (typeof weight === 'number') {
            return Math.round(weight / 100) * 100 as FontWeight;
        }

        switch (weight.toLowerCase()) {
            case 'thin': return FontWeight.Thin;
            case 'light': return FontWeight.Light;
            case 'normal': case 'regular': return FontWeight.Normal;
            case 'medium': return FontWeight.Medium;
            case 'semi-bold': case 'semibold': return FontWeight.SemiBold;
            case 'bold': return FontWeight.Bold;
            case 'extra-bold': case 'ultrabold': return FontWeight.ExtraBold;
            case 'black': case 'heavy': return FontWeight.Black;
            default: return FontWeight.Normal;
        }
    },

    /**
     * Parse CSS font-style to FontStyle enum
     */
    parseFontStyle(style: string): FontStyle {
        switch (style.toLowerCase()) {
            case 'italic': return FontStyle.Italic;
            case 'oblique': return FontStyle.Oblique;
            case 'normal': default: return FontStyle.Normal;
        }
    },

    /**
     * Get PDF font from universal font (if standard)
     */
    getPdfFont(font: UniversalFont): PdfFont | undefined {
        if (font.type === 'standard') {
            return font.getUnderlyingFont() as PdfFont;
        }
        return undefined;
    },

    /**
     * Parse font family string
     */
    parseFontFamily(fontFamily: string): string[] {
        return fontFamily
            .split(',')
            .map(family => family.trim().replace(/['"]/g, ''))
            .filter(family => family.length > 0);
    },

    /**
     * Resolve font from font stack
     */
    resolveFontStack(fontStack: string[]): PdfStandardFont {
        for (const family of fontStack) {
            if (Object.values(PdfStandardFont).includes(family as PdfStandardFont)) {
                return family as PdfStandardFont;
            }
        }
        return PdfStandardFont.Helvetica;
    },
};

/**
 * Predefined font collections
 */
export const FontCollections = {
    /**
     * Web safe font stacks
     */
    WEB_SAFE: {
        serif: ['Times', 'Times New Roman', 'serif'],
        sansSerif: ['Arial', 'Helvetica', 'sans-serif'],
        monospace: ['Courier', 'Courier New', 'monospace'],
    },

    /**
     * System font stacks
     */
    SYSTEM: {
        ui: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        mono: ['SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
};

// Export for backward compatibility during transition
export { PdfStandardFont } from './pdf/font-engine.js';