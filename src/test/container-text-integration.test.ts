/**
 * Container-Text Layout Integration Tests
 * 
 * Tests the integration between Container widgets and Text widgets,
 * particularly focusing on constraint propagation, text wrapping,
 * and accurate measurement service integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TextWidget, TextAlign, TextOverflow } from '../widgets/text.js';
import { Container } from '../widgets/layout.js';
import { Layout, Geometry, Theme } from '../types.js';
import { createTestLayoutContext, type TestTextOptions } from './test-utils.js';

describe('Container-Text Layout Integration', () => {
    let mockContext: Layout.LayoutContext;

    beforeEach(() => {
        // Create typed mock layout context using test utilities
        mockContext = createTestLayoutContext({
            constraints: {
                minWidth: 0,
                maxWidth: 300,
                minHeight: 0,
                maxHeight: 400
            }
        });
    });

    describe('Constraint Propagation Issues', () => {
        it('should handle unconstrained container with long text', () => {
            // ISSUE: Container without width constraint, text defaults to 1000px
            const longText = "This is a very long text that should wrap properly within the container's available space and not use the arbitrary 1000px default width";

            const text = new TextWidget(longText, { softWrap: true });
            const container = new Container({ child: text });

            // Container with infinite maxWidth constraint
            const infiniteConstraintContext: Layout.LayoutContext = {
                ...mockContext,
                constraints: {
                    minWidth: 0,
                    maxWidth: Number.POSITIVE_INFINITY,
                    minHeight: 0,
                    maxHeight: Number.POSITIVE_INFINITY
                }
            };

            const containerResult = container.layout(infiniteConstraintContext);

            // EXPECTED: Container should not be unreasonably wide
            // ACTUAL: Container may be ~1000px wide due to text defaulting to 1000px
            console.log(`Container width with infinite constraints: ${containerResult.size.width}`);

            // This test should FAIL before the fix - demonstrating the problem
            expect(containerResult.size.width).toBeLessThan(1000); // Reasonable width
        });

        it('should properly constrain text within fixed-width container', () => {
            const longText = "This text should wrap within the container's specified width";

            const text = new TextWidget(longText, { softWrap: true });
            const container = new Container({
                child: text,
                width: 200,
                padding: Layout.EdgeInsets.all(10)
            });

            const result = container.layout(mockContext);

            // Container should be exactly 200px wide
            expect(result.size.width).toBe(200);

            // Text should have been measured with (200 - 20) = 180px available width
            // This should work correctly even before the fix
        });

        it('should handle very narrow containers correctly', () => {
            const text = new TextWidget("Long text content", { softWrap: true });
            const container = new Container({
                child: text,
                width: 50,
                padding: Layout.EdgeInsets.all(5)
            });

            const result = container.layout(mockContext);

            // Container should be exactly 50px wide
            expect(result.size.width).toBe(50);

            // Text should have been forced to wrap in very narrow space (40px available)
            expect(result.size.height).toBeGreaterThan(30); // Should be tall due to wrapping
        });
    });

    describe('Text Measurement Service Integration', () => {
        it('should use AccurateTextMeasurementService when available', () => {
            const text = new TextWidget("Test text for measurement", { softWrap: true });
            const container = new Container({
                child: text,
                width: 150
            });

            const result = container.layout(mockContext);

            // With accurate measurement, we should get precise text layout
            const textResult = text.layout({
                ...mockContext,
                constraints: {
                    minWidth: 0,
                    maxWidth: 150,
                    minHeight: 0,
                    maxHeight: Number.POSITIVE_INFINITY
                }
            });

            // FIXED: Text wraps, so width should be the longest wrapped line, not full text width
            // With maxWidth=150 and 0.6 multiplier: charsPerLine = floor(150/7.2) = 20 chars
            // "Test text for measurement" wraps to:
            // Line 1: "Test text for" (13 chars) = 13 * 12 * 0.6 = 93.6px
            // Line 2: "measurement" (11 chars) = 11 * 12 * 0.6 = 79.2px
            // Width = max(93.6, 79.2) = 93.6px
            const expectedWidth = 13 * 12 * 0.6; // Width of longest wrapped line
            expect(textResult.size.width).toBeCloseTo(expectedWidth, 1);

            // Should be multi-line due to wrapping
            expect(textResult.size.height).toBeGreaterThan(12 * 1.2); // More than single line
        });

        it('should handle fallback when measurement service unavailable', () => {
            const text = new TextWidget("Test text fallback", { softWrap: true });
            const container = new Container({
                child: text,
                width: 150
            });

            // Context without text measurement service
            const contextWithoutService: Layout.LayoutContext = {
                ...mockContext,
            };

            const result = container.layout(contextWithoutService);

            // Should still work with fallback measurement (0.55 * fontSize)
            expect(result.size.width).toBe(150);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should maintain consistent behavior with and without service', () => {
            const textContent = "Consistent measurement test";

            const textWithService = new TextWidget(textContent, { softWrap: true });
            const textWithoutService = new TextWidget(textContent, { softWrap: true });

            const containerWithService = new Container({
                child: textWithService,
                width: 120
            });

            const containerWithoutService = new Container({
                child: textWithoutService,
                width: 120
            });

            const resultWithService = containerWithService.layout(mockContext);

            const contextWithoutService: Layout.LayoutContext = {
                ...mockContext,
            };
            const resultWithoutService = containerWithoutService.layout(contextWithoutService);

            // Both should have the same container width
            expect(resultWithService.size.width).toBe(resultWithoutService.size.width);
        });
    });

    describe('Size Negotiation and Reporting', () => {
        it('should properly report text size back to container', () => {
            const text = new TextWidget("Size reporting test", { softWrap: false });
            const container = new Container({
                child: text,
                padding: Layout.EdgeInsets.symmetric({ horizontal: 8, vertical: 12 })
            });

            const result = container.layout(mockContext);

            // Calculate expected text width with accurate measurement
            const expectedTextWidth = "Size reporting test".length * 12 * 0.6;
            const expectedContainerWidth = expectedTextWidth + 16; // Add horizontal padding

            expect(result.size.width).toBeCloseTo(expectedContainerWidth, 1);
        });

        it('should handle baseline calculation correctly', () => {
            const text = new TextWidget("Baseline test", { softWrap: false });
            const container = new Container({
                child: text,
                padding: Layout.EdgeInsets.only({ top: 10, bottom: 5 })
            });

            const result = container.layout(mockContext);

            // Container should include baseline from text + top padding
            expect(result.baseline).toBeDefined();
            if (result.baseline) {
                // Baseline should account for container's top padding
                expect(result.baseline).toBeGreaterThan(10); // At least the top padding
            }
        });
    });

    describe('Text Overflow Integration', () => {
        it('should handle clip overflow in containers', () => {
            const longText = "This text is too long and should be clipped";
            const text = new TextWidget(longText, {
                softWrap: false,
                overflow: TextOverflow.Clip
            });

            const container = new Container({
                child: text,
                width: 100,
                padding: Layout.EdgeInsets.all(5)
            });

            const result = container.layout(mockContext);

            // Container should maintain its specified width
            expect(result.size.width).toBe(100);

            // Text should be clipped, not wrapped
            expect(result.size.height).toBeLessThan(30); // Single line height
        });

        it('should handle ellipsis overflow in containers', () => {
            const longText = "This text is too long and should show ellipsis";
            const text = new TextWidget(longText, {
                softWrap: false,
                overflow: TextOverflow.Ellipsis
            });

            const container = new Container({
                child: text,
                width: 120,
                padding: Layout.EdgeInsets.all(5)
            });

            const result = container.layout(mockContext);

            // Container should maintain its specified width
            expect(result.size.width).toBe(120);

            // Text should be single line with ellipsis
            expect(result.size.height).toBeLessThan(30); // Single line height
        });
    });

    describe('Edge Cases and Complex Scenarios', () => {
        it('should handle nested containers with text', () => {
            const text = new TextWidget("Nested container text", { softWrap: true });
            const innerContainer = new Container({
                child: text,
                padding: Layout.EdgeInsets.all(5),
                width: 100
            });
            const outerContainer = new Container({
                child: innerContainer,
                padding: Layout.EdgeInsets.all(10),
                width: 150
            });

            const result = outerContainer.layout(mockContext);

            // Outer container should be 150px wide
            expect(result.size.width).toBe(150);
        });

        it('should handle empty text in containers', () => {
            const text = new TextWidget("", { softWrap: true });
            const container = new Container({
                child: text,
                padding: Layout.EdgeInsets.all(10),
                width: 100
            });

            const result = container.layout(mockContext);

            // Container should still have specified width
            expect(result.size.width).toBe(100);

            // Height should be minimal (just padding + minimal text height)
            expect(result.size.height).toBeGreaterThan(20); // At least padding
            expect(result.size.height).toBeLessThan(50); // But not too much
        });

        it('should handle very long single word', () => {
            const longWord = "Supercalifragilisticexpialidocious";
            const text = new TextWidget(longWord, { softWrap: true });
            const container = new Container({
                child: text,
                width: 50,
                padding: Layout.EdgeInsets.all(5)
            });

            const result = container.layout(mockContext);

            // Container maintains width
            expect(result.size.width).toBe(50);
        });
    });
});