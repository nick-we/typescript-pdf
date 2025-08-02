/**
 * Comprehensive theming showcase example
 * 
 * Demonstrates all features of the typescript-pdf theming system including:
 * - Theme creation and application
 * - Style inheritance and composition
 * - Typography scales
 * - Color schemes
 * - Custom themes
 * 
 * @packageDocumentation
 */

import { Document } from '../src/core/document.js';
import {
    Theme,
    ThemedWidget,
    ThemeConsumer,
    DefaultTextStyle,
    ThemeHelpers,
} from '../src/widgets/theme.js';
import {
    Text,
    Container,
    Column,
    Row,
    Padding,
    Margin,
    Center,
    Stack,
    Positioned,
    PositionedHelpers,
} from '../src/widgets/index.js';
import {
    ThemeUtils,
    ColorSchemes,
    TextStyleUtils,
    FontWeight,
    FontStyle,
    TextDecoration,
} from '../src/types/theming.js';
import { PdfStandardFont } from '../src/core/pdf/font.js';
import { EdgeInsets, BoxConstraints } from '../src/types/layout.js';
import { PdfColor } from '../src/core/pdf/color.js';

/**
 * Create a themed document showcase
 */
async function createThemedDocumentShowcase() {
    const doc = new Document();

    // Page 1: Light Theme Typography Showcase
    doc.addPage({
        build: () => createTypographyShowcase('light')
    });

    // Page 2: Dark Theme Typography Showcase  
    doc.addPage({
        build: () => createTypographyShowcase('dark')
    });

    // Page 3: Professional Theme Document Layout
    doc.addPage({
        build: () => createProfessionalDocument()
    });

    // Page 4: Custom Theme and Style Inheritance
    doc.addPage({
        build: () => createCustomThemeDemo()
    });

    // Page 5: Interactive Theme Switching
    doc.addPage({
        build: () => createThemeSwitchingDemo()
    });

    return doc;
}

/**
 * Create typography showcase for a specific theme
 */
function createTypographyShowcase(themeName: 'light' | 'dark' | 'professional') {
    const theme = themeName === 'light'
        ? ThemeUtils.light()
        : themeName === 'dark'
            ? ThemeUtils.dark()
            : ThemeUtils.professional();

    return new Theme({
        data: theme,
        child: new Container({
            padding: EdgeInsets.all(theme.spacing.xl),
            decoration: {
                color: theme.colorScheme.background,
            },
            child: new Column({
                children: [
                    // Page title using display typography
                    new Center({
                        child: new Text(`${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme Typography`, {
                            style: theme.typography.display,
                        }),
                    }),

                    // Spacing
                    new Container({ height: theme.spacing.xl }),

                    // Typography scale demonstration
                    new Column({
                        children: [
                            new Text('Heading Large', {
                                style: theme.typography.headingLarge
                            }),
                            new Container({ height: theme.spacing.md }),

                            new Text('Heading Medium', {
                                style: theme.typography.headingMedium
                            }),
                            new Container({ height: theme.spacing.md }),

                            new Text('Heading Small', {
                                style: theme.typography.headingSmall
                            }),
                            new Container({ height: theme.spacing.md }),

                            new Text('Title Style', {
                                style: theme.typography.title
                            }),
                            new Container({ height: theme.spacing.md }),

                            new Text('Body Large - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', {
                                style: theme.typography.bodyLarge
                            }),
                            new Container({ height: theme.spacing.sm }),

                            new Text('Body Medium - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', {
                                style: theme.typography.bodyMedium
                            }),
                            new Container({ height: theme.spacing.sm }),

                            new Text('Body Small - Lorem ipsum dolor sit amet, consectetur adipiscing elit.', {
                                style: theme.typography.bodySmall
                            }),
                            new Container({ height: theme.spacing.sm }),

                            new Text('LABEL TEXT', {
                                style: theme.typography.label
                            }),
                            new Container({ height: theme.spacing.sm }),

                            new Text('Caption text for additional information', {
                                style: theme.typography.caption
                            }),
                        ],
                    }),

                    // Color scheme demonstration
                    new Container({ height: theme.spacing.xl }),
                    new Text('Color Scheme', {
                        style: theme.typography.headingMedium
                    }),
                    new Container({ height: theme.spacing.md }),

                    new Row({
                        children: [
                            createColorSwatch('Primary', theme.colorScheme.primary, theme.colorScheme.onPrimary),
                            new Container({ width: theme.spacing.md }),
                            createColorSwatch('Secondary', theme.colorScheme.secondary, theme.colorScheme.onSecondary),
                            new Container({ width: theme.spacing.md }),
                            createColorSwatch('Error', theme.colorScheme.error, theme.colorScheme.onError),
                        ],
                    }),
                ],
            }),
        }),
    });
}

/**
 * Create a professional document layout
 */
function createProfessionalDocument() {
    return ThemeHelpers.professional(
        new Container({
            decoration: {
                color: PdfColor.fromHex('#ffffff'),
            },
            child: new Stack({
                children: [
                    // Background
                    PositionedHelpers.fill(
                        new Container({
                            decoration: {
                                color: PdfColor.fromHex('#f8f9fa'),
                            },
                        })
                    ),

                    // Header
                    new Positioned({
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 80,
                        child: new Container({
                            padding: EdgeInsets.all(20),
                            decoration: {
                                color: PdfColor.fromHex('#2c3e50'),
                            },
                            child: new Row({
                                children: [
                                    new Text('Professional Report', {
                                        style: TextStyleUtils.createInheriting({
                                            fontSize: 24,
                                            fontWeight: FontWeight.Bold,
                                            color: '#ffffff',
                                        }),
                                    }),
                                ],
                            }),
                        }),
                    }),

                    // Content
                    new Positioned({
                        top: 100,
                        left: 20,
                        right: 20,
                        bottom: 20,
                        child: new Column({
                            children: [
                                // Executive Summary
                                new Container({
                                    padding: EdgeInsets.all(20),
                                    margin: EdgeInsets.only({ bottom: 20 }),
                                    decoration: {
                                        color: PdfColor.fromHex('#ffffff'),
                                        border: {
                                            width: 1,
                                            color: PdfColor.fromHex('#e0e0e0'),
                                        },
                                    },
                                    child: new Column({
                                        children: [
                                            new Text('Executive Summary', {
                                                style: TextStyleUtils.createInheriting({
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.Bold,
                                                    color: '#2c3e50',
                                                }),
                                            }),
                                            new Container({ height: 10 }),
                                            new Text(
                                                'This professional document demonstrates the theming capabilities of typescript-pdf. ' +
                                                'The system supports consistent styling, typography scales, and brand color schemes.',
                                                {
                                                    style: TextStyleUtils.createInheriting({
                                                        fontSize: 12,
                                                        lineSpacing: 1.4,
                                                        color: '#34495e',
                                                    }),
                                                }
                                            ),
                                        ],
                                    }),
                                }),

                                // Key Features
                                new Container({
                                    padding: EdgeInsets.all(20),
                                    decoration: {
                                        color: PdfColor.fromHex('#ffffff'),
                                        border: {
                                            width: 1,
                                            color: PdfColor.fromHex('#e0e0e0'),
                                        },
                                    },
                                    child: new Column({
                                        children: [
                                            new Text('Key Features', {
                                                style: TextStyleUtils.createInheriting({
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.Bold,
                                                    color: '#2c3e50',
                                                }),
                                            }),
                                            new Container({ height: 10 }),

                                            // Feature list
                                            ...createFeatureList([
                                                'Comprehensive theming system with inheritance',
                                                'Typography scales for consistent text hierarchy',
                                                'Color schemes with semantic color names',
                                                'Style composition and merging utilities',
                                                'Theme-aware widgets and components',
                                                'Support for both light and dark themes',
                                                'Professional styling presets',
                                                'Flexible customization options',
                                                'Type-safe theme definitions',
                                                'Performance-optimized rendering',
                                                'Cascading styles with inheritance rules',
                                                'Cross-platform compatibility',
                                            ]),
                                        ],
                                    }),
                                }),
                            ],
                        }),
                    }),
                ],
            }),
        })
    );
}

/**
 * Create custom theme demonstration
 */
function createCustomThemeDemo() {
    // Create a custom brand theme
    const brandTheme = ThemeUtils.createTheme(
        {
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
            info: '#74b9ff',
        },
        {
            xs: 2,
            sm: 4,
            md: 8,
            lg: 16,
            xl: 24,
            xxl: 32,
        },
        PdfStandardFont.Helvetica,
        11
    );

    return new Theme({
        data: brandTheme,
        child: new Container({
            padding: EdgeInsets.all(brandTheme.spacing.xl),
            decoration: {
                color: brandTheme.colorScheme.background,
            },
            child: new Column({
                children: [
                    // Custom theme title
                    new Center({
                        child: new Text('Custom Brand Theme', {
                            style: TextStyleUtils.copyWith(brandTheme.typography.display, {
                                color: brandTheme.colorScheme.primary,
                            }),
                        }),
                    }),

                    new Container({ height: brandTheme.spacing.xl }),

                    // Style inheritance demonstration
                    new DefaultTextStyle({
                        style: TextStyleUtils.createInheriting({
                            fontSize: 14,
                            color: brandTheme.colorScheme.onSurface,
                            lineSpacing: 1.5,
                        }),
                        child: new Column({
                            children: [
                                new Text('Style Inheritance Demo', {
                                    style: TextStyleUtils.createInheriting({
                                        fontSize: 18,
                                        fontWeight: FontWeight.Bold,
                                    }),
                                }),

                                new Container({ height: brandTheme.spacing.md }),

                                new Text(
                                    'This text inherits the base style from DefaultTextStyle. ' +
                                    'Child widgets automatically receive the parent styling.',
                                ),

                                new Container({ height: brandTheme.spacing.sm }),

                                new Text('This text also inherits the same styling.'),

                                new Container({ height: brandTheme.spacing.sm }),

                                new Text('Override example', {
                                    style: TextStyleUtils.createInheriting({
                                        fontWeight: FontWeight.Bold,
                                        color: brandTheme.colorScheme.primary,
                                    }),
                                }),
                            ],
                        }),
                    }),

                    new Container({ height: brandTheme.spacing.xl }),

                    // Theme-aware components
                    new Text('Theme-Aware Components', {
                        style: brandTheme.typography.headingMedium,
                    }),

                    new Container({ height: brandTheme.spacing.md }),

                    // Using ThemeConsumer for reactive theming
                    new ThemeConsumer({
                        selector: (theme) => theme.colorScheme,
                        builder: (colors) => new Container({
                            padding: EdgeInsets.all(16),
                            decoration: {
                                color: colors.primary,
                                borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 8, bottomRight: 8 },
                            },
                            child: new Text('This component reacts to theme changes automatically', {
                                style: TextStyleUtils.createInheriting({
                                    color: colors.onPrimary,
                                    fontWeight: FontWeight.Bold,
                                }),
                            }),
                        }),
                    }),
                ],
            }),
        }),
    });
}

/**
 * Create theme switching demonstration
 */
function createThemeSwitchingDemo() {
    return new Column({
        children: [
            // Light theme section
            ThemeHelpers.light(
                new Container({
                    height: 200,
                    padding: EdgeInsets.all(20),
                    decoration: {
                        color: PdfColor.fromHex('#ffffff'),
                        border: { width: 2, color: PdfColor.fromHex('#e0e0e0') },
                    },
                    child: new Center({
                        child: new Column({
                            children: [
                                new Text('Light Theme Section', {
                                    style: TextStyleUtils.createInheriting({
                                        fontSize: 20,
                                        fontWeight: FontWeight.Bold,
                                    }),
                                }),
                                new Container({ height: 10 }),
                                new Text('Clean, bright interface perfect for documents and reports.'),
                            ],
                        }),
                    }),
                })
            ),

            new Container({ height: 20 }),

            // Dark theme section
            ThemeHelpers.dark(
                new Container({
                    height: 200,
                    padding: EdgeInsets.all(20),
                    decoration: {
                        color: PdfColor.fromHex('#121212'),
                        border: { width: 2, color: PdfColor.fromHex('#333333') },
                    },
                    child: new Center({
                        child: new Column({
                            children: [
                                new Text('Dark Theme Section', {
                                    style: TextStyleUtils.createInheriting({
                                        fontSize: 20,
                                        fontWeight: FontWeight.Bold,
                                    }),
                                }),
                                new Container({ height: 10 }),
                                new Text('Modern dark interface for reduced eye strain.'),
                            ],
                        }),
                    }),
                })
            ),

            new Container({ height: 20 }),

            // Professional theme section
            ThemeHelpers.professional(
                new Container({
                    height: 200,
                    padding: EdgeInsets.all(20),
                    decoration: {
                        color: PdfColor.fromHex('#f8f9fa'),
                        border: { width: 2, color: PdfColor.fromHex('#2c3e50') },
                    },
                    child: new Center({
                        child: new Column({
                            children: [
                                new Text('Professional Theme Section', {
                                    style: TextStyleUtils.createInheriting({
                                        fontSize: 20,
                                        fontWeight: FontWeight.Bold,
                                    }),
                                }),
                                new Container({ height: 10 }),
                                new Text('Conservative styling ideal for business documents.'),
                            ],
                        }),
                    }),
                })
            ),
        ],
    });
}

/**
 * Create a color swatch component
 */
function createColorSwatch(label: string, color: PdfColor, textColor: PdfColor) {
    return new Container({
        width: 120,
        height: 80,
        decoration: {
            color,
            borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 8, bottomRight: 8 },
        },
        child: new Center({
            child: new Column({
                children: [
                    new Text(label, {
                        style: TextStyleUtils.createInheriting({
                            color: textColor,
                            fontWeight: FontWeight.Bold,
                            fontSize: 12,
                        }),
                    }),
                    new Container({ height: 4 }),
                    new Text(color.toString(), {
                        style: TextStyleUtils.createInheriting({
                            color: textColor,
                            fontSize: 10,
                        }),
                    }),
                ],
            }),
        }),
    });
}

/**
 * Create a feature list with bullet points
 */
function createFeatureList(features: string[]) {
    return features.map((feature, index) => [
        new Row({
            children: [
                new Container({
                    width: 6,
                    height: 6,
                    margin: EdgeInsets.only({ top: 6, right: 8 }),
                    decoration: {
                        color: PdfColor.fromHex('#3498db'),
                        borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 3, bottomRight: 3 },
                    },
                }),
                new Text(feature, {
                    style: TextStyleUtils.createInheriting({
                        fontSize: 11,
                        lineSpacing: 1.4,
                        color: PdfColor.fromHex('#34495e'),
                    }),
                }),
            ],
        }),
        ...(index < features.length - 1 ? [new Container({ height: 6 })] : []),
    ]).flat();
}

/**
 * Export the themed document for use in examples
 */
export async function generateThemedShowcase(): Promise<Uint8Array> {
    const doc = await createThemedDocumentShowcase();
    return await doc.save();
}

// Example usage (commented out for browser compatibility)
// if (typeof require !== 'undefined' && require.main === module) {
//     generateThemedShowcase().then(pdfBytes => {
//         console.log(`Generated themed showcase PDF: ${pdfBytes.length} bytes`);
//         // In a real application, you would save this to a file or return it to the client
//     }).catch(console.error);
// }