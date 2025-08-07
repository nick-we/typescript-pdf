# Installation

## Requirements

- Node.js 18.0.0 or higher
- TypeScript 5.0+ (recommended)

## Package Manager

Install TypeScript PDF using your preferred package manager:

::: code-group

```bash [pnpm]
pnpm add typescript-pdf
```

```bash [npm]
npm install typescript-pdf
```

```bash [yarn]
yarn add typescript-pdf
```

:::

## TypeScript Configuration

For the best experience, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Verify Installation

Create a simple test to verify everything is working:

```typescript
import { Document, Txt } from 'typescript-pdf';

const doc = new Document();
doc.addPage({
  build: () => new Txt('Hello, TypeScript PDF!')
});

console.log('Installation successful!');
```

## Next Steps

Now that you have TypeScript PDF installed, let's create your first PDF document:

[Quick Start →](./quick-start.md)