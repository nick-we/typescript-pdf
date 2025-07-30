/**
 * Theming system for consistent styling across widgets
 * 
 * Implements a comprehensive theming system with cascading styles,
 * inheritance, and composition-based design patterns.
 * 
 * @packageDocumentation
 */

import { PdfStandardFont } from '../core/pdf/font.js';
import type { EdgeInsets } from './layout.js';

/**
 * Font weight enumeration
 */
export enum FontWeight {
    Normal = 'normal',
    Bold = 'bold',
}

/**
 * Font style enumeration
 */
export enum FontStyle {
    Normal = 'normal',
    Italic = 'italic',
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

    private constructor(mask: number) {
        this._mask = mask;
    }

    /** No decoration */
    static readonly none = new TextDecoration(TextDecorationFlag.None);

    /** Underline decoration */
    static readonly underline = new TextDecoration(TextDecorationFlag.Underline);

    /** Overline decoration */
    static readonly overline = new TextDecoration(TextDecorationFlag.Overline);

    /** Line through decoration */
    static readonly lineThrough = new TextDecoration(TextDecorationFlag.LineThrough);

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
 * Comprehensive text style configuration with inheritance support
 */
export interface TextStyle {
    /** Whether this style inherits from parent styles */
    inherit?: boolean;

    /** Text color (hex string) */
    color?: string;

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

    /** Decoration color */
    decorationColor?: string;

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
     */
    createDefault(overrides: Partial<Omit<TextStyle, 'inherit'>> = {}): TextStyle {
        const baseStyle: TextStyle = {
            inherit: false,
            color: '#000000',
            fontFamily: PdfStandardFont.Helvetica,
            fontSize: 12,
            fontWeight: FontWeight.Normal,
            fontStyle: FontStyle.Normal,
            letterSpacing: 0,
            wordSpacing: 1,
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

        // Merge properties, with override taking precedence
        const result: TextStyle = { inherit: base.inherit ?? true };

        // Helper function to merge properties only if they exist
        const mergeProperty = <K extends keyof TextStyle>(key: K) => {
            if (override[key] !== undefined) {
                result[key] = override[key];
            } else if (base[key] !== undefined) {
                result[key] = base[key];
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
};

/**
 * Color palette for consistent theming
 */
export interface ColorScheme {
    /** Primary brand color */
    readonly primary: string;
    /** Secondary brand color */
    readonly secondary: string;
    /** Background color */
    readonly background: string;
    /** Surface color */
    readonly surface: string;
    /** Text color on background */
    readonly onBackground: string;
    /** Text color on surface */
    readonly onSurface: string;
    /** Text color on primary */
    readonly onPrimary: string;
    /** Text color on secondary */
    readonly onSecondary: string;
    /** Error color */
    readonly error: string;
    /** Text color on error */
    readonly onError: string;
    /** Success color */
    readonly success: string;
    /** Warning color */
    readonly warning: string;
    /** Info color */
    readonly info: string;
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
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        surface: '#f5f5f5',
        onBackground: '#000000',
        onSurface: '#000000',
        onPrimary: '#ffffff',
        onSecondary: '#ffffff',
        error: '#d32f2f',
        onError: '#ffffff',
        success: '#388e3c',
        warning: '#f57c00',
        info: '#1976d2',
    } as ColorScheme,

    /**
     * Dark color scheme
     */
    dark: {
        primary: '#90caf9',
        secondary: '#f48fb1',
        background: '#121212',
        surface: '#1e1e1e',
        onBackground: '#ffffff',
        onSurface: '#ffffff',
        onPrimary: '#000000',
        onSecondary: '#000000',
        error: '#f44336',
        onError: '#000000',
        success: '#4caf50',
        warning: '#ff9800',
        info: '#2196f3',
    } as ColorScheme,

    /**
     * Professional color scheme
     */
    professional: {
        primary: '#2c3e50',
        secondary: '#34495e',
        background: '#ffffff',
        surface: '#f8f9fa',
        onBackground: '#2c3e50',
        onSurface: '#2c3e50',
        onPrimary: '#ffffff',
        onSecondary: '#ffffff',
        error: '#e74c3c',
        onError: '#ffffff',
        success: '#27ae60',
        warning: '#f39c12',
        info: '#3498db',
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