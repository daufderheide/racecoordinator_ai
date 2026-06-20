import { CommonModule } from "@angular/common";
import { Component, inject, input, ViewEncapsulation } from "@angular/core";
import { DataService } from "@app/data.service";
import { AbsoluteWidgetNode } from "@app/models/settings";

@Component({
  standalone: true,
  selector: "app-raceday-image",
  templateUrl: "./raceday-image.component.html",
  styleUrls: ["./raceday-image.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
})
export class RacedayImageComponent {
  widget = input<AbsoluteWidgetNode | null>(null);

  private dataService = inject(DataService);

  get resolvedImageUrl(): string {
    const raw = this.widget()?.customSettings?.["imageUrl"] || "";
    if (!raw) {
      // Premium SVG placeholder
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="384" height="239" viewBox="0 0 384 239"><rect width="384" height="239" fill="%231e293b"/><circle cx="192" cy="110" r="40" fill="%2338bdf8" opacity="0.3"/><path d="M192 90 L170 130 L214 130 Z" fill="%2338bdf8"/><text x="192" y="180" font-family="sans-serif" font-size="14" fill="%2394a3b8" text-anchor="middle">No Image Selected</text></svg>';
    }
    if (raw.startsWith("http") || raw.startsWith("data:")) {
      return raw;
    }
    const serverUrl = this.dataService.serverUrl;
    if (!serverUrl || serverUrl.includes("undefined")) return raw;
    const base = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
    const path = raw.startsWith("/") ? raw : "/" + raw;
    return base + path;
  }
}
