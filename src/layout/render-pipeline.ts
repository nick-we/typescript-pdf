/**
 * Layout Rendering Pipeline
 * 
 * Implements the complete layout and rendering pipeline for widgets,
 * including coordinate transformations and paint ordering.
 * 
 * @packageDocumentation
 */

import type { Point, Size } from '../types/geometry.js';
import type { LayoutContext, PaintContext, LayoutResult } from '../types/layout.js';
import { defaultTheme } from '../types/layout.js';
import type { Widget } from '../widgets/widget.js';
import { ConstraintSolver, globalConstraintSolver, globalPerformanceMonitor } from './constraint-solver.js';
import { Matrix4, type PdfGraphics } from '../core/pdf/graphics.js';
import { FlutterGraphics } from '../core/pdf/flutter-graphics.js';

/**
 * Represents a positioned widget in the render tree
 */
export interface RenderObject {
    /** The widget being rendered */
    widget: Widget;
    /** Position of the widget relative to its parent */
    position: Point;
    /** Size of the widget after layout */
    size: Size;
    /** Layout result from constraint solving */
    layoutResult: LayoutResult;
    /** Child render objects */
    children: RenderObject[];
    /** Parent render object */
    parent?: RenderObject;
    /** Transformation matrix for this render object */
    transform: Matrix4;
    /** Whether this render object needs repainting */
    needsRepaint: boolean;
}

/**
 * Layout and rendering pipeline that manages the complete
 * widget layout and paint process
 */
export class RenderPipeline {
    private readonly constraintSolver: ConstraintSolver;
    private renderTree?: RenderObject;
    private readonly transformStack: Matrix4[] = [];

    constructor(constraintSolver: ConstraintSolver = globalConstraintSolver) {
        this.constraintSolver = constraintSolver;
    }

    /**
     * Build the complete render tree from a widget tree
     */
    buildRenderTree(
        rootWidget: Widget,
        context: LayoutContext,
        options: {
            enablePerformanceMonitoring?: boolean;
            validateConstraints?: boolean;
        } = {}
    ): RenderObject {
        const { enablePerformanceMonitoring = false, validateConstraints = true } = options;

        const buildNode = (
            widget: Widget,
            context: LayoutContext,
            parent?: RenderObject
        ): RenderObject => {
            const layoutOperation = () => {
                return this.constraintSolver.solveLayout(widget, context, {
                    validateConstraints,
                });
            };

            const layoutResult = enablePerformanceMonitoring
                ? globalPerformanceMonitor.measure(
                    widget.debugLabel || widget.constructor.name,
                    layoutOperation
                )
                : layoutOperation();

            const renderObject: RenderObject = {
                widget,
                position: { x: 0, y: 0 }, // Will be set by parent
                size: layoutResult.size,
                layoutResult,
                children: [],
                transform: Matrix4.identity(),
                needsRepaint: layoutResult.needsRepaint,
            };

            if (parent) {
                renderObject.parent = parent;
            }

            // Build children if this is a container widget
            if (this.isContainerWidget(widget)) {
                renderObject.children = this.buildChildrenRenderObjects(
                    widget,
                    context,
                    renderObject
                );
            }

            return renderObject;
        };

        this.renderTree = buildNode(rootWidget, context);
        return this.renderTree;
    }

    /**
     * Perform layout pass on the render tree
     */
    layout(
        renderObject: RenderObject = this.getRenderTree(),
        parentSize?: Size
    ): void {
        // Set positions for children based on layout strategy
        this.positionChildren(renderObject, parentSize);

        // Recursively layout children
        for (const child of renderObject.children) {
            this.layout(child, renderObject.size);
        }
    }

    /**
     * Perform paint pass on the render tree (Flutter coordinates)
     */
    paint(
        graphics: PdfGraphics,
        renderObject: RenderObject = this.getRenderTree(),
        clipRect?: { x: number; y: number; width: number; height: number },
        pageHeight?: number
    ): void {
        // Create FlutterGraphics wrapper for automatic coordinate conversion
        const flutterGraphics = pageHeight
            ? new FlutterGraphics(graphics, pageHeight)
            : graphics;

        // Save graphics state
        flutterGraphics.saveContext();

        // Apply transformation
        if (!this.isIdentityTransform(renderObject.transform)) {
            flutterGraphics.setTransform(renderObject.transform);
        }

        // Translate to widget position (Flutter coordinates: top-left origin)
        const translationMatrix = Matrix4.identity();
        // Set translation in the matrix (simplified - in real Matrix4, this would be more complex)
        translationMatrix.values[12] = renderObject.position.x;
        translationMatrix.values[13] = renderObject.position.y;
        flutterGraphics.setTransform(translationMatrix);

        // Check if widget is within clipping bounds (Flutter coordinates)
        if (clipRect && !this.intersectsClipRect(renderObject, clipRect)) {
            flutterGraphics.restoreContext();
            return;
        }

        // Paint the widget with Flutter coordinates
        const paintContext: PaintContext = {
            graphics: flutterGraphics,
            size: renderObject.size,
            theme: defaultTheme, // Use comprehensive default theme
        };

        renderObject.widget.paint(paintContext);

        // Paint children in order (Flutter coordinates)
        for (const child of renderObject.children) {
            this.paint(graphics, child, clipRect, pageHeight);
        }

        // Restore graphics state
        flutterGraphics.restoreContext();

        // Mark as painted
        renderObject.needsRepaint = false;
    }

    /**
     * Invalidate a render object and mark for repaint
     */
    invalidate(renderObject: RenderObject): void {
        renderObject.needsRepaint = true;

        // Propagate invalidation up the tree
        let parent = renderObject.parent;
        while (parent) {
            parent.needsRepaint = true;
            parent = parent.parent;
        }
    }

    /**
     * Find render object at a specific point
     */
    hitTest(point: Point, renderObject: RenderObject = this.getRenderTree()): RenderObject | undefined {
        // Transform point to local coordinates
        const localPoint = this.transformPointToLocal(point, renderObject);

        // Check if point is within this render object
        if (!this.pointInRect(localPoint, {
            x: 0,
            y: 0,
            width: renderObject.size.width,
            height: renderObject.size.height,
        })) {
            return undefined;
        }

        // Check children first (front to back)
        for (let i = renderObject.children.length - 1; i >= 0; i--) {
            const child = renderObject.children[i]!;
            const hit = this.hitTest(localPoint, child);
            if (hit) {
                return hit;
            }
        }

        // Return this render object if no child was hit
        return renderObject;
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats(): Record<string, any> {
        return globalPerformanceMonitor.getStats();
    }

    /**
     * Clear performance statistics
     */
    clearPerformanceStats(): void {
        globalPerformanceMonitor.clear();
    }

    /**
     * Get the current render tree
     */
    private getRenderTree(): RenderObject {
        if (!this.renderTree) {
            throw new Error('Render tree not built. Call buildRenderTree() first.');
        }
        return this.renderTree;
    }

    /**
     * Check if a widget is a container widget (has children)
     */
    private isContainerWidget(widget: Widget): boolean {
        // In a real implementation, this would check if the widget has children
        // For now, we'll assume it's a container if it has certain properties
        return 'children' in widget || 'child' in widget;
    }

    /**
     * Build render objects for children
     */
    private buildChildrenRenderObjects(
        widget: Widget,
        context: LayoutContext,
        parent: RenderObject
    ): RenderObject[] {
        const children: RenderObject[] = [];

        // This is a simplified implementation
        // In a real implementation, this would extract children from the widget
        if ('children' in widget && Array.isArray((widget as any).children)) {
            const childWidgets = (widget as any).children as Widget[];
            for (const childWidget of childWidgets) {
                const childContext = { ...context }; // Would modify constraints based on parent
                const childRenderObject = this.buildRenderObject(childWidget, childContext, parent);
                children.push(childRenderObject);
            }
        } else if ('child' in widget && (widget as any).child) {
            const childWidget = (widget as any).child as Widget;
            const childContext = { ...context }; // Would modify constraints based on parent
            const childRenderObject = this.buildRenderObject(childWidget, childContext, parent);
            children.push(childRenderObject);
        }

        return children;
    }

    /**
     * Build a single render object
     */
    private buildRenderObject(
        widget: Widget,
        context: LayoutContext,
        parent: RenderObject
    ): RenderObject {
        const layoutResult = this.constraintSolver.solveLayout(widget, context);

        const renderObject: RenderObject = {
            widget,
            position: { x: 0, y: 0 },
            size: layoutResult.size,
            layoutResult,
            children: [],
            parent,
            transform: Matrix4.identity(),
            needsRepaint: layoutResult.needsRepaint,
        };

        // Recursively build children
        if (this.isContainerWidget(widget)) {
            renderObject.children = this.buildChildrenRenderObjects(widget, context, renderObject);
        }

        return renderObject;
    }

    /**
     * Position children within their parent (Flutter coordinates: top-left origin)
     */
    private positionChildren(renderObject: RenderObject, parentSize?: Size): void {
        if (renderObject.children.length === 0) return;

        // Flutter coordinate system: Y increases downward from top-left origin
        // This is a simplified positioning algorithm
        // In a real implementation, this would depend on the layout type (Row, Column, Stack, etc.)

        let currentX = 0;
        let currentY = 0;

        for (const child of renderObject.children) {
            child.position = { x: currentX, y: currentY };

            // Simple horizontal layout for demonstration (Flutter coordinates)
            currentX += child.size.width;

            // If we exceed parent width, wrap to next row (move down in Flutter coordinates)
            if (parentSize && currentX > parentSize.width) {
                currentX = 0;
                currentY += child.size.height; // Move down (Y increases)
            }
        }
    }

    /**
     * Check if a transformation matrix is identity
     */
    private isIdentityTransform(matrix: Matrix4): boolean {
        const values = matrix.values;
        return (
            values[0] === 1 && values[1] === 0 && values[2] === 0 && values[3] === 0 &&
            values[4] === 0 && values[5] === 1 && values[6] === 0 && values[7] === 0 &&
            values[8] === 0 && values[9] === 0 && values[10] === 1 && values[11] === 0 &&
            values[12] === 0 && values[13] === 0 && values[14] === 0 && values[15] === 1
        );
    }

    /**
     * Check if render object intersects with clipping rectangle
     */
    private intersectsClipRect(
        renderObject: RenderObject,
        clipRect: { x: number; y: number; width: number; height: number }
    ): boolean {
        const objRect = {
            x: renderObject.position.x,
            y: renderObject.position.y,
            width: renderObject.size.width,
            height: renderObject.size.height,
        };

        return !(
            objRect.x + objRect.width < clipRect.x ||
            objRect.y + objRect.height < clipRect.y ||
            objRect.x > clipRect.x + clipRect.width ||
            objRect.y > clipRect.y + clipRect.height
        );
    }

    /**
     * Transform point to local coordinates
     */
    private transformPointToLocal(point: Point, renderObject: RenderObject): Point {
        // This is a simplified transformation
        // In a real implementation, this would apply the inverse transformation matrix
        return {
            x: point.x - renderObject.position.x,
            y: point.y - renderObject.position.y,
        };
    }

    /**
     * Check if point is within rectangle
     */
    private pointInRect(
        point: Point,
        rect: { x: number; y: number; width: number; height: number }
    ): boolean {
        return (
            point.x >= rect.x &&
            point.x <= rect.x + rect.width &&
            point.y >= rect.y &&
            point.y <= rect.y + rect.height
        );
    }

    // Removed getDefaultTheme - using defaultTheme from comprehensive theming system
}

/**
 * Global render pipeline instance
 */
export const globalRenderPipeline = new RenderPipeline();