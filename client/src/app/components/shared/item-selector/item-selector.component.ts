import { Component, computed, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AssetPreviewComponent } from "@app/components/shared/asset-preview/asset-preview.component";
import { normalizeAssetType } from "@app/models/asset";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-item-selector",
  templateUrl: "./item-selector.component.html",
  styleUrls: ["./item-selector.component.css"],
  imports: [FormsModule, AssetPreviewComponent, TranslatePipe],
})
export class ItemSelectorComponent {
  visible = input(false);
  title = input<string>();
  items = input<any[]>([]);
  searchTerm = signal("");

  itemType = input<"image" | "image_set" | "audio" | "audio_set" | string>(
    "image",
  );

  filteredItems = computed(() => {
    let results = this.items();
    const type = this.itemType();

    // Filter by type if itemType is specified
    if (type) {
      const targetType = normalizeAssetType(type);
      results = results.filter(
        (item) => normalizeAssetType(item.type) === targetType,
      );
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
