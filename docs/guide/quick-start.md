# Quick Start

This guide will help you create your first PDF document with TypeScript PDF in just a few minutes.

## Basic Document

Let's start with a simple "Hello World" document:

```typescript
import { Document, TextWidget } from 'typescript-pdf';

const doc = new Document();

doc.addPage({
  build: () => new TextWidget('Hello, TypeScript PDF!')
});

const pdfBytes = await doc.save();

// In Node.js - save to file
import { writeFileSync } from 'fs';
writeFileSync('hello-world.pdf', pdfBytes);

// In browser - download
const blob = new Blob([pdfBytes], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'hello-world.pdf';
a.click();
```

## Adding Styling

Let's make it more visually appealing with styling:

```typescript
import { Document, TextWidget, Container } from 'typescript-pdf';

const doc = new Document();

doc.addPage({
  build: () => new Container({
    padding: { all: 20 },
    child: new TextWidget('Hello, TypeScript PDF!', {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#2563eb'
    })
  })
});

const pdfBytes = await doc.save();
```

## Layout with Multiple Elements

Create more complex layouts using containers and flex layouts:

```typescript
import { 
  Document, 
  TextWidget, 
  Container, 
  Column,
  Row 
} from 'typescript-pdf';

const doc = new Document();

doc.addPage({
  build: () => new Container({
    padding: { all: 20 },
    child: new Column({
      crossAxisAlignment: 'start',
      children: [
        new TextWidget('TypeScript PDF', {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1f2937'
        }),
        
        new TextWidget('Modern PDF Generation', {
          fontSize: 16,
          color: '#6b7280',
          marginTop: 8
        }),
        
        new Container({
          marginTop: 20,
          padding: { all: 16 },
          decoration: {
            color: '#f3f4f6',
            border: { width: 1, color: '#d1d5db' }
          },
          child: new TextWidget(
            'This PDF was generated using TypeScript PDF, a modern library for programmatic PDF creation.',
            { fontSize: 14 }
          )
        })
      ]
    })
  })
});

const pdfBytes = await doc.save();
```

## Working with Tables

Create data tables easily:

```typescript
import { Document, Table, TableRow, TextWidget } from 'typescript-pdf';

const doc = new Document();

doc.addPage({
  build: () => new Table({
    columnWidths: ['flex', 'flex', '100pt'],
    children: [
      new TableRow([
        new TextWidget('Product', { fontWeight: 'bold' }),
        new TextWidget('Price', { fontWeight: 'bold' }),
        new TextWidget('Qty', { fontWeight: 'bold' })
      ]),
      new TableRow([
        new TextWidget('Widget A'),
        new TextWidget('$29.99'),
        new TextWidget('2')
      ]),
      new TableRow([
        new TextWidget('Widget B'),
        new TextWidget('$19.99'),
        new TextWidget('1')
      ])
    ]
  })
});

const pdfBytes = await doc.save();
```

## Next Steps

Now that you've created your first PDF documents, explore more advanced features:

- [Typography Guide](/typography) - Advanced text formatting
- [Theming System](/theming-guide) - Consistent styling across documents
- [Table Guide](/table-guide) - Complex table layouts
- [MultiPage Documents](/multipage-widget-guide) - Documents with multiple pages

## Common Patterns

### Responsive Layout

```typescript
const responsiveLayout = new Container({
  constraints: { maxWidth: 600 },
  child: new Column({
    children: [
      // Your content here
    ]
  })
});
```

### Conditional Content

```typescript
const conditionalContent = new Column({
  children: [
    new TextWidget('Always visible'),
    ...(showOptional ? [
      new TextWidget('Conditionally visible')
    ] : [])
  ]
});
```

### Reusable Components

```typescript
function createHeader(title: string) {
  return new Container({
    padding: { vertical: 10 },
    decoration: {
      border: { bottom: { width: 2, color: '#2563eb' } }
    },
    child: new TextWidget(title, {
      fontSize: 20,
      fontWeight: 'bold'
    })
  });
}

// Usage
doc.addPage({
  build: () => new Column({
    children: [
      createHeader('My Document'),
      // ... other content
    ]
  })
});
```

Ready to dive deeper? Check out our comprehensive guides for advanced features and best practices.