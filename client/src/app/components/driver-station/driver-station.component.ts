import {
  ChangeDetectorRef,
  Compiler,
  Component,
  ComponentRef,
  effect,
  Inject,
  Injector,
  input,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { DataService } from "@app/data.service";
import { DynamicComponentService } from "@app/services/dynamic-component.service";
import { FileSystemService } from "@app/services/file-system.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RaceFlagService } from "@app/services/race-flag.service";

import { DefaultDriverStationComponent } from "./default-driver-station.component";

// Base class for custom components to extend, providing common services
export class CustomDriverStationBaseComponent extends DefaultDriverStationComponent {
  constructor(
    @Inject(ActivatedRoute) route: ActivatedRoute,
    @Inject(DataService) dataService: DataService,
    @Inject(RaceService) raceService: RaceService,
    @Inject(RaceConnectionService) raceConnectionService: RaceConnectionService,
    @Inject(RaceFlagService) raceFlagService: RaceFlagService,
    @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
    @Inject(LoggerService) logger: LoggerService,
  ) {
    super(
      route,
      dataService,
      raceService,
      raceConnectionService,
      raceFlagService,
      cdr,
      logger,
    );
  }
}

@Component({
  standalone: true,
  selector: "app-driver-station",
  templateUrl: "./driver-station.component.html",
  styleUrls: ["./driver-station.component.css"],
  imports: [],
})
export class DriverStationComponent implements OnInit {
  @ViewChild("container", { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;
  private componentRef: ComponentRef<any> | null = null;
  private childComponent: any;

  inputLaneIndex = input<number>();

  isLoading = true;
  error: string | null = null;

  constructor(
    private fileSystem: FileSystemService,
    private compiler: Compiler,
    private injector: Injector,
    private cdr: ChangeDetectorRef,
    private dynamicComponentService: DynamicComponentService,
    private logger: LoggerService,
  ) {
    effect(() => {
      const val = this.inputLaneIndex();
      this.updateChildInput(val);
    });
  }

  private updateChildInput(val?: number) {
    const laneVal = val !== undefined ? val : this.inputLaneIndex();
    if (this.componentRef && laneVal !== undefined) {
      if (typeof this.componentRef.setInput === "function") {
        this.componentRef.setInput("inputLaneIndex", laneVal);
      }
    }
    if (this.childComponent) {
      this.childComponent.inputLaneIndex = this.inputLaneIndex;
    }
  }

  async ngOnInit() {
    this.isLoading = true;
    this.container.clear();

    try {
      if (
        await this.fileSystem.hasCustomFiles(
          "driver-station.component.html",
          "driver-station",
        )
      ) {
        // Found in 'driver-station/' folder
        await this.loadCustomComponent("driver-station");
        this.cdr.detectChanges();
      } else if (
        await this.fileSystem.hasCustomFiles("driver-station.component.html")
      ) {
        // Fallback to root custom folder
        await this.loadCustomComponent();
        this.cdr.detectChanges();
      } else {
        this.loadDefaultComponent();
      }
    } catch (e: any) {
      this.logger.error(
        "Failed to load custom driver station component, falling back to default",
        e,
      );
      this.loadDefaultComponent();
    } finally {
      // Defer the loading state update to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.isLoading = false;
        this.updateChildInput();
        this.cdr.detectChanges();
      });
    }
  }

  loadDefaultComponent() {
    this.componentRef = this.container.createComponent(
      DefaultDriverStationComponent,
    );
    this.childComponent = this.componentRef.instance;
    this.updateChildInput();
  }

  async loadCustomComponent(subfolder?: string) {
    try {
      const html = await this.fileSystem.getCustomFile(
        "driver-station.component.html",
        subfolder,
      );

      let css = "";
      try {
        css = await this.fileSystem.getCustomFile(
          "driver-station.component.css",
          subfolder,
        );
      } catch (e) {
        this.logger.debug(
          "No custom CSS found for driver station, fetching default stylesheet...",
        );
        try {
          const response = await fetch(
            "/assets/default-styles/driver-station/default-driver-station.component.css",
          );
          if (response.ok) {
            css = await response.text();
          }
        } catch (fetchErr) {
          this.logger.warn(
            "Failed to fetch default stylesheet for driver-station",
            fetchErr,
          );
        }
      }

      let tsCode = "";
      try {
        tsCode = await this.fileSystem.getCustomFile(
          "driver-station.component.ts",
          subfolder,
        );
      } catch (e) {
        this.logger.debug("No custom TS found for driver station");
      }

      const baseClass = CustomDriverStationBaseComponent;
      const componentType =
        await this.dynamicComponentService.createDynamicComponent(
          baseClass,
          html,
          css,
          tsCode,
        );

      this.componentRef = this.container.createComponent(componentType);
      this.childComponent = this.componentRef.instance;
      this.updateChildInput();
    } catch (e) {
      // If we can't find the specific files, just throw so we fallback
      throw e;
    }
  }
}
