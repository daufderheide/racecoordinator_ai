import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslatePipe } from '../pipes/translate.pipe';
import { SvgTextScalerDirective } from '../directives/svg-text-scaler.directive';

@NgModule({
  declarations: [
    TranslatePipe,
    SvgTextScalerDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TranslatePipe,
    SvgTextScalerDirective
  ]
})
export class SharedModule { }
