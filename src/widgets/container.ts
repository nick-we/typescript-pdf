/**
 * Container widget
 * 
 * TODO: Implement based on dart-pdf Container widget
 */

import { Widget } from './widget.js';

export class Container extends Widget {
    constructor(private child?: Widget) {
        super();
    }
}