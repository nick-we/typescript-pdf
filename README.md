# typescript-pdf

A modern TypeScript library for programmatic PDF generation with a declarative API, inspired by Flutter's widget system.

[![CI](https://github.com/nick-we/typescript-pdf/workflows/CI/badge.svg)](https://github.com/nick-we/typescript-pdf/actions)
[![npm version](https://badge.fury.io/js/typescript-pdf.svg)](https://badge.fury.io/js/typescript-pdf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Declarative API**: Component-based approach similar to React/Flutter
- **Universal**: Works in both Node.js and browsers
- **Flexible**: Dual-layer architecture with low-level PDF primitives and high-level widgets
- **Modern**: Built with ES2020+ and modern build tools
- **Performant**: Optimized for large documents with streaming support

## 📦 Installation

```bash
# npm
npm install typescript-pdf

# pnpm
pnpm add typescript-pdf

# yarn
yarn add typescript-pdf
```

## 🎯 Quick Start

### Simple Document

```typescript
import { Document, Text } from 'typescript-pdf';

const doc = new Document();
doc.addPage({
  build: () => new Text('Hello World', { fontSize: 24 })
});

const pdfBytes = await doc.save();
```

### Advanced Layout

```typescript
import { Document, Column, Row, Text, Container } from 'typescript-pdf';

const doc = new Document();
doc.addPage({
  build: () => new Column({
    children: [
      new Text('Annual Report', { fontSize: 32, fontWeight: 'bold' }),
      new Row({
        children: [
          new Container({
            child: new Text('Sales: $1.2M')
          }),
          new Container({
            child: new Text('Growth: +15%')
          })
        ]
      })
    ]
  })
});

const pdfBytes = await doc.save();
```

## 🏗️ Architecture

**typescript-pdf** follows a dual-layer architecture:

1. **Low-Level PDF Engine**: Direct control over PDF primitives (pages, fonts, graphics, colors)
2. **High-Level Widget System**: Declarative, component-based API similar to React/Flutter

### Key Principles

- **Composition over Inheritance**: Modular, composable design patterns
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Developer Experience**: Intuitive APIs with excellent IntelliSense support
- **Performance**: Efficient PDF generation with minimal memory footprint

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md) *(Coming Soon)*
- [API Reference](docs/api/index.md) *(Coming Soon)*
- [Widget Catalog](docs/widgets/index.md) *(Coming Soon)*
- [Examples](examples/) *(Coming Soon)*

## 🛠️ Development

This project uses modern development tools and practices:

- **TypeScript 5.0+** with strict type checking
- **Vite** for development and build
- **Vitest** for testing with coverage
- **ESLint + Prettier** for code quality
- **Husky** for git hooks
- **pnmp** for package management

### Setup

```bash
# Clone the repository
git clone https://github.com/nick-we/typescript-pdf.git
cd typescript-pdf

# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Build the project
pnpm build
```

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Lint code
- `pnpm format` - Format code
- `pnpm type-check` - Type check without emitting

## 📊 Project Status

**Current Phase**: Foundation Setup ✅

This project is currently in the initial setup phase. The following has been completed:

- ✅ Package structure and configuration
- ✅ TypeScript setup with strict type checking
- ✅ Development tooling (Vite, Rollup, ESLint, Prettier)
- ✅ Testing framework (Vitest) with coverage
- ✅ Build pipeline for multiple output formats
- ✅ CI/CD workflows
- ✅ VS Code configuration

### Roadmap

- **Phase 1**: Project Foundation (Week 1-2) ✅
- **Phase 2**: Low-Level PDF Engine (Week 3-6)
- **Phase 3**: Widget System (Week 7-12)
- **Phase 4**: Advanced Features & Optimization

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `pnpm test`
5. Lint and format: `pnpm lint && pnpm format`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [dart-pdf](https://github.com/DavBfr/dart_pdf) - The original Dart PDF generation library
- Built with modern TypeScript and web technologies
- Special thanks to the Flutter team for the widget system inspiration

## 📞 Support

- 📖 Documentation: [typescript-pdf.dev](https://typescript-pdf.dev) *(Coming Soon)*
- 🐛 Issues: [GitHub Issues](https://github.com/nick-we/typescript-pdf/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/nick-we/typescript-pdf/discussions)

---

Made by [Nick Westendorf](https://github.com/nick-we)