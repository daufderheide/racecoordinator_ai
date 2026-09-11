import { Injectable } from "@angular/core";
import { DataService } from "@app/data.service";
import { AudioConfig } from "@app/models/driver";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import { interpolate, resolveAudioUrl } from "@app/utils/audio";

export type AudioPriority = "low" | "normal" | "high" | "urgent";

export const AUDIO_PRIORITY_WEIGHT: Record<AudioPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
};

export interface UrgentQueueItem {
  config: AudioConfig;
  priority: AudioPriority;
  context?: any;
  resolvedUrl?: string;
  enqueuedAt: number;
}

export interface ActiveVoiceCallout {
  priority: AudioPriority;
  stop: () => void;
}

@Injectable({
  providedIn: "root",
})
export class AudioService {
  private activeVoice: ActiveVoiceCallout | null = null;
  private urgentQueue: UrgentQueueItem[] = [];
  private isSpacingCoolingDown: boolean = false;
  private spacingTimer: any = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor(
    private dataService: DataService,
    private settingsService: SettingsService,
    private logger: LoggerService,
  ) {
    this.initVoices();
  }

  /**
   * Determines whether an audio slot or configuration represents a verbal callout
   * versus a sound effect (SFX) based on Option 1 (Convention by Slot & Type).
   */
  isVoiceCallout(slotOrCategory: string, config?: AudioConfig): boolean {
    if (!config || config.type === "none") return false;
    if (config.type === "tts") return true;

    const announcementSlots = [
      "audio.yellowflag",
      "audio.seconds_left",
      "audio.seconds_left.halfway",
      "audio.heat_over",
      "audio.race_over",
      "penalty",
      "falseStart",
      "false_start",
    ];

    return announcementSlots.some((s) => slotOrCategory.includes(s));
  }

  /**
   * Plays a non-verbal sound effect (SFX) polyphonically.
   * SFX sounds play immediately without blocking or preempting other sounds.
   */
  playSfx(url: string | undefined): HTMLAudioElement | void {
    if (!url) return;
    const playableUrl = resolveAudioUrl(url, this.dataService.serverUrl);
    this.logger.debug("Playing SFX from URL:", playableUrl);
    const audio = new Audio(playableUrl);
    const settings = this.settingsService.getSettings();
    audio.volume = Math.max(
      0,
      Math.min(1, (settings.masterVolume ?? 100) / 100),
    );
    audio.play().catch((err) => {
      this.logger.error("Error playing SFX", err);
    });
    return audio;
  }

  /**
   * Dispatches a verbal callout using the "Play, Preempt, or Drop" engine with Urgent queueing.
   */
  playCallout(
    config: AudioConfig | undefined,
    priority: AudioPriority,
    context?: any,
    resolvedUrl?: string,
  ): void {
    if (!config || config.type === "none") return;

    // Channel IDLE
    if (!this.activeVoice && !this.isSpacingCoolingDown) {
      this.executeVoiceCallout(config, priority, context, resolvedUrl);
      return;
    }

    // Channel BUSY
    if (priority === "urgent") {
      if (this.isSpacingCoolingDown) {
        this.clearSpacingTimer();
        this.executeVoiceCallout(config, priority, context, resolvedUrl);
        return;
      }

      if (this.activeVoice) {
        if (this.activeVoice.priority !== "urgent") {
          // Preempt lower-priority sound immediately
          this.activeVoice.stop();
          this.activeVoice = null;
          this.executeVoiceCallout(config, priority, context, resolvedUrl);
        } else {
          // Another urgent sound is actively playing, queue this urgent sound
          this.urgentQueue.push({
            config,
            priority,
            context,
            resolvedUrl,
            enqueuedAt: Date.now(),
          });
        }
      }
      return;
    }

    // Incoming sound is NOT urgent
    if (this.isSpacingCoolingDown) {
      this.logger.debug("Dropping non-urgent callout during cadence pause");
      return;
    }

    if (this.activeVoice) {
      if (
        AUDIO_PRIORITY_WEIGHT[priority] >
        AUDIO_PRIORITY_WEIGHT[this.activeVoice.priority]
      ) {
        // Preempt active sound
        this.activeVoice.stop();
        this.activeVoice = null;
        this.executeVoiceCallout(config, priority, context, resolvedUrl);
      } else {
        // Drop incoming sound (Play, Preempt, or Drop)
        this.logger.debug(
          "Dropping callout due to equal or higher active priority",
        );
      }
    }
  }

  getActiveVoice(): ActiveVoiceCallout | null {
    return this.activeVoice;
  }

  getUrgentQueue(): UrgentQueueItem[] {
    return [...this.urgentQueue];
  }

  isCoolingDown(): boolean {
    return this.isSpacingCoolingDown;
  }

  /** Stops any currently playing verbal callout and clears cooldown. */
  stopVoice(): void {
    if (this.activeVoice) {
      this.activeVoice.stop();
      this.activeVoice = null;
    }
    this.clearSpacingTimer();
  }

  /** Resets the entire voice callout system and purges pending urgent calls. */
  reset(): void {
    this.stopVoice();
    this.urgentQueue = [];
  }

  private executeVoiceCallout(
    config: AudioConfig,
    priority: AudioPriority,
    context?: any,
    resolvedUrl?: string,
  ): void {
    if (config.type === "preset" && (resolvedUrl || config.url)) {
      this.playPresetVoice(resolvedUrl || config.url!, priority);
    } else if (config.type === "tts" && config.text) {
      this.playTtsVoice(config.text, priority, context);
    } else {
      this.onVoiceCalloutEnded();
    }
  }

  private playPresetVoice(url: string, priority: AudioPriority): void {
    const playableUrl = resolveAudioUrl(url, this.dataService.serverUrl);
    const audio = new Audio(playableUrl);
    const settings = this.settingsService.getSettings();
    audio.volume = Math.max(
      0,
      Math.min(1, (settings.masterVolume ?? 100) / 100),
    );
    let ended = false;

    const cleanup = () => {
      if (ended) return;
      ended = true;
      audio.onended = null;
      audio.onerror = null;
      clearTimeout(safetyTimeout);
    };

    const stop = () => {
      cleanup();
      audio.pause();
      audio.currentTime = 0;
    };

    this.activeVoice = { priority, stop };

    // Safety watchdog timeout (15s) in case audio element stalls
    const safetyTimeout = setTimeout(() => {
      cleanup();
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    }, 15000);

    audio.onended = () => {
      cleanup();
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    };

    audio.onerror = (err) => {
      cleanup();
      this.logger.error("Error playing voice preset", err);
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    };

    audio.play().catch((err) => {
      cleanup();
      this.logger.error("Voice preset playback failed", err);
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    });
  }

  private playTtsVoice(
    text: string,
    priority: AudioPriority,
    context?: any,
  ): void {
    let interpolatedText = text;
    if (context) {
      interpolatedText = interpolate(text, context);
    }

    if (!interpolatedText) {
      this.onVoiceCalloutEnded();
      return;
    }

    if (!window.speechSynthesis) {
      this.logger.warn("Text-to-speech not supported in this browser.");
      this.onVoiceCalloutEnded();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(interpolatedText);
    this.applyTtsSettingsToUtterance(utterance);
    let ended = false;

    const cleanup = () => {
      if (ended) return;
      ended = true;
      utterance.onend = null;
      utterance.onerror = null;
      clearTimeout(safetyTimeout);
    };

    const stop = () => {
      cleanup();
      window.speechSynthesis.cancel();
    };

    this.activeVoice = { priority, stop };

    // Safety watchdog timeout (15s)
    const safetyTimeout = setTimeout(() => {
      cleanup();
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    }, 15000);

    utterance.onend = () => {
      cleanup();
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    };

    utterance.onerror = (err) => {
      cleanup();
      this.logger.error("TTS playback error", err);
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  }

  previewTTS(
    text: string,
    voiceName?: string,
    rate?: number,
    pitch?: number,
    volume?: number,
    masterVolume?: number,
  ): void {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    this.applyTtsSettingsToUtterance(
      utterance,
      voiceName,
      rate,
      pitch,
      volume,
      masterVolume,
    );
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  }

  getMasterVolume(masterVolumeOverride?: number): number {
    if (masterVolumeOverride !== undefined) {
      return masterVolumeOverride;
    }
    return this.settingsService.getSettings().masterVolume ?? 100;
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      typeof window.speechSynthesis.getVoices === "function"
    ) {
      try {
        const list = window.speechSynthesis.getVoices() || [];
        if (list.length > 0) {
          this.cachedVoices = list;
          return list;
        }
      } catch {
        // Fallback to cached voices
      }
    }
    return this.cachedVoices || [];
  }

  private initVoices(): void {
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      typeof window.speechSynthesis.getVoices === "function"
    ) {
      const updateVoices = () => {
        try {
          const list = window.speechSynthesis.getVoices() || [];
          if (list.length > 0) {
            this.cachedVoices = list;
          }
        } catch {
          // Ignored
        }
      };
      updateVoices();
      if (typeof window.speechSynthesis.addEventListener === "function") {
        window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
      } else if ("onvoiceschanged" in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  applyTtsSettingsToUtterance(
    utterance: SpeechSynthesisUtterance,
    voiceNameOverride?: string,
    rateOverride?: number,
    pitchOverride?: number,
    volumeOverride?: number,
    masterVolumeOverride?: number,
  ): void {
    const settings = this.settingsService.getSettings();
    const voiceName =
      voiceNameOverride !== undefined ? voiceNameOverride : settings.ttsVoice;
    const rate =
      rateOverride !== undefined ? rateOverride : (settings.ttsRate ?? 1.0);
    const pitch =
      pitchOverride !== undefined ? pitchOverride : (settings.ttsPitch ?? 1.0);
    const volume =
      volumeOverride !== undefined
        ? volumeOverride
        : (settings.ttsVolume ?? 100);
    const masterVolume =
      masterVolumeOverride !== undefined
        ? masterVolumeOverride
        : (settings.masterVolume ?? 100);

    if (
      voiceName &&
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      typeof window.speechSynthesis.getVoices === "function"
    ) {
      const voices = this.getVoices();
      const trimmed = voiceName.trim().toLowerCase();
      const matched = voices.find(
        (v) =>
          v.name === voiceName ||
          v.voiceURI === voiceName ||
          (v.name && v.name.trim().toLowerCase() === trimmed) ||
          (v.voiceURI && v.voiceURI.trim().toLowerCase() === trimmed),
      );
      if (matched) {
        try {
          utterance.voice = matched;
        } catch {
          // Native browser enforces SpeechSynthesisVoice instance; safely ignored if mock
        }
      }
    }
    if (rate != null) {
      utterance.rate = Math.max(0.1, Math.min(10, rate));
    }
    if (pitch != null) {
      utterance.pitch = Math.max(0, Math.min(2, pitch));
    }
    const masterVol = Math.max(0, Math.min(1, (masterVolume ?? 100) / 100));
    const ttsVol = Math.max(0, Math.min(1, (volume ?? 100) / 100));
    utterance.volume = masterVol * ttsVol;
  }

  private onVoiceCalloutEnded(): void {
    this.activeVoice = null;
    this.processUrgentQueueOrCooldown();
  }

  private processUrgentQueueOrCooldown(): void {
    const settings = this.settingsService.getSettings();
    const ttl = settings.urgentQueueTtl ?? 5000;
    const now = Date.now();

    // Prune expired urgent items
    this.urgentQueue = this.urgentQueue.filter(
      (item) => now - item.enqueuedAt <= ttl,
    );

    if (this.urgentQueue.length > 0) {
      const nextUrgent = this.urgentQueue.shift()!;
      this.executeVoiceCallout(
        nextUrgent.config,
        nextUrgent.priority,
        nextUrgent.context,
        nextUrgent.resolvedUrl,
      );
      return;
    }

    const spacing = settings.calloutSpacing ?? 500;
    if (spacing > 0) {
      this.clearSpacingTimer();
      this.isSpacingCoolingDown = true;
      this.spacingTimer = setTimeout(() => {
        this.isSpacingCoolingDown = false;
        this.spacingTimer = null;
      }, spacing);
    } else {
      this.isSpacingCoolingDown = false;
    }
  }

  private clearSpacingTimer(): void {
    if (this.spacingTimer) {
      clearTimeout(this.spacingTimer);
      this.spacingTimer = null;
    }
    this.isSpacingCoolingDown = false;
  }
}
