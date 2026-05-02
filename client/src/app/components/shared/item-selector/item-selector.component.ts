import { Component, computed, input, output, signal } from "@angular/core";
import { Router } from "@angular/router";

import { BackButtonComponent } from "../back-button/back-button.component";
import { FormsModule } from "@angular/forms";
import { AssetPreviewComponent } from "../asset-preview/asset-preview.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-item-selector",
  templateUrl: "./item-selector.component.html",
  styleUrls: ["./item-selector.component.css"],
  imports: [
    BackButtonComponent,
    FormsModule,
    AssetPreviewComponent,
    TranslatePipe,
  ],
})
export class ItemSelectorComponent {
  visible = input(false);
  title = input<string>();
  items = input<any[]>([]);
  searchTerm = signal("");

  itemType = input<"image" | "sound" | "image_set" | "audio" | "audio_set">(
    "image",
  );

  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
  backButtonLabel = input<string>();

  filteredItems = computed(() => {
    let results = this.items();
    const type = this.itemType();

    // Filter by type if itemType is specified
    if (type) {
      if (type === "audio") {
        results = results.filter(
          (item) => item.type === "sound" || item.type === "audio_set",
        );
      } else {
        results = results.filter((item) => item.type === type);
      }
    }

    const term = this.searchTerm();
    if (!term) {
      return results;
    }

    const lowerTerm = term.toLowerCase();
    return results.filter(
      (item) => item.name && item.name.toLowerCase().includes(lowerTerm),
    );
  });

  select = output<any>();
  play = output<any>();
  close = output<void>();

  constructor(private router: Router) {}

  onBack() {
    const route = this.backButtonRoute();
    if (route) {
      this.router.navigate([route], {
        queryParams: this.backButtonQueryParams(),
      });
    }
    this.close.emit();
  }

  onSelect(item: any) {
    this.select.emit(item);
  }

  onPlay(event: MouseEvent, item: any) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.play.emit(item);
  }

  onClose() {
    this.close.emit();
  }
}
