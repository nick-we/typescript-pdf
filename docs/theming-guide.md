# TypeScript PDF Theming System Guide

A comprehensive guide to the theming system in typescript-pdf, providing Flutter-like theming capabilities with TypeScript type safety and composition-based architecture.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Text Styling](#text-styling)
4. [Theme Data](#theme-data)
5. [Theme Widgets](#theme-widgets)
6. [Style Inheritance](#style-inheritance)
7. [Predefined Themes](#predefined-themes)
8. [Custom Themes](#custom-themes)
9. [Best Practices](#best-practices)
10. [Examples](#examples)
11. [API Reference](#api-reference)

## Overview

The typescript-pdf theming system provides a comprehensive solution for consistent styling across PDF documents. It follows the composition-over-inheritance principle and offers:

- **Cascading styles** with inheritance support
- **Typography scales** for consistent text hierarchy
- **Color schemes** with semantic color names
- **Theme-aware widgets** that automatically adapt
- **Type-safe** theme definitions
- **Performance optimized** rendering with caching

## Core Concepts

### Theme Data

The [`ThemeData`](../src/types/theming.ts:464) interface is the foundation of the theming system:

```typescript
interface ThemeData {
  colorScheme: ColorScheme;
  spacing: SpacingSystem;
  typography: TypographyScale;
  defaultTextStyle: TextStyle;
  shape: ShapeTheme;
}
```

### Text Styles

Text styles support inheritance through the [`inherit`](../src/types/theming.ts:125) property:

```typescript
interface TextStyle {
  inherit: boolean;
  color?: string;
  fontFamily?: PdfStandardFont;
  fontSize?: number;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  decoration?: TextDecoration;
  // ... more properties
}
```

### Style Inheritance

- **Inheriting styles** (`inherit: true`) merge with parent styles
- **Non-inheriting styles** (`inherit: false`) completely replace parent styles

## Text Styling

### Creating Text Styles

#### Default Style (Non-inheriting)
```typescript
import { TextStyleUtils, FontWeight, PdfStandardFont } from 'typescript-pdf';

const headingStyle = TextStyleUtils.createDefault({
  fontSize: 24,
  fontWeight: FontWeight.Bold,
  fontFamily: PdfStandardFont.Helvetica,
  color: '#2c3e50'
});
```

#### Inheriting Style
```typescript
const emphasizedStyle = TextStyleUtils.createInheriting({
  fontWeight: FontWeight.Bold,
  color: '#e74c3c'
});
```

### Text Decorations

The [`TextDecoration`](../src/types/theming.ts:52) class supports multiple decoration types:

```typescript
import { TextDecoration } from 'typescript-pdf';

// Single decorations
const underlined = TextDecoration.underline;
const strikethrough = TextDecoration.lineThrough;

// Combined decorations
const combined = TextDecoration.combine([
  TextDecoration.underline,
  TextDecoration.overline
]);
```

### Font Resolution

The system automatically resolves font families based on weight and style:

```typescript
const resolvedFont = TextStyleUtils.resolveFontFamily({
  inherit: false,
  fontFamily: PdfStandardFont.Helvetica,
  fontWeight: FontWeight.Bold,
  fontStyle: FontStyle.Italic
});
// Returns: PdfStandardFont.HelveticaBoldOblique
```

## Theme Data

### Color Schemes

Color schemes provide semantic color names for consistent theming:

```typescript
interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  onBackground: string;
  onSurface: string;
  onPrimary: string;
  onSecondary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}
```

### Typography Scales

Typography scales ensure consistent text hierarchy:

```typescript
interface TypographyScale {
  display: TextStyle;        // 36pt - Large display text
  headingLarge: TextStyle;   // 24pt - Main headings
  headingMedium: TextStyle;  // 18pt - Section headings
  headingSmall: TextStyle;   // 15pt - Subsection headings
  title: TextStyle;          // 13pt - Titles
  bodyLarge: TextStyle;      // 13pt - Large body text
  bodyMedium: TextStyle;     // 12pt - Standard body text
  bodySmall: TextStyle;      // 11pt - Small body text
  label: TextStyle;          // 10pt - Labels
  caption: TextStyle;        // 9pt - Captions
}
```

### Spacing System

Consistent spacing values for layouts:

```typescript
interface SpacingSystem {
  xs: number;   // 2pt
  sm: number;   // 4pt
  md: number;   // 8pt
  lg: number;   // 16pt
  xl: number;   // 24pt
  xxl: number;  // 32pt
}
```

## Theme Widgets

### Theme Widget

The [`Theme`](../src/widgets/theme.ts:54) widget provides theme data to its descendants:

```typescript
import { Theme, ThemeUtils } from 'typescript-pdf';

const themedDocument = new Theme({
  data: ThemeUtils.dark(),
  child: new Column({
    children: [
      new Text('This text uses the dark theme'),
      // ... more widgets
    ]
  })
});
```

### DefaultTextStyle Widget

The [`DefaultTextStyle`](../src/widgets/theme.ts:112) widget sets the default text style for descendants:

```typescript
import { DefaultTextStyle, TextStyleUtils, FontWeight } from 'typescript-pdf';

const styledSection = new DefaultTextStyle({
  style: TextStyleUtils.createInheriting({
    fontSize: 14,
    fontWeight: FontWeight.Bold
  }),
  child: new Column({
    children: [
      new Text('This text inherits the bold weight'),
      new Text('This too', {
        style: TextStyleUtils.createInheriting({
          color: '#e74c3c' // Adds color while keeping bold weight
        })
      })
    ]
  })
});
```

### ThemedWidget

The [`ThemedWidget`](../src/widgets/theme.ts:188) rebuilds when the theme changes:

```typescript
import { ThemedWidget } from 'typescript-pdf';

const adaptiveWidget = new ThemedWidget({
  builder: (theme) => new Container({
    decoration: {
      color: theme.colorScheme.surface,
      border: {
        width: 1,
        color: theme.colorScheme.primary
      }
    },
    child: new Text('Themed container', {
      style: theme.typography.bodyMedium
    })
  })
});
```

### ThemeConsumer

The [`ThemeConsumer`](../src/widgets/theme.ts:232) provides efficient selective theme updates:

```typescript
import { ThemeConsumer } from 'typescript-pdf';

const colorAwareWidget = new ThemeConsumer({
  selector: (theme) => theme.colorScheme,
  builder: (colors) => new Container({
    decoration: { color: colors.primary },
    child: new Text('Primary colored container', {
      style: TextStyleUtils.createInheriting({
        color: colors.onPrimary
      })
    })
  })
});
```

## Style Inheritance

### Inheritance Rules

1. **Non-inheriting styles** (`inherit: false`) replace all parent styling
2. **Inheriting styles** (`inherit: true`) merge with parent styles
3. **Property precedence**: Child properties override parent properties
4. **Decoration merging**: Text decorations are combined (e.g., underline + strikethrough)

### Merging Example

```typescript
// Parent style
const parentStyle = TextStyleUtils.createDefault({
  fontSize: 12,
  color: '#000000',
  fontWeight: FontWeight.Normal
});

// Child inheriting style
const childStyle = TextStyleUtils.createInheriting({
  fontSize: 16,
  fontStyle: FontStyle.Italic
});

// Merged result
const merged = TextStyleUtils.merge(parentStyle, childStyle);
// Result: {
//   inherit: false,
//   fontSize: 16,        // Child overrides
//   color: '#000000',    // From parent
//   fontWeight: FontWeight.Normal, // From parent
//   fontStyle: FontStyle.Italic    // From child
// }
```

## Predefined Themes

### Light Theme

```typescript
import { ThemeUtils } from 'typescript-pdf';

const lightTheme = ThemeUtils.light();
// Creates a light theme with:
// - White background (#ffffff)
// - Blue primary color (#1976d2)
// - Black text on white background
// - Helvetica font family
```

### Dark Theme

```typescript
const darkTheme = ThemeUtils.dark();
// Creates a dark theme with:
// - Dark background (#121212)
// - Light blue primary color (#90caf9)
// - White text on dark background
// - Helvetica font family
```

### Professional Theme

```typescript
const professionalTheme = ThemeUtils.professional();
// Creates a professional theme with:
// - Clean white background
// - Professional blue-gray colors
// - Times Roman font family
// - Conservative styling
```

## Custom Themes

### Creating Custom Themes

```typescript
import { ThemeUtils, PdfStandardFont } from 'typescript-pdf';

// Custom color scheme
const brandColors = {
  primary: '#6c5ce7',
  secondary: '#fd79a8',
  background: '#ffffff',
  surface: '#f8f9fa',
  onBackground: '#2d3436',
  onSurface: '#2d3436',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  error: '#e17055',
  onError: '#ffffff',
  success: '#00b894',
  warning: '#fdcb6e',
  info: '#74b9ff'
};

// Custom spacing
const brandSpacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32
};

const brandTheme = ThemeUtils.createTheme(
  brandColors,
  brandSpacing,
  PdfStandardFont.Helvetica,
  11 // Base font size
);
```

### Copying and Modifying Themes

```typescript
const customizedTheme = ThemeUtils.copyWith(ThemeUtils.light(), {
  colorScheme: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4'
  },
  spacing: {
    lg: 20,
    xl: 30
  }
});
```

## Best Practices

### 1. Use Semantic Colors
```typescript
// Good: Use semantic color names
new Container({
  decoration: { color: theme.colorScheme.surface }
});

// Avoid: Hard-coded colors
new Container({
  decoration: { color: '#f5f5f5' }
});
```

### 2. Leverage Typography Scales
```typescript
// Good: Use typography scale
new Text('Heading', {
  style: theme.typography.headingLarge
});

// Avoid: Custom font sizes
new Text('Heading', {
  style: TextStyleUtils.createDefault({
    fontSize: 24,
    fontWeight: FontWeight.Bold
  })
});
```

### 3. Prefer Inheriting Styles
```typescript
// Good: Use inheriting styles for modifications
new Text('Emphasized text', {
  style: TextStyleUtils.createInheriting({
    fontWeight: FontWeight.Bold
  })
});

// Avoid: Complete style redefinition
new Text('Emphasized text', {
  style: TextStyleUtils.createDefault({
    fontSize: 12,
    fontFamily: PdfStandardFont.Helvetica,
    color: '#000000',
    fontWeight: FontWeight.Bold
  })
});
```

### 4. Use Theme Helpers
```typescript
// Good: Use theme helpers
const section = ThemeHelpers.withColorScheme((colors) =>
  new Container({
    decoration: { color: colors.surface },
    child: content
  })
);

// Alternative: Direct theme consumer
const section = new ThemeConsumer({
  selector: (theme) => theme.colorScheme,
  builder: (colors) => new Container({
    decoration: { color: colors.surface },
    child: content
  })
});
```

### 5. Organize Theme Structure
```typescript
// Good: Organized theme hierarchy
new Theme({
  data: brandTheme,
  child: new Column({
    children: [
      // Header with different styling
      new DefaultTextStyle({
        style: TextStyleUtils.createInheriting({
          fontSize: 16,
          fontWeight: FontWeight.Bold
        }),
        child: headerContent
      }),
      
      // Body content with default styling
      bodyContent
    ]
  })
});
```

## Examples

### Basic Document with Theme

```typescript
import {
  Document,
  Theme,
  ThemeUtils,
  Text,
  Column,
  Container,
  EdgeInsets
} from 'typescript-pdf';

const doc = new Document();

doc.addPage({
  build: () => new Theme({
    data: ThemeUtils.professional(),
    child: new Container({
      padding: EdgeInsets.all(20),
      child: new Column({
        children: [
          new Text('Professional Document', {
            style: theme => theme.typography.display
          }),
          new Container({ height: 16 }),
          new Text('This document uses the professional theme with consistent styling throughout.', {
            style: theme => theme.typography.bodyMedium
          })
        ]
      })
    })
  })
});
```

### Multi-Theme Document

```typescript
const doc = new Document();

// Light theme page
doc.addPage({
  build: () => ThemeHelpers.light(
    new Container({
      decoration: { color: '#ffffff' },
      child: pageContent
    })
  )
});

// Dark theme page
doc.addPage({
  build: () => ThemeHelpers.dark(
    new Container({
      decoration: { color: '#121212' },
      child: pageContent
    })
  )
});
```

### Complex Style Inheritance

```typescript
new Theme({
  data: ThemeUtils.createTheme(),
  child: new DefaultTextStyle({
    style: TextStyleUtils.createInheriting({
      fontSize: 14,
      lineSpacing: 1.4
    }),
    child: new Column({
      children: [
        // This text inherits fontSize: 14, lineSpacing: 1.4
        new Text('Base text style'),
        
        // This text adds bold while keeping inheritance
        new Text('Bold text', {
          style: TextStyleUtils.createInheriting({
            fontWeight: FontWeight.Bold
          })
        }),
        
        // This text completely replaces the style
        new Text('Custom text', {
          style: TextStyleUtils.createDefault({
            fontSize: 10,
            fontFamily: PdfStandardFont.Courier,
            color: '#666666'
          })
        })
      ]
    })
  })
});
```

## API Reference

### Core Classes and Interfaces

- [`ThemeData`](../src/types/theming.ts:464) - Main theme configuration
- [`TextStyle`](../src/types/theming.ts:123) - Text styling with inheritance
- [`ColorScheme`](../src/types/theming.ts:388) - Color palette definition
- [`TypographyScale`](../src/types/theming.ts:438) - Text hierarchy scale
- [`SpacingSystem`](../src/types/theming.ts:420) - Consistent spacing values

### Utility Classes

- [`TextStyleUtils`](../src/types/theming.ts:170) - Text style creation and manipulation
- [`ThemeUtils`](../src/types/theming.ts:566) - Theme creation and modification
- [`ColorSchemes`](../src/types/theming.ts:492) - Predefined color schemes

### Widgets

- [`Theme`](../src/widgets/theme.ts:54) - Theme provider widget
- [`DefaultTextStyle`](../src/widgets/theme.ts:112) - Default text style provider
- [`ThemedWidget`](../src/widgets/theme.ts:188) - Theme-aware widget builder
- [`ThemeConsumer`](../src/widgets/theme.ts:232) - Selective theme consumer

### Helper Functions

- [`ThemeHelpers`](../src/widgets/theme.ts:271) - Convenience functions for theming
- [`createTheme`](../src/widgets/theme.ts:371) - Theme creation helper
- [`createThemedWidget`](../src/widgets/theme.ts:374) - Themed widget creation helper

### Enums

- [`FontWeight`](../src/types/theming.ts:16) - Font weight options
- [`FontStyle`](../src/types/theming.ts:24) - Font style options
- [`TextDecorationStyle`](../src/types/theming.ts:32) - Text decoration styles

For complete API documentation, see the individual source files and their TypeScript definitions.