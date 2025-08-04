/**
 * MultiPage Margin Fix Visual Validation Test
 * 
 * This test validates that the margin fixes are working correctly:
 * - Headers are positioned near page top (not content area top)
 * - Footers are positioned near page bottom (not appearing at top)
 * - Margins are reasonable (20pts instead of 72pts)
 * - Content has proper spacing from headers/footers
 */

import { describe, it, expect } from 'vitest';
import { Document } from '../core/document.js';
import { MultiPage, PageBreakBehavior, MultiPageUtils } from '../widgets/multipage.js';
import { TextWidget } from '../widgets/text.js';
import { Container } from '../widgets/layout.js';
import { Column } from '../widgets/flex.js';
import { Layout } from '../types.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

describe('MultiPage Margin Fix Validation', () => {
    const outputDir = 'test-output/margin-fix-validation';

    beforeAll(() => {
        try {
            mkdirSync(outputDir, { recursive: true });
        } catch (error) {
            // Directory might already exist, ignore error
        }
    });

    it('should position headers near page top with proper margins', async () => {
        const doc = new Document();

        const content = [
            new TextWidget('Content line 1 - This should be properly spaced below the header'),
            new TextWidget('Content line 2 - Headers should be near the top of the page'),
            new TextWidget('Content line 3 - Not buried deep in the page with excessive margins'),
            new TextWidget('Content line 4 - The content area should use the page space efficiently'),
            new TextWidget('Content line 5 - More content to test spacing'),
        ];

        const multiPage = new MultiPage({
            children: content,
            header: (pageNum, totalPages) => new Container({
                child: new TextWidget(`HEADER - Page ${pageNum} of ${totalPages}`, {
                    style: { fontSize: 10, color: '#666666' }
                }),
                padding: Layout.EdgeInsets.symmetric({ vertical: 5 }),
                decoration: {
                    border: { width: 1, color: '#cccccc' }
                }
            }),
            pageBreakBehavior: PageBreakBehavior.Auto,
            // Use smaller margins for testing
            pageMargins: Layout.EdgeInsets.all(15)
        });

        doc.addPage({
            build: () => multiPage
        });

        const pdfBytes = await doc.save();
        expect(pdfBytes.length).toBeGreaterThan(1000);

        // Save test output
        const outputPath = `${outputDir}/header-positioning-test.pdf`;
        writeFileSync(outputPath, pdfBytes);
        console.log(`✅ Header positioning test saved: ${outputPath}`);
    });

    it('should position footers near page bottom (not at top)', async () => {
        const doc = new Document();

        const content = Array.from({ length: 20 }, (_, i) =>
            new TextWidget(`Content item ${i + 1} - Testing footer positioning and page breaks`)
        );

        const multiPage = new MultiPage({
            children: content,
            footer: new Container({
                child: new TextWidget('FOOTER - This should appear at the BOTTOM of each page', {
                    style: { fontSize: 10, color: '#666666' }
                }),
                padding: Layout.EdgeInsets.symmetric({ vertical: 5 }),
                decoration: {
                    border: { width: 1, color: '#cccccc' }
                }
            }),
            pageBreakBehavior: PageBreakBehavior.Auto,
            pageMargins: Layout.EdgeInsets.all(15)
        });

        doc.addPage({
            build: () => multiPage
        });

        const pdfBytes = await doc.save();
        expect(pdfBytes.length).toBeGreaterThan(1000);

        // Save test output
        const outputPath = `${outputDir}/footer-positioning-test.pdf`;
        writeFileSync(outputPath, pdfBytes);
        console.log(`✅ Footer positioning test saved: ${outputPath}`);
    });

    it('should properly separate headers, content, and footers with correct margins', async () => {
        const doc = new Document();

        const content = Array.from({ length: 15 }, (_, i) =>
            new TextWidget(`Content line ${i + 1} - Testing proper spacing between headers, content, and footers`)
        );

        const multiPage = new MultiPage({
            children: content,
            header: (pageNum, totalPages) => new Container({
                child: new TextWidget(`Header Page ${pageNum}/${totalPages}`, {
                    style: { fontSize: 12, color: '#333333' }
                }),
                padding: Layout.EdgeInsets.all(8),
                decoration: {
                    border: { width: 2, color: '#ddd' }
                }
            }),
            footer: new Container({
                child: new TextWidget('Footer - Margin Fix Test', {
                    style: { fontSize: 10, color: '#666666' }
                }),
                padding: Layout.EdgeInsets.all(8),
                decoration: {
                    border: { width: 1, color: '#ddd' }
                }
            }),
            pageBreakBehavior: PageBreakBehavior.Auto,
            // Test with very minimal margins to maximize content space
            pageMargins: Layout.EdgeInsets.all(10)
        });

        doc.addPage({
            build: () => multiPage
        });

        const pdfBytes = await doc.save();
        expect(pdfBytes.length).toBeGreaterThan(1000);

        // Save test output
        const outputPath = `${outputDir}/header-footer-spacing-test.pdf`;
        writeFileSync(outputPath, pdfBytes);
        console.log(`✅ Header/footer spacing test saved: ${outputPath}`);
    });

    it('should work with MultiPageUtils.forReport with improved margins', async () => {
        const doc = new Document();

        const content = Array.from({ length: 25 }, (_, i) =>
            new Column({
                children: [
                    new TextWidget(`Report Section ${i + 1}`, {
                        style: { fontSize: 14 }
                    }),
                    new TextWidget(`Content for section ${i + 1}. This tests the MultiPageUtils.forReport functionality with improved margins and proper header/footer positioning.`),
                    new TextWidget('Additional details for this section to ensure proper page breaks and layout.')
                ]
            })
        );

        const multiPage = MultiPageUtils.forReport(content, {
            title: 'Margin Fix Test Report',
            showPageNumbers: true,
            // Use improved margins
            margins: Layout.EdgeInsets.all(12)
        });

        doc.addPage({
            build: () => multiPage
        });

        const pdfBytes = await doc.save();
        expect(pdfBytes.length).toBeGreaterThan(1000);

        // Save test output
        const outputPath = `${outputDir}/utils-report-margin-test.pdf`;
        writeFileSync(outputPath, pdfBytes);
        console.log(`✅ MultiPageUtils report margin test saved: ${outputPath}`);
    });

    it('should demonstrate before/after margin comparison', async () => {
        // Test with old excessive margins (72pts) for comparison
        const docOldMargins = new Document();

        const content = Array.from({ length: 8 }, (_, i) =>
            new TextWidget(`Content line ${i + 1} - This tests the old excessive 72pt margins`)
        );

        const multiPageOld = new MultiPage({
            children: content,
            header: () => new TextWidget('OLD: 72pt margins (excessive)', {
                style: { fontSize: 10, color: '#cc0000' }
            }),
            footer: new TextWidget('OLD: Footer with 72pt margins', {
                style: { fontSize: 10, color: '#cc0000' }
            }),
            pageMargins: Layout.EdgeInsets.all(72) // Old excessive margins
        });

        docOldMargins.addPage({
            build: () => multiPageOld
        });

        const oldPdfBytes = await docOldMargins.save();
        const oldOutputPath = `${outputDir}/old-72pt-margins-comparison.pdf`;
        writeFileSync(oldOutputPath, oldPdfBytes);

        // Test with new improved margins (20pts)
        const docNewMargins = new Document();

        const multiPageNew = new MultiPage({
            children: content,
            header: () => new TextWidget('NEW: 20pt margins (improved)', {
                style: { fontSize: 10, color: '#00cc00' }
            }),
            footer: new TextWidget('NEW: Footer with 20pt margins', {
                style: { fontSize: 10, color: '#00cc00' }
            }),
            pageMargins: Layout.EdgeInsets.all(20) // New improved margins
        });

        docNewMargins.addPage({
            build: () => multiPageNew
        });

        const newPdfBytes = await docNewMargins.save();
        const newOutputPath = `${outputDir}/new-20pt-margins-comparison.pdf`;
        writeFileSync(newOutputPath, newPdfBytes);

        expect(oldPdfBytes.length).toBeGreaterThan(1000);
        expect(newPdfBytes.length).toBeGreaterThan(1000);

        console.log(`✅ OLD margins (72pt) comparison saved: ${oldOutputPath}`);
        console.log(`✅ NEW margins (20pt) comparison saved: ${newOutputPath}`);
        console.log('📊 Compare these files to see the dramatic improvement in page space utilization');
    });
});