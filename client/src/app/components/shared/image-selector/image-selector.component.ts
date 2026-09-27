import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  input,
  OnChanges,
  OnDestroy,
  output,
  signal,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
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
export class ImageSelectorComponent implements OnChanges, OnDestroy {
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
  dragCounter = 0;
  isUploading = false;
  showSelector = false;
  pendingPreview: string | null = null;
  errorMessage: string | null = null;
  private errorTimeout: any = null;

  @ViewChild("directFileInput") directFileInput?: ElementRef<HTMLInputElement>;

  localAssets = signal<any[]>([]);
  dataServiceAssets = this.dataService?.assets$
    ? toSignal(this.dataService.assets$, { initialValue: [] })
    : signal<any[]>([]);
  localSelectedAsset = signal<any | null>(null);
  localUrl = signal<string | undefined>(undefined);

  effectiveImageUrl = computed(() => {
    if (this.pendingPreview) return this.pendingPreview;
    if (this.localUrl()) return this.localUrl();
    return this.imageUrl();
  });

  allAvailableAssets = computed(() => {
    const inputAssets = this.assets() || [];
    const local = this.localAssets() || [];
    const fromDs = (this.dataServiceAssets() || []).filter(
      (a) => a.type === "image" || a.type === "image_set",
    );

    const map = new Map<string, any>();
    const add = (a: any) => {
      if (!a) return;
      const key = a.model?.entityId || a.entity_id || a.id || a.url || a.name;
      if (key && !map.has(key)) {
        map.set(key, a);
      }
    };

    inputAssets.forEach(add);
    fromDs.forEach(add);
    local.forEach(add);

    return Array.from(map.values());
  });

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes["imageUrl"]) {
      const current = this.imageUrl();
      const local = this.localUrl();
      if (local && current !== local) {
        this.localSelectedAsset.set(null);
        this.localUrl.set(undefined);
      }
    }
  }

  ngOnDestroy() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  }

  onDragEnter(event: DragEvent) {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.isDragging = true;
  }

  onDragOver(event: DragEvent) {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.isDragging = false;
    }
  }

  onDrop(event: DragEvent) {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.isDragging = false;
    this.closeSelector();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFilePicked(file: File) {
    if (this.disabled()) return;
    this.closeSelector();
    this.processFile(file);
  }

  onDirectFileInput(event: Event) {
    if (this.disabled()) return;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      input.value = "";
      this.processFile(file);
    }
  }

  private showTransientError(messageKey: string) {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
    this.errorMessage = messageKey;
    this.errorTimeout = setTimeout(() => {
      this.errorMessage = null;
      this.cdr.detectChanges();
    }, 4000);
    this.cdr.detectChanges();
  }

  async processFile(file: File) {
    // Validate image format
    const allowedExtensions = /\.(png|jpe?g|gif|webp|svg)$/i;
    const isMimeValid = file.type && file.type.startsWith("image/");
    const isExtValid = allowedExtensions.test(file.name);
    if (!isMimeValid && !isExtValid) {
      this.showTransientError("IS_ERR_INVALID_IMAGE");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.pendingPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    // Compute SHA-256 hash for deduplication
    try {
      const hash = await this.dataService.computeFileHash(file);
      const existing =
        this.dataService.findAssetByHash(hash, "image") ||
        this.allAvailableAssets().find(
          (a) =>
            a.hash &&
            a.hash.toLowerCase() === hash.toLowerCase() &&
            (a.type === "image" || a.type === "image_set"),
        );

      if (existing) {
        // Zero network upload: reuse existing asset
        this.pendingPreview = null;
        this.selectResolvedAsset(existing);
        this.cdr.detectChanges();
        return;
      }
    } catch (e) {
      this.logger.error("Error computing hash for image deduplication", e);
    }

    // New asset: upload file
    this.uploadFile(file);
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
          this.selectResolvedAsset(asset);
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
    if (
      this.dataService?.listAssets &&
      (!this.dataService.loadedAssets ||
        this.dataService.loadedAssets.length === 0)
    ) {
      this.dataService.listAssets().subscribe();
    }
    this.showSelector = true;
  }

  closeSelector() {
    this.showSelector = false;
  }

  onAssetSelected(asset: any) {
    if (!asset) return;
    this.selectResolvedAsset(asset);
    this.closeSelector();
  }

  private selectResolvedAsset(asset: any) {
    if (!asset) return;
    this.closeSelector();
    this.localSelectedAsset.set(asset);
    this.localUrl.set(asset.url);
    this.localAssets.update((prev) => {
      const id = asset.model?.entityId || asset.entity_id || asset.id;
      if (
        id &&
        prev.some((a) => (a.model?.entityId || a.entity_id || a.id) === id)
      ) {
        return prev;
      }
      return [...prev, asset];
    });
    this.imageUrlChange.emit(asset.url ?? undefined);
    this.assetSelected.emit(asset);
  }

  removeImage(event: MouseEvent) {
    if (this.disabled()) return;
    event.stopPropagation();
    this.localSelectedAsset.set(null);
    this.localUrl.set(undefined);
    this.imageUrlChange.emit(undefined);
    this.assetSelected.emit(null);
    this.cdr.detectChanges();
  }
}
