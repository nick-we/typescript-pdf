# Type Safety Implementation Guide

## Quick Reference for Code Mode

This guide provides specific, actionable steps to eliminate `unknown` and `any` types from the typescript-pdf codebase.

## File-by-File Changes

### 1. Create New Type Definitions File

**File**: `src/types/pdf-types.ts` (NEW FILE)

```typescript
/**
 * PDF-specific type definitions
 * Replaces all unknown types with proper interfaces
 */

import type { Geometry, Layout } from '../types.js';
import type { Widget } from '../widgets/base.js';

/**
 * PDF Font interface for type-safe font operations
 */
export interface IPdfFont {
    readonly name: string;
    readonly fontName: string;
    readonly type: 'standard' | 'ttf';
    measureTextWidth(text: string, fontSize: number): number;
    getFontHeight(fontSize: number): number;
    getAscender(fontSize: number): number;
    getDescender(fontSize: number): number;
    getPdfFontName(): string;
    ref(): string;
    getId(): number;
}

/**
 * Page interface for document pages
 */
export interface IPage {
    readonly size: Geometry.Size;
    readonly margins: Layout.EdgeInsets;
    readonly format?: string;
    readonly orientation?: 'portrait' | 'landscape';
    renderWidget(widget: Widget): void;
    getGraphicsContext(): IGraphicsContext;
}

/**
 * Metadata type definitions
 */
export type ChartMetadata = {
    label?: string;
    value?: number;
    color?: string;
    category?: string;
};

export type TableCellMetadata = {
    rowSpan?: number;
    colSpan?: number;
    alignment?: 'left' | 'center' | 'right';
    verticalAlignment?: 'top' | 'middle' | 'bottom';
};

export type DocumentMetadata = {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
};

export type StyleMetadata = {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
};

/**
 * Type guards
 */
export function isPdfFont(obj: unknown): obj is IPdfFont {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'name' in obj &&
        'measureTextWidth' in obj &&
        typeof (obj as any).measureTextWidth === 'function'
    );
}

export function isPage(obj: unknown): obj is IPage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'size' in obj &&
        'margins' in obj &&
        'renderWidget' in obj
    );
}

export function isWidget(obj: unknown): obj is Widget {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'layout' in obj &&
        'paint' in obj &&
        typeof (obj as any).layout === 'function' &&
        typeof (obj as any).paint === 'function'
    );
}
```

### 2. Update Core Interfaces

**File**: `src/types/core-interfaces.ts`

Changes needed:
```typescript
// Line 137: Replace unknown with IPdfFont
import type { IPdfFont } from './pdf-types.js';

export interface IUniversalFont {
    // ... existing properties
    getUnderlyingFont(): IPdfFont; // was: unknown
}

// Line 157: Replace unknown with proper type
export interface IFontSystem {
    // ... existing properties
    getStats(): {
        standardFonts: number;
        customFonts: number;
        totalFonts: number;
        fontLoader: { loadCount: number }; // was: unknown
    };
}

// Lines 227-233: Replace unknown with IPdfFont
export interface IGraphicsContext {
    // ... existing properties
    drawString(
        font: IPdfFont, // was: unknown
        fontSize: number,
        text: string,
        x: number,
        y: number
    ): void;
    setFont(font: IPdfFont, fontSize: number): void; // was: unknown
}

// Line 271: Replace unknown with Widget
import type { Widget } from '../widgets/base.js';

export interface IPageOptions {
    // ... existing properties
    build?: () => Widget; // was: unknown
}

// Lines 280-286: Replace unknown with IPage
import type { IPage } from './pdf-types.js';

export interface IDocument {
    // ... existing properties
    addPage(options?: IPageOptions): IPage; // was: unknown
    getPages(): readonly IPage[]; // was: unknown[]
    getStats(): {
        pageCount: number;
        fontStats: { standardFonts: number; customFonts: number }; // was: unknown
    };
}

// Lines 294-299: Update IWidget to use proper context types
export interface IWidget {
    layout?(context: Layout.LayoutContext): { // was: unknown
        size: Geometry.Size;
        needsRepaint?: boolean;
        baseline?: number;
    };
    paint?(context: Layout.PaintContext): void; // was: unknown
}
```

### 3. Update Font Files

**File**: `src/core/fonts.ts`

Changes needed:
```typescript
// Line 442: Replace unknown return type
import type { IPdfFont } from '../types/pdf-types.js';

async loadFont(
    fontData: Uint8Array,
    options: FontLoadOptions = {}
): Promise<IPdfFont> { // was: Promise<unknown>
    // ... implementation
}

// Line 583: Replace unknown in Map
private readonly customFonts = new Map<string, IPdfFont>(); // was: Map<string, unknown>
```

**File**: `src/core/pdf/font-engine.ts`

Changes needed:
```typescript
// Line 20: Replace unknown in PdfDocument interface
export interface PdfDocument {
    genSerial(): number;
    objects: {
        add(obj: IPdfFont | object): void; // was: unknown
    };
}
```

### 4. Update Graphics Context

**File**: `src/core/pdf/graphics.ts`

Changes needed:
```typescript
// Line 111: Replace unknown with proper type
import type { IPdfFont } from '../types/pdf-types.js';

public clipPath: Path2D | null = null; // was: unknown

// Line 128: Replace unknown
public softMask?: SoftMask | undefined; // was: unknown

// Line 218: Update return type
get fontRegistry(): IFontSystem | undefined { // was: unknown
    return this.document?.fontSystem;
}
```

### 5. Update Types.ts

**File**: `src/types.ts`

Changes needed:
```typescript
// Line 759: Replace metadata unknown types
import type { ChartMetadata, TableCellMetadata, StyleMetadata } from './types/pdf-types.js';

export type DataPoint = {
    // ... existing properties
    metadata?: ChartMetadata; // was: Record<string, unknown>
};

// Line 780: Update Series metadata
export interface Series {
    // ... existing properties
    metadata?: ChartMetadata; // was: Record<string, unknown>
}

// Line 790: Update ChartOptions style
export interface ChartOptions {
    // ... existing properties
    style?: StyleMetadata; // was: Record<string, unknown>
}

// Line 808: Update LayoutCacheEntry to be more specific
export interface LayoutCacheEntry<T = Layout.LayoutResult> { // was: T = unknown
    value: T;
    // ... rest
}

// Line 832: Update hashObject parameter
hashObject: (obj: object): string => { // was: unknown
    // ... implementation
}
```

### 6. Update Mock Interfaces

**File**: `src/test/mock-interfaces.ts`

Changes needed:
```typescript
// Import proper types
import type { IPdfFont, IPage } from '../types/pdf-types.js';

// Lines 145-151: Update drawString and setFont
drawString: (
    font: IPdfFont, // was: unknown
    fontSize: number,
    text: string,
    x: number,
    y: number
) => void;
setFont: (font: IPdfFont, fontSize: number) => void; // was: unknown

// Line 173: Update fontRegistry type
readonly fontRegistry?: IFontSystem; // was: unknown

// Line 190: Update getStats return type
getStats: () => { 
    pageCount: number; 
    fontStats: { standardFonts: number; customFonts: number } // was: unknown
};

// Line 230: Update fontLoader type
fontLoader: { loadCount: number }; // was: unknown

// Line 251: Update getUnderlyingFont return type
getUnderlyingFont: () => IPdfFont; // was: unknown

// Lines 279, 305: Fix type casting
textMeasurement: createMockTextMeasurementService() as ITextMeasurementService, // was: as unknown as

// Lines 519, 527: Update mock implementation parameters
drawString: (
    _font: IPdfFont, // was: unknown
    _fontSize: number,
    // ...
) => { /* Mock implementation */ },
setFont: (_font: IPdfFont, _fontSize: number) => { // was: unknown
    /* Mock implementation */
},

// Lines 750-751: Update global type casting
(global as Record<string, any>)['window'] = mockWindow; // More specific than unknown
(global as Record<string, any>)['document'] = mockDocument;
```

### 7. Update Widget Files

**File**: `src/widgets/multipage.ts`

Changes needed:
```typescript
// Line 844: Remove type casting
import type { ITextMeasurementService } from '../types/core-interfaces.js';

// Properly type the textMeasurement service
const textMeasurement: ITextMeasurementService = {
    // ... proper implementation
}; // Remove: as unknown as
```

**File**: `src/widgets/data.ts`

Changes needed:
```typescript
// Lines 295, 297: Replace unknown with specific types
import type { TableCellMetadata } from '../types/pdf-types.js';

type CellData = {
    content?: string;
    data?: string | number | boolean; // was: unknown
    text?: string;
    value?: string | number | boolean; // was: unknown
};
```

### 8. Fix Test Files (Remove `any` casts)

**File**: `src/test/multipage.test.ts`

Changes needed:
```typescript
// Lines 57, 60: Replace any casts
import { createMockPaintContext } from './mock-interfaces.js';

const mockPaintContext = createMockPaintContext({
    graphics: undefined, // Will be mocked when needed
});

// Add document for integration testing
Object.assign(mockPaintContext, { document });

// Lines 208, 247, 284, 458: Replace any casts for page returns
return {
    renderWidget: () => {},
    size: { width: 595, height: 842 },
    margins: Layout.EdgeInsets.all(20),
} satisfies IPage;

// Line 352: Fix header cast
header: problematicHeader as (context: HeaderContext) => Widget,

// Line 451: Fix addPage parameter type
addPage: (options?: IPageOptions) => {
    // ... implementation
}

// Line 548: Fix widget cast
children: [
    problematicWidget as Widget,
    new TextWidget('Good widget'),
]
```

**File**: `src/test/widgets.test.ts`

Changes needed:
```typescript
// Line 474: Fix orientation type
orientation: 'vertical' as const, // was: as any

// Line 491: Fix marker type
marker: 'circle' as const, // was: as any
```

**File**: `src/test/pdf-visual.test.ts`

Replace all `as any` casts with proper types:
```typescript
// Line 50: Fix format type
format: 'A4' as const, // was: as any

// Lines 64, 130-131, etc.: Fix alignment types
mainAxisAlignment: 'spaceEvenly' as const, // was: as any
crossAxisAlignment: 'center' as const, // was: as any

// Line 108, 215, etc.: Fix textAlign type
textAlign: 'center' as const, // was: as any
```

## Testing Strategy

After implementing each file's changes:

1. **Run type checking**:
   ```bash
   npx tsc --noEmit
   ```

2. **Run specific test file**:
   ```bash
   npm test -- <test-file-name>
   ```

3. **Run full test suite**:
   ```bash
   npm test
   ```

## Validation Checklist

- [ ] All `unknown` types replaced with specific interfaces
- [ ] All `any` types in production code eliminated
- [ ] Test files use proper mock types instead of `any`
- [ ] Type guards implemented for runtime safety
- [ ] All tests passing (267/267)
- [ ] TypeScript compilation has zero errors
- [ ] Documentation updated

## Priority Order

1. **High Priority** (Core functionality):
   - Create `src/types/pdf-types.ts`
   - Update `src/types/core-interfaces.ts`
   - Fix font system files

2. **Medium Priority** (Implementation):
   - Update graphics context
   - Fix widget files
   - Update mock interfaces

3. **Low Priority** (Tests):
   - Fix test file `any` casts
   - Add type guards
   - Update documentation

## Notes for Implementation

- Make changes incrementally, testing after each file
- Use `satisfies` operator for type checking without changing runtime behavior
- Prefer `as const` over `as any` for literal types
- When in doubt, create a more specific type rather than using `any` or `unknown`
- Keep backward compatibility - don't change public API signatures