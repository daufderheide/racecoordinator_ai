import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { saveFileAs } from "@app/utils/file-download.utils";

export type DriverExportFormat = "csv" | "xlsx" | "json";

@Component({
  standalone: true,
  selector: "app-driver-export-modal",
  templateUrl: "./driver-export-modal.component.html",
  styleUrls: ["./driver-export-modal.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class DriverExportModalComponent {
  visible = input(false);
  driverCount = input(0);

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
        this.dataService.exportDrivers(this.selectedFormat),
      );

      const saved = await saveFileAs({
        suggestedName: `drivers_export.zip`,
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
        this.errorMessage = "DEM_ERROR_EXPORT_FAILED";
      }
    } finally {
      this.isExporting = false;
      this.cdr.detectChanges();
    }
  }
}
