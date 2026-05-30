import {
  CdkDrag,
  CdkDragPreview,
  CdkDropList,
  DragDropModule,
} from "@angular/cdk/drag-drop";
import { ScrollingModule } from "@angular/cdk/scrolling";
import {
  CommonModule,
  DatePipe,
  DecimalPipe,
  NgClass,
  NgFor,
  NgIf,
  NgStyle,
} from "@angular/common";
import { Component, Injectable, Type } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterLink, RouterModule } from "@angular/router";
import { AboutDialogComponent } from "@app/components/shared/about-dialog/about-dialog.component";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { DemoConfigModalComponent } from "@app/components/shared/demo-config-modal/demo-config-modal.component";
import { ToolbarComponent } from "@app/components/shared/toolbar/toolbar.component";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Injectable({
  providedIn: "root",
})
export class DynamicComponentService {
  private componentCount = 0;

  constructor() {}

  createDynamicComponent(
    baseClass: Type<any>,
    html: string,
    css: string,
    _tsCode: string,
  ): Type<any> {
    // Increment count to ensure unique selector and ID
    const id = ++this.componentCount;
    const selector = `app-dynamic-component-${id}`;

    // Create a named class to help with debugging
    const DynamicComponent = class extends baseClass {};

    // Ensure custom dynamic components always act as a block-level full-height container
    // to match route transition constraints and prevent visual "popping"
    const hostCss = `:host { display: block; width: 100%; height: 100%; }`;
    const finalCss = css ? `${hostCss}\n${css}` : hostCss;

    return Component({
      selector: selector,
      template: html,
      styles: [finalCss],
      standalone: true,
      imports: [
        CommonModule,
        NgIf,
        NgFor,
        NgClass,
        NgStyle,
        DecimalPipe,
        DatePipe,
        DragDropModule,
        CdkDropList,
        CdkDrag,
        CdkDragPreview,
        ScrollingModule,
        FormsModule,
        ReactiveFormsModule,
        TranslatePipe,
        AcknowledgementModalComponent,
        ConfirmationModalComponent,
        AboutDialogComponent,
        ToolbarComponent,
        DemoConfigModalComponent,
        AvatarUrlPipe,
        RouterModule,
        RouterLink,
      ],
    })(DynamicComponent);
  }
}
