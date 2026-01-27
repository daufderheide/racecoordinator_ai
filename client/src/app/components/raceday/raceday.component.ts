
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
  Inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass, NgStyle, DecimalPipe } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FileSystemService } from 'src/app/services/file-system.service';
import { DefaultRacedayComponent } from './default-raceday.component';
import * as ts from 'typescript';
import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';

// Base class for custom components to extend, providing common services
class CustomRacedayBaseComponent extends DefaultRacedayComponent {
  constructor(
    @Inject(TranslationService) translationService: TranslationService,
    @Inject(DataService) dataService: DataService,
    @Inject(RaceService) raceService: RaceService,
    @Inject(Router) router: Router,
    @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef
  ) {
    super(translationService, dataService, raceService, router, cdr);
  }
}

@Component({
  selector: 'app-raceday',
  templateUrl: './raceday.component.html',
  styleUrls: ['./raceday.component.css'],
  standalone: false
})
export class RacedayComponent implements OnInit {
  @ViewChild('container', { read: ViewContainerRef, static: true }) container!: ViewContainerRef;

  isLoading = true;
  error: string | null = null;

  constructor(
    private fileSystem: FileSystemService,
    private compiler: Compiler,
    private injector: Injector,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.isLoading = true;
    this.container.clear();

    try {
      if (await this.fileSystem.hasCustomFiles()) {
        // Check if a specific raceday override exists, or if we should use the same folder but look for raceday files?
        // The requirement says: "use the same folder selected in the option customize ui".
        // The fileSystem service uses 'raceday-setup-dir' handle.
        // We should look for 'raceday.component.html' / .css / .ts in that same folder.

        // Note: hasCustomFiles checks for 'raceday-setup.component.html'. 
        // We should probably check for 'raceday.component.html' specifically here.
        // But the requirement says "if the custom files are not found in the custom folder, fallback".

        // Let's try to load custom component.
        await this.loadCustomComponent();
        this.cdr.detectChanges();
      } else {
        this.loadDefaultComponent();
      }
    } catch (e: any) {
      console.error('Failed to load custom raceday component, falling back to default', e);
      this.loadDefaultComponent();
    } finally {
      // Defer the loading state update to avoid ExpressionChangedAfterItHasBeenCheckedError
      // and ensure the view updates correctly.
      setTimeout(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  loadDefaultComponent() {
    this.container.createComponent(DefaultRacedayComponent);
  }

  async loadCustomComponent() {
    try {
      // We'll throw if the specific file 'raceday.component.html' is missing, triggering fallback.
      // The 'hasCustomFiles' check in FS service checks for raceday-setup.html. 
      // We might have a setup file but not a raceday file.
      // So we should try to get the file, and if it fails, we catch and fallback.

      const html = await this.fileSystem.getCustomFile('raceday.component.html');

      let css = '';
      try {
        css = await this.fileSystem.getCustomFile('raceday.component.css');
      } catch (e) {
        console.log('No custom CSS found for raceday');
      }

      let tsCode = '';
      try {
        tsCode = await this.fileSystem.getCustomFile('raceday.component.ts');
      } catch (e) {
        console.log('No custom TS found for raceday');
      }

      let componentType: Type<any>;

      if (tsCode) {
        componentType = this.createDynamicComponentClass(tsCode, html, css);
      } else {
        const StandaloneCustomRacedayComponent = class extends CustomRacedayBaseComponent { };

        componentType = Component({
          template: html,
          styles: [css],
          standalone: true,
          imports: [CommonModule, SharedModule, NgIf, NgFor, NgClass, NgStyle, DecimalPipe]
        })(StandaloneCustomRacedayComponent);
      }

      this.container.createComponent(componentType);

    } catch (e) {
      // If we can't find the specific raceday files, just throw so we fallback
      throw e;
    }
  }

  private createDynamicComponentClass(tsCode: string, html: string, css: string): Type<any> {
    // Basic implementation assuming no complex imports in user TS for now, similar to setup
    const result = ts.transpileModule(tsCode, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2015 }
    });

    const StandaloneCustomRacedayComponent = class extends CustomRacedayBaseComponent { };

    return Component({
      template: html,
      styles: [css],
      standalone: true,
      imports: [CommonModule, SharedModule, NgIf, NgFor, NgClass, NgStyle, DecimalPipe]
    })(StandaloneCustomRacedayComponent);
  }
}
