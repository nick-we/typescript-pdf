/**
 * Theming system for consistent styling across widgets
 * 
 * Implements a comprehensive theming system with cascading styles,
 * inheritance, and composition-based design patterns.
 * 
 * @packageDocumentation
 */

import { FontStyle, FontWeight } from '../core/fonts.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import type { EdgeInsets, PaintContext } from './layout.js';
import { PdfColor } from '@/core/pdf/color.js';

// Re-export FontWeight and FontStyle for convenience
export { FontWeight, FontStyle };

/**
 * Paint phase for explicit background/foreground rendering separation
 * Following dart-pdf's approach for macOS PDF compatibility
 */
export enum PaintPhase {
    /** Paint both background and foreground */
    All = 'all',
    /** Paint only background elements (fills, shadows) */
    Background = 'background',
    /** Paint only foreground elements (borders, decorations) */
    Foreground = 'foreground',
}

/**
 * Text decoration style
 */
export enum TextDecorationStyle {
    Solid = 'solid',
    Dashed = 'dashed',
    Dotted = 'dotted',
    Double = 'double',
}

/**
 * Border style for BoxDecoration (local definition to avoid circular dependency)
 */
export enum BorderStyle {
    None = 'none',
    Solid = 'solid',
    Dashed = 'dashed',
    Dotted = 'dotted',
    Double = 'double',
}

/**
 * Border definition (local to avoid circular dependency)
 */
export interface Border {
    width?: number;
    color?: PdfColor;
    style?: BorderStyle;
}

/**
 * Border radius definition (local to avoid circular dependency)
 */
export interface BorderRadius {
    topLeft?: number;
    topRight?: number;
    bottomLeft?: number;
    bottomRight?: number;
}

/**
 * Box shadow definition (local to avoid circular dependency)
 */
export interface BoxShadow {
    offsetX: number;
    offsetY: number;
    blurRadius?: number;
    spreadRadius?: number;
    color?: PdfColor;
}

/**
 * BoxDecoration interface (local definition to avoid circular dependency)
 */
export interface BoxDecoration {
    color?: PdfColor;
    border?: Border;
    borderRadius?: BorderRadius;
    boxShadow?: BoxShadow[];
}

/**
 * Text decoration flags (can be combined)
 */
export enum TextDecorationFlag {
    None = 0x0,
    Underline = 0x1,
    Overline = 0x2,
    LineThrough = 0x4,
}

/**
 * Text decoration configuration
 */
export class TextDecoration {
    private readonly _mask: number;
    public readonly underline?: boolean;
    public readonly overline?: boolean;
    public readonly strikethrough?: boolean;
    public readonly color?: PdfColor;
    public readonly thickness?: number;
    public readonly style?: TextDecorationStyle;

    private constructor(mask: number, options?: {
        underline?: boolean;
        overline?: boolean;
        strikethrough?: boolean;
        color?: PdfColor;
        thickness?: number;
        style?: TextDecorationStyle;
    }) {
        this._mask = mask;
        if (options?.underline) this.underline = options?.underline;
        if (options?.overline) this.overline = options?.overline;
        if (options?.strikethrough) this.strikethrough = options?.strikethrough;
        if (options?.color) this.color = options?.color;
        if (options?.thickness) this.thickness = options?.thickness;
        if (options?.style) this.style = options?.style;
    }

    /** No decoration */
    static readonly none = new TextDecoration(TextDecorationFlag.None);

    /** Underline decoration */
    static readonly underline = new TextDecoration(TextDecorationFlag.Underline, { underline: true });

    /** Overline decoration */
    static readonly overline = new TextDecoration(TextDecorationFlag.Overline, { overline: true });

    /** Line through decoration */
    static readonly lineThrough = new TextDecoration(TextDecorationFlag.LineThrough, { strikethrough: true });

    /**
     * Create a custom decoration with properties
     */
    static create(options: {
        underline?: boolean;
        overline?: boolean;
        strikethrough?: boolean;
        color?: PdfColor;
        thickness?: number;
        style?: TextDecorationStyle;
    }): TextDecoration {
        let mask = TextDecorationFlag.None;
        if (options.underline) mask |= TextDecorationFlag.Underline;
        if (options.overline) mask |= TextDecorationFlag.Overline;
        if (options.strikethrough) mask |= TextDecorationFlag.LineThrough;

        return new TextDecoration(mask, options);
    }

    /**
     * Combine multiple decorations
     */
    static combine(decorations: TextDecoration[]): TextDecoration {
        const mask = decorations.reduce((acc, decoration) => acc | decoration._mask, 0);
        return new TextDecoration(mask);
    }

    /**
     * Check if this decoration contains another
     */
    contains(other: TextDecoration): boolean {
        return (this._mask | other._mask) === this._mask;
    }

    /**
     * Merge with another decoration
     */
    merge(other?: TextDecoration): TextDecoration {
        if (!other) return this;
        return new TextDecoration(this._mask | other._mask);
    }

    /**
     * Check if has underline
     */
    get hasUnderline(): boolean {
        return (this._mask & TextDecorationFlag.Underline) !== 0;
    }

    /**
     * Check if has overline
     */
    get hasOverline(): boolean {
        return (this._mask & TextDecorationFlag.Overline) !== 0;
    }

    /**
     * Check if has line through
     */
    get hasLineThrough(): boolean {
        return (this._mask & TextDecorationFlag.LineThrough) !== 0;
    }

    equals(other: TextDecoration): boolean {
        return this._mask === other._mask;
    }
}

/**
 * text style configuration with inheritance support
 */
export interface TextStyle {
    /** Whether this style inherits from parent styles */
    inherit?: boolean;

    /** Text color  */
    color?: PdfColor;

    /** Font family */
    fontFamily?: PdfStandardFont;

    /** Font size in points */
    fontSize?: number;

    /** Font weight */
    fontWeight?: FontWeight;

    /** Font style */
    fontStyle?: FontStyle;

    /** Letter spacing */
    letterSpacing?: number;

    /** Word spacing */
    wordSpacing?: number;

    /** Line spacing (line height multiplier) */
    lineSpacing?: number;

    /** Text height multiplier */
    height?: number;

    /** Text decoration */
    decoration?: TextDecoration;

    /** Decoration color (PdfColor object) */
    decorationColor?: PdfColor;

    /** Decoration style */
    decorationStyle?: TextDecorationStyle;

    /** Decoration thickness */
    decorationThickness?: number;
}

/**
 * Text style creation and manipulation utilities
 */
export const TextStyleUtils = {
    /**
     * Create a default text style (non-inheriting)
     * Following dart-pdf's strict validation approach
     */
    createDefault(overrides: Partial<Omit<TextStyle, 'inherit'>> = {}): TextStyle {
        const baseStyle: TextStyle = {
            inherit: false,
            color: PdfColor.black,
            fontFamily: PdfStandardFont.Helvetica,
            fontSize: 12,
            fontWeight: FontWeight.Normal,
            fontStyle: FontStyle.Normal,
            letterSpacing: 0,
            wordSpacing: 0,
            lineSpacing: 1.2,
            height: 1,
            decoration: TextDecoration.none,
            decorationStyle: TextDecorationStyle.Solid,
            decorationThickness: 1,
        };

        // Only include override properties that are not undefined
        const result: TextStyle = { ...baseStyle };
        Object.keys(overrides).forEach(key => {
            const value = (overrides as any)[key];
            if (value !== undefined) {
                (result as any)[key] = value;
            }
        });

        // CRITICAL: dart-pdf-style validation for macOS compatibility
        // Non-inheriting styles must have all essential properties
        TextStyleUtils.validateCompleteStyle(result);

        return result;
    },

    /**
     * Create an inheriting text style
     */
    createInheriting(overrides: Partial<Omit<TextStyle, 'inherit'>> = {}): TextStyle {
        const result: TextStyle = { inherit: true };

        // Only include override properties that are not undefined
        Object.keys(overrides).forEach(key => {
            const value = (overrides as any)[key];
            if (value !== undefined) {
                (result as any)[key] = value;
            }
        });

        return result;
    },

    /**
     * Copy a text style with modifications
     */
    copyWith(style: TextStyle, overrides: Partial<TextStyle> = {}): TextStyle {
        const result: TextStyle = { ...style };

        // Only include override properties that are not undefined
        Object.keys(overrides).forEach(key => {
            const value = (overrides as any)[key];
            if (value !== undefined) {
                (result as any)[key] = value;
            }
        });

        return result;
    },

    /**
     * Apply scaling factors to numeric properties
     */
    apply(
        style: TextStyle,
        options: {
            fontSizeFactor?: number;
            fontSizeDelta?: number;
            letterSpacingFactor?: number;
            letterSpacingDelta?: number;
            wordSpacingFactor?: number;
            wordSpacingDelta?: number;
            heightFactor?: number;
            heightDelta?: number;
            decoration?: TextDecoration;
        } = {}
    ): TextStyle {
        const {
            fontSizeFactor = 1.0,
            fontSizeDelta = 0.0,
            letterSpacingFactor = 1.0,
            letterSpacingDelta = 0.0,
            wordSpacingFactor = 1.0,
            wordSpacingDelta = 0.0,
            heightFactor = 1.0,
            heightDelta = 0.0,
            decoration,
        } = options;

        const result: TextStyle = { ...style };

        if (style.fontSize !== undefined) {
            result.fontSize = style.fontSize * fontSizeFactor + fontSizeDelta;
        }

        if (style.letterSpacing !== undefined) {
            result.letterSpacing = style.letterSpacing * letterSpacingFactor + letterSpacingDelta;
        }

        if (style.wordSpacing !== undefined) {
            result.wordSpacing = style.wordSpacing * wordSpacingFactor + wordSpacingDelta;
        }

        if (style.height !== undefined) {
            result.height = style.height * heightFactor + heightDelta;
        }

        if (decoration) {
            result.decoration = decoration;
        }

        return result;
    },

    /**
     * Merge two text styles with inheritance rules
     */
    merge(base: TextStyle, override?: TextStyle): TextStyle {
        if (!base) {
            // If no base style, return override or create a default inheriting style
            return override || TextStyleUtils.createInheriting();
        }

        if (!override) return base;

        // If override doesn't inherit, it completely replaces base
        if (!override.inherit) return override;

        // CRITICAL: When merging with a complete base style, ensure result is complete for macOS
        // If base has inherit: false (complete style), preserve completeness regardless of override inherit
        const shouldEnsureComplete = base.inherit === false;

        // Merge properties, with override taking precedence
        const result: TextStyle = { inherit: shouldEnsureComplete ? false : (base.inherit ?? true) };

        // Helper function to merge properties, ensuring completeness when needed
        const mergeProperty = <K extends keyof TextStyle>(key: K) => {
            if (override[key] !== undefined) {
                result[key] = override[key];
            } else if (base[key] !== undefined) {
                result[key] = base[key];
            } else if (shouldEnsureComplete) {
                // Fill in missing essential properties from defaults for macOS compatibility
                const defaults: Partial<TextStyle> = {
                    color: PdfColor.black,
                    fontFamily: PdfStandardFont.Helvetica,
                    fontSize: 12,
                    fontWeight: FontWeight.Normal,
                    fontStyle: FontStyle.Normal,
                    letterSpacing: 0,
                    wordSpacing: 0,
                    lineSpacing: 1.2,
                    height: 1,
                    decoration: TextDecoration.none,
                };
                if (key in defaults) {
                    result[key] = (defaults as any)[key];
                }
            }
        };

        mergeProperty('color');
        mergeProperty('fontFamily');
        mergeProperty('fontSize');
        mergeProperty('fontWeight');
        mergeProperty('fontStyle');
        mergeProperty('letterSpacing');
        mergeProperty('wordSpacing');
        mergeProperty('lineSpacing');
        mergeProperty('height');
        mergeProperty('decorationColor');
        mergeProperty('decorationStyle');
        mergeProperty('decorationThickness');

        // Special handling for decoration merging
        if (base.decoration && override.decoration) {
            result.decoration = base.decoration.merge(override.decoration);
        } else if (override.decoration !== undefined) {
            result.decoration = override.decoration;
        } else if (base.decoration !== undefined) {
            result.decoration = base.decoration;
        } else if (shouldEnsureComplete) {
            result.decoration = TextDecoration.none;
        }

        return result;
    },

    /**
     * Resolve the actual font family based on weight and style
     */
    resolveFontFamily(style: TextStyle): PdfStandardFont {
        const family = style.fontFamily ?? PdfStandardFont.Helvetica;
        const weight = style.fontWeight ?? FontWeight.Normal;
        const fontStyle = style.fontStyle ?? FontStyle.Normal;

        // Handle Helvetica variations
        if (family === PdfStandardFont.Helvetica) {
            if (weight === FontWeight.Bold && fontStyle === FontStyle.Italic) {
                return PdfStandardFont.HelveticaBoldOblique;
            } else if (weight === FontWeight.Bold) {
                return PdfStandardFont.HelveticaBold;
            } else if (fontStyle === FontStyle.Italic) {
                return PdfStandardFont.HelveticaOblique;
            }
            return PdfStandardFont.Helvetica;
        }

        // Handle Times variations
        if (family === PdfStandardFont.TimesRoman) {
            if (weight === FontWeight.Bold && fontStyle === FontStyle.Italic) {
                return PdfStandardFont.TimesBoldItalic;
            } else if (weight === FontWeight.Bold) {
                return PdfStandardFont.TimesBold;
            } else if (fontStyle === FontStyle.Italic) {
                return PdfStandardFont.TimesItalic;
            }
            return PdfStandardFont.TimesRoman;
        }

        // Handle Courier variations
        if (family === PdfStandardFont.Courier) {
            if (weight === FontWeight.Bold && fontStyle === FontStyle.Italic) {
                return PdfStandardFont.CourierBoldOblique;
            } else if (weight === FontWeight.Bold) {
                return PdfStandardFont.CourierBold;
            } else if (fontStyle === FontStyle.Italic) {
                return PdfStandardFont.CourierOblique;
            }
            return PdfStandardFont.Courier;
        }

        return family;
    },

    /**
     * Validate that a style is complete for macOS PDF compatibility
     * Following dart-pdf's assert(inherit || property != null) pattern
     */
    validateCompleteStyle(style: TextStyle): void {
        // dart-pdf pattern: assert(inherit || color != null)
        if (!style.inherit) {
            // Essential properties that must be present for non-inheriting styles
            if (style.color === undefined || style.color === null) {
                throw new Error('TextStyle validation failed: Non-inheriting style must have color (dart-pdf compatibility)');
            }
            if (style.fontFamily === undefined || style.fontFamily === null) {
                throw new Error('TextStyle validation failed: Non-inheriting style must have fontFamily (dart-pdf compatibility)');
            }
            if (style.fontSize === undefined || style.fontSize === null) {
                throw new Error('TextStyle validation failed: Non-inheriting style must have fontSize (dart-pdf compatibility)');
            }
            if (style.fontWeight === undefined || style.fontWeight === null) {
                throw new Error('TextStyle validation failed: Non-inheriting style must have fontWeight (dart-pdf compatibility)');
            }
            if (style.fontStyle === undefined || style.fontStyle === null) {
                throw new Error('TextStyle validation failed: Non-inheriting style must have fontStyle (dart-pdf compatibility)');
            }
            if (style.decoration === undefined || style.decoration === null) {
                throw new Error('TextStyle validation failed: Non-inheriting style must have decoration (dart-pdf compatibility)');
            }

            // Numeric properties that must have valid values
            if (typeof style.fontSize !== 'number' || style.fontSize <= 0) {
                throw new Error('TextStyle validation failed: fontSize must be a positive number (dart-pdf compatibility)');
            }
            if (style.letterSpacing !== undefined && typeof style.letterSpacing !== 'number') {
                throw new Error('TextStyle validation failed: letterSpacing must be a number (dart-pdf compatibility)');
            }
            if (style.wordSpacing !== undefined && typeof style.wordSpacing !== 'number') {
                throw new Error('TextStyle validation failed: wordSpacing must be a number (dart-pdf compatibility)');
            }
            if (style.lineSpacing !== undefined && (typeof style.lineSpacing !== 'number' || style.lineSpacing <= 0)) {
                throw new Error('TextStyle validation failed: lineSpacing must be a positive number (dart-pdf compatibility)');
            }
            if (style.height !== undefined && (typeof style.height !== 'number' || style.height <= 0)) {
                throw new Error('TextStyle validation failed: height must be a positive number (dart-pdf compatibility)');
            }
        }
    },

    /**
     * Ensure a style is complete for rendering, following dart-pdf's approach
     * This is called before actual text rendering to guarantee completeness
     */
    ensureComplete(style: TextStyle): TextStyle {
        // If style is inheriting, we can't make it complete here - that happens during inheritance resolution
        if (style.inherit) {
            return style;
        }

        // For non-inheriting styles, ensure all essential properties exist
        const complete: TextStyle = {
            inherit: false,
            color: style.color ?? PdfColor.black,
            fontFamily: style.fontFamily ?? PdfStandardFont.Helvetica,
            fontSize: style.fontSize ?? 12,
            fontWeight: style.fontWeight ?? FontWeight.Normal,
            fontStyle: style.fontStyle ?? FontStyle.Normal,
            letterSpacing: style.letterSpacing ?? 0,
            wordSpacing: style.wordSpacing ?? 1,
            lineSpacing: style.lineSpacing ?? 1.2,
            height: style.height ?? 1,
            decoration: style.decoration ?? TextDecoration.none,
            decorationStyle: style.decorationStyle ?? TextDecorationStyle.Solid,
            decorationThickness: style.decorationThickness ?? 1,
        };

        // Add optional properties if they exist
        if (style.decorationColor !== undefined) {
            complete.decorationColor = style.decorationColor;
        }

        // Validate the completed style
        TextStyleUtils.validateCompleteStyle(complete);

        return complete;
    },
};

/**
 * BoxDecoration painting utilities with PaintPhase support
 * Following dart-pdf's approach for macOS PDF compatibility
 */
export const BoxDecorationUtils = {
    /**
     * Paint a BoxDecoration with explicit phase control
     * Following dart-pdf's decoration.paint() approach
     */
    paint(
        decoration: BoxDecoration, // BoxDecoration type to avoid circular dependency
        context: PaintContext, // PaintContext
        rect: { x: number; y: number; width: number; height: number },
        phase: PaintPhase = PaintPhase.All
    ): void {
        const { graphics } = context;

        if (phase === PaintPhase.All || phase === PaintPhase.Background) {
            // Background phase: colors, gradients, shadows
            if (decoration.color) {
                const color = decoration.color;

                // Draw background rectangle
                graphics.drawRect(rect.x, rect.y, rect.width, rect.height);

                // CRITICAL: Explicit color state management following dart-pdf approach
                // macOS PDF viewers require explicit color setting for each operation
                graphics.setFillColor(color);
                graphics.fillPath();
            }

            // Box shadows would go here (background phase)
            if (decoration.boxShadow) {
                // Shadow implementation would go here
                // For now, shadows are not implemented
            }
        }

        if (phase === PaintPhase.All || phase === PaintPhase.Foreground) {
            // Foreground phase: borders, decorations
            if (decoration.border && decoration.border.style !== 'none') {
                const borderColor = decoration.border.color ?? PdfColor.black;

                // CRITICAL: Explicit stroke color setting for borders (dart-pdf approach)
                graphics.setStrokeColor(borderColor);
                graphics.setLineWidth(decoration.border.width ?? 1);
                graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
                graphics.strokePath();
            }
        }
    },

    /**
     * Normalize BoxDecoration to ensure complete properties for macOS compatibility
     */
    normalize(inputDecoration?: BoxDecoration): BoxDecoration {
        if (!inputDecoration) {
            return {};
        }

        const result = { ...inputDecoration };

        // Ensure border is complete if provided
        if (result.border) {
            const border = result.border;
            result.border = {
                width: border.width ?? 1,
                color: border.color ?? PdfColor.black,
                style: border.style ?? BorderStyle.Solid,
            };
        }

        // Ensure borderRadius is complete if provided
        if (result.borderRadius) {
            const radius = result.borderRadius;
            result.borderRadius = {
                topLeft: radius.topLeft ?? 0,
                topRight: radius.topRight ?? 0,
                bottomLeft: radius.bottomLeft ?? 0,
                bottomRight: radius.bottomRight ?? 0,
            };
        }

        // BoxShadow arrays should be complete if provided
        if (result.boxShadow) {
            result.boxShadow = result.boxShadow.map((shadow: any) => ({
                offsetX: shadow.offsetX,
                offsetY: shadow.offsetY,
                blurRadius: shadow.blurRadius ?? 0,
                spreadRadius: shadow.spreadRadius ?? 0,
                color: shadow.color ?? PdfColor.black,
            }));
        }

        return result;
    },
};

/**
 * Color palette for consistent theming
 */
export interface ColorScheme {
    /** Primary brand color */
    readonly primary: PdfColor;
    /** Secondary brand color */
    readonly secondary: PdfColor;
    /** Background color */
    readonly background: PdfColor;
    /** Surface color */
    readonly surface: PdfColor;
    /** Text color on background */
    readonly onBackground: PdfColor;
    /** Text color on surface */
    readonly onSurface: PdfColor;
    /** Text color on primary */
    readonly onPrimary: PdfColor;
    /** Text color on secondary */
    readonly onSecondary: PdfColor;
    /** Error color */
    readonly error: PdfColor;
    /** Text color on error */
    readonly onError: PdfColor;
    /** Success color */
    readonly success: PdfColor;
    /** Warning color */
    readonly warning: PdfColor;
    /** Info color */
    readonly info: PdfColor;
}

/**
 * Spacing system for consistent layouts
 */
export interface SpacingSystem {
    /** Extra small spacing (2pt) */
    readonly xs: number;
    /** Small spacing (4pt) */
    readonly sm: number;
    /** Medium spacing (8pt) */
    readonly md: number;
    /** Large spacing (16pt) */
    readonly lg: number;
    /** Extra large spacing (24pt) */
    readonly xl: number;
    /** Extra extra large spacing (32pt) */
    readonly xxl: number;
}

/**
 * Typography scale for consistent text sizing
 */
export interface TypographyScale {
    /** Display text style */
    readonly display: TextStyle;
    /** Large heading style */
    readonly headingLarge: TextStyle;
    /** Medium heading style */
    readonly headingMedium: TextStyle;
    /** Small heading style */
    readonly headingSmall: TextStyle;
    /** Title style */
    readonly title: TextStyle;
    /** Body large text style */
    readonly bodyLarge: TextStyle;
    /** Body medium text style */
    readonly bodyMedium: TextStyle;
    /** Body small text style */
    readonly bodySmall: TextStyle;
    /** Label text style */
    readonly label: TextStyle;
    /** Caption text style */
    readonly caption: TextStyle;
}

/**
 * Comprehensive theme data containing all styling information
 */
export interface ThemeData {
    /** Color scheme */
    readonly colorScheme: ColorScheme;

    /** Spacing system */
    readonly spacing: SpacingSystem;

    /** Typography scale */
    readonly typography: TypographyScale;

    /** Default text style (fallback) */
    readonly defaultTextStyle: TextStyle;

    /** Shape/border radius defaults */
    readonly shape: {
        readonly cornerRadius: {
            readonly none: number;
            readonly small: number;
            readonly medium: number;
            readonly large: number;
            readonly extraLarge: number;
        };
    };
}

/**
 * Default color schemes
 */
export const ColorSchemes = {
    /**
     * Light color scheme
     */
    light: {
        primary: PdfColor.fromHex('#1976d2'),
        secondary: PdfColor.fromHex('#dc004e'),
        background: PdfColor.fromHex('#ffffff'),
        surface: PdfColor.fromHex('#f5f5f5'),
        onBackground: PdfColor.fromHex('#000000'),
        onSurface: PdfColor.fromHex('#000000'),
        onPrimary: PdfColor.fromHex('#ffffff'),
        onSecondary: PdfColor.fromHex('#ffffff'),
        error: PdfColor.fromHex('#d32f2f'),
        onError: PdfColor.fromHex('#ffffff'),
        success: PdfColor.fromHex('#388e3c'),
        warning: PdfColor.fromHex('#f57c00'),
        info: PdfColor.fromHex('#1976d2'),
    } as ColorScheme,

    /**
     * Dark color scheme
     */
    dark: {
        primary: PdfColor.fromHex('#90caf9'),
        secondary: PdfColor.fromHex('#f48fb1'),
        background: PdfColor.fromHex('#121212'),
        surface: PdfColor.fromHex('#1e1e1e'),
        onBackground: PdfColor.fromHex('#ffffff'),
        onSurface: PdfColor.fromHex('#ffffff'),
        onPrimary: PdfColor.fromHex('#000000'),
        onSecondary: PdfColor.fromHex('#000000'),
        error: PdfColor.fromHex('#f44336'),
        onError: PdfColor.fromHex('#000000'),
        success: PdfColor.fromHex('#4caf50'),
        warning: PdfColor.fromHex('#ff9800'),
        info: PdfColor.fromHex('#2196f3'),
    } as ColorScheme,

    /**
     * Professional color scheme
     */
    professional: {
        primary: PdfColor.fromHex('#2c3e50'),
        secondary: PdfColor.fromHex('#34495e'),
        background: PdfColor.fromHex('#ffffff'),
        surface: PdfColor.fromHex('#f8f9fa'),
        onBackground: PdfColor.fromHex('#2c3e50'),
        onSurface: PdfColor.fromHex('#2c3e50'),
        onPrimary: PdfColor.fromHex('#ffffff'),
        onSecondary: PdfColor.fromHex('#ffffff'),
        error: PdfColor.fromHex('#e74c3c'),
        onError: PdfColor.fromHex('#ffffff'),
        success: PdfColor.fromHex('#27ae60'),
        warning: PdfColor.fromHex('#f39c12'),
        info: PdfColor.fromHex('#3498db'),
    } as ColorScheme,
};

/**
 * Default spacing system
 */
export const defaultSpacing: SpacingSystem = {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    xxl: 32,
};

/**
 * Theme creation utilities
 */
export const ThemeUtils = {
    /**
     * Create a complete theme with typography scale
     */
    createTheme(
        colorScheme: ColorScheme = ColorSchemes.light,
        spacing: SpacingSystem = defaultSpacing,
        baseFont: PdfStandardFont = PdfStandardFont.Helvetica,
        baseFontSize: number = 12
    ): ThemeData {
        const defaultStyle = TextStyleUtils.createDefault({
            fontFamily: baseFont,
            fontSize: baseFontSize,
            color: colorScheme.onBackground,
        });

        const typography: TypographyScale = {
            display: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 3,
                fontWeight: FontWeight.Bold,
                color: colorScheme.onBackground,
                lineSpacing: 1.1,
            }),
            headingLarge: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 2,
                fontWeight: FontWeight.Bold,
                color: colorScheme.onBackground,
                lineSpacing: 1.2,
            }),
            headingMedium: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 1.5,
                fontWeight: FontWeight.Bold,
                color: colorScheme.onBackground,
                lineSpacing: 1.2,
            }),
            headingSmall: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 1.25,
                fontWeight: FontWeight.Bold,
                color: colorScheme.onBackground,
                lineSpacing: 1.3,
            }),
            title: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 1.1,
                fontWeight: FontWeight.Bold,
                color: colorScheme.onBackground,
                lineSpacing: 1.3,
            }),
            bodyLarge: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 1.1,
                color: colorScheme.onBackground,
                lineSpacing: 1.4,
            }),
            bodyMedium: defaultStyle,
            bodySmall: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 0.9,
                color: colorScheme.onBackground,
                lineSpacing: 1.4,
            }),
            label: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 0.8,
                fontWeight: FontWeight.Bold,
                color: colorScheme.onBackground,
                letterSpacing: 0.5,
            }),
            caption: TextStyleUtils.createDefault({
                fontFamily: baseFont,
                fontSize: baseFontSize * 0.75,
                color: colorScheme.onSurface,
                lineSpacing: 1.3,
            }),
        };

        return {
            colorScheme,
            spacing,
            typography,
            defaultTextStyle: defaultStyle,
            shape: {
                cornerRadius: {
                    none: 0,
                    small: 4,
                    medium: 8,
                    large: 16,
                    extraLarge: 24,
                },
            },
        };
    },

    /**
     * Create a light theme
     */
    light(
        baseFont: PdfStandardFont = PdfStandardFont.Helvetica,
        baseFontSize: number = 12
    ): ThemeData {
        return ThemeUtils.createTheme(ColorSchemes.light, defaultSpacing, baseFont, baseFontSize);
    },

    /**
     * Create a dark theme
     */
    dark(
        baseFont: PdfStandardFont = PdfStandardFont.Helvetica,
        baseFontSize: number = 12
    ): ThemeData {
        return ThemeUtils.createTheme(ColorSchemes.dark, defaultSpacing, baseFont, baseFontSize);
    },

    /**
     * Create a professional theme
     */
    professional(
        baseFont: PdfStandardFont = PdfStandardFont.TimesRoman,
        baseFontSize: number = 11
    ): ThemeData {
        return ThemeUtils.createTheme(ColorSchemes.professional, defaultSpacing, baseFont, baseFontSize);
    },

    /**
     * Copy a theme with modifications
     */
    copyWith(
        theme: ThemeData,
        overrides: {
            colorScheme?: Partial<ColorScheme>;
            spacing?: Partial<SpacingSystem>;
            typography?: Partial<TypographyScale>;
            defaultTextStyle?: Partial<TextStyle>;
        } = {}
    ): ThemeData {
        return {
            colorScheme: overrides.colorScheme
                ? { ...theme.colorScheme, ...overrides.colorScheme }
                : theme.colorScheme,
            spacing: overrides.spacing
                ? { ...theme.spacing, ...overrides.spacing }
                : theme.spacing,
            typography: overrides.typography
                ? { ...theme.typography, ...overrides.typography }
                : theme.typography,
            defaultTextStyle: overrides.defaultTextStyle
                ? TextStyleUtils.copyWith(theme.defaultTextStyle, overrides.defaultTextStyle)
                : theme.defaultTextStyle,
            shape: theme.shape,
        };
    },
};

/**
 * Default theme instance
 */
export const defaultTheme = ThemeUtils.light();