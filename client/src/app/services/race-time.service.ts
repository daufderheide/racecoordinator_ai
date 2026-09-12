import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { FinishMethod } from "@app/models/heat_scoring";
import { IRaceTime, RaceState } from "@app/proto/antigravity";

import { RaceService } from "./race.service";
import { RaceConnectionService } from "./race-connection.service";

@Injectable({
  providedIn: "root",
})
export class RaceTimeService implements OnDestroy {
  private _time: number = 0;
  private _autoStartRemaining: number = 0;
  private _autoAdvanceRemaining: number = 0;
  private _raceState: RaceState = RaceState.UNKNOWN_STATE;
  private _isRestarting: boolean = false;
  private _showCountdownOverlay: boolean = false;
  private _timeFormat: string = "1.0-0";

  private previousTime: number = 0;
  private subsecondThreshold: number = 10;
  private subsecondDecimals: number = 2;

  private timeSubject = new BehaviorSubject<number>(0);
  public time$: Observable<number> = this.timeSubject.asObservable();

  private formattedTimeSubject = new BehaviorSubject<string>("--");
  public formattedTime$: Observable<string> =
    this.formattedTimeSubject.asObservable();

  private autoStatusLabelSubject = new BehaviorSubject<string>("");
  public autoStatusLabel$: Observable<string> =
    this.autoStatusLabelSubject.asObservable();

  private isWarmupSubject = new BehaviorSubject<boolean>(false);
  public isWarmup$: Observable<boolean> = this.isWarmupSubject.asObservable();

  private raceStateSubject = new BehaviorSubject<RaceState>(
    RaceState.UNKNOWN_STATE,
  );
  public raceState$: Observable<RaceState> =
    this.raceStateSubject.asObservable();

  private subscriptions = new Subscription();

  constructor(
    private raceConnectionService: RaceConnectionService,
    private raceService: RaceService,
  ) {
    if (this.raceConnectionService?.raceTime$) {
      this.subscriptions.add(
        this.raceConnectionService.raceTime$.subscribe((raceTime) => {
          this.handleRaceTimeUpdate(raceTime);
        }),
      );
    }

    if (this.raceConnectionService?.raceState$) {
      this.subscriptions.add(
        this.raceConnectionService.raceState$.subscribe((state) => {
          this.handleRaceStateChange(state);
        }),
      );
    }

    if (this.raceService?.selectedRace$) {
      this.subscriptions.add(
        this.raceService.selectedRace$.subscribe((race) => {
          if (
            (race as any)?.state === RaceState.RACE_OVER ||
            (race as any)?.raceState === RaceState.RACE_OVER ||
            (race as any)?.is_finished
          ) {
            this._raceState = RaceState.RACE_OVER;
            this._autoStartRemaining = 0;
            this._autoAdvanceRemaining = 0;
            this._time = 0;
            this.previousTime = 0;
            this._timeFormat = "1.0-0";
          } else if (
            (race as any)?.state !== undefined &&
            (race as any)?.state !== null &&
            (race as any)?.state !== RaceState.UNKNOWN_STATE
          ) {
            this._raceState = (race as any).state;
            if (
              this._raceState !== RaceState.NOT_STARTED &&
              this._raceState !== RaceState.STARTING
            ) {
              this._autoStartRemaining = 0;
            }
            if (this._raceState !== RaceState.HEAT_OVER) {
              this._autoAdvanceRemaining = 0;
            }
          }
          this.notifySubscribers();
        }),
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get time(): number {
    return this._time;
  }

  set time(val: number) {
    this._time = val;
    this.notifySubscribers();
  }

  get autoStartRemaining(): number {
    return this._autoStartRemaining;
  }

  set autoStartRemaining(val: number) {
    this._autoStartRemaining = val;
    this.notifySubscribers();
  }

  get autoAdvanceRemaining(): number {
    return this._autoAdvanceRemaining;
  }

  set autoAdvanceRemaining(val: number) {
    this._autoAdvanceRemaining = val;
    this.notifySubscribers();
  }

  get raceState(): RaceState {
    return this._raceState;
  }

  set raceState(val: RaceState) {
    this.handleRaceStateChange(val);
  }

  get isRestarting(): boolean {
    return this._isRestarting;
  }

  set isRestarting(val: boolean) {
    this._isRestarting = val;
    this.notifySubscribers();
  }

  get showCountdownOverlay(): boolean {
    return this._showCountdownOverlay;
  }

  set showCountdownOverlay(val: boolean) {
    this._showCountdownOverlay = val;
    this.notifySubscribers();
  }

  get timeFormat(): string {
    return this._timeFormat;
  }

  set timeFormat(val: string) {
    this._timeFormat = val;
    this.notifySubscribers();
  }

  setSubsecondSettings(threshold: number, decimals: number): void {
    this.subsecondThreshold = threshold;
    this.subsecondDecimals = decimals;
    this.notifySubscribers();
  }

  handleRaceTimeUpdate(raceTime: IRaceTime): void {
    if (!raceTime) return;

    if (this._raceState === RaceState.RACE_OVER) {
      this._autoStartRemaining = 0;
      this._autoAdvanceRemaining = 0;
      this._time = 0;
      this.previousTime = 0;
      this._timeFormat = "1.0-0";
      this.notifySubscribers();
      return;
    }

    if (
      this._raceState === RaceState.NOT_STARTED ||
      this._raceState === RaceState.UNKNOWN_STATE ||
      this._raceState === RaceState.STARTING
    ) {
      this._autoStartRemaining = raceTime.autoStartRemaining || 0;
    } else {
      this._autoStartRemaining = 0;
    }

    const race = this.raceService?.getRace();
    if (
      this._raceState === RaceState.HEAT_OVER ||
      this._raceState === RaceState.UNKNOWN_STATE
    ) {
      this._autoAdvanceRemaining =
        raceTime.autoAdvanceRemaining ||
        (race as any)?.auto_advance_remaining_seconds ||
        0;
    } else {
      this._autoAdvanceRemaining = 0;
    }

    const actualRaceTime = raceTime.time || 0;
    let time = actualRaceTime;
    if (
      (this._raceState === RaceState.NOT_STARTED ||
        this._raceState === RaceState.UNKNOWN_STATE) &&
      this._autoStartRemaining > 0 &&
      !this._isRestarting
    ) {
      time = this._autoStartRemaining;
    } else if (
      (this._raceState === RaceState.HEAT_OVER ||
        this._raceState === RaceState.UNKNOWN_STATE) &&
      this._autoAdvanceRemaining > 0
    ) {
      time = this._autoAdvanceRemaining;
    }

    if (time > this.previousTime) {
      this._timeFormat = "1.0-0";
    } else if (time < this.previousTime) {
      if (this._raceState === RaceState.STARTING) {
        this._timeFormat = "1.0-0";
      } else {
        if (time < this.subsecondThreshold && this.subsecondDecimals > 0) {
          this._timeFormat = `1.${this.subsecondDecimals}-${this.subsecondDecimals}`;
        } else {
          this._timeFormat = "1.0-0";
        }
      }
    } else {
      if (time === 0) this._timeFormat = "1.0-0";
    }

    if (
      time === 0 &&
      this.previousTime > 0 &&
      this._showCountdownOverlay &&
      this._autoStartRemaining <= 0 &&
      this._autoAdvanceRemaining <= 0
    ) {
      time = this.previousTime;
    }

    this._time = time;
    this.previousTime = time;

    this.notifySubscribers();
  }

  handleRaceStateChange(state: RaceState): void {
    if (state === this._raceState) {
      return;
    }

    const previousState = this._raceState;
    this._raceState = state;

    if (state === RaceState.RACE_OVER) {
      this._autoStartRemaining = 0;
      this._autoAdvanceRemaining = 0;
      this._time = 0;
      this.previousTime = 0;
      this._timeFormat = "1.0-0";
    }

    if (
      state !== RaceState.NOT_STARTED &&
      state !== RaceState.UNKNOWN_STATE &&
      state !== RaceState.STARTING
    ) {
      this._autoStartRemaining = 0;
    }
    if (state !== RaceState.HEAT_OVER && state !== RaceState.UNKNOWN_STATE) {
      this._autoAdvanceRemaining = 0;
    }

    if (
      state === RaceState.NOT_STARTED ||
      state === RaceState.UNKNOWN_STATE ||
      state === RaceState.HEAT_OVER ||
      state === RaceState.RACE_OVER ||
      state === RaceState.PAUSED
    ) {
      this._showCountdownOverlay = false;
    }

    if (state === RaceState.STARTING) {
      if (previousState === RaceState.PAUSED) {
        this._isRestarting = true;
      } else if (previousState !== RaceState.STARTING) {
        this._isRestarting = false;
      }
    }

    if (state === RaceState.RACING) {
      if (
        previousState === RaceState.STARTING &&
        this._showCountdownOverlay &&
        !this._isRestarting
      ) {
        const race = this.raceService?.getRace();
        const scoring = race?.heat_scoring;
        if (scoring?.finishMethod === FinishMethod.Timed) {
          this._time = scoring.finishValue;
        }
      }
      this._isRestarting = false;
    }

    this.notifySubscribers();
  }

  get autoStatusLabel(): string {
    if (
      this._raceState === RaceState.RACE_OVER ||
      this._raceState === RaceState.PAUSED ||
      this._raceState === RaceState.RACING ||
      this._raceState === RaceState.STARTING
    ) {
      return "";
    }
    if (
      (this._raceState === RaceState.NOT_STARTED ||
        this._raceState === RaceState.UNKNOWN_STATE) &&
      this._autoStartRemaining > 0
    ) {
      return "RD_AUTO_STARTING";
    }
    if (
      this._raceState === RaceState.HEAT_OVER &&
      this._autoAdvanceRemaining > 0
    ) {
      return "RD_AUTO_ADVANCING";
    }
    return "";
  }

  get isWarmup(): boolean {
    if (
      this._raceState === RaceState.RACE_OVER ||
      this._raceState === RaceState.PAUSED ||
      this._raceState === RaceState.RACING ||
      this._raceState === RaceState.STARTING
    ) {
      return false;
    }
    const race = this.raceService?.getRace();
    if (
      (this._raceState === RaceState.NOT_STARTED ||
        this._raceState === RaceState.UNKNOWN_STATE) &&
      this._autoStartRemaining > 0 &&
      race
    ) {
      const warmupTime = race.auto_start_warmup_time || 0;
      const totalTime = race.auto_start_time || 0;
      if (warmupTime > 0 && totalTime > 0) {
        return totalTime - this._autoStartRemaining < warmupTime;
      }
    }
    if (
      this._raceState === RaceState.HEAT_OVER &&
      this._autoAdvanceRemaining > 0 &&
      race
    ) {
      const warmupTime = race.auto_advance_warmup_time || 0;
      const totalTime = race.auto_advance_time || 0;
      if (warmupTime > 0 && totalTime > 0) {
        return this._autoAdvanceRemaining <= warmupTime;
      }
    }
    return false;
  }

  get formattedTime(): string {
    const s = this._raceState;
    const race = this.raceService?.getRace();

    const showDurationOnly =
      race?.heat_scoring?.finishMethod === FinishMethod.Timed &&
      ((s === RaceState.NOT_STARTED &&
        this._autoStartRemaining <= 0 &&
        this._autoAdvanceRemaining <= 0) ||
        (s === RaceState.STARTING &&
          this._showCountdownOverlay &&
          !this._isRestarting));

    if (showDurationOnly) {
      const duration = race?.heat_scoring?.finishValue || 0;

      const hoursD = Math.floor(duration / 3600);
      const minutesD = Math.floor((duration % 3600) / 60);
      const secondsD = Math.floor(duration % 60);

      if (hoursD > 0) {
        return `${hoursD}:${minutesD.toString().padStart(2, "0")}:${secondsD
          .toString()
          .padStart(2, "0")}`;
      }
      if (minutesD > 0) {
        return `${minutesD}:${secondsD.toString().padStart(2, "0")}`;
      }
      return `${secondsD}`;
    }

    if (
      (s === RaceState.NOT_STARTED || s === RaceState.UNKNOWN_STATE) &&
      this._autoStartRemaining <= 0 &&
      this._autoAdvanceRemaining <= 0
    ) {
      return "--";
    }

    const time = this._time || 0;

    if ((s === RaceState.HEAT_OVER || s === RaceState.RACE_OVER) && time <= 0) {
      return "0";
    }
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    let base = "";
    if (hours > 0) {
      base = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else if (minutes > 0) {
      base = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    } else {
      base = `${seconds}`;
    }

    const parts = this._timeFormat.split(".");
    const fractionDigits =
      parts.length > 1 ? Number(parts[1].split("-")[1]) : 0;

    if (hours === 0 && minutes === 0 && fractionDigits > 0) {
      const formatted = time.toFixed(fractionDigits);
      return formatted;
    }

    return base;
  }

  reset(): void {
    this._time = 0;
    this.previousTime = 0;
    this._autoStartRemaining = 0;
    this._autoAdvanceRemaining = 0;
    this._timeFormat = "1.0-0";
    this._showCountdownOverlay = false;
    this._isRestarting = false;
    this._raceState = RaceState.UNKNOWN_STATE;
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.timeSubject.next(this._time);
    this.raceStateSubject.next(this._raceState);
    this.formattedTimeSubject.next(this.formattedTime);
    this.autoStatusLabelSubject.next(this.autoStatusLabel);
    this.isWarmupSubject.next(this.isWarmup);
  }
}
