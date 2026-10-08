import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";

export interface UIEditorState {
  settings: Settings;
  themes: Theme[];
  customUIs?: CustomUI[];
}

export const BASE_AVAILABLE_COLUMNS: readonly {
  key: string;
  label: string;
}[] = [
  { key: "driver.name", label: "RD_COL_NAME" },
  { key: "driver.nickname", label: "RD_COL_NICKNAME" },
  { key: "driver.avatarUrl", label: "RD_COL_AVATAR" },
  { key: "lapCount", label: "UI_EDITOR_COL_HEAT_LAPS" },
  { key: "physicalLapCount", label: "UI_EDITOR_COL_HEAT_RAW_LAPS" },
  { key: "lapsLed", label: "UI_EDITOR_COL_HEAT_LAPS_LED" },
  { key: "trackCalls", label: "UI_EDITOR_COL_HEAT_TRACK_CALLS" },
  { key: "reactionTime", label: "RD_COL_REACTION_TIME" },
  { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
  { key: "lastLaps", label: "RD_COL_LAST_LAPS" },
  { key: "medianLapTime", label: "UI_EDITOR_COL_HEAT_MEDIAN_LAP" },
  { key: "averageLapTime", label: "UI_EDITOR_COL_HEAT_AVG_LAP" },
  { key: "bestLapTime", label: "UI_EDITOR_COL_HEAT_BEST_LAP" },
  { key: "bestRaceLapTime", label: "RD_COL_BEST_RACE_LAP_TIME" },
  { key: "recordLapTime", label: "RD_COL_RECORD_LAP_TIME" },
  { key: "standardDeviation", label: "UI_EDITOR_COL_HEAT_STD_DEV" },
  { key: "consistencyScore", label: "UI_EDITOR_COL_HEAT_CONSISTENCY" },
  { key: "averageTop5", label: "UI_EDITOR_COL_HEAT_AVG_TOP_5" },
  { key: "averageTop10", label: "UI_EDITOR_COL_HEAT_AVG_TOP_10" },
  { key: "averageTop15", label: "UI_EDITOR_COL_HEAT_AVG_TOP_15" },
  { key: "top2Consecutive", label: "UI_EDITOR_COL_HEAT_TOP_2_CONSECUTIVE" },
  { key: "top3Consecutive", label: "UI_EDITOR_COL_HEAT_TOP_3_CONSECUTIVE" },
  { key: "totalTime", label: "UI_EDITOR_COL_HEAT_TOTAL_TIME" },
  { key: "gapLeader", label: "UI_EDITOR_COL_HEAT_GAP_LEADER" },
  { key: "gapPosition", label: "UI_EDITOR_COL_HEAT_GAP_POSITION" },
  { key: "gapLeaderF1", label: "UI_EDITOR_COL_HEAT_GAP_LEADER_F1" },
  { key: "gapPositionF1", label: "UI_EDITOR_COL_HEAT_GAP_POSITION_F1" },
  { key: "seed", label: "RD_COL_SEED" },
  { key: "rankHeat", label: "RD_COL_RANK_HEAT" },
  { key: "rankOverall", label: "RD_COL_RANK_OVERALL" },
  { key: "rankGroup", label: "RD_COL_RANK_GROUP" },
  { key: "winProbability", label: "RD_COL_WIN_PROB" },
  { key: "projectedRank", label: "RD_COL_PROJ_RANK" },
  { key: "projectedLaps", label: "RD_COL_PROJ_LAPS" },
  { key: "overallLapCount", label: "RD_COL_OVERALL_LAP" },
  { key: "overallPhysicalLapCount", label: "UI_EDITOR_COL_OVERALL_LAP_COUNT" },
  { key: "overallTotalTime", label: "RD_COL_OVERALL_TOTAL_TIME" },
  { key: "overallBestLapTime", label: "RD_COL_OVERALL_BEST_LAP" },
  { key: "overallAverageLapTime", label: "RD_COL_OVERALL_AVG_LAP" },
  { key: "overallMedianLapTime", label: "RD_COL_OVERALL_MEDIAN_LAP" },
  { key: "overallConsistencyScore", label: "RD_COL_OVERALL_CONSISTENCY" },
  { key: "overallStandardDeviation", label: "RD_COL_OVERALL_STD_DEV" },
  { key: "overallAverageTop5", label: "RD_COL_OVERALL_AVG_TOP_5" },
  { key: "overallAverageTop10", label: "RD_COL_OVERALL_AVG_TOP_10" },
  { key: "overallAverageTop15", label: "RD_COL_OVERALL_AVG_TOP_15" },
  { key: "overallTop2Consecutive", label: "RD_COL_OVERALL_TOP_2_CONSECUTIVE" },
  { key: "overallTop3Consecutive", label: "RD_COL_OVERALL_TOP_3_CONSECUTIVE" },
  { key: "overallGapLeader", label: "UI_EDITOR_COL_OVERALL_GAP_LEADER" },
  { key: "overallGapPosition", label: "UI_EDITOR_COL_OVERALL_GAP_POSITION" },
  { key: "overallGapLeaderF1", label: "UI_EDITOR_COL_OVERALL_GAP_LEADER_F1" },
  {
    key: "overallGapPositionF1",
    label: "UI_EDITOR_COL_OVERALL_GAP_POSITION_F1",
  },
  { key: "overallLapsLed", label: "RD_COL_OVERALL_LAPS_LED" },
  { key: "overallTrackCalls", label: "RD_COL_OVERALL_TRACK_CALLS" },
  { key: "overallPoints", label: "RD_COL_OVERALL_POINTS" },
  { key: "participant.team.name", label: "RD_COL_TEAM" },
  { key: "participant.fuelLevel", label: "RD_COL_FUEL_LEVEL" },
  { key: "fuelCapacity", label: "RD_COL_FUEL_CAPACITY" },
  { key: "fuelPercentage", label: "RD_COL_FUEL_PERCENTAGE" },
  { key: "imageset_fuel-gauge-builtin", label: "RD_COL_FUEL_GAUGE" },
  { key: "mph", label: "RD_COL_MPH" },
  { key: "kph", label: "RD_COL_KPH" },
  { key: "fph", label: "RD_COL_FPH" },
  { key: "segmentTime", label: "RD_COL_SEGMENT_TIME" },
  { key: "flag", label: "RD_COL_DRIVER_FLAG" },
  { key: "qrCode", label: "RD_COL_LANE_QR" },
  { key: "driverViewQrCode", label: "RD_COL_DRIVER_VIEW_QR" },
  { key: "laneNumber", label: "RD_COL_LANE" },
  { key: "ghostPacing", label: "RD_COL_GHOST_PACING_LANE_RECORD" },
  { key: "ghostPacingPB", label: "RD_COL_GHOST_PACING_PERSONAL_BEST" },
  {
    key: "ghostPacingPersonalAvg",
    label: "RD_COL_GHOST_PACING_PERSONAL_AVG",
  },
  {
    key: "ghostPacingPersonalMedian",
    label: "RD_COL_GHOST_PACING_PERSONAL_MEDIAN",
  },
  {
    key: "ghostPacingLeaderAvg",
    label: "RD_COL_GHOST_PACING_LEADER_AVG",
  },
  {
    key: "ghostPacingLeaderMedian",
    label: "RD_COL_GHOST_PACING_LEADER_MEDIAN",
  },
  {
    key: "ghostPacingLeaderBest",
    label: "RD_COL_GHOST_PACING_LEADER_BEST",
  },
];

export const AVAILABLE_TRANSITIONS = [
  { key: "none", label: "UE_TRANSITION_NONE" },
  { key: "random", label: "UE_TRANSITION_RANDOM" },
  { key: "slide", label: "UE_TRANSITION_SLIDE" },
  { key: "zoom", label: "UE_TRANSITION_ZOOM" },
  { key: "blur", label: "UE_TRANSITION_BLUR" },
  { key: "fade", label: "UE_TRANSITION_FADE" },
];

export const DEFAULT_SECTIONS_EXPANDED: Record<string, boolean> = {
  customUIs: true,
  ui_default_ui_layout_rc_ai: true,
  ui_practice_ui_layout_rc_ai: false,
  racedayLayout: true,
  practiceRacedayLayout: false,
  layout: true,
  themes: true,
  config: true,
  audioSettings: true,
  flags: true,
  countdown: false,
  fuelGauge: false,
  audio: false,
};

export const MAIN_AUDIO_SLOTS: {
  key: string;
  label: string;
  mode: "single" | "set";
  helpId: string;
}[] = [
  {
    key: "audio.yellowflag",
    label: "UE_LABEL_YELLOW_FLAG_AUDIO",
    mode: "single",
    helpId: "help-audio-yellowflag",
  },
  {
    key: "audio.countdown",
    label: "UE_LABEL_COUNTDOWN_AUDIO",
    mode: "set",
    helpId: "help-audio-countdown",
  },
  {
    key: "audio.seconds_left",
    label: "UE_LABEL_SECONDS_LEFT_AUDIO",
    mode: "set",
    helpId: "help-audio-seconds-left",
  },
  {
    key: "audio.laps_left",
    label: "UE_LABEL_LAPS_LEFT_AUDIO",
    mode: "set",
    helpId: "help-audio-laps-left",
  },
  {
    key: "audio.auto_start",
    label: "UE_LABEL_AUTO_START_AUDIO",
    mode: "set",
    helpId: "help-audio-auto-start",
  },
  {
    key: "audio.auto_advance",
    label: "UE_LABEL_AUTO_ADVANCE_AUDIO",
    mode: "set",
    helpId: "help-audio-auto-advance",
  },
  {
    key: "audio.seconds_left.halfway",
    label: "UE_LABEL_SECONDS_LEFT_HALFWAY",
    mode: "single",
    helpId: "help-audio-halfway",
  },
  {
    key: "audio.heat_over",
    label: "UE_LABEL_HEAT_OVER_AUDIO",
    mode: "single",
    helpId: "help-audio-heat-over",
  },
  {
    key: "audio.race_over",
    label: "UE_LABEL_RACE_OVER_AUDIO",
    mode: "single",
    helpId: "help-audio-race-over",
  },
  {
    key: "audio.min_lap_time",
    label: "UE_LABEL_MIN_LAP_TIME_AUDIO",
    mode: "single",
    helpId: "help-audio-min-lap-time",
  },
  {
    key: "audio.drift_lap",
    label: "UE_LABEL_DRIFT_LAP_AUDIO",
    mode: "single",
    helpId: "help-audio-drift-lap",
  },
];
