/**
 * Flex Layout System - Simplified
 *
 * Keeps the existing flex system but removes over-engineered helpers.
 * Provides Row, Column, Flexible, and Expanded widgets.
 *
 * @packageDocumentation
 */

import { widgetLogger } from '@/core/logger.js';
import { Layout, Flex as FlexTypes, type Geometry } from '@/types.js';
import { BaseWidget, type Widget, type WidgetProps } from '@/widgets/base.js';

/**
 * Properties for the Flex widget
 */
export interface FlexProps extends WidgetProps {
    /** List of child widgets */
    children: Widget[];
    /** Direction of the main axis */
    direction: FlexTypes.Axis;
    /** How to align children along the main axis */
    mainAxisAlignment?: FlexTypes.MainAxisAlignment;
    /** How to align children along the cross axis */
    crossAxisAlignment?: FlexTypes.CrossAxisAlignment;
    /** How much space to occupy on the main axis */
    mainAxisSize?: FlexTypes.MainAxisSize;
    /** Spacing between children on the main axis */
    mainAxisSpacing?: number;
    /** Direction for vertical axis layout (Column widgets) */
    verticalDirection?: FlexTypes.VerticalDirection;
}

/**
 * Interface for widgets that can participate in flex layout
 */
export interface FlexChild extends Widget {
    /** Flex data for this child */
    flexData?: FlexTypes.FlexChildData;
}

/**
 * Child layout data for flex calculations
 */
interface FlexChildLayout {
    widget: Widget;
    size: Geometry.Size;
    position: Geometry.Point;
    layoutResult: Layout.LayoutResult;
    index: number;
    flex: number;
}

/**
 * Core Flex widget that arranges children in a linear layout
 */
export class Flex extends BaseWidget {
    private readonly children: Widget[];
    private readonly direction: FlexTypes.Axis;
    private readonly mainAxisAlignment: FlexTypes.MainAxisAlignment;
    private readonly crossAxisAlignment: FlexTypes.CrossAxisAlignment;
    private readonly mainAxisSize: FlexTypes.MainAxisSize;
    private readonly mainAxisSpacing: number;
    private readonly verticalDirection: FlexTypes.VerticalDirection;

    constructor(props: FlexProps) {
        super(props);

        this.children = props.children;
        this.direction = props.direction;
        this.mainAxisAlignment =
            props.mainAxisAlignment ?? FlexTypes.MainAxisAlignment.Start;
        this.crossAxisAlignment =
            props.crossAxisAlignment ?? FlexTypes.CrossAxisAlignment.Center;
        this.mainAxisSize = props.mainAxisSize ?? FlexTypes.MainAxisSize.Max;
        this.mainAxisSpacing = props.mainAxisSpacing ?? 0;
        this.verticalDirection =
            props.verticalDirection ?? FlexTypes.VerticalDirection.Down;
    }

    /**
     * Get flex data from a child widget
     */
    private getFlexData(child: Widget): FlexTypes.FlexChildData {
        const flexChild = child as FlexChild;
        return flexChild.flexData ?? { flex: 0, fit: FlexTypes.FlexFit.Loose };
    }

    /**
     * Get main axis size from a size based on direction
     */
    private getMainAxisSize(size: Geometry.Size): number {
        return this.direction === FlexTypes.Axis.Horizontal
            ? size.width
            : size.height;
    }

    /**
     * Get cross axis size from a size based on direction
     */
    private getCrossAxisSize(size: Geometry.Size): number {
        return this.direction === FlexTypes.Axis.Horizontal
            ? size.height
            : size.width;
    }

    /**
     * Create size from main and cross axis values
     */
    private createSize(
        mainAxisSize: number,
        crossAxisSize: number
    ): Geometry.Size {
        return this.direction === FlexTypes.Axis.Horizontal
            ? { width: mainAxisSize, height: crossAxisSize }
            : { width: crossAxisSize, height: mainAxisSize };
    }

    /**
     * Layout children and calculate flex distribution
     */
    private layoutChildren(context: Layout.LayoutContext): FlexChildLayout[] {
        if (this.children.length === 0) {
            return [];
        }

        const maxMainAxis =
            this.direction === FlexTypes.Axis.Horizontal
                ? context.constraints.maxWidth
                : context.constraints.maxHeight;
        const maxCrossAxis =
            this.direction === FlexTypes.Axis.Horizontal
                ? context.constraints.maxHeight
                : context.constraints.maxWidth;

        // Separate flexible and non-flexible children
        const flexibleChildren: Array<{
            child: Widget;
            flex: number;
            index: number;
        }> = [];
        const nonFlexibleChildren: Array<{ child: Widget; index: number }> = [];

        this.children.forEach((child, index) => {
            const flexData = this.getFlexData(child);
            if (flexData.flex && flexData.flex > 0) {
                flexibleChildren.push({ child, flex: flexData.flex, index });
            } else {
                nonFlexibleChildren.push({ child, index });
            }
        });

        const childLayouts: FlexChildLayout[] = [];
        let usedMainAxisSpace = 0;
        let maxCrossAxisSize = 0;

        // Layout non-flexible children first
        for (const { child, index } of nonFlexibleChildren) {
            const childConstraints: Layout.BoxConstraints =
                this.direction === FlexTypes.Axis.Horizontal
                    ? {
                          minWidth: 0,
                          maxWidth: Math.max(
                              0,
                              maxMainAxis - usedMainAxisSpace
                          ),
                          minHeight: 0,
                          maxHeight: maxCrossAxis,
                      }
                    : {
                          minWidth: 0,
                          maxWidth: maxCrossAxis,
                          minHeight: 0,
                          maxHeight: Math.max(
                              0,
                              maxMainAxis - usedMainAxisSpace
                          ),
                      };

            const childContext: Layout.LayoutContext = {
                ...context,
                constraints: childConstraints,
            };

            const childLayout = child.layout(childContext);
            const mainAxisChildSize = this.getMainAxisSize(childLayout.size);
            const crossAxisChildSize = this.getCrossAxisSize(childLayout.size);

            childLayouts.push({
                widget: child,
                size: childLayout.size,
                position: { x: 0, y: 0 }, // Will be calculated later
                layoutResult: childLayout,
                index,
                flex: 0,
            });

            usedMainAxisSpace += mainAxisChildSize;
            maxCrossAxisSize = Math.max(maxCrossAxisSize, crossAxisChildSize);
        }

        // Calculate available space for flexible children
        const totalSpacing =
            this.mainAxisSpacing * Math.max(0, this.children.length - 1);
        const remainingSpace = Math.max(
            0,
            maxMainAxis - usedMainAxisSpace - totalSpacing
        );

        // Layout flexible children
        const totalFlex = flexibleChildren.reduce(
            (sum, { flex }) => sum + flex,
            0
        );

        if (flexibleChildren.length > 0 && totalFlex > 0) {
            const flexUnit = remainingSpace / totalFlex;

            for (const { child, flex, index } of flexibleChildren) {
                const childFlexSpace = flex * flexUnit;
                const flexData = this.getFlexData(child);

                const childConstraints: Layout.BoxConstraints =
                    this.direction === FlexTypes.Axis.Horizontal
                        ? {
                              minWidth:
                                  flexData.fit === FlexTypes.FlexFit.Tight
                                      ? childFlexSpace
                                      : 0,
                              maxWidth: childFlexSpace,
                              minHeight:
                                  this.crossAxisAlignment ===
                                  FlexTypes.CrossAxisAlignment.Stretch
                                      ? maxCrossAxis
                                      : 0,
                              maxHeight: maxCrossAxis,
                          }
                        : {
                              minWidth:
                                  this.crossAxisAlignment ===
                                  FlexTypes.CrossAxisAlignment.Stretch
                                      ? maxCrossAxis
                                      : 0,
                              maxWidth: maxCrossAxis,
                              minHeight:
                                  flexData.fit === FlexTypes.FlexFit.Tight
                                      ? childFlexSpace
                                      : 0,
                              maxHeight: childFlexSpace,
                          };

                const childContext: Layout.LayoutContext = {
                    ...context,
                    constraints: childConstraints,
                };

                const childLayout = child.layout(childContext);
                const crossAxisChildSize = this.getCrossAxisSize(
                    childLayout.size
                );

                childLayouts.push({
                    widget: child,
                    size: childLayout.size,
                    position: { x: 0, y: 0 }, // Will be calculated later
                    layoutResult: childLayout,
                    index,
                    flex,
                });

                maxCrossAxisSize = Math.max(
                    maxCrossAxisSize,
                    crossAxisChildSize
                );
            }
        }

        // Sort children back to original order
        childLayouts.sort((a, b) => a.index - b.index);

        // Calculate positions
        this.calculatePositions(childLayouts, maxMainAxis, maxCrossAxisSize);

        return childLayouts;
    }

    /**
     * Calculate child positions based on alignment
     */
    private calculatePositions(
        childLayouts: FlexChildLayout[],
        containerMainSize: number,
        containerCrossSize: number
    ): void {
        const totalChildMainSize = childLayouts.reduce(
            (sum, child) => sum + this.getMainAxisSize(child.size),
            0
        );
        const totalSpacing =
            this.mainAxisSpacing * Math.max(0, childLayouts.length - 1);
        const totalMainSize = totalChildMainSize + totalSpacing;

        // Calculate main axis positions
        let currentMainPos = 0;
        const remainingMainSpace = Math.max(
            0,
            containerMainSize - totalMainSize
        );

        switch (this.mainAxisAlignment) {
            case FlexTypes.MainAxisAlignment.Start: {
                currentMainPos = 0;
                break;
            }
            case FlexTypes.MainAxisAlignment.End: {
                currentMainPos = remainingMainSpace;
                break;
            }
            case FlexTypes.MainAxisAlignment.Center: {
                currentMainPos = remainingMainSpace / 2;
                break;
            }
            case FlexTypes.MainAxisAlignment.SpaceBetween: {
                currentMainPos = 0;
                break;
            }
            case FlexTypes.MainAxisAlignment.SpaceAround: {
                const aroundSpace = remainingMainSpace / childLayouts.length;
                currentMainPos = aroundSpace / 2;
                break;
            }
            case FlexTypes.MainAxisAlignment.SpaceEvenly: {
                const evenSpace =
                    remainingMainSpace / (childLayouts.length + 1);
                currentMainPos = evenSpace;
                break;
            }
        }

        childLayouts.forEach((child, i) => {
            const childMainSize = this.getMainAxisSize(child.size);
            const childCrossSize = this.getCrossAxisSize(child.size);

            // Calculate cross axis position
            let crossPos = 0;
            switch (this.crossAxisAlignment) {
                case FlexTypes.CrossAxisAlignment.Start:
                    crossPos = 0;
                    break;
                case FlexTypes.CrossAxisAlignment.End:
                    crossPos = containerCrossSize - childCrossSize;
                    break;
                case FlexTypes.CrossAxisAlignment.Center:
                    crossPos = (containerCrossSize - childCrossSize) / 2;
                    break;
                case FlexTypes.CrossAxisAlignment.Stretch:
                    crossPos = 0;
                    break;
                case FlexTypes.CrossAxisAlignment.Baseline:
                    // Simple baseline implementation
                    crossPos = 0;
                    break;
            }

            // Set position based on direction
            if (this.direction === FlexTypes.Axis.Horizontal) {
                child.position = { x: currentMainPos, y: crossPos };
            } else {
                child.position = { x: crossPos, y: currentMainPos };
            }

            // Update main position for next child
            currentMainPos += childMainSize;

            if (i < childLayouts.length - 1) {
                switch (this.mainAxisAlignment) {
                    case FlexTypes.MainAxisAlignment.SpaceBetween:
                        if (childLayouts.length > 1) {
                            currentMainPos +=
                                remainingMainSpace / (childLayouts.length - 1);
                        }
                        break;
                    case FlexTypes.MainAxisAlignment.SpaceAround:
                        currentMainPos +=
                            remainingMainSpace / childLayouts.length;
                        break;
                    case FlexTypes.MainAxisAlignment.SpaceEvenly:
                        currentMainPos +=
                            remainingMainSpace / (childLayouts.length + 1);
                        break;
                    default:
                        currentMainPos += this.mainAxisSpacing;
                        break;
                }
            }
        });
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        const childLayouts = this.layoutChildren(context);

        if (childLayouts.length === 0) {
            return this.createLayoutResult({ width: 0, height: 0 });
        }

        // Calculate container size
        const maxMainAxis = Math.max(
            ...childLayouts.map(child => {
                const mainPos =
                    this.direction === FlexTypes.Axis.Horizontal
                        ? child.position.x
                        : child.position.y;
                const mainSize = this.getMainAxisSize(child.size);
                return mainPos + mainSize;
            })
        );

        const maxCrossAxis = Math.max(
            ...childLayouts.map(child => {
                const crossPos =
                    this.direction === FlexTypes.Axis.Horizontal
                        ? child.position.y
                        : child.position.x;
                const crossSize = this.getCrossAxisSize(child.size);
                return crossPos + crossSize;
            })
        );

        const size = this.createSize(maxMainAxis, maxCrossAxis);
        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize);
    }

    paint(context: Layout.PaintContext): void {
        if (this.children.length === 0) {
            return;
        }

        widgetLogger.debug(
            `Painting flex (${this.direction}) with ${this.children.length} children`
        );

        // Re-layout to get child positions (in a real implementation, this would be cached)
        const layoutContext: Layout.LayoutContext = {
            constraints: Layout.BoxConstraints.tight(context.size),
            textDirection: 'ltr',
            theme: context.theme,
        };

        const childLayouts = this.layoutChildren(layoutContext);

        // Paint each child at its calculated position
        childLayouts.forEach((childLayout, i) => {
            widgetLogger.debug(
                `  - Child ${i} at position (${childLayout.position.x}, ${childLayout.position.y})`
            );

            // Apply graphics translation using Container pattern
            if (context.graphics) {
                context.graphics.save();
                context.graphics.translate(
                    childLayout.position.x,
                    childLayout.position.y
                );
            }

            const childContext: Layout.PaintContext = {
                ...context,
                size: childLayout.size,
            };

            childLayout.widget.paint(childContext);

            if (context.graphics) {
                context.graphics.restore();
            }
        });
    }
}

/**
 * Flexible widget that allows a child to occupy available space in a flex layout
 */
export class Flexible extends BaseWidget implements FlexChild {
    private readonly child: Widget;
    readonly flexData: FlexTypes.FlexChildData;

    constructor(
        props: {
            child: Widget;
            flex?: number;
            fit?: FlexTypes.FlexFit;
        } & WidgetProps
    ) {
        super(props);

        this.child = props.child;
        this.flexData = {
            flex: props.flex ?? 1,
            fit: props.fit ?? FlexTypes.FlexFit.Loose,
        };
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        // Flexible widgets just pass through to their child
        // The flex behavior is handled by the parent Flex widget
        return this.child.layout(context);
    }

    paint(context: Layout.PaintContext): void {
        this.child.paint(context);
    }
}

/**
 * Expanded widget - a Flexible widget with flex = 1 and fit = tight
 */
export class Expanded extends Flexible {
    constructor(
        props: {
            child: Widget;
            flex?: number;
        } & WidgetProps
    ) {
        super({
            ...props,
            flex: props.flex ?? 1,
            fit: FlexTypes.FlexFit.Tight,
        });
    }
}

/**
 * Row widget - horizontal flex layout
 */
export class Row extends Flex {
    constructor(props: Omit<FlexProps, 'direction'>) {
        super({
            ...props,
            direction: FlexTypes.Axis.Horizontal,
        });
    }
}

/**
 * Column widget - vertical flex layout
 */
export class Column extends Flex {
    constructor(props: Omit<FlexProps, 'direction'>) {
        super({
            ...props,
            direction: FlexTypes.Axis.Vertical,
            verticalDirection:
                props.verticalDirection ?? FlexTypes.VerticalDirection.Down,
        });
    }
}

/**
 * Convenience functions for creating flex widgets (simplified from over-engineered helpers)
 */
export const FlexUtils = {
    /**
     * Create a Row widget
     */
    row(
        children: Widget[],
        options: Omit<FlexProps, 'direction' | 'children'> = {}
    ): Row {
        return new Row({ children, ...options });
    },

    /**
     * Create a Column widget
     */
    column(
        children: Widget[],
        options: Omit<FlexProps, 'direction' | 'children'> = {}
    ): Column {
        return new Column({ children, ...options });
    },

    /**
     * Create a Flexible widget
     */
    flexible(
        child: Widget,
        options: { flex?: number; fit?: FlexTypes.FlexFit } = {}
    ): Flexible {
        return new Flexible({ child, ...options });
    },

    /**
     * Create an Expanded widget
     */
    expanded(child: Widget, flex?: number): Expanded {
        const props: { child: Widget; flex?: number } = { child };
        if (flex !== undefined) {
            props.flex = flex;
        }
        return new Expanded(props);
    },
};

/**
 * Convenience functions
 */
export function createRow(props: Omit<FlexProps, 'direction'>): Row {
    return new Row(props);
}

export function createColumn(props: Omit<FlexProps, 'direction'>): Column {
    return new Column(props);
}

export function createFlexible(
    props: {
        child: Widget;
        flex?: number;
        fit?: FlexTypes.FlexFit;
    } & WidgetProps
): Flexible {
    return new Flexible(props);
}

export function createExpanded(
    props: { child: Widget; flex?: number } & WidgetProps
): Expanded {
    return new Expanded(props);
}
