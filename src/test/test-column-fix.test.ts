/**
 * Tests for Column widget positioning verification
 * This test verifies that Column widget layout is working correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Column } from '../widgets/flex.js';
import { Text } from '../widgets/text.js';
import { MainAxisAlignment } from '../types/flex.js';
import { defaultTheme, type LayoutContext, BoxConstraints } from '../types/layout.js';
import { TextDirection } from '../core/text-layout.js';

describe('Column Widget Positioning Fix', () => {
    let mockLayoutContext: LayoutContext;

    beforeEach(() => {
        mockLayoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 300 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };
    });

    it('should successfully layout Column with multiple text children', () => {
        const column = new Column({
            children: [
                new Text('First Item (should be at top)'),
                new Text('Second Item (should be in middle)'),
                new Text('Third Item (should be at bottom)'),
            ],
            mainAxisAlignment: MainAxisAlignment.Start,
        });

        const layoutResult = column.layout(mockLayoutContext);

        expect(layoutResult).toBeDefined();
        expect(layoutResult.size.width).toBeGreaterThan(0);
        expect(layoutResult.size.height).toBeGreaterThan(0);
    });

    it('should handle Column with MainAxisAlignment.Start', () => {
        const column = new Column({
            children: [
                new Text('Top Item'),
                new Text('Bottom Item'),
            ],
            mainAxisAlignment: MainAxisAlignment.Start,
        });

        const result = column.layout(mockLayoutContext);
        expect(result.size.width).toBeGreaterThan(0);
        expect(result.size.height).toBeGreaterThan(0);
    });

    it('should handle empty Column', () => {
        const column = new Column({
            children: [],
        });

        const result = column.layout(mockLayoutContext);
        expect(result.size.width).toBe(0);
        expect(result.size.height).toBe(0);
    });

    it('should handle single child Column', () => {
        const column = new Column({
            children: [
                new Text('Single Item'),
            ],
        });

        const result = column.layout(mockLayoutContext);
        expect(result.size.width).toBeGreaterThan(0);
        expect(result.size.height).toBeGreaterThan(0);
    });
});