import { Component, HostListener, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DataService } from "@app/data.service";
import { DriverLabel } from "@app/models/driver-label";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  getContrastColor,
  getRandomLabelColor,
  PRESET_LABEL_COLORS,
} from "@app/utils/color.utils";

@Component({
  standalone: true,
  selector: "app-driver-label-manager-modal",
  templateUrl: "./driver-label-manager-modal.component.html",
  styleUrl: "./driver-label-manager-modal.component.css",
  imports: [FormsModule, TranslatePipe],
})
export class DriverLabelManagerModalComponent {
  visible = input<boolean>(false);
  titleKey = input<string>("DLM_TITLE");
  assignedLabelIds = input<string[]>([]);
  allLabels = input<DriverLabel[]>([]);

  readonly visibleChange = output<boolean>();
  readonly assignedLabelIdsChange = output<string[]>();
  readonly labelsUpdated = output<DriverLabel[]>();
  readonly close = output<void>();

  private localAssignedLabelIds: string[] | null = null;
  private localLabels: DriverLabel[] | null = null;

  searchQuery: string = "";
  isFormOpen: boolean = false;
  editingLabelId: string | null = null;
  formName: string = "";
  formColor: string = PRESET_LABEL_COLORS[0];
  formErrorMessage: string = "";
  deletingLabelId: string | null = null;
  isSaving: boolean = false;

  readonly presetColors = PRESET_LABEL_COLORS;

  constructor(private dataService: DataService) {}

  @HostListener("keydown.escape")
  onEscape() {
    if (this.visible()) {
      if (this.deletingLabelId) {
        this.deletingLabelId = null;
      } else if (this.isFormOpen) {
        this.cancelForm();
      } else {
        this.onClose();
      }
    }
  }

  get currentAssignedIds(): string[] {
    return this.localAssignedLabelIds ?? (this.assignedLabelIds() || []);
  }

  get currentLabels(): DriverLabel[] {
    return this.localLabels ?? (this.allLabels() || []);
  }

  get filteredLabels(): DriverLabel[] {
    const list = this.currentLabels;
    if (!this.searchQuery.trim()) {
      return list;
    }
    const q = this.searchQuery.trim().toLowerCase();
    return list.filter((l) => l.name.toLowerCase().includes(q));
  }

  isAssigned(labelId: string): boolean {
    return this.currentAssignedIds.includes(labelId);
  }

  toggleAssign(label: DriverLabel) {
    if (this.isFormOpen || this.deletingLabelId) return;
    const current = this.currentAssignedIds;
    let updated: string[];
    if (current.includes(label.entity_id)) {
      updated = current.filter((id) => id !== label.entity_id);
    } else {
      updated = [...current, label.entity_id];
    }
    this.localAssignedLabelIds = updated;
    this.assignedLabelIdsChange.emit(updated);
  }

  openCreateForm() {
    this.editingLabelId = null;
    this.formName = "";
    this.formColor = getRandomLabelColor();
    this.formErrorMessage = "";
    this.deletingLabelId = null;
    this.isFormOpen = true;
  }

  openEditForm(label: DriverLabel, event?: MouseEvent) {
    event?.stopPropagation();
    this.editingLabelId = label.entity_id;
    this.formName = label.name;
    this.formColor = label.color;
    this.formErrorMessage = "";
    this.deletingLabelId = null;
    this.isFormOpen = true;
  }

  cancelForm() {
    this.isFormOpen = false;
    this.editingLabelId = null;
    this.formErrorMessage = "";
  }

  selectColor(color: string) {
    this.formColor = color;
  }

  randomizeColor() {
    this.formColor = getRandomLabelColor();
  }

  saveForm() {
    const trimmed = this.formName.trim();
    if (!trimmed) {
      this.formErrorMessage = "DLM_ERR_NAME_REQUIRED";
      return;
    }

    const dup = this.currentLabels.find(
      (l) =>
        l.name.trim().toLowerCase() === trimmed.toLowerCase() &&
        l.entity_id !== this.editingLabelId,
    );
    if (dup) {
      this.formErrorMessage = "DLM_ERR_NAME_EXISTS";
      return;
    }

    this.isSaving = true;
    this.formErrorMessage = "";

    if (this.editingLabelId) {
      const updatePayload: DriverLabel = {
        entity_id: this.editingLabelId,
        name: trimmed,
        color: this.formColor,
      };
      this.dataService.updateDriverLabel(updatePayload).subscribe({
        next: (saved) => {
          this.isSaving = false;
          this.isFormOpen = false;
          this.localLabels = this.currentLabels.map((l) =>
            l.entity_id === saved.entity_id ? saved : l,
          );
          this.labelsUpdated.emit(this.localLabels);
        },
        error: () => {
          this.isSaving = false;
          this.formErrorMessage = "COMMON_ERROR";
        },
      });
    } else {
      const createPayload: DriverLabel = {
        entity_id: "new",
        name: trimmed,
        color: this.formColor,
      };
      this.dataService.createDriverLabel(createPayload).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.isFormOpen = false;
          this.localLabels = [...this.currentLabels, created];
          this.labelsUpdated.emit(this.localLabels);
          // Auto-assign new label to currently edited driver
          this.localAssignedLabelIds = [
            ...this.currentAssignedIds,
            created.entity_id,
          ];
          this.assignedLabelIdsChange.emit(this.localAssignedLabelIds);
        },
        error: () => {
          this.isSaving = false;
          this.formErrorMessage = "COMMON_ERROR";
        },
      });
    }
  }

  confirmDelete(label: DriverLabel, event?: MouseEvent) {
    event?.stopPropagation();
    this.deletingLabelId = label.entity_id;
  }

  cancelDelete(event?: MouseEvent) {
    event?.stopPropagation();
    this.deletingLabelId = null;
  }

  executeDelete(label: DriverLabel, event?: MouseEvent) {
    event?.stopPropagation();
    this.isSaving = true;
    this.dataService.deleteDriverLabel(label.entity_id).subscribe({
      next: () => {
        this.isSaving = false;
        this.deletingLabelId = null;
        if (this.editingLabelId === label.entity_id) {
          this.isFormOpen = false;
          this.editingLabelId = null;
        }
        this.localLabels = this.currentLabels.filter(
          (l) => l.entity_id !== label.entity_id,
        );
        this.labelsUpdated.emit(this.localLabels);

        if (this.currentAssignedIds.includes(label.entity_id)) {
          this.localAssignedLabelIds = this.currentAssignedIds.filter(
            (id) => id !== label.entity_id,
          );
          this.assignedLabelIdsChange.emit(this.localAssignedLabelIds);
        }
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  onClose() {
    this.isFormOpen = false;
    this.deletingLabelId = null;
    this.localLabels = null;
    this.localAssignedLabelIds = null;
    this.visibleChange.emit(false);
    this.close.emit();
  }

  getContrastColor(color: string | undefined): string {
    return getContrastColor(color);
  }
}
