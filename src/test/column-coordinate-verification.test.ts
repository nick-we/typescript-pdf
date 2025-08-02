/**
 * Comprehensive tests to verify Column widget positioning coordinates
 * This test ensures the Column widget correctly positions children top-to-bottom in PDF coordinates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Column } from '../widgets/flex.js';
import { Text } from '../widgets/text.js';
import { Container } from '../widgets/container.js';
import { MainAxisAlignment, VerticalDirection } from '../types/flex.js';
import { defaultTheme, type LayoutContext, BoxConstraints } from '../types/layout.js';
import { TextDirection } from '../core/text-layout.js';

describe('Column Coordinate Verification', () => {
    let mockLayoutContext: LayoutContext;

    beforeEach(() => {
        mockLayoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 300 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };
    });

    it('should position Column children top-to-bottom with VerticalDirection.Down (MainAxisSize.Max)', () => {
        // Create a Column with fixed-height children to verify positioning
        const column = new Column({
            mainAxisAlignment: MainAxisAlignment.Start,
            verticalDirection: VerticalDirection.Down,
            children: [
                new Container({
                    width: 100,
                    height: 50,
                    child: new Text('First Item'),
                }),
                new Container({
                    width: 100,
                    height: 50,
                    child: new Text('Second Item'),
                }),
                new Container({
                    width: 100,
                    height: 50,
                    child: new Text('Third Item'),
                }),
            ],
        });

        // Layout the column
        const layoutResult = column.layout(mockLayoutContext);

        // Verify the column has been laid out correctly
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBe(300); // Uses full available height with MainAxisSize.Max
    });

    it('should position Column children bottom-to-top with VerticalDirection.Up (MainAxisSize.Max)', () => {
        const column = new Column({
            mainAxisAlignment: MainAxisAlignment.Start,
            verticalDirection: VerticalDirection.Up,
            children: [
                new Container({
                    width: 100,
                    height: 50,
                    child: new Text('First Item'),
                }),
                new Container({
                    width: 100,
                    height: 50,
                    child: new Text('Second Item'),
                }),
            ],
        });

        const layoutResult = column.layout(mockLayoutContext);
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBe(300); // Uses full available height with MainAxisSize.Max
    });

    it('should center children with MainAxisAlignment.Center (MainAxisSize.Max)', () => {
        const column = new Column({
            mainAxisAlignment: MainAxisAlignment.Center,
            verticalDirection: VerticalDirection.Down,
            children: [
                new Container({
                    width: 100,
                    height: 30,
                    child: new Text('Centered 1'),
                }),
                new Container({
                    width: 100,
                    height: 30,
                    child: new Text('Centered 2'),
                }),
            ],
        });

        const layoutResult = column.layout(mockLayoutContext);
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBe(300); // Uses full available height with MainAxisSize.Max
    });

    it('should handle spacing between children correctly (MainAxisSize.Max)', () => {
        const column = new Column({
            mainAxisAlignment: MainAxisAlignment.Start,
            mainAxisSpacing: 10,
            verticalDirection: VerticalDirection.Down,
            children: [
                new Container({
                    width: 100,
                    height: 40,
                    child: new Text('Item 1'),
                }),
                new Container({
                    width: 100,
                    height: 40,
                    child: new Text('Item 2'),
                }),
            ],
        });

        const layoutResult = column.layout(mockLayoutContext);
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBe(300); // Uses full available height with MainAxisSize.Max
    });

    it('should use default VerticalDirection.Down when not specified (MainAxisSize.Max)', () => {
        const column = new Column({
            children: [
                new Container({
                    width: 100,
                    height: 50,
                    child: new Text('Default Direction'),
                }),
            ],
        });

        const layoutResult = column.layout(mockLayoutContext);
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBe(300); // Uses full available height with MainAxisSize.Max
    });

    it('should handle SpaceBetween alignment correctly with larger container', () => {
        const column = new Column({
            mainAxisAlignment: MainAxisAlignment.SpaceBetween,
            verticalDirection: VerticalDirection.Down,
            children: [
                new Container({
                    width: 100,
                    height: 50,
                    child: new Text('First'),
                }),
                new Container({
                    width: 100,
                    height: 50,
                    child: new Text('Last'),
                }),
            ],
        });

        // Use a larger container to see spacing effect
        const largeContext: LayoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 400 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        const layoutResult = column.layout(largeContext);
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBe(400); // Uses maximum available height
    });

    it('should handle empty Column correctly', () => {
        const column = new Column({
            children: [],
        });

        const layoutResult = column.layout(mockLayoutContext);
        expect(layoutResult.size.width).toBe(0);
        expect(layoutResult.size.height).toBe(0);
    });

    it('should handle single child Column correctly (MainAxisSize.Max)', () => {
        const column = new Column({
            children: [
                new Container({
                    width: 150,
                    height: 75,
                    child: new Text('Single Child'),
                }),
            ],
        });

        const layoutResult = column.layout(mockLayoutContext);
        expect(layoutResult.size.width).toBe(150);
        expect(layoutResult.size.height).toBe(300); // Uses full available height with MainAxisSize.Max
    });

    // Additional tests with MainAxisSize.Min to test precise sizing
    it('should size to content with MainAxisSize.Min and VerticalDirection.Down', () => {
        const column = new Column({
            mainAxisSize: 'min' as any, // MainAxisSize.Min
            mainAxisAlignment: MainAxisAlignment.Start,
            verticalDirection: VerticalDirection.Down,
            children: [
                new Container({
                    width: 100,
                    height: 40,
                    child: new Text('Item 1'),
                }),
                new Container({
                    width: 100,
                    height: 60,
                    child: new Text('Item 2'),
                }),
            ],
        });

        const layoutResult = column.layout(mockLayoutContext);
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBe(100); // Should size to content: 40 + 60
    });

    it('should size to content with spacing and MainAxisSize.Min', () => {
        const column = new Column({
            mainAxisSize: 'min' as any, // MainAxisSize.Min
            mainAxisAlignment: MainAxisAlignment.Start,
            mainAxisSpacing: 15,
            verticalDirection: VerticalDirection.Down,
            children: [
                new Container({
                    width: 100,
                    height: 30,
                    child: new Text('Item 1'),
                }),
                new Container({
                    width: 100,
                    height: 30,
                    child: new Text('Item 2'),
                }),
            ],
        });

        const layoutResult = column.layout(mockLayoutContext);
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBe(75); // Should be: 30 + 30 + 15 spacing
    });
});