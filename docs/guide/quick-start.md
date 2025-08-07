# Quick Start

This guide will help you create your first PDF document with TypeScript PDF in just a few minutes.

## Basic Document

Let's start with a simple "Hello World" document:

```typescript
import { Document, Txt } from 'typescript-pdf';

const doc = new Document();

doc.addPage({
  build: () => new Txt('Hello, TypeScript PDF!')
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
import { Document, Txt, Container } from 'typescript-pdf';

const doc = new Document();

doc.addPage({
  build: () => new Container({
    padding: { all: 20 },
    child: new Txt('Hello, TypeScript PDF!', {
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
  Txt, 
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
        new Txt('TypeScript PDF', {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1f2937'
        }),
        
        new Txt('Modern PDF Generation', {
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
          child: new Txt(
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
import { Document, Table, TableRow, Txt } from 'typescript-pdf';

const doc = new Document();

doc.addPage({
  build: () => new Table({
    columnWidths: ['flex', 'flex', '100pt'],
    children: [
      new TableRow([
        new Txt('Product', { fontWeight: 'bold' }),
        new Txt('Price', { fontWeight: 'bold' }),
        new Txt('Qty', { fontWeight: 'bold' })
      ]),
      new TableRow([
        new Txt('Widget A'),
        new Txt('$29.99'),
        new Txt('2')
      ]),
      new TableRow([
        new Txt('Widget B'),
        new Txt('$19.99'),
        new Txt('1')
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
    new Txt('Always visible'),
    ...(showOptional ? [
      new Txt('Conditionally visible')
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
    child: new Txt(title, {
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