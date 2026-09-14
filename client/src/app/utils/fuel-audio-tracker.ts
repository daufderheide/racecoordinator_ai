import { AudioConfig } from "@app/models/driver";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { Heat } from "@app/race/heat";
import { AudioPlayer, createTTSContext } from "@app/utils/audio";

export interface LaneFuelAudioState {
  lastFuelLevel: number;
  isRefueling: boolean;
  refuelStartFuelLevel: number | null;
  hasPlayedPitInThisRefuel: boolean;
  playedThresholds: Set<number>;
}

export class FuelAudioTracker {
  private laneFuelAudioStates = new Map<number, LaneFuelAudioState>();

  constructor(
    private audioPlayer: AudioPlayer,
    private resolvePlayableUrlFn?: (
      urlOrId: string | undefined,
    ) => string | undefined,
  ) {}

  public getStates(): Map<number, LaneFuelAudioState> {
    return this.laneFuelAudioStates;
  }

  public getFuelCapacity(race?: Race, track?: Track): number {
    const isDigital =
      typeof track?.hasDigitalFuel === "function" && track.hasDigitalFuel();
    const capacity = isDigital
      ? race?.digital_fuel_options?.capacity
      : race?.fuel_options?.capacity;
    return capacity && capacity > 0 ? capacity : 100;
  }

  public reset(
    heat?: Heat,
    hasRacedInCurrentHeat?: boolean,
    race?: Race,
    track?: Track,
  ): void {
    this.laneFuelAudioStates.clear();
    const capacity = this.getFuelCapacity(race, track);
    if (heat?.heatDrivers) {
      heat.heatDrivers.forEach((hd, index) => {
        const lane = hd.laneIndex ?? index;
        const hasStarted = !!heat?.started || !!hasRacedInCurrentHeat;
        const initialFuel =
          hd.participant?.fuelLevel != null &&
          (hd.participant.fuelLevel > 0 || hasStarted)
            ? hd.participant.fuelLevel
            : hd.initialFuelLevel != null && hd.initialFuelLevel > 0
              ? hd.initialFuelLevel
              : (hd.participant?.fuelLevel ?? capacity);
        this.laneFuelAudioStates.set(lane, {
          lastFuelLevel: initialFuel,
          isRefueling: false,
          refuelStartFuelLevel: null,
          hasPlayedPitInThisRefuel: false,
          playedThresholds: new Set<number>(),
        });
      });
    }
  }

  public updateLaneFuel(
    lane: number,
    currentFuel: number | null,
    isRefueling: boolean,
    heat?: Heat,
    hasRacedInCurrentHeat?: boolean,
    race?: Race,
    track?: Track,
    assets?: any[],
    canPlayAudio: boolean = true,
  ): void {
    if (lane == null) return;
    const hd =
      heat?.heatDrivers?.find((d) => d.laneIndex === lane) ||
      (heat?.heatDrivers && lane < heat.heatDrivers.length
        ? heat.heatDrivers[lane]
        : undefined);
    const driver =
      hd?.actualDriver ||
      hd?.participant?.driver ||
      (hd?.driver as any)?.driver ||
      hd?.driver;
    if (!driver) return;

    let state = this.laneFuelAudioStates.get(lane);
    if (!state) {
      const capacity = this.getFuelCapacity(race, track);
      const hasStarted = !!heat?.started || !!hasRacedInCurrentHeat;
      const initialFuel =
        hd?.participant?.fuelLevel != null &&
        (hd.participant.fuelLevel > 0 || hasStarted)
          ? hd.participant.fuelLevel
          : hd?.initialFuelLevel != null && hd.initialFuelLevel > 0
            ? hd.initialFuelLevel
            : (hd?.participant?.fuelLevel ?? capacity);
      state = {
        lastFuelLevel: initialFuel,
        isRefueling: false,
        refuelStartFuelLevel: null,
        hasPlayedPitInThisRefuel: false,
        playedThresholds: new Set<number>(),
      };
      this.laneFuelAudioStates.set(lane, state);
    }

    const previousFuel = state.lastFuelLevel;
    const wasRefueling = state.isRefueling;
    state.isRefueling = isRefueling;

    // Pit-in detection
    if (isRefueling) {
      if (!wasRefueling) {
        state.refuelStartFuelLevel = currentFuel ?? previousFuel;
        state.hasPlayedPitInThisRefuel = false;
      }
      if (
        !state.hasPlayedPitInThisRefuel &&
        state.refuelStartFuelLevel != null &&
        currentFuel != null
      ) {
        const fuelGained = currentFuel - state.refuelStartFuelLevel;
        if (fuelGained >= 0.099) {
          state.hasPlayedPitInThisRefuel = true;
          if (canPlayAudio) {
            this.playDriverPitInAudio(driver, hd);
          }
        }
      }
    } else {
      state.refuelStartFuelLevel = null;
      state.hasPlayedPitInThisRefuel = false;
    }

    if (currentFuel != null) {
      if (canPlayAudio) {
        this.checkFuelLevelAudioSet(
          driver,
          hd,
          previousFuel,
          currentFuel,
          isRefueling,
          state,
          race,
          track,
          heat,
          assets,
        );
      }
      state.lastFuelLevel = currentFuel;
    }
  }

  private playDriverPitInAudio(driver: any, hd: any): void {
    const config = driver?.pitInAudio;
    if (!config || config.type === "none") return;
    if (config.type === "tts" && !config.text?.trim()) return;
    if (config.type !== "tts" && !config.url?.trim()) return;

    const ttsContext = createTTSContext(driver, hd);
    const playableUrl = this.resolvePlayableUrlFn
      ? this.resolvePlayableUrlFn(config.url)
      : config.url;
    const association = {
      widgetType: "lane-view",
      laneIndex: hd?.laneIndex,
      driverId: driver.entity_id || driver.id || driver.objectId,
    };
    this.audioPlayer.playCallout(
      config,
      "high",
      ttsContext,
      playableUrl,
      association,
    );
  }

  private playFuelThresholdAudio(
    entry: any,
    driver: any,
    hd: any,
    race?: Race,
    track?: Track,
    heat?: Heat,
  ): void {
    if (!entry) return;
    const type = entry.type || "preset";
    if (type === "none") return;
    if (type === "tts" && !entry.text?.trim()) return;
    if (type !== "tts" && !entry.url?.trim()) return;

    const config: AudioConfig = {
      type,
      url: entry.url,
      text: entry.text || undefined,
    };
    const ttsContext = createTTSContext(
      driver,
      hd,
      race as any,
      track as any,
      heat as any,
    );
    const playableUrl = this.resolvePlayableUrlFn
      ? this.resolvePlayableUrlFn(entry.url)
      : entry.url;
    const association = {
      widgetType: "lane-view",
      laneIndex: hd?.laneIndex,
      driverId: driver.entity_id || driver.id || driver.objectId,
    };
    this.audioPlayer.playCallout(
      config,
      "urgent",
      ttsContext,
      playableUrl,
      association,
    );
  }

  private checkFuelLevelAudioSet(
    driver: any,
    hd: any,
    previousFuel: number,
    currentFuel: number,
    isRefueling: boolean,
    state: LaneFuelAudioState,
    race?: Race,
    track?: Track,
    heat?: Heat,
    assets?: any[],
  ): void {
    const fuelAudio = driver?.fuelAudio;
    if (!fuelAudio || fuelAudio.type === "none") return;

    const capacity = this.getFuelCapacity(race, track);
    const currentFuelPct =
      capacity > 0 ? (currentFuel / capacity) * 100 : currentFuel;
    const previousFuelPct =
      capacity > 0 ? (previousFuel / capacity) * 100 : previousFuel;

    const association = {
      widgetType: "lane-view",
      laneIndex: hd?.laneIndex,
      driverId: driver.entity_id || driver.id || driver.objectId,
    };

    if (fuelAudio.type === "audio_set") {
      this.processAudioSetThresholds(
        fuelAudio,
        currentFuelPct,
        previousFuelPct,
        isRefueling,
        state,
        driver,
        hd,
        race,
        track,
        heat,
        assets,
      );
    } else {
      this.processDirectEmptyThreshold(
        fuelAudio,
        currentFuelPct,
        previousFuelPct,
        state,
        driver,
        hd,
        association,
        race,
        track,
        heat,
      );
    }
  }

  private processAudioSetThresholds(
    fuelAudio: AudioConfig,
    currentFuelPct: number,
    previousFuelPct: number,
    isRefueling: boolean,
    state: LaneFuelAudioState,
    driver: any,
    hd: any,
    race?: Race,
    track?: Track,
    heat?: Heat,
    assets?: any[],
  ): void {
    const assetId = fuelAudio.url;
    const asset = (assets || []).find(
      (a: any) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId,
    );
    if (!asset || asset.type !== "audio_set" || !asset.audioEntries) return;

    for (const entry of asset.audioEntries) {
      const rawPct =
        entry.percentage != null && entry.percentage > 0
          ? entry.percentage
          : entry.timeSeconds != null && entry.timeSeconds > 0
            ? entry.timeSeconds
            : (entry.percentage ?? entry.timeSeconds ?? 0);
      const pct = Number(rawPct ?? 0);
      if (pct >= 99.9) {
        if (isRefueling && currentFuelPct >= 99.9 && previousFuelPct < 99.9) {
          if (!state.playedThresholds.has(100)) {
            state.playedThresholds.add(100);
            this.playFuelThresholdAudio(entry, driver, hd, race, track, heat);
          }
        } else if (currentFuelPct < 99.9) {
          state.playedThresholds.delete(100);
        }
      } else if (pct <= 0.1) {
        if (currentFuelPct <= 0.01 && previousFuelPct > 0.01) {
          if (!state.playedThresholds.has(0)) {
            state.playedThresholds.add(0);
            this.playFuelThresholdAudio(entry, driver, hd, race, track, heat);
          }
        } else if (currentFuelPct > 0.01) {
          state.playedThresholds.delete(0);
        }
      } else {
        if (
          currentFuelPct <= pct &&
          previousFuelPct > pct &&
          currentFuelPct > 0.01
        ) {
          if (!state.playedThresholds.has(pct)) {
            state.playedThresholds.add(pct);
            this.playFuelThresholdAudio(entry, driver, hd, race, track, heat);
          }
        } else if (currentFuelPct > pct + 0.01) {
          state.playedThresholds.delete(pct);
        }
      }
    }
  }

  private processDirectEmptyThreshold(
    fuelAudio: AudioConfig,
    currentFuelPct: number,
    previousFuelPct: number,
    state: LaneFuelAudioState,
    driver: any,
    hd: any,
    association: any,
    race?: Race,
    track?: Track,
    heat?: Heat,
  ): void {
    const isTts = fuelAudio.type === "tts" && fuelAudio.text?.trim();
    const isSound = fuelAudio.type === "preset" && fuelAudio.url?.trim();

    if (!isTts && !isSound) return;

    if (currentFuelPct <= 0.01 && previousFuelPct > 0.01) {
      if (!state.playedThresholds.has(0)) {
        state.playedThresholds.add(0);
        const ttsContext = createTTSContext(
          driver,
          hd,
          race as any,
          track as any,
          heat as any,
        );
        const playableUrl =
          isSound && this.resolvePlayableUrlFn
            ? this.resolvePlayableUrlFn(fuelAudio.url)
            : fuelAudio.url;
        this.audioPlayer.playCallout(
          fuelAudio,
          "urgent",
          ttsContext,
          playableUrl,
          association,
        );
      }
    } else if (currentFuelPct > 0.01) {
      state.playedThresholds.delete(0);
    }
  }
}
