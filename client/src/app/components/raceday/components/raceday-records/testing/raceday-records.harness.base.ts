export abstract class RacedayRecordsHarnessBase {
  static readonly hostSelector = "app-raceday-records";

  static readonly selectors = {
    recordRow: ".record-row",
    recordVal: ".record-val",
  };

  abstract getRecordRowValues(
    index: number,
  ): Promise<{ nickname: string; score: string }>;
}
