/**
 * Tests for flex layout system
 * 
 * Comprehensive tests for Row, Column, Flexible, Expanded widgets
 * and the underlying flex layout algorithm.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    Row,
    Column,
    Flex,
    Flexible,
    Expanded,
    FlexWidgets,
} from '../widgets/flex.js';
import { Text } from '../widgets/text.js';
import { Container } from '../widgets/container.js';
import {
    Axis,
    MainAxisAlignment,
    CrossAxisAlignment,
    MainAxisSize,
    FlexFit,
} from '../types/flex.js';
import {
    BoxConstraints,
    defaultTheme,
    type LayoutContext,
} from '../types/layout.js';
import { TextDirection } from '@/core/text-layout.js';

describe('Flex Layout System', () => {
    let mockLayoutContext: LayoutContext;

    beforeEach(() => {
        mockLayoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 300 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };
    });

    describe('Flex Widget', () => {
        it('should create a horizontal flex layout', () => {
            const flex = new Flex({
                direction: Axis.Horizontal,
                children: [
                    new Text('Child 1'),
                    new Text('Child 2'),
                ],
            });

            expect(flex).toBeDefined();
            const result = flex.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create a vertical flex layout', () => {
            const flex = new Flex({
                direction: Axis.Vertical,
                children: [
                    new Text('Child 1'),
                    new Text('Child 2'),
                ],
            });

            expect(flex).toBeDefined();
            const result = flex.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle empty children array', () => {
            const flex = new Flex({
                direction: Axis.Horizontal,
                children: [],
            });

            const result = flex.layout(mockLayoutContext);
            expect(result.size.width).toBe(0);
            expect(result.size.height).toBe(0);
        });

        it('should respect MainAxisAlignment.Center', () => {
            const child1 = new Text('Short');
            const child2 = new Text('Text');

            const flex = new Flex({
                direction: Axis.Horizontal,
                mainAxisAlignment: MainAxisAlignment.Center,
                children: [child1, child2],
            });

            const result = flex.layout(mockLayoutContext);
            expect(result.size.width).toBeLessThanOrEqual(mockLayoutContext.constraints.maxWidth);
        });

        it('should respect MainAxisAlignment.SpaceBetween', () => {
            const flex = new Flex({
                direction: Axis.Horizontal,
                mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                children: [
                    new Text('Child 1'),
                    new Text('Child 2'),
                    new Text('Child 3'),
                ],
            });

            const result = flex.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });

        it('should apply main axis spacing', () => {
            const flexWithSpacing = new Flex({
                direction: Axis.Horizontal,
                mainAxisSize: MainAxisSize.Min, // Use Min to see actual content size
                mainAxisSpacing: 10,
                children: [
                    new Text('Child 1'),
                    new Text('Child 2'),
                ],
            });

            const flexWithoutSpacing = new Flex({
                direction: Axis.Horizontal,
                mainAxisSize: MainAxisSize.Min, // Use Min to see actual content size
                mainAxisSpacing: 0,
                children: [
                    new Text('Child 1'),
                    new Text('Child 2'),
                ],
            });

            const resultWithSpacing = flexWithSpacing.layout(mockLayoutContext);
            const resultWithoutSpacing = flexWithoutSpacing.layout(mockLayoutContext);

            expect(resultWithSpacing.size.width).toBeGreaterThan(resultWithoutSpacing.size.width);
        });

        it('should handle MainAxisSize.Min', () => {
            const flex = new Flex({
                direction: Axis.Horizontal,
                mainAxisSize: MainAxisSize.Min,
                children: [new Text('Small')],
            });

            const result = flex.layout(mockLayoutContext);
            expect(result.size.width).toBeLessThan(mockLayoutContext.constraints.maxWidth);
        });

        it('should handle MainAxisSize.Max', () => {
            const flex = new Flex({
                direction: Axis.Horizontal,
                mainAxisSize: MainAxisSize.Max,
                children: [new Text('Small')],
            });

            const result = flex.layout(mockLayoutContext);
            expect(result.size.width).toBeCloseTo(mockLayoutContext.constraints.maxWidth, 1);
        });
    });

    describe('Row Widget', () => {
        it('should create horizontal layout', () => {
            const row = new Row({
                children: [
                    new Text('Left'),
                    new Text('Right'),
                ],
            });

            const result = row.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should support all main axis alignments', () => {
            const alignments = [
                MainAxisAlignment.Start,
                MainAxisAlignment.End,
                MainAxisAlignment.Center,
                MainAxisAlignment.SpaceBetween,
                MainAxisAlignment.SpaceAround,
                MainAxisAlignment.SpaceEvenly,
            ];

            alignments.forEach(alignment => {
                const row = new Row({
                    mainAxisAlignment: alignment,
                    children: [
                        new Text('Child 1'),
                        new Text('Child 2'),
                    ],
                });

                const result = row.layout(mockLayoutContext);
                expect(result.size.width).toBeGreaterThan(0);
            });
        });

        it('should support cross axis alignments', () => {
            const alignments = [
                CrossAxisAlignment.Start,
                CrossAxisAlignment.End,
                CrossAxisAlignment.Center,
                CrossAxisAlignment.Stretch,
            ];

            alignments.forEach(alignment => {
                const row = new Row({
                    crossAxisAlignment: alignment,
                    children: [
                        new Text('Child 1'),
                        new Text('Child 2'),
                    ],
                });

                const result = row.layout(mockLayoutContext);
                expect(result.size.width).toBeGreaterThan(0);
            });
        });
    });

    describe('Column Widget', () => {
        it('should create vertical layout', () => {
            const column = new Column({
                children: [
                    new Text('Top'),
                    new Text('Bottom'),
                ],
            });

            const result = column.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should stack children vertically', () => {
            const singleChild = new Column({
                mainAxisSize: MainAxisSize.Min, // Use Min to see actual content size
                children: [new Text('Single')],
            });

            const doubleChild = new Column({
                mainAxisSize: MainAxisSize.Min, // Use Min to see actual content size
                children: [
                    new Text('First'),
                    new Text('Second'),
                ],
            });

            const singleResult = singleChild.layout(mockLayoutContext);
            const doubleResult = doubleChild.layout(mockLayoutContext);

            expect(doubleResult.size.height).toBeGreaterThan(singleResult.size.height);
        });
    });

    describe('Flexible Widget', () => {
        it('should create flexible child with default flex value', () => {
            const flexible = new Flexible({
                child: new Text('Flexible text'),
            });

            expect(flexible.flexData?.flex).toBe(1);
            expect(flexible.flexData?.fit).toBe(FlexFit.Loose);
        });

        it('should create flexible child with custom flex value', () => {
            const flexible = new Flexible({
                child: new Text('Flexible text'),
                flex: 3,
            });

            expect(flexible.flexData?.flex).toBe(3);
        });

        it('should respect FlexFit.Tight', () => {
            const flexible = new Flexible({
                child: new Text('Flexible text'),
                fit: FlexFit.Tight,
            });

            expect(flexible.flexData?.fit).toBe(FlexFit.Tight);
        });

        it('should pass through to child for layout', () => {
            const childText = new Text('Child');
            const flexible = new Flexible({
                child: childText,
            });

            const childResult = childText.layout(mockLayoutContext);
            const flexibleResult = flexible.layout(mockLayoutContext);

            expect(flexibleResult.size).toEqual(childResult.size);
        });
    });

    describe('Expanded Widget', () => {
        it('should create expanded child with flex = 1 by default', () => {
            const expanded = new Expanded({
                child: new Text('Expanded text'),
            });

            expect(expanded.flexData?.flex).toBe(1);
            expect(expanded.flexData?.fit).toBe(FlexFit.Tight);
        });

        it('should create expanded child with custom flex value', () => {
            const expanded = new Expanded({
                child: new Text('Expanded text'),
                flex: 2,
            });

            expect(expanded.flexData?.flex).toBe(2);
            expect(expanded.flexData?.fit).toBe(FlexFit.Tight);
        });
    });

    describe('Flex Layout Algorithm', () => {
        it('should distribute space among flexible children', () => {
            const row = new Row({
                children: [
                    new Flexible({
                        flex: 1,
                        child: new Text('Flex 1'),
                    }),
                    new Flexible({
                        flex: 2,
                        child: new Text('Flex 2'),
                    }),
                ],
            });

            const result = row.layout(mockLayoutContext);
            expect(result.size.width).toBeCloseTo(mockLayoutContext.constraints.maxWidth, 1);
        });

        it('should handle mix of flexible and non-flexible children', () => {
            const row = new Row({
                children: [
                    new Text('Fixed'),
                    new Expanded({
                        child: new Text('Expanded'),
                    }),
                    new Text('Fixed 2'),
                ],
            });

            const result = row.layout(mockLayoutContext);
            expect(result.size.width).toBe(mockLayoutContext.constraints.maxWidth);
        });

        it('should respect minimum constraints', () => {
            const tightConstraints: LayoutContext = {
                ...mockLayoutContext,
                constraints: {
                    minWidth: 200,
                    maxWidth: 200,
                    minHeight: 100,
                    maxHeight: 100,
                },
            };

            const row = new Row({
                children: [new Text('Text')],
            });

            const result = row.layout(tightConstraints);
            expect(result.size.width).toBe(200);
            expect(result.size.height).toBe(100);
        });

        it('should handle overflow gracefully', () => {
            const narrowConstraints: LayoutContext = {
                ...mockLayoutContext,
                constraints: BoxConstraints.tight({ width: 50, height: 50 }),
            };

            const row = new Row({
                children: [
                    new Text('Very long text that should overflow'),
                    new Text('More text'),
                ],
            });

            const result = row.layout(narrowConstraints);
            expect(result.size.width).toBe(50);
            expect(result.size.height).toBe(50);
        });
    });

    describe('FlexWidgets Helper Functions', () => {
        it('should create Row widget', () => {
            const row = FlexWidgets.row({
                children: [new Text('Test')],
            });

            expect(row).toBeInstanceOf(Row);
        });

        it('should create Column widget', () => {
            const column = FlexWidgets.column({
                children: [new Text('Test')],
            });

            expect(column).toBeInstanceOf(Column);
        });

        it('should create Flexible widget', () => {
            const flexible = FlexWidgets.flexible(new Text('Test'), { flex: 2 });

            expect(flexible).toBeInstanceOf(Flexible);
            expect(flexible.flexData?.flex).toBe(2);
        });

        it('should create Expanded widget', () => {
            const expanded = FlexWidgets.expanded(new Text('Test'), 3);

            expect(expanded).toBeInstanceOf(Expanded);
            expect(expanded.flexData?.flex).toBe(3);
        });

        it('should create Expanded widget with default flex', () => {
            const expanded = FlexWidgets.expanded(new Text('Test'));

            expect(expanded).toBeInstanceOf(Expanded);
            expect(expanded.flexData?.flex).toBe(1);
        });
    });

    describe('Complex Layout Scenarios', () => {
        it('should handle nested flex layouts', () => {
            const nestedLayout = new Column({
                children: [
                    new Row({
                        children: [
                            new Expanded({ child: new Text('Top Left') }),
                            new Expanded({ child: new Text('Top Right') }),
                        ],
                    }),
                    new Expanded({
                        child: new Row({
                            children: [
                                new Text('Bottom Left'),
                                new Expanded({ child: new Text('Bottom Right') }),
                            ],
                        }),
                    }),
                ],
            });

            const result = nestedLayout.layout(mockLayoutContext);
            expect(result.size.width).toBe(mockLayoutContext.constraints.maxWidth);
            expect(result.size.height).toBe(mockLayoutContext.constraints.maxHeight);
        });

        it('should handle complex alignment combinations', () => {
            const complex = new Column({
                mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                crossAxisAlignment: CrossAxisAlignment.Stretch,
                children: [
                    new Row({
                        mainAxisAlignment: MainAxisAlignment.SpaceEvenly,
                        children: [
                            new Text('A'),
                            new Text('B'),
                            new Text('C'),
                        ],
                    }),
                    new Expanded({
                        child: new Container({
                            child: new Text('Middle'),
                        }),
                    }),
                    new Row({
                        mainAxisAlignment: MainAxisAlignment.End,
                        children: [
                            new Text('End'),
                        ],
                    }),
                ],
            });

            const result = complex.layout(mockLayoutContext);
            expect(result.size.width).toBeCloseTo(mockLayoutContext.constraints.maxWidth, 1);
            expect(result.size.height).toBeCloseTo(mockLayoutContext.constraints.maxHeight, 1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle single child layouts', () => {
            const singleChildRow = new Row({
                children: [new Text('Lonely')],
            });

            const result = singleChildRow.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });

        it('should handle zero flex values', () => {
            const row = new Row({
                children: [
                    new Flexible({
                        flex: 0,
                        child: new Text('Zero flex'),
                    }),
                    new Text('Normal'),
                ],
            });

            const result = row.layout(mockLayoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });

        it('should handle very large flex values', () => {
            const row = new Row({
                children: [
                    new Flexible({
                        flex: 1000,
                        child: new Text('Large flex'),
                    }),
                    new Flexible({
                        flex: 1,
                        child: new Text('Small flex'),
                    }),
                ],
            });

            const result = row.layout(mockLayoutContext);
            expect(result.size.width).toBeCloseTo(mockLayoutContext.constraints.maxWidth, 1);
        });

        it('should handle infinite constraints gracefully', () => {
            const infiniteConstraints: LayoutContext = {
                ...mockLayoutContext,
                constraints: BoxConstraints.expand(),
            };

            const row = new Row({
                mainAxisSize: MainAxisSize.Min,
                children: [new Text('Text')],
            });

            const result = row.layout(infiniteConstraints);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.width).toBeLessThan(Number.POSITIVE_INFINITY);
        });
    });
});