/**
 * Stack widget implementation
 * 
 * A widget that positions its children relative to the edges of its box.
 * Allows layered layouts where children can overlap.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import { Positioned } from './positioned.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';
import { Alignment, AlignmentUtils } from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import { Matrix4 } from '../core/pdf/graphics.js';

/**
 * Stack fit options determine how non-positioned children are sized
 */
export enum StackFit {
    /** Size the stack to contain all children */
    Loose = 'loose',
    /** Size the stack to be as large as the largest child */
    Expand = 'expand',
    /** Size the stack to fill the available space */
    PassThrough = 'passthrough',
}

/**
 * Stack widget properties
 */
export interface StackProps extends WidgetProps {
    /** List of child widgets */
    children: Widget[];
    /** Alignment for non-positioned children */
    alignment?: Alignment;
    /** Text direction for alignment resolution */
    textDirection?: 'ltr' | 'rtl';
    /** How to size the stack */
    fit?: StackFit;
    /** Whether to clip children that overflow the stack bounds */
    clipBehavior?: 'antiAlias' | 'hardEdge' | 'none';
}

/**
 * Information about a child widget in the stack
 */
interface StackChild {
    widget: Widget;
    isPositioned: boolean;
    position?: { x: number; y: number };
    size?: Size;
}

/**
 * A widget that positions its children in a stack
 * 
 * Stack allows multiple children to be layered on top of each other.
 * Children can be positioned absolutely using Positioned widgets,
 * or positioned relative to the stack's alignment.
 */
export class Stack extends BaseWidget {
    private readonly children: Widget[];
    private readonly alignment: Alignment;
    private readonly textDirection: 'ltr' | 'rtl';
    private readonly fit: StackFit;
    private readonly clipBehavior: 'antiAlias' | 'hardEdge' | 'none';

    constructor(props: StackProps) {
        super(props);
        this.children = props.children;
        this.alignment = props.alignment ?? Alignment.TopLeft;
        this.textDirection = props.textDirection ?? 'ltr';
        this.fit = props.fit ?? StackFit.Loose;
        this.clipBehavior = props.clipBehavior ?? 'hardEdge';
    }

    /**
     * Analyze children to determine which are positioned
     */
    private analyzeChildren(stackSize: Size): StackChild[] {
        return this.children.map(child => {
            if (child instanceof Positioned) {
                return {
                    widget: child,
                    isPositioned: true,
                    position: child.getPosition(stackSize),
                    size: child.getCalculatedSize(stackSize),
                };
            } else {
                return {
                    widget: child,
                    isPositioned: false,
                };
            }
        });
    }

    /**
     * Calculate the size needed to contain all children
     */
    private calculateRequiredSize(context: LayoutContext): Size {
        let maxWidth = 0;
        let maxHeight = 0;

        // First pass: estimate size for positioned children analysis
        const estimatedSize: Size = {
            width: context.constraints.maxWidth === Number.POSITIVE_INFINITY ? 400 : context.constraints.maxWidth,
            height: context.constraints.maxHeight === Number.POSITIVE_INFINITY ? 400 : context.constraints.maxHeight,
        };

        const childInfos = this.analyzeChildren(estimatedSize);

        for (const childInfo of childInfos) {
            if (childInfo.isPositioned && childInfo.position && childInfo.size) {
                // For positioned children, calculate total space needed
                const rightEdge = childInfo.position.x + childInfo.size.width;
                const bottomEdge = childInfo.position.y + childInfo.size.height;
                maxWidth = Math.max(maxWidth, rightEdge);
                maxHeight = Math.max(maxHeight, bottomEdge);
            } else {
                // For non-positioned children, layout them to get their size
                const childContext: LayoutContext = {
                    ...context,
                    constraints: {
                        minWidth: 0,
                        maxWidth: context.constraints.maxWidth,
                        minHeight: 0,
                        maxHeight: context.constraints.maxHeight,
                    },
                };

                const childLayout = childInfo.widget.layout(childContext);
                maxWidth = Math.max(maxWidth, childLayout.size.width);
                maxHeight = Math.max(maxHeight, childLayout.size.height);
            }
        }

        return { width: maxWidth, height: maxHeight };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        let stackSize: Size;

        switch (this.fit) {
            case StackFit.Expand:
                // Use maximum available space
                stackSize = {
                    width: context.constraints.maxWidth === Number.POSITIVE_INFINITY
                        ? context.constraints.minWidth
                        : context.constraints.maxWidth,
                    height: context.constraints.maxHeight === Number.POSITIVE_INFINITY
                        ? context.constraints.minHeight
                        : context.constraints.maxHeight,
                };
                break;

            case StackFit.PassThrough:
                // Pass constraints through to children
                stackSize = {
                    width: context.constraints.maxWidth,
                    height: context.constraints.maxHeight,
                };
                break;

            case StackFit.Loose:
            default:
                // Calculate size based on children
                const requiredSize = this.calculateRequiredSize(context);
                stackSize = {
                    width: Math.max(context.constraints.minWidth, requiredSize.width),
                    height: Math.max(context.constraints.minHeight, requiredSize.height),
                };
                break;
        }

        // Constrain stack size to available constraints
        const finalSize = this.constrainSize(context.constraints, stackSize);

        return this.createLayoutResult(finalSize, {
            needsRepaint: true,
        });
    }

    paint(context: PaintContext): void {
        if (this.children.length === 0) {
            return;
        }

        const { graphics, size } = context;
        const stackSize = size;

        // Analyze children with final stack size
        const childInfos = this.analyzeChildren(stackSize);

        // Setup clipping if needed
        if (this.clipBehavior !== 'none') {
            graphics.saveContext();
            graphics.drawRect(0, 0, stackSize.width, stackSize.height);
            // TODO: Implement clipping when graphics API supports it
            // graphics.clipPath();
        }

        // Paint each child
        for (const childInfo of childInfos) {
            graphics.saveContext();

            if (childInfo.isPositioned && childInfo.position) {
                // For positioned children, translate to their position
                const x = typeof childInfo.position.x === 'number' && !isNaN(childInfo.position.x) ? childInfo.position.x : 0;
                const y = typeof childInfo.position.y === 'number' && !isNaN(childInfo.position.y) ? childInfo.position.y : 0;

                if (x !== 0 || y !== 0) {
                    const translationMatrix = Matrix4.identity();
                    translationMatrix.values[12] = x; // X translation
                    translationMatrix.values[13] = y; // Y translation
                    graphics.setTransform(translationMatrix);
                }

                // Layout child with its calculated constraints
                const positioned = childInfo.widget as Positioned;
                const childSize = positioned.getCalculatedSize(stackSize);

                const childPaintContext: PaintContext = {
                    ...context,
                    size: childSize,
                };

                childInfo.widget.paint(childPaintContext);
            } else {
                // For non-positioned children, layout and position according to alignment
                const childContext: LayoutContext = {
                    constraints: {
                        minWidth: 0,
                        maxWidth: stackSize.width,
                        minHeight: 0,
                        maxHeight: stackSize.height,
                    },
                    textDirection: this.textDirection === 'rtl' ? 'rtl' as any : 'ltr' as any,
                    theme: context.theme,
                };

                const childLayout = childInfo.widget.layout(childContext);
                const childPosition = AlignmentUtils.resolve(
                    this.alignment,
                    stackSize,
                    childLayout.size
                );

                const x = typeof childPosition.x === 'number' && !isNaN(childPosition.x) ? childPosition.x : 0;
                const y = typeof childPosition.y === 'number' && !isNaN(childPosition.y) ? childPosition.y : 0;

                if (x !== 0 || y !== 0) {
                    const translationMatrix = Matrix4.identity();
                    translationMatrix.values[12] = x; // X translation
                    translationMatrix.values[13] = y; // Y translation
                    graphics.setTransform(translationMatrix);
                }

                const childPaintContext: PaintContext = {
                    ...context,
                    size: childLayout.size,
                };

                childInfo.widget.paint(childPaintContext);
            }

            graphics.restoreContext();
        }

        // Restore clipping if it was applied
        if (this.clipBehavior !== 'none') {
            graphics.restoreContext();
        }
    }
}

/**
 * Convenience function to create a Stack widget
 */
export function createStack(children: Widget[], options: Omit<StackProps, 'children'> = {}): Stack {
    return new Stack({ children, ...options });
}

/**
 * Convenience functions for common stack patterns
 */
export const StackHelpers = {
    /**
     * Create a simple stack with default alignment
     */
    simple(children: Widget[]): Stack {
        return new Stack({ children });
    },

    /**
     * Create a stack with center alignment
     */
    centered(children: Widget[]): Stack {
        return new Stack({
            children,
            alignment: Alignment.Center,
        });
    },

    /**
     * Create a stack that expands to fill available space
     */
    expanded(children: Widget[]): Stack {
        return new Stack({
            children,
            fit: StackFit.Expand,
        });
    },

    /**
     * Create a stack with custom alignment
     */
    aligned(children: Widget[], alignment: Alignment): Stack {
        return new Stack({
            children,
            alignment,
        });
    },

    /**
     * Create a stack with positioned children
     */
    withPositioned(children: Widget[]): Stack {
        return new Stack({
            children,
            fit: StackFit.Expand,
            alignment: Alignment.TopLeft,
        });
    },

    /**
     * Create a layered stack for complex layouts
     */
    layered(children: Widget[], options: {
        alignment?: Alignment;
        fit?: StackFit;
        clipBehavior?: 'antiAlias' | 'hardEdge' | 'none';
    } = {}): Stack {
        return new Stack({
            children,
            alignment: options.alignment ?? Alignment.Center,
            fit: options.fit ?? StackFit.Loose,
            clipBehavior: options.clipBehavior ?? 'hardEdge',
        });
    },
};