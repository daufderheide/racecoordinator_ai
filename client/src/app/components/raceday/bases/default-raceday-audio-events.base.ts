import { DefaultRacedayLayoutBase } from "@app/components/raceday/bases/default-raceday-layout.base";
import { RacedayLapAudioHelper } from "@app/components/raceday/helpers/raceday-lap-audio.helper";
import { RacedayRaceLifecycleHelper } from "@app/components/raceday/helpers/raceday-race-lifecycle.helper";
import { RacedayRecordsStatsHelper } from "@app/components/raceday/helpers/raceday-records-stats.helper";
import { RacedaySubscriptionsHelper } from "@app/components/raceday/helpers/raceday-subscriptions.helper";
import { RacedayTimedAudioHelper } from "@app/components/raceday/helpers/raceday-timed-audio.helper";
import { AudioConfig } from "@app/models/driver";
import { HighlightLapStyle } from "@app/models/settings";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { AudioAssociation } from "@app/services/audio.service";
import { isColorLight } from "@app/utils/color.utils";
import { LapAudioCandidate } from "@app/utils/lap-audio-arbitrator";

export abstract class DefaultRacedayAudioEventsBase extends DefaultRacedayLayoutBase {
  protected subscribeToRaceData(): void {
    RacedaySubscriptionsHelper.subscribeToRaceData(this);
  }

  protected subscribeToCurrentHeat(): void {
    RacedaySubscriptionsHelper.subscribeToCurrentHeat(this);
  }

  protected subscribeToServerIp(): void {
    RacedaySubscriptionsHelper.subscribeToServerIp(this);
  }

  protected subscribeToRaceTime(): void {
    RacedaySubscriptionsHelper.subscribeToRaceTime(this);
  }

  protected handleRaceTimeUpdate(raceTime: any): void {
    RacedaySubscriptionsHelper.handleRaceTimeUpdate(this, raceTime);
  }

  protected updateAutoStartAndAdvance(raceTime: any): void {
    RacedaySubscriptionsHelper.updateAutoStartAndAdvance(this, raceTime);
  }

  protected computeDisplayRaceTime(raceTime: any): number {
    return RacedaySubscriptionsHelper.computeDisplayRaceTime(this, raceTime);
  }

  protected updateRaceTimeFormat(time: number): void {
    RacedaySubscriptionsHelper.updateRaceTimeFormat(this, time);
  }

  protected subscribeToLapEvents(): void {
    RacedaySubscriptionsHelper.subscribeToLapEvents(this);
  }

  protected applyLapTimeToDriver(
    driverData: DriverHeatData,
    lap: any,
    lapTotalTime?: number,
  ): void {
    RacedaySubscriptionsHelper.applyLapTimeToDriver(
      driverData,
      lap,
      lapTotalTime,
    );
  }

  protected syncLapToHeats(
    currentHeat: any,
    lap: any,
    driverData: DriverHeatData,
    lapTotalTime?: number,
  ): void {
    RacedaySubscriptionsHelper.syncLapToHeats(
      this,
      currentHeat,
      lap,
      driverData,
      lapTotalTime,
    );
  }

  protected handleLapEvent(lap: any, driverData: DriverHeatData): void {
    RacedaySubscriptionsHelper.handleLapEvent(this, lap, driverData);
  }

  protected handleSpecialLapAudio(
    lap: any,
    driverData: DriverHeatData,
    driver: any,
    ttsContext: any,
    association: AudioAssociation,
  ): boolean {
    return RacedayLapAudioHelper.handleSpecialLapAudio(
      this,
      lap,
      driverData,
      driver,
      ttsContext,
      association,
    );
  }

  protected handleLapAudio(
    lap: any,
    driverOrData: any,
    isBestLap: boolean,
    ttsContext: any,
    explicitDriverData?: DriverHeatData,
  ): void {
    RacedayLapAudioHelper.handleLapAudio(
      this,
      lap,
      driverOrData,
      isBestLap,
      ttsContext,
      explicitDriverData,
    );
  }

  protected dispatchLapCandidate(
    candidate: LapAudioCandidate,
    queue: boolean,
  ): boolean {
    return RacedayLapAudioHelper.dispatchLapCandidate(this, candidate, queue);
  }

  protected dispatchLapFallbackSfx(
    driver: any,
    isBestLap: boolean,
    ttsContext: any,
    association: AudioAssociation,
    specialAudioConfig?: any,
  ): void {
    RacedayLapAudioHelper.dispatchLapFallbackSfx(
      this,
      driver,
      isBestLap,
      ttsContext,
      association,
      specialAudioConfig,
    );
  }

  protected resolveLapMilestoneCandidate(
    lap: any,
    driver: any,
    isBestLap: boolean,
    ttsContext: any,
    association: AudioAssociation,
  ): LapAudioCandidate | null {
    return RacedayLapAudioHelper.resolveLapMilestoneCandidate(
      this,
      lap,
      driver,
      isBestLap,
      ttsContext,
      association,
    );
  }

  protected resolveHalfwayCandidate(
    lap: any,
    driverData?: DriverHeatData,
  ): LapAudioCandidate | null {
    return RacedayLapAudioHelper.resolveHalfwayCandidate(this, lap, driverData);
  }

  protected checkHalfwayPoint(lap: any, driverData?: DriverHeatData): void {
    const candidate = this.resolveHalfwayCandidate(lap, driverData);
    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum > (this as any).leaderLaps) {
      (this as any).leaderLaps = lapNum;
    }
    if (candidate) {
      this.dispatchLapCandidate(candidate, false);
    }
  }

  protected getLapsThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    return RacedayLapAudioHelper.getLapsThresholds(this, triggerMode);
  }

  protected getLapsLeftThresholds(): number[] {
    return this.getLapsThresholds("remaining");
  }

  protected resolveLapsLeftCandidate(
    lap: any,
    driverData: DriverHeatData,
  ): LapAudioCandidate | null {
    return RacedayLapAudioHelper.resolveLapsLeftCandidate(
      this,
      lap,
      driverData,
    );
  }

  protected checkLapsLeftCallouts(lap: any, driverData: DriverHeatData): void {
    const candidate = this.resolveLapsLeftCandidate(lap, driverData);
    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum > (this as any).leaderLaps) {
      (this as any).leaderLaps = lapNum;
    }
    if (candidate) {
      this.dispatchLapCandidate(candidate, false);
    }
  }

  protected getAutoStartThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    return RacedayTimedAudioHelper.getAutoStartThresholds(this, triggerMode);
  }

  protected checkAutoStartCallouts(
    currentTime: number,
    previousTime: number,
  ): void {
    RacedayTimedAudioHelper.checkAutoStartCallouts(
      this,
      currentTime,
      previousTime,
    );
  }

  protected getAutoAdvanceThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    return RacedayTimedAudioHelper.getAutoAdvanceThresholds(this, triggerMode);
  }

  protected checkAutoAdvanceCallouts(
    currentTime: number,
    previousTime: number,
  ): void {
    RacedayTimedAudioHelper.checkAutoAdvanceCallouts(
      this,
      currentTime,
      previousTime,
    );
  }

  protected handleLapHighlight(lap: any, driverData?: DriverHeatData): void {
    RacedaySubscriptionsHelper.handleLapHighlight(this, lap, driverData);
  }

  get highlightLapStyle(): HighlightLapStyle {
    return RacedaySubscriptionsHelper.getHighlightLapStyle(this);
  }

  isLaneColorLight(hd: any): boolean {
    const bg = this.getLaneColor(hd, "background_color");
    return isColorLight(bg);
  }

  protected getFuelCapacity(): number {
    const race = (this as any).raceService?.getRace();
    const isDigital =
      typeof (this as any).track?.hasDigitalFuel === "function" &&
      (this as any).track.hasDigitalFuel();
    const capacity = isDigital
      ? race?.digital_fuel_options?.capacity
      : race?.fuel_options?.capacity;
    return capacity && capacity > 0 ? capacity : 100;
  }

  protected resetFuelAudioTracking(): void {
    (this as any).fuelAudioTracker?.reset(
      (this as any).heat,
      (this as any).hasRacedInCurrentHeat,
      (this as any).race,
      (this as any).track,
    );
  }

  protected resolveAssetPlayableUrl(
    urlOrId: string | undefined,
  ): string | undefined {
    return RacedayTimedAudioHelper.resolveAssetPlayableUrl(this, urlOrId);
  }

  protected updateLaneFuel(
    lane: number,
    currentFuel: number | null,
    isRefueling: boolean,
  ): void {
    RacedayTimedAudioHelper.updateLaneFuel(
      this,
      lane,
      currentFuel,
      isRefueling,
    );
  }

  protected handleCarFuelAudio(carData: any): void {
    RacedayTimedAudioHelper.handleCarFuelAudio(this, carData);
  }

  protected subscribeToLiveUpdates(): void {
    RacedaySubscriptionsHelper.subscribeToLiveUpdates(this);
  }

  protected subscribeToUIEvents(): void {
    RacedaySubscriptionsHelper.subscribeToUIEvents(this);
  }

  protected handleStartingState(previousState: RaceState): void {
    RacedayRaceLifecycleHelper.handleStartingState(this, previousState);
  }

  protected handleRacingState(previousState: RaceState): void {
    RacedayRaceLifecycleHelper.handleRacingState(this, previousState);
  }

  protected handleRaceStateChange(state: RaceState): void {
    RacedayRaceLifecycleHelper.handleRaceStateChange(this, state);
  }

  protected getCountdownMaxLamps(): number {
    return RacedayRaceLifecycleHelper.getCountdownMaxLamps(this);
  }

  protected updateCountdownLamps(currentTime: number): void {
    RacedayRaceLifecycleHelper.updateCountdownLamps(this, currentTime);
  }

  protected getAudioFromSetEntry(
    slotKey: string,
    timeSeconds: number,
    triggerMode: string = "remaining",
  ): { config: AudioConfig; playableUrl?: string } | null {
    return RacedayTimedAudioHelper.getAudioFromSetEntry(
      this,
      slotKey,
      timeSeconds,
      triggerMode,
    );
  }

  protected playAudioFromSet(
    slotKey: string,
    timeSeconds: number,
    association?: AudioAssociation,
    triggerMode: string = "remaining",
  ): boolean {
    return RacedayTimedAudioHelper.playAudioFromSet(
      this,
      slotKey,
      timeSeconds,
      association,
      triggerMode,
    );
  }

  protected preloadCountdownAudio(): void {
    RacedayRaceLifecycleHelper.preloadCountdownAudio(this);
  }

  protected preloadCountdownImages(): void {
    RacedayRaceLifecycleHelper.preloadCountdownImages(this);
  }

  protected getSecondsLeftThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    return RacedayTimedAudioHelper.getSecondsLeftThresholds(this, triggerMode);
  }

  protected checkAudioCallouts(
    currentTime: number,
    previousTime: number,
  ): void {
    RacedayTimedAudioHelper.checkAudioCallouts(this, currentTime, previousTime);
  }

  protected playThemedSound(
    slotKey: string,
    context?: any,
    association?: AudioAssociation,
  ): void {
    RacedayTimedAudioHelper.playThemedSound(
      this,
      slotKey,
      context,
      association,
    );
  }

  protected updateAudioRelevance(): void {
    RacedayTimedAudioHelper.updateAudioRelevance(this);
  }

  protected setAllLampsGo(): void {
    RacedayRaceLifecycleHelper.setAllLampsGo(this);
  }

  getAssetUrl(name: string): string {
    return RacedayRecordsStatsHelper.getAssetUrl(this, name);
  }

  resolveAssetUrlBySlot(slotKey: string): string {
    return RacedayRecordsStatsHelper.resolveAssetUrlBySlot(this, slotKey);
  }

  refreshCountdownLampUrls(): void {
    RacedayRaceLifecycleHelper.refreshCountdownLampUrls(this);
  }

  protected handleRecordDataUpdate(records: any): void {
    RacedayRecordsStatsHelper.handleRecordDataUpdate(this, records);
  }

  protected resetRaceAudioTracking(): void {
    RacedayTimedAudioHelper.resetRaceAudioTracking(this);
  }

  protected handleRaceEndedState(): void {
    RacedayRaceLifecycleHelper.handleRaceEndedState(this);
  }

  protected syncNewRaceTimers(race: any): void {
    RacedayRaceLifecycleHelper.syncNewRaceTimers(this, race);
  }

  protected syncStartingCountdownLamps(race: any): void {
    RacedayRaceLifecycleHelper.syncStartingCountdownLamps(this, race);
  }
}
