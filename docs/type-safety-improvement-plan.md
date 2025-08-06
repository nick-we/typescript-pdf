# Type Safety Improvement Plan for typescript-pdf

## Executive Summary

This document outlines a comprehensive plan to eliminate all `unknown` and `any` type usages in the typescript-pdf codebase, improving type safety, developer experience, and code maintainability.

## Current State Analysis

### Type Safety Issues Found

1. **`unknown` Types**: 49 instances across the codebase
   - Font-related: 11 instances (font objects, font loaders)
   - Widget/Document: 8 instances (build functions, page references)
   - Metadata/Data: 6 instances (Record<string, unknown> patterns)
   - Graphics Context: 5 instances (font registry, clip paths)
   - Test Mocks: 19 instances (mock implementations)

2. **`any` Types**: 51 instances, primarily in test files
   - Test assertions: 45 instances (as any casts)
   - Mock setups: 6 instances (mock object creation)

## Type Definition Strategy

### 1. Core Type Definitions

#### Font Types
```typescript
// Replace unknown in font-related interfaces
export interface IPdfFont {
    name: string;
    fontName: string;
    type: 'standard' | 'ttf';
    measureTextWidth(text: string, fontSize: number): number;
    getFontHeight(fontSize: number): number;
    getAscender(fontSize: number): number;
    getDescender(fontSize: number): number;
    getPdfFontName(): string;
    ref(): string;
}

// Update IUniversalFont interface
export interface IUniversalFont {
    // ... existing properties
    getUnderlyingFont(): IPdfFont; // Replace unknown
}
```

#### Widget Types
```typescript
// Import from base.ts
import type { Widget } from '../widgets/base.js';

// Update IPageOptions
export interface IPageOptions {
    // ... existing properties
    build?: () => Widget; // Replace unknown
}
```

#### Page Types
```typescript
// Define proper Page interface
export interface IPage {
    size: Geometry.Size;
    margins: Layout.EdgeInsets;
    format?: string;
    orientation?: 'portrait' | 'landscape';
    renderWidget(widget: Widget): void;
    getGraphicsContext(): IGraphicsContext;
}

// Update IDocument
export interface IDocument {
    // ... existing properties
    addPage(options?: IPageOptions): IPage; // Replace unknown
    getPages(): readonly IPage[]; // Replace unknown[]
}
```

#### Metadata Types
```typescript
// Define specific metadata types
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

// Replace Record<string, unknown> with specific types
export type Metadata = ChartMetadata | TableCellMetadata | DocumentMetadata;
```

### 2. Graphics Context Types

```typescript
// Update IGraphicsContext
export interface IGraphicsContext {
    // ... existing properties
    drawString(
        font: IPdfFont, // Replace unknown
        fontSize: number,
        text: string,
        x: number,
        y: number
    ): void;
    setFont(font: IPdfFont, fontSize: number): void; // Replace unknown
    readonly fontRegistry?: IFontSystem; // Already typed
}
```

### 3. Test Mock Types

```typescript
// Enhanced mock types with proper typing
export interface MockFont extends IPdfFont {
    // Additional mock-specific properties
    mockCalls?: {
        measureTextWidth: Array<[string, number]>;
        getFontHeight: Array<[number]>;
    };
}

export interface MockGraphicsContext extends IGraphicsContext {
    // Properly typed font parameters
    drawString(
        font: IPdfFont,
        fontSize: number,
        text: string,
        x: number,
        y: number
    ): void;
    setFont(font: IPdfFont, fontSize: number): void;
}
```

## Implementation Plan

### Phase 1: Core Type Definitions (Priority: High)

1. **Create new type definition file**: `src/types/pdf-types.ts`
   - Define IPdfFont, IPage interfaces
   - Define metadata types
   - Export all new types

2. **Update core-interfaces.ts**
   - Import new types
   - Replace all `unknown` with proper types
   - Maintain backward compatibility

### Phase 2: Update Implementation Files (Priority: High)

1. **Font System** (`src/core/fonts.ts`, `src/core/pdf/font-engine.ts`)
   - Replace `unknown` with `IPdfFont`
   - Update method signatures
   - Add type guards for font validation

2. **Document System** (`src/core/document.ts`, `src/core/pdf/document.ts`)
   - Replace `unknown` with `IPage` and `Widget`
   - Update page creation methods
   - Ensure proper type propagation

3. **Graphics Context** (`src/core/pdf/graphics.ts`)
   - Update font-related method signatures
   - Replace `unknown` clip path with proper type
   - Add type assertions where needed

### Phase 3: Fix Test Files (Priority: Medium)

1. **Replace `any` casts with proper types**
   ```typescript
   // Before
   const mockContext = { ... } as any;
   
   // After
   const mockContext: MockPaintContext = createMockPaintContext({ ... });
   ```

2. **Update mock factories**
   - Enhance type safety in mock creation functions
   - Remove `as unknown as` double casts
   - Use proper type assertions

3. **Fix test assertions**
   ```typescript
   // Before
   expect(widget.layout({} as any)).toBeDefined();
   
   // After
   const context = createMockLayoutContext();
   expect(widget.layout(context)).toBeDefined();
   ```

### Phase 4: Type Guards and Runtime Safety (Priority: Medium)

1. **Create type guard functions**
   ```typescript
   export function isPdfFont(obj: unknown): obj is IPdfFont {
       return (
           typeof obj === 'object' &&
           obj !== null &&
           'name' in obj &&
           'measureTextWidth' in obj
       );
   }
   
   export function isWidget(obj: unknown): obj is Widget {
       return (
           typeof obj === 'object' &&
           obj !== null &&
           'layout' in obj &&
           'paint' in obj
       );
   }
   ```

2. **Add runtime validation**
   - Validate font objects before use
   - Check widget types at boundaries
   - Assert page objects are valid

### Phase 5: Documentation and Testing (Priority: Low)

1. **Update documentation**
   - Document new type definitions
   - Add migration guide for consumers
   - Update API documentation

2. **Comprehensive testing**
   - Run full test suite after each phase
   - Add type-specific tests
   - Verify no runtime regressions

## Migration Strategy

### For Library Consumers

1. **Non-breaking changes**
   - All changes maintain backward compatibility
   - Existing code continues to work
   - Types become more specific, not different

2. **Gradual adoption**
   - Consumers can update their types gradually
   - TypeScript will provide better IntelliSense
   - No runtime changes required

### For Library Developers

1. **Incremental updates**
   - Fix one module at a time
   - Run tests after each change
   - Commit frequently

2. **Code review process**
   - Review type changes carefully
   - Ensure consistency across modules
   - Document any breaking changes

## Success Metrics

1. **Zero `unknown` types** (except where absolutely necessary)
2. **Zero `any` types** in production code
3. **Minimal `any` types** in test code (target: < 10)
4. **100% test pass rate** maintained
5. **No runtime regressions**
6. **Improved TypeScript compilation** (stricter checks pass)

## Risk Mitigation

1. **Backward Compatibility**
   - All changes are additive
   - No existing APIs change signature
   - Types become more specific, not different

2. **Testing Coverage**
   - Run tests after each change
   - Add type-specific tests
   - Manual testing of critical paths

3. **Rollback Plan**
   - Git commits for each phase
   - Can revert individual changes
   - Feature flags for major changes

## Timeline

- **Week 1**: Phase 1-2 (Core types and implementations)
- **Week 2**: Phase 3 (Test files)
- **Week 3**: Phase 4-5 (Type guards and documentation)
- **Week 4**: Final testing and release

## Conclusion

This comprehensive type safety improvement will:
- Eliminate technical debt from `unknown` and `any` types
- Improve developer experience with better IntelliSense
- Reduce runtime errors through compile-time type checking
- Make the codebase more maintainable and robust

The changes are designed to be non-breaking and can be implemented incrementally with minimal risk to existing functionality.