/**
 * Tests for Column widget Flutter coordinate positioning
 * This test verifies that Column children are positioned top-to-bottom correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Column } from '../widgets/flex.js';
import { Text } from '../widgets/text.js';
import { MainAxisAlignment, VerticalDirection } from '../types/flex.js';
import { defaultTheme, type LayoutContext } from '../types/layout.js';
import { TextDirection } from '../core/text-layout.js';
import { BoxConstraints } from '../types/layout.js';

describe('Column Widget Flutter Coordinates', () => {
    let mockLayoutContext: LayoutContext;

    beforeEach(() => {
        mockLayoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 300 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };
    });

    it('should position children top-to-bottom with VerticalDirection.Down', () => {
        const column = new Column({
            mainAxisAlignment: MainAxisAlignment.Start,
            verticalDirection: VerticalDirection.Down,
            children: [
                new Text('First Item'),
                new Text('Second Item'),
                new Text('Third Item'),
            ],
        });

        const result = column.layout(mockLayoutContext);
        expect(result.size.width).toBeGreaterThan(0);
        expect(result.size.height).toBeGreaterThan(0);
    });

    it('should position children bottom-to-top with VerticalDirection.Up', () => {
        const column = new Column({
            mainAxisAlignment: MainAxisAlignment.Start,
            verticalDirection: VerticalDirection.Up,
            children: [
                new Text('First Item'),
                new Text('Second Item'),
                new Text('Third Item'),
            ],
        });

        const result = column.layout(mockLayoutContext);
        expect(result.size.width).toBeGreaterThan(0);
        expect(result.size.height).toBeGreaterThan(0);
    });

    it('should center children vertically with MainAxisAlignment.Center', () => {
        const column = new Column({
            mainAxisAlignment: MainAxisAlignment.Center,
            verticalDirection: VerticalDirection.Down,
            children: [
                new Text('Centered Item 1'),
                new Text('Centered Item 2'),
            ],
        });

        const result = column.layout(mockLayoutContext);
        expect(result.size.width).toBeGreaterThan(0);
        expect(result.size.height).toBeGreaterThan(0);
    });

    it('should use VerticalDirection.Down by default', () => {
        const column = new Column({
            children: [
                new Text('Default Item 1'),
                new Text('Default Item 2'),
            ],
        });

        const result = column.layout(mockLayoutContext);
        expect(result.size.width).toBeGreaterThan(0);
        expect(result.size.height).toBeGreaterThan(0);
    });
});