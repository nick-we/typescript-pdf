/**
 * Text widget implementation
 * 
 * Renders text with styling and proper text measurement.
 * Follows the constraint-based layout system.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type WidgetProps } from './widget.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import { PdfColorRgb } from '../core/pdf/graphics.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import type {
    TextStyle as ComprehensiveTextStyle,
} from '../types/theming.js';
import {
    TextStyleUtils,
    TextDecoration as ComprehensiveTextDecoration,
    TextDecorationStyle,
    FontWeight,
    FontStyle,
} from '../types/theming.js';

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
 * Text style configuration (legacy compatibility - use comprehensive TextStyle from theming)
 * @deprecated Use TextStyle from theming system instead
 */
export interface LegacyTextStyle {
    /** Font size in points */
    fontSize?: number;
    /** Font family */
    fontFamily?: PdfStandardFont;
    /** Font weight */
    fontWeight?: 'normal' | 'bold';
    /** Font style */
    fontStyle?: 'normal' | 'italic';
    /** Text color (hex string) */
    color?: string;
    /** Letter spacing */
    letterSpacing?: number;
    /** Word spacing */
    wordSpacing?: number;
    /** Line height multiplier */
    lineHeight?: number;
    /** Text decoration */
    decoration?: TextDecoration | LegacyTextDecoration;
}

// Re-export comprehensive TextStyle for compatibility
export type TextStyle = ComprehensiveTextStyle;

/**
 * Text widget properties
 */
export interface TextProps extends WidgetProps {
    /** The text content to display */
    content: string;
    /** Text styling - supports both legacy and comprehensive styles */
    style?: ComprehensiveTextStyle | LegacyTextStyle;
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
    private readonly style: ComprehensiveTextStyle;
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
     */
    private normalizeTextStyle(inputStyle?: ComprehensiveTextStyle | LegacyTextStyle): ComprehensiveTextStyle {
        if (!inputStyle) {
            return TextStyleUtils.createInheriting({
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

        // If already comprehensive style, return as-is
        if ('inherit' in inputStyle) {
            return inputStyle as ComprehensiveTextStyle;
        }

        // Convert legacy style
        const legacyStyle = inputStyle as LegacyTextStyle;

        // Convert legacy decoration to comprehensive
        let decoration = ComprehensiveTextDecoration.none;
        if (legacyStyle.decoration) {
            const legacyDec = legacyStyle.decoration as LegacyTextDecoration;
            const decorations: ComprehensiveTextDecoration[] = [];
            if (legacyDec.underline) decorations.push(ComprehensiveTextDecoration.underline);
            if (legacyDec.strikethrough) decorations.push(ComprehensiveTextDecoration.lineThrough);
            decoration = decorations.length > 0
                ? ComprehensiveTextDecoration.combine(decorations)
                : ComprehensiveTextDecoration.none;
        }

        const styleObj: any = { decoration };

        if (legacyStyle.fontSize !== undefined) styleObj.fontSize = legacyStyle.fontSize;
        if (legacyStyle.fontFamily !== undefined) styleObj.fontFamily = legacyStyle.fontFamily;
        if (legacyStyle.fontWeight !== undefined) {
            styleObj.fontWeight = legacyStyle.fontWeight === 'bold' ? FontWeight.Bold : FontWeight.Normal;
        }
        if (legacyStyle.fontStyle !== undefined) {
            styleObj.fontStyle = legacyStyle.fontStyle === 'italic' ? FontStyle.Italic : FontStyle.Normal;
        }
        if (legacyStyle.color !== undefined) styleObj.color = legacyStyle.color;
        if (legacyStyle.letterSpacing !== undefined) styleObj.letterSpacing = legacyStyle.letterSpacing;
        if (legacyStyle.wordSpacing !== undefined) styleObj.wordSpacing = legacyStyle.wordSpacing;
        if (legacyStyle.lineHeight !== undefined) styleObj.lineSpacing = legacyStyle.lineHeight;

        return TextStyleUtils.createInheriting(styleObj);
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
        fontRegistry: any, // TODO: Add proper type when available
        effectiveStyle: ComprehensiveTextStyle
    ): TextMeasurement {
        const font = fontRegistry.getFont(this.getPdfFont());
        const fontSize = effectiveStyle.fontSize || 12;
        const lineHeight = fontSize * (effectiveStyle.lineSpacing || 1.2);

        // Simple text measurement - in a real implementation this would be more sophisticated
        const charWidth = font.measureTextWidth('M', fontSize); // Use 'M' as average character width
        const maxCharsPerLine = Math.floor(maxWidth / charWidth);

        const lines: Array<{ text: string; width: number; height: number }> = [];
        const words = this.content.split(/\s+/);
        let currentLine = '';
        let currentLineWidth = 0;

        for (const word of words) {
            const wordWidth = font.measureTextWidth(word + ' ', fontSize);

            if (this.softWrap && currentLineWidth + wordWidth > maxWidth && currentLine) {
                // Start new line
                lines.push({
                    text: currentLine.trim(),
                    width: currentLineWidth,
                    height: lineHeight,
                });
                currentLine = word + ' ';
                currentLineWidth = wordWidth;
            } else {
                currentLine += word + ' ';
                currentLineWidth += wordWidth;
            }

            // Check max lines limit
            if (this.maxLines && lines.length >= this.maxLines - 1) {
                break;
            }
        }

        // Add final line
        if (currentLine.trim()) {
            lines.push({
                text: currentLine.trim(),
                width: currentLineWidth,
                height: lineHeight,
            });
        }

        // Handle empty content
        if (lines.length === 0) {
            lines.push({
                text: '',
                width: 0,
                height: lineHeight,
            });
        }

        const totalWidth = Math.max(...lines.map(line => line.width));
        const totalHeight = lines.length * lineHeight;
        const baseline = font.getAscender(fontSize);

        return {
            width: totalWidth,
            height: totalHeight,
            baseline,
            lineCount: lines.length,
            lines,
        };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Merge with theme's default text style if this style inherits
        const effectiveStyle = this.style.inherit
            ? TextStyleUtils.merge(context.theme.defaultTextStyle, this.style)
            : this.style;

        // For now, we'll use a mock font registry - in a real implementation
        // this would come from the context or be injected
        const mockFontRegistry = {
            getFont: (fontName: PdfStandardFont) => ({
                measureTextWidth: (text: string, fontSize: number) => {
                    // Simple approximation
                    return text.length * fontSize * 0.6;
                },
                getAscender: (fontSize: number) => fontSize * 0.8,
                getDescender: (fontSize: number) => fontSize * -0.2,
            }),
        };

        const maxWidth = context.constraints.maxWidth === Number.POSITIVE_INFINITY
            ? 1000 // Default max width
            : context.constraints.maxWidth;

        const measurement = this.measureText(maxWidth, mockFontRegistry, effectiveStyle);

        const size: Size = {
            width: Math.min(measurement.width, context.constraints.maxWidth),
            height: Math.min(measurement.height, context.constraints.maxHeight),
        };

        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize, {
            baseline: measurement.baseline,
            needsRepaint: true,
        });
    }

    paint(context: PaintContext): void {
        if (!this.content.trim()) {
            return; // Nothing to paint
        }

        const { graphics, size, theme } = context;

        // Merge with theme's default text style if this style inherits
        const effectiveStyle = this.style.inherit
            ? TextStyleUtils.merge(context.theme.defaultTextStyle, this.style)
            : this.style;

        const color = this.parseColor(effectiveStyle.color || '#000000');

        // Set text color
        graphics.setColor(color);

        // For now, simple text rendering - in a real implementation this would:
        // 1. Use the actual font from a font registry
        // 2. Handle line breaking properly
        // 3. Implement text alignment
        // 4. Handle text decorations

        // Mock font - in real implementation, get from font registry
        const mockFont = {
            name: '/F1', // This would be the actual font resource name
            measureTextWidth: (text: string, fontSize: number) => text.length * fontSize * 0.6,
        };

        graphics.beginText();

        // Simple single-line text rendering
        let x = 0;
        const y = effectiveStyle.fontSize || 12; // Start from baseline

        const fontSize = effectiveStyle.fontSize || 12;

        // Apply text alignment
        if (this.textAlign === TextAlign.Center) {
            const textWidth = mockFont.measureTextWidth(this.content, fontSize);
            x = (size.width - textWidth) / 2;
        } else if (this.textAlign === TextAlign.Right) {
            const textWidth = mockFont.measureTextWidth(this.content, fontSize);
            x = size.width - textWidth;
        }

        graphics.moveTextPosition(x, y);
        graphics.showText(this.content);

        graphics.endText();

        // Implement text decorations using comprehensive system
        if (effectiveStyle.decoration) {
            const textWidth = mockFont.measureTextWidth(this.content, fontSize);

            if (effectiveStyle.decoration.hasUnderline) {
                const underlineY = y - 2; // Offset below baseline
                graphics.drawLine(x, underlineY, x + textWidth, underlineY);
                graphics.strokePath();
            }

            if (effectiveStyle.decoration.hasLineThrough) {
                const lineThroughY = y + fontSize * 0.3; // Middle of text
                graphics.drawLine(x, lineThroughY, x + textWidth, lineThroughY);
                graphics.strokePath();
            }

            if (effectiveStyle.decoration.hasOverline) {
                const overlineY = y + fontSize * 0.8; // Above text
                graphics.drawLine(x, overlineY, x + textWidth, overlineY);
                graphics.strokePath();
            }
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
} satisfies Record<string, Partial<LegacyTextStyle>>;