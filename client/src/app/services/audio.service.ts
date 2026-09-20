import { Injectable, OnDestroy } from "@angular/core";
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

export interface AudioAssociation {
  widgetType?: "lane-view" | "timer" | "flag" | "countdown" | string;
  laneIndex?: number;
  driverId?: string;
}

export type DriverAudioMode = "all" | "none" | "scoped";

export interface AudioRelevanceFilter {
  /** Driver audio mode: 'all' (all lanes), 'none' (no driver audio), 'scoped' (specific lanes/drivers) */
  driverAudioMode: DriverAudioMode;
  /** When driverAudioMode is 'scoped', set of allowed 0-indexed lane numbers */
  allowedLanes?: Set<number>;
  /** When driverAudioMode is 'scoped', set of allowed driver entity IDs / object IDs */
  allowedDriverIds?: Set<string>;

  /** Whether countdown audio is allowed */
  allowCountdown?: boolean;
  /** Whether timer audio (seconds left, halfway) is allowed */
  allowTimer?: boolean;
  /** Whether race state audio (yellow flag, heat over, race over) is allowed */
  allowRaceState?: boolean;
}

export interface UrgentQueueItem {
  config: AudioConfig;
  priority: AudioPriority;
  context?: any;
  resolvedUrl?: string;
  enqueuedAt: number;
  association?: AudioAssociation;
}

export interface CalloutQueueItem {
  config: AudioConfig;
  priority: AudioPriority;
  context?: any;
  resolvedUrl?: string;
  enqueuedAt: number;
  association?: AudioAssociation;
}

export interface ActiveVoiceCallout {
  priority: AudioPriority;
  stop: () => void;
}

@Injectable({
  providedIn: "root",
})
export class AudioService implements OnDestroy {
  private activeVoice: ActiveVoiceCallout | null = null;
  private urgentQueue: UrgentQueueItem[] = [];
  private calloutQueue: CalloutQueueItem[] = [];
  private isSpacingCoolingDown: boolean = false;
  private spacingTimer: any = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private activeAudioElement: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private safetyTimeout: any = null;
  private relevanceFilter: AudioRelevanceFilter | null = null;

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
      "audio.min_lap_time",
      "audio.drift_lap",
      "penalty",
      "falseStart",
      "false_start",
      "overallBestLap",
      "overall_best_lap",
      "overallRecordLap",
      "overall_record_lap",
      "overallLaneBestLap",
      "overall_lane_best_lap",
      "overallLaneRecordLap",
      "overall_lane_record_lap",
      "raceBestLap",
      "race_best_lap",
      "raceLaneBestLap",
      "race_lane_best_lap",
      "heatBestLap",
      "heat_best_lap",
      "newRaceLeader",
      "new_race_leader",
      "newHeatLeader",
      "new_heat_leader",
      "pitIn",
      "pit_in",
      "fuel",
      "fuel_level",
      "fuelLevel",
    ];

    return announcementSlots.some((s) => slotOrCategory.includes(s));
  }

  setRelevanceFilter(filter: AudioRelevanceFilter | null): void {
    this.relevanceFilter = filter;
  }

  getRelevanceFilter(): AudioRelevanceFilter | null {
    return this.relevanceFilter;
  }

  resetRelevanceFilter(): void {
    this.relevanceFilter = null;
  }

  isSoundRelevant(association?: AudioAssociation): boolean {
    if (!this.relevanceFilter) {
      return true;
    }

    // 1. Countdown audio
    if (association?.widgetType === "countdown") {
      return !!this.relevanceFilter.allowCountdown;
    }

    // 2. Timer audio (seconds left, halfway)
    if (association?.widgetType === "timer") {
      return !!this.relevanceFilter.allowTimer;
    }

    // 3. Race state audio (flag, yellow flag, heat over, race over)
    if (
      association?.widgetType === "flag" ||
      association?.widgetType === "race-state"
    ) {
      return !!this.relevanceFilter.allowRaceState;
    }

    // 4. Driver / Lane audio (lane-view / driver station)
    if (
      association?.widgetType === "lane-view" ||
      association?.widgetType === "driver" ||
      association?.laneIndex != null ||
      association?.driverId != null
    ) {
      if (this.relevanceFilter.driverAudioMode === "all") {
        return true;
      }
      if (this.relevanceFilter.driverAudioMode === "scoped") {
        if (
          association.laneIndex != null &&
          this.relevanceFilter.allowedLanes?.has(association.laneIndex)
        ) {
          return true;
        }
        if (
          association.driverId &&
          this.relevanceFilter.allowedDriverIds?.has(association.driverId)
        ) {
          return true;
        }
        return false;
      }
      return false;
    }

    // Unassociated fallback
    return true;
  }

  ngOnDestroy(): void {
    this.reset();
  }

  /**
   * Plays a non-verbal sound effect (SFX) polyphonically.
   * SFX sounds play immediately without blocking or preempting other sounds.
   */
  playSfx(
    url: string | undefined,
    association?: AudioAssociation,
  ): HTMLAudioElement | void {
    if (!url) return;
    if (!this.isSoundRelevant(association)) {
      this.logger.debug(
        "Dropping SFX: not relevant to current UI page",
        association,
      );
      return;
    }
    const playableUrl = resolveAudioUrl(url, this.dataService.serverUrl);
    this.logger.debug("Playing SFX from URL:", playableUrl);
    const audio = new Audio(playableUrl);
    const settings = this.settingsService.getSettings();
    let finalVolume = Math.max(
      0,
      Math.min(1, (settings.masterVolume ?? 100) / 100),
    );
    // Duck SFX volume to 20% if a voice callout is actively playing
    if (this.activeVoice) {
      finalVolume *= 0.2;
    }

    audio.volume = finalVolume;
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
    association?: AudioAssociation,
  ): boolean {
    if (!this.isSoundRelevant(association)) {
      this.logger.debug(
        "Dropping callout: not relevant to current UI page",
        association,
      );
      return false;
    }

    if (!config || config.type === "none") return false;

    if (config.type === "preset" && !(resolvedUrl || config.url?.trim())) {
      return false;
    }
    if (config.type === "tts" && !config.text?.trim()) {
      return false;
    }

    // Channel IDLE
    if (!this.activeVoice && !this.isSpacingCoolingDown) {
      this.executeVoiceCallout(config, priority, context, resolvedUrl);
      return true;
    }

    // Channel BUSY
    if (priority === "urgent") {
      if (this.isSpacingCoolingDown) {
        this.clearSpacingTimer();
        this.executeVoiceCallout(config, priority, context, resolvedUrl);
        return true;
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
            association,
          });
        }
        return true;
      }
      return false;
    }

    // Incoming sound is NOT urgent
    if (this.isSpacingCoolingDown) {
      this.logger.debug("Dropping non-urgent callout during cadence pause");
      return false;
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
        return true;
      } else {
        // Drop incoming sound (Play, Preempt, or Drop)
        this.logger.debug(
          "Dropping callout due to equal or higher active priority",
        );
        return false;
      }
    }

    return false;
  }

  getActiveVoice(): ActiveVoiceCallout | null {
    return this.activeVoice;
  }

  getUrgentQueue(): UrgentQueueItem[] {
    return [...this.urgentQueue];
  }

  getCalloutQueue(): CalloutQueueItem[] {
    return [...this.calloutQueue];
  }

  isCoolingDown(): boolean {
    return this.isSpacingCoolingDown;
  }

  /**
   * Enqueues a callout to be played sequentially. If the channel is idle and not cooling down,
   * it plays immediately. If busy or cooling down, it is queued to play as soon as the active voice
   * and cadence spacing cooldown finish.
   */
  queueCallout(
    config: AudioConfig | undefined,
    priority: AudioPriority,
    context?: any,
    resolvedUrl?: string,
    association?: AudioAssociation,
  ): boolean {
    if (!this.isSoundRelevant(association)) {
      this.logger.debug(
        "Dropping callout: not relevant to current UI page",
        association,
      );
      return false;
    }

    if (!config || config.type === "none") return false;

    if (config.type === "preset" && !(resolvedUrl || config.url?.trim())) {
      return false;
    }
    if (config.type === "tts" && !config.text?.trim()) {
      return false;
    }

    // Channel IDLE
    if (!this.activeVoice && !this.isSpacingCoolingDown) {
      this.executeVoiceCallout(config, priority, context, resolvedUrl);
      return true;
    }

    // Channel BUSY or cooling down: enqueue into calloutQueue
    this.calloutQueue.push({
      config,
      priority,
      context,
      resolvedUrl,
      enqueuedAt: Date.now(),
      association,
    });
    return true;
  }

  /** Stops any currently playing verbal callout and clears cooldown. */
  stopVoice(): void {
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    if (this.activeVoice) {
      this.activeVoice.stop();
      this.activeVoice = null;
    }
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
        this.activeAudioElement.onended = null;
        this.activeAudioElement.onerror = null;
      } catch {
        // ignore
      }
      this.activeAudioElement = null;
    }
    if (this.activeUtterance) {
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.clearSpacingTimer();
    this.calloutQueue = [];
  }

  /** Resets the entire voice callout system and purges pending urgent calls. */
  reset(): void {
    this.stopVoice();
    this.urgentQueue = [];
    this.calloutQueue = [];
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
    this.activeAudioElement = audio;
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
      audio.onloadedmetadata = null;
      if (this.safetyTimeout) {
        clearTimeout(this.safetyTimeout);
        this.safetyTimeout = null;
      }
      if (this.activeAudioElement === audio) {
        this.activeAudioElement = null;
      }
    };

    const stop = () => {
      cleanup();
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }
    };

    this.activeVoice = { priority, stop };

    const startWatchdog = (timeoutMs: number) => {
      if (this.safetyTimeout) {
        clearTimeout(this.safetyTimeout);
      }
      this.safetyTimeout = setTimeout(() => {
        cleanup();
        if (this.activeVoice?.stop === stop) {
          this.onVoiceCalloutEnded();
        }
      }, timeoutMs);
    };

    // Initial fallback watchdog (10s) if metadata has not loaded yet
    startWatchdog(10000);

    audio.onloadedmetadata = () => {
      if (
        !ended &&
        audio.duration &&
        !isNaN(audio.duration) &&
        isFinite(audio.duration)
      ) {
        const dynamicTimeout = Math.max(
          3000,
          Math.min(10000, Math.ceil(audio.duration * 1000) + 1500),
        );
        startWatchdog(dynamicTimeout);
      }
    };

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
    this.activeUtterance = utterance;
    this.applyTtsSettingsToUtterance(utterance);
    let ended = false;

    const cleanup = () => {
      if (ended) return;
      ended = true;
      utterance.onend = null;
      utterance.onerror = null;
      if (this.safetyTimeout) {
        clearTimeout(this.safetyTimeout);
        this.safetyTimeout = null;
      }
      if (this.activeUtterance === utterance) {
        this.activeUtterance = null;
      }
    };

    const stop = () => {
      cleanup();
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };

    this.activeVoice = { priority, stop };

    const wordCount = interpolatedText.trim().split(/\s+/).length;
    const dynamicTimeout = Math.max(
      3000,
      Math.min(10000, wordCount * 500 + 2000),
    );

    this.safetyTimeout = setTimeout(() => {
      cleanup();
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    }, dynamicTimeout);

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
    this.processQueueOrCooldown();
  }

  private processQueueOrCooldown(): void {
    const settings = this.settingsService.getSettings();
    const ttl = settings.urgentQueueTtl ?? 5000;
    const now = Date.now();

    // 1. Prune expired urgent items
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

    // 2. Prune expired or non-relevant items in calloutQueue
    const queueTtl = Math.max(ttl, 10000);
    this.calloutQueue = this.calloutQueue.filter(
      (item) =>
        now - item.enqueuedAt <= queueTtl &&
        this.isSoundRelevant(item.association),
    );

    // 3. Cadence spacing pause
    const spacing = settings.calloutSpacing ?? 500;
    if (spacing > 0) {
      this.clearSpacingTimer();
      this.isSpacingCoolingDown = true;
      this.spacingTimer = setTimeout(() => {
        this.isSpacingCoolingDown = false;
        this.spacingTimer = null;
        this.processNextQueuedCallout();
      }, spacing);
    } else {
      this.isSpacingCoolingDown = false;
      this.processNextQueuedCallout();
    }
  }

  private processNextQueuedCallout(): void {
    if (this.activeVoice || this.isSpacingCoolingDown) {
      return;
    }
    const settings = this.settingsService.getSettings();
    const ttl = Math.max(settings.urgentQueueTtl ?? 5000, 10000);
    const now = Date.now();

    while (this.calloutQueue.length > 0) {
      const next = this.calloutQueue.shift()!;
      if (
        now - next.enqueuedAt <= ttl &&
        this.isSoundRelevant(next.association)
      ) {
        this.executeVoiceCallout(
          next.config,
          next.priority,
          next.context,
          next.resolvedUrl,
        );
        return;
      }
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
