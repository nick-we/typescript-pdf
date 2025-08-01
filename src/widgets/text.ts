/**
 * Text widget implementation
 * 
 * Renders text with styling and proper text measurement.
 * Follows the constraint-based layout system.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type WidgetProps } from './widget.js';
import { PdfFont, PdfStandardFont } from '../core/pdf/font.js';
import { PdfColorRgb } from '../core/pdf/graphics.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import type {
    TextStyle,
} from '../types/theming.js';
import {
    TextStyleUtils,
    TextDecoration as ComprehensiveTextDecoration,
    TextDecorationStyle,
    FontWeight,
    FontStyle,
} from '../types/theming.js';
import type { FontRegistry } from '../core/pdf/font-loader.js';
import type { TtfParser } from '../core/pdf/ttf-parser.js';

/**
 * Interface for objects that can be used for text rendering
 */
interface RenderableFont {
    name: string;
    measureTextWidth(text: string, fontSize: number): number;
    getAscender?(fontSize: number): number;
    getDescender?(fontSize: number): number;
}

/**
 * Mock font interface for layout calculations
 */
interface MockFont {
    measureTextWidth(text: string, fontSize: number): number;
    getAscender(fontSize: number): number;
    getDescender(fontSize: number): number;
}

/**
 * Mock font registry for layout calculations when real fonts aren't available
 */
class MockFontRegistry {
    getFont(fontName: PdfStandardFont): MockFont {
        return {
            measureTextWidth: (text: string, fontSize: number) => {
                // Use character width estimates that match the real font measurements
                // From debug output: 130.68 for "Hello World!" (12 chars) at size 24
                // That's 130.68 / 12 / 24 = 0.4545 ratio, round up slightly for safety
                const avgCharWidth = fontSize * 0.46; // Match real measurements more precisely
                return text.length * avgCharWidth;
            },
            getAscender: (fontSize: number) => fontSize * 0.8,
            getDescender: (fontSize: number) => fontSize * -0.2,
        };
    }
}

/**
 * Text alignment options
 */
export enum TextAlign {
    Left = 'left',
    Center = 'center',
    Right = 'right',
    Justify = 'justify',
}

/**
 * Text overflow behavior
 */
export enum TextOverflow {
    Clip = 'clip',
    Ellipsis = 'ellipsis',
    Fade = 'fade',
    Visible = 'visible',
}

/**
 * Text decoration options (legacy compatibility)
 * @deprecated Use TextDecoration from theming system instead
 */
export interface LegacyTextDecoration {
    /** Whether text is underlined */
    underline?: boolean;
    /** Whether text has strikethrough */
    strikethrough?: boolean;
    /** Color of decoration */
    color?: string;
    /** Thickness of decoration */
    thickness?: number;
}

// Re-export comprehensive TextDecoration for compatibility
export type TextDecoration = ComprehensiveTextDecoration;

/**
 * Text widget properties
 */
export interface TextProps extends WidgetProps {
    /** The text content to display */
    content: string;
    /** Text styling - supports both legacy and comprehensive styles */
    style?: TextStyle;
    /** Text alignment */
    textAlign?: TextAlign;
    /** Text overflow behavior */
    overflow?: TextOverflow;
    /** Maximum number of lines */
    maxLines?: number;
    /** Whether text should wrap */
    softWrap?: boolean;
}

/**
 * Text measurement result
 */
interface TextMeasurement {
    /** Total width of text */
    width: number;
    /** Total height of text */
    height: number;
    /** Baseline offset from top */
    baseline: number;
    /** Number of lines */
    lineCount: number;
    /** Individual line measurements */
    lines: Array<{
        text: string;
        width: number;
        height: number;
    }>;
}

/**
 * Text widget for rendering styled text
 */
export class Text extends BaseWidget {
    private readonly content: string;
    private readonly style: TextStyle;
    private readonly textAlign: TextAlign;
    private readonly overflow: TextOverflow;
    private readonly maxLines?: number;
    private readonly softWrap: boolean;

    constructor(content: string, props: Omit<TextProps, 'content'> = {}) {
        super(props);

        this.content = content;
        this.textAlign = props.textAlign ?? TextAlign.Left;
        this.overflow = props.overflow ?? TextOverflow.Clip;
        props.maxLines && (this.maxLines = props.maxLines);
        this.softWrap = props.softWrap ?? true;

        // Convert legacy style to comprehensive style if needed
        this.style = this.normalizeTextStyle(props.style);
    }

    /**
     * Normalize text style to comprehensive format
     * Made public to ensure all Text widgets can normalize styles for macOS compatibility
     */
    public normalizeTextStyle(inputStyle?: TextStyle): TextStyle {
        if (!inputStyle) {
            return TextStyleUtils.createDefault({
                fontSize: 12,
                fontFamily: PdfStandardFont.Helvetica,
                fontWeight: FontWeight.Normal,
                fontStyle: FontStyle.Normal,
                color: '#000000',
                letterSpacing: 0,
                wordSpacing: 1,
                lineSpacing: 1.2,
                decoration: ComprehensiveTextDecoration.none,
            });
        }

        // CRITICAL: Use dart-pdf-style validation and completion
        // If style is non-inheriting, validate completeness; if inheriting, allow partial
        if (inputStyle.inherit === false) {
            try {
                TextStyleUtils.validateCompleteStyle(inputStyle);
                return inputStyle; // Already complete and valid
            } catch (error) {
                // Style is marked as non-inheriting but incomplete - make it complete
                return TextStyleUtils.ensureComplete(inputStyle);
            }
        } else {
            // Inheriting style - preserve as-is but ensure it can be completed when merged
            return inputStyle;
        }
    }

    /**
     * Get the appropriate PDF font based on style using theming system
     */
    private getPdfFont(): PdfStandardFont {
        return TextStyleUtils.resolveFontFamily(this.style);
    }

    /**
     * Parse color string to RGB values
     */
    private parseColor(color: string): PdfColorRgb {
        // Simple hex color parsing
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 6) {
                const r = parseInt(hex.slice(0, 2), 16) / 255;
                const g = parseInt(hex.slice(2, 4), 16) / 255;
                const b = parseInt(hex.slice(4, 6), 16) / 255;
                return new PdfColorRgb(r, g, b);
            }
        }

        // Default to black
        return PdfColorRgb.black;
    }

    /**
     * Measure text and break it into lines
     */
    private measureText(
        maxWidth: number,
        fontRegistry: FontRegistry | MockFontRegistry,
        effectiveStyle: TextStyle
    ): TextMeasurement {
        const font = fontRegistry.getFont(this.getPdfFont());
        const fontSize = effectiveStyle.fontSize || 12;
        const lineHeight = fontSize * (effectiveStyle.lineSpacing || 1.2);

        if (!font) {
            // Fallback if font not found
            const avgCharWidth = fontSize * 0.55;
            const totalWidth = this.content.length * avgCharWidth;
            return {
                width: totalWidth,
                height: lineHeight,
                baseline: fontSize * 0.8,
                lineCount: 1,
                lines: [{ text: this.content, width: totalWidth, height: lineHeight }],
            };
        }

        // Simple text measurement - in a real implementation this would be more sophisticated
        // For simplicity, measure the entire text as one line to match paint behavior
        // This avoids the layout/paint measurement mismatch
        let totalWidth: number;
        let ascender: number;

        if ('measureTextWidth' in font) {
            // Mock font registry
            totalWidth = font.measureTextWidth(this.content, fontSize);
            ascender = font.getAscender(fontSize);
        } else {
            // Real TtfParser
            const fontUnits = font.measureText(this.content);
            const scale = fontSize / font.unitsPerEm;
            totalWidth = fontUnits * scale;
            ascender = font.ascent * scale;
        }

        // For now, treat as single line to match paint behavior
        // TODO: Implement proper line breaking that matches paint rendering
        const lines: Array<{ text: string; width: number; height: number }> = [
            {
                text: this.content,
                width: totalWidth,
                height: lineHeight,
            }
        ];

        return {
            width: totalWidth,
            height: lineHeight,
            baseline: ascender,
            lineCount: 1,
            lines,
        };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Merge with theme's default text style if this style inherits
        const effectiveStyle = this.style.inherit
            ? TextStyleUtils.merge(context.theme.defaultTextStyle, this.style)
            : this.style;

        // Use the same font registry logic as paint method for consistency
        const fontSize = effectiveStyle.fontSize || 12;

        // Try to get font registry from context (if available in future)
        // For now, create a more accurate mock that matches the font measurements
        let fontRegistry: FontRegistry | MockFontRegistry;

        if ('fontRegistry' in context && context.fontRegistry) {
            fontRegistry = context.fontRegistry as FontRegistry;
        } else {
            // Create a mock that uses the same measurement logic as paint
            fontRegistry = new MockFontRegistry();
        }

        const maxWidth = context.constraints.maxWidth === Number.POSITIVE_INFINITY
            ? 1000 // Default max width
            : context.constraints.maxWidth;

        const measurement = this.measureText(maxWidth, fontRegistry, effectiveStyle);

        const size: Size = {
            width: Math.min(measurement.width, context.constraints.maxWidth),
            height: Math.min(measurement.height, context.constraints.maxHeight),
        };

        const constrainedSize = this.constrainSize(context.constraints, size);

        console.log(`Text layout debug:
    content: "${this.content}"
    fontSize: ${fontSize}
    constraints: ${JSON.stringify(context.constraints)}
    measurement: ${JSON.stringify(measurement)}
    finalSize: ${JSON.stringify(constrainedSize)}`);

        return this.createLayoutResult(constrainedSize, {
            baseline: measurement.baseline,
            needsRepaint: true,
        });
    }

    paint(context: PaintContext): void {
        if (!this.content.trim()) {
            return; // Nothing to paint
        }

        const { graphics, size, theme, fontRegistry } = context;

        // Merge with theme's default text style if this style inherits
        let effectiveStyle = this.style.inherit
            ? TextStyleUtils.merge(context.theme.defaultTextStyle, this.style)
            : this.style;

        // CRITICAL: Ensure effective style is always complete for macOS compatibility
        // Use dart-pdf-style validation to guarantee all properties are defined
        effectiveStyle = TextStyleUtils.ensureComplete(effectiveStyle);

        const color = this.parseColor(effectiveStyle.color || '#000000');
        const fontSize = effectiveStyle.fontSize || 12;

        console.log(`Font size being used: ${fontSize}`);
        console.log(`Effective style: ${JSON.stringify(effectiveStyle)}`);

        let renderingFont: PdfFont | undefined = undefined;
        let actualWidth: number;
        let ascender: number;
        let descender: number;

        if (fontRegistry) {
            // Use font registry for both measurement and rendering
            renderingFont = fontRegistry.getFont(this.getPdfFont());
            console.log(`Using fontRegistry, font name: ${renderingFont.name}`);
            actualWidth = renderingFont.measureTextWidth(this.content, fontSize);
            console.log(`Font measureTextWidth result: ${actualWidth} for "${this.content}" at size ${fontSize}`);
            ascender = renderingFont.getAscender(fontSize);
            descender = Math.abs(renderingFont.getDescender(fontSize)); // Make positive for calculation
        } else {
            // Fallback to estimations if no font registry available
            console.log(`Using fallback font measurements`);
            const avgCharWidth = fontSize * 0.55;
            actualWidth = this.content.length * avgCharWidth;
            ascender = fontSize * 0.8;
            descender = fontSize * 0.2;
        }

        const totalTextHeight = ascender + descender;

        // Default to left alignment, but respect explicit textAlign setting
        // Start with left alignment as default (more intuitive for table cells)
        let x = 0;

        // Center the text vertically within the allocated space
        // In PDF coordinates (bottom-left origin), position the baseline
        // so that the visual center of the text aligns with the center of the container
        // Text extends from (baseline - descender) to (baseline + ascender)
        // Visual center is at: baseline + (ascender - descender) / 2
        // So: container_center = baseline + (ascender - descender) / 2
        // Therefore: baseline = container_center - (ascender - descender) / 2
        const containerCenter = size.height / 2;
        let y = Math.max(0, containerCenter - (ascender - descender) / 2);

        console.log(`Text positioning debug:
    size: ${JSON.stringify(size)}
    actualWidth: ${actualWidth}
    totalTextHeight: ${totalTextHeight}
    ascender: ${ascender}
    descender: ${descender}
    calculated x: ${x}
    calculated y: ${y}
    content: "${this.content}"`);

        // Apply text alignment based on textAlign property
        if (this.textAlign === TextAlign.Left) {
            x = 0; // Already set above
        } else if (this.textAlign === TextAlign.Center) {
            x = Math.max(0, (size.width - actualWidth) / 2);
        } else if (this.textAlign === TextAlign.Right) {
            x = Math.max(0, size.width - actualWidth);
        }
        // TextAlign.Justify would need special handling (not implemented yet)

        // CRITICAL: Explicit color state management following dart-pdf approach
        // macOS PDF viewers require explicit color setting for each text span
        // Always set fill color explicitly before text rendering
        graphics.setFillColor(color);

        // Also set stroke color for consistency (dart-pdf sets both)
        graphics.setStrokeColor(color);

        if (renderingFont) {
            // Use the proper PdfFont from font registry with proper text spacing options
            // CRITICAL: Pass through text style properties to prevent NUL bytes on macOS
            graphics.drawString(renderingFont, fontSize, this.content, x, y, {
                charSpace: effectiveStyle.letterSpacing || 0,
                wordSpace: 0, // Always use 0 for word spacing to prevent NUL bytes on macOS
                scale: 1.0, // Default scale
            });
        } else {
            // Fallback: This should not happen in normal operation since fontRegistry should always be available
            // But for robustness, we provide a fallback that logs the issue
            console.warn('FontRegistry not available in PaintContext - text may not render properly');
            console.warn(`Attempted to render: "${this.content}" at position (${x}, ${y}) with fontSize ${fontSize}`);

            // Try to use low-level text operations with basic font setup
            graphics.beginText();

            // Try to use a basic font name that should be available in PDF
            const basicFontObject = { name: '/Helvetica' };
            try {
                graphics.setFont(basicFontObject as PdfFont, fontSize);
                graphics.moveTextPosition(x, y);
                graphics.showText(this.content);
            } catch (error) {
                console.error('Failed to render text with fallback method:', error);
            }

            graphics.endText();
        }
    }
}

/**
 * Convenience function to create a Text widget
 */
export function createText(content: string, props: Omit<TextProps, 'content'> = {}): Text {
    return new Text(content, props);
}

/**
 * Common text style presets
 */
export const TextStyles = {
    /** Heading 1 style */
    h1: {
        fontSize: 24,
        fontWeight: FontWeight.Bold,
        fontFamily: PdfStandardFont.Helvetica,
    },

    /** Heading 2 style */
    h2: {
        fontSize: 20,
        fontWeight: FontWeight.Bold,
        fontFamily: PdfStandardFont.Helvetica,
    },

    /** Heading 3 style */
    h3: {
        fontSize: 16,
        fontWeight: FontWeight.Bold,
        fontFamily: PdfStandardFont.Helvetica,
    },

    /** Body text style */
    body: {
        fontSize: 12,
        fontWeight: FontWeight.Normal,
        fontFamily: PdfStandardFont.Helvetica,
    },

    /** Caption text style */
    caption: {
        fontSize: 10,
        fontWeight: FontWeight.Normal,
        fontFamily: PdfStandardFont.Helvetica,
        color: '#666666',
    },

    /** Code text style */
    code: {
        fontSize: 11,
        fontWeight: FontWeight.Normal,
        fontFamily: PdfStandardFont.Courier,
        color: '#333333',
    },
} as const;