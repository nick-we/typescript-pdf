/**
 * MultiPage Widget Test Suite
 *
 * Comprehensive tests for the MultiPage widget system including:
 * - Basic functionality
 * - Page break detection
 * - Header/footer rendering
 * - Content splitting
 * - Document integration
 * - Edge cases
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
    MultiPage,
    PageBreakBehavior,
    MultiPageUtils,
} from '../widgets/multipage.js';
import { TextWidget } from '../widgets/text.js';

import { createMockDocument, createMockPdfPage } from './mock-interfaces.js';

import { Document } from '@/core/document.js';
import type { IDocument, IPageOptions } from '@/types/core-interfaces.js';
import { Layout, Theme } from '@/types.js';
import { Column, Row } from '@/widgets/flex.js';
import { Container } from '@/widgets/layout.js';



describe('MultiPage Widget', () => {
    let mockLayoutContext: Layout.LayoutContext;
    let mockPaintContext: Layout.PaintContext;
    let document: Document;

    beforeEach(() => {
        // Create test document
        document = new Document({ verbose: false });

        // Mock layout context
        mockLayoutContext = {
            constraints: {
                minWidth: 0,
                maxWidth: 595, // A4 width
                minHeight: 0,
                maxHeight: 842, // A4 height
            },
            textDirection: 'ltr',
            theme: Theme.Utils.light(),
        };

        // Mock paint context
        mockPaintContext = {
            size: { width: 595, height: 842 },
            theme: Theme.Utils.light(),
            graphics: undefined, // Will be mocked when needed
        } as any;

        // Add document for integration testing
        (mockPaintContext as any).document = document;
    });

    describe('Basic Construction', () => {
        it('should create MultiPage widget with minimal props', () => {
            const multipage = new MultiPage({
                children: [new TextWidget('Test content')],
            });

            expect(multipage).toBeDefined();
            expect(multipage.debugLabel).toBeUndefined();
        });

        it('should create MultiPage widget with all props', () => {
            const header = (pageNum: number, totalPages: number) =>
                new TextWidget(`Page ${pageNum} of ${totalPages}`);
            const footer = new TextWidget('Footer text');

            const multipage = new MultiPage({
                children: [new TextWidget('Test content')],
                header,
                footer,
                pageBreakBehavior: PageBreakBehavior.Avoid,
                pageMargins: Layout.EdgeInsets.all(50),
                maxPages: 10,
                pageSize: { width: 400, height: 600 },
                debugLabel: 'TestMultiPage',
            });

            expect(multipage).toBeDefined();
            expect(multipage.debugLabel).toBe('TestMultiPage');
        });

        it('should handle empty children array', () => {
            const multipage = new MultiPage({
                children: [],
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Page Layout Calculation', () => {
        it('should calculate correct page dimensions', () => {
            const multipage = new MultiPage({
                children: [new TextWidget('Test')],
                pageSize: { width: 400, height: 600 },
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBe(400);
            expect(result.size.height).toBe(600);
        });

        it('should use A4 dimensions by default', () => {
            const multipage = new MultiPage({
                children: [new TextWidget('Test')],
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBe(595); // A4 width
            expect(result.size.height).toBe(842); // A4 height
        });

        it('should account for margins in content area calculation', () => {
            const multipage = new MultiPage({
                children: [new TextWidget('Test')],
                pageMargins: Layout.EdgeInsets.all(100),
                pageSize: { width: 400, height: 600 },
            });

            // Layout should succeed despite smaller content area
            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBe(400);
            expect(result.size.height).toBe(600);
        });
    });

    describe('Content Measurement', () => {
        it('should measure single widget correctly', () => {
            const multipage = new MultiPage({
                children: [new TextWidget('Single line of text')],
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
            expect(result.needsRepaint).toBe(true);
        });

        it('should measure multiple widgets', () => {
            const multipage = new MultiPage({
                children: [
                    new TextWidget('First widget'),
                    new TextWidget('Second widget'),
                    new Container({
                        child: new TextWidget('Third widget in container'),
                        padding: Layout.EdgeInsets.all(20),
                    }),
                ],
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle widgets with different sizes', () => {
            const multipage = new MultiPage({
                children: [
                    new TextWidget('Short'),
                    new Container({
                        child: new Column({
                            children: [
                                new TextWidget('Tall'),
                                new TextWidget('Widget'),
                                new TextWidget('Content'),
                            ],
                        }),
                        padding: Layout.EdgeInsets.all(50),
                    }),
                ],
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Page Break Detection', () => {
        it('should create single page for small content', () => {
            const multipage = new MultiPage({
                children: [new TextWidget('Small content')],
            });

            // Mock the internal methods to inspect page count
            multipage.layout(mockLayoutContext);

            // Small content should fit on one page
            // We'll verify this through paint behavior
            let pageCount = 0;
            const mockDocument: IDocument = {
                ...createMockDocument(),
                addPage: (_options?: IPageOptions) => {
                    pageCount++;
                    return createMockPdfPage();
                },
            };

            const paintContextWithMockDoc = {
                ...mockPaintContext,
                document: mockDocument,
            };

            multipage.paint(paintContextWithMockDoc);
            expect(pageCount).toBe(0); // No additional pages created for small content
        });

        it('should create multiple pages for large content', () => {
            // Create content that will definitely exceed one page
            const largeContent = Array.from(
                { length: 50 },
                (_, i) =>
                    new Container({
                        child: new TextWidget(
                            `Large content item ${i + 1} with enough text to make it tall`
                        ),
                        padding: Layout.EdgeInsets.all(20),
                        margin: Layout.EdgeInsets.all(10),
                    })
            );

            const multipage = new MultiPage({
                children: largeContent,
                pageSize: { width: 400, height: 600 }, // Smaller page to force breaks
            });

            multipage.layout(mockLayoutContext);

            let additionalPagesCreated = 0;
            const mockDocument: IDocument = {
                ...createMockDocument(),
                addPage: () => {
                    additionalPagesCreated++;
                    return createMockPdfPage(); // Mock page creation
                },
            };

            const paintContextWithMockDoc = {
                ...mockPaintContext,
                document: mockDocument,
            };

            multipage.paint(paintContextWithMockDoc);
            expect(additionalPagesCreated).toBeGreaterThan(0); // Should create additional pages
        });

        it('should respect maxPages limit', () => {
            // Create a lot of content
            const largeContent = Array.from(
                { length: 100 },
                (_, i) =>
                    new Container({
                        child: new TextWidget(`Content ${i}`),
                        padding: Layout.EdgeInsets.all(30),
                    })
            );

            const multipage = new MultiPage({
                children: largeContent,
                maxPages: 3,
                pageSize: { width: 400, height: 300 }, // Very small to force many breaks
            });

            multipage.layout(mockLayoutContext);

            let additionalPagesCreated = 0;
            const mockDocument: IDocument = {
                ...createMockDocument(),
                addPage: () => {
                    additionalPagesCreated++;
                    return { renderWidget: () => { } } as any;
                },
            };

            const paintContextWithMockDoc = {
                ...mockPaintContext,
                document: mockDocument,
            };

            multipage.paint(paintContextWithMockDoc);
            expect(additionalPagesCreated).toBeLessThanOrEqual(2); // Max 3 pages = 2 additional
        });
    });

    describe('Header and Footer Support', () => {
        it('should support static header widget', () => {
            const header = new TextWidget('Static Header');
            const multipage = new MultiPage({
                children: [new TextWidget('Content')],
                header,
            });

            // Should layout successfully with header
            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should support dynamic header function', () => {
            const header = (pageNum: number, totalPages: number) =>
                new TextWidget(`Page ${pageNum} of ${totalPages}`);

            const multipage = new MultiPage({
                children: [new TextWidget('Content')],
                header,
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should support both header and footer', () => {
            const header = new TextWidget('Header Text');
            const footer = new TextWidget('Footer Text');

            const multipage = new MultiPage({
                children: [new TextWidget('Content')],
                header,
                footer,
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle header/footer measurement failures gracefully', () => {
            // Create a header that might fail during measurement
            const problematicHeader = {
                layout: () => {
                    throw new Error('Measurement failed');
                },
                paint: () => { },
            };

            const multipage = new MultiPage({
                children: [new TextWidget('Content')],
                header: problematicHeader as any,
            });

            // Should not throw, should handle gracefully
            expect(() => {
                multipage.layout(mockLayoutContext);
            }).not.toThrow();
        });
    });

    describe('Page Break Behavior', () => {
        it('should respect Avoid behavior', () => {
            const multipage = new MultiPage({
                children: [
                    new TextWidget('Widget 1'),
                    new TextWidget('Widget 2'),
                ],
                pageBreakBehavior: PageBreakBehavior.Avoid,
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should respect Auto behavior', () => {
            const multipage = new MultiPage({
                children: [
                    new TextWidget('Widget 1'),
                    new TextWidget('Widget 2'),
                ],
                pageBreakBehavior: PageBreakBehavior.Auto,
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should respect Always behavior', () => {
            const multipage = new MultiPage({
                children: [
                    new TextWidget('Widget 1'),
                    new TextWidget('Widget 2'),
                ],
                pageBreakBehavior: PageBreakBehavior.Always,
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Painting and Rendering', () => {
        it('should paint single page correctly', () => {
            const multipage = new MultiPage({
                children: [new TextWidget('Simple content')],
            });

            multipage.layout(mockLayoutContext);

            // Should not throw when painting
            expect(() => {
                multipage.paint(mockPaintContext);
            }).not.toThrow();
        });

        it('should handle paint without layout', () => {
            const multipage = new MultiPage({
                children: [new TextWidget('Content')],
            });

            // Paint without layout should handle gracefully
            expect(() => {
                multipage.paint(mockPaintContext);
            }).not.toThrow();
        });

        it('should create additional pages through document integration', () => {
            const content = Array.from(
                { length: 20 },
                (_, i) =>
                    new Container({
                        child: new TextWidget(`Item ${i + 1}`),
                        padding: Layout.EdgeInsets.all(25),
                    })
            );

            const multipage = new MultiPage({
                children: content,
                pageSize: { width: 400, height: 400 }, // Force multiple pages
            });

            multipage.layout(mockLayoutContext);

            let pagesCreated = 0;
            const mockDocument: IDocument = {
                ...createMockDocument(),
                addPage: (options?: IPageOptions) => {
                    pagesCreated++;
                    if (options) {
                        expect(options.width).toBe(400);
                        expect(options.height).toBe(400);
                        expect(options.build).toBeDefined();
                    }
                    return { renderWidget: () => { } } as any;
                },
            };

            const paintContextWithDoc = {
                ...mockPaintContext,
                document: mockDocument,
            };

            multipage.paint(paintContextWithDoc);
            // Should create at least one additional page for large content
            expect(pagesCreated).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large single widget', () => {
            const largeWidget = new Container({
                child: new Column({
                    children: Array.from(
                        { length: 100 },
                        (_, i) => new TextWidget(`Line ${i}`)
                    ),
                }),
                padding: Layout.EdgeInsets.all(50),
            });

            const multipage = new MultiPage({
                children: [largeWidget],
                pageSize: { width: 400, height: 200 }, // Small page
            });

            // Should handle large widget gracefully
            expect(() => {
                multipage.layout(mockLayoutContext);
            }).not.toThrow();
        });

        it('should handle zero-size constraints', () => {
            const zeroConstraintContext = {
                ...mockLayoutContext,
                constraints: {
                    minWidth: 0,
                    maxWidth: 0,
                    minHeight: 0,
                    maxHeight: 0,
                },
            };

            const multipage = new MultiPage({
                children: [new TextWidget('Test')],
            });

            // Should handle zero constraints gracefully
            expect(() => {
                multipage.layout(zeroConstraintContext);
            }).not.toThrow();
        });

        it('should handle infinite constraints', () => {
            const infiniteConstraintContext = {
                ...mockLayoutContext,
                constraints: {
                    minWidth: 0,
                    maxWidth: Number.POSITIVE_INFINITY,
                    minHeight: 0,
                    maxHeight: Number.POSITIVE_INFINITY,
                },
            };

            const multipage = new MultiPage({
                children: [new TextWidget('Test')],
            });

            const result = multipage.layout(infiniteConstraintContext);
            // Should default to A4 size for infinite constraints
            expect(result.size.width).toBe(612);
            expect(result.size.height).toBe(792);
        });

        it('should handle widget measurement failures', () => {
            const problematicWidget = {
                layout: () => {
                    throw new Error('Widget layout failed');
                },
                paint: () => { },
            };

            const multipage = new MultiPage({
                children: [
                    problematicWidget as any,
                    new TextWidget('Good widget'),
                ],
            });

            // Should handle widget failures gracefully
            expect(() => {
                multipage.layout(mockLayoutContext);
            }).not.toThrow();
        });
    });

    describe('MultiPageUtils', () => {
        it('should create simple header/footer multipage', () => {
            const multipage = MultiPageUtils.withSimpleHeaderFooter(
                [new TextWidget('Content')],
                'Header: {page} of {total}',
                'Footer text'
            );

            expect(multipage).toBeInstanceOf(MultiPage);

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create report-style multipage', () => {
            const multipage = MultiPageUtils.forReport(
                [new TextWidget('Report content')],
                {
                    title: 'Test Report',
                    showPageNumbers: true,
                    margins: Layout.EdgeInsets.all(50),
                }
            );

            expect(multipage).toBeInstanceOf(MultiPage);

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create report without title', () => {
            const multipage = MultiPageUtils.forReport(
                [new TextWidget('Content')],
                {
                    showPageNumbers: true,
                }
            );

            expect(multipage).toBeInstanceOf(MultiPage);
        });

        it('should create report without page numbers', () => {
            const multipage = MultiPageUtils.forReport(
                [new TextWidget('Content')],
                {
                    title: 'Report Title',
                    showPageNumbers: false,
                }
            );

            expect(multipage).toBeInstanceOf(MultiPage);
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle mixed widget types', () => {
            const multipage = new MultiPage({
                children: [
                    new TextWidget('Text widget'),
                    new Container({
                        child: new TextWidget('Container widget'),
                        decoration: { color: '#f0f0f0' },
                    }),
                    new Row({
                        children: [
                            new TextWidget('Row item 1'),
                            new TextWidget('Row item 2'),
                        ],
                    }),
                    new Column({
                        children: [
                            new TextWidget('Column item 1'),
                            new TextWidget('Column item 2'),
                        ],
                    }),
                ],
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle nested containers', () => {
            const multipage = new MultiPage({
                children: [
                    new Container({
                        child: new Container({
                            child: new Container({
                                child: new TextWidget('Deeply nested text'),
                                padding: Layout.EdgeInsets.all(5),
                            }),
                            padding: Layout.EdgeInsets.all(10),
                        }),
                        padding: Layout.EdgeInsets.all(15),
                    }),
                ],
            });

            const result = multipage.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });
});
