import { Injectable, OnDestroy } from "@angular/core";
import { DataService } from "@app/data.service";
import {
  ActiveVoiceCallout,
  ANNOUNCEMENT_SLOTS,
  AUDIO_PRIORITY_WEIGHT,
  AudioAssociation,
  AudioPriority,
  AudioRelevanceFilter,
  CalloutQueueItem,
  DriverAudioMode,
  UrgentQueueItem,
} from "@app/models/audio";
import { AudioConfig } from "@app/models/driver";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import {
  calculateTtsSafetyTimeout,
  interpolate,
  releaseUtterance,
  resolveAudioUrl,
  retainUtterance,
  setupTtsWatchdogs,
} from "@app/utils/audio";
import {
  isAudioRelevant,
  isVoiceCalloutSlot,
} from "@app/utils/audio-relevance";
import { AudioVoiceManager } from "@app/utils/audio-voice-manager";

export type {
  ActiveVoiceCallout,
  AudioAssociation,
  AudioPriority,
  AudioRelevanceFilter,
  CalloutQueueItem,
  DriverAudioMode,
  UrgentQueueItem,
};
export { ANNOUNCEMENT_SLOTS, AUDIO_PRIORITY_WEIGHT };

@Injectable({
  providedIn: "root",
})
export class AudioService implements OnDestroy {
  private activeVoice: ActiveVoiceCallout | null = null;
  private urgentQueue: UrgentQueueItem[] = [];
  private calloutQueue: CalloutQueueItem[] = [];
  private isSpacingCoolingDown: boolean = false;
  private spacingTimer: any = null;
  private voiceManager = new AudioVoiceManager();
  private activeAudioElement: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private safetyTimeout: any = null;
  private relevanceFilter: AudioRelevanceFilter | null = null;
  private preloadedAudioMap = new Map<string, HTMLAudioElement>();
  private lastCancelTime: number = 0;
  private activeUtteranceStartedAt: number = 0;

  get cachedVoices(): SpeechSynthesisVoice[] {
    return this.voiceManager.cachedVoices;
  }

  set cachedVoices(voices: SpeechSynthesisVoice[]) {
    this.voiceManager.cachedVoices = voices;
  }

  constructor(
    private dataService: DataService,
    private settingsService: SettingsService,
    private logger: LoggerService,
  ) {}

  /**
   * Determines whether an audio slot or configuration represents a verbal callout
   * versus a sound effect (SFX) based on Option 1 (Convention by Slot & Type).
   */
  isVoiceCallout(slotOrCategory: string, config?: AudioConfig): boolean {
    return isVoiceCalloutSlot(slotOrCategory, config);
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
    return isAudioRelevant(this.relevanceFilter, association);
  }

  ngOnDestroy(): void {
    this.reset();
  }

  /**
   * Preloads an audio file into the browser cache to eliminate playback latency.
   */
  preload(url: string | undefined): HTMLAudioElement | void {
    if (!url) return;
    const playableUrl = resolveAudioUrl(url, this.dataService.serverUrl);
    if (!playableUrl) return;
    if (this.preloadedAudioMap.has(playableUrl)) {
      return this.preloadedAudioMap.get(playableUrl);
    }
    try {
      const audio = new Audio(playableUrl);
      audio.preload = "auto";
      if (typeof audio.load === "function") {
        audio.load();
      }
      this.preloadedAudioMap.set(playableUrl, audio);
      return audio;
    } catch {
      // ignore
    }
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

    let audio: HTMLAudioElement;
    const cached = this.preloadedAudioMap.get(playableUrl);
    if (cached && (cached.paused || cached.ended)) {
      audio = cached;
      try {
        audio.currentTime = 0;
      } catch {
        // ignore
      }
    } else {
      audio = new Audio(playableUrl);
    }

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
    audio.play().catch((err: any) => {
      if (err?.name === "AbortError") {
        this.logger.debug(
          "SFX playback aborted or paused",
          err?.message || err,
        );
      } else {
        this.logger.error("Error playing SFX", err);
      }
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
      this.logger.info(
        `[AUDIO] Dropping callout: not relevant to current UI page (widget: ${association?.widgetType})`,
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

    const desc = this.describeConfig(config, resolvedUrl);

    this.releaseStaleTtsVoiceIfIdle();

    // Channel IDLE
    if (!this.activeVoice && !this.isSpacingCoolingDown) {
      this.logger.info(
        `[AUDIO] Dispatching callout immediately: ${desc} (priority: ${priority})`,
      );
      this.executeVoiceCallout(config, priority, context, resolvedUrl);
      return true;
    }

    // Channel BUSY: urgent callout breaks through cooldown or preempts/queues
    if (priority === "urgent") {
      return this.handleUrgentCalloutWhenBusy(
        config,
        priority,
        desc,
        context,
        resolvedUrl,
        association,
      );
    }

    // High priority callouts break through cadence cooldown if no voice is actively speaking
    if (priority === "high" && !this.activeVoice && this.isSpacingCoolingDown) {
      this.logger.info(
        `[AUDIO] High priority callout breaking through cadence cooldown: ${desc}`,
      );
      this.clearSpacingTimer();
      this.executeVoiceCallout(config, priority, context, resolvedUrl);
      return true;
    }

    // Incoming sound is NOT urgent
    if (this.isSpacingCoolingDown && !this.activeVoice) {
      this.logger.debug("Dropping non-urgent callout during cadence pause");
      this.logger.info(
        `[AUDIO] Dropping callout during cadence pause (500ms spacing cooldown): ${desc} (priority: ${priority})`,
      );
      return false;
    }

    if (this.activeVoice) {
      if (
        AUDIO_PRIORITY_WEIGHT[priority] >
        AUDIO_PRIORITY_WEIGHT[this.activeVoice.priority]
      ) {
        // Preempt active sound
        this.logger.info(
          `[AUDIO] Preempting active '${this.activeVoice.priority}' voice with higher priority '${priority}': ${desc}`,
        );
        this.activeVoice.stop();
        this.activeVoice = null;
        this.executeVoiceCallout(config, priority, context, resolvedUrl);
        return true;
      } else {
        // Drop incoming sound (Play, Preempt, or Drop)
        this.logger.debug(
          "Dropping callout due to equal or higher active priority",
        );
        this.logger.info(
          `[AUDIO] Dropping callout due to equal or higher active priority (active: '${this.activeVoice.priority}', incoming: '${priority}'): ${desc}`,
        );
        return false;
      }
    }

    return false;
  }

  private handleUrgentCalloutWhenBusy(
    config: AudioConfig,
    priority: AudioPriority,
    desc: string,
    context?: any,
    resolvedUrl?: string,
    association?: AudioAssociation,
  ): boolean {
    if (this.isSpacingCoolingDown) {
      this.logger.info(
        `[AUDIO] Urgent callout breaking through cadence cooldown: ${desc}`,
      );
      this.clearSpacingTimer();
      this.executeVoiceCallout(config, priority, context, resolvedUrl);
      return true;
    }

    if (this.activeVoice) {
      if (config.type === "preset" && this.activeUtterance) {
        this.logger.info(
          `[AUDIO] Urgent preset playing concurrently with active TTS voice: ${desc}`,
        );
        this.playPresetVoice(resolvedUrl || config.url!, priority);
        return true;
      }

      if (this.activeVoice.priority !== "urgent") {
        // Preempt lower-priority sound immediately
        this.logger.info(
          `[AUDIO] Urgent callout preempting active '${this.activeVoice.priority}' voice: ${desc}`,
        );
        this.activeVoice.stop();
        this.activeVoice = null;
        this.executeVoiceCallout(config, priority, context, resolvedUrl);
      } else {
        // Another urgent sound is actively playing, queue this urgent sound
        this.logger.info(
          `[AUDIO] Queueing urgent callout behind active urgent voice: ${desc}`,
        );
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

  private describeConfig(config: AudioConfig, resolvedUrl?: string): string {
    return config.type === "tts"
      ? `TTS "${config.text}"`
      : `preset "${resolvedUrl || config.url}"`;
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

    const desc = this.describeConfig(config, resolvedUrl);

    this.releaseStaleTtsVoiceIfIdle();

    // Channel IDLE
    if (!this.activeVoice && !this.isSpacingCoolingDown) {
      this.logger.info(
        `[AUDIO] Dispatching queued callout immediately (channel idle): ${desc} (priority: ${priority})`,
      );
      this.executeVoiceCallout(config, priority, context, resolvedUrl);
      return true;
    }

    // Channel BUSY: urgent callout breaks through cooldown or preempts/queues
    if (priority === "urgent") {
      return this.handleUrgentCalloutWhenBusy(
        config,
        priority,
        desc,
        context,
        resolvedUrl,
        association,
      );
    }

    // Preempt active lower-priority voice if incoming priority is higher
    if (
      this.activeVoice &&
      AUDIO_PRIORITY_WEIGHT[priority] >
        AUDIO_PRIORITY_WEIGHT[this.activeVoice.priority]
    ) {
      this.logger.info(
        `[AUDIO] Preempting active '${this.activeVoice.priority}' voice with higher priority '${priority}': ${desc}`,
      );
      this.activeVoice.stop();
      this.activeVoice = null;
      this.executeVoiceCallout(config, priority, context, resolvedUrl);
      return true;
    }

    // Channel BUSY or cooling down: deduplicate/replace older queued callout for same lane or driver
    this.enqueueOrUpdateCallout(
      config,
      priority,
      desc,
      context,
      resolvedUrl,
      association,
    );
    return true;
  }

  private enqueueOrUpdateCallout(
    config: AudioConfig,
    priority: AudioPriority,
    desc: string,
    context?: any,
    resolvedUrl?: string,
    association?: AudioAssociation,
  ): void {
    const existingIndex = this.calloutQueue.findIndex((item) => {
      if (
        association?.laneIndex !== undefined &&
        item.association?.laneIndex !== undefined
      ) {
        return item.association.laneIndex === association.laneIndex;
      }
      if (association?.driverId && item.association?.driverId) {
        return item.association.driverId === association.driverId;
      }
      return false;
    });

    if (existingIndex !== -1) {
      this.logger.info(
        `[AUDIO] Replacing older queued callout for lane/driver with newer callout: ${desc}`,
      );
      this.calloutQueue[existingIndex] = {
        config,
        priority,
        context,
        resolvedUrl,
        enqueuedAt: Date.now(),
        association,
      };
    } else {
      this.logger.info(
        `[AUDIO] Enqueueing callout into calloutQueue: ${desc} (priority: ${priority}, queueSize: ${this.calloutQueue.length + 1})`,
      );
      this.calloutQueue.push({
        config,
        priority,
        context,
        resolvedUrl,
        enqueuedAt: Date.now(),
        association,
      });
    }

    // Maintain priority order: highest priority first, preserving arrival order for equal priorities
    this.calloutQueue.sort((a, b) => {
      const pDiff =
        AUDIO_PRIORITY_WEIGHT[b.priority] - AUDIO_PRIORITY_WEIGHT[a.priority];
      if (pDiff !== 0) return pDiff;
      return a.enqueuedAt - b.enqueuedAt;
    });
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
      releaseUtterance(this.activeUtterance);
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
    this.cancelSpeechSynthesis();
    this.clearSpacingTimer();
    this.calloutQueue = [];
  }

  private cancelSpeechSynthesis(): void {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        this.lastCancelTime = Date.now();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    }
  }

  private speakUtterance(utterance: SpeechSynthesisUtterance): void {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.logger.error("Error executing window.speechSynthesis.speak", err);
    }
  }

  /** Resets the entire voice callout system and purges pending urgent calls. */
  reset(): void {
    this.stopVoice();
    this.urgentQueue = [];
    this.calloutQueue = [];
    this.preloadedAudioMap.clear();
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

  private getOrCreatePresetAudio(playableUrl: string): HTMLAudioElement {
    const cached = this.preloadedAudioMap.get(playableUrl);
    if (
      cached &&
      cached !== this.activeAudioElement &&
      (cached.paused || cached.ended)
    ) {
      try {
        cached.currentTime = 0;
      } catch {
        // ignore
      }
      return cached;
    }
    const audio = new Audio(playableUrl);
    this.preloadedAudioMap.set(playableUrl, audio);
    return audio;
  }

  private setupAudioWatchdog(
    audio: HTMLAudioElement,
    isEnded: () => boolean,
    onTimeout: () => void,
  ): void {
    const startWatchdog = (timeoutMs: number) => {
      if (this.safetyTimeout) {
        clearTimeout(this.safetyTimeout);
      }
      this.safetyTimeout = setTimeout(onTimeout, timeoutMs);
    };

    startWatchdog(10000);

    audio.onloadedmetadata = () => {
      if (
        !isEnded() &&
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
  }

  private playPresetVoice(url: string, priority: AudioPriority): void {
    const playableUrl = resolveAudioUrl(url, this.dataService.serverUrl);
    this.logger.info(
      `[AUDIO] Playing preset voice: ${playableUrl} (priority: ${priority})`,
    );
    const audio = this.getOrCreatePresetAudio(playableUrl);
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

    this.setupAudioWatchdog(
      audio,
      () => ended,
      () => {
        cleanup();
        if (this.activeVoice?.stop === stop) {
          this.onVoiceCalloutEnded();
        }
      },
    );

    audio.onended = () => {
      cleanup();
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    };

    audio.onerror = (err) => {
      const wasEnded = ended;
      cleanup();
      if (wasEnded) {
        this.logger.debug("Voice preset playback interrupted", err);
      } else {
        this.logger.error("Error playing voice preset", err);
      }
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    };

    audio.play().catch((err: any) => {
      const wasEnded = ended;
      cleanup();
      if (wasEnded || err?.name === "AbortError") {
        this.logger.debug(
          "Voice preset playback aborted or paused",
          err?.message || err,
        );
      } else {
        this.logger.error("Voice preset playback failed", err);
      }
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    });
  }

  private prepareTtsUtterance(
    interpolatedText: string,
    isRetry = false,
  ): SpeechSynthesisUtterance {
    if (this.activeUtterance) {
      releaseUtterance(this.activeUtterance);
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }

    if (
      !isRetry &&
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      (window.speechSynthesis.speaking || window.speechSynthesis.pending)
    ) {
      this.cancelSpeechSynthesis();
    }

    const utterance = new SpeechSynthesisUtterance(interpolatedText);
    retainUtterance(utterance);
    this.activeUtterance = utterance;
    this.applyTtsSettingsToUtterance(utterance);
    return utterance;
  }

  private setupTtsWatchdogs(
    utterance: SpeechSynthesisUtterance,
    isEnded: () => boolean,
    onComplete?: () => void,
  ): { clear: () => void } {
    return setupTtsWatchdogs(utterance, isEnded, onComplete);
  }

  private releaseStaleTtsVoiceIfIdle(): void {
    if (
      this.activeVoice &&
      this.activeUtterance &&
      this.activeUtteranceStartedAt > 0 &&
      Date.now() - this.activeUtteranceStartedAt >= 250 &&
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      window.speechSynthesis.speaking === false &&
      window.speechSynthesis.pending === false &&
      !window.speechSynthesis.paused
    ) {
      this.logger.info(
        "[AUDIO] Releasing stale TTS activeVoice (speechSynthesis is idle).",
      );
      this.activeVoice.stop();
      this.activeVoice = null;
    }
  }

  private playTtsVoice(
    text: string,
    priority: AudioPriority,
    context?: any,
    isRetry = false,
  ): void {
    let interpolatedText = text;
    if (context) {
      interpolatedText = interpolate(text, context);
    }

    if (!interpolatedText || !interpolatedText.trim()) {
      this.onVoiceCalloutEnded();
      return;
    }

    if (!window.speechSynthesis) {
      this.logger.warn("Text-to-speech not supported in this browser.");
      this.onVoiceCalloutEnded();
      return;
    }

    const utterance = this.prepareTtsUtterance(interpolatedText, isRetry);
    this.activeUtteranceStartedAt = Date.now();
    let ended = false;
    const watchdogs = this.setupTtsWatchdogs(
      utterance,
      () => ended,
      () => {
        cleanup();
        if (this.activeVoice?.stop === stop) {
          this.onVoiceCalloutEnded();
        }
      },
    );

    const cleanup = () => {
      if (ended) return;
      ended = true;
      watchdogs.clear();
      releaseUtterance(utterance);
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
      if (this.safetyTimeout) {
        clearTimeout(this.safetyTimeout);
        this.safetyTimeout = null;
      }
      if (this.activeUtterance === utterance) {
        this.activeUtterance = null;
        this.activeUtteranceStartedAt = 0;
      }
    };

    const stop = () => {
      cleanup();
      this.cancelSpeechSynthesis();
    };

    this.activeVoice = { priority, stop };

    const dynamicTimeout = calculateTtsSafetyTimeout(interpolatedText);

    this.safetyTimeout = setTimeout(() => {
      cleanup();
      this.cancelSpeechSynthesis();
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

    utterance.onerror = (err: any) => {
      const errType = err?.error;
      const isInterrupted = errType === "interrupted" || errType === "canceled";
      if (isInterrupted && this.activeVoice?.stop === stop && !isRetry) {
        cleanup();
        setTimeout(() => {
          if (this.activeVoice?.stop === stop) {
            this.playTtsVoice(text, priority, context, true);
          }
        }, 60);
        return;
      }
      cleanup();
      if (!isInterrupted) {
        this.logger.error("TTS playback error", err);
      }
      if (this.activeVoice?.stop === stop) {
        this.onVoiceCalloutEnded();
      }
    };

    this.logger.info(
      `[AUDIO] Speaking TTS: "${interpolatedText}" (priority: ${priority})`,
    );
    this.speakUtterance(utterance);
  }

  previewTTS(
    text: string,
    voiceName?: string,
    rate?: number,
    pitch?: number,
    volume?: number,
    masterVolume?: number,
  ): void {
    if (
      !text ||
      !text.trim() ||
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }
    if (this.activeUtterance) {
      releaseUtterance(this.activeUtterance);
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
    this.cancelSpeechSynthesis();

    const utterance = new SpeechSynthesisUtterance(text);
    retainUtterance(utterance);
    this.activeUtterance = utterance;
    let ended = false;
    const watchdogs = this.setupTtsWatchdogs(utterance, () => ended);
    const cleanup = () => {
      if (ended) return;
      ended = true;
      watchdogs.clear();
      releaseUtterance(utterance);
      utterance.onstart = null;
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
    utterance.onend = () => cleanup();
    utterance.onerror = () => cleanup();

    this.applyTtsSettingsToUtterance(
      utterance,
      voiceName,
      rate,
      pitch,
      volume,
      masterVolume,
    );

    const dynamicTimeout = calculateTtsSafetyTimeout(text);
    this.safetyTimeout = setTimeout(() => {
      cleanup();
      this.cancelSpeechSynthesis();
    }, dynamicTimeout);

    this.logger.info(`[AUDIO] Previewing TTS: "${text}"`);
    this.speakUtterance(utterance);
  }

  getMasterVolume(masterVolumeOverride?: number): number {
    if (masterVolumeOverride !== undefined) {
      return masterVolumeOverride;
    }
    return this.settingsService.getSettings().masterVolume ?? 100;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voiceManager.getVoices();
  }

  applyTtsSettingsToUtterance(
    utterance: SpeechSynthesisUtterance,
    voiceNameOverride?: string,
    rateOverride?: number,
    pitchOverride?: number,
    volumeOverride?: number,
    masterVolumeOverride?: number,
  ): void {
    this.voiceManager.applyTtsSettingsToUtterance(
      utterance,
      this.settingsService.getSettings(),
      voiceNameOverride,
      rateOverride,
      pitchOverride,
      volumeOverride,
      masterVolumeOverride,
    );
  }

  private onVoiceCalloutEnded(): void {
    this.logger.info("[AUDIO] Voice callout ended. Active voice cleared.");
    this.activeVoice = null;
    this.processQueueOrCooldown();
  }

  private processQueueOrCooldown(): void {
    const settings = this.settingsService.getSettings();
    const ttl = settings.urgentQueueTtl ?? 5000;
    const now = Date.now();

    // 1. Prune expired urgent items
    this.urgentQueue = this.urgentQueue.filter((item) => {
      // Drift lap callouts are rare, critical events and are protected from premature expiry
      if (
        item.association?.eventType === "drift_lap" ||
        item.config === (item.context?.driver?.driver as any)?.driftLapAudio ||
        item.config === (item.context?.driver as any)?.driftLapAudio
      ) {
        return now - item.enqueuedAt <= 60000;
      }
      return now - item.enqueuedAt <= ttl;
    });

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
