import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { ManagerHeaderComponent } from "src/app/components/shared/manager-header/manager-header.component";
import { DataService } from "src/app/data.service";
import { Driver } from "src/app/models/driver";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "src/app/services/connection-monitor.service";
import { GuideStep, HelpService } from "src/app/services/help.service";
import { SettingsService } from "src/app/services/settings.service";
import { TranslationService } from "src/app/services/translation.service";
import { naturalSortCompare } from "src/app/utils/sorting.utils";
import { ManagerHeaderComponent as ManagerHeaderComponent_1 } from "../shared/manager-header/manager-header.component";

import { FormsModule } from "@angular/forms";
import { AudioSelectorComponent } from "../shared/audio-selector/audio-selector.component";
import { ConfirmationModalComponent } from "../shared/confirmation-modal/confirmation-modal.component";

import { TranslatePipe } from "src/app/pipes/translate.pipe";
import { AvatarUrlPipe } from "src/app/pipes/avatar-url.pipe";

@Component({
  standalone: true,
  selector: "app-driver-manager",
  templateUrl: "./driver-manager.component.html",
  styleUrls: ["./driver-manager.component.css"],
  imports: [
    ManagerHeaderComponent_1,
    FormsModule,
    AudioSelectorComponent,
    ConfirmationModalComponent,
    TranslatePipe,
    AvatarUrlPipe,
  ],
})
export class DriverManagerComponent implements OnInit, OnDestroy {
  @ViewChild(ManagerHeaderComponent) header!: ManagerHeaderComponent;
  drivers: Driver[] = [];
  selectedDriver?: Driver;
  editingDriver?: Driver;
  soundAssets: any[] = [];
  isLoading: boolean = true;

  isSaving: boolean = false;
  scale: number = 1;
  searchQuery: string = "";
  @ViewChildren("driverRow") driverRows!: QueryList<ElementRef>;

  get filteredDrivers(): Driver[] {
    let filtered = this.drivers;
    if (this.searchQuery && this.searchQuery.trim() !== "") {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = this.drivers.filter(
        (d) =>
          (d.name && d.name.toLowerCase().includes(query)) ||
          (d.nickname && d.nickname.toLowerCase().includes(query)),
      );
    }
    return filtered.sort((a, b) =>
      naturalSortCompare(a.name || "", b.name || ""),
    );
  }

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute,
    private connectionMonitor: ConnectionMonitorService,
    private helpService: HelpService,
    private settingsService: SettingsService,
  ) {}

  ngOnInit() {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.loadData();
  }

  ngOnDestroy() {
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
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

  loadData() {
    this.isLoading = true;
    forkJoin({
      drivers: this.dataService.getDrivers(),
      assets: this.dataService.listAssets(),
    }).subscribe({
      next: (result: any) => {
        this.soundAssets = (result.assets || []).filter(
          (a: any) => a.type === "sound",
        );

        this.drivers = (result.drivers || []).map(
          (d: any) =>
            new Driver(
              d.entity_id,
              d.name,
              d.nickname || "",
              d.avatarUrl,
              {
                type: this.mapSoundType(d.lapAudio?.type || d.lapSoundType),
                url: d.lapAudio?.url || d.lapSoundUrl,
                text: d.lapAudio?.text || d.lapSoundText,
              },
              {
                type: this.mapSoundType(
                  d.bestLapAudio?.type || d.bestLapSoundType,
                ),
                url: d.bestLapAudio?.url || d.bestLapSoundUrl,
                text: d.bestLapAudio?.text || d.bestLapSoundText,
              },
            ),
        );

        const selectedId = this.route.snapshot.queryParamMap.get("id");
        if (selectedId) {
          const found = this.drivers.find((d) => d.entity_id === selectedId);
          if (found) {
            this.selectDriver(found);
          } else if (this.drivers.length > 0 && !this.selectedDriver) {
            this.selectDriver(this.drivers[0]);
          }
        } else if (this.drivers.length > 0 && !this.selectedDriver) {
          this.selectDriver(this.drivers[0]);
        }

        if (this.selectedDriver) {
          this.scrollToSelected();
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to load drivers", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectDriver(driver: Driver) {
    this.selectedDriver = driver;
    this.editingDriver = new Driver(
      driver.entity_id,
      driver.name,
      driver.nickname,
      driver.avatarUrl,
      { ...driver.lapAudio },
      { ...driver.bestLapAudio },
    );
    this.scrollToSelected();
  }

  private scrollToSelected() {
    if (!this.selectedDriver) return;
    const driverId = this.selectedDriver.entity_id;
    setTimeout(() => {
      const row = this.driverRows.find(
        (r) => r.nativeElement.getAttribute("data-id") === driverId,
      );
      if (row) {
        row.nativeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 100);
  }

  monitorConnection() {
    this.connectionSubscription =
      this.connectionMonitor.connectionState$.subscribe((state) => {
        this.isConnectionLost = state === ConnectionState.DISCONNECTED;
      });
  }

  private mapSoundType(type: string | undefined): "preset" | "tts" | "none" {
    if (type === "tts") return "tts";
    if (type === "none") return "none";
    return "preset";
  }

  updateDriver() {
    if (!this.selectedDriver) return;
    this.router.navigate(["/driver-editor"], {
      queryParams: { id: this.selectedDriver.entity_id },
    });
  }

  showDeleteConfirmation = false;

  deleteDriver() {
    if (!this.editingDriver) return;
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete() {
    if (!this.editingDriver) return;
    this.showDeleteConfirmation = false;
    this.isSaving = true;
    this.dataService.deleteDriver(this.editingDriver.entity_id).subscribe({
      next: () => {
        this.selectedDriver = undefined;
        this.editingDriver = undefined;
        this.isSaving = false;
        this.loadData();
      },
      error: (err) => {
        console.error("Failed to delete driver", err);
        this.isSaving = false;
      },
    });
  }

  onCancelDelete() {
    this.showDeleteConfirmation = false;
  }

  trackByDriver(index: number, driver: Driver): string {
    return driver.entity_id;
  }

  createNewDriver() {
    if (this.isSaving) return;
    this.isSaving = true;

    const baseName = this.translationService.translate(
      "DM_DEFAULT_DRIVER_NAME",
    );
    const baseNickname = this.translationService.translate(
      "DM_DEFAULT_DRIVER_NICKNAME",
    );

    const uniqueName = this.generateUniqueDriverName(baseName);
    const uniqueNickname = this.generateUniqueDriverNickname(baseNickname);

    const newDriver = {
      name: uniqueName,
      nickname: uniqueNickname,
      lapAudio: { type: "preset" },
      bestLapAudio: { type: "preset" },
    };

    this.dataService.createDriver(newDriver).subscribe({
      next: (createdDriver: any) => {
        this.isSaving = false;
        this.router.navigate(["/driver-editor"], {
          queryParams: { id: createdDriver.entity_id },
        });
      },
      error: (err) => {
        console.error("Failed to create new driver", err);
        this.isSaving = false;
      },
    });
  }

  private generateUniqueDriverName(baseName: string): string {
    let name = baseName;
    if (
      !this.drivers.some((d) => d.name.toLowerCase() === name.toLowerCase())
    ) {
      return name;
    }
    let counter = 1;
    while (true) {
      const candidate = `${baseName}_${counter}`;
      if (
        !this.drivers.some(
          (d) => d.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  private generateUniqueDriverNickname(baseNickname: string): string {
    let nickname = baseNickname;
    if (
      !this.drivers.some(
        (d) => d.nickname.toLowerCase() === nickname.toLowerCase(),
      )
    ) {
      return nickname;
    }
    let counter = 1;
    while (true) {
      const candidate = `${baseNickname}_${counter}`;
      if (
        !this.drivers.some(
          (d) => d.nickname.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  getHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("DM_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("DM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: ".sidebar-list",
        title: this.translationService.translate("DM_HELP_SIDEBAR_TITLE"),
        content: this.translationService.translate("DM_HELP_SIDEBAR_CONTENT"),
        position: "right",
      },
      {
        selector: ".detail-panel",
        title: this.translationService.translate("DM_HELP_DETAIL_TITLE"),
        content: this.translationService.translate("DM_HELP_DETAIL_CONTENT"),
        position: "left",
      },
    ];
  }
}
