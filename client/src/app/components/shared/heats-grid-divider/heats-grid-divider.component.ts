import { Component, input } from "@angular/core";
import { HeatDividerInfo } from "@app/components/shared/heats-filter-bar/heats-filter.utils";

@Component({
  standalone: true,
  selector: "app-heats-grid-divider",
  templateUrl: "./heats-grid-divider.component.html",
  styleUrls: ["./heats-grid-divider.component.css"],
  host: {
    "[class.step-only]": "divider().stepChanged && !divider().groupChanged",
    "[class.group-only]": "divider().groupChanged && !divider().stepChanged",
    "[class.step-and-group]": "divider().stepChanged && divider().groupChanged",
  },
})
export class HeatsGridDividerComponent {
  divider = input.required<HeatDividerInfo>();
}
