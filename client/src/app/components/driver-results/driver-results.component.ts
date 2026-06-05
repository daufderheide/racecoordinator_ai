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
import { ActivatedRoute } from "@angular/router";
import { DataService } from "@app/data.service";
import { DynamicComponentService } from "@app/services/dynamic-component.service";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultDriverResultsComponent } from "./default-driver-results.component";

// Base class for custom components to extend, providing common services
class CustomDriverResultsBaseComponent extends DefaultDriverResultsComponent {
  constructor(
    @Inject(ActivatedRoute) route: ActivatedRoute,
    @Inject(RaceService) raceService: RaceService,
    @Inject(RaceConnectionService) raceConnectionService: RaceConnectionService,
    @Inject(TranslationService) translationService: TranslationService,
    @Inject(PrintService) printService: PrintService,
    @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
    @Inject(DataService) dataService: DataService,
  ) {
    super(
      route,
      raceService,
      raceConnectionService,
      translationService,
      printService,
      cdr,
      dataService,
    );
  }
}

@Component({
  standalone: true,
  selector: "app-driver-results",
  templateUrl: "./driver-results.component.html",
  styleUrls: ["./driver-results.component.css"],
  imports: [],
})
export class DriverResultsComponent implements OnInit {
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
          "driver-results.component.html",
          "driver-results",
        )
      ) {
        // Found in 'driver-results/' folder
        await this.loadCustomComponent("driver-results");
        this.cdr.detectChanges();
      } else if (
        await this.fileSystem.hasCustomFiles("driver-results.component.html")
      ) {
        // Fallback to root custom folder
        await this.loadCustomComponent();
        this.cdr.detectChanges();
      } else {
        this.loadDefaultComponent();
      }
    } catch (e: any) {
      this.logger.error(
        "Failed to load custom driver results component, falling back to default",
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
      DefaultDriverResultsComponent,
    );
    this.childComponent = componentRef.instance;
  }

  async loadCustomComponent(subfolder?: string) {
    try {
      const html = await this.fileSystem.getCustomFile(
        "driver-results.component.html",
        subfolder,
      );

      let css = "";
      try {
        css = await this.fileSystem.getCustomFile(
          "driver-results.component.css",
          subfolder,
        );
      } catch (e) {
        this.logger.debug(
          "No custom CSS found for driver results, fetching default stylesheet...",
        );
        try {
          const response = await fetch(
            "/assets/default-styles/driver-results/default-driver-results.component.css",
          );
          if (response.ok) {
            css = await response.text();
          }
        } catch (fetchErr) {
          this.logger.warn(
            "Failed to fetch default stylesheet for driver-results",
            fetchErr,
          );
        }
      }

      let tsCode = "";
      try {
        tsCode = await this.fileSystem.getCustomFile(
          "driver-results.component.ts",
          subfolder,
        );
      } catch (e) {
        this.logger.debug("No custom TS found for driver results");
      }

      const baseClass = CustomDriverResultsBaseComponent;
      const componentType = this.dynamicComponentService.createDynamicComponent(
        baseClass,
        html,
        css,
        tsCode,
      );

      const componentRef = this.container.createComponent(componentType);
      this.childComponent = componentRef.instance;
    } catch (e) {
      // If we can't find the specific driver results files, just throw so we fallback
      throw e;
    }
  }
}
