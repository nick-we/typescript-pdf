/**
 * Text widget
 * 
 * TODO: Implement based on dart-pdf Text widget
 */

import { Widget } from './widget.js';

export class Text extends Widget {
    constructor(private content: string) {
        super();
    }
}