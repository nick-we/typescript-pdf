/**
 * Type system tests
 * 
 * Tests for geometry types and core type utilities
 * 
 * @packageDocumentation
 */

import type { Point, Size, Rect, Matrix } from '../types/geometry.js';
import { BoxConstraints, EdgeInsets, Alignment, AlignmentUtils, defaultTheme } from '../types/layout.js';
import { FontWeight } from '../types/theming.js';

describe('Type System Tests', () => {
    describe('Geometry Types', () => {
        test('should work with Point interface', () => {
            const point: Point = { x: 10, y: 20 };
            expect(point.x).toBe(10);
            expect(point.y).toBe(20);
        });

        test('should work with Size interface', () => {
            const size: Size = { width: 100, height: 50 };
            expect(size.width).toBe(100);
            expect(size.height).toBe(50);
        });

        test('should work with Rect interface', () => {
            const rect: Rect = { x: 10, y: 20, width: 100, height: 50 };
            expect(rect.x).toBe(10);
            expect(rect.y).toBe(20);
            expect(rect.width).toBe(100);
            expect(rect.height).toBe(50);
        });

        test('should work with Matrix interface', () => {
            const matrix: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
            expect(matrix.a).toBe(1);
            expect(matrix.d).toBe(1);
        });
    });

    describe('BoxConstraints edge cases', () => {
        test('should handle very large constraints', () => {
            const large = BoxConstraints.expand(10000, 10000);
            expect(large.maxWidth).toBe(10000);
            expect(large.maxHeight).toBe(10000);
        });

        test('should handle zero constraints', () => {
            const zero = BoxConstraints.tight({ width: 0, height: 0 });
            expect(zero.minWidth).toBe(0);
            expect(zero.maxWidth).toBe(0);
        });

        test('should handle partial constraints', () => {
            const partial = BoxConstraints.tightFor(100);
            expect(partial.minWidth).toBe(100);
            expect(partial.maxWidth).toBe(100);
        });

        test('should validate infinite constraints', () => {
            const infinite = {
                minWidth: 0,
                maxWidth: Number.POSITIVE_INFINITY,
                minHeight: 0,
                maxHeight: Number.POSITIVE_INFINITY,
            };
            expect(BoxConstraints.isValid(infinite)).toBe(true);
        });

        test('should reject negative constraints', () => {
            const negative = {
                minWidth: -10,
                maxWidth: 100,
                minHeight: 0,
                maxHeight: 100,
            };
            expect(BoxConstraints.isValid(negative)).toBe(false);
        });
    });

    describe('EdgeInsets edge cases', () => {
        test('should handle negative insets', () => {
            const negative = EdgeInsets.all(-5);
            expect(EdgeInsets.horizontal(negative)).toBe(-10);
            expect(EdgeInsets.vertical(negative)).toBe(-10);
        });

        test('should handle asymmetric insets', () => {
            const asymmetric = EdgeInsets.only({
                top: 10,
                left: 5,
            });
            expect(asymmetric.top).toBe(10);
            expect(asymmetric.right).toBe(0);
            expect(asymmetric.bottom).toBe(0);
            expect(asymmetric.left).toBe(5);
        });

        test('should deflate size to minimum zero', () => {
            const large = EdgeInsets.all(100);
            const small = { width: 50, height: 30 };
            const deflated = EdgeInsets.deflateSize(large, small);
            expect(deflated.width).toBe(0);
            expect(deflated.height).toBe(0);
        });

        test('should deflate constraints correctly', () => {
            const insets = EdgeInsets.symmetric({ horizontal: 20, vertical: 10 });
            const constraints = BoxConstraints.loose({ width: 200, height: 100 });
            const deflated = EdgeInsets.deflateConstraints(insets, constraints);

            expect(deflated.maxWidth).toBe(160); // 200 - 40
            expect(deflated.maxHeight).toBe(80); // 100 - 20
        });
    });

    describe('Default Theme', () => {
        test('should have sensible defaults', () => {
            expect(defaultTheme.defaultTextStyle.fontSize).toBe(12);
            expect(defaultTheme.defaultTextStyle.fontWeight).toBe(FontWeight.Normal);
            expect(defaultTheme.colorScheme.primary).toBe('#1976d2');
            expect(defaultTheme.colorScheme.background).toBe('#ffffff');
        });
    });

    describe('AlignmentUtils edge cases', () => {
        test('should handle equal container and child sizes', () => {
            const size = { width: 100, height: 50 };
            const position = AlignmentUtils.resolve(Alignment.Center, size, size);
            expect(position).toEqual({ x: 0, y: 0 });
        });

        test('should handle child larger than container', () => {
            const containerSize = { width: 50, height: 25 };
            const childSize = { width: 100, height: 50 };
            const position = AlignmentUtils.resolve(Alignment.TopLeft, containerSize, childSize);
            // AlignmentUtils clamps negative offsets to 0
            expect(position).toEqual({ x: 0, y: 0 });
        });

        test('should handle zero-sized container', () => {
            const containerSize = { width: 0, height: 0 };
            const childSize = { width: 10, height: 5 };
            const position = AlignmentUtils.resolve(Alignment.Center, containerSize, childSize);
            expect(position).toEqual({ x: -5, y: -2.5 });
        });
    });
});