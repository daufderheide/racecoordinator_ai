import {
  CdkDrag,
  CdkDragPreview,
  CdkDropList,
  DragDropModule,
} from "@angular/cdk/drag-drop";
import { ScrollingModule } from "@angular/cdk/scrolling";
import {
  AsyncPipe,
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
import { LoginDialogComponent } from "@app/components/login-dialog/login-dialog.component";
import { AboutDialogComponent } from "@app/components/shared/about-dialog/about-dialog.component";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { DemoConfigModalComponent } from "@app/components/shared/demo-config-modal/demo-config-modal.component";
import { LanguageSelectorComponent } from "@app/components/shared/language-selector/language-selector.component";
import { ToolbarComponent } from "@app/components/shared/toolbar/toolbar.component";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Injectable({
  providedIn: "root",
})
export class DynamicComponentService {
  private componentCount = 0;

  constructor() {}

  async createDynamicComponent(
    baseClass: Type<any>,
    html: string,
    css: string,
    tsCode: string,
  ): Promise<Type<any>> {
    // Increment count to ensure unique selector and ID
    const id = ++this.componentCount;
    const selector = `app-dynamic-component-${id}`;

    // Create a named class to help with debugging
    let DynamicComponent = class extends baseClass {};

    if (tsCode && tsCode.trim().length > 0) {
      try {
        const ts = await import("typescript");
        const jsCode = ts.transpile(tsCode, { target: ts.ScriptTarget.ES2022 });
        const createClass = new Function("baseClass", jsCode);
        const UserComponent = createClass(baseClass);
        if (UserComponent && UserComponent.prototype instanceof baseClass) {
          DynamicComponent = UserComponent;
        } else {
          console.error(
            "Custom component must return a class that extends baseClass",
          );
        }
      } catch (e) {
        console.error(
          "Failed to compile or evaluate custom typescript code",
          e,
        );
      }
    }

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
        AsyncPipe,
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
        LoginDialogComponent,
        LanguageSelectorComponent,
      ],
    })(DynamicComponent);
  }
}
