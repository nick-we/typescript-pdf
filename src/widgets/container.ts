/**
 * Container widget implementation
 * 
 * A versatile container widget that can hold a child widget with
 * padding, margins, decorations, and alignment options.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import { Matrix4 } from '../core/pdf/graphics.js';
import { PdfColor } from '../core/pdf/color.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
    EdgeInsets,
    BoxConstraints,
} from '../types/layout.js';
import { EdgeInsets as EdgeInsetsUtils, AlignmentUtils, Alignment } from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import { PaintPhase, BoxDecorationUtils } from '../types/theming.js';

/**
 * Border style options
 */
export enum BorderStyle {
    None = 'none',
    Solid = 'solid',
    Dashed = 'dashed',
    Dotted = 'dotted',
}

/**
 * Border radius configuration
 */
export interface BorderRadius {
    /** Top-left corner radius */
    topLeft?: number;
    /** Top-right corner radius */
    topRight?: number;
    /** Bottom-left corner radius */
    bottomLeft?: number;
    /** Bottom-right corner radius */
    bottomRight?: number;
}

/**
 * Border configuration
 */
export interface Border {
    /** Border width */
    width?: number;
    /** Border color */
    color?: PdfColor;
    /** Border style */
    style?: BorderStyle;
}

/**
 * Box shadow configuration
 */
export interface BoxShadow {
    /** Horizontal offset */
    offsetX: number;
    /** Vertical offset */
    offsetY: number;
    /** Blur radius */
    blurRadius?: number;
    /** Spread radius */
    spreadRadius?: number;
    /** Shadow color */
    color?: PdfColor;
}

/**
 * Box decoration configuration
 */
export interface BoxDecoration {
    /** Background color */
    color?: PdfColor;
    /** Border configuration */
    border?: Border;
    /** Border radius */
    borderRadius?: BorderRadius;
    /** Box shadows */
    boxShadow?: BoxShadow[];
}

/**
 * Container widget properties
 */
export interface ContainerProps extends WidgetProps {
    /** Child widget to contain */
    child?: Widget;
    /** Padding inside the container */
    padding?: EdgeInsets;
    /** Margin outside the container */
    margin?: EdgeInsets;
    /** Fixed width */
    width?: number;
    /** Fixed height */
    height?: number;
    /** Minimum width */
    minWidth?: number;
    /** Minimum height */
    minHeight?: number;
    /** Maximum width */
    maxWidth?: number;
    /** Maximum height */
    maxHeight?: number;
    /** Child alignment within the container */
    alignment?: Alignment;
    /** Box decoration */
    decoration?: BoxDecoration;
}

/**
 * Border radius helper functions
 */
export const BorderRadiusUtils = {
    /**
     * Create uniform border radius
     */
    all(radius: number): BorderRadius {
        return {
            topLeft: radius,
            topRight: radius,
            bottomLeft: radius,
            bottomRight: radius,
        };
    },

    /**
     * Create circular border radius
     */
    circular(radius: number): BorderRadius {
        return BorderRadiusUtils.all(radius);
    },

    /**
     * Create border radius for specific corners
     */
    only(options: {
        topLeft?: number;
        topRight?: number;
        bottomLeft?: number;
        bottomRight?: number;
    }): BorderRadius {
        return {
            topLeft: options.topLeft ?? 0,
            topRight: options.topRight ?? 0,
            bottomLeft: options.bottomLeft ?? 0,
            bottomRight: options.bottomRight ?? 0,
        };
    },
};

/**
 * Container widget that provides padding, margins, and decorations
 */
export class Container extends BaseWidget {
    private readonly child?: Widget;
    private readonly padding: EdgeInsets;
    private readonly margin: EdgeInsets;
    private readonly width?: number;
    private readonly height?: number;
    private readonly minWidth?: number;
    private readonly minHeight?: number;
    private readonly maxWidth?: number;
    private readonly maxHeight?: number;
    private readonly alignment: Alignment;
    private readonly decoration?: BoxDecoration;
    private childLayoutResult?: LayoutResult;

    constructor(props: ContainerProps = {}) {
        super(props);

        if (props.child) this.child = props.child;
        this.padding = props.padding ?? EdgeInsetsUtils.zero;
        this.margin = props.margin ?? EdgeInsetsUtils.zero;
        if (props.width) this.width = props.width;
        if (props.height) this.height = props.height;
        if (props.minWidth) this.minWidth = props.minWidth;
        if (props.minHeight) this.minHeight = props.minHeight;
        if (props.maxWidth) this.maxWidth = props.maxWidth;
        if (props.maxHeight) this.maxHeight = props.maxHeight;
        this.alignment = props.alignment ?? Alignment.Center;
        if (props.decoration) this.decoration = this.normalizeBoxDecoration(props.decoration);
    }

    /**
     * Normalize BoxDecoration to ensure complete properties for macOS compatibility
     */
    private normalizeBoxDecoration(inputDecoration?: BoxDecoration): BoxDecoration {
        if (!inputDecoration) {
            return {};
        }

        const result: BoxDecoration = { ...inputDecoration };

        // Ensure border is complete if provided
        if (result.border) {
            const border = result.border;
            result.border = {
                width: border.width ?? 1,
                color: border.color ?? PdfColor.black,
                style: border.style ?? BorderStyle.Solid,
            };
        }

        // Ensure borderRadius is complete if provided
        if (result.borderRadius) {
            const radius = result.borderRadius;
            result.borderRadius = {
                topLeft: radius.topLeft ?? 0,
                topRight: radius.topRight ?? 0,
                bottomLeft: radius.bottomLeft ?? 0,
                bottomRight: radius.bottomRight ?? 0,
            };
        }

        // BoxShadow arrays should be complete if provided
        if (result.boxShadow) {
            result.boxShadow = result.boxShadow.map(shadow => ({
                offsetX: shadow.offsetX,
                offsetY: shadow.offsetY,
                blurRadius: shadow.blurRadius ?? 0,
                spreadRadius: shadow.spreadRadius ?? 0,
                color: shadow.color ?? PdfColor.black,
            }));
        }

        return result;
    }

    /**
     * Apply container size constraints
     */
    private applyContainerConstraints(constraints: BoxConstraints): BoxConstraints {
        let minWidth = constraints.minWidth;
        let maxWidth = constraints.maxWidth;
        let minHeight = constraints.minHeight;
        let maxHeight = constraints.maxHeight;

        // Apply explicit size constraints
        if (this.width !== undefined) {
            minWidth = maxWidth = this.width;
        } else {
            if (this.minWidth !== undefined) {
                minWidth = Math.max(minWidth, this.minWidth);
            }
            if (this.maxWidth !== undefined) {
                maxWidth = Math.min(maxWidth, this.maxWidth);
            }
        }

        if (this.height !== undefined) {
            minHeight = maxHeight = this.height;
        } else {
            if (this.minHeight !== undefined) {
                minHeight = Math.max(minHeight, this.minHeight);
            }
            if (this.maxHeight !== undefined) {
                maxHeight = Math.min(maxHeight, this.maxHeight);
            }
        }

        return {
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
        };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Apply margin to available space
        const availableConstraints = EdgeInsetsUtils.deflateConstraints(
            this.margin,
            context.constraints
        );

        // Apply container-specific size constraints
        const containerConstraints = this.applyContainerConstraints(availableConstraints);

        let childSize: Size = { width: 0, height: 0 };
        let childBaseline: number | undefined;

        if (this.child) {
            // Apply padding to constraints for child
            let childConstraints = EdgeInsetsUtils.deflateConstraints(
                this.padding,
                containerConstraints
            );

            // If this container has explicit dimensions, give the child looser constraints
            // so it can size itself according to its own explicit dimensions
            if (this.width !== undefined || this.height !== undefined) {
                const availableWidth = (this.width ?? containerConstraints.maxWidth) - EdgeInsetsUtils.horizontal(this.padding);
                const availableHeight = (this.height ?? containerConstraints.maxHeight) - EdgeInsetsUtils.vertical(this.padding);

                childConstraints = {
                    minWidth: 0,
                    maxWidth: Math.max(0, availableWidth),
                    minHeight: 0,
                    maxHeight: Math.max(0, availableHeight),
                };
            }

            const childContext: LayoutContext = {
                ...context,
                constraints: childConstraints,
            };

            this.childLayoutResult = this.child.layout(childContext);
            childSize = this.childLayoutResult.size;
            childBaseline = this.childLayoutResult.baseline;
        }

        // Calculate container size including padding
        const containerSize: Size = {
            width: childSize.width + EdgeInsetsUtils.horizontal(this.padding),
            height: childSize.height + EdgeInsetsUtils.vertical(this.padding),
        };

        // Apply container constraints to final size
        // BUT: if we have explicit width/height, use those instead of child-driven size
        let constrainedSize: Size = {
            width: Math.max(
                containerConstraints.minWidth,
                Math.min(containerConstraints.maxWidth, containerSize.width)
            ),
            height: Math.max(
                containerConstraints.minHeight,
                Math.min(containerConstraints.maxHeight, containerSize.height)
            ),
        };

        // If we have explicit dimensions, ensure they're respected
        if (this.width !== undefined) {
            constrainedSize.width = this.width;
        }
        if (this.height !== undefined) {
            constrainedSize.height = this.height;
        }

        // Add margin to final size
        const finalSize: Size = {
            width: constrainedSize.width + EdgeInsetsUtils.horizontal(this.margin),
            height: constrainedSize.height + EdgeInsetsUtils.vertical(this.margin),
        };

        // Constrain to parent's constraints
        const result = this.constrainSize(context.constraints, finalSize);

        const layoutOptions: { needsRepaint: boolean; baseline?: number } = {
            needsRepaint: true,
        };

        if (childBaseline !== undefined) {
            layoutOptions.baseline = childBaseline + this.padding.top + this.margin.top;
        }

        return this.createLayoutResult(result, layoutOptions);
    }

    paint(context: PaintContext): void {
        const { graphics, size } = context;

        // Calculate content area (excluding margin)
        const contentArea: Size = {
            width: size.width - EdgeInsetsUtils.horizontal(this.margin),
            height: size.height - EdgeInsetsUtils.vertical(this.margin),
        };

        // Translate graphics context by margin offset
        graphics.saveContext();
        const transformMatrix = new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            this.margin.left, this.margin.top, 0, 1
        ]);
        graphics.setTransform(transformMatrix);

        // CRITICAL: Use dart-pdf-style paint phase separation for macOS compatibility
        const rect = { x: 0, y: 0, width: contentArea.width, height: contentArea.height };

        // Phase 1: Background (colors, gradients, shadows)
        if (this.decoration) {
            BoxDecorationUtils.paint(this.decoration, context, rect, PaintPhase.Background);
        }

        // Paint child content between background and foreground phases
        if (this.child && this.childLayoutResult) {
            // Calculate child area (excluding padding)
            const childArea: Size = {
                width: contentArea.width - EdgeInsetsUtils.horizontal(this.padding),
                height: contentArea.height - EdgeInsetsUtils.vertical(this.padding),
            };

            // Use the actual child size from layout result
            const childSize: Size = this.childLayoutResult.size;

            // Calculate child position based on alignment
            const childPosition = AlignmentUtils.resolve(
                this.alignment,
                childArea,
                childSize
            );

            // Translate to child position (including padding)
            graphics.saveContext();
            const childTransform = new Matrix4([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                this.padding.left + childPosition.x,
                this.padding.top + childPosition.y,
                0, 1
            ]);
            graphics.setTransform(childTransform);

            // Paint child
            const childContext: PaintContext = {
                ...context,
                size: childSize,
            };

            this.child.paint(childContext);

            graphics.restoreContext();
        }

        // Phase 2: Foreground (borders, decorations)
        if (this.decoration) {
            BoxDecorationUtils.paint(this.decoration, context, rect, PaintPhase.Foreground);
        }

        graphics.restoreContext();
    }
}

/**
 * Convenience function to create a Container widget
 */
export function createContainer(props: ContainerProps = {}): Container {
    return new Container(props);
}

/**
 * Common container decoration presets
 */
export const ContainerDecorations = {
    /** Card-like decoration with subtle shadow */
    card: {
        color: PdfColor.white,
        borderRadius: BorderRadiusUtils.all(8),
        boxShadow: [
            {
                offsetX: 0,
                offsetY: 2,
                blurRadius: 4,
                color: PdfColor.fromHex('#00000020'),
            },
        ],
    },

    /** Outlined container */
    outlined: {
        border: {
            width: 1,
            color: PdfColor.fromHex('#e0e0e0'),
            style: BorderStyle.Solid,
        },
        borderRadius: BorderRadiusUtils.all(4),
    },

    /** Elevated container with shadow */
    elevated: {
        color: PdfColor.white,
        borderRadius: BorderRadiusUtils.all(4),
        boxShadow: [
            {
                offsetX: 0,
                offsetY: 4,
                blurRadius: 8,
                color: PdfColor.fromHex('#00000030'),
            },
        ],
    },
} satisfies Record<string, BoxDecoration>;