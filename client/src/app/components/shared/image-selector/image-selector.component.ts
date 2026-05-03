import { ChangeDetectorRef, Component, input, output } from "@angular/core";
import { AssetPreviewComponent } from "@app/components/shared/asset-preview/asset-preview.component";
import { ItemSelectorComponent } from "@app/components/shared/item-selector/item-selector.component";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";

@Component({
  standalone: true,
  selector: "app-image-selector",
  templateUrl: "./image-selector.component.html",
  styleUrl: "./image-selector.component.css",
  imports: [AssetPreviewComponent, ItemSelectorComponent, TranslatePipe],
})
export class ImageSelectorComponent {
  label = input<string>();
  imageUrl = input<string | undefined>();
  imageUrlChange = output<string | undefined>();
  assets = input<any[]>([]);
  size = input<"small" | "medium" | "large">("medium");
  disabled = input(false);
  assetId = input<string>();
  assetType = input<"image" | "image_set">("image");
  images = input<any[]>();

  assetSelected = output<any>();
  uploadStarted = output<void>();
  uploadFinished = output<void>();

  isDragging = false;
  isUploading = false;
  showSelector = false;
  pendingPreview: string | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {}

  onDragOver(event: DragEvent) {
    if (this.disabled()) return;
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
    if (this.disabled()) return;
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
          this.imageUrlChange.emit(asset.url ?? undefined);
          this.assetSelected.emit(asset);
          this.uploadFinished.emit();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Image upload failed", err);
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
    if (this.disabled()) return;
    this.showSelector = true;
  }

  closeSelector() {
    this.showSelector = false;
  }

  onAssetSelected(asset: any) {
    this.imageUrlChange.emit(asset.url);
    this.assetSelected.emit(asset);
    this.closeSelector();
  }

  removeImage(event: MouseEvent) {
    if (this.disabled()) return;
    event.stopPropagation();
    this.imageUrlChange.emit(undefined);
    this.assetSelected.emit(null);
    this.cdr.detectChanges();
  }
}
