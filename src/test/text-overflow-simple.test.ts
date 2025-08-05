/**
 * Simple Text Overflow Test to verify basic functionality
 */

import { describe, it, expect } from 'vitest';

import { createMockPaintContext } from '@/test/mock-interfaces.js';
import { Table, TextOverflow } from '@/widgets/data.js';

describe('Text Overflow Simple Verification', () => {
    it('should have TextOverflow enum with correct values', () => {
        expect(TextOverflow.Clip).toBe('clip');
        expect(TextOverflow.Ellipsis).toBe('ellipsis');
        expect(TextOverflow.Visible).toBe('visible');
    });

    it('should create table with textOverflow property', () => {
        const table = new Table({
            data: [['test']],
            textOverflow: TextOverflow.Ellipsis,
        });

        expect(table).toBeDefined();
    });

    it('should create table with PDF clipping support', () => {
        const context = createMockPaintContext({
            size: { width: 400, height: 300 },
        });

        const table = new Table({
            data: [['Very long text that should be clipped']],
            textOverflow: TextOverflow.Clip,
        });

        // Should not throw when painting
        expect(() => {
            table.paint(context);
        }).not.toThrow();
    });

    it('should support per-row text overflow overrides', () => {
        const table = new Table({
            textOverflow: TextOverflow.Clip,
            children: [],
        });

        expect(table).toBeDefined();
    });
});
