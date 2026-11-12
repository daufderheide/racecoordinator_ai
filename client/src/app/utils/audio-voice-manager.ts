import { Settings } from "@app/models/settings";
import { resolveBestTtsVoice } from "@app/utils/audio";

export class AudioVoiceManager {
  cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.initVoices();
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

  initVoices(): void {
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
    settings: Settings,
    voiceNameOverride?: string,
    rateOverride?: number,
    pitchOverride?: number,
    volumeOverride?: number,
    masterVolumeOverride?: number,
  ): void {
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

    const voices = this.getVoices();
    if (
      voiceName &&
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      typeof window.speechSynthesis.getVoices === "function"
    ) {
      const matched = resolveBestTtsVoice(voices, voiceName);
      if (matched) {
        try {
          utterance.voice = matched;
        } catch {
          // Native browser enforces SpeechSynthesisVoice instance; safely ignored if mock
        }
      }
    }
    if (
      voiceNameOverride !== "" &&
      !utterance.voice &&
      voices &&
      voices.length > 0
    ) {
      const targetLang = (
        settings?.language ||
        (typeof navigator !== "undefined" ? navigator.language : "en") ||
        "en"
      ).toLowerCase();
      const langPrefix = targetLang.split("-")[0];
      const langMatch = voices.find(
        (v) =>
          v.lang &&
          (v.lang.toLowerCase() === targetLang ||
            v.lang.toLowerCase().startsWith(langPrefix + "-") ||
            v.lang.toLowerCase() === langPrefix),
      );
      if (langMatch) {
        try {
          utterance.voice = langMatch;
        } catch {
          // Native browser enforces SpeechSynthesisVoice instance; safely ignored if mock
        }
      }
    }
    if (utterance.voice?.lang) {
      utterance.lang = utterance.voice.lang;
    } else if (!utterance.lang) {
      const rawLang =
        settings?.language ||
        (typeof navigator !== "undefined" ? navigator.language : "en") ||
        "en";
      const parts = rawLang.split("-");
      if (parts.length > 1) {
        utterance.lang = `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
      } else {
        const code = parts[0].toLowerCase();
        utterance.lang =
          code === "en" ? "en-US" : `${code}-${code.toUpperCase()}`;
      }
    }
    if (rate != null) {
      utterance.rate = Math.max(0.1, Math.min(10, rate));
    }
    if (pitch != null) {
      utterance.pitch = Math.max(0, Math.min(2, pitch));
    }
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
