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
import { DataService } from "@app/data.service";
import { CanComponentDeactivate } from "@app/guards/raceday.guard";
import { AuthService } from "@app/services/auth.service";
import { DynamicComponentService } from "@app/services/dynamic-component.service";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

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
    @Inject(LoggerService) logger: LoggerService,
    @Inject(ActivatedRoute) route: ActivatedRoute,
    @Inject(PrintService) printService: PrintService,
    @Inject(AuthService) authService: AuthService,
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
      logger,
      route,
      printService,
      authService,
    );
  }
}

@Component({
  standalone: true,
  selector: "app-raceday",
  templateUrl: "./raceday.component.html",
  styleUrls: ["./raceday.component.css"],
  imports: [],
})
export class RacedayComponent
  implements OnInit, OnDestroy, CanComponentDeactivate
{
  @ViewChild("container", { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;
  private childComponent: any;

  isLoading = true;
  error: string | null = null;

  constructor(
    private fileSystem: FileSystemService,
    private compiler: Compiler,
    private injector: Injector,
    private cdr: ChangeDetectorRef,
    private dynamicComponentService: DynamicComponentService,
    private logger: LoggerService,
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    this.container.clear();

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

  loadDefaultComponent() {
    const componentRef = this.container.createComponent(
      DefaultRacedayComponent,
    );
    this.childComponent = componentRef.instance;
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
        this.logger.debug("No custom CSS found for raceday");
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
      const componentType = this.dynamicComponentService.createDynamicComponent(
        baseClass,
        html,
        css,
        tsCode,
      );

      const componentRef = this.container.createComponent(componentType);
      this.childComponent = componentRef.instance;
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
