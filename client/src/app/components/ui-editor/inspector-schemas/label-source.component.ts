import { Component, input } from "@angular/core";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { InspectorContext } from "@app/components/ui-editor/inspector-kit/inspector-schema";
import {
  getLabelSource,
  getRecordLabelField,
  RACE_TIMER_LABEL_SOURCE,
  RECORD_LABEL_FIELDS,
} from "@app/models/label-source";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-label-source",
  imports: [CustomOptionComponent, CustomSelectComponent, TranslatePipe],
  template: `
    <div class="label-source">
      <span>{{ "UE_INSPECTOR_LABEL_SOURCE" | translate }}</span>
      <app-custom-select
        id="label-source"
        [value]="source"
        (change)="setSource($event)"
      >
        <app-custom-option value="">
          {{ "UE_INSPECTOR_LABEL_TEXT" | translate }}
        </app-custom-option>
        <app-custom-option [value]="raceTimerSource">
          {{ "UE_INSPECTOR_LABEL_RACE_TIMER" | translate }}
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
    .label-source {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 5px;
      padding: 4px 0;
      font-size: 0.75rem;
    }

    .label-source > span {
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
  `,
})
export class LabelSourceComponent {
  settings = input.required<Record<string, unknown>>();
  widget = input<unknown>();
  context = input<InspectorContext>();
  notify = input.required<() => void>();
  readonly recordFields = RECORD_LABEL_FIELDS;
  readonly raceTimerSource = RACE_TIMER_LABEL_SOURCE;

  get source(): string {
    return getLabelSource(this.settings());
  }

  setSource(value: unknown): void {
    const settings = this.settings();
    delete settings["labelSource"];
    delete settings["recordField"];
    const field = getRecordLabelField(value);
    if (value === RACE_TIMER_LABEL_SOURCE) {
      settings["labelSource"] = RACE_TIMER_LABEL_SOURCE;
    } else if (field) {
      settings["recordField"] = field.key;
    }
    this.notify()();
  }
}
