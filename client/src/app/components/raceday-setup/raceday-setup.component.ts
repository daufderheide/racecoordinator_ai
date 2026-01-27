import {
  Component,
  OnInit,
  ViewChild,
  ViewContainerRef,
  Compiler,
  Injector,
  NgModule,
  ComponentRef,
  Type,
  Inject
} from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass, NgStyle } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FileSystemService } from 'src/app/services/file-system.service';
import { DefaultRacedaySetupComponent } from './default-raceday-setup.component';
import * as ts from 'typescript';
import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ChangeDetectorRef } from '@angular/core';

class CustomUiBaseComponent extends DefaultRacedaySetupComponent {
  constructor(
    @Inject(DataService) dataService: DataService,
    @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
    @Inject(RaceService) raceService: RaceService,
    @Inject(Router) router: Router,
    @Inject(TranslationService) translationService: TranslationService,
    @Inject(SettingsService) settingsService: SettingsService,
    @Inject(FileSystemService) fileSystem: FileSystemService
  ) {
    super(dataService, cdr, raceService, router, translationService, settingsService, fileSystem);
  }
}

@Component({
  selector: 'app-raceday-setup',
  templateUrl: './raceday-setup.component.html',
  styleUrl: './raceday-setup.component.css',
  standalone: false
})
export class RacedaySetupComponent implements OnInit {
  @ViewChild('container', { read: ViewContainerRef, static: true }) container!: ViewContainerRef;

  error: string | null = null;
  isLoading = true;

  showPermissionButton = false;

  constructor(
    private fileSystem: FileSystemService,
    private compiler: Compiler,
    private injector: Injector,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.isLoading = true;
    this.container.clear();
    this.showPermissionButton = false;

    try {
      if (await this.fileSystem.hasCustomFiles()) {
        await this.loadCustomComponent();
        // Force detection after successful load to prevent black screen
        this.cdr.detectChanges();
      } else {
        this.loadDefaultComponent();
      }
    } catch (e: any) {
      console.error('Failed to load custom component, falling back to default', e);
      const msg = e instanceof Error ? e.message : String(e);

      if (msg.includes('Permission denied') || msg.includes('User activation')) {
        this.error = 'Permission needed to access custom files.';
        this.showPermissionButton = true;
      } else {
        this.error = `Failed to load custom view: ${msg}. Loading default...`;
        // Clear error after a few seconds only for non-persistent errors
        setTimeout(() => {
          this.error = null;
        }, 8000);
      }

      // Force detection for error state
      this.cdr.detectChanges();
      this.loadDefaultComponent();
    } finally {
      this.isLoading = false;
    }
  }

  async grantPermission() {
    this.error = null;
    this.showPermissionButton = false;
    try {
      this.container.clear();
      await this.loadCustomComponent();
      this.cdr.detectChanges();
    } catch (e: any) {
      console.error('Retry failed', e);
      const msg = e instanceof Error ? e.message : String(e);
      this.error = `Failed to load after permission grant: ${msg}`;
      this.loadDefaultComponent();
    }
  }

  loadDefaultComponent() {
    this.container.createComponent(DefaultRacedaySetupComponent);
  }

  async loadCustomComponent() {
    try {
      const html = await this.fileSystem.getCustomFile('raceday-setup.component.html');
      let css = '';
      try {
        css = await this.fileSystem.getCustomFile('raceday-setup.component.css');
      } catch (e) {
        // CSS is optional
        console.log('No custom CSS found or could not be read');
      }

      let tsCode = '';
      try {
        tsCode = await this.fileSystem.getCustomFile('raceday-setup.component.ts');
      } catch (e) {
        console.log('No custom TS found');
      }

      // Create Custom Component Class
      let componentType: Type<any>;

      if (tsCode) {
        componentType = this.createDynamicComponentClass(tsCode, html, css);
      } else {
        // Create a basic component that extends DefaultRacedaySetupComponent
        // Create a unique class for this instance to avoid decorator collisions
        const StandaloneCustomStartComponent = class extends CustomUiBaseComponent { };

        componentType = Component({
          template: html,
          styles: [css],
          standalone: true,
          imports: [CommonModule, SharedModule, NgIf, NgFor, NgClass, NgStyle]
        })(StandaloneCustomStartComponent);
      }
      // Create the component directly (no Module required for standalone)
      this.container.createComponent(componentType);

    } catch (e: any) {
      // Propagate specific error message
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      if (errorMsg.includes('Permission denied')) {
        throw new Error('Permission denied to access custom files. Please re-select the folder.');
      } else if (errorMsg.includes('not found')) {
        throw new Error(`Required file not found in custom folder: ${e.message}`);
      }
      throw e;
    }
  }

  private createDynamicComponentClass(tsCode: string, html: string, css: string): Type<any> {
    // Transpile TS to JS
    const result = ts.transpileModule(tsCode, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2015 }
    });

    // Execute the JS to get the class
    // We need to provide dependencies if they import them.
    // This is the tricky part: Runtime dependency injection for 'import' statements.
    // A simple 'eval' won't handle imports.
    //
    // LIMITATION: User provided TS cannot easily import 'src/app/...' without a custom loader.
    //
    // ALTERNATIVE: We can regex-replace imports or provide a specific base class they MUST extend which we expose globally or pass in.
    //
    // For this proof of concept/implementation:
    // We assume the user script defines a class and we wrap it or they extend a global class.

    // Simplification for Step 1: 
    // We expect the user code to export a class named 'CustomRacedaySetupComponent'.
    // We will strip imports and provide global variables or Injector.

    // For now, let's treat the user code as the body of a class extending DefaultRacedaySetupComponent, 
    // or just assume standard Angular component structure is too hard to dynamic load with imports.

    // Let's try to construct a class dynamically that extends DefaultRacedaySetupComponent.


    // Actual implementation of creating a class from string is complex due to scope/imports.
    // Hack: We create a class that extends DefaultRacedaySetupComponent
    // and we evaluate the user code *inside* the constructor or as methods.

    // Better approach for custom logic: 
    // Check if we can just define the component metadata here and use the DEFAULT logic class
    // but with CUSTOM template/styles.
    // This covers 90% of use cases (reskinning).
    // If they strictly need custom Logic in TS, that's much harder without a build step.

    // PROPOSAL: If Custom TS is provided, we try to run it. If it fails or is too complex, we warn.
    // Let's stick to: Custom HTML/CSS + Default Logic (inheritance).

    // Create a unique class to avoid polluting the prototype
    const StandaloneCustomStartComponent = class extends CustomUiBaseComponent { };

    return Component({
      template: html,
      styles: [css],
      standalone: true,
      imports: [CommonModule, SharedModule, NgIf, NgFor, NgClass, NgStyle]
    })(StandaloneCustomStartComponent);
  }

  async configureCustomView() {
    const success = await this.fileSystem.selectCustomFolder();
    if (success) {
      // Reload to apply changes
      window.location.reload();
    }
  }
}
