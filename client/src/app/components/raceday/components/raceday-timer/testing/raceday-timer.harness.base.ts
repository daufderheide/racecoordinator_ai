export abstract class RacedayTimerHarnessBase {
  static readonly hostSelector = "app-raceday-timer";

  static readonly selectors = {
    timerText: ".timer-text",
    statusLabel: ".status-label",
    warmupLabel: ".warmup-label",
    cooldownLabel: ".cooldown-label",
  };

  abstract getTimeText(): Promise<string>;
  abstract getStatusLabel(): Promise<string | null>;
  abstract getWarmupLabel(): Promise<string | null>;
  abstract getCooldownLabel(): Promise<string | null>;
}
