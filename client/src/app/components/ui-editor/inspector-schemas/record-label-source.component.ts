import { Component, input } from "@angular/core";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { InspectorContext } from "@app/components/ui-editor/inspector-kit/inspector-schema";
import {
  getRecordLabelField,
  RECORD_LABEL_FIELDS,
} from "@app/models/record-label-field";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-record-label-source",
  imports: [CustomOptionComponent, CustomSelectComponent, TranslatePipe],
  template: `
    <div class="record-source">
      <span>{{ "UE_INSPECTOR_LABEL_SOURCE" | translate }}</span>
      <app-custom-select
        id="label-source"
        [value]="recordField"
        (change)="setSource($event)"
      >
        <app-custom-option value="">
          {{ "UE_INSPECTOR_LABEL_TEXT" | translate }}
        </app-custom-option>
        @for (field of recordFields; track field.key) {
          <app-custom-option [value]="field.key">
            {{ field.labelKey | translate }} ·
            {{
              (field.kind === "holder"
                ? "UE_INSPECTOR_RECORD_HOLDER"
                : "UE_INSPECTOR_RECORD_VALUE"
              ) | translate
            }}
          </app-custom-option>
        }
      </app-custom-select>
    </div>
  `,
  styles: `
    .record-source {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 5px;
      padding: 4px 0;
      font-size: 0.75rem;
    }

    .record-source > span {
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
  `,
})
export class RecordLabelSourceComponent {
  settings = input.required<Record<string, unknown>>();
  widget = input<unknown>();
  context = input<InspectorContext>();
  notify = input.required<() => void>();
  readonly recordFields = RECORD_LABEL_FIELDS;

  get recordField(): string {
    return getRecordLabelField(this.settings()["recordField"])?.key ?? "";
  }

  setSource(value: unknown): void {
    const field = getRecordLabelField(value);
    if (field) {
      this.settings()["recordField"] = field.key;
    } else {
      delete this.settings()["recordField"];
    }
    this.notify()();
  }
}
