import {
  ChangeDetectorRef,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ItemSelectorComponent } from "@app/components/shared/item-selector/item-selector.component";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { interpolate, mockTTSContext, playSound } from "@app/utils/audio";

@Component({
  standalone: true,
  selector: "app-audio-selector",
  templateUrl: "./audio-selector.component.html",
  styleUrls: ["./audio-selector.component.css"],
  imports: [FormsModule, ItemSelectorComponent, TranslatePipe],
})
export class AudioSelectorComponent {
  label = input("Audio");
  type = input<"preset" | "tts" | "none" | "audio_set">("preset");
  typeChange = output<"preset" | "tts" | "none" | "audio_set">();
  mode = input<"single" | "set">("single");
  readonly = input(false);

  url = input<string | undefined>();
  urlChange = output<string | undefined>();

  assetId = input<string>();
  fallbackName = input<string | null>();

  text = input<string | undefined>();
  textChange = output<string | undefined>();

  assetSelected = output<any>();

  assets = input<any[]>([]);

  context = input<any>();

  showItemSelector = false;

  filteredAssets = computed(() => {
    const assets = this.assets();
    if (this.mode() === "set") {
      return assets.filter((a) => a.type === "audio_set");
    }
    return assets.filter((a) => a.type !== "audio_set");
  });

  selectedAsset = computed(() => {
    const lookupValue = this.assetId() || this.url();
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

    return this.assets().find((a) => {
      if (a.model?.entityId === lookupValue || a.entity_id === lookupValue)
        return true;
      if (normalize(a.url) === normalizedLookup) return true;
      return false;
    });
  });

  selectedAssetName = computed(() => {
    if (this.type() === "none") {
      return this.translationService
        ? this.translationService.translate("AS_OPTION_NONE")
        : "None";
    }

    const asset = this.selectedAsset();

    if (!asset) {
      const fallback = this.fallbackName();
      if (fallback) return fallback;
      return this.translationService
        ? this.translationService.translate("AS_SELECT_SOUND")
        : "Select Sound...";
    }

    const fallback = this.fallbackName();
    return (
      asset.name ||
      fallback ||
      (this.translationService
        ? this.translationService.translate("AS_UNKNOWN_ASSET")
        : "Unknown Asset")
    );
  });

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private logger: LoggerService,
  ) {}

  onTypeChange(newType: "preset" | "tts" | "none" | "audio_set") {
    if (newType) {
      this.typeChange.emit(newType);
    }
  }

  onUrlChange(newUrl: string) {
    this.urlChange.emit(newUrl);
  }

  onTextChange(newText: string) {
    this.textChange.emit(newText);
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
    const mode = this.mode();
    if (mode === "set" && asset.type !== "audio_set") return;
    if (mode === "single" && asset.type === "audio_set") return;

    const val =
      asset?.model?.entityId || asset?.entity_id || asset?.url || asset?.id;
    if (val) {
      this.onUrlChange(val);
      this.assetSelected.emit(asset);
      const targetType = asset.type === "audio_set" ? "audio_set" : "preset";
      if (this.type() !== targetType) {
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
    const playContext = this.context() || mockTTSContext();
    playSound(
      item.type === "audio_set" ? "audio_set" : "preset",
      item.url || item.model?.entityId || item.entity_id,
      "",
      this.dataService.serverUrl,
      playContext,
      this.logger,
    );
  }

  play() {
    if (this.isPlaying) {
      this.stop();
      return;
    }

    if (this.type() === "none") return;

    if (this.type() === "audio_set") {
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

  private playTTSPromise(text: string | undefined): Promise<void> {
    return new Promise((resolve) => {
      if (!text || !window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const playContext = this.context() || mockTTSContext();
      const interpolatedText = interpolate(text, playContext);
      const utterance = new SpeechSynthesisUtterance(interpolatedText);
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  private async playAudioSet() {
    const asset = this.selectedAsset();
    if (!asset || !asset.audioEntries || asset.audioEntries.length === 0) {
      return;
    }

    this.isPlaying = true;
    this.cdr.detectChanges();

    for (const entry of asset.audioEntries) {
      if (!this.isPlaying) break;
      try {
        const entryType = entry.type || "preset";
        if (entryType === "preset") {
          await this.playUrl(entry.url);
        } else if (entryType === "tts") {
          await this.playTTSPromise(entry.text);
        }
      } catch (e) {
        this.logger.error("Error playing audio set entry", e);
      }
    }
    this.isPlaying = false;
    this.cdr.detectChanges();
  }

  private playStandard() {
    this.isPlaying = true;
    this.cdr.detectChanges();

    if (this.type() === "preset") {
      this.playUrl(this.url())
        .then(() => {
          this.isPlaying = false;
          this.cdr.detectChanges();
        })
        .catch(() => {
          this.isPlaying = false;
          this.cdr.detectChanges();
        });
    } else if (this.type() === "tts") {
      this.playTTS(this.text());
    }
  }

  private playUrl(url: string | undefined): Promise<void> {
    if (!url) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let playableUrl = url;
      if (url.startsWith("/")) {
        playableUrl = `${this.dataService.serverUrl}${url}`;
      } else {
        const defaultUrls: Record<string, string> = {
          default_beep: "/assets/default_beep_Lap_Beep",
          default_chimes: "/assets/default_chimes_Lap_Chimes",
          default_driveby: "/assets/default_driveby_Lap_Driveby",
          default_penalty: "/assets/default_penalty_Penalty",
          default_yellow_flag: "/assets/default_yellow_flag_Yellow_Flag",
        };
        if (defaultUrls[url]) {
          playableUrl = `${this.dataService.serverUrl}${defaultUrls[url]}`;
        }
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

    const playContext = this.context() || mockTTSContext();
    const interpolatedText = interpolate(text, playContext);

    const utterance = new SpeechSynthesisUtterance(interpolatedText);
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
        this.logger.error("Failed to parse dropped asset data", e);
      }
    }
  }
}
