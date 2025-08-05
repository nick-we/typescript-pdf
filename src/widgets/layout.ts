/**
 * Layout Widget System - Consolidated
 *
 * Consolidates all layout widgets into a single focused module.
 * Replaces: container.ts + padding.ts + margin.ts + align.ts + center.ts + positioned.ts + stack.ts
 *
 * Key insight: Most layout widgets are just Container with specific configurations.
 *
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './base.js';

import { widgetLogger } from '@/core/logger.js';
import type { IPdfColor } from '@/types/core-interfaces.js';
import { type Geometry, Layout } from '@/types.js';

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
 * Stack fit options
 */
export enum StackFit {
    /** Stack sizes itself to contain its children */
    Loose = 'loose',
    /** Stack expands to fill available space */
    Expand = 'expand',
    /** Stack sizes itself to its constraints */
    PassThrough = 'passthrough',
}

/**
 * Border radius configuration
 */
export interface BorderRadius {
    readonly topLeft?: number;
    readonly topRight?: number;
    readonly bottomLeft?: number;
    readonly bottomRight?: number;
}

/**
 * Border configuration
 */
export interface Border {
    readonly width?: number;
    readonly color?: string;
    readonly style?: BorderStyle;
}

/**
 * Box shadow configuration
 */
export interface BoxShadow {
    readonly offsetX: number;
    readonly offsetY: number;
    readonly blurRadius?: number;
    readonly spreadRadius?: number;
    readonly color?: string;
}

/**
 * Box decoration configuration
 */
export interface BoxDecoration {
    readonly color?: string;
    readonly border?: Border;
    readonly borderRadius?: BorderRadius;
    readonly boxShadow?: BoxShadow[];
}

/**
 * Container widget properties - the primary layout widget
 */
export interface ContainerProps extends WidgetProps {
    /** Child widget to contain */
    child?: Widget;
    /** Padding inside the container */
    padding?: Layout.EdgeInsets;
    /** Margin outside the container */
    margin?: Layout.EdgeInsets;
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
    alignment?: Layout.Alignment;
    /** Box decoration */
    decoration?: BoxDecoration;
}

/**
 * Stack widget properties
 */
export interface StackProps extends WidgetProps {
    /** List of child widgets */
    children: Widget[];
    /** How the stack should size itself */
    fit?: StackFit;
    /** Alignment for positioned children */
    alignment?: Layout.Alignment;
    /** Whether to clip overflowing children */
    clipBehavior?: 'antiAlias' | 'hardEdge' | 'none';
}

/**
 * Positioned widget properties (for use within Stack)
 */
export interface PositionedProps extends WidgetProps {
    /** Child widget */
    child: Widget;
    /** Position from top */
    top?: number;
    /** Position from right */
    right?: number;
    /** Position from bottom */
    bottom?: number;
    /** Position from left */
    left?: number;
    /** Fixed width */
    width?: number;
    /** Fixed height */
    height?: number;
}

/**
 * Container widget - the primary layout widget with all capabilities
 *
 * This replaces the need for separate Padding, Margin, Align, and Center widgets
 */
export class Container extends BaseWidget {
    private readonly child?: Widget;
    private readonly padding: Layout.EdgeInsets;
    private readonly margin: Layout.EdgeInsets;
    private readonly width?: number;
    private readonly height?: number;
    private readonly minWidth?: number;
    private readonly minHeight?: number;
    private readonly maxWidth?: number;
    private readonly maxHeight?: number;
    private readonly alignment: Layout.Alignment;
    private readonly decoration?: BoxDecoration;
    private childLayoutResult?: Layout.LayoutResult;

    constructor(props: ContainerProps = {}) {
        super(props);

        if (props.child) {
            this.child = props.child;
        }
        this.padding = props.padding ?? Layout.EdgeInsets.zero;
        this.margin = props.margin ?? Layout.EdgeInsets.zero;
        if (props.width !== undefined) {
            this.width = props.width;
        }
        if (props.height !== undefined) {
            this.height = props.height;
        }
        if (props.minWidth !== undefined) {
            this.minWidth = props.minWidth;
        }
        if (props.minHeight !== undefined) {
            this.minHeight = props.minHeight;
        }
        if (props.maxWidth !== undefined) {
            this.maxWidth = props.maxWidth;
        }
        if (props.maxHeight !== undefined) {
            this.maxHeight = props.maxHeight;
        }
        this.alignment = props.alignment ?? Layout.Alignment.Center;
        if (props.decoration) {
            this.decoration = props.decoration;
        }
    }

    /**
     * Apply container size constraints
     */
    private applyContainerConstraints(
        constraints: Layout.BoxConstraints
    ): Layout.BoxConstraints {
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

        return { minWidth, maxWidth, minHeight, maxHeight };
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        // Apply margin to available space
        const availableConstraints = Layout.EdgeInsets.deflateConstraints(
            this.margin,
            context.constraints
        );

        // Apply container-specific size constraints
        const containerConstraints =
            this.applyContainerConstraints(availableConstraints);

        let childSize: Geometry.Size = { width: 0, height: 0 };
        let childBaseline: number | undefined;

        if (this.child) {
            // For children, give loose constraints so they can size to content
            // Container will position them via alignment, not force them to fill space
            let childConstraints = Layout.EdgeInsets.deflateConstraints(
                this.padding,
                availableConstraints // Use original available constraints instead of tight containerConstraints
            );

            // If container has explicit dimensions, child should have loose constraints within that space
            if (this.width !== undefined) {
                const availableWidth =
                    this.width - Layout.EdgeInsets.horizontal(this.padding);
                childConstraints = {
                    ...childConstraints,
                    minWidth: 0,
                    maxWidth: Math.max(0, availableWidth),
                };
            }

            if (this.height !== undefined) {
                const availableHeight =
                    this.height - Layout.EdgeInsets.vertical(this.padding);
                childConstraints = {
                    ...childConstraints,
                    minHeight: 0,
                    maxHeight: Math.max(0, availableHeight),
                };
            }

            const childContext: Layout.LayoutContext = {
                ...context,
                constraints: childConstraints,
            };

            this.childLayoutResult = this.child.layout(childContext);
            childSize = this.childLayoutResult.size;
            childBaseline = this.childLayoutResult.baseline;
        }

        // Calculate container size including padding
        const containerSize: Geometry.Size = {
            width: childSize.width + Layout.EdgeInsets.horizontal(this.padding),
            height: childSize.height + Layout.EdgeInsets.vertical(this.padding),
        };

        // Apply container constraints to final size
        let constrainedSize: Geometry.Size = {
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
            constrainedSize = { ...constrainedSize, width: this.width };
        }
        if (this.height !== undefined) {
            constrainedSize = { ...constrainedSize, height: this.height };
        }

        // Add margin to final size
        const finalSize: Geometry.Size = {
            width:
                constrainedSize.width +
                Layout.EdgeInsets.horizontal(this.margin),
            height:
                constrainedSize.height +
                Layout.EdgeInsets.vertical(this.margin),
        };

        // Constrain to parent's constraints
        const result = this.constrainSize(context.constraints, finalSize);

        const layoutOptions: { needsRepaint: boolean; baseline?: number } = {
            needsRepaint: true,
        };

        if (childBaseline !== undefined) {
            layoutOptions.baseline =
                childBaseline + this.padding.top + this.margin.top;
        }

        return this.createLayoutResult(result, layoutOptions);
    }

    paint(context: Layout.PaintContext): void {
        const { size, graphics } = context;

        // Calculate content area (excluding margin)
        const contentArea: Geometry.Size = {
            width: size.width - Layout.EdgeInsets.horizontal(this.margin),
            height: size.height - Layout.EdgeInsets.vertical(this.margin),
        };

        // Only do actual graphics operations if graphics context is available
        if (graphics) {
            // Save graphics state
            graphics.save();

            // Translate to account for margin
            graphics.translate(this.margin.left, this.margin.top);

            // Paint decoration background if present
            if (this.decoration) {
                const hasRadius =
                    this.decoration.borderRadius &&
                    (this.decoration.borderRadius.topLeft ??
                        this.decoration.borderRadius.topRight ??
                        this.decoration.borderRadius.bottomLeft ??
                        this.decoration.borderRadius.bottomRight);

                // Draw background color
                if (this.decoration.color) {
                    const color = this.parseColor(this.decoration.color);
                    graphics.setFillColor(color);

                    if (hasRadius && this.decoration.borderRadius) {
                        graphics.drawRoundedRect(
                            0,
                            0,
                            contentArea.width,
                            contentArea.height,
                            this.decoration.borderRadius.topLeft ?? 0,
                            this.decoration.borderRadius.topRight ?? 0,
                            this.decoration.borderRadius.bottomRight ?? 0,
                            this.decoration.borderRadius.bottomLeft ?? 0
                        );
                    } else {
                        graphics.drawRect(
                            0,
                            0,
                            contentArea.width,
                            contentArea.height
                        );
                    }
                    graphics.fillPath();
                }

                // Draw border
                if (this.decoration.border) {
                    const color = this.parseColor(
                        this.decoration.border.color ?? '#000000'
                    );
                    graphics.setStrokeColor(color);
                    graphics.setLineWidth(this.decoration.border.width ?? 1);

                    if (hasRadius && this.decoration.borderRadius) {
                        graphics.drawRoundedRect(
                            0,
                            0,
                            contentArea.width,
                            contentArea.height,
                            this.decoration.borderRadius.topLeft ?? 0,
                            this.decoration.borderRadius.topRight ?? 0,
                            this.decoration.borderRadius.bottomRight ?? 0,
                            this.decoration.borderRadius.bottomLeft ?? 0
                        );
                    } else {
                        graphics.drawRect(
                            0,
                            0,
                            contentArea.width,
                            contentArea.height
                        );
                    }
                    graphics.strokePath();
                }
            }
        } else {
            // Fallback for testing - just log decoration info
            if (this.decoration) {
                widgetLogger.debug(
                    `  - Drawing decoration: color=${this.decoration.color}, border=${!!this.decoration.border}`
                );
            }
        }

        // Paint child content
        if (this.child && this.childLayoutResult) {
            const childArea: Geometry.Size = {
                width:
                    contentArea.width -
                    Layout.EdgeInsets.horizontal(this.padding),
                height:
                    contentArea.height -
                    Layout.EdgeInsets.vertical(this.padding),
            };

            const childSize: Geometry.Size = this.childLayoutResult.size;

            // Calculate child position based on alignment
            const childPosition = Layout.AlignmentUtils.resolve(
                this.alignment,
                childArea,
                childSize
            );

            if (graphics) {
                // Translate to child position (including padding)
                graphics.save();
                graphics.translate(
                    childPosition.x + this.padding.left,
                    childPosition.y + this.padding.top
                );
            }

            const childContext: Layout.PaintContext = {
                ...context,
                size: childSize,
            };

            this.child.paint(childContext);

            if (graphics) {
                graphics.restore();
            }
        }

        if (graphics) {
            // Restore graphics state
            graphics.restore();
        }
    }

    /**
     * Parse color string to PdfColor
     */
    private parseColor(colorStr: string): IPdfColor {
        // Simple hex color parser
        if (colorStr.startsWith('#')) {
            const hex = colorStr.slice(1);
            const r = parseInt(hex.slice(0, 2), 16) / 255;
            const g = parseInt(hex.slice(2, 4), 16) / 255;
            const b = parseInt(hex.slice(4, 6), 16) / 255;
            return { red: r, green: g, blue: b };
        }
        // Default to black
        return { red: 0, green: 0, blue: 0 };
    }
}

/**
 * Stack widget for layered layouts with z-index positioning
 */
export class Stack extends BaseWidget {
    private readonly children: Widget[];
    private readonly fit: StackFit;
    private readonly alignment: Layout.Alignment;
    private readonly clipBehavior: 'antiAlias' | 'hardEdge' | 'none';
    private childrenLayoutResults: Layout.LayoutResult[] = [];

    constructor(props: StackProps) {
        super(props);

        this.children = props.children;
        this.fit = props.fit ?? StackFit.Loose;
        this.alignment = props.alignment ?? Layout.Alignment.TopLeft;
        this.clipBehavior = props.clipBehavior ?? 'hardEdge';
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        if (this.children.length === 0) {
            return this.createLayoutResult({ width: 0, height: 0 });
        }

        this.childrenLayoutResults = [];
        let maxWidth = 0;
        let maxHeight = 0;

        // Layout all children with the same constraints
        for (const child of this.children) {
            const childResult = child.layout(context);
            this.childrenLayoutResults.push(childResult);

            maxWidth = Math.max(maxWidth, childResult.size.width);
            maxHeight = Math.max(maxHeight, childResult.size.height);
        }

        // Determine stack size based on fit
        let stackSize: Geometry.Size;
        switch (this.fit) {
            case StackFit.Loose:
                stackSize = { width: maxWidth, height: maxHeight };
                break;
            case StackFit.Expand:
                stackSize = {
                    width:
                        context.constraints.maxWidth ===
                        Number.POSITIVE_INFINITY
                            ? maxWidth
                            : context.constraints.maxWidth,
                    height:
                        context.constraints.maxHeight ===
                        Number.POSITIVE_INFINITY
                            ? maxHeight
                            : context.constraints.maxHeight,
                };
                break;
            case StackFit.PassThrough:
                stackSize = {
                    width: context.constraints.maxWidth,
                    height: context.constraints.maxHeight,
                };
                break;
        }

        const constrainedSize = this.constrainSize(
            context.constraints,
            stackSize
        );
        return this.createLayoutResult(constrainedSize);
    }

    paint(context: Layout.PaintContext): void {
        if (this.children.length === 0) {
            return;
        }

        // Paint each child at their calculated position
        this.children.forEach((child, index) => {
            const childResult = this.childrenLayoutResults[index];
            if (!childResult) {
                return;
            }

            let childPosition: Geometry.Point;

            // Check if child is a Positioned widget
            if (child instanceof Positioned) {
                childPosition = child.getPosition(context.size);
            } else {
                // Use stack alignment for non-positioned children
                childPosition = Layout.AlignmentUtils.resolve(
                    this.alignment,
                    context.size,
                    childResult.size
                );
            }

            // Apply graphics translation using Container pattern
            if (context.graphics) {
                context.graphics.save();
                context.graphics.translate(childPosition.x, childPosition.y);
            }

            const childContext: Layout.PaintContext = {
                ...context,
                size: childResult.size,
            };

            child.paint(childContext);

            if (context.graphics) {
                context.graphics.restore();
            }
        });
    }
}

/**
 * Positioned widget for absolute positioning within Stack
 */
export class Positioned extends BaseWidget {
    private readonly child: Widget;
    private readonly top?: number;
    private readonly right?: number;
    private readonly bottom?: number;
    private readonly left?: number;
    private readonly width?: number;
    private readonly height?: number;

    constructor(props: PositionedProps) {
        super(props);

        this.child = props.child;
        if (props.top !== undefined) {
            this.top = props.top;
        }
        if (props.right !== undefined) {
            this.right = props.right;
        }
        if (props.bottom !== undefined) {
            this.bottom = props.bottom;
        }
        if (props.left !== undefined) {
            this.left = props.left;
        }
        if (props.width !== undefined) {
            this.width = props.width;
        }
        if (props.height !== undefined) {
            this.height = props.height;
        }
    }

    /**
     * Calculate position within stack bounds
     */
    getPosition(stackSize: Geometry.Size): Geometry.Point {
        let x = 0;
        let y = 0;

        // Calculate X position
        if (this.left !== undefined) {
            x = this.left;
        } else if (this.right !== undefined) {
            const childWidth = this.width ?? 0; // We'd need child size from layout
            x = stackSize.width - this.right - childWidth;
        }

        // Calculate Y position
        if (this.top !== undefined) {
            y = this.top;
        } else if (this.bottom !== undefined) {
            const childHeight = this.height ?? 0; // We'd need child size from layout
            y = stackSize.height - this.bottom - childHeight;
        }

        return { x, y };
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        // Create child constraints based on positioned dimensions
        let childConstraints = context.constraints;

        if (this.width !== undefined || this.height !== undefined) {
            childConstraints = {
                minWidth: this.width ?? 0,
                maxWidth: this.width ?? context.constraints.maxWidth,
                minHeight: this.height ?? 0,
                maxHeight: this.height ?? context.constraints.maxHeight,
            };
        }

        const childContext: Layout.LayoutContext = {
            ...context,
            constraints: childConstraints,
        };

        return this.child.layout(childContext);
    }

    paint(context: Layout.PaintContext): void {
        this.child.paint(context);
    }
}

/**
 * Layout utility functions - consolidated from various layout helpers
 */
export const LayoutUtils = {
    /**
     * Create a padded container (replaces Padding widget)
     */
    padded(child: Widget, padding: number | Layout.EdgeInsets): Container {
        const paddingInsets =
            typeof padding === 'number'
                ? Layout.EdgeInsets.all(padding)
                : padding;

        return new Container({
            child,
            padding: paddingInsets,
        });
    },

    /**
     * Create a container with margin (replaces Margin widget)
     */
    withMargin(child: Widget, margin: number | Layout.EdgeInsets): Container {
        const marginInsets =
            typeof margin === 'number' ? Layout.EdgeInsets.all(margin) : margin;

        return new Container({
            child,
            margin: marginInsets,
        });
    },

    /**
     * Create a centered container (replaces Center widget)
     */
    centered(child: Widget): Container {
        return new Container({
            child,
            alignment: Layout.Alignment.Center,
        });
    },

    /**
     * Create an aligned container (replaces Align widget)
     */
    aligned(child: Widget, alignment: Layout.Alignment): Container {
        return new Container({
            child,
            alignment,
        });
    },

    /**
     * Create a sized container
     */
    sized(child: Widget, width?: number, height?: number): Container {
        const props: ContainerProps = { child };
        if (width !== undefined) {
            props.width = width;
        }
        if (height !== undefined) {
            props.height = height;
        }
        return new Container(props);
    },

    /**
     * Create a container with decoration
     */
    decorated(child: Widget, decoration: BoxDecoration): Container {
        return new Container({
            child,
            decoration,
        });
    },
};

/**
 * Border radius utilities
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
 * Common decoration presets
 */
export const DecorationStyles = {
    /** Card-like decoration with subtle shadow */
    card: {
        color: '#ffffff',
        borderRadius: BorderRadiusUtils.all(8),
        boxShadow: [
            {
                offsetX: 0,
                offsetY: 2,
                blurRadius: 4,
                color: '#00000020',
            },
        ],
    } as BoxDecoration,

    /** Outlined container */
    outlined: {
        border: {
            width: 1,
            color: '#e0e0e0',
            style: BorderStyle.Solid,
        },
        borderRadius: BorderRadiusUtils.all(4),
    } as BoxDecoration,

    /** Elevated container with shadow */
    elevated: {
        color: '#ffffff',
        borderRadius: BorderRadiusUtils.all(4),
        boxShadow: [
            {
                offsetX: 0,
                offsetY: 4,
                blurRadius: 8,
                color: '#00000030',
            },
        ],
    } as BoxDecoration,
};

/**
 * Convenience functions for creating layout widgets
 */
export function createContainer(props: ContainerProps = {}): Container {
    return new Container(props);
}

export function createStack(props: StackProps): Stack {
    return new Stack(props);
}

export function createPositioned(props: PositionedProps): Positioned {
    return new Positioned(props);
}
