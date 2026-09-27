import { Component, input, model, OnInit } from "@angular/core";
import { AssetLayoutMode } from "@app/models/asset";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-asset-layout-switcher",
  templateUrl: "./asset-layout-switcher.component.html",
  styleUrls: ["./asset-layout-switcher.component.css"],
  imports: [TranslatePipe],
})
export class AssetLayoutSwitcherComponent implements OnInit {
  layout = model<AssetLayoutMode>("medium");
  storageKey = input<string | undefined>();

  ngOnInit() {
    const key = this.storageKey();
    if (key) {
      try {
        const saved = localStorage.getItem(key) as AssetLayoutMode;
        if (
          saved === "list" ||
          saved === "small" ||
          saved === "medium" ||
          saved === "large"
        ) {
          this.layout.set(saved);
        }
      } catch {
        // Ignore local storage errors in sandboxed environments
      }
    }
  }

  setLayout(mode: AssetLayoutMode) {
    this.layout.set(mode);
    const key = this.storageKey();
    if (key) {
      try {
        localStorage.setItem(key, mode);
      } catch {
        // Ignore local storage errors
      }
    }
  }
}
