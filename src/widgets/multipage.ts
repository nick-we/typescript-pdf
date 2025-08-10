/**
 * MultiPage Widget System
 *
 * Provides automatic page break functionality with header and footer support.
 * Automatically creates new pages when content exceeds available page height.
 *
 * @packageDocumentation
 */

import { PAGE_FORMATS, TextDirection } from '@/core/document.js';
import { widgetLogger } from '@/core/logger.js';
import type { Geometry } from '@/types.js';
import { Layout, Theme, Flex } from '@/types.js';
import { BaseWidget, type Widget, type WidgetProps } from '@/widgets/base.js';
import { Row } from '@/widgets/flex.js';
import { Container } from '@/widgets/layout.js';
import { Txt } from '@/widgets/text.js';

/**
 * Page break behavior options
 */
export enum PageBreakBehavior {
    /** Try to avoid breaking widgets when possible */
    Avoid = 'avoid',
    /** Allow widgets to be split across pages */
    Auto = 'auto',
    /** Always break to new page when content exceeds height */
    Always = 'always',
}

/**
 * Content measurement result for page break calculations
 */
export interface ContentMeasurement {
    /** Total height of all content */
    totalHeight: number;
    /** Individual widget heights in order */
    widgetHeights: number[];
    /** Optimal break points between widgets */
    breakPoints: number[];
    /** Maximum width required */
    maxWidth: number;
}

/**
 * Page layout information
 */
export interface PageLayout {
    /** Available content area excluding headers/footers/margins */
    contentArea: Geometry.Rect;
    /** Header area (if header present) */
    headerArea?: Geometry.Rect;
    /** Footer area (if footer present) */
    footerArea?: Geometry.Rect;
    /** Total page dimensions */
    pageSize: Geometry.Size;
}

/**
 * Content chunk for a single page
 */
export interface ContentChunk {
    /** Widgets to render on this page */
    widgets: Widget[];
    /** Starting content offset */
    startOffset: number;
    /** Ending content offset */
    endOffset: number;
    /** Page number (1-based) */
    pageNumber: number;
}

/**
 * MultiPage widget properties
 */
export interface MultiPageProps extends WidgetProps {
    /** Content widgets to paginate */
    children: Widget[];
    /** Optional header widget or function */
    header?: Widget | ((pageNumber: number, totalPages: number) => Widget);
    /** Optional footer widget or function */
    footer?: Widget | ((pageNumber: number, totalPages: number) => Widget);
    /** Page break behavior */
    pageBreakBehavior?: PageBreakBehavior;
    /** Page margins (defaults to document margins) */
    pageMargins?: Layout.EdgeInsets;
    /** Maximum number of pages to generate */
    maxPages?: number;
    /** Page size override (defaults to document page size) */
    pageSize?: Geometry.Size;
}

/**
 * MultiPage widget - Automatic page breaks with header/footer support
 *
 * This widget automatically manages content across multiple pages, creating
 * new pages as needed when content exceeds available height. It supports
 * headers and footers that are rendered consistently on each page.
 *
 * @example
 * ```typescript
 * const multiPageDoc = new MultiPage({
 *   header: (pageNum, totalPages) => new Text(`Page ${pageNum} of ${totalPages}`),
 *   footer: new Text('© 2024 Company Name'),
 *   children: [
 *     new Text('Long content...'),
 *     new Table({ data: largeDataSet }),
 *     new Chart({ data: chartData })
 *   ]
 * });
 * ```
 */
export class MultiPage extends BaseWidget {
    private readonly children: Widget[];
    private readonly header?:
        | Widget
        | ((pageNumber: number, totalPages: number) => Widget);
    private readonly footer?:
        | Widget
        | ((pageNumber: number, totalPages: number) => Widget);
    private readonly pageBreakBehavior: PageBreakBehavior;
    private readonly pageMargins: Layout.EdgeInsets;
    private readonly maxPages: number;
    private readonly pageSize?: Geometry.Size;

    // Layout cache
    private contentMeasurement?: ContentMeasurement;
    private pageLayout?: PageLayout;
    private contentChunks?: ContentChunk[];
    private totalPages: number = 0;

    constructor(props: MultiPageProps) {
        super(props);

        this.children = props.children || [];
        if (props.header) {
            this.header = props.header;
        }
        if (props.footer) {
            this.footer = props.footer;
        }
        this.pageBreakBehavior =
            props.pageBreakBehavior ?? PageBreakBehavior.Auto;
        // MARGIN FIX: Reduce default margins from 72pts to 20pts for better spacing
        this.pageMargins = props.pageMargins ?? Layout.EdgeInsets.all(20);
        this.maxPages = props.maxPages ?? 1000; // Reasonable default limit
        if (props.pageSize) {
            this.pageSize = props.pageSize;
        }
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        // Step 1: Calculate page layout dimensions
        this.pageLayout = this.calculatePageLayout(context);

        // Step 2: Measure all content widgets
        this.contentMeasurement = this.measureContent(context);

        // Step 3: Split content into page chunks
        this.contentChunks = this.splitContentIntoPages();

        // Step 4: Calculate total pages
        this.totalPages = this.contentChunks.length;

        // Ensure we don't exceed max pages
        if (this.totalPages > this.maxPages) {
            widgetLogger.warn(
                `MultiPage: Content requires ${this.totalPages} pages, but maxPages is ${this.maxPages}. Truncating content.`
            );
            this.contentChunks = this.contentChunks.slice(0, this.maxPages);
            this.totalPages = this.maxPages;
        }

        widgetLogger.info(
            `MultiPage: Generated ${this.totalPages} pages from ${this.children.length} widgets`
        );

        // Return the size of the first page (others will be created during paint)
        return this.createLayoutResult(this.pageLayout.pageSize);
    }

    paint(context: Layout.PaintContext): void {
        if (!this.pageLayout || !this.contentChunks) {
            widgetLogger.warn('MultiPage: Layout not calculated before paint');
            return;
        }

        widgetLogger.info(`MultiPage: Painting ${this.totalPages} pages`);
        widgetLogger.debug(
            `  - Using actual page size: ${this.pageSize?.width ?? PAGE_FORMATS.A4.width}x${this.pageSize?.height ?? PAGE_FORMATS.A4.height}`
        );

        // Paint the first page in the current context
        const firstChunk = this.contentChunks[0];
        if (firstChunk) {
            widgetLogger.debug(
                `  - Painting page 1 with ${firstChunk.widgets.length} widgets`
            );
            this.paintPage(context, firstChunk, 1);
        }

        // Create additional pages through document integration
        if (this.totalPages > 1 && this.canCreateAdditionalPages(context)) {
            this.createAdditionalPages(context);
        }
    }

    /**
     * Check if we can create additional pages (document integration available)
     */
    private canCreateAdditionalPages(context: Layout.PaintContext): boolean {
        // Check if document context is available for page creation
        return (
            !!context.document && typeof context.document.addPage === 'function'
        );
    }

    /**
     * Create additional pages for multi-page content
     */
    private createAdditionalPages(context: Layout.PaintContext): void {
        if (
            !this.contentChunks ||
            !this.pageLayout ||
            !this.pageSize ||
            !this.pageMargins ||
            !context.document
        ) {
            return;
        }

        const document = context.document;
        widgetLogger.info(
            `MultiPage: Creating ${this.totalPages - 1} additional pages`
        );

        // Create each additional page
        for (let pageIndex = 1; pageIndex < this.totalPages; pageIndex++) {
            const chunk = this.contentChunks[pageIndex];
            if (!chunk) {
                widgetLogger.warn(
                    `MultiPage: Missing chunk for page ${pageIndex + 1}`
                );
                continue;
            }

            const pageNumber = pageIndex + 1;
            widgetLogger.debug(
                `  - Creating page ${pageNumber} with ${chunk.widgets.length} widgets`
            );

            try {
                document.addPage({
                    width: this.pageSize.width,
                    height: this.pageSize.height,
                    margins: this.pageMargins,
                    build: () => {
                        // Return a widget that renders this chunk's content
                        return this.createPageWidget(chunk, pageNumber);
                    },
                });
            } catch (error) {
                widgetLogger.error(
                    `MultiPage: Failed to create page ${pageNumber}:`,
                    error
                );
            }
        }
    }

    /**
     * Create a widget that renders a specific page chunk
     */
    private createPageWidget(chunk: ContentChunk, pageNumber: number): Widget {
        const pageLayout = this.pageLayout;
        if (!pageLayout) {
            throw new Error('Page layout is required to create page widget');
        }

        return {
            layout: (_context: Layout.LayoutContext) => {
                return {
                    size: pageLayout.pageSize,
                    needsRepaint: true,
                };
            },

            paint: (context: Layout.PaintContext) => {
                this.paintPage(context, chunk, pageNumber);
            },
        };
    }

    /**
     * Calculate page layout dimensions including header/footer areas
     * MARGIN FIX: Improved positioning and eliminated double margin application
     */
    private calculatePageLayout(context: Layout.LayoutContext): PageLayout {
        const pageSize = this.pageSize ?? PAGE_FORMATS.A4;
        widgetLogger.debug(
            `MultiPage: Page size ${pageSize.width}x${pageSize.height} (actual: ${!!this.pageSize})`
        );

        // MARGIN FIX: Use smaller header/footer margins separate from content margins
        const headerFooterMargin = 10; // Small margin for headers/footers from page edge
        const contentMargins = this.pageMargins;

        // Calculate available areas
        let headerHeight = 0;
        let footerHeight = 0;

        // Measure header if present
        if (this.header) {
            headerHeight = this.measureHeaderFooter(context, this.header, true);
        }

        // Measure footer if present
        if (this.footer) {
            footerHeight = this.measureHeaderFooter(
                context,
                this.footer,
                false
            );
        }

        // MARGIN FIX: Content area accounts for headers/footers with proper spacing
        const contentArea: Geometry.Rect = {
            x: contentMargins.left,
            y:
                contentMargins.top +
                (headerHeight > 0 ? headerHeight + headerFooterMargin : 0),
            width: pageSize.width - contentMargins.left - contentMargins.right,
            height:
                pageSize.height -
                contentMargins.top -
                contentMargins.bottom -
                (headerHeight > 0 ? headerHeight + headerFooterMargin : 0) -
                (footerHeight > 0 ? footerHeight + headerFooterMargin : 0),
        };

        const pageLayout: PageLayout = {
            contentArea,
            pageSize,
        };

        // MARGIN FIX: Header positioned near page top (not content area top)
        if (this.header && headerHeight > 0) {
            pageLayout.headerArea = {
                x: contentMargins.left,
                y: headerFooterMargin, // Near page top, not content area top
                width:
                    pageSize.width - contentMargins.left - contentMargins.right,
                height: headerHeight,
            };
        }

        // MARGIN FIX: Footer positioned near page bottom (with proper coordinate handling)
        if (this.footer && footerHeight > 0) {
            pageLayout.footerArea = {
                x: contentMargins.left,
                y: pageSize.height - footerHeight - headerFooterMargin, // Near page bottom
                width:
                    pageSize.width - contentMargins.left - contentMargins.right,
                height: footerHeight,
            };
        }

        widgetLogger.debug(
            `MultiPage: Content area ${contentArea.width}x${contentArea.height} at (${contentArea.x}, ${contentArea.y})`
        );
        widgetLogger.debug(
            `MultiPage: Header height: ${headerHeight}, Footer height: ${footerHeight}`
        );
        if (pageLayout.headerArea) {
            widgetLogger.debug(
                `MultiPage: Header area at (${pageLayout.headerArea.x}, ${pageLayout.headerArea.y})`
            );
        }
        if (pageLayout.footerArea) {
            widgetLogger.debug(
                `MultiPage: Footer area at (${pageLayout.footerArea.x}, ${pageLayout.footerArea.y})`
            );
        }

        return pageLayout;
    }

    /**
     * Measure header or footer widget height
     */
    private measureHeaderFooter(
        context: Layout.LayoutContext,
        headerFooter:
            | Widget
            | ((pageNumber: number, totalPages: number) => Widget),
        isHeader: boolean
    ): number {
        // Create a sample widget to measure (using page 1 of 1 as placeholder)
        const widget =
            typeof headerFooter === 'function'
                ? headerFooter(1, 1)
                : headerFooter;

        // Create loose constraints for measurement using actual dimensions when available
        const pageWidth = this.pageSize?.width ?? context.constraints.maxWidth;
        const margins = this.pageMargins;

        const measureConstraints: Layout.BoxConstraints = {
            minWidth: 0,
            maxWidth: pageWidth - margins.left - margins.right,
            minHeight: 0,
            maxHeight: 100, // Reasonable max height for headers/footers
        };

        const measureContext: Layout.LayoutContext = {
            ...context,
            constraints: measureConstraints,
        };

        try {
            const result = widget.layout(measureContext);
            widgetLogger.debug(
                `MultiPage: ${isHeader ? 'Header' : 'Footer'} measured height: ${result.size.height}`
            );
            return result.size.height;
        } catch (error) {
            widgetLogger.warn(
                `MultiPage: Failed to measure ${isHeader ? 'header' : 'footer'}:`,
                error
            );
            return 0;
        }
    }

    /**
     * Measure all content widgets to determine total height and break points
     */
    private measureContent(context: Layout.LayoutContext): ContentMeasurement {
        if (!this.pageLayout) {
            throw new Error(
                'Page layout must be calculated before measuring content'
            );
        }

        widgetLogger.debug(
            `MultiPage: Measuring ${this.children.length} content widgets`
        );

        const widgetHeights: number[] = [];
        const breakPoints: number[] = [];
        let totalHeight = 0;
        let maxWidth = 0;

        // Create constraints for content measurement
        const contentConstraints: Layout.BoxConstraints = {
            minWidth: 0,
            maxWidth: this.pageLayout.contentArea.width,
            minHeight: 0,
            maxHeight: Number.POSITIVE_INFINITY, // Allow widgets to size naturally
        };

        const measureContext: Layout.LayoutContext = {
            ...context,
            constraints: contentConstraints,
        };

        // Measure each widget
        for (let i = 0; i < this.children.length; i++) {
            const widget = this.children[i];
            if (!widget) {
                widgetLogger.warn(
                    `MultiPage: Widget ${i} is undefined, skipping`
                );
                widgetHeights.push(0);
                breakPoints.push(totalHeight);
                continue;
            }

            try {
                const result = widget.layout(measureContext);
                const height = result.size.height;

                widgetHeights.push(height);
                totalHeight += height;
                maxWidth = Math.max(maxWidth, result.size.width);

                // Add break point after each widget
                breakPoints.push(totalHeight);

                widgetLogger.debug(
                    `  - Widget ${i}: ${result.size.width}x${height} (total: ${totalHeight})`
                );
            } catch (error) {
                widgetLogger.warn(
                    `MultiPage: Failed to measure widget ${i}:`,
                    error
                );
                widgetHeights.push(0);
                breakPoints.push(totalHeight);
            }
        }

        const measurement: ContentMeasurement = {
            totalHeight,
            widgetHeights,
            breakPoints,
            maxWidth,
        };

        widgetLogger.debug(
            `MultiPage: Total content height: ${totalHeight}, max width: ${maxWidth}`
        );
        widgetLogger.debug(
            `MultiPage: Available page height: ${this.pageLayout.contentArea.height}`
        );

        return measurement;
    }

    /**
     * Split content into page chunks based on available height
     */
    private splitContentIntoPages(): ContentChunk[] {
        if (!this.pageLayout || !this.contentMeasurement) {
            throw new Error(
                'Page layout and content measurement required for splitting'
            );
        }

        const chunks: ContentChunk[] = [];
        const availableHeight = this.pageLayout.contentArea.height;
        let currentPageHeight = 0;
        let currentPageWidgets: Widget[] = [];
        let currentStartOffset = 0;
        let pageNumber = 1;

        widgetLogger.debug(
            `MultiPage: Splitting content with available height ${availableHeight} per page`
        );

        for (let i = 0; i < this.children.length; i++) {
            const widget = this.children[i];
            if (!widget) {
                widgetLogger.warn(
                    `MultiPage: Widget ${i} is undefined, skipping`
                );
                continue;
            }

            const widgetHeight = this.contentMeasurement.widgetHeights[i];
            if (widgetHeight === undefined) {
                widgetLogger.warn(
                    `MultiPage: Widget ${i} height is undefined, skipping`
                );
                continue;
            }

            // Check if this widget fits on current page
            if (
                currentPageHeight + widgetHeight <= availableHeight ||
                currentPageWidgets.length === 0
            ) {
                // Widget fits, add to current page
                currentPageWidgets.push(widget);
                currentPageHeight += widgetHeight;
                widgetLogger.debug(
                    `    - Widget ${i} (${widgetHeight}h) added to page ${pageNumber}, total: ${currentPageHeight}`
                );
            } else {
                // Widget doesn't fit, finish current page and start new one
                if (currentPageWidgets.length > 0) {
                    chunks.push({
                        widgets: [...currentPageWidgets],
                        startOffset: currentStartOffset,
                        endOffset: currentStartOffset + currentPageHeight,
                        pageNumber,
                    });

                    widgetLogger.debug(
                        `  - Completed page ${pageNumber} with ${currentPageWidgets.length} widgets, height: ${currentPageHeight}`
                    );
                }

                // Start new page
                pageNumber++;
                currentPageWidgets = [widget];
                currentPageHeight = widgetHeight;
                const lastChunk = chunks[chunks.length - 1];
                currentStartOffset =
                    currentStartOffset +
                    (lastChunk
                        ? lastChunk.endOffset - lastChunk.startOffset
                        : 0);

                widgetLogger.debug(
                    `    - Widget ${i} (${widgetHeight}h) started new page ${pageNumber}`
                );
            }
        }

        // Add final page if it has content
        if (currentPageWidgets.length > 0) {
            chunks.push({
                widgets: [...currentPageWidgets],
                startOffset: currentStartOffset,
                endOffset: currentStartOffset + currentPageHeight,
                pageNumber,
            });

            widgetLogger.debug(
                `  - Completed final page ${pageNumber} with ${currentPageWidgets.length} widgets, height: ${currentPageHeight}`
            );
        }

        widgetLogger.info(`MultiPage: Split into ${chunks.length} pages`);
        return chunks;
    }

    /**
     * Paint a single page with its content, header, and footer
     */
    private paintPage(
        context: Layout.PaintContext,
        chunk: ContentChunk,
        pageNumber: number
    ): void {
        if (!this.pageLayout) {
            return;
        }

        widgetLogger.debug(`    - Painting page ${pageNumber} content`);

        const { graphics } = context;

        // Save graphics state for this page
        if (graphics) {
            graphics.save();
        }

        // Paint header if present
        if (this.header && this.pageLayout.headerArea) {
            this.paintHeaderFooter(
                context,
                this.header,
                this.pageLayout.headerArea,
                pageNumber,
                true
            );
        }

        // Paint footer if present
        if (this.footer && this.pageLayout.footerArea) {
            this.paintHeaderFooter(
                context,
                this.footer,
                this.pageLayout.footerArea,
                pageNumber,
                false
            );
        }

        // Paint page content
        if (graphics) {
            graphics.save();
            graphics.translate(
                this.pageLayout.contentArea.x,
                this.pageLayout.contentArea.y
            );
        }

        let currentY = 0;
        for (let i = 0; i < chunk.widgets.length; i++) {
            const widget = chunk.widgets[i];
            if (!widget) {
                widgetLogger.warn(
                    `MultiPage: Widget ${i} in chunk is undefined, skipping`
                );
                continue;
            }

            const widgetIndex = this.children.indexOf(widget);
            const widgetHeight =
                this.contentMeasurement?.widgetHeights[widgetIndex] ?? 0;

            // Translate to widget position
            if (graphics) {
                graphics.save();
                graphics.translate(0, currentY);
            }

            // Create paint context for this widget
            const widgetContext: Layout.PaintContext = {
                ...context,
                size: {
                    width: this.pageLayout.contentArea.width,
                    height: widgetHeight,
                },
            };

            // Paint the widget
            widget.paint(widgetContext);

            if (graphics) {
                graphics.restore();
            }

            currentY += widgetHeight;
        }

        if (graphics) {
            graphics.restore(); // Content area translation
            graphics.restore(); // Page graphics state
        }
    }

    /**
     * Paint header or footer widget
     * HEADER FIX: Properly layout widget before painting to ensure child widgets are positioned
     */
    private paintHeaderFooter(
        context: Layout.PaintContext,
        headerFooter:
            | Widget
            | ((pageNumber: number, totalPages: number) => Widget),
        area: Geometry.Rect,
        pageNumber: number,
        isHeader: boolean
    ): void {
        const { graphics } = context;

        // Resolve widget (function vs direct widget)
        const widget =
            typeof headerFooter === 'function'
                ? headerFooter(pageNumber, this.totalPages)
                : headerFooter;

        // HEADER FIX: Create layout constraints for the header/footer area
        const layoutConstraints: Layout.BoxConstraints = {
            minWidth: area.width,
            maxWidth: area.width,
            minHeight: 0,
            maxHeight: area.height,
        };

        // HEADER FIX: Create layout context and layout the widget
        const defaultTextMeasurement: Layout.LayoutContext['textMeasurement'] =
            {
                measureTextWidth: (text: string, fontSize: number) =>
                    text.length * fontSize * 0.6,
                wrapTextAccurate: (text: string, _maxWidth: number) => [text],
                truncateTextAccurate: (text: string, _maxWidth: number) => text,
                getFontMetrics: (fontSize: number) => ({
                    height: fontSize * 1.2,
                    baseline: fontSize * 0.8,
                    ascender: fontSize * 0.8,
                    descender: fontSize * 0.2,
                }),
                measureCharWidth: (char: string, fontSize: number) =>
                    fontSize * 0.6,
                measureTextWithWrapping: (
                    text: string,
                    _maxWidth: number,
                    options: { fontSize: number }
                ) => ({
                    width: text.length * options.fontSize * 0.6,
                    height: options.fontSize * 1.2,
                    baseline: options.fontSize * 0.8,
                    lineCount: 1,
                    actualLines: [text],
                }),
                getTextBounds: (
                    text: string,
                    _maxWidth: number,
                    options: { fontSize: number }
                ) => ({
                    width: text.length * options.fontSize * 0.6,
                    height: options.fontSize * 1.2,
                }),
                clearCache: () => {
                    /* no-op */
                },
                getCacheStats: () => ({
                    measurementCache: 0,
                    fontMetricsCache: 0,
                }),
            };

        const layoutContext: Layout.LayoutContext = {
            constraints: layoutConstraints,
            textDirection: TextDirection.LeftToRight,
            theme: context.theme || Theme.Utils.light(),
            textMeasurement: context.textMeasurement ?? defaultTextMeasurement,
        };

        try {
            // HEADER FIX: Layout the widget first to ensure child widgets are properly positioned
            const layoutResult = widget.layout(layoutContext);
            widgetLogger.debug(
                `        - ${isHeader ? 'Header' : 'Footer'} layout result: ${layoutResult.size.width}x${layoutResult.size.height}`
            );
        } catch (error) {
            widgetLogger.warn(
                `MultiPage: Failed to layout ${isHeader ? 'header' : 'footer'} during paint:`,
                error
            );
        }

        // Translate to header/footer area
        if (graphics) {
            graphics.save();
            graphics.translate(area.x, area.y);
        }

        // Create paint context
        const widgetContext: Layout.PaintContext = {
            ...context,
            size: { width: area.width, height: area.height },
        };

        // Paint the widget (now properly laid out)
        widget.paint(widgetContext);

        if (graphics) {
            graphics.restore();
        }
    }
}

/**
 * Helper functions for creating MultiPage widgets
 */
export const MultiPageUtils = {
    /**
     * Create a simple MultiPage widget with text header/footer
     */
    withSimpleHeaderFooter(
        children: Widget[],
        headerText?: string,
        footerText?: string
    ): MultiPage {
        let header:
            | ((pageNumber: number, totalPages: number) => Widget)
            | undefined;
        let footer: Widget | undefined;

        if (headerText) {
            header = (pageNum, totalPages) => {
                return new Txt(
                    headerText
                        .replace('{page}', String(pageNum))
                        .replace('{total}', String(totalPages))
                );
            };
        }

        if (footerText) {
            footer = new Txt(footerText);
        }

        const props: MultiPageProps = { children };
        if (header) {
            props.header = header;
        }
        if (footer) {
            props.footer = footer;
        }

        return new MultiPage(props);
    },

    /**
     * Create a MultiPage widget optimized for reports
     */
    forReport(
        children: Widget[],
        options: {
            title?: string;
            showPageNumbers?: boolean;
            margins?: Layout.EdgeInsets;
        } = {}
    ): MultiPage {
        const { title, showPageNumbers = true, margins } = options;

        let header:
            | ((pageNumber: number, totalPages: number) => Widget)
            | undefined;
        let footer:
            | ((pageNumber: number, totalPages: number) => Widget)
            | undefined;

        if (title ?? showPageNumbers) {
            header = (pageNum, totalPages) => {
                if (title && showPageNumbers) {
                    return new Container({
                        child: new Row({
                            mainAxisAlignment:
                                Flex.MainAxisAlignment.SpaceBetween,
                            children: [
                                new Txt(title),
                                new Txt(`Page ${pageNum} of ${totalPages}`),
                            ],
                        }),
                        padding: Layout.EdgeInsets.symmetric({ vertical: 8 }),
                    });
                } else if (title) {
                    return new Container({
                        child: new Txt(title),
                        padding: Layout.EdgeInsets.symmetric({ vertical: 8 }),
                    });
                }
                return new Container({
                    child: new Txt(`Page ${pageNum} of ${totalPages}`),
                    padding: Layout.EdgeInsets.symmetric({ vertical: 8 }),
                    alignment: Layout.Alignment.CenterRight,
                });
            };
        }

        const props: MultiPageProps = {
            children,
            pageBreakBehavior: PageBreakBehavior.Auto,
        };
        if (header) {
            props.header = header;
        }
        if (footer) {
            props.footer = footer;
        }
        if (margins) {
            props.pageMargins = margins;
        }

        return new MultiPage(props);
    },
};
