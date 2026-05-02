import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  input,
  OnDestroy,
  signal,
} from "@angular/core";
import { DataService } from "src/app/data.service";
import {} from "src/app/proto/message";

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
  type = input<"image" | "image_set" | "sound" | "audio">("image");
  imageUrl = input<string>();
  name = input<string>("");
  images = input<any[]>();
  animate = input(true);

  private intervalId: any;
  currentIndex = signal(0);

  currentUrl = computed(() => {
    const images = this.images();
    const type = this.type();
    const index = this.currentIndex();

    if (type === "image_set" && images && images.length > 0) {
      const entry = images[index % images.length];
      return this.getFullUrl(entry.url || "");
    } else {
      const url = this.imageUrl();
      const id = this.assetId();
      return (
        this.getFullUrl(url || "") ||
        (id ? this.dataService.getAssetUrl(id) : "")
      );
    }
  });

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {
    // Effect to handle animation start/stop when type or animate changes
    effect(() => {
      if (this.type() === "image_set" && this.animate()) {
        this.startAnimation();
      } else {
        this.stopAnimation();
      }
    });
  }

  ngOnDestroy() {
    this.stopAnimation();
  }

  public isSoundType(): boolean {
    const t = this.normalizedType();
    return t === "sound" || t === "audio";
  }

  normalizedType = computed(() => {
    return (this.type() || "").toLowerCase();
  });

  private startAnimation() {
    this.stopAnimation();
    const images = this.images();
    if (!images || images.length <= 1) return;

    this.intervalId = setInterval(() => {
      this.currentIndex.update((i) => (i + 1) % images.length);
      this.cdr.detectChanges();
    }, 1000);
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
