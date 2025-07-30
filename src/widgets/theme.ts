/**
 * Theme widget and context system for cascading styles
 * 
 * Implements theme inheritance and context propagation throughout
 * the widget tree, following composition-over-inheritance principles.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';
import type {
    ThemeData,
    TextStyle,
    ColorScheme,
    SpacingSystem,
    TypographyScale,
} from '../types/theming.js';
import {
    TextStyleUtils,
    ThemeUtils,
    defaultTheme,
} from '../types/theming.js';

/**
 * Theme context for providing theme data to child widgets
 */
export interface ThemeContext {
    /** Current theme data */
    readonly theme: ThemeData;
    /** Current text style (inherited from ancestors) */
    readonly textStyle: TextStyle;
    /** Depth of theme nesting (for debugging) */
    readonly depth: number;
}

/**
 * Theme widget properties
 */
export interface ThemeProps extends WidgetProps {
    /** Theme data to provide to children */
    data: ThemeData;
    /** Child widget to apply theme to */
    child: Widget;
}

/**
 * Theme widget that provides theme data to its descendants
 */
export class Theme extends BaseWidget {
    private readonly themeData: ThemeData;
    private readonly child: Widget;

    constructor(props: ThemeProps) {
        super(props);
        this.themeData = props.data;
        this.child = props.child;
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Create new layout context with our theme
        const themedContext: LayoutContext = {
            ...context,
            theme: this.themeData,
        };

        // Layout child with the new theme context
        return this.child.layout(themedContext);
    }

    paint(context: PaintContext): void {
        // Create new paint context with our theme
        const themedContext: PaintContext = {
            ...context,
            theme: this.themeData,
        };

        // Paint child with the new theme context
        this.child.paint(themedContext);
    }

    /**
     * Get theme data from the current context
     * Static helper for widgets to access theme
     */
    static of(context: LayoutContext | PaintContext): ThemeData {
        return context.theme;
    }
}

/**
 * Default text style widget properties
 */
export interface DefaultTextStyleProps extends WidgetProps {
    /** Text style to apply as default */
    style: TextStyle;
    /** Child widget */
    child: Widget;
    /** Whether to merge with existing style or replace */
    merge?: boolean;
}

/**
 * Default text style widget that sets the default text style for descendants
 */
export class DefaultTextStyle extends BaseWidget {
    private readonly style: TextStyle;
    private readonly child: Widget;
    private readonly merge: boolean;

    constructor(props: DefaultTextStyleProps) {
        super(props);
        this.style = props.style;
        this.child = props.child;
        this.merge = props.merge ?? true;
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Create new theme with updated default text style
        const newDefaultStyle = this.merge
            ? TextStyleUtils.merge(context.theme.defaultTextStyle, this.style)
            : this.style;

        const newTheme = ThemeUtils.copyWith(context.theme, {
            defaultTextStyle: newDefaultStyle,
        });

        const themedContext: LayoutContext = {
            ...context,
            theme: newTheme,
        };

        return this.child.layout(themedContext);
    }

    paint(context: PaintContext): void {
        // Create new theme with updated default text style
        const newDefaultStyle = this.merge
            ? TextStyleUtils.merge(context.theme.defaultTextStyle, this.style)
            : this.style;

        const newTheme = ThemeUtils.copyWith(context.theme, {
            defaultTextStyle: newDefaultStyle,
        });

        const themedContext: PaintContext = {
            ...context,
            theme: newTheme,
        };

        this.child.paint(themedContext);
    }

    /**
     * Create a DefaultTextStyle that merges with existing styles
     */
    static merge(props: Omit<DefaultTextStyleProps, 'merge'>): DefaultTextStyle {
        return new DefaultTextStyle({ ...props, merge: true });
    }

    /**
     * Create a DefaultTextStyle that replaces existing styles
     */
    static replace(props: Omit<DefaultTextStyleProps, 'merge'>): DefaultTextStyle {
        return new DefaultTextStyle({ ...props, merge: false });
    }
}

/**
 * Themed widget properties for widgets that respond to theme changes
 */
export interface ThemedWidgetProps extends WidgetProps {
    /** Builder function that receives theme and returns widget */
    builder: (theme: ThemeData) => Widget;
}

/**
 * Themed widget that rebuilds based on current theme
 */
export class ThemedWidget extends BaseWidget {
    private readonly builder: (theme: ThemeData) => Widget;
    private cachedWidget?: Widget;
    private cachedTheme?: ThemeData;

    constructor(props: ThemedWidgetProps) {
        super(props);
        this.builder = props.builder;
    }

    private getWidget(theme: ThemeData): Widget {
        // Simple caching - rebuild only if theme changes
        if (!this.cachedWidget || this.cachedTheme !== theme) {
            this.cachedWidget = this.builder(theme);
            this.cachedTheme = theme;
        }
        return this.cachedWidget;
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);
        const widget = this.getWidget(context.theme);
        return widget.layout(context);
    }

    paint(context: PaintContext): void {
        const widget = this.getWidget(context.theme);
        widget.paint(context);
    }
}

/**
 * Consumer widget that provides access to specific theme properties
 */
export interface ThemeConsumerProps<T> extends WidgetProps {
    /** Selector function to extract data from theme */
    selector: (theme: ThemeData) => T;
    /** Builder function that receives selected data */
    builder: (data: T) => Widget;
}

/**
 * Theme consumer widget for efficient theme-dependent rendering
 */
export class ThemeConsumer<T> extends BaseWidget {
    private readonly selector: (theme: ThemeData) => T;
    private readonly builder: (data: T) => Widget;
    private cachedWidget?: Widget;
    private cachedData?: T;

    constructor(props: ThemeConsumerProps<T>) {
        super(props);
        this.selector = props.selector;
        this.builder = props.builder;
    }

    private getWidget(theme: ThemeData): Widget {
        const data = this.selector(theme);

        // Rebuild only if selected data changes
        if (!this.cachedWidget || this.cachedData !== data) {
            this.cachedWidget = this.builder(data);
            this.cachedData = data;
        }

        return this.cachedWidget;
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);
        const widget = this.getWidget(context.theme);
        return widget.layout(context);
    }

    paint(context: PaintContext): void {
        const widget = this.getWidget(context.theme);
        widget.paint(context);
    }
}

/**
 * Theme helper functions for creating themed widgets
 */
export const ThemeHelpers = {
    /**
     * Create a widget that responds to color scheme changes
     */
    withColorScheme(builder: (colors: ColorScheme) => Widget): ThemeConsumer<ColorScheme> {
        return new ThemeConsumer({
            selector: (theme) => theme.colorScheme,
            builder,
        });
    },

    /**
     * Create a widget that responds to spacing changes
     */
    withSpacing(builder: (spacing: SpacingSystem) => Widget): ThemeConsumer<SpacingSystem> {
        return new ThemeConsumer({
            selector: (theme) => theme.spacing,
            builder,
        });
    },

    /**
     * Create a widget that responds to typography changes
     */
    withTypography(builder: (typography: TypographyScale) => Widget): ThemeConsumer<TypographyScale> {
        return new ThemeConsumer({
            selector: (theme) => theme.typography,
            builder,
        });
    },

    /**
     * Create a widget that uses a specific typography style
     */
    withTextStyle(
        styleKey: keyof TypographyScale,
        builder: (style: TextStyle) => Widget
    ): ThemeConsumer<TextStyle> {
        return new ThemeConsumer({
            selector: (theme) => theme.typography[styleKey],
            builder,
        });
    },

    /**
     * Create a widget that responds to theme changes with custom selector
     */
    withThemeData<T>(
        selector: (theme: ThemeData) => T,
        builder: (data: T) => Widget
    ): ThemeConsumer<T> {
        return new ThemeConsumer({ selector, builder });
    },

    /**
     * Wrap a widget with a specific theme
     */
    wrap(theme: ThemeData, child: Widget): Theme {
        return new Theme({ data: theme, child });
    },

    /**
     * Create a light-themed wrapper
     */
    light(child: Widget): Theme {
        return ThemeHelpers.wrap(ThemeUtils.light(), child);
    },

    /**
     * Create a dark-themed wrapper
     */
    dark(child: Widget): Theme {
        return ThemeHelpers.wrap(ThemeUtils.dark(), child);
    },

    /**
     * Create a professional-themed wrapper
     */
    professional(child: Widget): Theme {
        return ThemeHelpers.wrap(ThemeUtils.professional(), child);
    },

    /**
     * Apply a text style override
     */
    withTextStyleOverride(style: TextStyle, child: Widget): DefaultTextStyle {
        return new DefaultTextStyle({ style, child, merge: true });
    },

    /**
     * Replace the default text style
     */
    withTextStyleReplacement(style: TextStyle, child: Widget): DefaultTextStyle {
        return new DefaultTextStyle({ style, child, merge: false });
    },
};

/**
 * Convenience functions for creating themed widgets
 */
export const createTheme = (data: ThemeData, child: Widget): Theme =>
    new Theme({ data, child });

export const createThemedWidget = (builder: (theme: ThemeData) => Widget): ThemedWidget =>
    new ThemedWidget({ builder });

export const createDefaultTextStyle = (style: TextStyle, child: Widget): DefaultTextStyle =>
    new DefaultTextStyle({ style, child });