export const RECORD_LABEL_FIELDS = [
  {
    key: "raceRecordLapNickname",
    labelKey: "RD_RECORD_RACE_LAP",
    kind: "holder",
  },
  { key: "raceRecordLapTime", labelKey: "RD_RECORD_RACE_LAP", kind: "lap" },
  {
    key: "raceRecordScoreNickname",
    labelKey: "RD_RECORD_RACE_SCORE",
    kind: "holder",
  },
  { key: "raceRecordScore", labelKey: "RD_RECORD_RACE_SCORE", kind: "score" },
  {
    key: "currentRaceBestNickname",
    labelKey: "RD_RECORD_CURRENT_RACE_BEST",
    kind: "holder",
  },
  {
    key: "currentRaceBestTime",
    labelKey: "RD_RECORD_CURRENT_RACE_BEST",
    kind: "lap",
  },
  { key: "heatBestNickname", labelKey: "RD_RECORD_HEAT_BEST", kind: "holder" },
  { key: "heatBestTime", labelKey: "RD_RECORD_HEAT_BEST", kind: "lap" },
] as const;

export function getRecordLabelField(key: unknown) {
  return RECORD_LABEL_FIELDS.find((field) => field.key === key);
}
