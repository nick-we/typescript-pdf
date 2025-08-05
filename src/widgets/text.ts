/**
 * Text Widget System - Consolidated
 *
 * Consolidates all text rendering functionality into a single focused module.
 * Replaces text.ts + rich-text.ts + text theme parts.
 *
 * @packageDocumentation
 */

import type { AccurateTextMeasurementService } from '@/core/accurate-text-measurement.js';
import { getGlobalTextMeasurement } from '@/core/accurate-text-measurement.js';
import { FontWeight, FontStyle } from '@/core/fonts.js';
import { widgetLogger } from '@/core/logger.js';
import type { IPdfColor } from '@/types/core-interfaces.js';
import {
    Theme, type Layout, type Geometry
} from '@/types.js';
import { BaseWidget, type WidgetProps } from '@/widgets/base.js';

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
 * Text widget properties
 */
export interface TextProps extends WidgetProps {
    /** The text content to display */
    content: string;
    /** Text styling */
    style?: Theme.TextStyle;
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
 * Text span for rich text composition
 */
export interface TextSpan {
    /** Text content */
    text: string;
    /** Text style */
    style?: Theme.TextStyle;
}

/**
 * Rich text widget properties
 */
export interface RichTextProps extends WidgetProps {
    /** List of text spans */
    spans: TextSpan[];
    /** Overall text alignment */
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
}

/**
 * Text widget for rendering styled text
 */
export class TextWidget extends BaseWidget {
    private readonly content: string;
    private readonly style?: Theme.TextStyle;
    private readonly textAlign: TextAlign;
    private readonly overflow: TextOverflow;
    private readonly maxLines?: number;
    private readonly softWrap: boolean;

    constructor(content: string, props: Omit<TextProps, 'content'> = {}) {
        super(props);

        this.content = content;
        if (props.style) { this.style = props.style; }
        this.textAlign = props.textAlign ?? TextAlign.Left;
        this.overflow = props.overflow ?? TextOverflow.Clip;
        if (props.maxLines) { this.maxLines = props.maxLines; }
        this.softWrap = props.softWrap ?? true;
    }

    /**
     * Get effective text style by merging with theme
     */
    private getEffectiveStyle(theme: Theme.ThemeData): Theme.TextStyle {
        if (!this.style) {
            return theme.defaultTextStyle;
        }

        if (this.style.inherit === false) {
            return this.style;
        }

        return Theme.Utils.mergeTextStyles(theme.defaultTextStyle, this.style);
    }

    /**
     * Measure text dimensions with proper wrapping and truncation support
     * FIXED: Enhanced integration with AccurateTextMeasurementService
     */
    private measureText(
        maxWidth: number,
        effectiveStyle: Theme.TextStyle,
        textMeasurement?: AccurateTextMeasurementService
    ): TextMeasurement {
        const fontSize = effectiveStyle.fontSize ?? 12;
        const fontFamily = effectiveStyle.fontFamily ?? 'Helvetica';
        const fontWeight = effectiveStyle.fontWeight ?? FontWeight.Normal;
        const fontStyle = effectiveStyle.fontStyle ?? FontStyle.Normal;
        const lineSpacing = effectiveStyle.lineSpacing ?? 1.2;

        // FIXED: Better text measurement service resolution
        const measurementService = textMeasurement ?? (() => {
            try {
                return getGlobalTextMeasurement();
            } catch {
                // Fallback to approximation if service not available (testing scenarios)
                return undefined;
            }
        })();

        // FIXED: Handle empty text properly
        if (!this.content || this.content.trim() === '') {
            const metrics = measurementService?.getFontMetrics(fontSize, fontFamily, fontWeight, fontStyle, lineSpacing) ?? {
                height: fontSize * lineSpacing,
                baseline: fontSize * 0.8,
                ascender: fontSize * 0.8,
                descender: fontSize * 0.2
            };

            return {
                width: 0,
                height: metrics.height, // FIXED: Ensure non-zero height for empty text
                baseline: metrics.baseline,
                lineCount: 1,
            };
        }

        // Handle single line text (no wrapping)
        if (!this.softWrap) {
            let content = this.content;
            let width: number;

            if (measurementService) {
                width = measurementService.measureTextWidth(content, fontSize, fontFamily, fontWeight, fontStyle);
            } else {
                // FIXED: Use consistent fallback multiplier (0.6 to match mock)
                width = content.length * fontSize * 0.55;
            }

            // Apply truncation if text exceeds maxWidth
            if (width > maxWidth && this.overflow === TextOverflow.Ellipsis) {
                if (measurementService) {
                    content = measurementService.truncateTextAccurate(content, maxWidth, {
                        fontSize, fontFamily, fontWeight, fontStyle
                    });
                    width = measurementService.measureTextWidth(content, fontSize, fontFamily, fontWeight, fontStyle);
                } else {
                    // Fallback truncation
                    content = TextUtils.truncate(content, maxWidth, fontSize);
                    width = content.length * fontSize * 0.55;
                }
            } else if (width > maxWidth && this.overflow === TextOverflow.Clip) {
                width = maxWidth;
            }

            const metrics = measurementService?.getFontMetrics(fontSize, fontFamily, fontWeight, fontStyle, lineSpacing) ?? {
                height: fontSize * lineSpacing,
                baseline: fontSize * 0.8,
                ascender: fontSize * 0.8,
                descender: fontSize * 0.2
            };

            return {
                width: Math.min(width, maxWidth),
                height: metrics.height,
                baseline: metrics.baseline,
                lineCount: 1,
            };
        }

        // Handle multi-line text (with wrapping)
        let wrappedLines: string[];

        if (measurementService) {
            // FIXED: Always use accurate measurement service when available
            wrappedLines = measurementService.wrapTextAccurate(this.content, maxWidth, {
                fontSize, fontFamily, fontWeight, fontStyle, lineSpacing
            });
        } else {
            // Fallback to old wrapping
            wrappedLines = TextUtils.wrap(this.content, maxWidth, fontSize);
        }

        let finalLines = wrappedLines;

        // Apply maxLines limit if specified
        if (this.maxLines && finalLines.length > this.maxLines) {
            finalLines = finalLines.slice(0, this.maxLines);

            // Add ellipsis to last line if overflow is ellipsis
            if (this.overflow === TextOverflow.Ellipsis && finalLines.length > 0) {
                const lastLineIndex = finalLines.length - 1;
                const lastLine = finalLines[lastLineIndex];

                if (lastLine && measurementService) {
                    // Use accurate ellipsis truncation
                    const ellipsisWidth = measurementService.measureTextWidth('...', fontSize, fontFamily, fontWeight, fontStyle);
                    const availableWidth = maxWidth - ellipsisWidth;

                    const lineWidth = measurementService.measureTextWidth(lastLine, fontSize, fontFamily, fontWeight, fontStyle);
                    if (lineWidth > availableWidth) {
                        finalLines[lastLineIndex] = measurementService.truncateTextAccurate(lastLine, maxWidth, {
                            fontSize, fontFamily, fontWeight, fontStyle
                        }, '...');
                    }
                } else if (lastLine) {
                    // Fallback ellipsis handling
                    const avgCharWidth = fontSize * 0.55;
                    const availableWidth = maxWidth - (3 * avgCharWidth);
                    if (lastLine.length * avgCharWidth > availableWidth) {
                        const maxChars = Math.floor(availableWidth / avgCharWidth);
                        finalLines[lastLineIndex] = lastLine.substring(0, maxChars) + '...';
                    }
                }
            }
        }

        const actualLineCount = finalLines.length;
        const metrics = measurementService?.getFontMetrics(fontSize, fontFamily, fontWeight, fontStyle, lineSpacing) ?? {
            height: fontSize * lineSpacing,
            baseline: fontSize * 0.8,
            ascender: fontSize * 0.8,
            descender: fontSize * 0.2
        };

        const totalHeight = actualLineCount * metrics.height;

        // FIXED: Calculate the actual width as the maximum line width with better consistency
        let maxLineWidth: number;
        if (measurementService) {
            const actualWidths = finalLines.map(line =>
                measurementService.measureTextWidth(line, fontSize, fontFamily, fontWeight, fontStyle)
            );
            maxLineWidth = Math.max(...actualWidths, 0); // Ensure non-negative
        } else {
            // Fallback width calculation
            maxLineWidth = Math.max(
                ...finalLines.map(line => Math.min(line.length * fontSize * 0.55, maxWidth)),
                0 // Ensure non-negative
            );
        }

        return {
            width: Math.min(maxLineWidth, maxWidth),
            height: totalHeight,
            baseline: metrics.baseline,
            lineCount: actualLineCount,
        };
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        const effectiveStyle = this.getEffectiveStyle(context.theme);

        const maxWidth = context.constraints.maxWidth;

        // FIXED: Always prefer AccurateTextMeasurementService when available
        const measurement = this.measureText(maxWidth, effectiveStyle, context.textMeasurement as AccurateTextMeasurementService);

        // FIXED: Better size calculation that respects both measurement and constraints
        const size: Geometry.Size = {
            width: Math.min(measurement.width, maxWidth),
            height: Math.min(measurement.height, context.constraints.maxHeight),
        };

        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize, {
            baseline: measurement.baseline,
            needsRepaint: true,
        });
    }

    paint(context: Layout.PaintContext): void {
        if (!this.content.trim()) {
            return;
        }

        const effectiveStyle = this.getEffectiveStyle(context.theme);
        const fontSize = effectiveStyle.fontSize ?? 12;
        const fontFamily = effectiveStyle.fontFamily ?? 'Helvetica';
        const fontWeight = effectiveStyle.fontWeight ?? FontWeight.Normal;
        const fontStyle = effectiveStyle.fontStyle ?? FontStyle.Normal;
        const lineSpacing = effectiveStyle.lineSpacing ?? 1.2;

        // Get text measurement service
        const measurementService = context.textMeasurement ?? (() => {
            try {
                return getGlobalTextMeasurement();
            } catch {
                return null;
            }
        })();

        // Get the processed text lines (same logic as measureText)
        const textLines = this.getProcessedTextLines(context.size.width, effectiveStyle, measurementService as AccurateTextMeasurementService);

        // Only do actual graphics operations if graphics context is available
        if (context.graphics && context.fontRegistry) {
            const color = this.parseColor(effectiveStyle.color ?? '#000000');

            // Get font from registry
            const font = context.fontRegistry.getFont(fontFamily);

            // Set text color
            context.graphics.setFillColor(color);

            // Save graphics state for text transformation
            context.graphics.save();

            // For text, we need to flip back because PDF text commands expect normal orientation
            context.graphics.scale(1, -1);

            // Get font metrics for accurate positioning
            const metrics = measurementService?.getFontMetrics(fontSize, fontFamily, fontWeight, fontStyle, lineSpacing) ?? {
                height: fontSize * lineSpacing,
                baseline: fontSize * 0.8,
                ascender: fontSize * 0.8,
                descender: fontSize * 0.2
            };

            // Draw each line of text
            textLines.forEach((line, lineIndex) => {
                // Calculate text position based on alignment with accurate measurements
                let x = 0;
                let actualLineWidth: number;

                if (measurementService) {
                    actualLineWidth = measurementService.measureTextWidth(line, fontSize, fontFamily, fontWeight, fontStyle);
                } else {
                    // Fallback to approximation
                    actualLineWidth = line.length * fontSize * 0.55;
                }

                if (this.textAlign === TextAlign.Center) {
                    x = (context.size.width - actualLineWidth) / 2;
                } else if (this.textAlign === TextAlign.Right) {
                    x = context.size.width - actualLineWidth;
                }

                // Y position for this line (negative because coordinate system is flipped)
                // Use accurate baseline positioning
                const y = -(metrics.baseline + (lineIndex * metrics.height));

                // Draw the line
                context.graphics?.drawString(font, fontSize, line, x, y);
            });

            // Restore graphics state
            context.graphics.restore();
        }
    }

    /**
     * Get processed text lines for rendering (same logic as measureText)
     */
    private getProcessedTextLines(
        maxWidth: number,
        effectiveStyle: Theme.TextStyle,
        textMeasurement?: AccurateTextMeasurementService
    ): string[] {
        const fontSize = effectiveStyle.fontSize ?? 12;
        const fontFamily = effectiveStyle.fontFamily ?? 'Helvetica';
        const fontWeight = effectiveStyle.fontWeight ?? FontWeight.Normal;
        const fontStyle = effectiveStyle.fontStyle ?? FontStyle.Normal;
        const lineSpacing = effectiveStyle.lineSpacing ?? 1.2;

        // Get text measurement service
        const measurementService = textMeasurement ?? (() => {
            try {
                return getGlobalTextMeasurement();
            } catch {
                return undefined;
            }
        })();

        // Handle single line text (no wrapping)
        if (!this.softWrap) {
            let content = this.content;

            // Apply truncation if text exceeds maxWidth
            if (this.overflow === TextOverflow.Ellipsis) {
                if (measurementService) {
                    const totalWidth = measurementService.measureTextWidth(content, fontSize, fontFamily, fontWeight, fontStyle);
                    if (totalWidth > maxWidth) {
                        content = measurementService.truncateTextAccurate(content, maxWidth, {
                            fontSize, fontFamily, fontWeight, fontStyle
                        });
                    }
                } else {
                    // Fallback truncation
                    content = TextUtils.truncate(content, maxWidth, fontSize);
                }
            }

            return [content];
        }

        // Handle multi-line text (with wrapping)
        let wrappedLines: string[];

        if (measurementService) {
            wrappedLines = measurementService.wrapTextAccurate(this.content, maxWidth, {
                fontSize, fontFamily, fontWeight, fontStyle, lineSpacing
            });
        } else {
            // Fallback to old wrapping
            wrappedLines = TextUtils.wrap(this.content, maxWidth, fontSize);
        }

        let finalLines = wrappedLines;

        // Apply maxLines limit if specified
        if (this.maxLines && finalLines.length > this.maxLines) {
            finalLines = finalLines.slice(0, this.maxLines);

            // Add ellipsis to last line if overflow is ellipsis
            if (this.overflow === TextOverflow.Ellipsis && finalLines.length > 0) {
                const lastLineIndex = finalLines.length - 1;
                const lastLine = finalLines[lastLineIndex];

                if (lastLine && measurementService) {
                    // Use accurate ellipsis truncation
                    const ellipsisWidth = measurementService.measureTextWidth('...', fontSize, fontFamily, fontWeight, fontStyle);
                    const availableWidth = maxWidth - ellipsisWidth;

                    const lineWidth = measurementService.measureTextWidth(lastLine, fontSize, fontFamily, fontWeight, fontStyle);
                    if (lineWidth > availableWidth) {
                        finalLines[lastLineIndex] = measurementService.truncateTextAccurate(lastLine, maxWidth, {
                            fontSize, fontFamily, fontWeight, fontStyle
                        }, '...');
                    }
                } else if (lastLine) {
                    // Fallback ellipsis handling
                    const avgCharWidth = fontSize * 0.55;
                    const availableWidth = maxWidth - (3 * avgCharWidth);
                    if (lastLine.length * avgCharWidth > availableWidth) {
                        const maxChars = Math.floor(availableWidth / avgCharWidth);
                        finalLines[lastLineIndex] = lastLine.substring(0, maxChars) + '...';
                    }
                }
            }
        }

        return finalLines;
    }

    /**
     * Parse color string to color object
     */
    private parseColor(colorStr: string): IPdfColor {
        // Simple hex color parser
        if (colorStr.startsWith('#')) {
            const hex = colorStr.slice(1);
            const r = parseInt(hex.slice(0, 2), 16) / 255;
            const g = parseInt(hex.slice(2, 4), 16) / 255;
            const b = parseInt(hex.slice(4, 6), 16) / 255;
            return { red: r, green: g, blue: b };
        }
        // Default to black
        return { red: 0, green: 0, blue: 0 };
    }
}

/**
 * Rich text widget for multi-span text rendering
 */
export class RichText extends BaseWidget {
    private readonly spans: TextSpan[];
    private readonly textAlign: TextAlign;
    private readonly overflow: TextOverflow;
    private readonly maxLines?: number;
    private readonly softWrap: boolean;

    constructor(props: RichTextProps) {
        super(props);

        this.spans = props.spans;
        this.textAlign = props.textAlign ?? TextAlign.Left;
        this.overflow = props.overflow ?? TextOverflow.Clip;
        if (props.maxLines) { this.maxLines = props.maxLines; }
        this.softWrap = props.softWrap ?? true;
    }

    /**
     * Get combined text content from all spans
     */
    private getCombinedText(): string {
        return this.spans.map(span => span.text).join('');
    }

    /**
     * Measure rich text dimensions
     */
    private measureRichText(
        maxWidth: number,
        theme: Theme.ThemeData
    ): TextMeasurement {
        const combinedText = this.getCombinedText();

        // Use the first span's style or theme default for measurement
        const firstSpanStyle = this.spans[0]?.style;
        const effectiveStyle = firstSpanStyle
            ? Theme.Utils.mergeTextStyles(theme.defaultTextStyle, firstSpanStyle)
            : theme.defaultTextStyle;

        const fontSize = effectiveStyle.fontSize ?? 12;
        const lineHeight = fontSize * (effectiveStyle.lineSpacing ?? 1.2);
        let totalWidth: number;
        try {
            const measurementService = getGlobalTextMeasurement();
            totalWidth = measurementService.measureTextWidth(combinedText, fontSize, effectiveStyle.fontFamily ?? 'Helvetica', effectiveStyle.fontWeight ?? FontWeight.Normal, effectiveStyle.fontStyle ?? FontStyle.Normal);
        } catch {
            // Fallback to approximation
            totalWidth = combinedText.length * fontSize * 0.55;
        }
        const ascender = fontSize * 0.8;

        return {
            width: Math.min(totalWidth, maxWidth),
            height: lineHeight,
            baseline: ascender,
            lineCount: 1,
        };
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        const maxWidth = context.constraints.maxWidth === Number.POSITIVE_INFINITY
            ? 1000
            : context.constraints.maxWidth;

        const measurement = this.measureRichText(maxWidth, context.theme);

        const size: Geometry.Size = {
            width: Math.min(measurement.width, context.constraints.maxWidth),
            height: Math.min(measurement.height, context.constraints.maxHeight),
        };

        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize, {
            baseline: measurement.baseline,
            needsRepaint: true,
        });
    }

    paint(_context: Layout.PaintContext): void {
        const combinedText = this.getCombinedText();
        if (!combinedText.trim()) {
            return;
        }

        this.spans.forEach((span, index) => {
            widgetLogger.debug(`  Span ${index}: "${span.text}"`);
        });
    }
}

/**
 * Convenience function to create a Text widget
 */
export function createText(content: string, props: Omit<TextProps, 'content'> = {}): TextWidget {
    return new TextWidget(content, props);
}

/**
 * Convenience function to create a RichText widget
 */
export function createRichText(props: RichTextProps): RichText {
    return new RichText(props);
}

/**
 * Text utility functions - consolidated from various text helpers
 */
export const TextUtils = {
    /**
     * Create a simple text span
     */
    span(text: string, style?: Theme.TextStyle): TextSpan {
        const span: TextSpan = { text };
        if (style) { span.style = style; }
        return span;
    },

    /**
     * Create multiple spans from text array
     */
    spans(texts: Array<string | { text: string; style?: Theme.TextStyle }>): TextSpan[] {
        return texts.map(item =>
            typeof item === 'string'
                ? { text: item }
                : item
        );
    },

    /**
     * Estimate text width (simplified)
     */
    estimateWidth(text: string, fontSize: number = 12): number {
        return text.length * fontSize * 0.55;
    },

    /**
     * Estimate text height
     */
    estimateHeight(fontSize: number = 12, lineSpacing: number = 1.2): number {
        return fontSize * lineSpacing;
    },

    /**
     * Truncate text to fit width (DEPRECATED - use AccurateTextMeasurementService for accurate results)
     * This function is kept for backward compatibility and testing fallbacks
     */
    truncate(text: string, maxWidth: number, fontSize: number = 12): string {
        const charWidth = fontSize * 0.55;
        const maxChars = Math.floor(maxWidth / charWidth);

        if (text.length <= maxChars) {
            return text;
        }

        return text.substring(0, maxChars - 3) + '...';
    },

    /**
     * Word wrap text (DEPRECATED - use AccurateTextMeasurementService for accurate results)
     * This function is kept for backward compatibility and testing fallbacks
     */
    wrap(text: string, maxWidth: number, fontSize: number = 12): string[] {
        const charWidth = fontSize * 0.55;
        const maxChars = Math.floor(maxWidth / charWidth);

        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;

            if (testLine.length <= maxChars) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    },
};

/**
 * Common text style presets - consolidated from TextStyles
 */
export const TextStyles = {
    /** Heading 1 style */
    h1: {
        fontSize: 24,
        fontWeight: Theme.FontWeight.Bold,
        fontFamily: 'Helvetica',
    } as Theme.TextStyle,

    /** Heading 2 style */
    h2: {
        fontSize: 20,
        fontWeight: Theme.FontWeight.Bold,
        fontFamily: 'Helvetica',
    } as Theme.TextStyle,

    /** Heading 3 style */
    h3: {
        fontSize: 16,
        fontWeight: Theme.FontWeight.Bold,
        fontFamily: 'Helvetica',
    } as Theme.TextStyle,

    /** Body text style */
    body: {
        fontSize: 12,
        fontWeight: Theme.FontWeight.Normal,
        fontFamily: 'Helvetica',
    } as Theme.TextStyle,

    /** Caption text style */
    caption: {
        fontSize: 10,
        fontWeight: Theme.FontWeight.Normal,
        fontFamily: 'Helvetica',
        color: '#666666',
    } as Theme.TextStyle,

    /** Code text style */
    code: {
        fontSize: 11,
        fontWeight: Theme.FontWeight.Normal,
        fontFamily: 'Courier',
        color: '#333333',
    } as Theme.TextStyle,
};