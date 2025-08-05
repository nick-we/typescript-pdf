/**
 * Theme System - Consolidated
 *
 * Consolidates theme functionality into a single focused module.
 * Replaces the theme parts from the original theme.ts.
 *
 * @packageDocumentation
 */

import type { Layout } from '@/types.js';
import { Theme as ThemeTypes } from '@/types.js';
import { BaseWidget, type Widget, type WidgetProps } from '@/widgets/base.js';

/**
 * Theme provider widget properties
 */
export interface ThemeProps extends WidgetProps {
    /** Child widget */
    child: Widget;
    /** Theme data to provide */
    data: ThemeTypes.ThemeData;
}

/**
 * Default text style widget properties
 */
export interface DefaultTextStyleProps extends WidgetProps {
    /** Child widget */
    child: Widget;
    /** Text style to provide as default */
    style: ThemeTypes.TextStyle;
}

/**
 * Theme provider widget that provides theme data to its descendants
 */
export class Theme extends BaseWidget {
    private readonly child: Widget;
    private readonly data: ThemeTypes.ThemeData;

    constructor(props: ThemeProps) {
        super(props);

        this.child = props.child;
        this.data = props.data;
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        // Create new context with our theme data
        const themedContext: Layout.LayoutContext = {
            ...context,
            theme: this.data,
        };

        return this.child.layout(themedContext);
    }

    paint(context: Layout.PaintContext): void {
        // Create new context with our theme data
        const themedContext: Layout.PaintContext = {
            ...context,
            theme: this.data,
        };

        this.child.paint(themedContext);
    }
}

/**
 * Default text style provider widget
 */
export class DefaultTextStyle extends BaseWidget {
    private readonly child: Widget;
    private readonly style: ThemeTypes.TextStyle;

    constructor(props: DefaultTextStyleProps) {
        super(props);

        this.child = props.child;
        this.style = props.style;
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        // Merge our text style with the current theme's default
        const mergedTextStyle = ThemeTypes.Utils.mergeTextStyles(
            context.theme.defaultTextStyle,
            this.style
        );

        // Create new theme with merged text style
        const newTheme: ThemeTypes.ThemeData = {
            ...context.theme,
            defaultTextStyle: mergedTextStyle,
        };

        const themedContext: Layout.LayoutContext = {
            ...context,
            theme: newTheme,
        };

        return this.child.layout(themedContext);
    }

    paint(context: Layout.PaintContext): void {
        // Merge our text style with the current theme's default
        const mergedTextStyle = ThemeTypes.Utils.mergeTextStyles(
            context.theme.defaultTextStyle,
            this.style
        );

        // Create new theme with merged text style
        const newTheme: ThemeTypes.ThemeData = {
            ...context.theme,
            defaultTextStyle: mergedTextStyle,
        };

        const themedContext: Layout.PaintContext = {
            ...context,
            theme: newTheme,
        };

        this.child.paint(themedContext);
    }
}

/**
 * Theme utilities - consolidated from various theme helpers
 */
export const ThemeUtils = {
    /**
     * Create a light theme
     */
    light(): ThemeTypes.ThemeData {
        return ThemeTypes.Utils.light();
    },

    /**
     * Create a professional theme
     */
    professional(): ThemeTypes.ThemeData {
        return ThemeTypes.Utils.professional();
    },

    /**
     * Create a custom theme
     */
    custom(colorScheme: ThemeTypes.ColorScheme): ThemeTypes.ThemeData {
        return ThemeTypes.Utils.createTheme(colorScheme);
    },

    /**
     * Merge text styles
     */
    mergeTextStyles(
        base: ThemeTypes.TextStyle,
        override?: ThemeTypes.TextStyle
    ): ThemeTypes.TextStyle {
        return ThemeTypes.Utils.mergeTextStyles(base, override);
    },

    /**
     * Create a text style
     */
    textStyle(options: Partial<ThemeTypes.TextStyle>): ThemeTypes.TextStyle {
        return {
            fontSize: 12,
            fontFamily: 'Helvetica',
            fontWeight: ThemeTypes.FontWeight.Normal,
            fontStyle: ThemeTypes.FontStyle.Normal,
            color: '#000000',
            ...options,
        };
    },

    /**
     * Create a color scheme
     */
    colorScheme(
        options: Partial<ThemeTypes.ColorScheme>
    ): ThemeTypes.ColorScheme {
        return {
            primary: '#1976d2',
            secondary: '#dc004e',
            background: '#ffffff',
            surface: '#f5f5f5',
            onBackground: '#000000',
            onSurface: '#000000',
            onPrimary: '#ffffff',
            onSecondary: '#ffffff',
            error: '#d32f2f',
            success: '#388e3c',
            warning: '#f57c00',
            info: '#1976d2',
            ...options,
        };
    },
};

/**
 * Common text styles - simplified from complex TextStyles
 */
export const TextStyles = {
    /** Display text (largest) */
    display: ThemeUtils.textStyle({
        fontSize: 32,
        fontWeight: ThemeTypes.FontWeight.Bold,
    }),

    /** Heading 1 */
    h1: ThemeUtils.textStyle({
        fontSize: 24,
        fontWeight: ThemeTypes.FontWeight.Bold,
    }),

    /** Heading 2 */
    h2: ThemeUtils.textStyle({
        fontSize: 20,
        fontWeight: ThemeTypes.FontWeight.Bold,
    }),

    /** Heading 3 */
    h3: ThemeUtils.textStyle({
        fontSize: 16,
        fontWeight: ThemeTypes.FontWeight.Bold,
    }),

    /** Body text (default) */
    body: ThemeUtils.textStyle({
        fontSize: 12,
        fontWeight: ThemeTypes.FontWeight.Normal,
    }),

    /** Caption text (smaller) */
    caption: ThemeUtils.textStyle({
        fontSize: 10,
        fontWeight: ThemeTypes.FontWeight.Normal,
        color: '#666666',
    }),

    /** Label text */
    label: ThemeUtils.textStyle({
        fontSize: 11,
        fontWeight: ThemeTypes.FontWeight.Normal,
    }),
};

/**
 * Common color schemes
 */
export const ColorSchemes = {
    /** Light theme colors */
    light: ThemeTypes.ColorSchemes.light,

    /** Professional theme colors */
    professional: ThemeTypes.ColorSchemes.professional,

    /** Create a monochrome color scheme */
    monochrome: (baseColor: string = '#333333'): ThemeTypes.ColorScheme => ({
        primary: baseColor,
        secondary: baseColor,
        background: '#ffffff',
        surface: '#f8f9fa',
        onBackground: baseColor,
        onSurface: baseColor,
        onPrimary: '#ffffff',
        onSecondary: '#ffffff',
        error: '#dc3545',
        success: '#28a745',
        warning: '#ffc107',
        info: '#17a2b8',
    }),

    /** Create a blue color scheme */
    blue: (): ThemeTypes.ColorScheme => ({
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#ffffff',
        surface: '#f8f9fa',
        onBackground: '#212529',
        onSurface: '#212529',
        onPrimary: '#ffffff',
        onSecondary: '#ffffff',
        error: '#dc3545',
        success: '#28a745',
        warning: '#ffc107',
        info: '#17a2b8',
    }),
};

/**
 * Convenience functions for creating theme widgets
 */
export function createTheme(props: ThemeProps): Theme {
    return new Theme(props);
}

export function createDefaultTextStyle(
    props: DefaultTextStyleProps
): DefaultTextStyle {
    return new DefaultTextStyle(props);
}

/**
 * Pre-built themes for common use cases
 */
export const PrebuiltThemes = {
    /** Clean, minimal light theme */
    minimal: (): ThemeTypes.ThemeData =>
        ThemeUtils.custom({
            primary: '#2c3e50',
            secondary: '#95a5a6',
            background: '#ffffff',
            surface: '#ffffff',
            onBackground: '#2c3e50',
            onSurface: '#2c3e50',
            onPrimary: '#ffffff',
            onSecondary: '#ffffff',
            error: '#e74c3c',
            success: '#27ae60',
            warning: '#f39c12',
            info: '#3498db',
        }),

    /** Corporate/business theme */
    corporate: (): ThemeTypes.ThemeData =>
        ThemeUtils.custom({
            primary: '#1f4e79',
            secondary: '#5b9bd5',
            background: '#ffffff',
            surface: '#f2f2f2',
            onBackground: '#1f4e79',
            onSurface: '#1f4e79',
            onPrimary: '#ffffff',
            onSecondary: '#ffffff',
            error: '#c5504b',
            success: '#70ad47',
            warning: '#ffc000',
            info: '#5b9bd5',
        }),

    /** Modern, vibrant theme */
    modern: (): ThemeTypes.ThemeData =>
        ThemeUtils.custom({
            primary: '#6c5ce7',
            secondary: '#fd79a8',
            background: '#ffffff',
            surface: '#f8f9fa',
            onBackground: '#2d3436',
            onSurface: '#2d3436',
            onPrimary: '#ffffff',
            onSecondary: '#ffffff',
            error: '#e17055',
            success: '#00b894',
            warning: '#fdcb6e',
            info: '#74b9ff',
        }),
};
