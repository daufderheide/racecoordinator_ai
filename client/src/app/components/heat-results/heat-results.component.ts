import {
  ChangeDetectorRef,
  Compiler,
  Component,
  Inject,
  Injector,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { DynamicComponentService } from "@app/services/dynamic-component.service";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultHeatResultsComponent } from "./default-heat-results.component";

// Base class for custom components to extend, providing common services
export class CustomHeatResultsBaseComponent extends DefaultHeatResultsComponent {
  constructor(
    @Inject(RaceConnectionService) raceConnectionService: RaceConnectionService,
    @Inject(RaceService) raceService: RaceService,
    @Inject(TranslationService) translationService: TranslationService,
    @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
    @Inject(PrintService) printService: PrintService,
  ) {
    super(
      raceConnectionService,
      raceService,
      translationService,
      cdr,
      printService,
    );
  }
}

@Component({
  standalone: true,
  selector: "app-heat-results",
  templateUrl: "./heat-results.component.html",
  styleUrls: ["./heat-results.component.css"],
  imports: [],
})
export class HeatResultsComponent implements OnInit {
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
          "heat-results.component.html",
          "heat-results",
        )
      ) {
        // Found in 'heat-results/' folder
        await this.loadCustomComponent("heat-results");
        this.cdr.detectChanges();
      } else if (
        await this.fileSystem.hasCustomFiles("heat-results.component.html")
      ) {
        // Fallback to root custom folder
        await this.loadCustomComponent();
        this.cdr.detectChanges();
      } else {
        this.loadDefaultComponent();
      }
    } catch (e: any) {
      this.logger.error(
        "Failed to load custom heat results component, falling back to default",
        e,
      );
      this.loadDefaultComponent();
    } finally {
      // Defer the loading state update to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  loadDefaultComponent() {
    const componentRef = this.container.createComponent(
      DefaultHeatResultsComponent,
    );
    this.childComponent = componentRef.instance;
  }

  async loadCustomComponent(subfolder?: string) {
    try {
      const html = await this.fileSystem.getCustomFile(
        "heat-results.component.html",
        subfolder,
      );

      let css = "";
      try {
        css = await this.fileSystem.getCustomFile(
          "heat-results.component.css",
          subfolder,
        );
      } catch (e) {
        this.logger.debug(
          "No custom CSS found for heat results, fetching default stylesheet...",
        );
        try {
          const response = await fetch(
            "/assets/default-styles/heat-results/default-heat-results.component.css",
          );
          if (response.ok) {
            css = await response.text();
          }
        } catch (fetchErr) {
          this.logger.warn(
            "Failed to fetch default stylesheet for heat-results",
            fetchErr,
          );
        }
      }

      let tsCode = "";
      try {
        tsCode = await this.fileSystem.getCustomFile(
          "heat-results.component.ts",
          subfolder,
        );
      } catch (e) {
        this.logger.debug("No custom TS found for heat results");
      }

      const baseClass = CustomHeatResultsBaseComponent;
      const componentType =
        await this.dynamicComponentService.createDynamicComponent(
          baseClass,
          html,
          css,
          tsCode,
        );

      const componentRef = this.container.createComponent(componentType);
      this.childComponent = componentRef.instance;
    } catch (e) {
      // If we can't find the specific heat results files, just throw so we fallback
      throw e;
    }
  }
}
