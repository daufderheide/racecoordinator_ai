import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SvgTextScalerDirective } from '../../directives/svg-text-scaler.directive';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { AcknowledgementModalComponent } from './acknowledgement-modal/acknowledgement-modal.component';
import { BackButtonComponent } from './back-button/back-button.component';
import { AudioSelectorComponent } from './audio-selector/audio-selector.component';
import { ItemSelectorComponent } from './item-selector/item-selector.component';
import { UndoRedoControlsComponent } from './undo-redo-controls/undo-redo-controls.component';
import { HeatListComponent } from './heat-list/heat-list.component';
import { AvatarUrlPipe } from '../../pipes/avatar-url.pipe';

@NgModule({
  declarations: [
    TranslatePipe,
    SvgTextScalerDirective,
    SvgTextScalerDirective,
    ConfirmationModalComponent,
    AcknowledgementModalComponent,
    BackButtonComponent,
    AudioSelectorComponent,
    ItemSelectorComponent,
    UndoRedoControlsComponent,
    HeatListComponent,
    AvatarUrlPipe
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
    SvgTextScalerDirective,
    ConfirmationModalComponent,
    AcknowledgementModalComponent,
    BackButtonComponent,
    AudioSelectorComponent,
    ItemSelectorComponent,
    UndoRedoControlsComponent,
    HeatListComponent,
    AvatarUrlPipe
  ]
})
export class SharedModule { }
