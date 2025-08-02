/**
 * Coordinate Transformation System
 * 
 * Implements coordinate transformations for the layout system,
 * handling translations, rotations, scaling, and coordinate space conversions.
 * 
 * @packageDocumentation
 */

import type { Point, Size } from '../types/geometry.js';
import { Matrix4 } from '../core/pdf/graphics.js';

/**
 * Coordinate system types for clarity and type safety
 */
export enum CoordinateSystem {
    /** Flutter/Widget coordinates: top-left origin, Y increases downward */
    Flutter = 'flutter',
    /** PDF coordinates: bottom-left origin, Y increases upward */
    PDF = 'pdf',
}

/**
 * Point with coordinate system context
 */
export interface CoordinatedPoint extends Point {
    /** The coordinate system this point is in */
    coordinateSystem: CoordinateSystem;
}

/**
 * Size with coordinate system context (sizes are the same in both systems)
 */
export interface CoordinatedSize extends Size {
    /** The coordinate system this size is associated with */
    coordinateSystem: CoordinateSystem;
}

/**
 * Rectangle with coordinate system context
 */
export interface CoordinatedRect {
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateSystem: CoordinateSystem;
}

/**
 * 2D transformation matrix for coordinate transformations
 */
export class Transform2D {
    private readonly matrix: number[];

    constructor(matrix?: number[]) {
        if (matrix && matrix.length === 6) {
            this.matrix = [...matrix];
        } else {
            // Identity matrix [a, b, c, d, tx, ty]
            this.matrix = [1, 0, 0, 1, 0, 0];
        }
    }

    /**
     * Create identity transform
     */
    static identity(): Transform2D {
        return new Transform2D();
    }

    /**
     * Create translation transform
     */
    static translation(tx: number, ty: number): Transform2D {
        return new Transform2D([1, 0, 0, 1, tx, ty]);
    }

    /**
     * Create rotation transform
     */
    static rotation(angle: number): Transform2D {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Transform2D([cos, sin, -sin, cos, 0, 0]);
    }

    /**
     * Create scaling transform
     */
    static scaling(sx: number, sy: number = sx): Transform2D {
        return new Transform2D([sx, 0, 0, sy, 0, 0]);
    }

    /**
     * Create rotation around a point
     */
    static rotationAround(angle: number, center: Point): Transform2D {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const tx = center.x - cos * center.x + sin * center.y;
        const ty = center.y - sin * center.x - cos * center.y;
        return new Transform2D([cos, sin, -sin, cos, tx, ty]);
    }

    /**
     * Create Flutter-to-PDF coordinate transformation
     * This flips the Y-axis and translates appropriately
     */
    static flutterToPdfTransform(pageHeight: number): Transform2D {
        // Scale Y by -1 and translate by pageHeight to flip coordinate system
        return new Transform2D([1, 0, 0, -1, 0, pageHeight]);
    }

    /**
     * Create PDF-to-Flutter coordinate transformation
     * This is the inverse of flutterToPdfTransform
     */
    static pdfToFlutterTransform(pageHeight: number): Transform2D {
        // Scale Y by -1 and translate by pageHeight to flip coordinate system back
        return new Transform2D([1, 0, 0, -1, 0, pageHeight]);
    }

    /**
     * Multiply this transform with another
     */
    multiply(other: Transform2D): Transform2D {
        const a = this.matrix;
        const b = other.matrix;

        return new Transform2D([
            a[0]! * b[0]! + a[1]! * b[2]!,     // a
            a[0]! * b[1]! + a[1]! * b[3]!,     // b
            a[2]! * b[0]! + a[3]! * b[2]!,     // c
            a[2]! * b[1]! + a[3]! * b[3]!,     // d
            a[4]! * b[0]! + a[5]! * b[2]! + b[4]!, // tx
            a[4]! * b[1]! + a[5]! * b[3]! + b[5]!, // ty
        ]);
    }

    /**
     * Transform a point
     */
    transformPoint(point: Point): Point {
        const [a, b, c, d, tx, ty] = this.matrix;
        return {
            x: a! * point.x + c! * point.y + tx!,
            y: b! * point.x + d! * point.y + ty!,
        };
    }

    /**
     * Transform a size (ignores translation)
     */
    transformSize(size: Size): Size {
        const [a, b, c, d] = this.matrix;
        return {
            width: Math.abs(a! * size.width) + Math.abs(c! * size.height),
            height: Math.abs(b! * size.width) + Math.abs(d! * size.height),
        };
    }

    /**
     * Get the inverse transform
     */
    inverse(): Transform2D {
        const [a, b, c, d, tx, ty] = this.matrix;
        const det = a! * d! - b! * c!;

        if (Math.abs(det!) < 1e-10) {
            throw new Error('Transform is not invertible');
        }

        const invDet = 1 / det!;
        return new Transform2D([
            d! * invDet,
            -b! * invDet,
            -c! * invDet,
            a! * invDet,
            (c! * ty! - d! * tx!) * invDet,
            (b! * tx! - a! * ty!) * invDet,
        ]);
    }

    /**
     * Check if this is an identity transform
     */
    isIdentity(): boolean {
        const [a, b, c, d, tx, ty] = this.matrix;
        return (
            Math.abs(a! - 1) < 1e-10 &&
            Math.abs(b!) < 1e-10 &&
            Math.abs(c!) < 1e-10 &&
            Math.abs(d! - 1) < 1e-10 &&
            Math.abs(tx!) < 1e-10 &&
            Math.abs(ty!) < 1e-10
        );
    }

    /**
     * Get the translation component
     */
    getTranslation(): Point {
        return { x: this.matrix[4]!, y: this.matrix[5]! };
    }

    /**
     * Get the scale factors
     */
    getScale(): { x: number; y: number } {
        const [a, b, c, d] = this.matrix;
        return {
            x: Math.sqrt(a! * a! + b! * b!),
            y: Math.sqrt(c! * c! + d! * d!),
        };
    }

    /**
     * Get the rotation angle
     */
    getRotation(): number {
        const [a, b] = this.matrix;
        return Math.atan2(b!, a!);
    }

    /**
     * Convert to Matrix4 for PDF graphics
     */
    toMatrix4(): Matrix4 {
        const [a, b, c, d, tx, ty] = this.matrix;
        return new Matrix4([
            a!, b!, 0, 0,
            c!, d!, 0, 0,
            0, 0, 1, 0,
            tx!, ty!, 0, 1,
        ]);
    }

    /**
     * Get the raw matrix values
     */
    get values(): readonly number[] {
        return this.matrix;
    }

    /**
     * Clone this transform
     */
    clone(): Transform2D {
        return new Transform2D([...this.matrix]);
    }
}

/**
 * Coordinate space converter for different coordinate systems
 *
 * This system follows Flutter/dart-pdf conventions:
 * - Flutter coordinates: top-left origin, Y increases downward (used internally)
 * - PDF coordinates: bottom-left origin, Y increases upward (used for final output)
 */
export class CoordinateSpace {
    /**
     * Convert from Flutter coordinates (top-left origin) to PDF coordinates (bottom-left origin)
     * This is used when outputting to the PDF graphics context
     */
    static flutterToPdf(point: Point, pageHeight: number): Point {
        return {
            x: point.x,
            y: pageHeight - point.y,
        };
    }

    /**
     * Convert from PDF coordinates (bottom-left origin) to Flutter coordinates (top-left origin)
     * This is used when reading from PDF or converting existing coordinates
     */
    static pdfToFlutter(point: Point, pageHeight: number): Point {
        return {
            x: point.x,
            y: pageHeight - point.y,
        };
    }

    /**
     * Convert flutter rectangle to PDF rectangle
     */
    static flutterRectToPdf(rect: { x: number; y: number; width: number; height: number }, pageHeight: number): { x: number; y: number; width: number; height: number } {
        return {
            x: rect.x,
            y: pageHeight - rect.y - rect.height, // Bottom edge of rectangle in PDF coordinates
            width: rect.width,
            height: rect.height,
        };
    }

    /**
     * Convert PDF rectangle to Flutter rectangle
     */
    static pdfRectToFlutter(rect: { x: number; y: number; width: number; height: number }, pageHeight: number): { x: number; y: number; width: number; height: number } {
        return {
            x: rect.x,
            y: pageHeight - rect.y - rect.height, // Top edge of rectangle in Flutter coordinates
            width: rect.width,
            height: rect.height,
        };
    }

    /**
     * Convert a size from one DPI to another
     */
    static convertDpi(size: Size, fromDpi: number, toDpi: number): Size {
        const scale = toDpi / fromDpi;
        return {
            width: size.width * scale,
            height: size.height * scale,
        };
    }

    /**
     * Convert points to pixels
     */
    static pointsToPixels(points: number, dpi: number = 72): number {
        return (points * dpi) / 72;
    }

    /**
     * Convert pixels to points
     */
    static pixelsToPoints(pixels: number, dpi: number = 72): number {
        return (pixels * 72) / dpi;
    }

    /**
     * Convert inches to points
     */
    static inchesToPoints(inches: number): number {
        return inches * 72;
    }

    /**
     * Convert points to inches
     */
    static pointsToInches(points: number): number {
        return points / 72;
    }

    /**
     * Convert millimeters to points
     */
    static mmToPoints(mm: number): number {
        return (mm * 72) / 25.4;
    }

    /**
     * Convert points to millimeters
     */
    static pointsToMm(points: number): number {
        return (points * 25.4) / 72;
    }

    /**
     * Convert from PDF coordinates to screen coordinates
     * This is an alias for pdfToFlutter for backward compatibility
     */
    static pdfToScreen(point: Point, pageHeight: number): Point {
        return this.pdfToFlutter(point, pageHeight);
    }

    /**
     * Convert from screen coordinates to PDF coordinates
     * This is an alias for flutterToPdf for backward compatibility
     */
    static screenToPdf(point: Point, pageHeight: number): Point {
        return this.flutterToPdf(point, pageHeight);
    }

    /**
     * Create a coordinated point in Flutter coordinate system
     */
    static createFlutterPoint(x: number, y: number): CoordinatedPoint {
        return {
            x,
            y,
            coordinateSystem: CoordinateSystem.Flutter,
        };
    }

    /**
     * Create a coordinated point in PDF coordinate system
     */
    static createPdfPoint(x: number, y: number): CoordinatedPoint {
        return {
            x,
            y,
            coordinateSystem: CoordinateSystem.PDF,
        };
    }

    /**
     * Convert any coordinated point to Flutter coordinates
     */
    static toFlutter(point: CoordinatedPoint, pageHeight: number): CoordinatedPoint {
        if (point.coordinateSystem === CoordinateSystem.Flutter) {
            return point;
        }
        const converted = this.pdfToFlutter(point, pageHeight);
        return {
            ...converted,
            coordinateSystem: CoordinateSystem.Flutter,
        };
    }

    /**
     * Convert any coordinated point to PDF coordinates
     */
    static toPdf(point: CoordinatedPoint, pageHeight: number): CoordinatedPoint {
        if (point.coordinateSystem === CoordinateSystem.PDF) {
            return point;
        }
        const converted = this.flutterToPdf(point, pageHeight);
        return {
            ...converted,
            coordinateSystem: CoordinateSystem.PDF,
        };
    }
}

/**
 * Flutter coordinate system manager - provides utilities for working with Flutter coordinates
 * This follows the same conventions as dart-pdf for consistency
 */
export class FlutterCoordinates {
    /**
     * Create a point in Flutter coordinate system (top-left origin)
     */
    static point(x: number, y: number): CoordinatedPoint {
        return CoordinateSpace.createFlutterPoint(x, y);
    }

    /**
     * Create a size (same in both coordinate systems)
     */
    static size(width: number, height: number): CoordinatedSize {
        return {
            width,
            height,
            coordinateSystem: CoordinateSystem.Flutter,
        };
    }

    /**
     * Create a rectangle in Flutter coordinate system
     */
    static rect(x: number, y: number, width: number, height: number): CoordinatedRect {
        return {
            x,
            y,
            width,
            height,
            coordinateSystem: CoordinateSystem.Flutter,
        };
    }

    /**
     * Translate a point by an offset (both in Flutter coordinates)
     */
    static translate(point: CoordinatedPoint, offset: Point): CoordinatedPoint {
        if (point.coordinateSystem !== CoordinateSystem.Flutter) {
            throw new Error('Point must be in Flutter coordinate system');
        }
        return this.point(point.x + offset.x, point.y + offset.y);
    }

    /**
     * Get the bottom-right corner of a rectangle in Flutter coordinates
     */
    static bottomRight(rect: CoordinatedRect): CoordinatedPoint {
        if (rect.coordinateSystem !== CoordinateSystem.Flutter) {
            throw new Error('Rectangle must be in Flutter coordinate system');
        }
        return this.point(rect.x + rect.width, rect.y + rect.height);
    }

    /**
     * Get the center point of a rectangle in Flutter coordinates
     */
    static center(rect: CoordinatedRect): CoordinatedPoint {
        if (rect.coordinateSystem !== CoordinateSystem.Flutter) {
            throw new Error('Rectangle must be in Flutter coordinate system');
        }
        return this.point(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2
        );
    }
}

/**
 * Transformation stack for managing nested coordinate transformations
 */
export class TransformStack {
    private readonly stack: Transform2D[] = [];
    private current: Transform2D = Transform2D.identity();

    /**
     * Push a new transform onto the stack
     */
    push(transform: Transform2D): void {
        this.stack.push(this.current.clone());
        this.current = this.current.multiply(transform);
    }

    /**
     * Pop the last transform from the stack
     */
    pop(): void {
        if (this.stack.length === 0) {
            throw new Error('Transform stack is empty');
        }
        this.current = this.stack.pop()!;
    }

    /**
     * Get the current combined transform
     */
    getCurrent(): Transform2D {
        return this.current.clone();
    }

    /**
     * Transform a point using the current transform
     */
    transformPoint(point: Point): Point {
        return this.current.transformPoint(point);
    }

    /**
     * Transform a size using the current transform
     */
    transformSize(size: Size): Size {
        return this.current.transformSize(size);
    }

    /**
     * Clear the transform stack
     */
    clear(): void {
        this.stack.length = 0;
        this.current = Transform2D.identity();
    }

    /**
     * Get the stack depth
     */
    get depth(): number {
        return this.stack.length;
    }
}

/**
 * Bounds calculator for transformed objects
 */
export class BoundsCalculator {
    /**
     * Calculate the bounding box of a rectangle after transformation
     */
    static transformBounds(
        bounds: { x: number; y: number; width: number; height: number },
        transform: Transform2D
    ): { x: number; y: number; width: number; height: number } {
        // Get all four corners
        const corners = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x, y: bounds.y + bounds.height },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        ];

        // Transform all corners
        const transformedCorners = corners.map(corner => transform.transformPoint(corner));

        // Find min/max of transformed corners
        let minX = transformedCorners[0]!.x;
        let maxX = transformedCorners[0]!.x;
        let minY = transformedCorners[0]!.y;
        let maxY = transformedCorners[0]!.y;

        for (const corner of transformedCorners) {
            minX = Math.min(minX, corner.x);
            maxX = Math.max(maxX, corner.x);
            minY = Math.min(minY, corner.y);
            maxY = Math.max(maxY, corner.y);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }

    /**
     * Calculate the bounding box of a coordinated rectangle after transformation
     */
    static transformCoordinatedBounds(
        bounds: CoordinatedRect,
        transform: Transform2D
    ): CoordinatedRect {
        const transformedBounds = this.transformBounds(bounds, transform);
        return {
            ...transformedBounds,
            coordinateSystem: bounds.coordinateSystem,
        };
    }

    /**
     * Check if two transformed bounds intersect
     */
    static boundsIntersect(
        bounds1: { x: number; y: number; width: number; height: number },
        bounds2: { x: number; y: number; width: number; height: number }
    ): boolean {
        return !(
            bounds1.x + bounds1.width < bounds2.x ||
            bounds1.y + bounds1.height < bounds2.y ||
            bounds1.x > bounds2.x + bounds2.width ||
            bounds1.y > bounds2.y + bounds2.height
        );
    }

    /**
     * Calculate the union of multiple bounds
     */
    static unionBounds(
        bounds: Array<{ x: number; y: number; width: number; height: number }>
    ): { x: number; y: number; width: number; height: number } {
        if (bounds.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        let minX = bounds[0]!.x;
        let maxX = bounds[0]!.x + bounds[0]!.width;
        let minY = bounds[0]!.y;
        let maxY = bounds[0]!.y + bounds[0]!.height;

        for (const bound of bounds) {
            minX = Math.min(minX, bound.x);
            maxX = Math.max(maxX, bound.x + bound.width);
            minY = Math.min(minY, bound.y);
            maxY = Math.max(maxY, bound.y + bound.height);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }
}