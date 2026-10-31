import { ChangeDetectorRef } from "@angular/core";
import { DataService } from "@app/data.service";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import { resolveBestTtsVoice } from "@app/utils/audio";

export interface AudioSelectorFileHost {
  readonly(): boolean;
  isDragging: boolean;
  dragCounter: number;
  isUploading: boolean;
  assets(): any[];
  closeItemSelector(): void;
  onAssetSelected(asset: any): void;
  selectResolvedAsset(asset: any): void;
  showTransientError(messageKey: string): void;
  cdr: ChangeDetectorRef;
  dataService: DataService;
  logger: LoggerService;
  settingsService?: SettingsService | null;
  ttsVoice?(): string | undefined;
  ttsRate?(): number | undefined;
  ttsPitch?(): number | undefined;
  ttsVolume?(): number | undefined;
  masterVolume?(): number | undefined;
  effectiveType(): string;
  localType: { set(val: any): void };
  localSelectedAsset: { set(val: any): void };
  localUrl: { set(val: any): void };
  savedPresetUrl: string | undefined;
  savedPresetAsset: any | null;
  localAssets: { update(fn: (prev: any[]) => any[]): void };
  typeChange: { emit(val: any): void };
  onUrlChange(val: string): void;
  assetSelected: { emit(val: any): void };
  stop(): void;
  play(): void;
}

export class AudioSelectorFileHelper {
  static handleDragEnter(host: AudioSelectorFileHost, event: DragEvent): void {
    if (host.readonly()) return;
    event.preventDefault();
    event.stopPropagation();
    host.dragCounter++;
    host.isDragging = true;
  }

  static handleDragOver(host: AudioSelectorFileHost, event: DragEvent): void {
    if (host.readonly()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    host.isDragging = true;
  }

  static handleDragLeave(host: AudioSelectorFileHost, event: DragEvent): void {
    if (host.readonly()) return;
    event.preventDefault();
    event.stopPropagation();
    host.dragCounter--;
    if (host.dragCounter <= 0) {
      host.dragCounter = 0;
      host.isDragging = false;
    }
  }

  static handleDrop(host: AudioSelectorFileHost, event: DragEvent): void {
    if (host.readonly()) return;
    event.preventDefault();
    event.stopPropagation();
    host.dragCounter = 0;
    host.isDragging = false;
    host.closeItemSelector();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      AudioSelectorFileHelper.processFile(host, files[0]);
      return;
    }

    const data = event.dataTransfer?.getData("application/json");
    if (data) {
      try {
        const asset = JSON.parse(data);
        host.onAssetSelected(asset);
      } catch (e) {
        host.logger.error("Failed to parse dropped asset data", e);
      }
    }
  }

  static async processFile(
    host: AudioSelectorFileHost,
    file: File,
  ): Promise<void> {
    const allowedExtensions = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
    const isMimeValid = file.type && file.type.startsWith("audio/");
    const isExtValid = allowedExtensions.test(file.name);
    if (!isMimeValid && !isExtValid) {
      host.showTransientError("AS_ERR_INVALID_AUDIO");
      return;
    }

    try {
      const hash = await host.dataService.computeFileHash(file);
      const existing =
        host.dataService.findAssetByHash(hash, "audio") ||
        host
          .assets()
          .find(
            (a) =>
              a.hash &&
              a.hash.toLowerCase() === hash.toLowerCase() &&
              (a.type === "audio" || a.type === "audio_set"),
          );

      if (existing) {
        host.selectResolvedAsset(existing);
        host.cdr.detectChanges();
        return;
      }
    } catch (e) {
      host.logger.error("Error computing hash for audio deduplication", e);
    }

    AudioSelectorFileHelper.uploadFile(host, file);
  }

  static uploadFile(host: AudioSelectorFileHost, file: File): void {
    host.isUploading = true;
    host.cdr.detectChanges();

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bytes = new Uint8Array(e.target.result);
      host.dataService.uploadAsset(file.name, "audio", bytes).subscribe({
        next: (asset) => {
          host.isUploading = false;
          host.selectResolvedAsset(asset);
          host.cdr.detectChanges();
        },
        error: (err) => {
          host.logger.error("Audio upload failed", err);
          host.isUploading = false;
          host.cdr.detectChanges();
        },
      });
    };
    reader.readAsArrayBuffer(file);
  }

  static selectResolvedAsset(host: AudioSelectorFileHost, asset: any): void {
    if (!asset || host.readonly()) return;

    host.closeItemSelector();

    const previousType = host.effectiveType();
    const targetType = asset.type === "audio_set" ? "audio_set" : "preset";
    host.localType.set(targetType);
    host.localSelectedAsset.set(asset);
    const val =
      asset?.model?.entityId || asset?.entity_id || asset?.url || asset?.id;
    host.localUrl.set(val);
    host.savedPresetUrl = val;
    host.savedPresetAsset = asset;

    host.localAssets.update((prev) => {
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
        host.typeChange.emit(targetType);
      }
      host.onUrlChange(val);
      host.assetSelected.emit(asset);
    }

    host.stop();
    host.play();
  }

  static applyFallbackTtsSettings(
    host: AudioSelectorFileHost,
    utterance: SpeechSynthesisUtterance,
  ): void {
    const settings = host.settingsService?.getSettings();
    const voiceName = host.ttsVoice?.() ?? settings?.ttsVoice;
    const rate = host.ttsRate?.() ?? settings?.ttsRate ?? 1.0;
    const pitch = host.ttsPitch?.() ?? settings?.ttsPitch ?? 1.0;
    const volume = host.ttsVolume?.() ?? settings?.ttsVolume ?? 100;
    const masterVolume = host.masterVolume?.() ?? settings?.masterVolume ?? 100;

    if (
      voiceName &&
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      typeof window.speechSynthesis.getVoices === "function"
    ) {
      try {
        const voices = window.speechSynthesis.getVoices() || [];
        const matched = resolveBestTtsVoice(voices, voiceName);
        if (matched) {
          utterance.voice = matched;
        }
      } catch {
        // Ignored
      }
    }
    if (utterance.voice?.lang) {
      utterance.lang = utterance.voice.lang;
    } else if (!utterance.lang) {
      utterance.lang = "en-US";
    }
    if (rate != null) utterance.rate = Math.max(0.1, Math.min(10, rate));
    if (pitch != null) utterance.pitch = Math.max(0, Math.min(2, pitch));
    const effMaster =
      typeof masterVolume === "number" && !isNaN(masterVolume)
        ? masterVolume
        : 100;
    const effTts = typeof volume === "number" && !isNaN(volume) ? volume : 100;
    const masterVol = Math.max(0, Math.min(1, effMaster / 100));
    const ttsVol = Math.max(0, Math.min(1, effTts / 100));
    const finalVol = masterVol * ttsVol;
    utterance.volume = isNaN(finalVol) ? 1.0 : finalVol;
  }
}
