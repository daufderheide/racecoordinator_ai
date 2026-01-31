import { Injectable, Type, Component, NgModule } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass, NgStyle, DecimalPipe } from '@angular/common';
import { DragDropModule, CdkDropList, CdkDrag, CdkDragPreview } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../components/shared/shared.module';

import * as ts from 'typescript';

@Injectable({
  providedIn: 'root'
})
export class DynamicComponentService {

  constructor() { }

  createDynamicComponent(
    baseClass: Type<any>,
    html: string,
    css: string,
    tsCode: string
  ): Type<any> {
    // If tsCode is provided, we nominally support transpiling it, 
    // but without a sophisticated loader, we can't easily inject user logic 
    // that imports other modules. 
    // For now, we follow the pattern of creating a class that extends the base class.

    // Future improvement: If we want to support actual TS logic execution:
    // 1. Transpile `tsCode` to JS.
    // 2. Evaluate it to get the class definition.
    // 3. Ensure it extends `baseClass`.

    // Current implementation: Just create a class extending base class
    // and apply the template/styles.

    // Create a named class to help with debugging
    const DynamicComponent = class extends baseClass { };

    return Component({
      template: html,
      styles: [css],
      standalone: true,
      imports: [
        CommonModule,
        SharedModule,
        NgIf,
        NgFor,
        NgClass,
        NgStyle,
        DecimalPipe,
        DragDropModule,
        CdkDropList,
        CdkDrag,
        CdkDragPreview,
        ScrollingModule,
        FormsModule,
        ReactiveFormsModule
        // Add other common modules here as needed for future compatibility
      ]
    })(DynamicComponent);
  }
}
