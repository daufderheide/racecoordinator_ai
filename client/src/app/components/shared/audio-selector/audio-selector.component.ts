import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { DataService } from "src/app/data.service";
import { TranslationService } from "src/app/services/translation.service";
import { mockTTSContext, playSound } from "src/app/utils/audio";
import { NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ItemSelectorComponent } from "../item-selector/item-selector.component";
import { TranslatePipe } from "src/app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-audio-selector",
  templateUrl: "./audio-selector.component.html",
  styleUrls: ["./audio-selector.component.css"],
  imports: [NgIf, FormsModule, ItemSelectorComponent, TranslatePipe],
})
export class AudioSelectorComponent {
  @Input() label: string = "Audio";
  @Input() type: "preset" | "tts" | "none" | "audio_set" | undefined = "preset";
  @Input() mode: "single" | "set" = "single";
  @Input() readonly: boolean = false;

  @Output() typeChange = new EventEmitter<
    "preset" | "tts" | "none" | "audio_set"
  >();

  @Input() url?: string;
  @Output() urlChange = new EventEmitter<string>();

  @Input() assetId?: string;
  @Input() fallbackName?: string | null;

  @Input() text?: string;
  @Output() textChange = new EventEmitter<string>();

  @Output() assetSelected = new EventEmitter<any>();

  @Input() assets: any[] = [];

  // Back button configuration passed through to Item Selector
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Input() context?: any;

  showItemSelector = false;

  get filteredAssets(): any[] {
    if (this.mode === "set") {
      return this.assets.filter((a) => a.type === "audio_set");
    }
    return this.assets.filter((a) => a.type !== "audio_set");
  }

  get selectedAsset(): any {
    const lookupValue = this.assetId || this.url;
    if (!lookupValue) return null;

    const normalize = (u: string) => {
      if (!u) return "";
      // Extract the path after /api/ if it exists, otherwise return as is
      const apiIndex = u.indexOf("/api/");
      if (apiIndex !== -1) {
        return u.substring(apiIndex);
      }
      return u;
    };

    const normalizedLookup = normalize(lookupValue);

    return this.assets.find((a) => {
      if (a.model?.entityId === lookupValue || a.entity_id === lookupValue)
        return true;
      if (normalize(a.url) === normalizedLookup) return true;
      return false;
    });
  }

  get selectedAssetName(): string {
    if (this.type === "none") {
      return this.translationService
        ? this.translationService.translate("AS_OPTION_NONE")
        : "None";
    }

    const asset = this.selectedAsset;

    if (!asset) {
      if (this.fallbackName) return this.fallbackName;
      return this.translationService
        ? this.translationService.translate("AS_SELECT_SOUND")
        : "Select Sound...";
    }

    return (
      asset.name ||
      this.fallbackName ||
      (this.translationService
        ? this.translationService.translate("AS_UNKNOWN_ASSET")
        : "Unknown Asset")
    );
  }

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
  ) {}

  onTypeChange(newType: "preset" | "tts" | "none" | "audio_set" | undefined) {
    if (newType) {
      this.type = newType;
      this.typeChange.emit(this.type);
    }
  }

  onUrlChange(newUrl: string) {
    this.url = newUrl;
    this.urlChange.emit(this.url);
  }

  onTextChange(newText: string) {
    this.text = newText;
    this.textChange.emit(this.text);
  }

  openItemSelector() {
    this.showItemSelector = true;
  }

  closeItemSelector() {
    this.showItemSelector = false;
  }

  onAssetSelected(asset: any) {
    if (!asset) return;

    // Prevent cross-mode selection
    if (this.mode === "set" && asset.type !== "audio_set") return;
    if (this.mode === "single" && asset.type === "audio_set") return;

    const val =
      asset?.model?.entityId || asset?.entity_id || asset?.url || asset?.id;
    if (val) {
      this.onUrlChange(val);
      this.assetSelected.emit(asset);
      const targetType = asset.type === "audio_set" ? "audio_set" : "preset";
      if (this.type !== targetType) {
        this.onTypeChange(targetType);
      }
    }
    this.closeItemSelector();
  }

  isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;

  onPlayPreview(item: any) {
    if (this.isPlaying) {
      this.stop();
      // If we clicked play on a different item while playing, we should play the new one.
      // But for now let's just stop.
    }
    const playContext = this.context || mockTTSContext();
    playSound(
      item.type === "audio_set" ? "audio_set" : "preset",
      item.url || item.model?.entityId || item.entity_id,
      "",
      this.dataService.serverUrl,
      playContext,
    );
  }

  play() {
    if (this.isPlaying) {
      this.stop();
      return;
    }

    if (this.type === "none") return;

    if (this.type === "audio_set") {
      this.playAudioSet();
    } else {
      this.playStandard();
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.cdr.detectChanges();
  }

  private async playAudioSet() {
    const asset = this.selectedAsset;
    if (!asset || !asset.audioEntries || asset.audioEntries.length === 0) {
      return;
    }

    this.isPlaying = true;
    this.cdr.detectChanges();

    for (const entry of asset.audioEntries) {
      if (!this.isPlaying) break;
      try {
        await this.playUrl(entry.url);
      } catch (e) {
        console.error("Error playing audio set entry", e);
      }
    }
    this.isPlaying = false;
    this.cdr.detectChanges();
  }

  private playStandard() {
    this.isPlaying = true;
    this.cdr.detectChanges();

    if (this.type === "preset") {
      this.playUrl(this.url)
        .then(() => {
          this.isPlaying = false;
          this.cdr.detectChanges();
        })
        .catch(() => {
          this.isPlaying = false;
          this.cdr.detectChanges();
        });
    } else if (this.type === "tts") {
      this.playTTS(this.text);
    }
  }

  private playUrl(url: string | undefined): Promise<void> {
    if (!url) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let playableUrl = url;
      if (url.startsWith("/")) {
        playableUrl = `${this.dataService.serverUrl}${url}`;
      }
      const audio = new Audio(playableUrl);
      this.currentAudio = audio;
      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };
      audio.onerror = (err) => {
        this.currentAudio = null;
        reject(err);
      };
      audio.play().catch(reject);
    });
  }

  private playTTS(text: string | undefined) {
    if (!text || !window.speechSynthesis) {
      this.isPlaying = false;
      this.cdr.detectChanges();
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      this.isPlaying = false;
      this.cdr.detectChanges();
    };
    utterance.onerror = () => {
      this.isPlaying = false;
      this.cdr.detectChanges();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Drag & Drop
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const data = event.dataTransfer?.getData("application/json");
    if (data) {
      try {
        const asset = JSON.parse(data);
        this.onAssetSelected(asset);
      } catch (e) {
        console.error("Failed to parse dropped asset data", e);
      }
    }
  }
}
