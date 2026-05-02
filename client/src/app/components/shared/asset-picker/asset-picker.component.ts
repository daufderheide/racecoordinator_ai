import {
  Component,
  computed,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { DataService } from "src/app/data.service";

import { IAssetMessage } from "src/app/proto/antigravity";

import { FormsModule } from "@angular/forms";
import { AssetPreviewComponent } from "../asset-preview/asset-preview.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

export interface AssetPickerData {
  currentAssetId?: string;
  type: "image" | "audio" | "image_set";
}

@Component({
  standalone: true,
  selector: "app-asset-picker",
  templateUrl: "./asset-picker.component.html",
  styleUrl: "./asset-picker.component.css",
  imports: [FormsModule, AssetPreviewComponent, TranslatePipe],
})
export class AssetPickerComponent implements OnInit {
  visible = input(false);
  type = input<"image" | "audio" | "image_set">("image");
  currentAssetId = input<string | null>(null);

  close = output<string | null>();

  assets = signal<IAssetMessage[]>([]);
  isLoading = signal(true);
  searchQuery = signal("");
  selectedAssetId = signal<string | null>(null);

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.selectedAssetId.set(this.currentAssetId());
    this.loadAssets();
  }

  loadAssets() {
    this.isLoading.set(true);
    this.dataService.listAssets().subscribe({
      next: (assets) => {
        // Filter by type
        const type = this.type();
        const filtered = assets.filter((a) => {
          if (type === "image") return a.type === "IMAGE";
          if (type === "audio") return a.type === "AUDIO";
          if (type === "image_set") return a.type === "IMAGE_SET";
          return true;
        });
        this.assets.set(filtered);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error("Failed to load assets", err);
        this.isLoading.set(false);
      },
    });
  }

  filteredAssets = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const all = this.assets();
    if (!q) return all;
    return all.filter((a) => a.name?.toLowerCase().includes(q));
  });

  selectAsset(asset: IAssetMessage) {
    this.selectedAssetId.set(asset.model?.entityId || null);
  }

  confirm() {
    const id = this.selectedAssetId();
    if (id) {
      this.close.emit(id);
    }
  }

  cancel() {
    this.close.emit(null);
  }

  getAssetUrl(asset: IAssetMessage): string {
    if (asset.type === "IMAGE_SET") {
      // For image sets, we might want to show the first image as preview
      return asset.images && asset.images.length > 0
        ? asset.images[0].url || ""
        : "";
    }
    return this.dataService.getAssetUrl(asset.model?.entityId || "");
  }
}
