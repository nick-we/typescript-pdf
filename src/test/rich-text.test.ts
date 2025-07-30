/**
 * RichText widget tests
 * 
 * Tests for the RichText widget implementation including text spans,
 * mixed formatting, and complex text layouts.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { RichText, createRichText, TextSpans, type TextSpan } from '../widgets/rich-text.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import { BoxConstraints, type LayoutContext, type PaintContext } from '../types/layout.js';
import { TextAlign, TextOverflow } from '../widgets/text.js';

// Mock graphics context for testing
class MockGraphicsContext {
    public commands: Array<{ type: string; args: any[] }> = [];

    beginText(): void {
        this.commands.push({ type: 'beginText', args: [] });
    }

    endText(): void {
        this.commands.push({ type: 'endText', args: [] });
    }

    setColor(color: any): void {
        this.commands.push({ type: 'setColor', args: [color] });
    }

    moveTextPosition(x: number, y: number): void {
        this.commands.push({ type: 'moveTextPosition', args: [x, y] });
    }

    showText(text: string): void {
        this.commands.push({ type: 'showText', args: [text] });
    }

    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.commands.push({ type: 'drawLine', args: [x1, y1, x2, y2] });
    }

    strokePath(): void {
        this.commands.push({ type: 'strokePath', args: [] });
    }

    reset(): void {
        this.commands = [];
    }
}

describe('RichText Widget', () => {
    let mockGraphics: MockGraphicsContext;
    let layoutContext: LayoutContext;
    let paintContext: PaintContext;

    beforeEach(() => {
        mockGraphics = new MockGraphicsContext();

        layoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 600 }),
            textDirection: 'ltr' as any,
            theme: {} as any,
        };

        paintContext = {
            graphics: mockGraphics as any,
            size: { width: 400, height: 100 },
            theme: {} as any,
        };
    });

    describe('Constructor and Basic Properties', () => {
        test('should create RichText with simple text span', () => {
            const span: TextSpan = { text: 'Hello World' };
            const richText = new RichText({ text: span });

            expect(richText).toBeInstanceOf(RichText);
        });

        test('should create RichText with styled text span', () => {
            const span: TextSpan = {
                text: 'Hello World',
                style: {
                    fontSize: 16,
                    color: '#ff0000',
                    fontWeight: 'bold',
                },
            };
            const richText = new RichText({ text: span });

            expect(richText).toBeInstanceOf(RichText);
        });

        test('should create RichText with nested spans', () => {
            const span: TextSpan = {
                text: '',
                children: [
                    { text: 'Hello ' },
                    { text: 'World', style: { fontWeight: 'bold' } },
                ],
            };
            const richText = new RichText({ text: span });

            expect(richText).toBeInstanceOf(RichText);
        });

        test('should handle empty text span', () => {
            const span: TextSpan = { text: '' };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThanOrEqual(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Layout Calculation', () => {
        test('should calculate layout for simple text', () => {
            const span: TextSpan = { text: 'Hello World' };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
            expect(result.baseline).toBeGreaterThan(0);
        });

        test('should handle constrained width for line breaking', () => {
            const span: TextSpan = {
                text: 'This is a very long text that should break into multiple lines when constrained'
            };
            const richText = new RichText({ text: span, softWrap: true });

            const constrainedContext = {
                ...layoutContext,
                constraints: BoxConstraints.tight({ width: 100, height: 200 }),
            };

            const result = richText.layout(constrainedContext);

            expect(result.size.width).toBeLessThanOrEqual(100);
            expect(result.size.height).toBeGreaterThan(12); // Should be multi-line
        });

        test('should respect max lines constraint', () => {
            const span: TextSpan = {
                text: 'Line one Line two Line three Line four Line five'
            };
            const richText = new RichText({
                text: span,
                maxLines: 2,
                softWrap: true,
            });

            const constrainedContext = {
                ...layoutContext,
                constraints: BoxConstraints.tight({ width: 50, height: 200 }),
            };

            const result = richText.layout(constrainedContext);

            // Should respect the constraints and not exceed available height
            expect(result.size.height).toBeLessThanOrEqual(200);
            expect(result.size.width).toBeLessThanOrEqual(50);
        });

        test('should handle different font sizes in spans', () => {
            const span: TextSpan = {
                text: '',
                children: [
                    { text: 'Small', style: { fontSize: 10 } },
                    { text: 'Large', style: { fontSize: 20 } },
                ],
            };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);

            expect(result.size.height).toBeGreaterThan(20); // Should accommodate largest font
        });
    });

    describe('Text Alignment', () => {
        test('should center-align text', () => {
            const span: TextSpan = { text: 'Center' };
            const richText = new RichText({
                text: span,
                textAlign: TextAlign.Center,
            });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        test('should right-align text', () => {
            const span: TextSpan = { text: 'Right' };
            const richText = new RichText({
                text: span,
                textAlign: TextAlign.Right,
            });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Text Styling', () => {
        test('should apply color to text segments', () => {
            const span: TextSpan = {
                text: '',
                children: [
                    { text: 'Red', style: { color: '#ff0000' } },
                    { text: 'Blue', style: { color: '#0000ff' } },
                ],
            };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        test('should handle underline decoration', () => {
            const span: TextSpan = {
                text: 'Underlined',
                style: {
                    decoration: { underline: true },
                },
            };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        test('should handle strikethrough decoration', () => {
            const span: TextSpan = {
                text: 'Strikethrough',
                style: {
                    decoration: { strikethrough: true },
                },
            };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Font Variations', () => {
        test('should handle bold text', () => {
            const span: TextSpan = {
                text: 'Bold Text',
                style: { fontWeight: 'bold' },
            };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });

        test('should handle italic text', () => {
            const span: TextSpan = {
                text: 'Italic Text',
                style: { fontStyle: 'italic' },
            };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });

        test('should handle different font families', () => {
            const span: TextSpan = {
                text: '',
                children: [
                    { text: 'Helvetica', style: { fontFamily: PdfStandardFont.Helvetica } },
                    { text: 'Times', style: { fontFamily: PdfStandardFont.TimesRoman } },
                    { text: 'Courier', style: { fontFamily: PdfStandardFont.Courier } },
                ],
            };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });
    });

    describe('Overflow Handling', () => {
        test('should handle clip overflow', () => {
            const span: TextSpan = {
                text: 'This text is too long for the container and should be clipped'
            };
            const richText = new RichText({
                text: span,
                overflow: TextOverflow.Clip,
                softWrap: false,
            });

            const result = richText.layout(layoutContext);
            expect(result).toBeDefined();
        });

        test('should handle visible overflow', () => {
            const span: TextSpan = {
                text: 'This text is too long for the container but should remain visible'
            };
            const richText = new RichText({
                text: span,
                overflow: TextOverflow.Visible,
                softWrap: false,
            });

            const result = richText.layout(layoutContext);
            expect(result).toBeDefined();
        });
    });

    describe('Complex Layouts', () => {
        test('should handle deeply nested spans', () => {
            const span: TextSpan = {
                text: '',
                children: [
                    {
                        text: 'Parent',
                        style: { fontSize: 16 },
                        children: [
                            {
                                text: 'Child',
                                style: { fontWeight: 'bold' },
                                children: [
                                    {
                                        text: 'Grandchild',
                                        style: { color: '#ff0000' },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            const richText = new RichText({ text: span });

            const result = richText.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        test('should handle mixed content with multiple lines', () => {
            const span: TextSpan = {
                text: '',
                children: [
                    { text: 'This is ' },
                    { text: 'bold', style: { fontWeight: 'bold' } },
                    { text: ' and this is ' },
                    { text: 'italic', style: { fontStyle: 'italic' } },
                    { text: ' and this is ' },
                    { text: 'colored', style: { color: '#ff0000' } },
                    { text: ' text that should wrap nicely across multiple lines.' },
                ],
            };
            const richText = new RichText({ text: span, softWrap: true });

            const constrainedContext = {
                ...layoutContext,
                constraints: BoxConstraints.tight({ width: 150, height: 200 }),
            };

            const result = richText.layout(constrainedContext);
            expect(result.size.width).toBeLessThanOrEqual(150);
            expect(result.size.height).toBeGreaterThan(24); // Multiple lines
        });
    });
});

describe('TextSpans Helper Functions', () => {
    test('should create simple text span', () => {
        const span = TextSpans.text('Hello');
        expect(span.text).toBe('Hello');
        expect(span.style).toBeUndefined();
    });

    test('should create bold text span', () => {
        const span = TextSpans.bold('Bold Text');
        expect(span.text).toBe('Bold Text');
        expect(span.style?.fontWeight).toBe('bold');
    });

    test('should create italic text span', () => {
        const span = TextSpans.italic('Italic Text');
        expect(span.text).toBe('Italic Text');
        expect(span.style?.fontStyle).toBe('italic');
    });

    test('should create underlined text span', () => {
        const span = TextSpans.underline('Underlined Text');
        expect(span.text).toBe('Underlined Text');
        expect(span.style?.decoration?.underline).toBe(true);
    });

    test('should create colored text span', () => {
        const span = TextSpans.colored('Colored Text', '#ff0000');
        expect(span.text).toBe('Colored Text');
        expect(span.style?.color).toBe('#ff0000');
    });

    test('should create sized text span', () => {
        const span = TextSpans.sized('Sized Text', 20);
        expect(span.text).toBe('Sized Text');
        expect(span.style?.fontSize).toBe(20);
    });

    test('should combine multiple spans', () => {
        const span = TextSpans.combine(
            TextSpans.text('Hello '),
            TextSpans.bold('World'),
            TextSpans.text('!')
        );
        expect(span.text).toBe('');
        expect(span.children).toHaveLength(3);
        expect(span.children![0]!.text).toBe('Hello ');
        expect(span.children![1]!.text).toBe('World');
        expect(span.children![2]!.text).toBe('!');
    });
});

describe('createRichText Helper', () => {
    test('should create RichText widget', () => {
        const span: TextSpan = { text: 'Hello World' };
        const richText = createRichText(span);

        expect(richText).toBeInstanceOf(RichText);
    });

    test('should create RichText with options', () => {
        const span: TextSpan = { text: 'Hello World' };
        const richText = createRichText(span, {
            textAlign: TextAlign.Center,
            maxLines: 2,
        });

        expect(richText).toBeInstanceOf(RichText);
    });
});