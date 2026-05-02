import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { DataService } from "src/app/data.service";
import { NgIf } from "@angular/common";
import { AssetPreviewComponent } from "../asset-preview/asset-preview.component";
import { ItemSelectorComponent } from "../item-selector/item-selector.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-image-selector",
  templateUrl: "./image-selector.component.html",
  styleUrl: "./image-selector.component.css",
  imports: [NgIf, AssetPreviewComponent, ItemSelectorComponent, TranslatePipe],
})
export class ImageSelectorComponent {
  @Input() label?: string;
  @Input() imageUrl?: string;
  @Input() assets: any[] = [];
  @Input() size: "small" | "medium" | "large" = "medium";
  @Input() disabled: boolean = false;
  @Input() assetId?: string;
  @Input() assetType: "image" | "image_set" = "image";
  @Input() images?: any[];

  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() assetSelected = new EventEmitter<any>();
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFinished = new EventEmitter<void>();

  isDragging = false;
  isUploading = false;
  showSelector = false;
  pendingPreview: string | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  onDragOver(event: DragEvent) {
    if (this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    if (this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.pendingPreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);

      // Upload file
      this.uploadFile(file);
    }
  }

  private uploadFile(file: File) {
    this.isUploading = true;
    this.uploadStarted.emit();

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bytes = new Uint8Array(e.target.result);
      this.dataService.uploadAsset(file.name, "image", bytes).subscribe({
        next: (asset) => {
          this.isUploading = false;
          this.pendingPreview = null;
          this.imageUrl = asset.url ?? undefined;
          this.imageUrlChange.emit(this.imageUrl);
          this.assetSelected.emit(asset);
          this.uploadFinished.emit();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Image upload failed", err);
          this.isUploading = false;
          this.pendingPreview = null;
          this.uploadFinished.emit();
          this.cdr.detectChanges();
        },
      });
    };
    reader.readAsArrayBuffer(file);
  }

  openSelector() {
    if (this.disabled) return;
    this.showSelector = true;
  }

  closeSelector() {
    this.showSelector = false;
  }

  onAssetSelected(asset: any) {
    this.imageUrl = asset.url;
    this.imageUrlChange.emit(this.imageUrl);
    this.assetSelected.emit(asset);
    this.closeSelector();
  }

  removeImage(event: MouseEvent) {
    if (this.disabled) return;
    event.stopPropagation();
    this.imageUrl = undefined;
    this.imageUrlChange.emit(this.imageUrl);
    this.assetSelected.emit(null);
    this.cdr.detectChanges();
  }
}
