import { Component, input } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

/**
 * Marks a feature as a preview: it is in the release so people can try it,
 * but it may still change a lot, or be removed, while we collect feedback.
 * Remove the badge once the feature is settled.
 */
@Component({
  standalone: true,
  selector: "app-preview-badge",
  templateUrl: "./preview-badge.component.html",
  styleUrls: ["./preview-badge.component.css"],
  imports: [TranslatePipe],
})
export class PreviewBadgeComponent {
  /** "small" for menu items and buttons, "large" next to a page title. */
  size = input<"small" | "large">("small");
}
