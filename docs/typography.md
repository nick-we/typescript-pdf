# Typography & Fonts

The typescript-pdf library provides a comprehensive typography system with advanced font handling capabilities, including TTF font parsing, text layout, font subsetting, and PDF embedding.

## Overview

The typography system consists of several integrated components:

- **TTF Parser**: Reads TrueType font files and extracts metadata
- **Font Loader**: Manages font loading with caching support
- **Text Layout Engine**: Advanced text layout with alignment and justification
- **Font Subsetting**: Optimizes PDFs by including only used glyphs
- **Font Manager**: High-level API for font integration

## Quick Start

```typescript
import { PdfDocument } from 'typescript-pdf';
import { FontManager, FontWeight, FontStyle } from 'typescript-pdf/fonts';

// Create document and font manager
const doc = new PdfDocument();
const fontManager = new FontManager(doc);

// Register a custom font
await fontManager.registerFont({
    family: 'MyFont',
    weight: FontWeight.Normal,
    style: FontStyle.Normal,
    source: fontData, // ArrayBuffer or file path
});

// Use the font for text layout
const layout = fontManager.layoutText('Hello World!', {
    fontFamily: 'MyFont',
    fontSize: 16,
    lineHeight: 1.4,
}, 300);
```

## Core Components

### TTF Parser

The [`TtfParser`](../src/core/pdf/ttf-parser.ts) class provides low-level TTF font parsing capabilities:

```typescript
import { TtfParser } from 'typescript-pdf/ttf-parser';

const parser = new TtfParser(fontData);

// Get font metadata
console.log(parser.fontName);      // Font name
console.log(parser.unitsPerEm);    // Units per em
console.log(parser.ascent);        // Ascender height
console.log(parser.descent);       // Descender depth

// Character and glyph operations
const supported = parser.isCharSupported(65); // Check if 'A' is supported
const glyphIndex = parser.getGlyphIndex(65);  // Get glyph index for 'A'
const width = parser.measureText('Hello');    // Measure text width
```

**Key Features:**
- Parses TTF font tables (head, hhea, maxp, cmap, etc.)
- Character-to-glyph mapping via cmap table
- Font metrics extraction
- Text measurement in font units
- Support for multiple cmap formats (0, 4, 6, 12)

### Font Loader & Registry

The [`FontLoader`](../src/core/pdf/font-loader.ts) provides font loading with caching:

```typescript
import { FontLoader, FontRegistry } from 'typescript-pdf/font-loader';

// Load font with caching
const parser = await FontLoader.loadFont(fontSource, { cache: true });

// Document-scoped font registry
const registry = new FontRegistry(document);
await registry.registerFont('FontName', fontSource);
const font = registry.getFont('FontName');
```

**Features:**
- Cross-platform font loading (Node.js fs, browser fetch)
- LRU cache with configurable size limits
- Loading statistics and performance monitoring
- Document-scoped font management

### Text Layout Engine

The [`TextLayoutEngine`](../src/core/text-layout.ts) handles advanced text layout:

```typescript
import { TextLayoutEngine, TextAlign, createFontAdapter } from 'typescript-pdf/text-layout';

const fontAdapter = createFontAdapter(ttfParser);
const engine = new TextLayoutEngine(fontAdapter, {
    align: TextAlign.Justify,
    fontSize: 12,
    lineHeight: 1.4,
    letterSpacing: 0.1,
    wordSpacing: 0.2,
});

const result = engine.layoutText(text, maxWidth);
```

**Layout Features:**
- **Alignment**: Left, center, right, justify
- **Line breaking**: Intelligent word wrapping
- **Hyphenation**: Automatic hyphenation support
- **Justification**: Space distribution algorithms
- **Bidirectional text**: LTR and RTL support
- **Overflow handling**: Ellipsis, clipping, scaling
- **Break opportunities**: Script-aware breaking (Latin, CJK, etc.)

### Font Subsetting

The [`TtfSubsetter`](../src/core/pdf/ttf-subsetter.ts) creates optimized font subsets:

```typescript
import { TtfSubsetter, createFontSubset } from 'typescript-pdf/ttf-subsetter';

// Create subsetter
const subsetter = new TtfSubsetter(fontData);

// Add used text
subsetter.addString('Hello World');
subsetter.addChar(65); // Add 'A'

// Generate subset
const subset = subsetter.generateSubset();
const stats = subsetter.getStats();

console.log(`Compression: ${stats.compressionRatio * 100}%`);
```

**Subsetting Features:**
- Glyph dependency tracking
- TTF table reconstruction
- Character set optimization
- Compression statistics
- Utility functions for common use cases

### Font Manager (High-Level API)

The [`FontManager`](../src/core/fonts.ts) provides the primary font integration API:

```typescript
import { FontManager, FontWeight, FontStyle } from 'typescript-pdf/fonts';

const fontManager = new FontManager(document);

// Register font families
await fontManager.registerFontFamily('Roboto', [
    { weight: FontWeight.Light, source: lightFont },
    { weight: FontWeight.Normal, source: regularFont },
    { weight: FontWeight.Bold, source: boldFont },
    { style: FontStyle.Italic, source: italicFont },
]);

// Set up fallbacks
fontManager.setFontFallback('Roboto', {
    families: ['Arial', 'Helvetica', 'sans-serif'],
    characterSets: [
        {
            start: 0x4E00, end: 0x9FFF, // CJK range
            families: ['NotoSansCJK', 'SimSun']
        }
    ]
});

// Layout text with styling
const layout = fontManager.layoutText('Styled Text', {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: FontWeight.Bold,
    lineHeight: 1.5,
    letterSpacing: 0.5,
}, 400);
```

## Font Formats

### Supported Formats

- **TrueType (.ttf)**: Full support with advanced parsing
- **OpenType (.otf)**: Basic support via TTF-compatible tables
- **Web fonts**: Can be loaded from URLs in browser environments

### Font Sources

Fonts can be loaded from multiple sources:

```typescript
// ArrayBuffer (pre-loaded font data)
await fontManager.registerFont({
    family: 'MyFont',
    source: fontArrayBuffer
});

// File path (Node.js)
await fontManager.registerFont({
    family: 'MyFont',
    source: './fonts/MyFont.ttf'
});

// URL (Browser)
await fontManager.registerFont({
    family: 'MyFont',
    source: 'https://example.com/fonts/MyFont.ttf'
});
```

## Text Styling

### CSS-Style Properties

The system supports CSS-like text styling:

```typescript
import { FontStyleUtils } from 'typescript-pdf/fonts';

// Create style from CSS properties
const textStyle = FontStyleUtils.createTextStyle({
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'bold',  // or 700
    fontStyle: 'italic',
    lineHeight: 1.5,
    letterSpacing: 0.5,
    color: '#333333'
});

// Use with font manager
const layout = fontManager.layoutText('Styled text', textStyle, 300);
```

### Font Properties

- **Family**: Font family name or stack
- **Weight**: 100-900 or named weights (light, normal, bold, etc.)
- **Style**: normal, italic, oblique
- **Size**: Font size in points
- **Line Height**: Line spacing multiplier
- **Letter Spacing**: Character spacing in points
- **Word Spacing**: Word spacing in points

## Performance Optimization

### Font Caching

The font loader includes automatic caching:

```typescript
// Configure cache settings
FontLoader.setCacheOptions({
    maxSize: 50 * 1024 * 1024, // 50MB
    maxEntries: 100,
    enableStats: true
});

// Get cache statistics
const stats = FontLoader.getStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

### Font Subsetting

Reduce PDF file sizes by subsetting fonts:

```typescript
// Create subset from document text
const usedTexts = ['Chapter 1', 'Introduction', 'Conclusion'];
const subset = fontManager.createFontSubset('MyFont', usedTexts);

// Use subset for PDF generation
const subsetFont = new TtfFont(document, subset, 'MyFont-Subset');
```

### Layout Engine Optimization

- Constraint-based layout with efficient algorithms
- Break opportunity caching
- Font metric caching
- Incremental layout for large documents

## Advanced Features

### Bidirectional Text Support

```typescript
const engine = new TextLayoutEngine(fontAdapter, {
    direction: TextDirection.RightToLeft,
    align: TextAlign.Right
});
```

### Font Fallback System

```typescript
fontManager.setFontFallback('PrimaryFont', {
    families: ['FallbackFont1', 'FallbackFont2'],
    generic: 'sans-serif',
    characterSets: [
        {
            start: 0x0590, end: 0x05FF, // Hebrew
            families: ['HebrewFont']
        }
    ]
});
```

### Custom Font Adapters

```typescript
// Create custom font adapter
const customAdapter = {
    measureText: (text) => /* custom measurement */,
    getCharWidth: (char) => /* custom width */,
    getLineHeight: () => /* custom line height */,
    // ... other methods
};

const engine = new TextLayoutEngine(customAdapter, options);
```

## Integration with PDF Generation

### Font Embedding

Fonts are automatically embedded in PDFs when using the FontManager:

```typescript
// Font is embedded during PDF generation
const page = document.addPage();
page.drawText('Custom font text', {
    font: fontManager.getFont('MyFont'),
    size: 12,
    x: 50,
    y: 500
});
```

### Type0 vs TrueType Embedding

The system automatically chooses the optimal embedding format:

- **Type0**: For Unicode fonts and complex scripts
- **TrueType**: For basic Latin fonts and compatibility

## Error Handling

```typescript
try {
    await fontManager.registerFont({
        family: 'MyFont',
        source: fontData
    });
} catch (error) {
    if (error.name === 'FontLoadError') {
        console.error('Failed to load font:', error.message);
    } else if (error.name === 'FontParseError') {
        console.error('Failed to parse font:', error.message);
    }
}
```

## Examples

See the [examples directory](../examples/) for complete demonstrations:

- [`typography-showcase.ts`](../examples/typography-showcase.ts): Comprehensive feature showcase
- [`font-features-demo.ts`](../examples/font-features-demo.ts): Simple feature demonstrations