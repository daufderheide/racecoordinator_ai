import {
  ChangeDetectorRef,
  Compiler,
  Component,
  HostListener,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { of, Subscription } from "rxjs";
import { filter, take } from "rxjs/operators";
import { AboutDialogComponent } from "@app/components/shared/about-dialog/about-dialog.component";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
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
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  UpdateCheckResult,
  UpdateProgress,
  UpdateService,
} from "@app/services/update.service";
import { CLIENT_VERSION, getClientVersion } from "@app/version";

import { CustomUiBaseComponent } from "./custom-ui-base.component";
import { DefaultRacedaySetupComponent } from "./default-raceday-setup.component";
import { RacedayUpdateCoordinator } from "./raceday-update-coordinator";

@Component({
  standalone: true,
  selector: "app-raceday-setup",
  templateUrl: "./raceday-setup.component.html",
  styleUrl: "./raceday-setup.component.css",
  imports: [
    FormsModule,
    AboutDialogComponent,
    AcknowledgementModalComponent,
    TranslatePipe,
  ],
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
  clientVersion: string = CLIENT_VERSION;
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
  private systemStateSubscription?: Subscription;
  private route = inject(ActivatedRoute, { optional: true });

  private updateCoordinator: RacedayUpdateCoordinator;

  public get updateResult(): UpdateCheckResult | null {
    return this.updateCoordinator.updateResult;
  }
  public set updateResult(val: UpdateCheckResult | null) {
    this.updateCoordinator.updateResult = val;
  }

  public get isUpdating(): boolean {
    return this.updateCoordinator.isUpdating;
  }
  public set isUpdating(val: boolean) {
    this.updateCoordinator.isUpdating = val;
  }

  public get updateBannerDismissed(): boolean {
    return this.updateCoordinator.updateBannerDismissed;
  }
  public set updateBannerDismissed(val: boolean) {
    this.updateCoordinator.updateBannerDismissed = val;
  }

  public get updateProgress(): UpdateProgress | null {
    return this.updateCoordinator.updateProgress;
  }
  public set updateProgress(val: UpdateProgress | null) {
    this.updateCoordinator.updateProgress = val;
  }

  public get showUpToDateModal(): boolean {
    return this.updateCoordinator.showUpToDateModal;
  }
  public set showUpToDateModal(val: boolean) {
    this.updateCoordinator.showUpToDateModal = val;
  }

  public get progressSubscription(): Subscription | null {
    return this.updateCoordinator.progressSubscription;
  }
  public set progressSubscription(val: Subscription | null) {
    this.updateCoordinator.progressSubscription = val;
  }

  public get restartPollSubscription(): Subscription | null {
    return this.updateCoordinator.restartPollSubscription;
  }
  public set restartPollSubscription(val: Subscription | null) {
    this.updateCoordinator.restartPollSubscription = val;
  }

  public get targetUpdateVersion(): string | null {
    return this.updateCoordinator.targetUpdateVersion;
  }
  public set targetUpdateVersion(val: string | null) {
    this.updateCoordinator.targetUpdateVersion = val;
  }

  public get preUpdateServerVersion(): string | null {
    return this.updateCoordinator.preUpdateServerVersion;
  }
  public set preUpdateServerVersion(val: string | null) {
    this.updateCoordinator.preUpdateServerVersion = val;
  }

  public get updateTimedOut(): boolean {
    return this.updateCoordinator.updateTimedOut;
  }
  public set updateTimedOut(val: boolean) {
    this.updateCoordinator.updateTimedOut = val;
  }

  public get reloadApp(): () => void {
    return this.updateCoordinator.reloadApp;
  }
  public set reloadApp(val: () => void) {
    this.updateCoordinator.reloadApp = val;
  }

  public get updateVersionHtml(): string {
    return this.updateCoordinator.updateVersionHtml;
  }

  public get updateSubtext(): string | null {
    return this.updateCoordinator.updateSubtext;
  }

  public get isIndeterminateProgress(): boolean {
    return this.updateCoordinator.isIndeterminateProgress;
  }

  public get updateTitleTextKey(): string {
    return this.updateCoordinator.updateTitleTextKey;
  }

  public get showCancelInUpdate(): boolean {
    return this.updateCoordinator.showCancelInUpdate;
  }

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
    private navigationService: NavigationService,
    private updateService: UpdateService,
    private sanitizer: DomSanitizer,
  ) {
    this.updateCoordinator = new RacedayUpdateCoordinator(
      this.updateService,
      this.dataService,
      this.logger,
      {
        onStateChange: () => {
          this.syncChildComponentState();
          this.cdr.detectChanges();
        },
        onError: (msg: string) => {
          this.error = msg;
          setTimeout(() => {
            this.error = null;
            this.syncChildComponentState();
            this.cdr.detectChanges();
          }, 5000);
        },
        onStartRestartWatcher: () => {
          this.startRestartWatcher();
        },
      },
    );

    // Initialize quote keys
    for (let i = 1; i <= 29; i++) {
      this.quoteKeys.push(`RDS_QUOTE_${i}`);
    }

    if (this.shouldSkipIntro()) {
      this.showSplash = false;
      this.minTimeElapsed = true;
      this.connectionVerified = true;
    }
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  private updateScale() {
    this.scale = 1;
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
    this.checkPendingUpdateSession();

    const skipIntro = this.shouldSkipIntro();
    if (skipIntro) {
      this.showSplash = false;
      this.minTimeElapsed = true;
      this.connectionVerified = true;
      sessionStorage.removeItem("skipIntro");
      if (this.authService.currentRole !== Role.VIEWER) {
        this.loadDefaultComponent();
        this.hasLoadedSetupComponent = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }

    this.initSocketSubscriptions();
    this.initTranslationSubscriptions();
    this.loadServerSettings();

    await this.processSplashScreen(skipIntro);

    this.connectionMonitor.startMonitoring();
    this.monitorConnection();

    await this.waitForRole();
    await this.handleRoleTransition(skipIntro);
  }

  private initSocketSubscriptions() {
    (this.dataService.socketConnected$ || of(true))
      .pipe(
        filter((connected) => connected),
        take(1),
      )
      .subscribe(() => {
        this.refreshServerInfo();
        if (this.isUpdating) {
          this.dataService.getServerVersion().subscribe({
            next: (ver) => {
              const cleanVer = ver?.replace(/^v/, "");
              const cleanTarget = this.targetUpdateVersion?.replace(/^v/, "");
              if (cleanVer && cleanTarget && cleanVer === cleanTarget) {
                this.cleanupUpdateState();
                this.checkForUpdates();
              } else {
                this.startRestartWatcher();
              }
            },
            error: () => {
              this.startRestartWatcher();
            },
          });
        } else {
          this.checkForUpdates();
        }
      });
  }

  private initTranslationSubscriptions() {
    this.translationService.getTranslationsLoaded().subscribe((loaded) => {
      this.translationsLoaded = loaded;
      if (loaded && !this.quoteInterval && this.showSplash) {
        this.startQuoteRotation();
        this.cdr.detectChanges();
      }
    });
  }

  private loadServerSettings() {
    const settings = this.settingsService.getSettings();
    if (settings.serverIp && settings.serverPort) {
      this.tempServerIp = settings.serverIp;
      this.tempServerPort = settings.serverPort;
      this.dataService.setServerAddress(settings.serverIp, settings.serverPort);
    }
  }

  private shouldSkipIntro(): boolean {
    const priorUrl = this.getPriorUrl();
    let isReturningFromNonRaceScreen = false;
    if (priorUrl) {
      const raceScreens = [
        "/raceday",
        "/default-raceday",
        "/driver-station",
        "/heat-results",
        "/race-results",
        "/driver-results",
      ];
      const normalizedPriorUrl = priorUrl.split("?")[0];
      const isRaceScreen = raceScreens.some(
        (screen) =>
          normalizedPriorUrl === screen ||
          normalizedPriorUrl.startsWith(screen + "/"),
      );
      if (!isRaceScreen) {
        isReturningFromNonRaceScreen = true;
      }
    }

    const querySkipIntro =
      this.route?.snapshot?.queryParamMap?.get("skipIntro") === "true";
    return (
      querySkipIntro ||
      sessionStorage.getItem("skipIntro") === "true" ||
      isReturningFromNonRaceScreen
    );
  }

  private getPriorUrl(): string | null {
    const routerUrl = this.router?.url ? this.router.url.split("?")[0] : null;
    if (routerUrl && routerUrl !== "/raceday-setup" && routerUrl !== "/") {
      return routerUrl;
    }

    const lastHistory = this.navigationService?.getLastHistoryUrl?.()
      ? this.navigationService.getLastHistoryUrl()!.split("?")[0]
      : null;
    if (
      lastHistory &&
      lastHistory !== "/raceday-setup" &&
      lastHistory !== "/"
    ) {
      return lastHistory;
    }

    return this.navigationService?.getPreviousUrl?.() || null;
  }

  private async processSplashScreen(skipIntro: boolean): Promise<void> {
    if (skipIntro) {
      sessionStorage.removeItem("skipIntro");
      this.showSplash = false;
      this.minTimeElapsed = true;
      this.connectionVerified = true;
      return;
    }

    this.startSplashTimeoutTimer();
    const minTimePromise = new Promise<void>((resolve) =>
      setTimeout(() => {
        this.minTimeElapsed = true;
        resolve();
      }, 5000),
    );

    await this.connectionMonitor.waitForConnection();
    this.connectionVerified = true;
    this.refreshServerInfo();

    try {
      await this.authService.fetchRoleFromServer().toPromise();
    } catch (err) {
      this.logger.warn("Failed to fetch role after connecting", err);
    }

    await minTimePromise;
  }

  private async waitForRole(): Promise<void> {
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
      if (isDone && sub) {
        sub.unsubscribe();
      }
    });

    this.logger.info(
      "Role initialization complete. Current role: " +
        this.authService.currentRole,
    );
  }

  async handleRoleTransition(skipIntro: boolean = false) {
    const isViewer = this.authService.currentRole === Role.VIEWER;

    if (!isViewer) {
      if (this.hasLoadedSetupComponent) {
        try {
          if (
            await this.fileSystem.hasCustomFiles(
              "raceday-setup.component.html",
              "raceday-setup",
            )
          ) {
            this.container.clear();
            await this.loadCustomComponent("raceday-setup");
            this.cdr.detectChanges();
          } else if (
            await this.fileSystem.hasCustomFiles("raceday-setup.component.html")
          ) {
            this.container.clear();
            await this.loadCustomComponent();
            this.cdr.detectChanges();
          }
        } catch (e: any) {
          this.logger.error("Failed to check custom component override", e);
        }
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
      this.systemStateSubscription = this.dataService
        .getSystemState()
        .subscribe((state) => {
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
    if (this.systemStateSubscription) {
      this.systemStateSubscription.unsubscribe();
    }
    this.updateCoordinator.destroy();
  }

  private activeChildComponentRef: any = null;

  public get isUpdateBannerVisible(): boolean {
    return this.updateCoordinator.isUpdateBannerVisible;
  }

  public syncChildComponentState() {
    if (this.activeChildComponentRef) {
      try {
        this.activeChildComponentRef.setInput(
          "isUpdateBannerVisible",
          this.isUpdateBannerVisible,
        );
      } catch (e) {
        if (this.activeChildComponentRef.instance) {
          this.activeChildComponentRef.instance.isUpdateBannerVisible =
            this.isUpdateBannerVisible;
        }
      }
    }
  }

  public checkForUpdates(force: boolean = false) {
    this.updateCoordinator.checkForUpdates(force);
  }

  public acknowledgeUpToDate() {
    this.updateCoordinator.acknowledgeUpToDate();
  }

  public dismissUpdateBanner() {
    this.updateCoordinator.dismissUpdateBanner();
  }

  public get PENDING_UPDATE_KEY(): string {
    return this.updateCoordinator.PENDING_UPDATE_KEY;
  }

  public savePendingUpdateSession(
    targetVersion: string | null,
    initialVersion: string | null,
  ) {
    this.updateCoordinator.savePendingUpdateSession(
      targetVersion,
      initialVersion,
    );
  }

  public clearPendingUpdateSession() {
    this.updateCoordinator.clearPendingUpdateSession();
  }

  public checkPendingUpdateSession() {
    this.updateCoordinator.checkPendingUpdateSession();
  }

  public cleanupUpdateState() {
    this.updateCoordinator.cleanupUpdateState();
  }

  public startRestartWatcher() {
    this.updateCoordinator.doStartRestartWatcher();
  }

  public installUpdate() {
    this.updateCoordinator.installUpdate(this.serverVersion);
  }

  public cancelUpdate() {
    this.updateCoordinator.cancelUpdate();
  }

  public retryUpdate() {
    this.cleanupUpdateState();
    this.checkForUpdates(true);
  }

  public waitForServerRestartAndReload(
    pollIntervalMs = 1000,
    initialDelayMs = 2000,
  ): void {
    this.updateCoordinator.waitForServerRestartAndReload(
      pollIntervalMs,
      initialDelayMs,
    );
  }

  public skipVersion() {
    this.updateCoordinator.skipVersion();
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
    if (this.isUpdating) {
      this.logger.info(
        "Connection lost during auto-update. Installer is updating the server.",
      );
      if (this.updateProgress?.status !== "RDS_UPDATE_STATUS_RESTARTING") {
        this.updateProgress = {
          progress: 100,
          status: "RDS_UPDATE_STATUS_INSTALLING",
        };
      }
      this.syncChildComponentState();
      this.cdr.detectChanges();
      return;
    }
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
    if (this.isUpdating && this.targetUpdateVersion) {
      this.dataService.getServerVersion().subscribe({
        next: (ver) => {
          const cleanVer = ver?.replace(/^v/, "");
          const cleanTarget = this.targetUpdateVersion?.replace(/^v/, "");
          if (cleanVer === cleanTarget) {
            this.logger.info(
              "Server restored with target update version! Reloading...",
            );
            this.cleanupUpdateState();
            this.reloadApp();
          }
        },
      });
    }
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
        this.clientVersion = getClientVersion(version);
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status !== 0) {
          this.logger.warn("Failed to fetch server version", err);
        }
      },
    });

    this.dataService.getServerIp().subscribe({
      next: (ip) => {
        this.serverIp = ip;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status !== 0) {
          this.logger.warn("Failed to fetch server IP", err);
        }
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

  private wireChildComponentEvents(instance: any) {
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
    if (instance.requestCheckForUpdates) {
      instance.requestCheckForUpdates.subscribe(() => {
        this.checkForUpdates(true);
      });
    }
  }

  loadDefaultComponent() {
    const componentRef = this.container.createComponent(
      DefaultRacedaySetupComponent,
    );
    this.activeChildComponentRef = componentRef;
    this.syncChildComponentState();
    this.wireChildComponentEvents(componentRef.instance);
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
      const componentType =
        await this.dynamicComponentService.createDynamicComponent(
          baseClass,
          html,
          css,
          tsCode,
        );
      // Create the component directly (no Module required for standalone)
      const componentRef = this.container.createComponent(componentType);
      this.activeChildComponentRef = componentRef;
      this.syncChildComponentState();
      this.wireChildComponentEvents(componentRef.instance);
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
