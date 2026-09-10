import {
  ChangeDetectorRef,
  Component,
  computed,
  input,
  OnChanges,
  OnDestroy,
  output,
  signal,
  SimpleChanges,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ItemSelectorComponent } from "@app/components/shared/item-selector/item-selector.component";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import {
  interpolate,
  mockTTSContext,
  playSound,
  resolveAudioUrl,
} from "@app/utils/audio";

@Component({
  standalone: true,
  selector: "app-audio-selector",
  templateUrl: "./audio-selector.component.html",
  styleUrls: ["./audio-selector.component.css"],
  imports: [FormsModule, ItemSelectorComponent, TranslatePipe],
})
export class AudioSelectorComponent implements OnChanges, OnDestroy {
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
  isDragging = false;
  dragCounter = 0;
  isUploading = false;
  errorMessage: string | null = null;
  private errorTimeout: any = null;

  localAssets = signal<any[]>([]);
  dataServiceAssets = this.dataService?.assets$
    ? toSignal(this.dataService.assets$, { initialValue: [] })
    : signal<any[]>([]);
  localSelectedAsset = signal<any | null>(null);
  localUrl = signal<string | undefined>(undefined);
  localType = signal<"preset" | "tts" | "none" | "audio_set" | undefined>(
    undefined,
  );

  effectiveUrl = computed(() => {
    return this.localUrl() ?? this.url();
  });

  effectiveType = computed(() => {
    return this.localType() ?? this.type();
  });

  allAvailableAssets = computed(() => {
    const inputAssets = this.assets() || [];
    const local = this.localAssets() || [];
    const fromDs = this.dataServiceAssets() || [];

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

  filteredAssets = computed(() => {
    const assets = this.allAvailableAssets();
    if (this.mode() === "set") {
      return assets.filter((a) => a.type === "audio_set");
    }
    return assets.filter((a) => a.type !== "audio_set");
  });

  selectedAsset = computed(() => {
    const local = this.localSelectedAsset();
    if (local) {
      return local;
    }

    const lookupValue = this.assetId() || this.effectiveUrl();
    if (!lookupValue) return null;

    const extractId = (val: string) => {
      if (!val) return "";
      const downloadPrefix = "/api/assets/download/";
      const idx = val.indexOf(downloadPrefix);
      if (idx !== -1) {
        return val.substring(idx + downloadPrefix.length);
      }
      return val;
    };

    const targetIdOrUrl = extractId(lookupValue);

    const normalize = (u: string) => {
      if (!u) return "";
      const apiIndex = u.indexOf("/api/");
      if (apiIndex !== -1) {
        return u.substring(apiIndex);
      }
      return u;
    };

    const normalizedLookup = normalize(lookupValue);

    return this.allAvailableAssets().find((a) => {
      const id = a.model?.entityId || a.entity_id || a.id;
      if (id && (id === lookupValue || id === targetIdOrUrl)) return true;
      if (normalize(a.url) === normalizedLookup) return true;
      return false;
    });
  });

  selectedAssetName = computed(() => {
    if (this.effectiveType() === "none") {
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes["type"]) {
      this.localType.set(undefined);
    }
    if (changes["url"] || changes["assetId"]) {
      const currentUrlVal = this.url();
      const currentAssetIdVal = this.assetId();
      const local = this.localSelectedAsset();
      if (local) {
        const localId =
          local.model?.entityId || local.entity_id || local.id || local.url;
        if (
          currentUrlVal !== localId &&
          currentUrlVal !== local.url &&
          currentAssetIdVal !== localId
        ) {
          this.localSelectedAsset.set(null);
          this.localUrl.set(undefined);
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
    this.stop();
  }

  onTypeChange(newType: "preset" | "tts" | "none" | "audio_set") {
    if (this.isPlaying) {
      this.stop();
    }
    this.localType.set(newType);
    if (newType === "none" || newType === "tts") {
      this.localSelectedAsset.set(null);
      this.localUrl.set(undefined);
    }
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
    if (this.readonly()) return;
    if (
      this.dataService?.listAssets &&
      (!this.dataService.loadedAssets ||
        this.dataService.loadedAssets.length === 0)
    ) {
      this.dataService.listAssets().subscribe();
    }
    this.showItemSelector = true;
  }

  closeItemSelector() {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
    this.showItemSelector = false;
  }

  onAssetSelected(asset: any) {
    if (!asset) return;

    // Prevent cross-mode selection
    const mode = this.mode();
    if (mode === "set" && asset.type !== "audio_set") return;
    if (mode === "single" && asset.type === "audio_set") return;

    this.selectResolvedAsset(asset);
    this.closeItemSelector();
  }

  isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private previewAudio: HTMLAudioElement | null = null;
  private currentPlaybackId = 0;

  onPlayPreview(item: any) {
    if (this.isPlaying) {
      this.stop();
    }
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
    const playContext = this.context() || mockTTSContext();
    this.previewAudio =
      playSound(
        item.type === "audio_set" ? "audio_set" : "preset",
        item.url || item.model?.entityId || item.entity_id,
        "",
        this.dataService.serverUrl,
        playContext,
        this.logger,
      ) || null;
  }

  play() {
    if (this.isPlaying) {
      this.stop();
      return;
    }

    if (this.effectiveType() === "none") return;

    if (this.effectiveType() === "audio_set") {
      this.playAudioSet();
    } else {
      this.playStandard();
    }
  }

  stop() {
    this.currentPlaybackId++;
    this.isPlaying = false;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
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

    const playbackId = ++this.currentPlaybackId;
    this.isPlaying = true;
    this.cdr.detectChanges();

    for (const entry of asset.audioEntries) {
      if (!this.isPlaying || this.currentPlaybackId !== playbackId) break;
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
    if (this.currentPlaybackId === playbackId) {
      this.isPlaying = false;
      this.cdr.detectChanges();
    }
  }

  private playStandard() {
    const playbackId = ++this.currentPlaybackId;
    this.isPlaying = true;
    this.cdr.detectChanges();

    if (this.effectiveType() === "preset") {
      this.playUrl(this.effectiveUrl())
        .then(() => {
          if (this.currentPlaybackId === playbackId) {
            this.isPlaying = false;
            this.cdr.detectChanges();
          }
        })
        .catch(() => {
          if (this.currentPlaybackId === playbackId) {
            this.isPlaying = false;
            this.cdr.detectChanges();
          }
        });
    } else if (this.effectiveType() === "tts") {
      this.playTTS(this.text());
    }
  }

  private playUrl(url: string | undefined): Promise<void> {
    if (!url) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const playableUrl = resolveAudioUrl(url, this.dataService.serverUrl);
      const audio = new Audio(playableUrl);
      this.currentAudio = audio;
      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        resolve();
      };
      audio.onerror = (err) => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        reject(err);
      };
      audio.play().catch((err) => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        reject(err);
      });
    });
  }

  private playTTS(text: string | undefined) {
    if (!text || !window.speechSynthesis) {
      this.isPlaying = false;
      this.cdr.detectChanges();
      return;
    }

    const playbackId = this.currentPlaybackId;
    window.speechSynthesis.cancel();

    const playContext = this.context() || mockTTSContext();
    const interpolatedText = interpolate(text, playContext);

    const utterance = new SpeechSynthesisUtterance(interpolatedText);
    utterance.onend = () => {
      if (this.currentPlaybackId === playbackId) {
        this.isPlaying = false;
        this.cdr.detectChanges();
      }
    };
    utterance.onerror = () => {
      if (this.currentPlaybackId === playbackId) {
        this.isPlaying = false;
        this.cdr.detectChanges();
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  // Drag & Drop
  onDragEnter(event: DragEvent) {
    if (this.readonly()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.isDragging = true;
  }

  onDragOver(event: DragEvent) {
    if (this.readonly()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    if (this.readonly()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.isDragging = false;
    }
  }

  onDrop(event: DragEvent) {
    if (this.readonly()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.isDragging = false;
    this.closeItemSelector();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
      return;
    }

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

  onFilePicked(file: File) {
    if (this.readonly()) return;
    this.closeItemSelector();
    this.processFile(file);
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
    const allowedExtensions = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
    const isMimeValid = file.type && file.type.startsWith("audio/");
    const isExtValid = allowedExtensions.test(file.name);
    if (!isMimeValid && !isExtValid) {
      this.showTransientError("AS_ERR_INVALID_AUDIO");
      return;
    }

    try {
      const hash = await this.dataService.computeFileHash(file);
      const existing =
        this.dataService.findAssetByHash(hash, "audio") ||
        this.assets().find(
          (a) =>
            a.hash &&
            a.hash.toLowerCase() === hash.toLowerCase() &&
            (a.type === "audio" || a.type === "audio_set"),
        );

      if (existing) {
        // Zero network upload: reuse existing asset
        this.selectResolvedAsset(existing);
        this.cdr.detectChanges();
        return;
      }
    } catch (e) {
      this.logger.error("Error computing hash for audio deduplication", e);
    }

    // New asset: upload file
    this.uploadFile(file);
  }

  private uploadFile(file: File) {
    this.isUploading = true;
    this.cdr.detectChanges();

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bytes = new Uint8Array(e.target.result);
      this.dataService.uploadAsset(file.name, "audio", bytes).subscribe({
        next: (asset) => {
          this.isUploading = false;
          this.selectResolvedAsset(asset);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Audio upload failed", err);
          this.isUploading = false;
          this.cdr.detectChanges();
        },
      });
    };
    reader.readAsArrayBuffer(file);
  }

  private selectResolvedAsset(asset: any) {
    if (!asset || this.readonly()) return;

    this.closeItemSelector();

    const previousType = this.effectiveType();
    const targetType = asset.type === "audio_set" ? "audio_set" : "preset";
    this.localType.set(targetType);
    this.localSelectedAsset.set(asset);
    const val =
      asset?.model?.entityId || asset?.entity_id || asset?.url || asset?.id;
    this.localUrl.set(val);

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

    if (val) {
      if (previousType !== targetType) {
        this.typeChange.emit(targetType);
      }
      this.onUrlChange(val);
      this.assetSelected.emit(asset);
    }

    this.stop();
    this.play();
  }
}
