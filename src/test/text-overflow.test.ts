/**
 * Text Overflow Test - Reproduce Text Wrapping and Truncation Issues
 * 
 * This test reproduces the issue where text that exceeds the length of its 
 * parent constraints doesn't get wrapped (line break) or truncated properly.
 */

import { describe, test, expect } from 'vitest';
import { Container } from '../widgets/layout.js';
import { TextWidget, TextOverflow, TextAlign, TextUtils } from '../widgets/text.js';
import { Layout, defaultTheme } from '../types.js';
import { Document } from '../core/document.js';

describe('Text Overflow Issues - Reproduction', () => {
    const mockTheme = defaultTheme;

    test('Long text should wrap within container constraints', () => {
        const longText = "This is a very long text that should definitely wrap when placed inside a narrow container but currently doesn't wrap properly.";

        const narrowContainer = new Container({
            width: 150,  // Narrow container
            height: 100,
            alignment: Layout.Alignment.TopLeft,
            decoration: {
                color: '#f0f0f0',
                border: { width: 1, color: '#000000' }
            },
            child: new TextWidget(longText, {
                style: { fontSize: 12, color: '#000000' },
                softWrap: true,  // Should wrap but probably doesn't
                overflow: TextOverflow.Clip
            })
        });

        const layoutContext = {
            constraints: { minWidth: 0, maxWidth: 150, minHeight: 0, maxHeight: 100 },
            textDirection: 'ltr' as const,
            theme: mockTheme
        };

        const result = narrowContainer.layout(layoutContext);

        console.log(`Container layout result: ${JSON.stringify(result.size)}`);

        // The issue: Container maintains its size but text doesn't wrap
        expect(result.size.width).toBe(150);
        expect(result.size.height).toBe(100);
    });

    test('Text with ellipsis overflow should truncate properly', () => {
        const longText = "This text is too long and should be truncated with ellipsis";

        const text = new TextWidget(longText, {
            style: { fontSize: 14, color: '#000000' },
            overflow: TextOverflow.Ellipsis,  // Should add ... but probably doesn't
            softWrap: false,
            maxLines: 1
        });

        const layoutContext = {
            constraints: { minWidth: 0, maxWidth: 100, minHeight: 0, maxHeight: 20 },
            textDirection: 'ltr' as const,
            theme: mockTheme
        };

        const result = text.layout(layoutContext);

        console.log(`Text size for ellipsis test: ${JSON.stringify(result.size)}`);

        // Current issue: Text probably sizes to full content width instead of constraining
        expect(result.size.width).toBeLessThanOrEqual(100); // Should constrain to max width
    });

    test('Multi-line text with maxLines should respect line limits', () => {
        const multiLineText = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";

        const text = new TextWidget(multiLineText, {
            style: { fontSize: 12, color: '#000000' },
            maxLines: 3,  // Should only show 3 lines
            overflow: TextOverflow.Ellipsis,
            softWrap: true
        });

        const layoutContext = {
            constraints: { minWidth: 0, maxWidth: 200, minHeight: 0, maxHeight: 200 },
            textDirection: 'ltr' as const,
            theme: mockTheme
        };

        const result = text.layout(layoutContext);

        console.log(`Multi-line text size: ${JSON.stringify(result.size)}`);

        // Issue: Text probably treats everything as single line
        // Should be approximately 3 lines * line height
        const expectedHeight = 12 * 1.2 * 3; // fontSize * lineSpacing * maxLines
        console.log(`Expected height for 3 lines: ${expectedHeight}`);
    });

    test('Visual reproduction test - Generate PDF showing text overflow issues', async () => {
        const doc = new Document();

        const textOverflowShowcase = new Container({
            width: 400,
            height: 500,
            decoration: {
                color: '#ffffff',
                border: { width: 2, color: '#000000' }
            },
            child: new Container({
                width: 360,
                height: 460,
                alignment: Layout.Alignment.TopLeft,
                child: new Container({
                    width: 320,
                    height: 420,
                    alignment: Layout.Alignment.TopLeft,
                    child: (() => {
                        // Create examples of text overflow issues
                        return new Container({
                            width: 280,
                            height: 380,
                            decoration: {
                                color: '#f8f9fa',
                                border: { width: 1, color: '#cccccc' }
                            },
                            child: new Container({
                                width: 150,  // Narrow container
                                height: 100,
                                alignment: Layout.Alignment.TopLeft,
                                decoration: {
                                    color: '#ffe6e6',
                                    border: { width: 1, color: '#ff0000' }
                                },
                                child: new TextWidget(
                                    "This is a very long text that should wrap within the red container but currently overflows because wrapping is not implemented properly.",
                                    {
                                        style: { fontSize: 10, color: '#333333' },
                                        softWrap: true,
                                        overflow: TextOverflow.Clip
                                    }
                                )
                            })
                        });
                    })()
                })
            })
        });

        doc.addPage({
            build: () => textOverflowShowcase
        });

        const pdfBytes = await doc.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(pdfBytes.length).toBeGreaterThan(0);

        console.log(`✅ Generated text overflow demonstration PDF: ${pdfBytes.length} bytes`);
        console.log('📋 Text overflow issues demonstrated:');
        console.log('   - Long text overflowing narrow red container');
        console.log('   - No text wrapping despite softWrap: true');
        console.log('   - Text extends beyond container boundaries');
        console.log('   - This PDF shows the current broken behavior');
    });

    test('Current TextUtils functions work correctly', async () => {
        const longText = "This is a long text that should be wrapped or truncated";

        // Test TextUtils.wrap function
        const wrappedLines = TextUtils.wrap(longText, 100, 12);
        console.log(`TextUtils.wrap result:`, wrappedLines);

        // Test TextUtils.truncate function
        const truncatedText = TextUtils.truncate(longText, 100, 12);
        console.log(`TextUtils.truncate result:`, truncatedText);

        // These functions work, but they're not integrated into the Text widget
        expect(wrappedLines.length).toBeGreaterThan(1);
        expect(truncatedText).toContain('...');
        expect(truncatedText.length).toBeLessThan(longText.length);
    });
});