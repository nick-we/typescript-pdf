/**
 * Unit tests for coordinate transformation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    Transform2D,
    CoordinateSpace,
    TransformStack,
    BoundsCalculator,
} from '../layout/coordinate-transform.js';
import { Matrix4 } from '../core/pdf/graphics.js';
import type { Point, Size } from '../types/geometry.js';

describe('Transform2D', () => {
    describe('constructor', () => {
        it('should create identity transform by default', () => {
            const transform = new Transform2D();
            expect(transform.values).toEqual([1, 0, 0, 1, 0, 0]);
        });

        it('should create transform with provided matrix', () => {
            const matrix = [2, 0, 0, 2, 10, 20];
            const transform = new Transform2D(matrix);
            expect(transform.values).toEqual([2, 0, 0, 2, 10, 20]);
        });

        it('should create identity transform with invalid matrix', () => {
            const transform = new Transform2D([1, 2, 3]); // Wrong length
            expect(transform.values).toEqual([1, 0, 0, 1, 0, 0]);
        });
    });

    describe('static factory methods', () => {
        it('should create identity transform', () => {
            const transform = Transform2D.identity();
            expect(transform.values).toEqual([1, 0, 0, 1, 0, 0]);
        });

        it('should create translation transform', () => {
            const transform = Transform2D.translation(10, 20);
            expect(transform.values).toEqual([1, 0, 0, 1, 10, 20]);
        });

        it('should create rotation transform', () => {
            const angle = Math.PI / 2; // 90 degrees
            const transform = Transform2D.rotation(angle);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            expect(transform.values[0]).toBeCloseTo(cos, 10);
            expect(transform.values[1]).toBeCloseTo(sin, 10);
            expect(transform.values[2]).toBeCloseTo(-sin, 10);
            expect(transform.values[3]).toBeCloseTo(cos, 10);
            expect(transform.values[4]).toBe(0);
            expect(transform.values[5]).toBe(0);
        });

        it('should create scaling transform', () => {
            const transform = Transform2D.scaling(2, 3);
            expect(transform.values).toEqual([2, 0, 0, 3, 0, 0]);
        });

        it('should create uniform scaling transform', () => {
            const transform = Transform2D.scaling(2);
            expect(transform.values).toEqual([2, 0, 0, 2, 0, 0]);
        });

        it('should create rotation around point', () => {
            const angle = Math.PI / 2; // 90 degrees
            const center = { x: 10, y: 10 };
            const transform = Transform2D.rotationAround(angle, center);

            // The transform should rotate around the given center point
            const transformedCenter = transform.transformPoint(center);
            expect(transformedCenter.x).toBeCloseTo(center.x, 10);
            expect(transformedCenter.y).toBeCloseTo(center.y, 10);
        });
    });

    describe('multiply', () => {
        it('should multiply transforms correctly', () => {
            const t1 = Transform2D.translation(10, 20);
            const t2 = Transform2D.scaling(2, 3);
            const result = t1.multiply(t2);

            // Should be translate then scale (matrix multiplication order)
            expect(result.values).toEqual([2, 0, 0, 3, 20, 60]);
        });

        it('should multiply rotation and translation', () => {
            const t1 = Transform2D.rotation(Math.PI / 2);
            const t2 = Transform2D.translation(10, 0);
            const result = t1.multiply(t2);

            // Transform origin point (0,0) - rotation then translation
            const point = result.transformPoint({ x: 0, y: 0 });
            expect(point.x).toBeCloseTo(10, 10);
            expect(point.y).toBeCloseTo(0, 10);
        });
    });

    describe('transformPoint', () => {
        it('should transform point with translation', () => {
            const transform = Transform2D.translation(10, 20);
            const point = transform.transformPoint({ x: 5, y: 5 });
            expect(point).toEqual({ x: 15, y: 25 });
        });

        it('should transform point with scaling', () => {
            const transform = Transform2D.scaling(2, 3);
            const point = transform.transformPoint({ x: 10, y: 10 });
            expect(point).toEqual({ x: 20, y: 30 });
        });

        it('should transform point with rotation', () => {
            const transform = Transform2D.rotation(Math.PI / 2);
            const point = transform.transformPoint({ x: 10, y: 0 });
            expect(point.x).toBeCloseTo(0, 10);
            expect(point.y).toBeCloseTo(10, 10);
        });
    });

    describe('transformSize', () => {
        it('should transform size ignoring translation', () => {
            const transform = Transform2D.translation(100, 100);
            const size = transform.transformSize({ width: 10, height: 20 });
            expect(size).toEqual({ width: 10, height: 20 });
        });

        it('should transform size with scaling', () => {
            const transform = Transform2D.scaling(2, 3);
            const size = transform.transformSize({ width: 10, height: 20 });
            expect(size).toEqual({ width: 20, height: 60 });
        });

        it('should transform size with rotation', () => {
            const transform = Transform2D.rotation(Math.PI / 2);
            const size = transform.transformSize({ width: 10, height: 20 });
            // After 90° rotation, width becomes height and vice versa
            expect(size.width).toBeCloseTo(20, 10);
            expect(size.height).toBeCloseTo(10, 10);
        });
    });

    describe('inverse', () => {
        it('should calculate inverse of translation', () => {
            const transform = Transform2D.translation(10, 20);
            const inverse = transform.inverse();
            const identity = transform.multiply(inverse);

            expect(identity.values[0]).toBeCloseTo(1, 10);
            expect(identity.values[1]).toBeCloseTo(0, 10);
            expect(identity.values[2]).toBeCloseTo(0, 10);
            expect(identity.values[3]).toBeCloseTo(1, 10);
            expect(identity.values[4]).toBeCloseTo(0, 10);
            expect(identity.values[5]).toBeCloseTo(0, 10);
        });

        it('should calculate inverse of scaling', () => {
            const transform = Transform2D.scaling(2, 3);
            const inverse = transform.inverse();
            // Use toBeCloseTo for floating point comparison
            expect(inverse.values[0]).toBeCloseTo(0.5, 10);
            expect(inverse.values[1]).toBeCloseTo(0, 10);
            expect(inverse.values[2]).toBeCloseTo(0, 10);
            expect(inverse.values[3]).toBeCloseTo(1 / 3, 10);
            expect(inverse.values[4]).toBeCloseTo(0, 10);
            expect(inverse.values[5]).toBeCloseTo(0, 10);
        });

        it('should throw error for non-invertible matrix', () => {
            const transform = new Transform2D([0, 0, 0, 0, 0, 0]); // Determinant = 0
            expect(() => transform.inverse()).toThrow('Transform is not invertible');
        });
    });

    describe('isIdentity', () => {
        it('should identify identity transform', () => {
            const transform = Transform2D.identity();
            expect(transform.isIdentity()).toBe(true);
        });

        it('should identify non-identity transform', () => {
            const transform = Transform2D.translation(1, 0);
            expect(transform.isIdentity()).toBe(false);
        });

        it('should handle floating point precision', () => {
            const transform = new Transform2D([1.00000000001, 0, 0, 1, 0, 0]); // Smaller precision error
            expect(transform.isIdentity()).toBe(true);
        });
    });

    describe('property getters', () => {
        it('should get translation', () => {
            const transform = Transform2D.translation(10, 20);
            expect(transform.getTranslation()).toEqual({ x: 10, y: 20 });
        });

        it('should get scale', () => {
            const transform = Transform2D.scaling(2, 3);
            const scale = transform.getScale();
            expect(scale.x).toBeCloseTo(2, 10);
            expect(scale.y).toBeCloseTo(3, 10);
        });

        it('should get rotation', () => {
            const angle = Math.PI / 4; // 45 degrees
            const transform = Transform2D.rotation(angle);
            expect(transform.getRotation()).toBeCloseTo(angle, 10);
        });
    });

    describe('toMatrix4', () => {
        it('should convert to Matrix4', () => {
            const transform = Transform2D.translation(10, 20);
            const matrix4 = transform.toMatrix4();
            expect(matrix4).toBeInstanceOf(Matrix4);
        });
    });

    describe('clone', () => {
        it('should create independent copy', () => {
            const original = Transform2D.translation(10, 20);
            const clone = original.clone();

            expect(clone.values).toEqual(original.values);
            expect(clone).not.toBe(original);
        });
    });
});

describe('CoordinateSpace', () => {
    describe('PDF coordinate conversion', () => {
        it('should convert PDF to screen coordinates', () => {
            const pdfPoint = { x: 100, y: 200 };
            const pageHeight = 800;
            const screenPoint = CoordinateSpace.pdfToScreen(pdfPoint, pageHeight);
            expect(screenPoint).toEqual({ x: 100, y: 600 }); // 800 - 200
        });

        it('should convert screen to PDF coordinates', () => {
            const screenPoint = { x: 100, y: 600 };
            const pageHeight = 800;
            const pdfPoint = CoordinateSpace.screenToPdf(screenPoint, pageHeight);
            expect(pdfPoint).toEqual({ x: 100, y: 200 }); // 800 - 600
        });
    });

    describe('DPI conversion', () => {
        it('should convert size between different DPI', () => {
            const size = { width: 72, height: 72 };
            const converted = CoordinateSpace.convertDpi(size, 72, 144);
            expect(converted).toEqual({ width: 144, height: 144 });
        });

        it('should handle same DPI', () => {
            const size = { width: 100, height: 200 };
            const converted = CoordinateSpace.convertDpi(size, 72, 72);
            expect(converted).toEqual(size);
        });
    });

    describe('points and pixels conversion', () => {
        it('should convert points to pixels', () => {
            const pixels = CoordinateSpace.pointsToPixels(72, 72);
            expect(pixels).toBe(72);
        });

        it('should convert points to pixels with different DPI', () => {
            const pixels = CoordinateSpace.pointsToPixels(72, 144);
            expect(pixels).toBe(144);
        });

        it('should convert pixels to points', () => {
            const points = CoordinateSpace.pixelsToPoints(72, 72);
            expect(points).toBe(72);
        });

        it('should use default DPI', () => {
            const pixels = CoordinateSpace.pointsToPixels(72);
            expect(pixels).toBe(72);
        });
    });

    describe('inches conversion', () => {
        it('should convert inches to points', () => {
            const points = CoordinateSpace.inchesToPoints(1);
            expect(points).toBe(72);
        });

        it('should convert points to inches', () => {
            const inches = CoordinateSpace.pointsToInches(72);
            expect(inches).toBe(1);
        });
    });

    describe('millimeters conversion', () => {
        it('should convert millimeters to points', () => {
            const points = CoordinateSpace.mmToPoints(25.4);
            expect(points).toBeCloseTo(72, 1);
        });

        it('should convert points to millimeters', () => {
            const mm = CoordinateSpace.pointsToMm(72);
            expect(mm).toBeCloseTo(25.4, 1);
        });
    });
});

describe('TransformStack', () => {
    let stack: TransformStack;

    beforeEach(() => {
        stack = new TransformStack();
    });

    describe('push and pop', () => {
        it('should start with identity transform', () => {
            const current = stack.getCurrent();
            expect(current.isIdentity()).toBe(true);
        });

        it('should push and accumulate transforms', () => {
            const translation = Transform2D.translation(10, 20);
            stack.push(translation);

            const current = stack.getCurrent();
            expect(current.getTranslation()).toEqual({ x: 10, y: 20 });
        });

        it('should accumulate multiple transforms', () => {
            stack.push(Transform2D.translation(10, 20));
            stack.push(Transform2D.scaling(2, 2));

            const current = stack.getCurrent();
            const point = current.transformPoint({ x: 5, y: 5 });
            // Should translate first (5+10, 5+20) then scale ((15*2, 25*2))
            expect(point).toEqual({ x: 30, y: 50 });
        });

        it('should restore previous transform on pop', () => {
            stack.push(Transform2D.translation(10, 20));
            const afterPush = stack.getCurrent();

            stack.push(Transform2D.scaling(2, 2));
            stack.pop();

            const afterPop = stack.getCurrent();
            expect(afterPop.values).toEqual(afterPush.values);
        });

        it('should throw error when popping empty stack', () => {
            expect(() => stack.pop()).toThrow('Transform stack is empty');
        });
    });

    describe('transform methods', () => {
        it('should transform point using current transform', () => {
            stack.push(Transform2D.translation(10, 20));
            const point = stack.transformPoint({ x: 5, y: 5 });
            expect(point).toEqual({ x: 15, y: 25 });
        });

        it('should transform size using current transform', () => {
            stack.push(Transform2D.scaling(2, 3));
            const size = stack.transformSize({ width: 10, height: 20 });
            expect(size).toEqual({ width: 20, height: 60 });
        });
    });

    describe('clear', () => {
        it('should reset to identity transform', () => {
            stack.push(Transform2D.translation(10, 20));
            stack.push(Transform2D.scaling(2, 2));

            stack.clear();

            expect(stack.depth).toBe(0);
            expect(stack.getCurrent().isIdentity()).toBe(true);
        });
    });

    describe('depth', () => {
        it('should track stack depth', () => {
            expect(stack.depth).toBe(0);

            stack.push(Transform2D.translation(10, 20));
            expect(stack.depth).toBe(1);

            stack.push(Transform2D.scaling(2, 2));
            expect(stack.depth).toBe(2);

            stack.pop();
            expect(stack.depth).toBe(1);
        });
    });
});

describe('BoundsCalculator', () => {
    describe('transformBounds', () => {
        it('should transform axis-aligned rectangle', () => {
            const bounds = { x: 0, y: 0, width: 10, height: 20 };
            const transform = Transform2D.translation(5, 10);
            const result = BoundsCalculator.transformBounds(bounds, transform);

            expect(result).toEqual({ x: 5, y: 10, width: 10, height: 20 });
        });

        it('should handle rotation correctly', () => {
            const bounds = { x: 0, y: 0, width: 10, height: 20 };
            const transform = Transform2D.rotation(Math.PI / 2); // 90 degrees
            const result = BoundsCalculator.transformBounds(bounds, transform);

            // After 90° rotation, the rectangle should be rotated
            expect(result.width).toBeCloseTo(20, 10);
            expect(result.height).toBeCloseTo(10, 10);
        });

        it('should handle scaling', () => {
            const bounds = { x: 0, y: 0, width: 10, height: 20 };
            const transform = Transform2D.scaling(2, 3);
            const result = BoundsCalculator.transformBounds(bounds, transform);

            expect(result).toEqual({ x: 0, y: 0, width: 20, height: 60 });
        });
    });

    describe('boundsIntersect', () => {
        it('should detect intersection', () => {
            const bounds1 = { x: 0, y: 0, width: 10, height: 10 };
            const bounds2 = { x: 5, y: 5, width: 10, height: 10 };

            expect(BoundsCalculator.boundsIntersect(bounds1, bounds2)).toBe(true);
        });

        it('should detect no intersection', () => {
            const bounds1 = { x: 0, y: 0, width: 10, height: 10 };
            const bounds2 = { x: 20, y: 20, width: 10, height: 10 };

            expect(BoundsCalculator.boundsIntersect(bounds1, bounds2)).toBe(false);
        });

        it('should handle edge touching', () => {
            const bounds1 = { x: 0, y: 0, width: 10, height: 10 };
            const bounds2 = { x: 10, y: 0, width: 10, height: 10 };

            // The implementation considers edge touching as intersection
            expect(BoundsCalculator.boundsIntersect(bounds1, bounds2)).toBe(true);
        });
    });

    describe('unionBounds', () => {
        it('should return zero bounds for empty array', () => {
            const result = BoundsCalculator.unionBounds([]);
            expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
        });

        it('should return single bounds unchanged', () => {
            const bounds = { x: 10, y: 20, width: 30, height: 40 };
            const result = BoundsCalculator.unionBounds([bounds]);
            expect(result).toEqual(bounds);
        });

        it('should calculate union of multiple bounds', () => {
            const bounds1 = { x: 0, y: 0, width: 10, height: 10 };
            const bounds2 = { x: 5, y: 5, width: 15, height: 15 };
            const bounds3 = { x: -5, y: -5, width: 10, height: 10 };

            const result = BoundsCalculator.unionBounds([bounds1, bounds2, bounds3]);

            expect(result).toEqual({
                x: -5,
                y: -5,
                width: 25, // from -5 to 20
                height: 25, // from -5 to 20
            });
        });

        it('should handle negative coordinates', () => {
            const bounds1 = { x: -10, y: -20, width: 5, height: 10 };
            const bounds2 = { x: 5, y: 10, width: 5, height: 10 };

            const result = BoundsCalculator.unionBounds([bounds1, bounds2]);

            expect(result).toEqual({
                x: -10,
                y: -20,
                width: 20, // from -10 to 10
                height: 40, // from -20 to 20
            });
        });
    });
});