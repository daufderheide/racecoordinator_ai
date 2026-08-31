import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  NgZone,
  OnDestroy,
  signal,
  untracked,
} from "@angular/core";
import { DataService } from "@app/data.service";
import { AssetType, normalizeAssetType } from "@app/models/asset";

@Component({
  standalone: true,
  selector: "app-asset-preview",
  template: `
    <div class="preview-container">
      @if (normalizedType() === "image" || normalizedType() === "image_set") {
        <img [src]="currentUrl()" class="preview-img" [alt]="name()" />
      }
      @if (isSoundType()) {
        <img
          src="assets/images/default_audio_icon.png"
          class="preview-icon"
          alt="sound"
        />
      }
    </div>
  `,
  styles: [
    `
      .preview-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      .preview-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .preview-icon {
        width: 48px;
        height: 48px;
        opacity: 0.7;
      }
    `,
  ],
  imports: [],
})
export class AssetPreviewComponent implements OnDestroy {
  assetId = input<string>();
  type = input<"image" | "image_set" | "audio" | "audio_set" | string>("image");
  imageUrl = input<string>();
  name = input<string>("");
  images = input<any[]>();
  animate = input(true);

  private intervalId: any;
  currentIndex = signal(0);

  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  currentUrl = computed(() => {
    const images = this.images();
    const type = this.type();
    const index = this.currentIndex();

    if (type === "image_set" && images && images.length > 0) {
      const entry = images[index % images.length];
      return this.getFullUrl(entry?.url || "");
    } else {
      const url = this.imageUrl();
      const id = this.assetId();
      return (
        this.getFullUrl(url || "") ||
        (id ? this.dataService.getAssetUrl(id) : "")
      );
    }
  });

  constructor() {
    effect(() => {
      const shouldAnimate = this.type() === "image_set" && this.animate();
      untracked(() => {
        if (shouldAnimate) {
          this.startAnimation();
        } else {
          this.stopAnimation();
        }
      });
    });
  }

  ngOnDestroy() {
    this.stopAnimation();
  }

  public isSoundType(): boolean {
    const t = this.normalizedType();
    return t === AssetType.AUDIO || t === AssetType.AUDIO_SET;
  }

  normalizedType = computed(() => {
    return normalizeAssetType(this.type());
  });

  private startAnimation() {
    this.stopAnimation();
    const images = this.images();
    if (!images || images.length <= 1) return;

    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.currentIndex.update((i) => (i + 1) % images.length);
        this.cdr.markForCheck();
      }, 1000);
    });
  }

  private stopAnimation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private getFullUrl(url: string): string {
    if (url && url.startsWith("/")) {
      return `${this.dataService.serverUrl}${url}`;
    }
    return url;
  }
}
