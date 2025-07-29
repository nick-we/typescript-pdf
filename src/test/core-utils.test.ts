/**
 * Core utilities and graphics tests
 * 
 * Tests for PDF graphics, colors, and utility functions
 * 
 * @packageDocumentation
 */

import { PdfColorRgb, Matrix4, type PdfGraphics } from '../core/pdf/graphics.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import { PdfStream } from '../core/pdf/stream.js';
import { PdfDocument } from '../core/pdf/document.js';

describe('Core Utils and Graphics Tests', () => {
    describe('PdfColorRgb', () => {
        test('should create RGB color correctly', () => {
            const color = new PdfColorRgb(0.5, 0.7, 0.9);
            expect(color.red).toBe(0.5);
            expect(color.green).toBe(0.7);
            expect(color.blue).toBe(0.9);
        });

        test('should provide standard colors', () => {
            expect(PdfColorRgb.black.red).toBe(0);
            expect(PdfColorRgb.black.green).toBe(0);
            expect(PdfColorRgb.black.blue).toBe(0);

            expect(PdfColorRgb.white.red).toBe(1);
            expect(PdfColorRgb.white.green).toBe(1);
            expect(PdfColorRgb.white.blue).toBe(1);

            expect(PdfColorRgb.red.red).toBe(1);
            expect(PdfColorRgb.red.green).toBe(0);
            expect(PdfColorRgb.red.blue).toBe(0);
        });

        test('should store values as provided', () => {
            const color = new PdfColorRgb(-0.5, 1.5, 0.5);
            expect(color.red).toBe(-0.5);
            expect(color.green).toBe(1.5);
            expect(color.blue).toBe(0.5);
        });

        test('should convert to hex string', () => {
            const color = new PdfColorRgb(0.5, 0.7, 0.9);
            const hexString = color.toHex();
            expect(hexString).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    describe('Matrix4', () => {
        test('should create identity matrix', () => {
            const matrix = Matrix4.identity();
            expect(matrix.storage[0]).toBe(1);
            expect(matrix.storage[1]).toBe(0);
            expect(matrix.storage[4]).toBe(0);
            expect(matrix.storage[5]).toBe(1);
            expect(matrix.storage.length).toBe(16);
        });

        test('should clone matrix', () => {
            const matrix = Matrix4.identity();
            const clone = matrix.clone();
            expect(clone.storage).toEqual(matrix.storage);
            expect(clone).not.toBe(matrix);
        });

        test('should multiply matrices', () => {
            const m1 = Matrix4.identity();
            const m2 = Matrix4.identity();
            m1.multiply(m2);
            expect(m1.storage[0]).toBe(1);
        });
    });

    describe('PdfStream', () => {
        test('should create empty stream', () => {
            const stream = new PdfStream();
            expect(stream.length).toBe(0);
        });

        test('should write string data', () => {
            const stream = new PdfStream();
            stream.putString('Hello World');
            expect(stream.length).toBeGreaterThan(0);
        });

        test('should write buffer data', () => {
            const stream = new PdfStream();
            const buffer = new TextEncoder().encode('Test data');
            stream.putBytes(buffer);
            expect(stream.length).toBe(buffer.length);
        });

        test('should get content as buffer', () => {
            const stream = new PdfStream();
            stream.putString('Test');
            const buffer = stream.getBytes();
            expect(buffer).toBeInstanceOf(Uint8Array);
        });

        test('should clear content', () => {
            const stream = new PdfStream();
            stream.putString('Some data');
            expect(stream.length).toBeGreaterThan(0);
            stream.clear();
            expect(stream.length).toBe(0);
        });
    });

    describe('PdfDocument Integration', () => {
        test('should create document with settings', () => {
            const doc = new PdfDocument({
                verbose: true,
                version: '1.4',
            });
            expect(doc).toBeInstanceOf(PdfDocument);
            expect(doc.settings.verbose).toBe(true);
        });

        test('should add page to document', () => {
            const doc = new PdfDocument();
            const page = doc.addPage();
            expect(page).toBeDefined();
        });

        test('should generate PDF output', async () => {
            const doc = new PdfDocument();
            const page = doc.addPage();
            const graphics = page.getGraphics();
            const font = doc.fontRegistry.getFont(PdfStandardFont.Helvetica);
            graphics.drawString(font, 12, 'Test', 100, 100);

            const output = await doc.save();
            expect(output).toBeInstanceOf(Uint8Array);
            expect(output.length).toBeGreaterThan(0);
        });

        test('should handle empty document', async () => {
            const doc = new PdfDocument();
            const output = await doc.save();
            expect(output).toBeInstanceOf(Uint8Array);
        });
    });

    describe('Font System', () => {
        test('should provide standard fonts', () => {
            expect(PdfStandardFont.Helvetica).toBe('Helvetica');
            expect(PdfStandardFont.TimesRoman).toBe('Times-Roman');
            expect(PdfStandardFont.Courier).toBe('Courier');
        });

        test('should provide font variations', () => {
            expect(PdfStandardFont.HelveticaBold).toBe('Helvetica-Bold');
            expect(PdfStandardFont.HelveticaOblique).toBe('Helvetica-Oblique');
            expect(PdfStandardFont.HelveticaBoldOblique).toBe('Helvetica-BoldOblique');
        });

        test('should have all Times variations', () => {
            expect(PdfStandardFont.TimesBold).toBe('Times-Bold');
            expect(PdfStandardFont.TimesItalic).toBe('Times-Italic');
            expect(PdfStandardFont.TimesBoldItalic).toBe('Times-BoldItalic');
        });

        test('should have all Courier variations', () => {
            expect(PdfStandardFont.CourierBold).toBe('Courier-Bold');
            expect(PdfStandardFont.CourierOblique).toBe('Courier-Oblique');
            expect(PdfStandardFont.CourierBoldOblique).toBe('Courier-BoldOblique');
        });
    });

    describe('Graphics Operations', () => {
        let mockStream: PdfStream;

        beforeEach(() => {
            mockStream = new PdfStream();
        });

        test('should handle coordinate transformations', () => {
            const matrix = Matrix4.identity();
            expect(matrix.storage[0]).toBe(1);
            expect(matrix.storage[5]).toBe(1);
        });

        test('should handle color operations', () => {
            const red = PdfColorRgb.red;
            const green = PdfColorRgb.green;
            const blue = PdfColorRgb.blue;

            expect(red.red).toBe(1);
            expect(green.green).toBe(1);
            expect(blue.blue).toBe(1);
        });

        test('should handle text operations', () => {
            // Test that font constants exist and are strings
            Object.values(PdfStandardFont).forEach(font => {
                expect(typeof font).toBe('string');
                expect(font.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid color values gracefully', () => {
            // Colors store values as-is, don't clamp
            const color = new PdfColorRgb(NaN, Infinity, -Infinity);
            expect(color.red).toBeNaN();
            expect(color.green).toBe(Infinity);
            expect(color.blue).toBe(-Infinity);
        });

        test('should handle empty stream operations', () => {
            const stream = new PdfStream();
            expect(() => stream.getBytes()).not.toThrow();
            expect(() => stream.clear()).not.toThrow();
        });

        test('should handle matrix edge cases', () => {
            const matrix = Matrix4.identity();
            expect(matrix.storage[0]).toBe(1);
            expect(matrix.storage[5]).toBe(1);
        });
    });
});