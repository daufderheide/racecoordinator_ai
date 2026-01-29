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
import { timeout } from 'rxjs/operators';

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


  showSplash = true;
  connectionVerified = false;
  minTimeElapsed = false;
  translationsLoaded = false;
  showServerConfig = false;
  tempServerIp = 'localhost';
  tempServerPort = 7070;

  quoteKeys: string[] = [];
  currentQuoteKey: string = '';
  quoteVisible = true;
  private quoteInterval: any;

  // Connection Monitoring
  isConnectionLost = false;
  private connectionMonitorInterval: any;
  private retryStartTime: number = 0;

  constructor(
    private fileSystem: FileSystemService,
    private compiler: Compiler,
    private injector: Injector,
    private cdr: ChangeDetectorRef,
    private dynamicComponentService: DynamicComponentService,
    private dataService: DataService,
    private settingsService: SettingsService,
    private translationService: TranslationService
  ) {
    // Initialize quote keys
    for (let i = 1; i <= 29; i++) {
      this.quoteKeys.push(`RDS_QUOTE_${i}`);
    }
  }

  async ngOnInit() {
    this.isLoading = true;
    this.container.clear();

    // Start Splash Screen Logic ONLY when translations are ready
    // This prevents raw keys from showing
    this.translationService.getTranslationsLoaded().subscribe(loaded => {
      this.translationsLoaded = loaded;
      if (loaded && !this.quoteInterval && this.showSplash) {
        this.startQuoteRotation();
        this.cdr.detectChanges();
      }
    });

    // Load Server Settings
    const settings = this.settingsService.getSettings();
    if (settings.serverIp && settings.serverPort) {
      this.tempServerIp = settings.serverIp;
      this.tempServerPort = settings.serverPort;
      this.dataService.setServerAddress(settings.serverIp, settings.serverPort);
    }

    // Check if we should skip the splash screen (e.g. after UI switch)
    const skipIntro = sessionStorage.getItem('skipIntro') === 'true';
    if (skipIntro) {
      sessionStorage.removeItem('skipIntro');
      this.showSplash = false;
      this.minTimeElapsed = true;

      // If skipping intro, we also skip the blocking connection wait
      // but ensure we still try to verify connection in background for status
      this.connectionVerified = true;
      // We set this true to unblock logic, but DataService will fail if offline.
      // We accept that the component might load with empty data.
    } else {
      // Start Splash Screen Logic
      // this.startQuoteRotation(); // MOVED: Called only when translations are loaded

      const minTimePromise = new Promise<void>(resolve => setTimeout(() => {
        this.minTimeElapsed = true;
        resolve();
      }, 5000));

      // Wait for connection BEFORE loading the component to ensure data fetch succeeds
      await this.waitForConnection();

      // Wait for the remainder of the 5s (if any)
      await minTimePromise;
    }

    try {
      if (await this.fileSystem.hasCustomFiles()) {
        await this.loadCustomComponent();
      } else {
        this.loadDefaultComponent();
      }
      // Force change detection after component load to prevent NG0100 with dynamic components
      this.cdr.detectChanges();
    } catch (e: any) {
      console.error('Failed to load custom component, falling back to default', e);
      this.loadDefaultComponent();
      this.cdr.detectChanges();
    } finally {
      this.isLoading = false;
    }

    if (!skipIntro) {
      // Smooth transition
      this.showSplash = false;
      this.stopQuoteRotation();
      this.cdr.detectChanges();
    }

    // Start Splash Screen Logic ONLY when translations are ready
    // This prevents raw keys from showing
  }

  ngOnDestroy() {
    this.stopQuoteRotation();
  }

  startQuoteRotation() {
    this.rotateQuote();
    this.startQuoteInterval();
  }

  startQuoteInterval() {
    this.stopQuoteRotation();
    this.quoteInterval = setInterval(() => {
      this.rotateQuote();
      this.cdr.detectChanges();
    }, 15000);
  }

  stopQuoteRotation() {
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
      this.quoteInterval = null;
    }
  }

  onQuoteClick() {
    this.rotateQuote();
    // Reset the timer so the user has full time to read the new quote
    this.startQuoteInterval();
  }

  private availableQuotes: string[] = [];
  rotateQuote() {
    this.quoteVisible = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.availableQuotes.length === 0) {
        // Refill and shuffle
        this.availableQuotes = [...this.quoteKeys];
        this.shuffleArray(this.availableQuotes);
      }
      this.currentQuoteKey = this.availableQuotes.pop() || '';
      this.quoteVisible = true;
      this.cdr.detectChanges();
    }, 500); // 500ms match CSS transition
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  toggleServerConfig() {
    this.showServerConfig = !this.showServerConfig;
  }

  saveServerConfig() {
    const settings = this.settingsService.getSettings();
    settings.serverIp = this.tempServerIp;
    settings.serverPort = this.tempServerPort;
    this.settingsService.saveSettings(settings);
    this.dataService.setServerAddress(this.tempServerIp, this.tempServerPort);
    this.showServerConfig = false;

    // Reset connection verification to force a new check with new address
    this.connectionVerified = false;
    this.waitForConnection();
  }

  async waitForConnection(): Promise<void> {
    while (!this.connectionVerified) {
      try {
        await new Promise((resolve, reject) => {
          this.dataService.getDrivers().subscribe({
            next: () => {
              this.connectionVerified = true;
              resolve(true);
            },
            error: (err) => {
              resolve(false);
            }
          });
        });

        if (this.connectionVerified) break;

        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        // Should not happen with above logic, but safety net
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Once connected, start monitoring for loss
    this.startConnectionMonitoring();
  }

  startConnectionMonitoring() {
    this.stopConnectionMonitoring();
    this.connectionMonitorInterval = setInterval(async () => {
      this.checkConnection();
    }, 5000); // Check every 5 seconds
  }

  stopConnectionMonitoring() {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
  }

  async checkConnection() {
    // Perform a lightweight check (e.g., get drivers or races)
    // If we were already in a lost state, this function wouldn't be called by the interval
    // (the interval calls this, but we clear it on loss)

    this.dataService.getDrivers().pipe(timeout(3000)).subscribe({
      next: () => {
        // Connection is good
      },
      error: (err) => {
        console.warn('Connection lost, starting retry sequence...', err);
        this.handleConnectionLoss();
      }
    });
  }

  handleConnectionLoss() {
    this.stopConnectionMonitoring();
    this.isConnectionLost = true;
    this.retryStartTime = Date.now();
    this.cdr.detectChanges();

    this.retryConnection();
  }

  retryConnection() {
    // Check if 5 seconds elapsed
    if (Date.now() - this.retryStartTime > 5000) {
      console.warn('Connection retry timed out. Resetting to splash screen.');
      this.isConnectionLost = false;
      this.showSplash = true;
      this.minTimeElapsed = false;
      this.connectionVerified = false;
      this.cdr.detectChanges();

      this.stopQuoteRotation();
      // Reset splash logic
      if (this.translationsLoaded) {
        this.startQuoteRotation();
      }

      // Restart the main wait loop
      this.waitForConnection().then(() => {
        this.showSplash = false;
        this.stopQuoteRotation();
        this.cdr.detectChanges();
      });
      return;
    }

    // Try checking
    this.dataService.getDrivers().pipe(timeout(1000)).subscribe({
      next: () => {
        console.log('Connection restored!');
        this.isConnectionLost = false;
        this.cdr.detectChanges();
        this.startConnectionMonitoring();
      },
      error: () => {
        // Retry in 1 second
        setTimeout(() => this.retryConnection(), 1000);
      }
    });
  }

  loadDefaultComponent() {
    const componentRef = this.container.createComponent(DefaultRacedaySetupComponent);
    componentRef.instance.requestServerConfig.subscribe(() => {
      this.showServerConfig = true;
      this.cdr.detectChanges();
    });
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
      const componentRef = this.container.createComponent(componentType);

      // Subscribe to server config request
      if (componentRef.instance instanceof DefaultRacedaySetupComponent) {
        componentRef.instance.requestServerConfig.subscribe(() => {
          this.showServerConfig = true;
          this.cdr.detectChanges();
        });
      } else {
        // Fallback for dynamic types where instanceof might fail or if structure is different
        // We know it extends CustomUiBaseComponent extends DefaultRacedaySetupComponent
        const instance = componentRef.instance as any;
        if (instance.requestServerConfig) {
          instance.requestServerConfig.subscribe(() => {
            this.showServerConfig = true;
            this.cdr.detectChanges();
          });
        }
      }

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
