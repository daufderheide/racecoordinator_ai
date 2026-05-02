import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { DataService } from "src/app/data.service";
import {} from "src/app/proto/message";
import { NgIf } from "@angular/common";

@Component({
  standalone: true,
  selector: "app-asset-preview",
  template: `
    <div class="preview-container">
      <ng-container
        *ngIf="normalizedType === 'image' || normalizedType === 'image_set'"
      >
        <img [src]="currentUrl" class="preview-img" [alt]="name" />
      </ng-container>
      <ng-container *ngIf="isSoundType()">
        <img
          src="assets/images/default_audio_icon.png"
          class="preview-icon"
          alt="sound"
        />
      </ng-container>
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
  imports: [NgIf],
})
export class AssetPreviewComponent implements OnInit, OnDestroy, OnChanges {
  @Input() assetId?: string;
  @Input() type: "image" | "image_set" | "sound" | "audio" = "image";
  @Input() imageUrl?: string;
  @Input() name: string = "";
  @Input() images?: any[];
  @Input() animate: boolean = true;

  private intervalId: any;
  private currentIndex = 0;
  currentUrl: string = "";

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.updateUrl();
    if (this.type === "image_set" && this.animate) {
      this.startAnimation();
    }
  }

  ngOnDestroy() {
    this.stopAnimation();
  }

  ngOnChanges() {
    this.updateUrl();
    if (this.type === "image_set" && this.animate) {
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
  }

  private updateUrl() {
    if (this.type === "image_set" && this.images && this.images.length > 0) {
      const entry = this.images[this.currentIndex];
      this.currentUrl = this.getFullUrl(entry.url || "");
    } else {
      this.currentUrl =
        this.getFullUrl(this.imageUrl || "") ||
        (this.assetId ? this.dataService.getAssetUrl(this.assetId) : "");
    }
  }

  public isSoundType(): boolean {
    const t = this.normalizedType;
    return t === "sound" || t === "audio";
  }

  get normalizedType(): string {
    return (this.type || "").toLowerCase();
  }

  private startAnimation() {
    this.stopAnimation();
    if (!this.images || this.images.length <= 1) return;

    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.images!.length;
      this.updateUrl();
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
