import { ChangeDetectorRef } from "@angular/core";
import {
  Compiler,
  Component,
  HostListener,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AboutDialogComponent } from "@app/components/shared/about-dialog/about-dialog.component";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { DynamicComponentService } from "@app/services/dynamic-component.service";
import { FileSystemService } from "@app/services/file-system.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { RaceService } from "@app/services/race.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultRacedaySetupComponent } from "./default-raceday-setup.component";

class CustomUiBaseComponent extends DefaultRacedaySetupComponent {
  constructor(
    @Inject(DataService) dataService: DataService,
    @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
    @Inject(RaceService) raceService: RaceService,
    @Inject(Router) router: Router,
    @Inject(TranslationService) translationService: TranslationService,
    @Inject(SettingsService) settingsService: SettingsService,
    @Inject(FileSystemService) fileSystem: FileSystemService,
    @Inject(HelpService) helpService: HelpService,
    @Inject(LoggerService) logger: LoggerService,
    @Inject(ParticipantValidationService)
    validationService: ParticipantValidationService,
  ) {
    super(
      dataService,
      cdr,
      raceService,
      router,
      translationService,
      settingsService,
      fileSystem,
      helpService,
      logger,
      validationService,
    );
  }
}

@Component({
  standalone: true,
  selector: "app-raceday-setup",
  templateUrl: "./raceday-setup.component.html",
  styleUrl: "./raceday-setup.component.css",
  imports: [FormsModule, AboutDialogComponent, TranslatePipe],
})
export class RacedaySetupComponent implements OnInit, OnDestroy {
  @ViewChild("container", { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  error: string | null = null;
  isLoading = true;

  showSplash = true;
  splashTimeoutElapsed = false;
  systemState: any = null;
  private splashTimeoutTimer: any = null;
  connectionVerified = false;
  minTimeElapsed = false;
  translationsLoaded = false;
  showServerConfig = false;
  tempServerIp = "localhost";
  tempServerPort = 7070;
  serverIp: string = "";
  serverVersion: string = "";
  clientVersion: string = (window as any).CLIENT_VERSION_OVERRIDE || "0.0.0.22";
  showAboutDialog = false;

  scale: number = 1;

  quoteKeys: string[] = [];
  currentQuoteKey: string = "";
  quoteVisible = true;
  private quoteInterval: any;

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;
  private retryStartTime: number = 0;
  private retryTimeout: any;

  public Role = Role;
  public directorPassword = "";
  public showPassword = false;
  private hasLoadedSetupComponent = false;

  constructor(
    private fileSystem: FileSystemService,
    private compiler: Compiler,
    private injector: Injector,
    private cdr: ChangeDetectorRef,
    private dynamicComponentService: DynamicComponentService,
    private dataService: DataService,
    private settingsService: SettingsService,
    private translationService: TranslationService,
    private connectionMonitor: ConnectionMonitorService,
    private logger: LoggerService,
    public authService: AuthService,
    private router: Router,
  ) {
    // Initialize quote keys
    for (let i = 1; i <= 29; i++) {
      this.quoteKeys.push(`RDS_QUOTE_${i}`);
    }
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;

    this.scale = Math.min(scaleX, scaleY);
  }

  get isServerConnected(): boolean {
    return (
      this.connectionVerified &&
      this.connectionMonitor.currentState === ConnectionState.CONNECTED
    );
  }

  startSplashTimeoutTimer() {
    if (this.splashTimeoutTimer) {
      clearTimeout(this.splashTimeoutTimer);
    }
    this.splashTimeoutElapsed = false;
    this.splashTimeoutTimer = setTimeout(() => {
      this.splashTimeoutElapsed = true;
      this.cdr.detectChanges();
    }, 5000);
  }

  async ngOnInit() {
    this.updateScale();
    this.isLoading = true;
    this.container.clear();

    this.refreshServerInfo();

    // Start Splash Screen Logic ONLY when translations are ready
    // This prevents raw keys from showing
    this.translationService.getTranslationsLoaded().subscribe((loaded) => {
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
    const skipIntro = sessionStorage.getItem("skipIntro") === "true";
    if (skipIntro) {
      sessionStorage.removeItem("skipIntro");
      this.showSplash = false;
      this.minTimeElapsed = true;

      // If skipping intro, we still assume connection attempts happen in background
      this.connectionVerified = true;
    } else {
      // Start Splash Screen Logic
      this.startSplashTimeoutTimer();

      const minTimePromise = new Promise<void>((resolve) =>
        setTimeout(() => {
          this.minTimeElapsed = true;
          resolve();
        }, 5000),
      );

      // Wait for connection service
      await this.connectionMonitor.waitForConnection();
      this.connectionVerified = true;
      this.refreshServerInfo();

      try {
        await this.authService.fetchRoleFromServer().toPromise();
      } catch (err) {
        this.logger.warn("Failed to fetch role after connecting", err);
      }

      // Wait for the remainder of the 5s (if any)
      await minTimePromise;
    }

    // Start global monitoring
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();

    // Wait for role initialization
    await new Promise<void>((resolve) => {
      let isDone = false;
      let sub: Subscription | null = null;
      sub = this.authService.roleInitialized$.subscribe((init) => {
        if (init) {
          isDone = true;
          resolve();
          if (sub) {
            sub.unsubscribe();
          }
        }
      });
      // In case it resolved synchronously and sub wasn't set yet during callback
      if (isDone && sub) {
        sub.unsubscribe();
      }
    });

    this.logger.info(
      "Role initialization complete. Current role: " +
        this.authService.currentRole,
    );

    await this.handleRoleTransition(skipIntro);
  }

  async handleRoleTransition(skipIntro: boolean = false) {
    const isViewer = this.authService.currentRole === Role.VIEWER;

    if (!isViewer) {
      if (this.hasLoadedSetupComponent) {
        return;
      }
      this.hasLoadedSetupComponent = true;
      this.logger.info("User is not a viewer. Loading component...");
      try {
        if (
          await this.fileSystem.hasCustomFiles(
            "raceday-setup.component.html",
            "raceday-setup",
          )
        ) {
          // Found in 'raceday-setup/' folder
          await this.loadCustomComponent("raceday-setup");
        } else if (
          await this.fileSystem.hasCustomFiles("raceday-setup.component.html")
        ) {
          // Fallback to root custom folder
          await this.loadCustomComponent();
        } else {
          this.loadDefaultComponent();
        }
        this.cdr.detectChanges();
      } catch (e: any) {
        this.logger.error(
          "Failed to load custom component, falling back to default",
          e,
        );
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
    } else {
      // Viewer logic
      this.isLoading = false;
      if (skipIntro) {
        this.showSplash = true; // Always show splash for viewer
      }
      this.cdr.detectChanges();

      // Subscribe to system state to know when race starts
      this.dataService.getSystemState().subscribe((state) => {
        this.systemState = state;
        if (state && state.resourceLockState === "RACE_RUNNING") {
          this.router.navigate(["/raceday"]);
        }
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy() {
    this.stopQuoteRotation();
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.splashTimeoutTimer) {
      clearTimeout(this.splashTimeoutTimer);
    }
  }

  // Wrappers to match previous API if needed, or we implement logic directly
  monitorConnection() {
    this.connectionSubscription =
      this.connectionMonitor.connectionState$.subscribe((state) => {
        if (state === ConnectionState.DISCONNECTED && !this.isConnectionLost) {
          this.handleConnectionLoss();
        } else if (
          state === ConnectionState.CONNECTED &&
          this.isConnectionLost
        ) {
          this.handleConnectionRestored();
        }
      });
  }

  handleConnectionLoss() {
    this.logger.warn("Connection lost, starting retry sequence...");
    this.isConnectionLost = true;
    this.retryStartTime = Date.now();
    this.cdr.detectChanges();

    // Start a check for timeout
    this.checkRetryTimeout();
  }

  handleConnectionRestored() {
    this.logger.info("Connection restored!");
    this.isConnectionLost = false;
    this.refreshServerInfo();
    this.cdr.detectChanges();
  }

  checkRetryTimeout() {
    if (!this.isConnectionLost) return;
    if ((window as any).disableConnectionTimeout) {
      return;
    }

    // If we are still lost after 5 seconds, reset UI
    this.retryTimeout = setTimeout(() => {
      if (this.isConnectionLost) {
        this.logger.warn(
          "Connection retry timed out. Resetting to splash screen.",
        );
        this.resetToSplash();
      }
      this.retryTimeout = null;
    }, 5000);
  }

  resetToSplash() {
    this.isConnectionLost = false; // clear overlay, show splash
    this.showSplash = true;
    this.minTimeElapsed = false;
    this.connectionVerified = false;
    this.startSplashTimeoutTimer();
    this.cdr.detectChanges();

    this.stopQuoteRotation();
    if (this.translationsLoaded) {
      this.startQuoteRotation();
    }

    // Restart wait process
    this.connectionMonitor.waitForConnection().then(() => {
      this.showSplash = false;
      this.stopQuoteRotation();
      this.refreshServerInfo();
      this.cdr.detectChanges();
    });
  }

  private refreshServerInfo() {
    this.dataService.getServerVersion().subscribe({
      next: (version) => {
        this.serverVersion = version;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.warn("Failed to fetch server version", err);
      },
    });

    this.dataService.getServerIp().subscribe({
      next: (ip) => {
        this.serverIp = ip;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.warn("Failed to fetch server IP", err);
      },
    });
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
      this.currentQuoteKey = this.availableQuotes.pop() || "";
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

  openServerConfig() {
    this.showServerConfig = true;
    this.showPassword = false;
    if (this.authService.currentRole === Role.ADMIN) {
      this.authService.getDirectorPassword().subscribe({
        next: (pwd) => {
          this.directorPassword = pwd;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Failed to get director password", err);
          this.directorPassword = "";
          this.cdr.detectChanges();
        },
      });
    } else {
      this.directorPassword = "";
    }
  }

  toggleServerConfig() {
    if (!this.showServerConfig) {
      this.openServerConfig();
    } else {
      this.showServerConfig = false;
    }
  }

  saveServerConfig() {
    const settings = this.settingsService.getSettings();
    settings.serverIp = this.tempServerIp;
    settings.serverPort = this.tempServerPort;
    this.settingsService.saveSettings(settings);
    this.dataService.setServerAddress(this.tempServerIp, this.tempServerPort);

    const passwordToTry = this.directorPassword;
    this.directorPassword = "";
    this.showServerConfig = false;

    if (this.authService.currentRole === Role.ADMIN) {
      this.authService.changeDirectorPassword(passwordToTry).subscribe({
        next: (success) => {
          if (!success) {
            this.error = "Failed to update Director password";
            setTimeout(() => {
              this.error = null;
            }, 5000);
          }
          this.refreshConnectionAfterSave();
        },
        error: (err) => {
          this.logger.error("Failed to change password", err);
          this.error = "Failed to update Director password";
          setTimeout(() => {
            this.error = null;
          }, 5000);
          this.refreshConnectionAfterSave();
        },
      });
    } else {
      this.refreshConnectionAfterSave(passwordToTry);
    }
  }

  private refreshConnectionAfterSave(passwordToTry?: string) {
    // Reset connection verification to force a new check with new address
    this.connectionVerified = false;
    this.connectionMonitor.checkConnection().subscribe();

    // UI wait
    this.connectionMonitor.waitForConnection().then(() => {
      this.connectionVerified = true;
      if (
        passwordToTry &&
        this.authService.currentRole !== Role.ADMIN &&
        this.authService.currentRole !== Role.DIRECTOR
      ) {
        this.authService.loginAsDirector(passwordToTry).subscribe((success) => {
          if (!success) {
            this.error = "Failed to authenticate as Director";
            setTimeout(() => {
              this.error = null;
            }, 5000);
          } else {
            this.authService.fetchRoleFromServer().subscribe(() => {
              this.handleRoleTransition(false);
            });
          }
        });
      } else {
        this.handleRoleTransition(false);
      }
    });
  }

  // TODO(aufderheide): Remove this unused code.
  // Old methods removed/replaced
  waitForConnection() {
    /* removed */
  }
  startConnectionMonitoring() {
    /* removed */
  }
  stopConnectionMonitoring() {
    /* removed */
  }
  checkConnection() {
    /* removed */
  }
  retryConnection() {
    /* removed */
  }

  loadDefaultComponent() {
    const componentRef = this.container.createComponent(
      DefaultRacedaySetupComponent,
    );
    componentRef.instance.requestServerConfig.subscribe(() => {
      this.openServerConfig();
      this.cdr.detectChanges();
    });
    componentRef.instance.requestAbout.subscribe(() => {
      this.showAboutDialog = true;
      this.cdr.detectChanges();
    });
  }

  async loadCustomComponent(subfolder?: string) {
    try {
      const html = await this.fileSystem.getCustomFile(
        "raceday-setup.component.html",
        subfolder,
      );
      let css = "";
      try {
        css = await this.fileSystem.getCustomFile(
          "raceday-setup.component.css",
          subfolder,
        );
      } catch (e) {
        this.logger.debug(
          "No custom CSS found or could not be read, fetching default stylesheet...",
        );
        try {
          const response = await fetch(
            "/assets/default-styles/raceday-setup/default-raceday-setup.component.css",
          );
          if (response.ok) {
            css = await response.text();
          }
        } catch (fetchErr) {
          this.logger.warn(
            "Failed to fetch default stylesheet for raceday-setup",
            fetchErr,
          );
        }
      }

      let tsCode = "";
      try {
        tsCode = await this.fileSystem.getCustomFile(
          "raceday-setup.component.ts",
          subfolder,
        );
      } catch (e) {
        this.logger.debug("No custom TS found");
      }

      // Create Custom Component Class
      const baseClass = CustomUiBaseComponent;
      const componentType = this.dynamicComponentService.createDynamicComponent(
        baseClass,
        html,
        css,
        tsCode,
      );
      // Create the component directly (no Module required for standalone)
      const componentRef = this.container.createComponent(componentType);

      // Subscribe to server config request
      if (componentRef.instance instanceof DefaultRacedaySetupComponent) {
        componentRef.instance.requestServerConfig.subscribe(() => {
          this.openServerConfig();
          this.cdr.detectChanges();
        });
        componentRef.instance.requestAbout.subscribe(() => {
          this.showAboutDialog = true;
          this.cdr.detectChanges();
        });
      } else {
        // Fallback for dynamic types where instanceof might fail or if structure is different
        // We know it extends CustomUiBaseComponent extends DefaultRacedaySetupComponent
        const instance = componentRef.instance as any;
        if (instance.requestServerConfig) {
          instance.requestServerConfig.subscribe(() => {
            this.openServerConfig();
            this.cdr.detectChanges();
          });
        }
        if (instance.requestAbout) {
          instance.requestAbout.subscribe(() => {
            this.showAboutDialog = true;
            this.cdr.detectChanges();
          });
        }
      }
    } catch (e: any) {
      // Propagate specific error message
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      if (errorMsg.includes("Permission denied")) {
        throw new Error(
          "Permission denied to access custom files. Please re-select the folder.",
        );
      } else if (errorMsg.includes("not found")) {
        throw new Error(
          `Required file not found in custom folder: ${e.message}`,
        );
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
