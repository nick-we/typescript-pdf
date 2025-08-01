/**
 * Font Fallback System
 * 
 * Provides font fallback mechanisms when requested fonts are not available.
 * Ensures text is always renderable with appropriate fallback fonts.
 * 
 * @packageDocumentation
 */

import { FontStyle, FontWeight } from './fonts.js';
import { PdfStandardFont } from './pdf/font.js';

// Re-export FontWeight and FontStyle for test compatibility
export { FontWeight, FontStyle };

/**
 * Font descriptor for matching
 */
export interface FontDescriptor {
    /** Font family name */
    family: string;
    /** Font weight */
    weight: FontWeight;
    /** Font style */
    style: FontStyle;
}

/**
 * Font fallback rule
 */
interface FontFallbackRule {
    /** Pattern to match font families */
    pattern: RegExp | string;
    /** Fallback fonts in order of preference */
    fallbacks: PdfStandardFont[];
    /** Weight mapping for fallbacks */
    weightMapping?: Record<string, PdfStandardFont>;
}

/**
 * Font family categories
 */
export enum FontCategory {
    Serif = 'serif',
    SansSerif = 'sans-serif',
    Monospace = 'monospace',
    Cursive = 'cursive',
    Fantasy = 'fantasy',
}

/**
 * Font fallback system
 */
export class FontFallbackSystem {
    private fallbackRules: FontFallbackRule[] = [];
    private genericFallbacks: Record<FontCategory, PdfStandardFont[]> = {
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

    /**
     * Initialize default fallback rules
     */
    private initializeDefaultRules(): void {
        // Common font family mappings
        this.addFallbackRule({
            pattern: /^(Arial|Helvetica)/i,
            fallbacks: [
                PdfStandardFont.Helvetica,
                PdfStandardFont.HelveticaBold,
                PdfStandardFont.HelveticaOblique,
                PdfStandardFont.HelveticaBoldOblique,
            ],
        });

        this.addFallbackRule({
            pattern: /^(Times|Georgia|serif)/i,
            fallbacks: [
                PdfStandardFont.TimesRoman,
                PdfStandardFont.TimesBold,
                PdfStandardFont.TimesItalic,
                PdfStandardFont.TimesBoldItalic,
            ],
        });

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
            fallbacks: [
                PdfStandardFont.Helvetica,
                PdfStandardFont.HelveticaBold,
                PdfStandardFont.HelveticaOblique,
                PdfStandardFont.HelveticaBoldOblique,
            ],
        });

        // Font stack patterns
        this.addFallbackRule({
            pattern: 'serif',
            fallbacks: this.genericFallbacks[FontCategory.Serif],
        });

        this.addFallbackRule({
            pattern: 'sans-serif',
            fallbacks: this.genericFallbacks[FontCategory.SansSerif],
        });

        this.addFallbackRule({
            pattern: 'monospace',
            fallbacks: this.genericFallbacks[FontCategory.Monospace],
        });
    }

    /**
     * Add a fallback rule
     */
    addFallbackRule(rule: FontFallbackRule): void {
        this.fallbackRules.push(rule);
    }

    /**
     * Resolve a font descriptor to an available PDF font
     */
    resolveFontDescriptor(descriptor: FontDescriptor): PdfStandardFont {
        const { family, weight, style } = descriptor;

        // First, try to find a specific rule match
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

    /**
     * Categorize a font family into a generic category
     */
    private categorizeFont(family: string): FontCategory {
        const lowerFamily = family.toLowerCase();

        // Check for monospace indicators
        if (lowerFamily.includes('mono') ||
            lowerFamily.includes('courier') ||
            lowerFamily.includes('console') ||
            lowerFamily.includes('code')) {
            return FontCategory.Monospace;
        }

        // Check for serif indicators
        if ((lowerFamily.includes('serif') && !lowerFamily.includes('sans')) ||
            lowerFamily.includes('times') ||
            lowerFamily.includes('georgia') ||
            lowerFamily.includes('garamond') ||
            lowerFamily.includes('baskerville')) {
            return FontCategory.Serif;
        }

        // Check for sans-serif indicators
        if (lowerFamily.includes('sans') ||
            lowerFamily.includes('arial') ||
            lowerFamily.includes('helvetica')) {
            return FontCategory.SansSerif;
        }

        // Check for cursive/script indicators
        if (lowerFamily.includes('script') ||
            lowerFamily.includes('cursive') ||
            lowerFamily.includes('handwriting')) {
            return FontCategory.Cursive;
        }

        // Check for fantasy indicators
        if (lowerFamily.includes('fantasy') ||
            lowerFamily.includes('decorative') ||
            lowerFamily.includes('display')) {
            return FontCategory.Fantasy;
        }

        // Default to sans-serif
        return FontCategory.SansSerif;
    }

    /**
     * Select the best font from fallbacks based on weight and style
     */
    private selectBestFontFromFallbacks(
        fallbacks: PdfStandardFont[],
        weight: FontWeight | 'normal' | 'bold',
        style: FontStyle | 'normal' | 'italic'
    ): PdfStandardFont {
        const normalizedWeight = this.normalizeWeight(weight);
        const normalizedStyle = this.normalizeStyle(style);

        // Score each fallback font
        const scoredFonts = fallbacks.map(font => ({
            font,
            score: this.scoreFontMatch(font, normalizedWeight, normalizedStyle),
        }));

        // Sort by score (higher is better) and return the best match
        scoredFonts.sort((a, b) => b.score - a.score);
        return scoredFonts[0]?.font ?? PdfStandardFont.Helvetica;
    }

    /**
     * Normalize weight value
     */
    private normalizeWeight(weight: FontWeight | 'normal' | 'bold'): FontWeight {
        if (typeof weight === 'number') {
            return weight;
        }
        return weight === 'bold' ? FontWeight.Bold : FontWeight.Normal;
    }

    /**
     * Normalize style value
     */
    private normalizeStyle(style: FontStyle | 'normal' | 'italic'): FontStyle {
        if (style === 'italic') {
            return FontStyle.Italic;
        }
        return FontStyle.Normal;
    }

    /**
     * Score how well a font matches the desired weight and style
     */
    private scoreFontMatch(
        font: PdfStandardFont,
        targetWeight: FontWeight,
        targetStyle: FontStyle
    ): number {
        let score = 0;

        // Base score for font availability
        score += 10;

        // Weight matching
        const fontWeight = this.getFontWeight(font);
        const weightDifference = Math.abs(fontWeight - targetWeight);
        score += Math.max(0, 5 - weightDifference / 100);

        // Style matching
        const fontStyle = this.getFontStyle(font);
        if (fontStyle === targetStyle) {
            score += 5;
        } else if (targetStyle === FontStyle.Italic && fontStyle === FontStyle.Oblique) {
            score += 3; // Oblique is acceptable for italic
        }

        return score;
    }

    /**
     * Get the weight of a PDF standard font
     */
    private getFontWeight(font: PdfStandardFont): FontWeight {
        if (font.includes('Bold')) {
            return FontWeight.Bold;
        }
        return FontWeight.Normal;
    }

    /**
     * Get the style of a PDF standard font
     */
    private getFontStyle(font: PdfStandardFont): FontStyle {
        if (font.includes('Italic')) {
            return FontStyle.Italic;
        }
        if (font.includes('Oblique')) {
            return FontStyle.Oblique;
        }
        return FontStyle.Normal;
    }

    /**
     * Get fallback chain for a font family
     */
    getFallbackChain(family: string): PdfStandardFont[] {
        const descriptor: FontDescriptor = {
            family,
            weight: FontWeight.Normal,
            style: FontStyle.Normal,
        };

        const primaryFont = this.resolveFontDescriptor(descriptor);
        const category = this.categorizeFont(family);
        const categoryFallbacks = this.genericFallbacks[category];

        // Create a unique chain
        const chain = [primaryFont];
        for (const fallback of categoryFallbacks) {
            if (!chain.includes(fallback)) {
                chain.push(fallback);
            }
        }

        // Add final universal fallback
        if (!chain.includes(PdfStandardFont.Helvetica)) {
            chain.push(PdfStandardFont.Helvetica);
        }

        return chain;
    }

    /**
     * Check if a font family is supported natively
     */
    isNativelySupported(family: string): boolean {
        return Object.values(PdfStandardFont).includes(family as PdfStandardFont);
    }
}

/**
 * Default font fallback system instance
 */
export const defaultFontFallback = new FontFallbackSystem();

/**
 * Convenience functions for common font operations
 */
export const FontUtils = {
    /**
     * Resolve a CSS font family to a PDF font
     */
    resolveFont: (
        family: string,
        weight: FontWeight = FontWeight.Normal,
        style: FontStyle = FontStyle.Normal
    ): PdfStandardFont => {
        return defaultFontFallback.resolveFontDescriptor({
            family,
            weight,
            style,
        });
    },

    /**
     * Get the best matching font from a font stack
     */
    resolveFontStack: (fontStack: string[]): PdfStandardFont => {
        for (const family of fontStack) {
            if (defaultFontFallback.isNativelySupported(family)) {
                return family as PdfStandardFont;
            }
        }

        // Use the first font in the stack as the basis for fallback
        return FontUtils.resolveFont(fontStack[0] || 'sans-serif');
    },

    /**
     * Parse a CSS font-family string
     */
    parseFontFamily: (fontFamily: string): string[] => {
        return fontFamily
            .split(',')
            .map(family => family.trim().replace(/['"]/g, ''))
            .filter(family => family.length > 0);
    },

    /**
     * Get the category of a font
     */
    categorizeFont: (family: string): FontCategory => {
        return defaultFontFallback['categorizeFont'](family);
    },
};