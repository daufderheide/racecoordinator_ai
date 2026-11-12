const activeUtterances = new Set<SpeechSynthesisUtterance>();

export function retainUtterance(utterance: SpeechSynthesisUtterance): void {
  activeUtterances.add(utterance);
}

export function releaseUtterance(
  utterance: SpeechSynthesisUtterance | null | undefined,
): void {
  if (utterance) {
    activeUtterances.delete(utterance);
  }
}

let globalAudioUnlocked = false;
let globalKeepAliveAudio: HTMLAudioElement | null = null;
let globalKeepAliveBlobUrl: string | null = null;
let globalKeepAliveAudioContext: AudioContext | null = null;
let globalKeepAliveSource: AudioBufferSourceNode | null = null;
let mockIsMobileDevice: boolean | null = null;
export const globalAudioBufferCache = new Map<string, AudioBuffer>();

const FALLBACK_SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

export function setMobileDeviceForTesting(value: boolean | null): void {
  mockIsMobileDevice = value;
}

/**
 * Checks whether the current runtime environment is a mobile device
 * (smartphone, tablet, or iPadOS desktop-class browser).
 */
export function isMobileDevice(): boolean {
  if (mockIsMobileDevice !== null) {
    return mockIsMobileDevice;
  }
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  const isMobileUa =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|CriOS|FxiOS|Mobile/i.test(
      ua,
    );
  const isTouchMac =
    /Macintosh/i.test(ua) &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  const isCoarseMobile =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches &&
    (window.innerWidth <= 1024 || window.innerHeight <= 1024);

  return isMobileUa || isTouchMac || isCoarseMobile;
}

export function isGlobalAudioUnlocked(): boolean {
  return globalAudioUnlocked;
}

export function resetGlobalAudioUnlockerForTesting(): void {
  globalAudioUnlocked = false;
  mockIsMobileDevice = null;
  globalAudioBufferCache.clear();
  if (globalKeepAliveAudio) {
    try {
      globalKeepAliveAudio.pause();
      globalKeepAliveAudio.src = "";
    } catch {
      // ignore
    }
    globalKeepAliveAudio = null;
  }
  if (
    globalKeepAliveBlobUrl &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    try {
      URL.revokeObjectURL(globalKeepAliveBlobUrl);
    } catch {
      // ignore
    }
    globalKeepAliveBlobUrl = null;
  }
  if (globalKeepAliveSource) {
    try {
      globalKeepAliveSource.stop();
      globalKeepAliveSource.disconnect();
    } catch {
      // ignore
    }
    globalKeepAliveSource = null;
  }
  if (
    globalKeepAliveAudioContext &&
    globalKeepAliveAudioContext.state !== "closed"
  ) {
    try {
      globalKeepAliveAudioContext.close().catch(() => {});
    } catch {
      // ignore
    }
    globalKeepAliveAudioContext = null;
  }
}

export function getGlobalAudioContext(): AudioContext | null {
  if (
    typeof window !== "undefined" &&
    (!globalKeepAliveAudioContext ||
      globalKeepAliveAudioContext.state === "closed")
  ) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      try {
        globalKeepAliveAudioContext = new AudioCtx();
      } catch {
        // ignore
      }
    }
  }
  return globalKeepAliveAudioContext;
}

export interface WebAudioPlaybackHandle {
  stop: () => void;
  duration?: number;
}

function startBufferSourceNode(
  ctx: AudioContext,
  buffer: AudioBuffer,
  volume: number,
  isStopped: () => boolean,
  onEnded?: () => void,
): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = Math.max(0, Math.min(1, volume));
  source.connect(gain);
  if (ctx.destination) {
    gain.connect(ctx.destination);
  }
  source.onended = () => {
    if (!isStopped()) {
      onEnded?.();
    }
  };
  source.start(0);
  return source;
}

export function playWebAudioBufferSource(
  playableUrl: string,
  volume = 1.0,
  onEnded?: () => void,
): WebAudioPlaybackHandle | null {
  if (typeof window === "undefined") return null;
  const ctx = getGlobalAudioContext();
  if (!ctx || ctx.state === "closed") return null;

  if (ctx.state === "suspended" && typeof ctx.resume === "function") {
    try {
      ctx.resume().catch(() => {});
    } catch {
      // ignore
    }
  }

  let stopped = false;
  let activeSource: AudioBufferSourceNode | null = null;

  const stop = () => {
    stopped = true;
    if (activeSource) {
      try {
        activeSource.stop();
        activeSource.disconnect();
      } catch {
        // ignore
      }
      activeSource = null;
    }
  };

  const cachedBuffer = globalAudioBufferCache.get(playableUrl);
  if (cachedBuffer && typeof ctx.createBufferSource === "function") {
    try {
      activeSource = startBufferSourceNode(
        ctx,
        cachedBuffer,
        volume,
        () => stopped,
        onEnded,
      );
      return { stop, duration: cachedBuffer.duration };
    } catch {
      return null;
    }
  }

  if (
    typeof fetch === "function" &&
    typeof ctx.decodeAudioData === "function"
  ) {
    try {
      fetch(playableUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then((arrBuf) => ctx.decodeAudioData(arrBuf))
        .then((decoded) => {
          globalAudioBufferCache.set(playableUrl, decoded);
          if (stopped) return;
          if (typeof ctx.createBufferSource === "function") {
            activeSource = startBufferSourceNode(
              ctx,
              decoded,
              volume,
              () => stopped,
              onEnded,
            );
          }
        })
        .catch(() => {
          if (!stopped) {
            onEnded?.();
          }
        });
      return { stop };
    } catch {
      return null;
    }
  }

  return null;
}

export function playWebAudioSfx(playableUrl: string, volume = 1.0): boolean {
  return playWebAudioBufferSource(playableUrl, volume) !== null;
}

export function startWebAudioVoiceCallout(
  playableUrl: string,
  volume: number,
  onEnded: () => void,
): { stop: () => void } | null {
  let ended = false;
  let safetyTimer: any = null;
  const cleanup = () => {
    if (ended) return;
    ended = true;
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
  };

  const handle = playWebAudioBufferSource(playableUrl, volume, () => {
    cleanup();
    onEnded();
  });
  if (!handle) return null;

  const stop = () => {
    cleanup();
    handle.stop();
  };

  const timeoutMs =
    handle.duration && !isNaN(handle.duration) && isFinite(handle.duration)
      ? Math.max(
          3000,
          Math.min(15000, Math.ceil(handle.duration * 1000) + 1500),
        )
      : 10000;
  safetyTimer = setTimeout(() => {
    cleanup();
    handle.stop();
    onEnded();
  }, timeoutMs);

  return { stop };
}

export function preloadWebAudioBuffer(playableUrl: string): void {
  if (
    typeof window === "undefined" ||
    typeof fetch !== "function" ||
    !playableUrl
  ) {
    return;
  }
  const ctx = getGlobalAudioContext();
  if (
    !ctx ||
    ctx.state === "closed" ||
    typeof ctx.decodeAudioData !== "function"
  ) {
    return;
  }
  if (globalAudioBufferCache.has(playableUrl)) return;

  try {
    fetch(playableUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((arrBuf) => ctx.decodeAudioData(arrBuf))
      .then((decoded) => {
        globalAudioBufferCache.set(playableUrl, decoded);
      })
      .catch(() => {});
  } catch {
    // ignore
  }
}

/**
 * Ensures that keep-alive media sessions and audio pipelines remain running.
 */
export function ensureAudioAwake(): void {
  if (typeof window === "undefined" || !isMobileDevice()) return;

  if (globalKeepAliveAudio && globalKeepAliveAudio.paused) {
    try {
      const p = globalKeepAliveAudio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  if (
    globalKeepAliveAudioContext &&
    globalKeepAliveAudioContext.state === "suspended"
  ) {
    try {
      globalKeepAliveAudioContext.resume().catch(() => {});
    } catch {
      // ignore
    }
  }

  if (window.speechSynthesis && window.speechSynthesis.paused) {
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
  }
}

function playUnlockConfirmationChime(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.07); // A5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // ignore
  }
}

function unlockWebAudioPipeline(playChime: boolean): void {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    if (
      !globalKeepAliveAudioContext ||
      globalKeepAliveAudioContext.state === "closed"
    ) {
      globalKeepAliveAudioContext = new AudioCtx();
    }
    if (globalKeepAliveAudioContext.state === "suspended") {
      globalKeepAliveAudioContext.resume().catch(() => {});
    }
    if (playChime) {
      playUnlockConfirmationChime(globalKeepAliveAudioContext);
    }
    if (
      isMobileDevice() &&
      !globalKeepAliveSource &&
      globalKeepAliveAudioContext.state !== "closed"
    ) {
      const silentBuffer = globalKeepAliveAudioContext.createBuffer(
        1,
        22050,
        22050,
      );
      const source = globalKeepAliveAudioContext.createBufferSource();
      source.buffer = silentBuffer;
      source.loop = true;
      const gainNode = globalKeepAliveAudioContext.createGain();
      gainNode.gain.value = 0.0001;
      source.connect(gainNode);
      gainNode.connect(globalKeepAliveAudioContext.destination);
      source.start(0);
      globalKeepAliveSource = source;
    }
  } catch {
    // ignore
  }
}

function primeSpeechSynthesisPipeline(
  confirmationTextOrPrime: boolean | string,
): void {
  if (!window.speechSynthesis) return;

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    if (
      confirmationTextOrPrime &&
      typeof SpeechSynthesisUtterance !== "undefined"
    ) {
      const isCustomText =
        typeof confirmationTextOrPrime === "string" &&
        confirmationTextOrPrime.trim().length > 0;
      const textToSpeak = isCustomText ? confirmationTextOrPrime.trim() : " ";
      const primeUtterance = new SpeechSynthesisUtterance(textToSpeak);
      primeUtterance.volume = isCustomText ? 1.0 : 0.01;
      primeUtterance.rate = isCustomText ? 1.0 : 10;
      if (
        isCustomText &&
        typeof navigator !== "undefined" &&
        navigator.language
      ) {
        const parts = navigator.language.split("-");
        primeUtterance.lang =
          parts.length > 1
            ? `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`
            : parts[0].toLowerCase() === "en"
              ? "en-US"
              : `${parts[0].toLowerCase()}-${parts[0].toUpperCase()}`;
      }
      retainUtterance(primeUtterance);
      primeUtterance.onend = () => releaseUtterance(primeUtterance);
      primeUtterance.onerror = () => releaseUtterance(primeUtterance);
      window.speechSynthesis.speak(primeUtterance);
    }
  } catch {
    // ignore
  }
}

/**
 * Executes an audio subsystem unlock for Web Audio, SpeechSynthesis, and mobile keep-alive sessions.
 */
export function unlockGlobalAudio(
  playChime = false,
  confirmationTextOrPrime: boolean | string = true,
): void {
  if (typeof window === "undefined") return;

  const wasAlreadyUnlocked = globalAudioUnlocked;

  if (
    !playChime &&
    wasAlreadyUnlocked &&
    (!isMobileDevice() ||
      (globalKeepAliveAudioContext?.state === "running" &&
        (!globalKeepAliveAudio || !globalKeepAliveAudio.paused)))
  ) {
    return;
  }

  if (typeof navigator !== "undefined" && (navigator as any).audioSession) {
    try {
      (navigator as any).audioSession.type = "playback";
    } catch {
      // ignore
    }
  }

  unlockWebAudioPipeline(playChime);
  primeSpeechSynthesisPipeline(confirmationTextOrPrime);

  if (isMobileDevice() && !globalKeepAliveSource) {
    try {
      if (!globalKeepAliveAudio) {
        globalKeepAliveAudio = new Audio(FALLBACK_SILENT_WAV_DATA_URI);
        globalKeepAliveAudio.loop = true;
        globalKeepAliveAudio.volume = 0.001;
      }
      if (globalKeepAliveAudio.paused) {
        const playPromise = globalKeepAliveAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  }

  globalAudioUnlocked = true;

  if (!wasAlreadyUnlocked) {
    try {
      window.dispatchEvent(new CustomEvent("rcai-audio-unlocked"));
    } catch {
      // ignore
    }
  }
}

/**
 * Initializes global user gesture listeners to unlock web audio and speech synthesis.
 */
export function initGlobalAudioUnlocker(): void {
  if (typeof window === "undefined" || globalAudioUnlocked) return;

  const unlock = () => {
    unlockGlobalAudio(false, !isMobileDevice());
    window.removeEventListener("click", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    window.removeEventListener("touchend", unlock, true);
    window.removeEventListener("pointerup", unlock, true);
  };

  if (
    !isMobileDevice() &&
    typeof navigator !== "undefined" &&
    navigator.userActivation?.hasBeenActive
  ) {
    unlockGlobalAudio(false);
    return;
  }

  window.addEventListener("click", unlock, { capture: true, once: false });
  window.addEventListener("keydown", unlock, { capture: true, once: false });
  window.addEventListener("touchend", unlock, { capture: true, once: false });
  window.addEventListener("pointerup", unlock, {
    capture: true,
    once: false,
  });

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && isGlobalAudioUnlocked()) {
        ensureAudioAwake();
      }
    });
  }
}
