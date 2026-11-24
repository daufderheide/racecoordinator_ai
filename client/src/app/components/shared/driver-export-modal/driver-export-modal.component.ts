import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { saveFileAs } from "@app/utils/file-download.utils";

export type DriverExportFormat = "csv" | "xlsx" | "json";

/** What the dialog exports: drivers (the default) or slotcars (#1210, step 6a). */
export type ExportKind = "drivers" | "cars";

/** The texts, element ids and file name per kind; drivers keep their old ids. */
const KIND_CONFIG = {
  drivers: {
    idPrefix: "driver-export",
    titleKey: "DEM_TITLE",
    countKey: "DEM_DRIVER_COUNT",
    countIcon: "people",
    infoKey: "DEM_EXPORT_INFO",
    noteKey: "DEM_SHARED_AUDIO_INFO",
    exportingKey: "DEM_EXPORTING",
    buttonKey: "DEM_BTN_EXPORT",
    errorKey: "DEM_ERROR_EXPORT_FAILED",
    fileName: "drivers_export.zip",
  },
  cars: {
    idPrefix: "car-export",
    titleKey: "CEM_TITLE",
    countKey: "CEM_CAR_COUNT",
    countIcon: "directions_car",
    infoKey: "CEM_EXPORT_INFO",
    noteKey: "CEM_OWN_FIELDS_INFO",
    exportingKey: "CEM_EXPORTING",
    buttonKey: "CEM_BTN_EXPORT",
    errorKey: "CEM_ERROR_EXPORT_FAILED",
    fileName: "cars_export.zip",
  },
};

@Component({
  standalone: true,
  selector: "app-driver-export-modal",
  templateUrl: "./driver-export-modal.component.html",
  styleUrls: ["./driver-export-modal.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class DriverExportModalComponent {
  visible = input(false);
  /** How many drivers (or cars) will be exported. */
  driverCount = input(0);
  kind = input<ExportKind>("drivers");

  config = computed(() => KIND_CONFIG[this.kind()] || KIND_CONFIG.drivers);

  close = output<void>();
  exported = output<{ format: DriverExportFormat }>();

  selectedFormat: DriverExportFormat = "csv";
  isExporting = false;
  errorMessage: string | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  selectFormat(format: DriverExportFormat) {
    if (this.isExporting) return;
    this.selectedFormat = format;
    this.cdr.detectChanges();
  }

  onClose() {
    if (this.isExporting) return;
    this.errorMessage = null;
    this.close.emit();
  }

  async onExport() {
    if (this.isExporting || this.driverCount() === 0) return;

    this.isExporting = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    try {
      const blob = await firstValueFrom(
        this.kind() === "cars"
          ? this.dataService.exportCars(this.selectedFormat)
          : this.dataService.exportDrivers(this.selectedFormat),
      );

      const saved = await saveFileAs({
        suggestedName: this.config().fileName,
        data: blob,
        mimeType: "application/zip",
        description: "ZIP Archive",
        extension: ".zip",
      });

      if (saved) {
        this.exported.emit({ format: this.selectedFormat });
        this.isExporting = false;
        this.close.emit();
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        this.errorMessage = this.config().errorKey;
      }
    } finally {
      this.isExporting = false;
      this.cdr.detectChanges();
    }
  }
}
