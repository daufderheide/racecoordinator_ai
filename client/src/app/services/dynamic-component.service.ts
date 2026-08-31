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
import { UpdateSelectorComponent } from "@app/components/shared/update-selector/update-selector.component";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Injectable({
  providedIn: "root",
})
export class DynamicComponentService {
  private componentCount = 0;
  private tsLoaded = false;

  constructor() {}

  private async loadTypeScript(): Promise<any> {
    if (this.tsLoaded) {
      return (window as any).ts;
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "assets/typescript.js";
      script.onload = () => {
        this.tsLoaded = true;
        resolve((window as any).ts);
      };
      script.onerror = () => {
        reject(new Error("Failed to load typescript.js"));
      };
      document.head.appendChild(script);
    });
  }

  async createDynamicComponent(
    baseClass: Type<any>,
    html: string,
    css: string,
    tsCode: string,
  ): Promise<Type<any>> {
    // Increment count to ensure unique selector and ID
    const id = ++this.componentCount;
    const selector = `app-dynamic-component-${id}`;

    let DynamicComponent = class extends baseClass {};
    if (tsCode && tsCode.trim().length > 0) {
      DynamicComponent = await this.compileTypeScript(tsCode, baseClass);
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
        UpdateSelectorComponent,
      ],
    })(DynamicComponent);
  }

  private async compileTypeScript(
    tsCode: string,
    baseClass: Type<any>,
  ): Promise<Type<any>> {
    try {
      const ts = await this.loadTypeScript();
      let cleanedTs = tsCode;

      cleanedTs = cleanedTs.replace(
        /import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g,
        "",
      );
      cleanedTs = cleanedTs.replace(/import\s+['"][^'"]+['"];?/g, "");
      cleanedTs = cleanedTs.replace(/@Component\s*\([\s\S]*?\)/g, "");
      cleanedTs = cleanedTs.replace(
        /extends\s+CustomWidgetBaseComponent\b/g,
        "extends baseClass",
      );
      cleanedTs = cleanedTs.replace(/export\s+default\s+class\b/g, "class");
      cleanedTs = cleanedTs.replace(/export\s+class\b/g, "class");
      cleanedTs = cleanedTs.replace(
        /export\s+(interface|type|enum|const|let|var|function)\b/g,
        "$1",
      );

      let className = "";
      const classMatch = cleanedTs.match(/class\s+([A-Za-z0-9_$]+)/);
      if (classMatch) {
        className = classMatch[1];
      }

      const jsCode = ts.transpile(cleanedTs, {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.None,
      });

      let fnBody = jsCode;
      if (cleanedTs.trim().startsWith("return ")) {
        fnBody = jsCode;
      } else if (className) {
        fnBody = `${jsCode}\nreturn ${className};`;
      }

      const createClass = new Function("baseClass", "exports", fnBody);
      const exportsObj: Record<string, any> = {};
      const UserComponent = createClass(baseClass, exportsObj);
      if (
        UserComponent &&
        (UserComponent.prototype instanceof baseClass ||
          UserComponent === baseClass ||
          typeof UserComponent === "function")
      ) {
        return UserComponent;
      }
      console.error(
        "Custom component must return a class that extends baseClass",
      );
    } catch (e) {
      console.error("Failed to compile or evaluate custom typescript code", e);
    }
    return class extends baseClass {};
  }
}
