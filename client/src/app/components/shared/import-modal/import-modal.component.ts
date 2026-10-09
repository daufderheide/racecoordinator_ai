import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  input,
  output,
  ViewChild,
} from "@angular/core";
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
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-import-modal",
  templateUrl: "./import-modal.component.html",
  styleUrls: ["./import-modal.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AvatarUrlPipe,
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
  showAssetsModal = false;
  avatarErrors = new Set<number>();

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
  ) {}

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
      this.cdr.detectChanges();
      return;
    }

    this.selectedFile = mainFile;
    this.companionFiles = companions;
    this.cdr.detectChanges();
  }

  triggerFilePicker() {
    if (this.isLoading) return;
    this.fileInputRef?.nativeElement?.click();
  }

  removeFile() {
    if (this.isLoading) return;
    this.selectedFile = null;
    this.companionFiles = [];
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = "";
    }
    this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = "DIM_ERROR_TEMPLATE_DOWNLOAD";
        this.cdr.detectChanges();
      },
    });
  }

  onAudioDefaultModeChange(val: string) {
    this.audioDefaultMode = val;
    this.cdr.detectChanges();
  }

  startValidation() {
    if (!this.selectedFile || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append("file", this.selectedFile, this.selectedFile.name);

    for (const comp of this.companionFiles) {
      formData.append("assets", comp, comp.name);
    }

    this.dataService.validateDriverImport(formData).subscribe({
      next: (previewRes) => {
        this.preview = previewRes;
        this.avatarErrors.clear();
        this.applyAudioDefaultToPreview();
        this.step = "preview";
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error || "DIM_ERROR_VALIDATION_FAILED";
        this.cdr.detectChanges();
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
        if (this.bulkConflictResolution === "AUTO_RENAME") {
          this.autoRenameRow(row);
        }
      }
    }
    if (this.bulkConflictResolution === "AUTO_RENAME") {
      this.recheckAllRows();
    } else {
      this.cdr.detectChanges();
    }
  }

  onRowResolutionChange(row: DriverImportRow, resolution: string) {
    row.selectedResolution = resolution as ConflictResolution;
    if (row.selectedResolution === "AUTO_RENAME") {
      this.autoRenameRow(row);
      this.recheckAllRows();
    } else {
      this.cdr.detectChanges();
    }
  }

  autoRenameRow(row: DriverImportRow) {
    const isNicknameTiedToName =
      (!row.rawNickname ||
        row.rawNickname.trim() === "" ||
        row.rawNickname.trim().toLowerCase() ===
          (row.rawName || "").trim().toLowerCase()) &&
      (row.resolvedNickname || "").trim().toLowerCase() ===
        (row.resolvedName || "").trim().toLowerCase();

    const nameCollides =
      this.hasNameCollision(row.resolvedName, row) ||
      row.conflictType === "DUPLICATE_NAME" ||
      (row.conflictType === "DUPLICATE_IN_FILE" &&
        (!row.message?.toLowerCase().includes("nickname") ||
          row.message?.toLowerCase().includes("name")));

    const nickCollides =
      !isNicknameTiedToName &&
      (this.hasNicknameCollision(row.resolvedNickname, row) ||
        row.conflictType === "DUPLICATE_NICKNAME" ||
        (row.conflictType === "DUPLICATE_IN_FILE" &&
          row.message?.toLowerCase().includes("nickname")));

    const forceRenameName = !nameCollides && !nickCollides;

    if (nameCollides || forceRenameName) {
      row.resolvedName = this.generateUniqueRowName(
        row.resolvedName,
        row,
        forceRenameName,
      );
      if (isNicknameTiedToName) {
        row.resolvedNickname = row.resolvedName;
      }
    } else if (isNicknameTiedToName) {
      row.resolvedNickname = row.resolvedName;
    }

    if (nickCollides) {
      row.resolvedNickname = this.generateUniqueRowNickname(
        row.resolvedNickname,
        row,
      );
    }
  }

  generateUniqueRowName(
    baseName: string,
    row: DriverImportRow,
    forceSuffix: boolean = false,
  ): string {
    const raw = (baseName || "Driver").trim() || "Driver";
    const cleanBase = raw.replace(/\s*\(\d+\)$/, "").trim() || "Driver";
    let candidate = raw;
    let count = 1;

    if (forceSuffix && candidate === cleanBase) {
      candidate = `${cleanBase} (1)`;
      count = 2;
    }

    while (this.hasNameCollision(candidate, row) || candidate.trim() === "") {
      candidate = `${cleanBase} (${count})`;
      count++;
    }
    return candidate;
  }

  generateUniqueRowNickname(
    baseNick: string,
    row: DriverImportRow,
    forceSuffix: boolean = false,
  ): string {
    const raw = (baseNick || "Driver").trim() || "Driver";
    const cleanBase = raw.replace(/\s*\(\d+\)$/, "").trim() || "Driver";
    let candidate = raw;
    let count = 1;

    if (forceSuffix && candidate === cleanBase) {
      candidate = `${cleanBase} (1)`;
      count = 2;
    }

    while (
      this.hasNicknameCollision(candidate, row) ||
      candidate.trim() === ""
    ) {
      candidate = `${cleanBase} (${count})`;
      count++;
    }
    return candidate;
  }

  onRowNameChange(row: DriverImportRow, newName: string) {
    row.resolvedName = newName.trim();
    if (!row.rawNickname) {
      row.resolvedNickname = row.resolvedName;
    }
    this.recheckAllRows();
    if (row.status === "CONFLICT" || row.status === "ERROR") {
      row.selectedResolution = "SKIP";
    }
    this.cdr.detectChanges();
  }

  onRowNicknameChange(row: DriverImportRow, newNick: string) {
    row.resolvedNickname = newNick.trim();
    this.recheckAllRows();
    if (row.status === "CONFLICT" || row.status === "ERROR") {
      row.selectedResolution = "SKIP";
    }
    this.cdr.detectChanges();
  }

  recheckAllRows() {
    if (!this.preview) return;
    for (const r of this.preview.rows) {
      this.recheckRowValidity(r);
    }
    this.updatePreviewCounts();
    this.cdr.detectChanges();
  }

  updatePreviewCounts() {
    if (!this.preview) return;
    let valid = 0;
    let conflict = 0;
    let error = 0;
    for (const r of this.preview.rows) {
      if (r.status === "VALID") valid++;
      else if (r.status === "CONFLICT") conflict++;
      else if (r.status === "ERROR") error++;
    }
    this.preview.validCount = valid;
    this.preview.conflictCount = conflict;
    this.preview.errorCount = error;
  }

  private validateEmptyFields(
    row: DriverImportRow,
    candName: string,
    candNick: string,
  ): boolean {
    if (!candName) {
      row.status = "ERROR";
      row.conflictType = "NONE";
      row.message = "DIM_ERROR_NAME_REQUIRED";
      row.existingDriverId = undefined;
      return true;
    }
    if (!candNick) {
      row.status = "ERROR";
      row.conflictType = "NONE";
      row.message = "DIM_ERROR_NICK_REQUIRED";
      row.existingDriverId = undefined;
      return true;
    }
    return false;
  }

  private validateFileDuplicates(
    row: DriverImportRow,
    candName: string,
    candNick: string,
  ): boolean {
    const lowerName = candName.toLowerCase();
    const lowerNick = candNick.toLowerCase();

    const otherInFile = this.preview?.rows.find(
      (r) =>
        r !== row &&
        (r.resolvedName.trim().toLowerCase() === lowerName ||
          r.resolvedNickname.trim().toLowerCase() === lowerNick),
    );

    if (otherInFile) {
      row.status = "CONFLICT";
      row.conflictType = "DUPLICATE_IN_FILE";
      row.message = this.translationService.translate(
        "DIM_CONFLICT_DUPLICATE_IN_FILE",
        { name: candName },
      );
      row.existingDriverId = undefined;
      if (!row.selectedResolution || row.selectedResolution === "AUTO_RENAME") {
        row.selectedResolution = "SKIP";
      }
      return true;
    }
    return false;
  }

  private validateDatabaseCollisions(
    row: DriverImportRow,
    candName: string,
    candNick: string,
  ): boolean {
    if (!this.preview?.existingDrivers) return false;

    const lowerName = candName.toLowerCase();
    const lowerNick = candNick.toLowerCase();

    for (const d of this.preview.existingDrivers) {
      const existName = (d.name || "").trim().toLowerCase();
      const existNick = (d.nickname || "").trim().toLowerCase();

      if (existName && (lowerName === existName || lowerNick === existName)) {
        const isNameMatch = lowerName === existName;
        row.status = "CONFLICT";
        row.conflictType = isNameMatch
          ? "DUPLICATE_NAME"
          : "DUPLICATE_NICKNAME";
        row.message = this.translationService.translate(
          isNameMatch
            ? "DIM_CONFLICT_DUPLICATE_NAME"
            : "DIM_CONFLICT_NICKNAME_MATCHES_NAME",
          isNameMatch ? { name: candName } : { nickname: candNick },
        );
        row.existingDriverId = d.entityId;
        if (
          !row.selectedResolution ||
          row.selectedResolution === "AUTO_RENAME"
        ) {
          row.selectedResolution = "SKIP";
        }
        return true;
      }

      if (existNick && (lowerNick === existNick || lowerName === existNick)) {
        const isNickMatch = lowerNick === existNick;
        row.status = "CONFLICT";
        row.conflictType = isNickMatch
          ? "DUPLICATE_NICKNAME"
          : "DUPLICATE_NAME";
        row.message = this.translationService.translate(
          isNickMatch
            ? "DIM_CONFLICT_DUPLICATE_NICKNAME"
            : "DIM_CONFLICT_DUPLICATE_NAME",
          isNickMatch ? { nickname: candNick } : { name: candName },
        );
        row.existingDriverId = d.entityId;
        if (
          !row.selectedResolution ||
          row.selectedResolution === "AUTO_RENAME"
        ) {
          row.selectedResolution = "SKIP";
        }
        return true;
      }
    }
    return false;
  }

  recheckRowValidity(row: DriverImportRow) {
    const candName = (row.resolvedName || "").trim();
    const candNick = (row.resolvedNickname || "").trim();

    if (this.validateEmptyFields(row, candName, candNick)) return;
    if (this.validateFileDuplicates(row, candName, candNick)) return;
    if (this.validateDatabaseCollisions(row, candName, candNick)) return;

    row.status = "VALID";
    row.conflictType = "NONE";
    row.message = "";
    row.existingDriverId = undefined;
  }

  hasNameCollision(candName: string, row: DriverImportRow): boolean {
    const lowerName = candName.trim().toLowerCase();
    if (!lowerName) return false;

    if (this.preview?.rows) {
      const match = this.preview.rows.some(
        (r) =>
          r !== row &&
          ((r.resolvedName || "").trim().toLowerCase() === lowerName ||
            (r.resolvedNickname || "").trim().toLowerCase() === lowerName),
      );
      if (match) return true;
    }

    if (this.preview?.existingDrivers) {
      const match = this.preview.existingDrivers.some(
        (d) =>
          (d.name || "").trim().toLowerCase() === lowerName ||
          (d.nickname || "").trim().toLowerCase() === lowerName,
      );
      if (match) return true;
    }

    return false;
  }

  hasNicknameCollision(candNick: string, row: DriverImportRow): boolean {
    const lowerNick = candNick.trim().toLowerCase();
    if (!lowerNick) return false;

    if (this.preview?.rows) {
      const match = this.preview.rows.some(
        (r) =>
          r !== row &&
          ((r.resolvedNickname || "").trim().toLowerCase() === lowerNick ||
            (r.resolvedName || "").trim().toLowerCase() === lowerNick),
      );
      if (match) return true;
    }

    if (this.preview?.existingDrivers) {
      const match = this.preview.existingDrivers.some(
        (d) =>
          (d.nickname || "").trim().toLowerCase() === lowerNick ||
          (d.name || "").trim().toLowerCase() === lowerNick,
      );
      if (match) return true;
    }

    return false;
  }

  isRowSkipped(row: DriverImportRow): boolean {
    return row.status === "CONFLICT" && row.selectedResolution === "SKIP";
  }

  hasRowNameCollision(row: DriverImportRow): boolean {
    const candName = (row.resolvedName || "").trim();
    if (!candName) return false;
    if (this.hasNameCollision(candName, row)) return true;
    if (row.status === "CONFLICT") {
      if (row.conflictType === "DUPLICATE_NAME") return true;
      if (
        row.conflictType === "DUPLICATE_IN_FILE" &&
        row.message?.toLowerCase().includes("name") &&
        !row.message?.toLowerCase().includes("nickname")
      ) {
        return true;
      }
    }
    return false;
  }

  hasRowNicknameCollision(row: DriverImportRow): boolean {
    const candNick = (row.resolvedNickname || "").trim();
    if (!candNick) return false;
    if (this.hasNicknameCollision(candNick, row)) return true;
    if (row.status === "CONFLICT") {
      if (row.conflictType === "DUPLICATE_NICKNAME") return true;
      if (
        row.conflictType === "DUPLICATE_IN_FILE" &&
        row.message?.toLowerCase().includes("nickname")
      ) {
        return true;
      }
    }
    return false;
  }

  isRowNameInvalid(row: DriverImportRow): boolean {
    if (row.status === "VALID") return false;
    const candName = (row.resolvedName || "").trim();
    if (!candName) return true;
    return this.hasRowNameCollision(row);
  }

  isRowNicknameInvalid(row: DriverImportRow): boolean {
    if (row.status === "VALID") return false;
    const candNick = (row.resolvedNickname || "").trim();
    if (!candNick) return true;
    return this.hasRowNicknameCollision(row);
  }

  isRowNameWarning(row: DriverImportRow): boolean {
    if (!this.isRowSkipped(row)) return false;
    return this.hasRowNameCollision(row);
  }

  isRowNicknameWarning(row: DriverImportRow): boolean {
    if (!this.isRowSkipped(row)) return false;
    return this.hasRowNicknameCollision(row);
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
    if (!this.preview || this.resolvableCount === 0 || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    const request: DriverImportCommitRequest = {
      rows: this.preview.rows,
    };

    this.dataService.commitDriverImport(request).subscribe({
      next: (res) => {
        this.importResult = res;
        this.step = "summary";
        this.isLoading = false;
        this.imported.emit(res);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error || "DIM_ERROR_COMMIT_FAILED";
        this.cdr.detectChanges();
      },
    });
  }

  openAssetsModal() {
    this.showAssetsModal = true;
    this.cdr.detectChanges();
  }

  closeAssetsModal() {
    this.showAssetsModal = false;
    this.cdr.detectChanges();
  }

  isAudioFile(filename: string): boolean {
    if (!filename) return false;
    const lower = filename.toLowerCase();
    return (
      lower.endsWith(".wav") || lower.endsWith(".mp3") || lower.endsWith(".ogg")
    );
  }

  onAvatarError(rowIndex: number) {
    this.avatarErrors.add(rowIndex);
    this.cdr.detectChanges();
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
    this.showAssetsModal = false;
    this.avatarErrors.clear();
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = "";
    }
    this.cdr.detectChanges();
  }
}
