import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
  signal,
  SimpleChanges,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { ItemSelectorComponent } from "@app/components/shared/item-selector/item-selector.component";
import { DataService } from "@app/data.service";
import { AssetType, normalizeAssetType } from "@app/models/asset";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AudioService } from "@app/services/audio.service";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  getDefaultAudioName,
  interpolate,
  mockTTSContext,
  playSound,
  releaseUtterance,
  resolveAudioUrl,
  retainUtterance,
  setupTtsWatchdogs,
} from "@app/utils/audio";

import { AudioSelectorFileHelper } from "./audio-selector-file.helper";

@Component({
  standalone: true,
  selector: "app-audio-selector",
  templateUrl: "./audio-selector.component.html",
  styleUrls: ["./audio-selector.component.css"],
  imports: [FormsModule, ItemSelectorComponent, TranslatePipe],
})
export class AudioSelectorComponent implements OnChanges, OnDestroy {
  label = input<string>("");
  assets = input<any[]>([]);
  type = input<"preset" | "tts" | "none" | "audio_set">("preset");
  url = input<string | undefined>(undefined);
  text = input<string | undefined>(undefined);
  assetId = input<string | undefined>(undefined);
  readonly = input<boolean>(false);
  mode = input<"single" | "set">("single");
  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
  fallbackName = input<string | null | undefined>(undefined);
  context = input<any>(undefined);
  ttsVoice = input<string | undefined>(undefined);
  ttsRate = input<number | undefined>(undefined);
  ttsPitch = input<number | undefined>(undefined);
  ttsVolume = input<number | undefined>(undefined);
  masterVolume = input<number | undefined>(undefined);
  allowOverride = input<boolean>(false);
  isOverridden = input<boolean>(true);

  typeChange = output<"preset" | "tts" | "none" | "audio_set">();
  urlChange = output<string | undefined>();
  textChange = output<string | undefined>();
  assetSelected = output<any>();
  overrideChange = output<boolean>();
  change = output<{
    type: "preset" | "tts" | "none" | "audio_set";
    url?: string;
    text?: string;
  }>();

  showItemSelector = false;
  isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private previewAudio: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private ttsSafetyTimeout: any = null;
  private currentPlaybackId = 0;
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
  localText = signal<string | undefined>(undefined);
  savedPresetUrl: string | undefined = undefined;
  savedPresetAsset: any | null = null;
  private savedTtsText: string | undefined = undefined;

  effectiveUrl = computed(() => {
    return this.localUrl() ?? this.url();
  });

  effectiveType = computed(() => {
    return this.localType() ?? this.type();
  });

  effectiveText = computed(() => {
    return this.localText() ?? this.text();
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
      return assets.filter(
        (a) =>
          normalizeAssetType(a.type) === AssetType.AUDIO_SET ||
          a.type === "audio_set" ||
          (a.audioEntries && a.audioEntries.length > 0) ||
          (a.audio_entries && a.audio_entries.length > 0),
      );
    }
    return assets.filter(
      (a) =>
        normalizeAssetType(a.type) !== AssetType.AUDIO_SET &&
        a.type !== "audio_set" &&
        (!a.audioEntries || a.audioEntries.length === 0) &&
        (!a.audio_entries || a.audio_entries.length === 0),
    );
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
      const assetsIndex = u.indexOf("/assets/");
      if (assetsIndex !== -1) {
        return u.substring(assetsIndex);
      }
      return u;
    };

    const normalizedLookup = normalize(lookupValue);

    const matchInList = (list: any[]) => {
      // 1. Exact ID match (highest priority)
      let match = list.find((a) => {
        const id = a.model?.entityId || a.entity_id || a.id;
        return id && (id === lookupValue || id === targetIdOrUrl);
      });
      if (match) return match;

      // 2. Exact URL match
      match = list.find(
        (a) =>
          (a.url && a.url === lookupValue) ||
          (a.url && normalize(a.url) === normalizedLookup),
      );
      if (match) return match;

      // 3. Fallback: filename match when lookupValue starts with /assets/
      if (
        typeof normalizedLookup === "string" &&
        normalizedLookup.startsWith("/assets/")
      ) {
        const pathPart = normalizedLookup.substring("/assets/".length);
        match = list.find((a) => {
          const id = a.model?.entityId || a.entity_id || a.id;
          return id && (pathPart === id || pathPart.startsWith(`${id}_`));
        });
        if (match) return match;
      }

      // 4. Fallback: asset URL begins with /assets/<lookupValue>_ (only if asset ID matches lookupValue or has no conflicting ID)
      if (
        typeof normalizedLookup === "string" &&
        !normalizedLookup.startsWith("/assets/")
      ) {
        match = list.find((a) => {
          const id = a.model?.entityId || a.entity_id || a.id;
          return (
            a.url &&
            a.url.startsWith(`/assets/${normalizedLookup}_`) &&
            (!id || id === normalizedLookup)
          );
        });
        if (match) return match;
      }

      return null;
    };

    // Prioritize mode-filtered assets (e.g. only audio sets when mode is "set")
    const filteredMatch = matchInList(this.filteredAssets());
    if (filteredMatch) return filteredMatch;

    // Fall back to searching all available assets
    return matchInList(this.allAvailableAssets());
  });

  selectedAssetName = computed(() => {
    if (this.effectiveType() === "none") {
      return (
        (this.translationService
          ? this.translationService.translate("AS_OPTION_NONE")
          : null) || "None"
      );
    }

    const asset = this.selectedAsset();

    if (!asset) {
      if (
        this.effectiveType() === "preset" ||
        this.effectiveType() === "audio_set"
      ) {
        const defaultName = getDefaultAudioName(
          this.assetId() || this.effectiveUrl(),
        );
        if (defaultName) return defaultName;
      }
      const fallback = this.fallbackName();
      if (fallback) return fallback;
      return (
        (this.translationService
          ? this.translationService.translate("AS_SELECT_SOUND")
          : null) || "Select Sound..."
      );
    }

    const fallback = this.fallbackName();
    return (
      asset.name ||
      fallback ||
      (this.translationService
        ? this.translationService.translate("AS_UNKNOWN_ASSET")
        : null) ||
      "Unknown Asset"
    );
  });

  private audioService = inject(AudioService, { optional: true });
  public settingsService = inject(SettingsService, { optional: true });

  constructor(
    public dataService: DataService,
    public cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    public logger: LoggerService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes["type"]) {
      this.localType.set(undefined);
    }
    if (changes["text"]) {
      const textVal = this.text();
      if (textVal !== undefined && textVal !== "") {
        this.savedTtsText = textVal;
      }
      if (textVal !== undefined) {
        this.localText.set(undefined);
      }
    }
    if (changes["url"] || changes["assetId"]) {
      const currentUrlVal = this.url();
      const currentAssetIdVal = this.assetId();
      if (currentUrlVal || currentAssetIdVal) {
        this.savedPresetUrl = currentAssetIdVal || currentUrlVal;
      }
      const local = this.localSelectedAsset();
      if (local && (currentUrlVal || currentAssetIdVal)) {
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

  toggleOverride(): void {
    if (this.readonly()) return;
    this.overrideChange.emit(!this.isOverridden());
  }

  onTypeChange(newType: "preset" | "tts" | "none" | "audio_set") {
    if (this.isPlaying) {
      this.stop();
    }

    const currentUrl = this.effectiveUrl() || this.assetId();
    if (currentUrl) {
      this.savedPresetUrl = currentUrl;
    }
    const currentAsset = this.selectedAsset() || this.localSelectedAsset();
    if (currentAsset) {
      this.savedPresetAsset = currentAsset;
    }
    const currentText = this.effectiveText();
    if (currentText !== undefined && currentText !== "") {
      this.savedTtsText = currentText;
    }

    this.localType.set(newType);

    if (newType === "preset" || newType === "audio_set") {
      const restoreUrl = this.effectiveUrl() || this.savedPresetUrl;
      if (restoreUrl) {
        this.localUrl.set(restoreUrl);
        if (this.savedPresetAsset) {
          this.localSelectedAsset.set(this.savedPresetAsset);
          this.assetSelected.emit(this.savedPresetAsset);
        }
        this.urlChange.emit(restoreUrl);
      }
    } else if (newType === "tts") {
      const restoreText = this.effectiveText() ?? this.savedTtsText;
      if (restoreText !== undefined) {
        this.localText.set(restoreText);
        this.textChange.emit(restoreText);
      }
    }

    if (newType) {
      this.typeChange.emit(newType);
      this.change.emit({
        type: newType,
        url: this.effectiveUrl(),
        text: this.effectiveText(),
      });
    }
  }

  onUrlChange(newUrl: string) {
    this.localUrl.set(newUrl);
    this.savedPresetUrl = newUrl;
    this.urlChange.emit(newUrl);
    this.change.emit({
      type: this.effectiveType(),
      url: newUrl,
      text: this.effectiveText(),
    });
  }

  onTextChange(newText: string) {
    this.localText.set(newText);
    this.savedTtsText = newText;
    this.textChange.emit(newText);
    this.change.emit({
      type: this.effectiveType(),
      url: this.effectiveUrl(),
      text: newText,
    });
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

  onPlayPreview(item: any) {
    if (this.isPlaying) {
      this.stop();
    }
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
    const previewEntries = item.audioEntries || item.audio_entries;
    if (
      item.type === "audio_set" &&
      previewEntries &&
      previewEntries.length > 0
    ) {
      this.playAudioSetEntries(previewEntries);
      return;
    }
    const playContext = this.context() || mockTTSContext();
    const masterVol =
      this.masterVolume() !== undefined
        ? this.masterVolume()!
        : (this.audioService?.getMasterVolume() ??
          this.settingsService?.getSettings().masterVolume ??
          100);
    this.previewAudio =
      playSound(
        item.type === "audio_set" ? "audio_set" : "preset",
        item.url || item.model?.entityId || item.entity_id,
        "",
        this.dataService.serverUrl,
        playContext,
        this.logger,
        {
          masterVolume: masterVol,
          ttsVoice: this.ttsVoice(),
          ttsRate: this.ttsRate(),
          ttsPitch: this.ttsPitch(),
          ttsVolume: this.ttsVolume(),
        },
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
    if (this.ttsSafetyTimeout) {
      clearTimeout(this.ttsSafetyTimeout);
      this.ttsSafetyTimeout = null;
    }
    const hadUtterance = !!this.activeUtterance;
    if (this.activeUtterance) {
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      releaseUtterance(this.activeUtterance);
      this.activeUtterance = null;
    }
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      (hadUtterance ||
        window.speechSynthesis.speaking ||
        window.speechSynthesis.pending)
    ) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    }
    this.cdr.detectChanges();
  }

  private playTTSPromise(
    text: string | undefined,
    skipCancel = false,
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!text || typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }
      const playContext = this.context() || mockTTSContext();
      const interpolatedText = interpolate(text, playContext);
      if (!interpolatedText || !interpolatedText.trim()) {
        resolve();
        return;
      }
      if (
        !skipCancel &&
        (window.speechSynthesis.speaking || window.speechSynthesis.pending)
      ) {
        try {
          window.speechSynthesis.cancel();
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {
          // ignore
        }
      }
      const utterance = new SpeechSynthesisUtterance(interpolatedText);
      this.activeUtterance = utterance;
      retainUtterance(utterance);
      this.configureUtterance(utterance);

      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        watchdogs.clear();
        releaseUtterance(utterance);
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
        if (this.ttsSafetyTimeout) {
          clearTimeout(this.ttsSafetyTimeout);
          this.ttsSafetyTimeout = null;
        }
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
        }
        resolve();
      };
      const watchdogs = setupTtsWatchdogs(
        utterance,
        () => finished,
        () => done(),
      );

      utterance.onend = () => done();
      utterance.onerror = (e: any) => {
        this.logger.warn(
          "TTS error for utterance:",
          interpolatedText,
          e?.error,
        );
        done();
      };

      const wordCount = interpolatedText.trim().split(/\s+/).length;
      const dynamicTimeout = Math.max(3000, wordCount * 500 + 2000);
      this.ttsSafetyTimeout = setTimeout(() => {
        done();
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }, dynamicTimeout);

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        this.logger.error("Failed to speak utterance", err);
        done();
      }
    });
  }

  private async playAudioSet() {
    let asset = this.selectedAsset();
    let entries = asset?.audioEntries || asset?.audio_entries;
    if (!asset || !entries || entries.length === 0) {
      const lookupValue = this.assetId() || this.effectiveUrl();
      if (lookupValue && this.dataService?.loadedAssets) {
        const loadedAssets = this.dataService.loadedAssets;
        asset = (loadedAssets || []).find((a: any) => {
          const id = a.model?.entityId || a.entity_id || a.id;
          return (
            id === lookupValue ||
            a.url === lookupValue ||
            (typeof a.url === "string" &&
              a.url.startsWith(`/assets/${lookupValue}_`))
          );
        });
        entries = asset?.audioEntries || asset?.audio_entries;
      }
      if (
        (!asset || !entries || entries.length === 0) &&
        this.dataService?.listAssets
      ) {
        try {
          const loadedAssets = await firstValueFrom(
            this.dataService.listAssets(),
          );
          if (lookupValue) {
            asset = (loadedAssets || []).find((a: any) => {
              const id = a.model?.entityId || a.entity_id || a.id;
              return (
                id === lookupValue ||
                a.url === lookupValue ||
                (typeof a.url === "string" &&
                  a.url.startsWith(`/assets/${lookupValue}_`))
              );
            });
            entries = asset?.audioEntries || asset?.audio_entries;
          }
        } catch {
          // Ignore
        }
      }
    }
    if (!asset || !entries || entries.length === 0) {
      this.isPlaying = false;
      this.cdr.detectChanges();
      return;
    }
    await this.playAudioSetEntries(entries);
  }

  private async playAudioSetEntries(entries: any[]) {
    const playbackId = ++this.currentPlaybackId;
    this.isPlaying = true;
    this.cdr.detectChanges();

    // Natural order: elapsed ascending first, then remaining descending
    const sortedEntries = [...entries].sort((a, b) => {
      const modeA = a.triggerMode || a.trigger_mode || "remaining";
      const modeB = b.triggerMode || b.trigger_mode || "remaining";
      if (modeA !== modeB) {
        return modeA === "elapsed" ? -1 : 1;
      }
      const valA =
        Number(
          a.timeSeconds != null
            ? a.timeSeconds
            : a.time_seconds != null
              ? a.time_seconds
              : a.percentage,
        ) || 0;
      const valB =
        Number(
          b.timeSeconds != null
            ? b.timeSeconds
            : b.time_seconds != null
              ? b.time_seconds
              : b.percentage,
        ) || 0;
      return modeA === "elapsed" ? valA - valB : valB - valA;
    });

    for (const entry of sortedEntries) {
      if (!this.isPlaying || this.currentPlaybackId !== playbackId) break;
      try {
        const entryType = entry.type || "preset";
        if (entryType === "preset") {
          await this.playUrl(entry.url);
        } else if (entryType === "tts") {
          await this.playTTSPromise(entry.text, true);
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
      const urlToPlay =
        this.effectiveUrl() || this.selectedAsset()?.url || this.assetId();
      this.playUrl(urlToPlay)
        .then(() => {
          if (this.currentPlaybackId === playbackId) {
            this.isPlaying = false;
            this.cdr.detectChanges();
          }
        })
        .catch((err) => {
          this.logger.error("Error playing standard preset audio", err);
          if (this.currentPlaybackId === playbackId) {
            this.isPlaying = false;
            this.cdr.detectChanges();
          }
        });
    } else if (this.effectiveType() === "tts") {
      this.playTTS(this.effectiveText());
    }
  }

  private playUrl(url: string | undefined): Promise<void> {
    if (!url) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const playableUrl = resolveAudioUrl(url, this.dataService.serverUrl);
      const audio = new Audio(playableUrl);
      const rawMasterVol =
        this.masterVolume() !== undefined
          ? this.masterVolume()!
          : (this.audioService?.getMasterVolume() ??
            this.settingsService?.getSettings().masterVolume ??
            100);
      const parsedMasterVol = Number(rawMasterVol);
      const effMasterVol =
        !isNaN(parsedMasterVol) && parsedMasterVol >= 0 ? parsedMasterVol : 100;
      audio.volume = Math.max(0, Math.min(1, effMasterVol / 100));
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

  private playTTS(text: string | undefined, isRetry = false) {
    const interpolatedText =
      text && typeof window !== "undefined" && window.speechSynthesis
        ? interpolate(text, this.context() || mockTTSContext())
        : "";
    if (!interpolatedText || !interpolatedText.trim()) {
      this.isPlaying = false;
      this.cdr.detectChanges();
      return;
    }

    const playbackId = this.currentPlaybackId;
    if (this.ttsSafetyTimeout) {
      clearTimeout(this.ttsSafetyTimeout);
      this.ttsSafetyTimeout = null;
    }
    if (this.activeUtterance) {
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      releaseUtterance(this.activeUtterance);
      this.activeUtterance = null;
    }

    if (
      !isRetry &&
      (window.speechSynthesis.speaking || window.speechSynthesis.pending)
    ) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    }

    const utterance = new SpeechSynthesisUtterance(interpolatedText);
    this.activeUtterance = utterance;
    retainUtterance(utterance);
    this.configureUtterance(utterance);

    let ended = false;
    const cleanup = (stopPlaying = true) => {
      if (ended) return;
      ended = true;
      watchdogs.clear();
      releaseUtterance(utterance);
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
      if (this.ttsSafetyTimeout) {
        clearTimeout(this.ttsSafetyTimeout);
        this.ttsSafetyTimeout = null;
      }
      if (this.activeUtterance === utterance) this.activeUtterance = null;
      if (stopPlaying && this.currentPlaybackId === playbackId) {
        this.isPlaying = false;
        this.cdr.detectChanges();
      }
    };
    const watchdogs = setupTtsWatchdogs(
      utterance,
      () => ended,
      () => cleanup(),
    );

    utterance.onend = () => cleanup();
    utterance.onerror = (e: any) => {
      if (
        (e?.error === "interrupted" || e?.error === "canceled") &&
        this.currentPlaybackId === playbackId &&
        this.isPlaying &&
        !isRetry
      ) {
        cleanup(false);
        setTimeout(() => {
          if (this.currentPlaybackId === playbackId && this.isPlaying) {
            this.playTTS(text, true);
          }
        }, 60);
        return;
      }
      this.logger.warn("TTS error for utterance:", interpolatedText, e?.error);
      cleanup();
    };

    const wordCount = interpolatedText.trim().split(/\s+/).length;
    this.ttsSafetyTimeout = setTimeout(
      () => {
        cleanup();
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      },
      Math.max(3000, wordCount * 500 + 2000),
    );

    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.logger.error("Failed to speak utterance", err);
      cleanup();
    }
  }

  private configureUtterance(utterance: SpeechSynthesisUtterance): void {
    if (this.audioService) {
      this.audioService.applyTtsSettingsToUtterance(
        utterance,
        this.ttsVoice(),
        this.ttsRate(),
        this.ttsPitch(),
        this.ttsVolume(),
        this.masterVolume(),
      );
    } else {
      AudioSelectorFileHelper.applyFallbackTtsSettings(this, utterance);
    }
  }

  // Drag & Drop
  onDragEnter(event: DragEvent) {
    AudioSelectorFileHelper.handleDragEnter(this, event);
  }

  onDragOver(event: DragEvent) {
    AudioSelectorFileHelper.handleDragOver(this, event);
  }

  onDragLeave(event: DragEvent) {
    AudioSelectorFileHelper.handleDragLeave(this, event);
  }

  onDrop(event: DragEvent) {
    AudioSelectorFileHelper.handleDrop(this, event);
  }

  onFilePicked(file: File) {
    if (this.readonly()) return;
    this.closeItemSelector();
    this.processFile(file);
  }

  showTransientError(messageKey: string) {
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

  processFile(file: File) {
    return AudioSelectorFileHelper.processFile(this, file);
  }

  selectResolvedAsset(asset: any) {
    AudioSelectorFileHelper.selectResolvedAsset(this, asset);
  }
}
