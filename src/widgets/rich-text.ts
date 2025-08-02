/**
 * RichText widget implementation
 *
 * Renders text with rich formatting using text spans.
 * Supports mixed styling within a single text widget.
 *
 * @packageDocumentation
 */

import { BaseWidget, type WidgetProps } from './widget.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import { PdfColor } from '../core/pdf/color.js';
import { TextAlign, TextOverflow } from './text.js';
import type { TextStyle } from '../types/theming.js';
import { FontWeight, FontStyle, TextDecoration, TextDecorationStyle } from '../types/theming.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import type { InternalFontRegistry, PdfFontResource } from '../types/internal.js';

/**
 * Text span with its own styling
 */
export interface TextSpan {
    /** Text content of this span */
    text: string;
    /** Styling for this span */
    style?: TextStyle;
    /** Child spans for nested formatting */
    children?: TextSpan[];
}

/**
 * Rich text widget properties
 */
export interface RichTextProps extends WidgetProps {
    /** Root text span containing the content and formatting */
    text: TextSpan;
    /** Default text styling */
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
 * Flattened text segment with resolved style
 */
interface TextSegment {
    /** Text content */
    text: string;
    /** Resolved style for this segment */
    style: Required<TextStyle>;
    /** Start position in the overall text */
    startIndex: number;
    /** End position in the overall text */
    endIndex: number;
}

/**
 * Line of text with segments
 */
interface TextLine {
    /** Text segments in this line */
    segments: TextSegment[];
    /** Total width of the line */
    width: number;
    /** Height of the line (based on tallest segment) */
    height: number;
    /** Baseline offset from top */
    baseline: number;
}

/**
 * Rich text measurement result
 */
interface RichTextMeasurement {
    /** Total width of text */
    width: number;
    /** Total height of text */
    height: number;
    /** Number of lines */
    lineCount: number;
    /** Individual text lines */
    lines: TextLine[];
}

/**
 * RichText widget for rendering text with mixed formatting
 */
export class RichText extends BaseWidget {
    private readonly textSpan: TextSpan;
    private readonly defaultStyle: Required<TextStyle>;
    private readonly textAlign: TextAlign;
    private readonly overflow: TextOverflow;
    private readonly maxLines?: number;
    private readonly softWrap: boolean;

    constructor(props: RichTextProps) {
        super(props);

        this.textSpan = props.text;
        this.textAlign = props.textAlign ?? TextAlign.Left;
        this.overflow = props.overflow ?? TextOverflow.Clip;
        if (props.maxLines) this.maxLines = props.maxLines;
        this.softWrap = props.softWrap ?? true;

        // Default text style
        this.defaultStyle = {
            inherit: false,
            fontSize: props.style?.fontSize ?? 12,
            fontFamily: props.style?.fontFamily ?? PdfStandardFont.Helvetica,
            fontWeight: props.style?.fontWeight ?? FontWeight.Normal,
            fontStyle: props.style?.fontStyle ?? FontStyle.Normal,
            color: props.style?.color ?? PdfColor.black,
            letterSpacing: props.style?.letterSpacing ?? 0,
            wordSpacing: props.style?.wordSpacing ?? 0,
            lineSpacing: props.style?.lineSpacing ?? 1.2,
            height: props.style?.height ?? 1,
            decoration: props.style?.decoration ?? TextDecoration.none,
            decorationColor: props.style?.decorationColor ?? PdfColor.black,
            decorationStyle: props.style?.decorationStyle ?? TextDecorationStyle.Solid,
            decorationThickness: props.style?.decorationThickness ?? 1,
        };
    }

    /**
     * Flatten text spans into segments with resolved styles
     */
    private flattenSpans(span: TextSpan, inheritedStyle: Required<TextStyle>): TextSegment[] {
        const segments: TextSegment[] = [];
        let currentIndex = 0;

        // Merge inherited style with span style
        const resolvedStyle: Required<TextStyle> = {
            inherit: inheritedStyle.inherit,
            fontSize: span.style?.fontSize ?? inheritedStyle.fontSize,
            fontFamily: span.style?.fontFamily ?? inheritedStyle.fontFamily,
            fontWeight: span.style?.fontWeight ?? inheritedStyle.fontWeight,
            fontStyle: span.style?.fontStyle ?? inheritedStyle.fontStyle,
            color: span.style?.color ?? inheritedStyle.color,
            letterSpacing: span.style?.letterSpacing ?? inheritedStyle.letterSpacing,
            wordSpacing: span.style?.wordSpacing ?? inheritedStyle.wordSpacing,
            lineSpacing: span.style?.lineSpacing ?? inheritedStyle.lineSpacing,
            height: span.style?.height ?? inheritedStyle.height,
            decoration: span.style?.decoration ? inheritedStyle.decoration.merge(span.style.decoration) : inheritedStyle.decoration,
            decorationColor: span.style?.decorationColor ?? inheritedStyle.decorationColor,
            decorationStyle: span.style?.decorationStyle ?? inheritedStyle.decorationStyle,
            decorationThickness: span.style?.decorationThickness ?? inheritedStyle.decorationThickness,
        };

        // Add text content as a segment
        if (span.text) {
            segments.push({
                text: span.text,
                style: resolvedStyle,
                startIndex: currentIndex,
                endIndex: currentIndex + span.text.length,
            });
            currentIndex += span.text.length;
        }

        // Process child spans
        if (span.children) {
            for (const child of span.children) {
                const childSegments = this.flattenSpans(child, resolvedStyle);
                segments.push(...childSegments);
            }
        }

        return segments;
    }

    /**
     * Get the appropriate PDF font based on style
     */
    private getPdfFont(style: Required<TextStyle>): PdfStandardFont {
        const { fontFamily, fontWeight, fontStyle } = style;

        // Handle font variations for Helvetica
        if (fontFamily === PdfStandardFont.Helvetica) {
            if (fontWeight === FontWeight.Bold && fontStyle === FontStyle.Italic) {
                return PdfStandardFont.HelveticaBoldOblique;
            } else if (fontWeight === FontWeight.Bold) {
                return PdfStandardFont.HelveticaBold;
            } else if (fontStyle === FontStyle.Italic) {
                return PdfStandardFont.HelveticaOblique;
            }
            return PdfStandardFont.Helvetica;
        }

        // Handle font variations for Times
        if (fontFamily === PdfStandardFont.TimesRoman) {
            if (fontWeight === FontWeight.Bold && fontStyle === FontStyle.Italic) {
                return PdfStandardFont.TimesBoldItalic;
            } else if (fontWeight === FontWeight.Bold) {
                return PdfStandardFont.TimesBold;
            } else if (fontStyle === FontStyle.Italic) {
                return PdfStandardFont.TimesItalic;
            }
            return PdfStandardFont.TimesRoman;
        }

        // Handle font variations for Courier
        if (fontFamily === PdfStandardFont.Courier) {
            if (fontWeight === FontWeight.Bold && fontStyle === FontStyle.Italic) {
                return PdfStandardFont.CourierBoldOblique;
            } else if (fontWeight === FontWeight.Bold) {
                return PdfStandardFont.CourierBold;
            } else if (fontStyle === FontStyle.Italic) {
                return PdfStandardFont.CourierOblique;
            }
            return PdfStandardFont.Courier;
        }

        return fontFamily;
    }

    /**
     * Measure text segments and break into lines
     */
    private measureRichText(
        maxWidth: number,
        fontRegistry: InternalFontRegistry
    ): RichTextMeasurement {
        // Flatten spans into segments
        const segments = this.flattenSpans(this.textSpan, this.defaultStyle);

        if (segments.length === 0) {
            return {
                width: 0,
                height: this.defaultStyle.fontSize * this.defaultStyle.lineSpacing,
                lineCount: 1,
                lines: [{
                    segments: [],
                    width: 0,
                    height: this.defaultStyle.fontSize * this.defaultStyle.lineSpacing,
                    baseline: this.defaultStyle.fontSize * 0.8,
                }],
            };
        }

        const lines: TextLine[] = [];
        let currentLine: TextSegment[] = [];
        let currentLineWidth = 0;
        let maxLineHeight = 0;
        let maxBaseline = 0;

        // Word-based line breaking
        for (const segment of segments) {
            const words = segment.text.split(/(\s+)/); // Keep whitespace
            const font = fontRegistry.getFont(this.getPdfFont(segment.style));

            if (!font) {
                // Skip segment if font is not available
                continue;
            }

            for (let i = 0; i < words.length; i++) {
                const word = words[i]!;
                const wordWidth = font.measureTextWidth(word, segment.style.fontSize);
                const segmentHeight = segment.style.fontSize * segment.style.lineSpacing;
                const baseline = font.getAscender(segment.style.fontSize);

                // Check if we need to break the line
                if (this.softWrap && currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    // Finish current line
                    lines.push({
                        segments: [...currentLine],
                        width: currentLineWidth,
                        height: maxLineHeight,
                        baseline: maxBaseline,
                    });

                    // Start new line
                    currentLine = [];
                    currentLineWidth = 0;
                    maxLineHeight = 0;
                    maxBaseline = 0;

                    // Check max lines limit
                    if (this.maxLines && lines.length >= this.maxLines) {
                        break;
                    }
                }

                // Add word to current line
                if (word.trim() || i === 0) { // Include non-whitespace words and first word
                    currentLine.push({
                        ...segment,
                        text: word,
                    });
                    currentLineWidth += wordWidth;
                    maxLineHeight = Math.max(maxLineHeight, segmentHeight);
                    maxBaseline = Math.max(maxBaseline, baseline);
                }
            }

            // Check max lines limit
            if (this.maxLines && lines.length >= this.maxLines) {
                break;
            }
        }

        // Add final line
        if (currentLine.length > 0) {
            lines.push({
                segments: currentLine,
                width: currentLineWidth,
                height: maxLineHeight,
                baseline: maxBaseline,
            });
        }

        const totalWidth = Math.max(...lines.map(line => line.width));
        const totalHeight = lines.reduce((sum, line) => sum + line.height, 0);

        return {
            width: totalWidth,
            height: totalHeight,
            lineCount: lines.length,
            lines,
        };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Mock font registry - in a real implementation this would come from context
        const mockFontRegistry: InternalFontRegistry = {
            getFont: (fontName: PdfStandardFont | string): PdfFontResource | undefined => ({
                name: `/F${fontName}`,
                measureTextWidth: (text: string, fontSize: number) => {
                    // Improved approximation based on font
                    const baseWidth = fontName.toString().includes('Courier') ? 0.6 : 0.5;
                    return text.length * fontSize * baseWidth;
                },
                getAscender: (fontSize: number) => fontSize * 0.8,
                getDescender: (fontSize: number) => fontSize * -0.2,
                getLineHeight: (fontSize: number) => fontSize * 1.2,
            }),
            registerFont: () => { },
            clear: () => { },
            getRegisteredFontNames: () => [],
        };

        const maxWidth = context.constraints.maxWidth === Number.POSITIVE_INFINITY
            ? 1000 // Default max width
            : context.constraints.maxWidth;

        const measurement = this.measureRichText(maxWidth, mockFontRegistry);

        const size: Size = {
            width: Math.min(measurement.width, context.constraints.maxWidth),
            height: Math.min(measurement.height, context.constraints.maxHeight),
        };

        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize, {
            baseline: measurement.lines[0]?.baseline ?? this.defaultStyle.fontSize * 0.8,
            needsRepaint: true,
        });
    }

    paint(context: PaintContext): void {
        const { graphics, size } = context;

        // Mock font registry for painting
        const mockFontRegistry: InternalFontRegistry = {
            getFont: (fontName: PdfStandardFont | string): PdfFontResource | undefined => ({
                name: `/F${fontName}`,
                measureTextWidth: (text: string, fontSize: number) => {
                    const baseWidth = fontName.toString().includes('Courier') ? 0.6 : 0.5;
                    return text.length * fontSize * baseWidth;
                },
                getAscender: (fontSize: number) => fontSize * 0.8,
                getDescender: (fontSize: number) => fontSize * -0.2,
                getLineHeight: (fontSize: number) => fontSize * 1.2,
            }),
            registerFont: () => { },
            clear: () => { },
            getRegisteredFontNames: () => [],
        };

        const measurement = this.measureRichText(size.width, mockFontRegistry);

        graphics.beginText();

        let currentY = 0;

        for (const line of measurement.lines) {
            let currentX = 0;
            const lineY = currentY + line.baseline;

            // Apply text alignment
            if (this.textAlign === 'center') {
                currentX = (size.width - line.width) / 2;
            } else if (this.textAlign === 'right') {
                currentX = size.width - line.width;
            }

            // Render each segment in the line
            for (const segment of line.segments) {
                if (!segment.text.trim()) {
                    // Skip rendering whitespace, but advance position
                    const font = mockFontRegistry.getFont(this.getPdfFont(segment.style));
                    if (font) {
                        currentX += font.measureTextWidth(segment.text, segment.style.fontSize);
                    }
                    continue;
                }

                // Set color for this segment
                graphics.setColor(segment.style.color);

                // Position text
                graphics.moveTextPosition(currentX, lineY);
                graphics.showText(segment.text);

                // Handle text decorations
                if (segment.style.decoration?.hasUnderline) {
                    const font = mockFontRegistry.getFont(this.getPdfFont(segment.style));
                    if (font) {
                        const textWidth = font.measureTextWidth(segment.text, segment.style.fontSize);
                        const underlineY = lineY - 2;
                        graphics.drawLine(currentX, underlineY, currentX + textWidth, underlineY);
                        graphics.strokePath();
                    }
                }

                if (segment.style.decoration?.hasLineThrough) {
                    const font = mockFontRegistry.getFont(this.getPdfFont(segment.style));
                    if (font) {
                        const textWidth = font.measureTextWidth(segment.text, segment.style.fontSize);
                        const strikeY = lineY + segment.style.fontSize * 0.3;
                        graphics.drawLine(currentX, strikeY, currentX + textWidth, strikeY);
                        graphics.strokePath();
                    }
                }

                // Advance X position
                const font = mockFontRegistry.getFont(this.getPdfFont(segment.style));
                if (font) {
                    currentX += font.measureTextWidth(segment.text, segment.style.fontSize);
                }
            }

            currentY += line.height;
        }

        graphics.endText();
    }
}

/**
 * Convenience function to create a RichText widget
 */
export function createRichText(text: TextSpan, props: Omit<RichTextProps, 'text'> = {}): RichText {
    return new RichText({ text, ...props });
}

/**
 * Helper functions for creating text spans
 */
export const TextSpans = {
    /** Create a simple text span */
    text: (text: string, style?: TextStyle): TextSpan => ({
        text,
        ...(style && { style }),
    }),

    /** Create a bold text span */
    bold: (text: string, style?: TextStyle): TextSpan => ({
        text,
        style: { fontWeight: FontWeight.Bold, ...style },
    }),

    /** Create an italic text span */
    italic: (text: string, style?: TextStyle): TextSpan => ({
        text,
        style: { fontStyle: FontStyle.Italic, ...style },
    }),

    /** Create an underlined text span */
    underline: (text: string, style?: TextStyle): TextSpan => ({
        text,
        style: {

            decoration: TextDecoration.underline,
            ...style,
        },
    }),

    /** Create a colored text span */
    colored: (text: string, color: PdfColor, style?: TextStyle): TextSpan => ({
        text,
        style: { color, ...style },
    }),

    /** Create a text span with custom font size */
    sized: (text: string, fontSize: number, style?: TextStyle): TextSpan => ({
        text,
        style: { fontSize, ...style },
    }),

    /** Combine multiple spans */
    combine: (...spans: TextSpan[]): TextSpan => ({
        text: '',
        children: spans,
    }),
};