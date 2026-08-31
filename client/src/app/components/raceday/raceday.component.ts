import {
  ChangeDetectorRef,
  Compiler,
  Component,
  ElementRef,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { ActivatedRoute, Router, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { AboutDialogComponent } from "@app/components/shared/about-dialog/about-dialog.component";
import { DataService } from "@app/data.service";
import { CanComponentDeactivate } from "@app/guards/raceday.guard";
import { AuthService } from "@app/services/auth.service";
import { ChildWindowManagerService } from "@app/services/child-window-manager.service";
import { CustomUiService } from "@app/services/custom-ui.service";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { DynamicComponentService } from "@app/services/dynamic-component.service";
import { FileSystemService } from "@app/services/file-system.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { RacePredictionService } from "@app/services/race-prediction.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";
import { CLIENT_VERSION, getClientVersion } from "@app/version";

import { DefaultRacedayComponent } from "./default-raceday.component";

// Base class for custom components to extend, providing common services
class CustomRacedayBaseComponent extends DefaultRacedayComponent {
  constructor(
    @Inject(ElementRef) el: ElementRef,
    @Inject(TranslationService) translationService: TranslationService,
    @Inject(DataService) dataService: DataService,
    @Inject(RaceService) raceService: RaceService,
    @Inject(SettingsService) settingsService: SettingsService,
    @Inject(RaceFlagService) raceFlagService: RaceFlagService,
    @Inject(Router) router: Router,
    @Inject(RaceConnectionService) raceConnectionService: RaceConnectionService,
    @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
    @Inject(ThemeService) themeService: ThemeService,
    @Inject(CustomUiService) customUiService: CustomUiService,
    @Inject(LoggerService) logger: LoggerService,
    @Inject(ActivatedRoute) route: ActivatedRoute,
    @Inject(PrintService) printService: PrintService,
    @Inject(AuthService) authService: AuthService,
    @Inject(HelpService) helpService: HelpService,
    @Inject(RacePredictionService) predictionService: RacePredictionService,
    @Inject(ChildWindowManagerService)
    childWindowManagerService?: ChildWindowManagerService,
    @Inject(CustomWidgetService) customWidgetService?: CustomWidgetService,
  ) {
    super(
      el,
      translationService,
      dataService,
      raceService,
      settingsService,
      raceFlagService,
      router,
      raceConnectionService,
      cdr,
      themeService,
      customUiService,
      logger,
      route,
      printService,
      authService,
      helpService,
      predictionService,
      childWindowManagerService,
      customWidgetService,
    );
  }
}

@Component({
  standalone: true,
  selector: "app-raceday",
  templateUrl: "./raceday.component.html",
  styleUrls: ["./raceday.component.css"],
  imports: [AboutDialogComponent],
})
export class RacedayComponent
  implements OnInit, OnDestroy, CanComponentDeactivate
{
  @ViewChild("container", { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;
  private childComponent: any;

  isLoading = true;
  error: string | null = null;

  showAboutDialog = false;
  serverVersion = "";
  serverIp = "";
  serverPort = 7070;
  clientVersion: string = CLIENT_VERSION;

  constructor(
    private fileSystem: FileSystemService,
    private compiler: Compiler,
    private injector: Injector,
    private cdr: ChangeDetectorRef,
    private dynamicComponentService: DynamicComponentService,
    private logger: LoggerService,
    private dataService: DataService,
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    this.container.clear();
    this.refreshServerInfo();

    try {
      if (
        await this.fileSystem.hasCustomFiles(
          "raceday.component.html",
          "raceday",
        )
      ) {
        // Found in 'raceday/' folder
        await this.loadCustomComponent("raceday");
        this.cdr.detectChanges();
      } else if (
        await this.fileSystem.hasCustomFiles("raceday.component.html")
      ) {
        // Fallback to root custom folder
        await this.loadCustomComponent();
        this.cdr.detectChanges();
      } else {
        this.loadDefaultComponent();
      }
    } catch (e: any) {
      this.logger.error(
        "Failed to load custom raceday component, falling back to default",
        e,
      );
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

  loadDefaultComponent() {
    const componentRef = this.container.createComponent(
      DefaultRacedayComponent,
    );
    this.childComponent = componentRef.instance;
    if (this.childComponent && this.childComponent.requestAbout) {
      this.childComponent.requestAbout.subscribe(() => {
        this.showAboutDialog = true;
        this.cdr.detectChanges();
      });
    }
  }

  async loadCustomComponent(subfolder?: string) {
    try {
      const html = await this.fileSystem.getCustomFile(
        "raceday.component.html",
        subfolder,
      );

      let css = "";
      try {
        css = await this.fileSystem.getCustomFile(
          "raceday.component.css",
          subfolder,
        );
      } catch (e) {
        this.logger.debug(
          "No custom CSS found for raceday, fetching default stylesheet...",
        );
        try {
          const response = await fetch(
            "/assets/default-styles/raceday/default-raceday.component.css",
          );
          if (response.ok) {
            css = await response.text();
          }
        } catch (fetchErr) {
          this.logger.warn(
            "Failed to fetch default stylesheet for raceday",
            fetchErr,
          );
        }
      }

      let tsCode = "";
      try {
        tsCode = await this.fileSystem.getCustomFile(
          "raceday.component.ts",
          subfolder,
        );
      } catch (e) {
        this.logger.debug("No custom TS found for raceday");
      }

      const baseClass = CustomRacedayBaseComponent;
      const componentType =
        await this.dynamicComponentService.createDynamicComponent(
          baseClass,
          html,
          css,
          tsCode,
        );

      const componentRef = this.container.createComponent(componentType);
      this.childComponent = componentRef.instance;
      if (this.childComponent && this.childComponent.requestAbout) {
        this.childComponent.requestAbout.subscribe(() => {
          this.showAboutDialog = true;
          this.cdr.detectChanges();
        });
      }
    } catch (e) {
      // If we can't find the specific raceday files, just throw so we fallback
      throw e;
    }
  }

  canDeactivate(
    nextState?: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.childComponent && this.childComponent.canDeactivate) {
      return this.childComponent.canDeactivate(nextState);
    }
    return true;
  }

  ngOnDestroy() {
    this.container.clear();
  }
}
