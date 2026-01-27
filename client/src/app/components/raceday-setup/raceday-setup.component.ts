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
import { CommonModule, NgIf } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FileSystemService } from 'src/app/services/file-system.service';
import { DefaultRacedaySetupComponent } from './default-raceday-setup.component';

import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { SettingsService } from 'src/app/services/settings.service';
import { ChangeDetectorRef } from '@angular/core';
import { DynamicComponentService } from 'src/app/services/dynamic-component.service';

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

  constructor(
    private fileSystem: FileSystemService,
    private compiler: Compiler,
    private injector: Injector,
    private cdr: ChangeDetectorRef,
    private dynamicComponentService: DynamicComponentService
  ) { }

  async ngOnInit() {
    this.isLoading = true;
    this.container.clear();

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
      // Just load default component on error
      this.loadDefaultComponent();
    } finally {
      this.isLoading = false;
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
      const baseClass = CustomUiBaseComponent;
      const componentType = this.dynamicComponentService.createDynamicComponent(
        baseClass,
        html,
        css,
        tsCode
      );
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



  async configureCustomView() {
    const success = await this.fileSystem.selectCustomFolder();
    if (success) {
      // Reload to apply changes
      window.location.reload();
    }
  }
}
