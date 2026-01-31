import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SvgTextScalerDirective } from '../../directives/svg-text-scaler.directive';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { BackButtonComponent } from './back-button/back-button.component';

@NgModule({
  declarations: [
    TranslatePipe,
    SvgTextScalerDirective,
    ConfirmationModalComponent,
    BackButtonComponent
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
    SvgTextScalerDirective,
    ConfirmationModalComponent,
    BackButtonComponent
  ]
})
export class SharedModule { }
