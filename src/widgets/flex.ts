/**
 * Flex layout widget implementation
 * 
 * Implements Flutter-style flex layout with constraint-based sizing,
 * main-axis and cross-axis alignment, and flexible children.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
    BoxConstraints,
} from '../types/layout.js';
import { TextDirection } from '../types/layout.js';
import type { Size, Point } from '../types/geometry.js';
import {
    Axis,
    MainAxisAlignment,
    CrossAxisAlignment,
    MainAxisSize,
    FlexFit,
    FlexUtils,
    type FlexChildData,
    type FlexLayoutData,
} from '../types/flex.js';

/**
 * Properties for the Flex widget
 */
export interface FlexProps extends WidgetProps {
    /** List of child widgets */
    children: Widget[];
    /** Direction of the main axis */
    direction: Axis;
    /** How to align children along the main axis */
    mainAxisAlignment?: MainAxisAlignment;
    /** How to align children along the cross axis */
    crossAxisAlignment?: CrossAxisAlignment;
    /** How much space to occupy on the main axis */
    mainAxisSize?: MainAxisSize;
    /** Spacing between children on the main axis */
    mainAxisSpacing?: number;
    /** Spacing between children on the cross axis */
    crossAxisSpacing?: number;
}

/**
 * Interface for widgets that can participate in flex layout
 */
export interface FlexChild extends Widget {
    /** Flex data for this child */
    flexData?: FlexChildData;
}

/**
 * Core Flex widget that arranges children in a linear layout
 */
export class Flex extends BaseWidget {
    private readonly children: Widget[];
    private readonly direction: Axis;
    private readonly mainAxisAlignment: MainAxisAlignment;
    private readonly crossAxisAlignment: CrossAxisAlignment;
    private readonly mainAxisSize: MainAxisSize;
    private readonly mainAxisSpacing: number;
    private readonly crossAxisSpacing: number;

    constructor(props: FlexProps) {
        super(props);

        this.children = props.children;
        this.direction = props.direction;
        this.mainAxisAlignment = props.mainAxisAlignment ?? MainAxisAlignment.Start;
        this.crossAxisAlignment = props.crossAxisAlignment ?? CrossAxisAlignment.Center;
        this.mainAxisSize = props.mainAxisSize ?? MainAxisSize.Max;
        this.mainAxisSpacing = props.mainAxisSpacing ?? 0;
        this.crossAxisSpacing = props.crossAxisSpacing ?? 0;
    }

    /**
     * Get flex data from a child widget
     */
    private getFlexData(child: Widget): FlexChildData {
        const flexChild = child as FlexChild;
        return flexChild.flexData ?? { flex: 0, fit: FlexFit.Loose };
    }

    /**
     * Layout children and calculate flex distribution
     */
    private layoutChildren(context: LayoutContext): FlexLayoutData {
        if (this.children.length === 0) {
            return {
                mainAxisSize: 0,
                crossAxisSize: 0,
                children: [],
            };
        }

        const mainAxisConstraints = FlexUtils.getMainAxisConstraints(context.constraints, this.direction);
        const crossAxisConstraints = FlexUtils.getCrossAxisConstraints(context.constraints, this.direction);

        // Separate flexible and non-flexible children
        const flexibleChildren: Array<{ child: Widget; flex: number; index: number }> = [];
        const nonFlexibleChildren: Array<{ child: Widget; index: number }> = [];

        this.children.forEach((child, index) => {
            const flexData = this.getFlexData(child);
            if (flexData.flex && flexData.flex > 0) {
                flexibleChildren.push({ child, flex: flexData.flex, index });
            } else {
                nonFlexibleChildren.push({ child, index });
            }
        });

        // Layout non-flexible children first
        const childResults: Array<{
            size: Size;
            position: Point;
            layoutResult: LayoutResult;
            index: number;
        }> = [];

        let usedMainAxisSpace = 0;
        let maxCrossAxisSize = 0;

        // Layout non-flexible children with loose constraints
        for (const { child, index } of nonFlexibleChildren) {
            const childConstraints: BoxConstraints = this.direction === Axis.Horizontal ? {
                minWidth: 0,
                maxWidth: Math.max(0, mainAxisConstraints.max - usedMainAxisSpace),
                minHeight: crossAxisConstraints.min,
                maxHeight: crossAxisConstraints.max,
            } : {
                minWidth: crossAxisConstraints.min,
                maxWidth: crossAxisConstraints.max,
                minHeight: 0,
                maxHeight: Math.max(0, mainAxisConstraints.max - usedMainAxisSpace),
            };

            const childContext: LayoutContext = {
                ...context,
                constraints: childConstraints,
            };

            const childLayout = child.layout(childContext);
            const mainAxisChildSize = FlexUtils.getMainAxisSize(childLayout.size, this.direction);
            const crossAxisChildSize = FlexUtils.getCrossAxisSize(childLayout.size, this.direction);

            childResults.push({
                size: childLayout.size,
                position: { x: 0, y: 0 }, // Will be calculated later
                layoutResult: childLayout,
                index,
            });

            usedMainAxisSpace += mainAxisChildSize;
            maxCrossAxisSize = Math.max(maxCrossAxisSize, crossAxisChildSize);
        }

        // Calculate available space for flexible children
        const totalSpacing = this.mainAxisSpacing * Math.max(0, this.children.length - 1);
        const remainingSpace = Math.max(0, mainAxisConstraints.max - usedMainAxisSpace - totalSpacing);

        // Layout flexible children
        const totalFlex = flexibleChildren.reduce((sum, { flex }) => sum + flex, 0);

        if (flexibleChildren.length > 0 && totalFlex > 0) {
            const availableFlexSpace = Math.max(0, remainingSpace);
            const flexUnit = availableFlexSpace / totalFlex;

            for (const { child, flex, index } of flexibleChildren) {
                const childFlexSpace = flex * flexUnit;
                const flexData = this.getFlexData(child);

                const childConstraints: BoxConstraints = this.direction === Axis.Horizontal ? {
                    minWidth: flexData.fit === FlexFit.Tight ? childFlexSpace : 0,
                    maxWidth: childFlexSpace,
                    minHeight: this.crossAxisAlignment === CrossAxisAlignment.Stretch ? crossAxisConstraints.max : crossAxisConstraints.min,
                    maxHeight: crossAxisConstraints.max,
                } : {
                    minWidth: this.crossAxisAlignment === CrossAxisAlignment.Stretch ? crossAxisConstraints.max : crossAxisConstraints.min,
                    maxWidth: crossAxisConstraints.max,
                    minHeight: flexData.fit === FlexFit.Tight ? childFlexSpace : 0,
                    maxHeight: childFlexSpace,
                };

                const childContext: LayoutContext = {
                    ...context,
                    constraints: childConstraints,
                };

                const childLayout = child.layout(childContext);
                const crossAxisChildSize = FlexUtils.getCrossAxisSize(childLayout.size, this.direction);

                childResults.push({
                    size: childLayout.size,
                    position: { x: 0, y: 0 }, // Will be calculated later
                    layoutResult: childLayout,
                    index,
                });

                maxCrossAxisSize = Math.max(maxCrossAxisSize, crossAxisChildSize);
            }
        }

        // Sort children back to original order
        childResults.sort((a, b) => a.index - b.index);

        // Calculate final container sizes
        const childMainAxisSizes = childResults.map(result =>
            FlexUtils.getMainAxisSize(result.size, this.direction)
        );

        const totalChildMainAxisSize = childMainAxisSizes.reduce((sum, size) => sum + size, 0);
        const totalMainAxisSize = totalChildMainAxisSize + totalSpacing;

        const finalMainAxisSize = this.mainAxisSize === MainAxisSize.Min
            ? Math.max(mainAxisConstraints.min, Math.min(mainAxisConstraints.max, totalMainAxisSize))
            : Math.max(mainAxisConstraints.min, mainAxisConstraints.max);

        const finalCrossAxisSize = this.crossAxisAlignment === CrossAxisAlignment.Stretch
            ? crossAxisConstraints.max
            : Math.max(crossAxisConstraints.min, Math.min(crossAxisConstraints.max, maxCrossAxisSize));

        // Calculate child positions
        const mainAxisPositions = FlexUtils.calculateMainAxisPositions(
            childMainAxisSizes,
            finalMainAxisSize,
            this.mainAxisAlignment,
            this.mainAxisSpacing
        );

        childResults.forEach((result, i) => {
            const mainAxisPos = mainAxisPositions[i] || 0;
            const crossAxisChildSize = FlexUtils.getCrossAxisSize(result.size, this.direction);
            const crossAxisPos = FlexUtils.calculateCrossAxisPosition(
                crossAxisChildSize,
                finalCrossAxisSize,
                this.crossAxisAlignment
            );

            if (this.direction === Axis.Horizontal) {
                result.position = { x: mainAxisPos, y: crossAxisPos };
            } else {
                result.position = { x: crossAxisPos, y: mainAxisPos };
            }
        });

        return {
            mainAxisSize: finalMainAxisSize,
            crossAxisSize: finalCrossAxisSize,
            children: childResults,
        };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        const layoutData = this.layoutChildren(context);

        const size = FlexUtils.createSize(
            layoutData.mainAxisSize,
            layoutData.crossAxisSize,
            this.direction
        );

        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize, {
            needsRepaint: true,
        });
    }

    paint(context: PaintContext): void {
        if (this.children.length === 0) {
            return;
        }

        const { graphics } = context;

        // Re-layout to get child positions (in a real implementation, this would be cached)
        const layoutContext: LayoutContext = {
            constraints: {
                minWidth: context.size.width,
                maxWidth: context.size.width,
                minHeight: context.size.height,
                maxHeight: context.size.height,
            },
            textDirection: TextDirection.LeftToRight,
            theme: context.theme,
        };

        const layoutData = this.layoutChildren(layoutContext);

        // Paint each child at its calculated position
        for (const childData of layoutData.children) {
            graphics.saveContext();

            // Transform to child position
            graphics.setTransform({
                storage: [1, 0, 0, 1, childData.position.x, childData.position.y],
            } as any);

            // Paint child
            const childContext: PaintContext = {
                ...context,
                size: childData.size,
            };

            this.children[childData.index]?.paint(childContext);

            graphics.restoreContext();
        }
    }
}

/**
 * Flexible widget that allows a child to occupy available space in a flex layout
 */
export class Flexible extends BaseWidget implements FlexChild {
    private readonly child: Widget;
    readonly flexData: FlexChildData;

    constructor(props: {
        child: Widget;
        flex?: number;
        fit?: FlexFit;
    } & WidgetProps) {
        super(props);

        this.child = props.child;
        this.flexData = {
            flex: props.flex ?? 1,
            fit: props.fit ?? FlexFit.Loose,
        };
    }

    layout(context: LayoutContext): LayoutResult {
        // Flexible widgets just pass through to their child
        // The flex behavior is handled by the parent Flex widget
        return this.child.layout(context);
    }

    paint(context: PaintContext): void {
        this.child.paint(context);
    }
}

/**
 * Expanded widget - a Flexible widget with flex = 1 and fit = tight
 */
export class Expanded extends Flexible {
    constructor(props: {
        child: Widget;
        flex?: number;
    } & WidgetProps) {
        super({
            ...props,
            flex: props.flex ?? 1,
            fit: FlexFit.Tight,
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
            direction: Axis.Horizontal,
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
            direction: Axis.Vertical,
        });
    }
}

/**
 * Convenience functions for creating flex widgets
 */
export const FlexWidgets = {
    /**
     * Create a Row widget
     */
    row(props: Omit<FlexProps, 'direction'>): Row {
        return new Row(props);
    },

    /**
     * Create a Column widget
     */
    column(props: Omit<FlexProps, 'direction'>): Column {
        return new Column(props);
    },

    /**
     * Create a Flexible widget
     */
    flexible(child: Widget, options: { flex?: number; fit?: FlexFit } = {}): Flexible {
        return new Flexible({ child, ...options });
    },

    /**
     * Create an Expanded widget
     */
    expanded(child: Widget, flex?: number): Expanded {
        return flex !== undefined
            ? new Expanded({ child, flex })
            : new Expanded({ child });
    },
};