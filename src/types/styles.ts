/**
 * Style and theme type definitions
 * 
 * TODO: Implement based on dart-pdf theming system
 */

export interface TextStyle {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    color?: string;
    // TODO: Add more text style properties
}

export interface ContainerStyle {
    padding?: number;
    margin?: number;
    backgroundColor?: string;
    // TODO: Add more container style properties
}