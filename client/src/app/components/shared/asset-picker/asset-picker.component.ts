import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { DataService } from "src/app/data.service";

import { IAssetMessage } from "src/app/proto/antigravity";
import { NgIf, NgFor } from "@angular/common";
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
  imports: [NgIf, FormsModule, NgFor, AssetPreviewComponent, TranslatePipe],
})
export class AssetPickerComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() type: "image" | "audio" | "image_set" = "image";
  @Input() currentAssetId: string | null = null;

  @Output() close = new EventEmitter<string | null>();

  assets: IAssetMessage[] = [];
  filteredAssets: IAssetMessage[] = [];
  isLoading: boolean = true;
  searchQuery: string = "";
  selectedAssetId: string | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.selectedAssetId = this.currentAssetId;
    this.loadAssets();
  }

  loadAssets() {
    this.isLoading = true;
    this.dataService.listAssets().subscribe({
      next: (assets) => {
        // Filter by type
        this.assets = assets.filter((a) => {
          if (this.type === "image") return a.type === "IMAGE";
          if (this.type === "audio") return a.type === "AUDIO";
          if (this.type === "image_set") return a.type === "IMAGE_SET";
          return true;
        });
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Failed to load assets", err);
        this.isLoading = false;
      },
    });
  }

  applyFilter() {
    if (!this.searchQuery) {
      this.filteredAssets = this.assets;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredAssets = this.assets.filter((a) =>
        a.name?.toLowerCase().includes(q),
      );
    }
  }

  selectAsset(asset: IAssetMessage) {
    this.selectedAssetId = asset.model?.entityId || null;
  }

  confirm() {
    if (this.selectedAssetId) {
      this.close.emit(this.selectedAssetId);
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
