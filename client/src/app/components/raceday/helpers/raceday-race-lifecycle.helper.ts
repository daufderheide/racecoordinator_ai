import { THEME_SLOT_KEYS } from "@app/models/theme";
import { FinishMethod, RaceState } from "@app/proto/antigravity";

export class RacedayRaceLifecycleHelper {
  public static handleRaceEndedState(host: any): void {
    host.raceHasEnded = true;
    host.raceState = RaceState.RACE_OVER;
    host.autoStartRemaining = 0;
    host.autoAdvanceRemaining = 0;
    host.time = 0;
    host.previousTime = 0;
    host.timeFormat = "1.0-0";
    host.resetRaceAudioTracking();
  }

  public static syncNewRaceTimers(host: any, race: any): void {
    const state =
      (race as any)?.state ?? (race as any)?.raceState ?? host.raceState;
    const isNotStarted =
      state === RaceState.NOT_STARTED ||
      state === RaceState.UNKNOWN_STATE ||
      state === undefined ||
      state === null;
    const isHeatOver = state === RaceState.HEAT_OVER;

    if (isNotStarted) {
      host.autoStartRemaining =
        (race as any)?.auto_start_remaining_seconds ||
        (race as any)?.auto_start_remaining ||
        race.auto_start_time ||
        0;
      host.autoAdvanceRemaining = 0;
      host.time = host.autoStartRemaining > 0 ? host.autoStartRemaining : 0;
    } else if (isHeatOver) {
      host.autoStartRemaining = 0;
      host.autoAdvanceRemaining =
        (race as any)?.auto_advance_remaining_seconds ||
        (race as any)?.auto_advance_remaining ||
        0;
      host.time = host.autoAdvanceRemaining > 0 ? host.autoAdvanceRemaining : 0;
    } else {
      host.autoStartRemaining = 0;
      host.autoAdvanceRemaining = 0;
      if (typeof (race as any)?.accumulated_race_time === "number") {
        host.time = (race as any).accumulated_race_time;
      }
    }
    host.previousTime = host.time;
    host.timeFormat = "1.0-0";
    host.resetRaceAudioTracking();
  }

  public static syncStartingCountdownLamps(host: any, race: any): void {
    if (
      host.raceState === RaceState.STARTING ||
      host.raceState === RaceState.PAUSED
    ) {
      const duration =
        host.isRestarting || host.raceState === RaceState.PAUSED
          ? (race.restart_time ?? race.start_time)
          : race.start_time;
      if (duration != null) {
        host.countdownTotalLamps = Math.min(
          host.getCountdownMaxLamps
            ? host.getCountdownMaxLamps()
            : RacedayRaceLifecycleHelper.getCountdownMaxLamps(host),
          Math.ceil(duration),
        );
        if (host.updateCountdownLamps) {
          host.updateCountdownLamps(host.autoStartRemaining ?? duration);
        } else {
          RacedayRaceLifecycleHelper.updateCountdownLamps(
            host,
            host.autoStartRemaining ?? duration,
          );
        }
      }
    }
  }

  public static handleStartingState(host: any, previousState: RaceState): void {
    host.audioService.stopVoice();
    host.showCountdownOverlay = true;
    host.lastCountdownSoundTime = -1;

    if (previousState === RaceState.PAUSED) {
      host.isRestarting = true;
    } else if (previousState !== RaceState.STARTING) {
      host.isRestarting = false;
    }

    const r = host.raceService.getRace() || host.race;
    const duration = host.isRestarting
      ? (r?.restart_time ?? r?.start_time)
      : r?.start_time;

    if (
      host.autoStartRemaining != null &&
      host.autoStartRemaining > 0 &&
      duration != null &&
      host.autoStartRemaining < duration - 0.5
    ) {
      host.lastPlayedCountdownSecond = Math.ceil(host.autoStartRemaining);
    } else {
      host.lastPlayedCountdownSecond = -1;
    }

    if (duration != null) {
      host.countdownTotalLamps = Math.min(
        host.getCountdownMaxLamps
          ? host.getCountdownMaxLamps()
          : RacedayRaceLifecycleHelper.getCountdownMaxLamps(host),
        Math.ceil(duration),
      );
      if (host.updateCountdownLamps) {
        host.updateCountdownLamps(duration);
      } else {
        RacedayRaceLifecycleHelper.updateCountdownLamps(host, duration);
      }
    }
  }

  public static handleRacingState(host: any, previousState: RaceState): void {
    if (host.setAllLampsGo) {
      host.setAllLampsGo();
    } else {
      RacedayRaceLifecycleHelper.setAllLampsGo(host);
    }

    if (previousState === RaceState.STARTING && !host.isRestarting) {
      const scoring = host.race?.heat_scoring;
      if (scoring?.finishMethod === FinishMethod.Timed) {
        host.time = scoring.finishValue;
      }
    }

    host.isRestarting = false;

    if (previousState !== RaceState.UNKNOWN_STATE) {
      host.playAudioFromSet(THEME_SLOT_KEYS.AUDIO_COUNTDOWN, 0, {
        widgetType: "countdown",
      });
    }
    setTimeout(() => {
      if (host.raceState === RaceState.RACING) {
        host.showCountdownOverlay = false;
      }
    }, 1000);
  }

  public static handleRaceStateChange(host: any, state: RaceState): void {
    if (state === host.raceState) {
      return;
    }

    const previousState = host.raceState;
    host.logger.debug(
      "RacedayComponent: State changed from",
      previousState,
      "to:",
      state,
    );
    host.raceState = state;

    if (state === RaceState.RACE_OVER) {
      host.raceHasEnded = true;
      host.autoStartRemaining = 0;
      host.autoAdvanceRemaining = 0;
      host.time = 0;
      host.previousTime = 0;
      host.timeFormat = "1.0-0";
    } else if (state !== RaceState.UNKNOWN_STATE) {
      host.raceHasEnded = false;
    }

    if (
      state !== RaceState.NOT_STARTED &&
      state !== RaceState.UNKNOWN_STATE &&
      state !== RaceState.STARTING
    ) {
      host.autoStartRemaining = 0;
    }
    if (state !== RaceState.HEAT_OVER) {
      host.autoAdvanceRemaining = 0;
    }

    // Reset overlay if we enter a state that shouldn't show it
    if (
      state === RaceState.NOT_STARTED ||
      state === RaceState.UNKNOWN_STATE ||
      state === RaceState.HEAT_OVER ||
      state === RaceState.RACE_OVER ||
      state === RaceState.PAUSED
    ) {
      host.showCountdownOverlay = false;
      if (
        state === RaceState.NOT_STARTED ||
        state === RaceState.HEAT_OVER ||
        state === RaceState.RACE_OVER
      ) {
        if (state === RaceState.NOT_STARTED) {
          host.hasRacedInCurrentHeat = false;
          host.audioService.reset();
        }
        host.resetRaceAudioTracking();
      }
    }

    // Play yellow flag audio when transitioning from RACING to PAUSED
    if (state === RaceState.PAUSED && previousState === RaceState.RACING) {
      host.playThemedSound(THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG);
    }

    if (previousState !== RaceState.UNKNOWN_STATE) {
      if (state === RaceState.HEAT_OVER) {
        host.playThemedSound(THEME_SLOT_KEYS.AUDIO_HEAT_OVER);
      } else if (state === RaceState.RACE_OVER) {
        host.playThemedSound(THEME_SLOT_KEYS.AUDIO_RACE_OVER);
      }
    }

    if (state === RaceState.STARTING) {
      if (host.handleStartingState) {
        host.handleStartingState(previousState);
      } else {
        RacedayRaceLifecycleHelper.handleStartingState(host, previousState);
      }
    }

    if (state === RaceState.RACING) {
      if (host.handleRacingState) {
        host.handleRacingState(previousState);
      } else {
        RacedayRaceLifecycleHelper.handleRacingState(host, previousState);
      }
    }

    if (!host.isDestroyed) {
      host.cdr.markForCheck();
    }
  }

  public static getCountdownMaxLamps(host: any): number {
    const countdownWidget = host.layout?.widgets?.find(
      (w: any) => w.widgetType === "countdown",
    );
    const maxLamps =
      countdownWidget?.customSettings?.["maxLamps"] ??
      countdownWidget?.customSettings?.["previewLampCount"];
    return typeof maxLamps === "number" && maxLamps >= 1
      ? Math.min(10, Math.max(1, Math.round(maxLamps)))
      : 5;
  }

  public static updateCountdownLamps(host: any, currentTime: number): void {
    if (!host.showCountdownOverlay) return;

    // If we've reached RACING state, but the overlay hasn't hidden yet,
    // ensure we stay in the "GO!" state with all green lamps.
    if (host.raceState === RaceState.RACING) {
      if (host.setAllLampsGo) {
        host.setAllLampsGo();
      } else {
        RacedayRaceLifecycleHelper.setAllLampsGo(host);
      }
      return;
    }

    if (host.countdownTotalLamps === 0 && currentTime > 0) {
      host.countdownTotalLamps = Math.min(
        host.getCountdownMaxLamps
          ? host.getCountdownMaxLamps()
          : RacedayRaceLifecycleHelper.getCountdownMaxLamps(host),
        Math.ceil(currentTime),
      );
    }

    const displayTime =
      host.raceState === RaceState.STARTING && currentTime <= 0
        ? 1
        : currentTime;

    const onCount = Math.max(
      0,
      host.countdownTotalLamps - Math.ceil(displayTime) + 1,
    );

    host.countdownLamps = [];
    for (let i = 0; i < host.countdownTotalLamps; i++) {
      const lampState = i < onCount ? "on" : "dim";
      const slotKey = lampState === "on" ? "lamp.red.on" : "lamp.red.dim";
      const url =
        host.resolveAssetUrlBySlot(slotKey) ||
        host.getAssetUrl(
          lampState === "on" ? "Start Lamp Red" : "Start Lamp Dim",
        );
      host.countdownLamps.push({
        url: url,
        state: lampState,
      });
    }

    host.countdownText = `${Math.ceil(displayTime)}`;
    host.countdownColor = "lime";

    const currentSecond = Math.ceil(currentTime);
    if (
      currentSecond <= host.countdownTotalLamps &&
      currentSecond <= 5 &&
      currentSecond >= 1 &&
      currentSecond !== host.lastPlayedCountdownSecond
    ) {
      RacedayRaceLifecycleHelper.playCountdownSound(
        host,
        currentSecond,
        currentTime,
      );
    }
  }

  private static playCountdownSound(
    host: any,
    currentSecond: number,
    currentTime: number,
  ): void {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const deltaMs =
      host.lastPlayedCountdownSecond > 0 && host.lastCountdownSoundTime > 0
        ? Math.round(now - host.lastCountdownSoundTime)
        : -1;
    host.logger.debug(
      `[PERF] Countdown sound triggered: second=${currentSecond}, currentTime=${currentTime.toFixed(2)}, delta=${deltaMs}ms`,
    );
    if (deltaMs >= 0 && deltaMs < 250) {
      host.logger.warn(
        `[PERF] Countdown sound for second=${currentSecond} arrived rapidly (${deltaMs}ms after previous), skipping to prevent audio overlap`,
      );
      host.lastPlayedCountdownSecond = currentSecond;
      return;
    }
    const played = host.playAudioFromSet(
      THEME_SLOT_KEYS.AUDIO_COUNTDOWN,
      currentSecond,
      {
        widgetType: "countdown",
      },
    );
    if (played) {
      host.lastPlayedCountdownSecond = currentSecond;
      host.lastCountdownSoundTime = now;
    }
  }

  public static preloadCountdownAudio(host: any): void {
    if (host.preloadCountdownImages) {
      host.preloadCountdownImages();
    } else {
      RacedayRaceLifecycleHelper.preloadCountdownImages(host);
    }
    if (
      !host.assets ||
      host.assets.length === 0 ||
      !host.audioService ||
      typeof host.audioService.preload !== "function"
    ) {
      return;
    }
    for (let second = 0; second <= 5; second++) {
      const item = host.getAudioFromSetEntry(
        THEME_SLOT_KEYS.AUDIO_COUNTDOWN,
        second,
      );
      if (item?.playableUrl && item.config.type !== "tts") {
        host.audioService.preload(item.playableUrl);
      }
    }
  }

  public static preloadCountdownImages(host: any): void {
    if (
      typeof Image === "undefined" ||
      !host.assets ||
      host.assets.length === 0
    ) {
      return;
    }
    const lampUrls = [
      host.resolveAssetUrlBySlot("lamp.red.on") ||
        host.getAssetUrl("Start Lamp Red"),
      host.resolveAssetUrlBySlot("lamp.red.dim") ||
        host.getAssetUrl("Start Lamp Dim"),
      host.resolveAssetUrlBySlot("lamp.green") ||
        host.getAssetUrl("Start Lamp Green"),
    ];
    for (const url of lampUrls) {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    }
  }

  public static setAllLampsGo(host: any): void {
    const url =
      host.resolveAssetUrlBySlot("lamp.green") ||
      host.getAssetUrl("Start Lamp Green");
    const count =
      host.countdownTotalLamps > 0
        ? host.countdownTotalLamps
        : host.countdownLamps.length || 0;
    host.countdownLamps = Array.from({ length: count }).map(() => ({
      url: url,
      state: "go",
    }));
    host.countdownText = "GO!";
    host.countdownColor = "lime";
  }

  public static refreshCountdownLampUrls(host: any): void {
    if (!host.countdownLamps || host.countdownLamps.length === 0) return;
    for (const lamp of host.countdownLamps) {
      if (lamp.state === "go") {
        lamp.url =
          host.resolveAssetUrlBySlot("lamp.green") ||
          host.getAssetUrl("Start Lamp Green") ||
          lamp.url;
      } else if (lamp.state === "on") {
        lamp.url =
          host.resolveAssetUrlBySlot("lamp.red.on") ||
          host.getAssetUrl("Start Lamp Red") ||
          lamp.url;
      } else if (lamp.state === "dim") {
        lamp.url =
          host.resolveAssetUrlBySlot("lamp.red.dim") ||
          host.getAssetUrl("Start Lamp Dim") ||
          lamp.url;
      }
    }
    if (!host.isDestroyed) {
      host.cdr.markForCheck();
    }
  }
}
