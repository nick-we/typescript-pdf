/**
 * typescript-pdf - A modern TypeScript library for programmatic PDF generation
 *
 * This is the main entry point for the typescript-pdf library.
 * It exports all public APIs and types for PDF generation.
 *
 * @packageDocumentation
 */

// Core exports - Consolidated System
export {
    // Document and Page Management
    Document,
    Page,
    DocumentFactory,
    PageFactory,
    PAGE_FORMATS,
    TextDirection,

    // Font System
    FontSystem,
    FontWeight,
    FontStyle,
    FontCategory,
    FontUtils,
    FontCollections,

    // Text Processing (from core)
    TextProcessor,

    // PDF Engine
    PdfStandardFont,
    PdfFont,
    FontRegistry,
} from '@/core/index.js';

// Widget exports - Consolidated System
export {
    // Base widgets
    BaseWidget,
    EmptyWidget,
    WidgetUtils,
    WidgetLayoutUtils,
    PageDefaults,

    // Text widgets (note: TextAlign, TextOverflow, TextUtils from widgets take precedence)
    TextWidget,
    RichText,
    TextAlign,
    TextOverflow,
    TextUtils,
    TextStyles,
    createText,
    createRichText,

    // Layout widgets
    Container,
    Stack,
    Positioned,
    StackFit,
    LayoutUtils,
    BorderRadiusUtils,
    DecorationStyles,
    createContainer,
    createStack,
    createPositioned,

    // Flex widgets
    Row,
    Column,
    Flex,
    Flexible,
    Expanded,
    FlexUtils,
    createRow,
    createColumn,
    createFlexible,
    createExpanded,

    // Data widgets
    Table,
    TableRow,
    Chart,
    BarChart,
    LineChart,
    TableColumnWidthType,
    TableCellVerticalAlignment,
    ChartType,
    BarOrientation,
    LineMarker,
    DataUtils,
    createTable,
    createTableRow,
    createChart,
    createBarChart,
    createLineChart,

    // MultiPage widgets
    MultiPage,
    PageBreakBehavior,
    MultiPageUtils,

    // Theme system - renamed to avoid conflict with namespace
    Theme as ThemeWidget,
    DefaultTextStyle,
    ThemeUtils,
    ThemeTextStyles,
    ColorSchemes,
    PrebuiltThemes,
    createTheme,
    createDefaultTextStyle,
} from '@/widgets/index.js';

// Widget type exports - Consolidated System
export type {
    // Widget types
    Widget,
    WidgetProps,
    TextProps,
    RichTextProps,
    TextSpan,
    ContainerProps,
    StackProps,
    PositionedProps,
    BoxDecoration,
    Border,
    BorderRadius,
    BoxShadow,
    FlexProps,
    FlexChild,
    TableProps,
    TableRowProps,
    ChartProps,
    BarChartProps,
    LineChartProps,
    TableColumnWidth,
    ChartDataPoint,
    ChartDataSeries,
    MultiPageProps,
    ContentMeasurement,
    PageLayout,
    ContentChunk,
    ThemeProps,
    DefaultTextStyleProps,
} from '@/widgets/index.js';

// Core type exports - Consolidated System
export type {
    // Core namespace types
    Core,
    Geometry,
    Internal,
    Flex as FlexNamespace,
} from '@/types.js';

// Convenience exports for common usage patterns
import { Layout as LayoutTypes, Theme as ThemeTypes } from '@/types.js';

// Export Layout namespace for Layout.EdgeInsets usage
export const Layout = LayoutTypes;

// Export EdgeInsets directly for convenience
export const EdgeInsets = LayoutTypes.EdgeInsets;

// Export Theme namespace for Theme.FontWeight usage
export const Theme = ThemeTypes;

// Version information
export const VERSION = '__VERSION__';
export const DEV = '__DEV__';
