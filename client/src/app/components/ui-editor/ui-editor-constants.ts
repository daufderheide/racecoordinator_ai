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
  { key: "lapCount", label: "RD_COL_LAP" },
  { key: "lapsLed", label: "RD_COL_LAPS_LED" },
  { key: "reactionTime", label: "RD_COL_REACTION_TIME" },
  { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
  { key: "lastLaps", label: "RD_COL_LAST_LAPS" },
  { key: "medianLapTime", label: "RD_COL_MEDIAN_LAP" },
  { key: "averageLapTime", label: "RD_COL_AVG_LAP" },
  { key: "bestLapTime", label: "RD_COL_BEST_LAP" },
  { key: "recordLapTime", label: "RD_COL_RECORD_LAP_TIME" },
  { key: "totalTime", label: "RD_COL_TOTAL_TIME" },
  { key: "gapLeader", label: "UI_EDITOR_COL_GAP_LEADER" },
  { key: "gapPosition", label: "UI_EDITOR_COL_GAP_POSITION" },
  { key: "gapLeaderF1", label: "UI_EDITOR_COL_GAP_LEADER_F1" },
  { key: "gapPositionF1", label: "UI_EDITOR_COL_GAP_POSITION_F1" },
  { key: "seed", label: "RD_COL_SEED" },
  { key: "rankHeat", label: "RD_COL_RANK_HEAT" },
  { key: "rankOverall", label: "RD_COL_RANK_OVERALL" },
  { key: "rankGroup", label: "RD_COL_RANK_GROUP" },
  { key: "winProbability", label: "RD_COL_WIN_PROB" },
  { key: "projectedRank", label: "RD_COL_PROJ_RANK" },
  { key: "projectedLaps", label: "RD_COL_PROJ_LAPS" },
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
