/**
 * Font Rendering Fix Validation Test
 * 
 * Tests the critical font system fixes to ensure text is visible in PDF viewers
 */

import { describe, it, expect } from 'vitest';
import { Document } from '../core/document.js';
import { TextWidget } from '../widgets/text.js';
import { PdfStandardFont } from '../core/pdf/font-engine.js';
import { writeFileSync } from 'fs';
import { mkdirSync } from 'fs';

describe('Font Rendering Fix Validation', () => {
    // Ensure test output directory exists
    const testOutputDir = 'test-output/font-fix';
    try {
        mkdirSync(testOutputDir, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }

    it('should generate PDF with visible text using fixed font system', async () => {
        console.log('🔧 Testing font system fixes...');

        // Create document with basic text
        const doc = new Document();
        const page = doc.addPage({
            build: () => new TextWidget('Font System Test - This text should be visible!', {
                style: {
                    fontSize: 16,
                    fontFamily: 'Helvetica',
                    color: '#000000'
                }
            })
        });

        // Generate PDF
        const pdfBytes = await doc.save();

        // Save test file
        const testFilePath = `${testOutputDir}/font-fix-test.pdf`;
        writeFileSync(testFilePath, pdfBytes);

        console.log(`✅ Generated font fix test PDF: ${testFilePath}`);
        console.log(`📄 PDF size: ${pdfBytes.length} bytes`);

        // Basic validation
        expect(pdfBytes.length).toBeGreaterThan(500);

        // Convert to string to examine PDF content
        const pdfContent = new TextDecoder().decode(pdfBytes);

        // Validate font references exist
        expect(pdfContent).toContain('/Font');
        expect(pdfContent).toContain('/Helvetica');
        expect(pdfContent).toContain('/Type /Font');
        expect(pdfContent).toContain('/Subtype /Type1');
        expect(pdfContent).toContain('/BaseFont /Helvetica');

        // Validate text drawing commands
        expect(pdfContent).toContain('BT'); // Begin text
        expect(pdfContent).toContain('ET'); // End text
        expect(pdfContent).toContain('Tf'); // Set font
        expect(pdfContent).toContain('Tj'); // Show text
        expect(pdfContent).toContain('Font System Test');

        console.log('✅ PDF validation passed - font references and text commands present');
    });

    it('should properly map font families to PDF standard fonts', async () => {
        console.log('🔤 Testing font family mapping...');

        const doc = new Document();
        const page = doc.addPage({
            build: () => new TextWidget('Times Font Test', {
                style: {
                    fontSize: 14,
                    fontFamily: 'Times-Roman',
                    color: '#333333'
                }
            })
        });

        const pdfBytes = await doc.save();
        const testFilePath = `${testOutputDir}/times-font-test.pdf`;
        writeFileSync(testFilePath, pdfBytes);

        console.log(`✅ Generated Times font test PDF: ${testFilePath}`);

        const pdfContent = new TextDecoder().decode(pdfBytes);

        // Validate Times font is properly referenced
        expect(pdfContent).toContain('/Times-Roman');
        expect(pdfContent).toContain('/BaseFont /Times-Roman');
        expect(pdfContent).toContain('Times Font Test');

        console.log('✅ Times font mapping validation passed');
    });

    it('should handle multiple fonts in same document', async () => {
        console.log('📝 Testing multiple font support...');

        const doc = new Document();
        const page = doc.addPage({
            build: () => {
                return {
                    layout: (context: any) => ({
                        size: { width: 400, height: 200 },
                        baseline: 16,
                        needsRepaint: true
                    }),
                    paint: (context: any) => {
                        // Draw text with different fonts
                        const helveticaFont = context.fontRegistry.getFont('Helvetica');
                        const timesFont = context.fontRegistry.getFont('Times-Roman');
                        const courierFont = context.fontRegistry.getFont('Courier');

                        context.graphics.setFillColor({ red: 0, green: 0, blue: 0 });

                        // Helvetica text
                        context.graphics.drawString(helveticaFont, 14, 'Helvetica Font', 50, 50);

                        // Times text  
                        context.graphics.drawString(timesFont, 14, 'Times Font', 50, 80);

                        // Courier text
                        context.graphics.drawString(courierFont, 14, 'Courier Font', 50, 110);

                        console.log('Painted multiple fonts test');
                    }
                };
            }
        });

        const pdfBytes = await doc.save();
        const testFilePath = `${testOutputDir}/multiple-fonts-test.pdf`;
        writeFileSync(testFilePath, pdfBytes);

        console.log(`✅ Generated multiple fonts test PDF: ${testFilePath}`);

        const pdfContent = new TextDecoder().decode(pdfBytes);

        // Validate all fonts are present in resources
        expect(pdfContent).toContain('/Helvetica');
        expect(pdfContent).toContain('/Times-Roman');
        expect(pdfContent).toContain('/Courier');

        // Validate all text content is present
        expect(pdfContent).toContain('Helvetica Font');
        expect(pdfContent).toContain('Times Font');
        expect(pdfContent).toContain('Courier Font');

        console.log('✅ Multiple fonts validation passed');
    });

    it('should generate comprehensive font system validation PDF', async () => {
        console.log('🎨 Generating comprehensive font system validation...');

        const doc = new Document();
        const page = doc.addPage({
            build: () => {
                return {
                    layout: (context: any) => ({
                        size: { width: 500, height: 600 },
                        baseline: 20,
                        needsRepaint: true
                    }),
                    paint: (context: any) => {
                        console.log('Painting comprehensive font validation');

                        // Set fill color to black
                        context.graphics.setFillColor({ red: 0, green: 0, blue: 0 });

                        let y = 50;
                        const lineHeight = 30;

                        // Title
                        const titleFont = context.fontRegistry.getFont('Helvetica');
                        context.graphics.drawString(titleFont, 18, 'Font System Fix Validation', 50, y);
                        y += lineHeight * 1.5;

                        // Test different fonts
                        const fonts = [
                            { name: 'Helvetica', text: 'Helvetica: The quick brown fox jumps over the lazy dog' },
                            { name: 'Times-Roman', text: 'Times Roman: ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789' },
                            { name: 'Courier', text: 'Courier: Fixed-width font for code and monospace text' }
                        ];

                        fonts.forEach(fontTest => {
                            const font = context.fontRegistry.getFont(fontTest.name);
                            context.graphics.drawString(font, 12, fontTest.text, 50, y);
                            y += lineHeight;
                        });

                        // Add status message
                        y += lineHeight;
                        const statusFont = context.fontRegistry.getFont('Helvetica');
                        context.graphics.drawString(statusFont, 14, '✅ If you can read this text, the font system fix worked!', 50, y);
                        y += lineHeight;
                        context.graphics.drawString(statusFont, 12, 'All text should be visible in macOS Preview and other PDF viewers.', 50, y);

                        console.log('Font validation painting complete');
                    }
                };
            }
        });

        const pdfBytes = await doc.save();
        const testFilePath = `${testOutputDir}/comprehensive-font-validation.pdf`;
        writeFileSync(testFilePath, pdfBytes);

        console.log(`✅ Generated comprehensive validation PDF: ${testFilePath}`);
        console.log(`📊 Font system fix validation complete!`);
        console.log(`🔍 Check the PDFs in ${testOutputDir}/ to verify text is visible`);

        expect(pdfBytes.length).toBeGreaterThan(1000);

        const pdfContent = new TextDecoder().decode(pdfBytes);
        expect(pdfContent).toContain('Font System Fix Validation');
        expect(pdfContent).toContain('font system fix worked');
    });
});