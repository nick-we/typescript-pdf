/**
 * Comprehensive test suite for the theming system
 * 
 * Tests all aspects of the theming system including:
 * - TextDecoration functionality
 * - TextStyle utilities and merging
 * - Theme creation and customization
 * - Theme widgets and inheritance
 * - Color schemes and typography scales
 * 
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    TextDecoration,
    TextDecorationFlag,
    TextDecorationStyle,
    FontWeight,
    FontStyle,
    TextStyleUtils,
    ColorSchemes,
    ThemeUtils,
    defaultTheme,
    type TextStyle,
    type ThemeData,
    type ColorScheme,
} from '../types/theming.js';
import {
    Theme,
    DefaultTextStyle,
    ThemedWidget,
    ThemeConsumer,
    ThemeHelpers,
} from '../widgets/theme.js';
import { Text } from '../widgets/text.js';
import { Container } from '../widgets/container.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import {
    BoxConstraints,
    TextDirection,
    type LayoutContext,
    type PaintContext,
} from '../types/layout.js';
import { PdfGraphics } from '../core/pdf/graphics.js';
import { PdfColor } from '@/core/pdf/color.js';

describe('TextDecoration', () => {
    describe('basic functionality', () => {
        it('should create static decoration instances', () => {
            expect(TextDecoration.none).toBeDefined();
            expect(TextDecoration.underline).toBeDefined();
            expect(TextDecoration.overline).toBeDefined();
            expect(TextDecoration.lineThrough).toBeDefined();
        });

        it('should check decoration flags correctly', () => {
            expect(TextDecoration.none.hasUnderline).toBe(false);
            expect(TextDecoration.none.hasOverline).toBe(false);
            expect(TextDecoration.none.hasLineThrough).toBe(false);

            expect(TextDecoration.underline.hasUnderline).toBe(true);
            expect(TextDecoration.underline.hasOverline).toBe(false);
            expect(TextDecoration.underline.hasLineThrough).toBe(false);

            expect(TextDecoration.overline.hasUnderline).toBe(false);
            expect(TextDecoration.overline.hasOverline).toBe(true);
            expect(TextDecoration.overline.hasLineThrough).toBe(false);

            expect(TextDecoration.lineThrough.hasUnderline).toBe(false);
            expect(TextDecoration.lineThrough.hasOverline).toBe(false);
            expect(TextDecoration.lineThrough.hasLineThrough).toBe(true);
        });

        it('should combine decorations correctly', () => {
            const combined = TextDecoration.combine([
                TextDecoration.underline,
                TextDecoration.lineThrough
            ]);

            expect(combined.hasUnderline).toBe(true);
            expect(combined.hasLineThrough).toBe(true);
            expect(combined.hasOverline).toBe(false);
        });

        it('should merge decorations correctly', () => {
            const merged = TextDecoration.underline.merge(TextDecoration.overline);

            expect(merged.hasUnderline).toBe(true);
            expect(merged.hasOverline).toBe(true);
            expect(merged.hasLineThrough).toBe(false);
        });

        it('should check containment correctly', () => {
            const combined = TextDecoration.combine([
                TextDecoration.underline,
                TextDecoration.lineThrough
            ]);

            expect(combined.contains(TextDecoration.underline)).toBe(true);
            expect(combined.contains(TextDecoration.lineThrough)).toBe(true);
            expect(combined.contains(TextDecoration.overline)).toBe(false);
        });

        it('should check equality correctly', () => {
            const decoration1 = TextDecoration.combine([TextDecoration.underline]);
            const decoration2 = TextDecoration.underline;
            const decoration3 = TextDecoration.overline;

            expect(decoration1.equals(decoration2)).toBe(true);
            expect(decoration1.equals(decoration3)).toBe(false);
        });
    });
});

describe('TextStyleUtils', () => {
    describe('createDefault', () => {
        it('should create default non-inheriting style', () => {
            const style = TextStyleUtils.createDefault();

            expect(style.inherit).toBe(false);
            expect(style.color).toStrictEqual(PdfColor.fromHex('#000000'));
            expect(style.fontFamily).toBe(PdfStandardFont.Helvetica);
            expect(style.fontSize).toBe(12);
            expect(style.fontWeight).toBe(FontWeight.Normal);
            expect(style.fontStyle).toBe(FontStyle.Normal);
            expect(style.decoration).toBe(TextDecoration.none);
        });

        it('should create default style with overrides', () => {
            const style = TextStyleUtils.createDefault({
                fontSize: 16,
                fontWeight: FontWeight.Bold,
                color: PdfColor.fromHex('#ff0000'),
            });

            expect(style.inherit).toBe(false);
            expect(style.fontSize).toBe(16);
            expect(style.fontWeight).toBe(FontWeight.Bold);
            expect(style.color).toStrictEqual(PdfColor.fromHex('#ff0000'));
            expect(style.fontFamily).toBe(PdfStandardFont.Helvetica); // Should keep default
        });

        it('should not include undefined properties', () => {
            const style = TextStyleUtils.createDefault({
                fontSize: 16,
                // color is undefined
            });

            expect(style.fontSize).toBe(16);
            expect(style.color).toStrictEqual(PdfColor.fromHex('#000000')); // Should use default
        });
    });

    describe('createInheriting', () => {
        it('should create inheriting style with minimal properties', () => {
            const style = TextStyleUtils.createInheriting();

            expect(style.inherit).toBe(true);
            expect(style.color).toBeUndefined();
            expect(style.fontSize).toBeUndefined();
        });

        it('should create inheriting style with overrides', () => {
            const style = TextStyleUtils.createInheriting({
                fontSize: 14,
                fontWeight: FontWeight.Bold,
            });

            expect(style.inherit).toBe(true);
            expect(style.fontSize).toBe(14);
            expect(style.fontWeight).toBe(FontWeight.Bold);
            expect(style.color).toBeUndefined();
        });
    });

    describe('copyWith', () => {
        it('should copy style with modifications', () => {
            const baseStyle = TextStyleUtils.createDefault({
                fontSize: 12,
                color: PdfColor.fromHex('#000000'),
                fontWeight: FontWeight.Normal,
            });

            const modifiedStyle = TextStyleUtils.copyWith(baseStyle, {
                fontSize: 16,
                fontWeight: FontWeight.Bold,
            });

            expect(modifiedStyle.fontSize).toBe(16);
            expect(modifiedStyle.fontWeight).toBe(FontWeight.Bold);
            expect(modifiedStyle.color).toStrictEqual(PdfColor.fromHex('#000000')); // Should preserve
            expect(modifiedStyle.inherit).toBe(false); // Should preserve
        });
    });

    describe('apply', () => {
        it('should apply scaling factors', () => {
            const baseStyle = TextStyleUtils.createDefault({
                fontSize: 12,
                letterSpacing: 1,
                wordSpacing: 2,
                height: 1.2,
            });

            const scaledStyle = TextStyleUtils.apply(baseStyle, {
                fontSizeFactor: 2,
                fontSizeDelta: 4,
                letterSpacingFactor: 1.5,
                letterSpacingDelta: 0.5,
            });

            expect(scaledStyle.fontSize).toBe(28); // 12 * 2 + 4
            expect(scaledStyle.letterSpacing).toBe(2); // 1 * 1.5 + 0.5
            expect(scaledStyle.wordSpacing).toBe(2); // Should remain unchanged
        });

        it('should handle undefined properties gracefully', () => {
            const baseStyle = TextStyleUtils.createInheriting({
                // No fontSize defined
            });

            const scaledStyle = TextStyleUtils.apply(baseStyle, {
                fontSizeFactor: 2,
            });

            expect(scaledStyle.fontSize).toBeUndefined();
        });
    });

    describe('merge', () => {
        it('should merge two inheriting styles', () => {
            const baseStyle = TextStyleUtils.createInheriting({
                fontSize: 12,
                color: PdfColor.fromHex('#000000'),
                fontWeight: FontWeight.Normal,
            });

            const overrideStyle = TextStyleUtils.createInheriting({
                fontSize: 16,
                fontStyle: FontStyle.Italic,
            });

            const merged = TextStyleUtils.merge(baseStyle, overrideStyle);

            expect(merged.fontSize).toBe(16); // Override wins
            expect(merged.color).toStrictEqual(PdfColor.fromHex('#000000')); // Base preserved
            expect(merged.fontStyle).toBe(FontStyle.Italic); // Override added
            expect(merged.fontWeight).toBe(FontWeight.Normal); // Base preserved
        });

        it('should replace base with non-inheriting override', () => {
            const baseStyle = TextStyleUtils.createInheriting({
                fontSize: 12,
                color: PdfColor.fromHex('#000000'),
            });

            const overrideStyle = TextStyleUtils.createDefault({
                fontSize: 16,
                color: PdfColor.fromHex('#ff0000'),
            });

            const merged = TextStyleUtils.merge(baseStyle, overrideStyle);

            expect(merged).toBe(overrideStyle); // Should be replaced entirely
        });

        it('should merge decorations correctly', () => {
            const baseStyle = TextStyleUtils.createInheriting({
                decoration: TextDecoration.underline,
            });

            const overrideStyle = TextStyleUtils.createInheriting({
                decoration: TextDecoration.lineThrough,
            });

            const merged = TextStyleUtils.merge(baseStyle, overrideStyle);

            expect(merged.decoration?.hasUnderline).toBe(true);
            expect(merged.decoration?.hasLineThrough).toBe(true);
        });
    });

    describe('resolveFontFamily', () => {
        it('should resolve Helvetica variations', () => {
            expect(TextStyleUtils.resolveFontFamily({
                inherit: false,
                fontFamily: PdfStandardFont.Helvetica,
                fontWeight: FontWeight.Normal,
                fontStyle: FontStyle.Normal,
            })).toBe(PdfStandardFont.Helvetica);

            expect(TextStyleUtils.resolveFontFamily({
                inherit: false,
                fontFamily: PdfStandardFont.Helvetica,
                fontWeight: FontWeight.Bold,
                fontStyle: FontStyle.Normal,
            })).toBe(PdfStandardFont.HelveticaBold);

            expect(TextStyleUtils.resolveFontFamily({
                inherit: false,
                fontFamily: PdfStandardFont.Helvetica,
                fontWeight: FontWeight.Normal,
                fontStyle: FontStyle.Italic,
            })).toBe(PdfStandardFont.HelveticaOblique);

            expect(TextStyleUtils.resolveFontFamily({
                inherit: false,
                fontFamily: PdfStandardFont.Helvetica,
                fontWeight: FontWeight.Bold,
                fontStyle: FontStyle.Italic,
            })).toBe(PdfStandardFont.HelveticaBoldOblique);
        });

        it('should resolve Times variations', () => {
            expect(TextStyleUtils.resolveFontFamily({
                inherit: false,
                fontFamily: PdfStandardFont.TimesRoman,
                fontWeight: FontWeight.Bold,
                fontStyle: FontStyle.Italic,
            })).toBe(PdfStandardFont.TimesBoldItalic);
        });

        it('should resolve Courier variations', () => {
            expect(TextStyleUtils.resolveFontFamily({
                inherit: false,
                fontFamily: PdfStandardFont.Courier,
                fontWeight: FontWeight.Bold,
                fontStyle: FontStyle.Italic,
            })).toBe(PdfStandardFont.CourierBoldOblique);
        });

        it('should handle undefined properties with defaults', () => {
            expect(TextStyleUtils.resolveFontFamily({
                inherit: false,
                // No fontFamily specified
            })).toBe(PdfStandardFont.Helvetica);
        });
    });
});

describe('ColorSchemes', () => {
    it('should provide predefined color schemes', () => {
        expect(ColorSchemes.light).toBeDefined();
        expect(ColorSchemes.dark).toBeDefined();
        expect(ColorSchemes.professional).toBeDefined();
    });

    it('should have consistent color scheme structure', () => {
        const schemes = [ColorSchemes.light, ColorSchemes.dark, ColorSchemes.professional];

        schemes.forEach(scheme => {
            expect(scheme.primary).toBeDefined();
            expect(scheme.secondary).toBeDefined();
            expect(scheme.background).toBeDefined();
            expect(scheme.surface).toBeDefined();
            expect(scheme.onBackground).toBeDefined();
            expect(scheme.onSurface).toBeDefined();
            expect(scheme.onPrimary).toBeDefined();
            expect(scheme.onSecondary).toBeDefined();
            expect(scheme.error).toBeDefined();
            expect(scheme.onError).toBeDefined();
            expect(scheme.success).toBeDefined();
            expect(scheme.warning).toBeDefined();
            expect(scheme.info).toBeDefined();

            // Should be valid hex colors
            expect(scheme.primary.toHex()).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(scheme.background.toHex()).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
    });
});

describe('ThemeUtils', () => {
    describe('createTheme', () => {
        it('should create complete theme with defaults', () => {
            const theme = ThemeUtils.createTheme();

            expect(theme.colorScheme).toBe(ColorSchemes.light);
            expect(theme.spacing).toBeDefined();
            expect(theme.typography).toBeDefined();
            expect(theme.defaultTextStyle).toBeDefined();
            expect(theme.shape).toBeDefined();
        });

        it('should create theme with custom parameters', () => {
            const customColors = ColorSchemes.dark;
            const theme = ThemeUtils.createTheme(
                customColors,
                undefined,
                PdfStandardFont.TimesRoman,
                14
            );

            expect(theme.colorScheme).toBe(customColors);
            expect(theme.defaultTextStyle.fontFamily).toBe(PdfStandardFont.TimesRoman);
            expect(theme.defaultTextStyle.fontSize).toBe(14);
        });

        it('should create consistent typography scale', () => {
            const theme = ThemeUtils.createTheme();

            expect(theme.typography.display.fontSize).toBeGreaterThan(theme.typography.headingLarge.fontSize!);
            expect(theme.typography.headingLarge.fontSize).toBeGreaterThan(theme.typography.headingMedium.fontSize!);
            expect(theme.typography.headingMedium.fontSize).toBeGreaterThan(theme.typography.bodyMedium.fontSize!);
            expect(theme.typography.bodyMedium.fontSize).toBeGreaterThan(theme.typography.caption.fontSize!);
        });
    });

    describe('predefined themes', () => {
        it('should create light theme', () => {
            const theme = ThemeUtils.light();

            expect(theme.colorScheme).toBe(ColorSchemes.light);
            expect(theme.defaultTextStyle.fontFamily).toBe(PdfStandardFont.Helvetica);
        });

        it('should create dark theme', () => {
            const theme = ThemeUtils.dark();

            expect(theme.colorScheme).toBe(ColorSchemes.dark);
            expect(theme.defaultTextStyle.fontFamily).toBe(PdfStandardFont.Helvetica);
        });

        it('should create professional theme', () => {
            const theme = ThemeUtils.professional();

            expect(theme.colorScheme).toBe(ColorSchemes.professional);
            expect(theme.defaultTextStyle.fontFamily).toBe(PdfStandardFont.TimesRoman);
            expect(theme.defaultTextStyle.fontSize).toBe(11);
        });
    });

    describe('copyWith', () => {
        it('should copy theme with modifications', () => {
            const baseTheme = ThemeUtils.light();
            const modifiedTheme = ThemeUtils.copyWith(baseTheme, {
                colorScheme: { primary: PdfColor.fromHex('#ff0000') },
                spacing: { lg: 20 },
            });

            expect(modifiedTheme.colorScheme.primary).toStrictEqual(PdfColor.fromHex('#ff0000'));
            expect(modifiedTheme.colorScheme.secondary).toStrictEqual(baseTheme.colorScheme.secondary);
            expect(modifiedTheme.spacing.lg).toBe(20);
            expect(modifiedTheme.spacing.md).toBe(baseTheme.spacing.md);
        });
    });
});

describe('Theme Widget', () => {
    let mockContext: LayoutContext;
    let mockPaintContext: PaintContext;

    beforeEach(() => {
        mockContext = {
            constraints: BoxConstraints.expand(100, 100),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        mockPaintContext = {
            graphics: {} as PdfGraphics,
            size: { width: 100, height: 100 },
            theme: defaultTheme,
        };
    });

    it('should provide theme to child widgets', () => {
        const customTheme = ThemeUtils.dark();
        const childWidget = new Text('Hello', {});

        const theme = new Theme({
            data: customTheme,
            child: childWidget,
        });

        // Mock the child's layout method to capture the context
        let receivedContext: LayoutContext | undefined;
        childWidget.layout = (context: LayoutContext) => {
            receivedContext = context;
            return {
                size: { width: 50, height: 20 },
                needsRepaint: true,
            };
        };

        theme.layout(mockContext);

        expect(receivedContext?.theme).toBe(customTheme);
    });

    it('should provide theme data via static method', () => {
        const customTheme = ThemeUtils.professional();
        const contextWithTheme = { ...mockContext, theme: customTheme };

        const themeData = Theme.of(contextWithTheme);

        expect(themeData).toBe(customTheme);
    });
});

describe('DefaultTextStyle Widget', () => {
    let mockContext: LayoutContext;

    beforeEach(() => {
        mockContext = {
            constraints: BoxConstraints.expand(100, 100),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };
    });

    it('should merge text styles by default', () => {
        const overrideStyle = TextStyleUtils.createInheriting({
            fontSize: 16,
            fontWeight: FontWeight.Bold,
        });

        const childWidget = new Text('Hello', {});
        const defaultTextStyle = new DefaultTextStyle({
            style: overrideStyle,
            child: childWidget,
        });

        // Mock the child's layout method to capture the context
        let receivedContext: LayoutContext | undefined;
        childWidget.layout = (context: LayoutContext) => {
            receivedContext = context;
            return {
                size: { width: 50, height: 20 },
                needsRepaint: true,
            };
        };

        defaultTextStyle.layout(mockContext);

        expect(receivedContext?.theme.defaultTextStyle.fontSize).toBe(16);
        expect(receivedContext?.theme.defaultTextStyle.fontWeight).toBe(FontWeight.Bold);
        expect(receivedContext?.theme.defaultTextStyle.color).toBe(defaultTheme.defaultTextStyle.color);
    });

    it('should replace text styles when merge is false', () => {
        const overrideStyle = TextStyleUtils.createDefault({
            fontSize: 16,
            color: PdfColor.fromHex('#ff0000'),
        });

        const childWidget = new Text('Hello', {});
        const defaultTextStyle = new DefaultTextStyle({
            style: overrideStyle,
            child: childWidget,
            merge: false,
        });

        // Mock the child's layout method to capture the context
        let receivedContext: LayoutContext | undefined;
        childWidget.layout = (context: LayoutContext) => {
            receivedContext = context;
            return {
                size: { width: 50, height: 20 },
                needsRepaint: true,
            };
        };

        defaultTextStyle.layout(mockContext);

        expect(receivedContext?.theme.defaultTextStyle).toStrictEqual(overrideStyle);
    });

    it('should provide merge and replace factory methods', () => {
        const style = TextStyleUtils.createInheriting({ fontSize: 16 });
        const child = new Container({});

        const mergeWidget = DefaultTextStyle.merge({ style, child });
        const replaceWidget = DefaultTextStyle.replace({ style, child });

        // These should create widgets with the correct merge settings
        expect(mergeWidget).toBeInstanceOf(DefaultTextStyle);
        expect(replaceWidget).toBeInstanceOf(DefaultTextStyle);
    });
});

describe('ThemedWidget', () => {
    let mockContext: LayoutContext;

    beforeEach(() => {
        mockContext = {
            constraints: BoxConstraints.expand(100, 100),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };
    });

    it('should rebuild when theme changes', () => {
        let buildCount = 0;
        const builder = (theme: ThemeData) => {
            buildCount++;
            return new Text(`Theme: ${theme.colorScheme.primary}`, {});
        };

        const themedWidget = new ThemedWidget({ builder });

        // First layout
        themedWidget.layout(mockContext);
        expect(buildCount).toBe(1);

        // Same theme - should use cache
        themedWidget.layout(mockContext);
        expect(buildCount).toBe(1);

        // Different theme - should rebuild
        const newContext = {
            ...mockContext,
            theme: ThemeUtils.dark(),
        };
        themedWidget.layout(newContext);
        expect(buildCount).toBe(2);
    });
});

describe('ThemeConsumer', () => {
    let mockContext: LayoutContext;

    beforeEach(() => {
        mockContext = {
            constraints: BoxConstraints.expand(100, 100),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };
    });

    it('should rebuild only when selected data changes', () => {
        let buildCount = 0;
        const selector = (theme: ThemeData) => theme.colorScheme.primary;
        const builder = (color: PdfColor) => {
            buildCount++;
            return new Text(`Color: ${color}`, {});
        };

        const consumer = new ThemeConsumer({ selector, builder });

        // First layout
        consumer.layout(mockContext);
        expect(buildCount).toBe(1);

        // Same primary color - should use cache
        consumer.layout(mockContext);
        expect(buildCount).toBe(1);

        // Different theme but same primary color - should use cache
        const sameColorTheme = ThemeUtils.copyWith(defaultTheme, {
            spacing: { lg: 20 }, // Different spacing, same colors
        });
        const newContext = { ...mockContext, theme: sameColorTheme };
        consumer.layout(newContext);
        expect(buildCount).toBe(1);

        // Different primary color - should rebuild
        const differentColorTheme = ThemeUtils.copyWith(defaultTheme, {
            colorScheme: { primary: PdfColor.red },
        });
        const colorContext = { ...mockContext, theme: differentColorTheme };
        consumer.layout(colorContext);
        expect(buildCount).toBe(2);
    });
});

describe('ThemeHelpers', () => {
    it('should create color scheme consumer', () => {
        const builder = (colors: ColorScheme) => new Text(colors.primary.toString(), {});
        const consumer = ThemeHelpers.withColorScheme(builder);

        expect(consumer).toBeInstanceOf(ThemeConsumer);
    });

    it('should create themed wrappers', () => {
        const child = new Text('Hello', {});

        const lightWrapper = ThemeHelpers.light(child);
        const darkWrapper = ThemeHelpers.dark(child);
        const professionalWrapper = ThemeHelpers.professional(child);

        expect(lightWrapper).toBeInstanceOf(Theme);
        expect(darkWrapper).toBeInstanceOf(Theme);
        expect(professionalWrapper).toBeInstanceOf(Theme);
    });

    it('should create text style overrides', () => {
        const style = TextStyleUtils.createInheriting({ fontSize: 16 });
        const child = new Text('Hello', {});

        const override = ThemeHelpers.withTextStyleOverride(style, child);
        const replacement = ThemeHelpers.withTextStyleReplacement(style, child);

        expect(override).toBeInstanceOf(DefaultTextStyle);
        expect(replacement).toBeInstanceOf(DefaultTextStyle);
    });
});

describe('Integration Tests', () => {
    it('should handle complex theming scenarios', () => {
        // Create a nested theme structure
        const customTheme = ThemeUtils.createTheme(
            ColorSchemes.professional,
            undefined,
            PdfStandardFont.TimesRoman,
            11
        );

        const nestedWidget = new Theme({
            data: customTheme,
            child: new DefaultTextStyle({
                style: TextStyleUtils.createInheriting({
                    fontSize: 14,
                    fontWeight: FontWeight.Bold,
                }),
                child: new ThemedWidget({
                    builder: (theme) => new Text(`Font: ${theme.defaultTextStyle.fontFamily}`, {
                        style: TextStyleUtils.createInheriting({
                            color: theme.colorScheme.primary,
                        }),
                    }),
                }),
            }),
        });

        const mockContext = {
            constraints: BoxConstraints.expand(200, 100),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        // Should layout without errors
        const result = nestedWidget.layout(mockContext);
        expect(result.size.width).toBeGreaterThan(0);
        expect(result.size.height).toBeGreaterThan(0);
    });

    it('should maintain theme consistency across widget tree', () => {
        let capturedThemes: ThemeData[] = [];

        const captureTheme = (theme: ThemeData) => {
            capturedThemes.push(theme);
            return new Container({});
        };

        const customTheme = ThemeUtils.dark();
        const widget = new Theme({
            data: customTheme,
            child: new ThemedWidget({
                builder: captureTheme,
            }),
        });

        const mockContext = {
            constraints: BoxConstraints.expand(100, 100),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        widget.layout(mockContext);

        expect(capturedThemes).toHaveLength(1);
        expect(capturedThemes[0]).toBe(customTheme);
    });
});