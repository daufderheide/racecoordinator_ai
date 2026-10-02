import { CommonModule } from "@angular/common";
import { Component, ElementRef, input, output, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import {
  ConflictResolution,
  DriverImportCommitRequest,
  DriverImportPreview,
  DriverImportResult,
  DriverImportRow,
} from "@app/models/driver-import.model";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-import-modal",
  templateUrl: "./import-modal.component.html",
  styleUrls: ["./import-modal.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class ImportModalComponent {
  visible = input(false);
  titleKey = input("DIM_TITLE");
  entityType = input("drivers");

  close = output<void>();
  imported = output<DriverImportResult>();

  @ViewChild("fileInput") fileInputRef!: ElementRef<HTMLInputElement>;

  step: "upload" | "preview" | "summary" = "upload";
  selectedFile: File | null = null;
  companionFiles: File[] = [];
  isDragging = false;
  isLoading = false;
  errorMessage: string | null = null;

  audioDefaultMode = "file";
  preview: DriverImportPreview | null = null;
  activeTab: "all" | "valid" | "conflicts" | "errors" = "all";
  filterText = "";
  bulkConflictResolution: ConflictResolution = "AUTO_RENAME";
  importResult: DriverImportResult | null = null;

  constructor(private dataService: DataService) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.handleSelectedFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileInputChange(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files) {
      this.handleSelectedFiles(Array.from(inputEl.files));
    }
  }

  handleSelectedFiles(files: File[]) {
    if (!files || files.length === 0) return;

    this.errorMessage = null;
    let mainFile: File | null = null;
    const companions: File[] = [];

    for (const f of files) {
      const name = f.name.toLowerCase();
      if (
        name.endsWith(".csv") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".xls") ||
        name.endsWith(".json") ||
        name.endsWith(".zip")
      ) {
        if (!mainFile) {
          mainFile = f;
        } else {
          companions.push(f);
        }
      } else {
        companions.push(f);
      }
    }

    if (!mainFile) {
      this.errorMessage = "DIM_ERROR_NO_DATA_FILE";
      return;
    }

    this.selectedFile = mainFile;
    this.companionFiles = companions;
  }

  triggerFilePicker() {
    this.fileInputRef?.nativeElement?.click();
  }

  removeFile() {
    this.selectedFile = null;
    this.companionFiles = [];
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = "";
    }
  }

  downloadTemplate(format: string) {
    this.dataService.downloadDriverImportTemplate(format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `drivers_template.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = "DIM_ERROR_TEMPLATE_DOWNLOAD";
      },
    });
  }

  onAudioDefaultModeChange(val: string) {
    this.audioDefaultMode = val;
  }

  startValidation() {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append("file", this.selectedFile, this.selectedFile.name);

    for (const comp of this.companionFiles) {
      formData.append("assets", comp, comp.name);
    }

    this.dataService.validateDriverImport(formData).subscribe({
      next: (previewRes) => {
        this.preview = previewRes;
        this.applyAudioDefaultToPreview();
        this.step = "preview";
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error || "DIM_ERROR_VALIDATION_FAILED";
      },
    });
  }

  applyAudioDefaultToPreview() {
    if (!this.preview || this.audioDefaultMode === "file") return;
    const mode = this.audioDefaultMode;
    for (const row of this.preview.rows) {
      row.defaultAudioMode = mode;
      if (mode === "none" && row.audioSlots) {
        for (const [key, audio] of Object.entries(row.audioSlots)) {
          if (audio.type === "preset" && audio.url?.startsWith("default_")) {
            row.audioSlots[key] = { type: "none" };
          }
        }
      }
    }
  }

  get filteredRows(): DriverImportRow[] {
    if (!this.preview) return [];
    let rows = this.preview.rows;

    if (this.activeTab === "valid") {
      rows = rows.filter((r) => r.status === "VALID");
    } else if (this.activeTab === "conflicts") {
      rows = rows.filter((r) => r.status === "CONFLICT");
    } else if (this.activeTab === "errors") {
      rows = rows.filter((r) => r.status === "ERROR");
    }

    if (this.filterText.trim()) {
      const q = this.filterText.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.resolvedName.toLowerCase().includes(q) ||
          r.resolvedNickname.toLowerCase().includes(q) ||
          (r.message && r.message.toLowerCase().includes(q)),
      );
    }

    return rows;
  }

  applyBulkConflictResolution() {
    if (!this.preview) return;
    for (const row of this.preview.rows) {
      if (row.status === "CONFLICT") {
        row.selectedResolution = this.bulkConflictResolution;
      }
    }
  }

  onRowResolutionChange(row: DriverImportRow, resolution: string) {
    row.selectedResolution = resolution as ConflictResolution;
  }

  onRowNameChange(row: DriverImportRow, newName: string) {
    row.resolvedName = newName.trim();
    if (!row.rawNickname) {
      row.resolvedNickname = row.resolvedName;
    }
    this.recheckRowValidity(row);
  }

  onRowNicknameChange(row: DriverImportRow, newNick: string) {
    row.resolvedNickname = newNick.trim();
    this.recheckRowValidity(row);
  }

  recheckRowValidity(row: DriverImportRow) {
    if (!row.resolvedName) {
      row.status = "ERROR";
      row.message = "DIM_ERROR_NAME_REQUIRED";
      return;
    }
    if (!row.resolvedNickname) {
      row.status = "ERROR";
      row.message = "DIM_ERROR_NICK_REQUIRED";
      return;
    }

    // Check duplicate in file
    const otherInFile = this.preview?.rows.find(
      (r) =>
        r !== row &&
        (r.resolvedName.toLowerCase() === row.resolvedName.toLowerCase() ||
          r.resolvedNickname.toLowerCase() ===
            row.resolvedNickname.toLowerCase()),
    );

    if (otherInFile) {
      row.status = "CONFLICT";
      row.conflictType = "DUPLICATE_IN_FILE";
      row.message = "DIM_CONFLICT_DUPLICATE_IN_FILE";
      return;
    }

    // Valid if user manually resolved
    row.status = "VALID";
    row.conflictType = "NONE";
    row.message = "";
  }

  get resolvableCount(): number {
    if (!this.preview) return 0;
    return this.preview.rows.filter(
      (r) =>
        r.status === "VALID" ||
        (r.status === "CONFLICT" && r.selectedResolution !== "SKIP"),
    ).length;
  }

  commitImport() {
    if (!this.preview || this.resolvableCount === 0) return;

    this.isLoading = true;
    this.errorMessage = null;

    const request: DriverImportCommitRequest = {
      rows: this.preview.rows,
    };

    this.dataService.commitDriverImport(request).subscribe({
      next: (res) => {
        this.importResult = res;
        this.step = "summary";
        this.isLoading = false;
        this.imported.emit(res);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error || "DIM_ERROR_COMMIT_FAILED";
      },
    });
  }

  onClose() {
    this.resetState();
    this.close.emit();
  }

  resetState() {
    this.step = "upload";
    this.selectedFile = null;
    this.companionFiles = [];
    this.preview = null;
    this.importResult = null;
    this.errorMessage = null;
    this.isLoading = false;
    this.filterText = "";
    this.activeTab = "all";
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = "";
    }
  }
}
