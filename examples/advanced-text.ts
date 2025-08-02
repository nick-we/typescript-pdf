/**
 * Advanced Text Rendering Example
 * 
 * Demonstrates the advanced text features implemented in Week 11-12:
 * - RichText widget with text spans
 * - Mixed text formatting (bold, italic, colors, etc.)
 * - Font fallback system
 * - Advanced text measurement and line breaking
 * - Complex text layouts
 */

import {
    Document,
    RichText,
    createRichText,
    TextSpans,
    Text,
    Container,
    Column,
    Padding,
    EdgeInsets,
    BoxConstraints,
    TextAlign,
    PdfStandardFont,
} from '../src/index.js';
import {
    FontUtils,
    TextMeasurementUtils,
    defaultTextMetrics,
    type TextMeasurementOptions,
    type LineBreakingOptions,
    FontWeight,
    FontStyle,
} from '../src/core/index.js';
import { TextDecoration } from '../src/types/theming.js';
import { PdfColor } from '../src/core/pdf/color.js';

/**
 * Example 1: Basic RichText with Mixed Formatting
 */
function createBasicRichTextExample(): RichText {
    const span = TextSpans.combine(
        TextSpans.text('This is '),
        TextSpans.bold('bold text'),
        TextSpans.text(', this is '),
        TextSpans.italic('italic text'),
        TextSpans.text(', and this is '),
        TextSpans.colored('colored text', PdfColor.fromHex('#ff0000')),
        TextSpans.text('.')
    );

    return createRichText(span, {
        style: { fontSize: 14, lineSpacing: 1.4 },
        textAlign: TextAlign.Left,
        softWrap: true,
    });
}

/**
 * Example 2: Complex Rich Text with Nested Spans
 */
function createComplexRichTextExample(): RichText {
    const span = TextSpans.combine(
        TextSpans.sized('Large Title', 24, { fontWeight: FontWeight.Bold }),
        TextSpans.text('\n\n'),
        TextSpans.text('This paragraph demonstrates '),
        TextSpans.bold('nested formatting'),
        TextSpans.text(' with '),
        TextSpans.combine(
            TextSpans.italic('italic '),
            TextSpans.underline('underlined'),
            TextSpans.text(' text')
        ),
        TextSpans.text(' and '),
        TextSpans.colored('multiple colors', PdfColor.fromHex('#0066cc')),
        TextSpans.text(' in the same sentence.\n\n'),
        TextSpans.text('Different font families: '),
        TextSpans.text('Helvetica (default), ', { fontFamily: PdfStandardFont.Helvetica }),
        TextSpans.text('Times Roman, ', { fontFamily: PdfStandardFont.TimesRoman }),
        TextSpans.text('and Courier.', { fontFamily: PdfStandardFont.Courier })
    );

    return createRichText(span, {
        style: { fontSize: 12, lineSpacing: 1.5 },
        textAlign: TextAlign.Left,
        softWrap: true,
    });
}

/**
 * Example 3: Font Fallback Demonstration
 */
function demonstrateFontFallback(): Container {
    // Show how different font names resolve to PDF standard fonts
    const fontExamples = [
        { input: 'Arial', expected: 'Helvetica' },
        { input: 'Times New Roman', expected: 'Times-Roman' },
        { input: 'Courier New', expected: 'Courier' },
        { input: '-apple-system', expected: 'Helvetica (system fallback)' },
        { input: 'Georgia', expected: 'Times-Roman (serif fallback)' },
        { input: 'Monaco', expected: 'Courier (monospace fallback)' },
    ];

    const examples = fontExamples.map(({ input, expected }) => {
        const resolvedFont = FontUtils.resolveFont(input);
        return createRichText(
            TextSpans.combine(
                TextSpans.text(`${input} → `),
                TextSpans.bold(resolvedFont, { color: '#0066cc' }),
                TextSpans.text(` (${expected})`)
            ),
            { style: { fontSize: 11, lineSpacing: 1.3 } }
        );
    });

    return new Container({
        padding: EdgeInsets.all(16),
        child: new Column({
            children: [
                new Text('Font Fallback Examples:', {
                    style: { fontSize: 16, fontWeight: FontWeight.Bold },
                }),
                new Container({ height: 10 }), // Spacer
                ...examples,
            ],
        }),
    });
}

/**
 * Example 4: Text Metrics and Measurement
 */
function demonstrateTextMetrics(): Container {
    const sampleText = 'The quick brown fox jumps over the lazy dog.';

    // Calculate text bounds for different widths
    const measurements = [100, 200, 300].map(width => {
        const bounds = TextMeasurementUtils.getTextBounds(sampleText, 12, width);
        return {
            width,
            bounds,
        };
    });

    const examples = measurements.map(({ width, bounds }) => {
        return createRichText(
            TextSpans.combine(
                TextSpans.text(`Max width: ${width}pt → `),
                TextSpans.colored(`${bounds.lineCount} lines`, PdfColor.fromHex('#0066cc')),
                TextSpans.text(`, height: ${bounds.height.toFixed(1)}pt`)
            ),
            { style: { fontSize: 11 } }
        );
    });

    return new Container({
        padding: EdgeInsets.all(16),
        child: new Column({
            children: [
                new Text('Text Measurement Examples:', {
                    style: { fontSize: 16, fontWeight: FontWeight.Bold },
                }),
                new Container({ height: 10 }), // Spacer
                new Text(`Sample text: "${sampleText}"`, {
                    style: { fontSize: 10, fontStyle: FontStyle.Italic, color: '#666666' },
                }),
                new Container({ height: 8 }), // Spacer
                ...examples,
            ],
        }),
    });
}

/**
 * Example 5: Advanced Line Breaking
 */
function demonstrateLineBreaking(): Container {
    const longText = 'This is a very long paragraph that demonstrates advanced line breaking algorithms. The text will be broken into multiple lines based on the available width constraints, and the system will try to create visually pleasing line breaks that avoid orphaned words and maintain good typography.';

    // Create examples with different line breaking strategies
    const strategies = [
        { name: 'Narrow (100pt)', width: 100 },
        { name: 'Medium (200pt)', width: 200 },
        { name: 'Wide (300pt)', width: 300 },
    ];

    const examples = strategies.map(({ name, width }) => {
        return new Container({
            width,
            decoration: {
                border: { width: 1, color: PdfColor.fromHex('#cccccc') },
            },
            padding: EdgeInsets.all(8),
            child: new Column({
                children: [
                    new Text(name, {
                        style: { fontSize: 10, fontWeight: FontWeight.Bold, color: '#0066cc' },
                    }),
                    new Container({ height: 4 }), // Spacer
                    createRichText(
                        TextSpans.text(longText),
                        {
                            style: { fontSize: 10, lineSpacing: 1.3 },
                            softWrap: true,
                        }
                    ),
                ],
            }),
        });
    });

    return new Container({
        padding: EdgeInsets.all(16),
        child: new Column({
            children: [
                new Text('Line Breaking Examples:', {
                    style: { fontSize: 16, fontWeight: FontWeight.Bold },
                }),
                new Container({ height: 12 }), // Spacer
                ...examples,
            ],
        }),
    });
}

/**
 * Example 6: Typography Showcase
 */
function createTypographyShowcase(): Container {
    const headingSpan = TextSpans.combine(
        TextSpans.sized('Typography ', 28, { fontWeight: FontWeight.Bold }),
        TextSpans.sized('Showcase', 28, { fontWeight: FontWeight.Bold, color: '#0066cc' })
    );

    const bodySpan = TextSpans.combine(
        TextSpans.text('This example demonstrates various typographic features including '),
        TextSpans.bold('bold text'),
        TextSpans.text(', '),
        TextSpans.italic('italic text'),
        TextSpans.text(', '),
        TextSpans.underline('underlined text'),
        TextSpans.text(', and '),
        TextSpans.text('text with strikethrough', { decoration: TextDecoration.lineThrough }),
        TextSpans.text('.\n\nDifferent font sizes: '),
        TextSpans.sized('small', 8),
        TextSpans.text(', '),
        TextSpans.sized('medium', 12),
        TextSpans.text(', '),
        TextSpans.sized('large', 16),
        TextSpans.text(', and '),
        TextSpans.sized('extra large', 20),
        TextSpans.text('.\n\nColor variations: '),
        TextSpans.colored('red', PdfColor.fromHex('#ff0000')),
        TextSpans.text(', '),
        TextSpans.colored('green', PdfColor.fromHex('#00aa00')),
        TextSpans.text(', '),
        TextSpans.colored('blue', PdfColor.fromHex('#0066cc')),
        TextSpans.text(', and '),
        TextSpans.colored('purple', PdfColor.fromHex('#8800cc')),
        TextSpans.text('.')
    );

    return new Container({
        padding: EdgeInsets.all(20),
        child: new Column({
            children: [
                createRichText(headingSpan, {
                    textAlign: TextAlign.Center,
                    style: { lineSpacing: 1.2 },
                }),
                new Container({ height: 20 }), // Spacer
                createRichText(bodySpan, {
                    style: { fontSize: 12, lineSpacing: 1.5 },
                    softWrap: true,
                }),
            ],
        }),
    });
}

/**
 * Main function to create the advanced text example document
 */
export async function createAdvancedTextDocument(): Promise<Uint8Array> {
    const doc = new Document();

    // Page 1: Basic examples
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(40),
            child: new Column({
                children: [
                    new Text('Advanced Text Rendering Examples', {
                        style: { fontSize: 24, fontWeight: FontWeight.Bold },
                        textAlign: TextAlign.Center,
                    }),
                    new Container({ height: 30 }), // Spacer
                    createBasicRichTextExample(),
                    new Container({ height: 20 }), // Spacer
                    createComplexRichTextExample(),
                ],
            }),
        }),
    });

    // Page 2: Font fallback and metrics
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(40),
            child: new Column({
                children: [
                    demonstrateFontFallback(),
                    new Container({ height: 20 }), // Spacer
                    demonstrateTextMetrics(),
                ],
            }),
        }),
    });

    // Page 3: Line breaking and typography
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(40),
            child: new Column({
                children: [
                    demonstrateLineBreaking(),
                    new Container({ height: 20 }), // Spacer
                    createTypographyShowcase(),
                ],
            }),
        }),
    });

    return doc.save();
}

/**
 * Standalone examples for testing individual features
 */
export const examples = {
    basicRichText: createBasicRichTextExample,
    complexRichText: createComplexRichTextExample,
    fontFallback: demonstrateFontFallback,
    textMetrics: demonstrateTextMetrics,
    lineBreaking: demonstrateLineBreaking,
    typography: createTypographyShowcase,
};

// Export for use in other examples or tests
export {
    createBasicRichTextExample,
    createComplexRichTextExample,
    demonstrateFontFallback,
    demonstrateTextMetrics,
    demonstrateLineBreaking,
    createTypographyShowcase,
};

/**
 * Console demo function for testing features
 */
export function runConsoleDemo(): void {
    console.log('=== Advanced Text Rendering Demo ===\n');

    // Demo font fallback
    console.log('Font Fallback Examples:');
    const fontTests = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Monaco'];
    fontTests.forEach(font => {
        const resolved = FontUtils.resolveFont(font);
        console.log(`  ${font} → ${resolved}`);
    });

    console.log('\nText Measurement Examples:');
    const testText = 'The quick brown fox jumps over the lazy dog.';
    [100, 200, 300].forEach(width => {
        const bounds = TextMeasurementUtils.getTextBounds(testText, 12, width);
        console.log(`  Width ${width}pt: ${bounds.lineCount} lines, ${bounds.height.toFixed(1)}pt height`);
    });

    console.log('\nRun this example in a PDF context to see the full visual output.');
}