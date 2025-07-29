# System Architecture

## Core Architectural Principle

**Composition over Inheritance**: The fundamental design principle that differentiates typescript-pdf from dart-pdf. Instead of deep inheritance hierarchies, the system uses composition and functional patterns to achieve code reuse and extensibility.

## High-Level Architecture

### **Dual-Layer Design**

```
┌─────────────────────────────────────────────────────────────┐
│                    High-Level Widget API                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Widgets   │ │   Layout    │ │   Theming   │          │
│  │             │ │   Engine    │ │   System    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Low-Level PDF Engine                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ PDF Objects │ │  Graphics   │ │    Font     │          │
│  │             │ │   Context   │ │  Management │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

### **Core Modules**

```typescript
typescript-pdf/
├── src/
│   ├── core/           // Core PDF engine
│   │   ├── document/   // Document management
│   │   ├── page/       // Page handling
│   │   ├── graphics/   // Drawing operations
│   │   ├── font/       // Font systems
│   │   ├── color/      // Color management
│   │   └── geometry/   // Mathematical primitives
│   │
│   ├── widgets/        // High-level widget system
│   │   ├── base/       // Base widget classes
│   │   ├── layout/     // Layout widgets (Row, Column, etc.)
│   │   ├── text/       // Text rendering widgets
│   │   ├── shapes/     // Shape and decoration widgets
│   │   ├── containers/ // Container widgets
│   │   └── charts/     // Data visualization widgets
│   │
│   ├── layout/         // Layout engine
│   │   ├── constraints/// Box constraint system
│   │   ├── render/     // Rendering pipeline
│   │   └── measure/    // Size measurement
│   │
│   ├── theming/        // Styling system
│   │   ├── theme/      // Theme management
│   │   ├── styles/     // Style definitions
│   │   └── inheritance/// Style inheritance
│   │
│   └── utils/          // Utilities and helpers
│       ├── math/       // Mathematical utilities
│       ├── async/      // Async operations
│       └── validation/ // Type validation
```

## Core Components

### **1. Document Management Layer**

**PdfDocument**: Central document controller
```typescript
interface PdfDocument {
  addPage(pageBuilder: PageBuilder): void;
  save(): Promise<Uint8Array>;
  getPages(): readonly PdfPage[];
}
```

**Design Pattern**: Builder + Factory
- Composition-based page creation
- Immutable document state
- Async save operations

### **2. Widget System Architecture**

**Base Widget Interface**
```typescript
interface Widget {
  layout(context: LayoutContext, constraints: BoxConstraints): LayoutResult;
  paint(context: PaintContext): void;
}
```

**Composition Pattern Implementation**:
- **Functional Composition**: Widgets compose through function composition
- **Builder Pattern**: Fluent API for widget construction

```typescript
// Composition Example
const complexWidget = compose(
  withPadding({ all: 16 }),
  withBackground(Colors.white),
  withBorder({ width: 1, color: Colors.gray })
)(
  new Text("Hello World")
);
```

### **3. Layout Engine**

**Constraint-Based Layout System**
```typescript
interface BoxConstraints {
  minWidth: number;
  maxWidth: number; 
  minHeight: number;
  maxHeight: number;
}

interface LayoutContext {
  constraints: BoxConstraints;
  textDirection: TextDirection;
  theme: ThemeData;
}
```

**Layout Pipeline**:
1. **Constraint Propagation**: Parent → Child constraint flow
2. **Size Negotiation**: Child reports size to parent
3. **Position Assignment**: Parent positions child
4. **Paint Ordering**: Depth-first painting

### **4. Graphics Abstraction Layer**

**Canvas Interface**
```typescript
interface GraphicsContext {
  drawText(text: string, position: Point, style: TextStyle): void;
  drawRect(rect: Rect, paint: Paint): void;
  drawPath(path: Path, paint: Paint): void;
  transform(matrix: Matrix4): void;
  save(): void;
  restore(): void;
}
```

**Cross-Platform Strategy**:
- **Browser**: Canvas API + PDF.js-style operations
- **Node.js**: Native PDF generation + streaming
- **Shared Interface**: Platform-agnostic drawing commands

## Design Patterns Implementation

### **1. Composition over Inheritance**

**Traditional Inheritance** (dart-pdf style):
```dart
class Widget { ... }
class StatelessWidget extends Widget { ... }
class Container extends StatelessWidget { ... }
class Padding extends Container { ... }
```

**Composition Approach** (typescript-pdf):
```typescript
interface Widget { ... }
interface StatelessWidget extends Widget { ... }

// Compose instead of inherit
const Container = (props: ContainerProps) => 
  createWidget({ ...baseWidgetBehavior, ...containerBehavior });

const Padding = (props: PaddingProps) =>
  compose(paddingBehavior, containerBehavior)(createWidget());
```

### **2. Functional Composition Pattern**

```typescript
// Higher-order widget functions
const withTheme = <T extends Widget>(theme: ThemeData) => 
  (widget: T): ThemedWidget<T> => ({ ...widget, theme });

const withConstraints = <T extends Widget>(constraints: BoxConstraints) =>
  (widget: T): ConstrainedWidget<T> => ({ ...widget, constraints });

// Usage
const themedButton = pipe(
  withTheme(darkTheme),
  withConstraints({ maxWidth: 200 }),
  withPadding({ all: 12 })
)(Button({ text: "Click me" }));
```

### **3. Plugin Architecture**

```typescript
interface WidgetPlugin {
  name: string;
  install(registry: WidgetRegistry): void;
}

class WidgetRegistry {
  register<T extends Widget>(
    name: string, 
    factory: WidgetFactory<T>
  ): void;
}
```

## Data Flow Architecture

### **Rendering Pipeline**

```
User Code → Widget Tree → Layout → Paint → PDF Output

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Widget      │    │   Layout     │    │    Paint     │
│  Definition  │───▶│   Engine     │───▶│   Context    │
└──────────────┘    └──────────────┘    └──────────────┘
                              │                   │
                              ▼                   ▼
                    ┌──────────────┐    ┌──────────────┐
                    │ Constraints  │    │ PDF Commands │
                    │ & Geometry   │    │ & Graphics   │
                    └──────────────┘    └──────────────┘
```

### **State Management**

**Immutable State Pattern**:
- **Document State**: Immutable document configuration
- **Layout State**: Cached layout results for performance
- **Theme State**: Cascading theme inheritance

## Cross-Platform Architecture

### **Platform Abstraction**

```typescript
interface PlatformAdapter {
  createDocument(): PdfDocument;
  createGraphicsContext(): GraphicsContext;
  loadFont(fontData: Uint8Array): Font;
  measureText(text: string, style: TextStyle): TextMetrics;
}

// Platform implementations
class BrowserAdapter implements PlatformAdapter { ... }
class NodeAdapter implements PlatformAdapter { ... }
```

### **Module Loading Strategy**

```typescript
// Conditional platform loading
const adapter = await import(
  typeof window !== 'undefined' 
    ? './adapters/browser' 
    : './adapters/node'
);
```

## Performance Architecture

### **1. Lazy Evaluation**

```typescript
interface LazyWidget extends Widget {
  build(): Widget; // Only called when needed
}
```

### **2. Layout Caching**

```typescript
interface LayoutCache {
  get(widget: Widget, constraints: BoxConstraints): LayoutResult | null;
  set(widget: Widget, constraints: BoxConstraints, result: LayoutResult): void;
}
```

### **3. Streaming Generation**

```typescript
interface StreamingDocument {
  addPage(builder: () => Promise<Widget>): Promise<void>;
  stream(): AsyncIterable<Uint8Array>;
}
```

## Extensibility Architecture

### **1. Widget Extension Points**

```typescript
interface WidgetExtension {
  beforeLayout?(context: LayoutContext): void;
  afterLayout?(result: LayoutResult): void;
  beforePaint?(context: PaintContext): void;
  afterPaint?(): void;
}
```

### **2. Custom Widget Creation**

```typescript
const createCustomWidget = defineWidget({
  name: 'CustomWidget',
  props: customPropsSchema,
  layout: (context, constraints) => { ... },
  paint: (context) => { ... }
});
```

## Memory Management

### **1. Resource Lifecycle**

```typescript
interface Disposable {
  dispose(): void;
}

class ResourceManager {
  register<T extends Disposable>(resource: T): T;
  disposeAll(): void;
}
```

### **2. Font Caching Strategy**

```typescript
interface FontCache {
  get(fontFamily: string, weight: FontWeight): Font | null;
  preload(fonts: FontDefinition[]): Promise<void>;
  cleanup(): void;
}
```

## Key Architectural Decisions

### **1. TypeScript-First Design**
- Full type safety at compile time
- Generic type constraints for widget composition
- Branded types for units and measurements

### **2. Async-Native**
- All I/O operations are async by default
- Streaming-friendly APIs
- Cancellation token support

### **3. Tree-Shakable Modules**
- Modular widget system
- Optional feature plugins
- Minimal core bundle size

### **4. Immutable Data Structures**
- Immutable document state
- Functional update patterns
- Predictable state changes

This architecture ensures that typescript-pdf remains maintainable, performant, and extensible while adhering to the core principle of composition over inheritance.