import { Component, effect, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import {
  CAR_FIELD_TYPES,
  CarField,
  CarFieldType,
  sortCarFields,
} from "@app/models/car-field";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";

/** Choices typed one per line: trimmed, no empty lines, no duplicates. */
export function parseChoices(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of (text || "").split(/\r?\n/)) {
    const c = line.trim();
    if (c && !seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase());
      out.push(c);
    }
  }
  return out;
}

/**
 * Adds, edits, orders and deletes the user's own slotcar fields. Saves each
 * change straight to the server, like the label manager.
 */
@Component({
  standalone: true,
  selector: "app-car-field-manager",
  templateUrl: "./car-field-manager.component.html",
  styleUrls: ["./car-field-manager.component.css"],
  imports: [
    FormsModule,
    TranslatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class CarFieldManagerComponent {
  visible = input<boolean>(false);
  fields = input<CarField[]>([]);

  /** The full, sorted list after any change. */
  fieldsChange = output<CarField[]>();
  /** A field was deleted; its values are gone from every car. */
  fieldDeleted = output<string>();
  close = output<void>();

  readonly types = CAR_FIELD_TYPES;

  isFormOpen = false;
  editingId: string | null = null;
  formName = "";
  formType: CarFieldType = "text";
  formChoices = "";
  formError = "";
  deletingId: string | null = null;
  isSaving = false;

  constructor(
    private dataService: DataService,
    private logger: LoggerService,
  ) {
    // Keys typed right after opening must not reach the editor behind the
    // dialog (for example the car's name): move the focus into the dialog.
    effect(() => {
      if (this.visible()) {
        setTimeout(() => document.getElementById("btn-new-car-field")?.focus());
      }
    });
  }

  get sortedFields(): CarField[] {
    return sortCarFields(this.fields() || []);
  }

  typeLabelKey(type: CarFieldType): string {
    return this.types.find((t) => t.value === type)?.labelKey || "";
  }

  openCreateForm() {
    this.isFormOpen = true;
    this.editingId = null;
    this.formName = "";
    this.formType = "text";
    this.formChoices = "";
    this.formError = "";
    this.deletingId = null;
    this.focusName();
  }

  openEditForm(field: CarField) {
    this.isFormOpen = true;
    this.editingId = field.entity_id;
    this.formName = field.name;
    this.formType = field.type;
    this.formChoices = field.options.join("\n");
    this.formError = "";
    this.deletingId = null;
    this.focusName();
  }

  cancelForm() {
    this.isFormOpen = false;
    this.editingId = null;
    this.formError = "";
  }

  private focusName() {
    setTimeout(() => document.getElementById("car-field-name-input")?.focus());
  }

  /** The error key for the form, or "" when it can be saved. */
  validate(): string {
    const name = this.formName.trim();
    if (!name) return "CFM_ERROR_NAME_EMPTY";
    const taken = this.sortedFields.some(
      (f) =>
        f.entity_id !== this.editingId &&
        f.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (taken) return "CFM_ERROR_NAME_EXISTS";
    if (
      this.formType === "choice" &&
      parseChoices(this.formChoices).length === 0
    )
      return "CFM_ERROR_CHOICES";
    return "";
  }

  async saveForm() {
    if (this.isSaving) return;
    this.formError = this.validate();
    if (this.formError) return;
    const body = {
      name: this.formName.trim(),
      type: this.formType,
      options: this.formType === "choice" ? parseChoices(this.formChoices) : [],
    };
    this.isSaving = true;
    try {
      let saved: CarField;
      let list: CarField[];
      if (this.editingId) {
        const current = this.sortedFields.find(
          (f) => f.entity_id === this.editingId,
        );
        saved = CarField.fromJSON(
          await firstValueFrom(
            this.dataService.updateCarField(this.editingId, {
              ...body,
              position: current?.position ?? 0,
            }),
          ),
        );
        list = this.sortedFields.map((f) =>
          f.entity_id === saved.entity_id ? saved : f,
        );
      } else {
        saved = CarField.fromJSON(
          await firstValueFrom(this.dataService.createCarField(body)),
        );
        list = [...this.sortedFields, saved];
      }
      this.fieldsChange.emit(sortCarFields(list));
      this.cancelForm();
    } catch (err: any) {
      this.logger.error("Failed to save car field", err);
      this.formError =
        err?.status === 409 ? "CFM_ERROR_NAME_EXISTS" : "CFM_ERROR_SAVE_FAILED";
    } finally {
      this.isSaving = false;
    }
  }

  canMove(field: CarField, step: -1 | 1): boolean {
    const list = this.sortedFields;
    const i = list.findIndex((f) => f.entity_id === field.entity_id);
    return i >= 0 && i + step >= 0 && i + step < list.length;
  }

  /** Moves a field up (-1) or down (1); saves the new positions. */
  async move(field: CarField, step: -1 | 1) {
    if (this.isSaving || !this.canMove(field, step)) return;
    const list = this.sortedFields;
    const i = list.findIndex((f) => f.entity_id === field.entity_id);
    [list[i], list[i + step]] = [list[i + step], list[i]];
    const moved = list.map(
      (f, index) =>
        new CarField(f.entity_id, f.name, f.type, [...f.options], index),
    );
    const changed = moved.filter(
      (f) =>
        this.sortedFields.find((o) => o.entity_id === f.entity_id)?.position !==
        f.position,
    );
    this.isSaving = true;
    try {
      for (const f of changed) {
        await firstValueFrom(
          this.dataService.updateCarField(f.entity_id, {
            name: f.name,
            type: f.type,
            options: f.options,
            position: f.position,
          }),
        );
      }
      this.fieldsChange.emit(moved);
    } catch (err) {
      this.logger.error("Failed to move car field", err);
    } finally {
      this.isSaving = false;
    }
  }

  confirmDelete(field: CarField) {
    this.deletingId = field.entity_id;
    this.isFormOpen = false;
  }

  cancelDelete() {
    this.deletingId = null;
  }

  async executeDelete(field: CarField) {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      await firstValueFrom(this.dataService.deleteCarField(field.entity_id));
      this.deletingId = null;
      this.fieldDeleted.emit(field.entity_id);
      this.fieldsChange.emit(
        this.sortedFields.filter((f) => f.entity_id !== field.entity_id),
      );
    } catch (err) {
      this.logger.error("Failed to delete car field", err);
    } finally {
      this.isSaving = false;
    }
  }

  onClose() {
    this.cancelForm();
    this.deletingId = null;
    this.close.emit();
  }
}
