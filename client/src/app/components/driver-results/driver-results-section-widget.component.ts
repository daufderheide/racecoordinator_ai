import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { DriverResultsWidgetType } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import type { DriverResultsSections } from "./driver-results-layout.model";

@Component({
  selector: "app-driver-results-section-widget",
  imports: [NgTemplateOutlet, TranslatePipe],
  templateUrl: "./driver-results-section-widget.component.html",
  styleUrl: "./driver-results-section-widget.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverResultsSectionWidgetComponent {
  readonly section = input.required<DriverResultsWidgetType>();
  readonly sections = input<DriverResultsSections>();
  readonly preview = input(false);
}
