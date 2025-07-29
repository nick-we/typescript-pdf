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
 * Text decoration options
 */
export interface TextDecoration {
    /** Whether text is underlined */
    underline?: boolean;
    /** Whether text has strikethrough */
    strikethrough?: boolean;
    /** Color of decoration */
    color?: string;
    /** Thickness of decoration */
    thickness?: number;
}

/**
 * Text style configuration
 */
export interface TextStyle {
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
    decoration?: TextDecoration;
}

/**
 * Text widget properties
 */
export interface TextProps extends WidgetProps {
    /** The text content to display */
    content: string;
    /** Text styling */
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
    private readonly style: Required<TextStyle>;
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

        // Default text style
        this.style = {
            fontSize: props.style?.fontSize ?? 12,
            fontFamily: props.style?.fontFamily ?? PdfStandardFont.Helvetica,
            fontWeight: props.style?.fontWeight ?? 'normal',
            fontStyle: props.style?.fontStyle ?? 'normal',
            color: props.style?.color ?? '#000000',
            letterSpacing: props.style?.letterSpacing ?? 0,
            wordSpacing: props.style?.wordSpacing ?? 0,
            lineHeight: props.style?.lineHeight ?? 1.2,
            decoration: props.style?.decoration ?? {},
        };
    }

    /**
     * Get the appropriate PDF font based on style
     */
    private getPdfFont(): PdfStandardFont {
        const { fontFamily, fontWeight, fontStyle } = this.style;

        // Handle font variations for Helvetica
        if (fontFamily === PdfStandardFont.Helvetica) {
            if (fontWeight === 'bold' && fontStyle === 'italic') {
                return PdfStandardFont.HelveticaBoldOblique;
            } else if (fontWeight === 'bold') {
                return PdfStandardFont.HelveticaBold;
            } else if (fontStyle === 'italic') {
                return PdfStandardFont.HelveticaOblique;
            }
            return PdfStandardFont.Helvetica;
        }

        // Handle font variations for Times
        if (fontFamily === PdfStandardFont.TimesRoman) {
            if (fontWeight === 'bold' && fontStyle === 'italic') {
                return PdfStandardFont.TimesBoldItalic;
            } else if (fontWeight === 'bold') {
                return PdfStandardFont.TimesBold;
            } else if (fontStyle === 'italic') {
                return PdfStandardFont.TimesItalic;
            }
            return PdfStandardFont.TimesRoman;
        }

        // Handle font variations for Courier
        if (fontFamily === PdfStandardFont.Courier) {
            if (fontWeight === 'bold' && fontStyle === 'italic') {
                return PdfStandardFont.CourierBoldOblique;
            } else if (fontWeight === 'bold') {
                return PdfStandardFont.CourierBold;
            } else if (fontStyle === 'italic') {
                return PdfStandardFont.CourierOblique;
            }
            return PdfStandardFont.Courier;
        }

        return fontFamily;
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
        fontRegistry: any // TODO: Add proper type when available
    ): TextMeasurement {
        const font = fontRegistry.getFont(this.getPdfFont());
        const fontSize = this.style.fontSize;
        const lineHeight = fontSize * this.style.lineHeight;

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

        const measurement = this.measureText(maxWidth, mockFontRegistry);

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
        const color = this.parseColor(this.style.color);

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
        const y = this.style.fontSize; // Start from baseline

        // Apply text alignment
        if (this.textAlign === TextAlign.Center) {
            const textWidth = mockFont.measureTextWidth(this.content, this.style.fontSize);
            x = (size.width - textWidth) / 2;
        } else if (this.textAlign === TextAlign.Right) {
            const textWidth = mockFont.measureTextWidth(this.content, this.style.fontSize);
            x = size.width - textWidth;
        }

        graphics.moveTextPosition(x, y);
        graphics.showText(this.content);

        graphics.endText();

        // TODO: Implement text decorations (underline, strikethrough)
        if (this.style.decoration?.underline) {
            const textWidth = mockFont.measureTextWidth(this.content, this.style.fontSize);
            const underlineY = y - 2; // Offset below baseline
            graphics.drawLine(x, underlineY, x + textWidth, underlineY);
            graphics.strokePath();
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
        fontWeight: 'bold' as const,
        fontFamily: PdfStandardFont.Helvetica,
    },

    /** Heading 2 style */
    h2: {
        fontSize: 20,
        fontWeight: 'bold' as const,
        fontFamily: PdfStandardFont.Helvetica,
    },

    /** Heading 3 style */
    h3: {
        fontSize: 16,
        fontWeight: 'bold' as const,
        fontFamily: PdfStandardFont.Helvetica,
    },

    /** Body text style */
    body: {
        fontSize: 12,
        fontWeight: 'normal' as const,
        fontFamily: PdfStandardFont.Helvetica,
    },

    /** Caption text style */
    caption: {
        fontSize: 10,
        fontWeight: 'normal' as const,
        fontFamily: PdfStandardFont.Helvetica,
        color: '#666666',
    },

    /** Code text style */
    code: {
        fontSize: 11,
        fontWeight: 'normal' as const,
        fontFamily: PdfStandardFont.Courier,
        color: '#333333',
    },
} satisfies Record<string, Partial<TextStyle>>;