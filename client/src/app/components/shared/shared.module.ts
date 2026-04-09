import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AboutDialogComponent } from 'src/app/components/shared/about-dialog/about-dialog.component';
import { AcknowledgementModalComponent } from 'src/app/components/shared/acknowledgement-modal/acknowledgement-modal.component';
import { AudioSelectorComponent } from 'src/app/components/shared/audio-selector/audio-selector.component';
import { BackButtonComponent } from 'src/app/components/shared/back-button/back-button.component';
import { ConfirmationModalComponent } from 'src/app/components/shared/confirmation-modal/confirmation-modal.component';
import { EditorTitleComponent } from 'src/app/components/shared/editor-title/editor-title.component';
import { HeatListComponent } from 'src/app/components/shared/heat-list/heat-list.component';
import { HelpOverlayComponent } from 'src/app/components/shared/help-overlay/help-overlay.component';
import { ImageSelectorComponent } from 'src/app/components/shared/image-selector/image-selector.component';
import { InputDialogComponent } from 'src/app/components/shared/input-dialog/input-dialog.component';
import { ItemSelectorComponent } from 'src/app/components/shared/item-selector/item-selector.component';
import { ManagerHeaderComponent } from 'src/app/components/shared/manager-header/manager-header.component';
import { ToolbarComponent } from 'src/app/components/shared/toolbar/toolbar.component';
import { UndoRedoControlsComponent } from 'src/app/components/shared/undo-redo-controls/undo-redo-controls.component';
import { ColumnPreviewComponent } from 'src/app/components/ui-editor/column-preview/column-preview.component';
import { ReorderDialogComponent } from 'src/app/components/ui-editor/reorder-dialog/reorder-dialog.component';
import { SvgTextScalerDirective } from 'src/app/directives/svg-text-scaler.directive';
import { AvatarUrlPipe } from 'src/app/pipes/avatar-url.pipe';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

@NgModule({
  declarations: [
    TranslatePipe,
    SvgTextScalerDirective,
    ConfirmationModalComponent,
    AcknowledgementModalComponent,
    BackButtonComponent,
    AudioSelectorComponent,
    ItemSelectorComponent,
    UndoRedoControlsComponent,
    HeatListComponent,
    AvatarUrlPipe,
    HelpOverlayComponent,
    ImageSelectorComponent,
    ReorderDialogComponent,
    ColumnPreviewComponent,
    AboutDialogComponent,
    ToolbarComponent,
    ManagerHeaderComponent,
    EditorTitleComponent,
    InputDialogComponent
  ],

  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ScrollingModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ScrollingModule,
    TranslatePipe,
    SvgTextScalerDirective,
    ConfirmationModalComponent,
    AcknowledgementModalComponent,
    BackButtonComponent,
    AudioSelectorComponent,
    ItemSelectorComponent,
    UndoRedoControlsComponent,
    HeatListComponent,
    AvatarUrlPipe,
    HelpOverlayComponent,
    ImageSelectorComponent,
    ReorderDialogComponent,
    ColumnPreviewComponent,
    AboutDialogComponent,
    ToolbarComponent,
    ManagerHeaderComponent,
    EditorTitleComponent,
    InputDialogComponent
  ]

})
export class SharedModule { }
