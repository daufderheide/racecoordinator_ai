import { DriverAudioSlot } from "@app/components/driver-editor/driver-editor.helper";

export interface DriverAudioConfigItem {
  key: string;
  slot: DriverAudioSlot;
  labelKey: string;
  elementId: string;
  mode?: "single" | "set";
}

export interface DriverAudioConfigGroup {
  groupId: string;
  titleKey: string;
  items: DriverAudioConfigItem[];
}

export const DRIVER_AUDIO_GROUPS: readonly DriverAudioConfigGroup[] = [
  {
    groupId: "driver-personal-lap-group",
    titleKey: "DE_GROUP_PERSONAL_LAP_SOUNDS",
    items: [
      {
        key: "lapAudio",
        slot: "lap",
        labelKey: "DE_LABEL_LAP_SOUND",
        elementId: "driver-lap-audio",
      },
      {
        key: "bestLapAudio",
        slot: "bestLap",
        labelKey: "DE_LABEL_PERSONAL_BEST_LAP_SOUND",
        elementId: "driver-best-lap-audio",
      },
    ],
  },
  {
    groupId: "driver-race-best-lap-group",
    titleKey: "DE_GROUP_RACE_LAP_SOUNDS",
    items: [
      {
        key: "raceBestLapAudio",
        slot: "raceBestLap",
        labelKey: "DE_LABEL_RACE_BEST_LAP_SOUND",
        elementId: "driver-race-best-lap-audio",
      },
      {
        key: "raceLaneBestLapAudio",
        slot: "raceLaneBestLap",
        labelKey: "DE_LABEL_RACE_LANE_BEST_LAP_SOUND",
        elementId: "driver-race-lane-best-lap-audio",
      },
      {
        key: "heatBestLapAudio",
        slot: "heatBestLap",
        labelKey: "DE_LABEL_HEAT_BEST_LAP_SOUND",
        elementId: "driver-heat-best-lap-audio",
      },
      {
        key: "newRaceLeaderAudio",
        slot: "newRaceLeader",
        labelKey: "DE_LABEL_NEW_RACE_LEADER_SOUND",
        elementId: "driver-new-race-leader-audio",
      },
      {
        key: "newHeatLeaderAudio",
        slot: "newHeatLeader",
        labelKey: "DE_LABEL_NEW_HEAT_LEADER_SOUND",
        elementId: "driver-new-heat-leader-audio",
      },
    ],
  },
  {
    groupId: "driver-overall-best-lap-group",
    titleKey: "DE_GROUP_OVERALL_BEST_LAP_SOUNDS",
    items: [
      {
        key: "overallBestLapAudio",
        slot: "overallBestLap",
        labelKey: "DE_LABEL_OVERALL_BEST_LAP_SOUND",
        elementId: "driver-overall-best-lap-audio",
      },
      {
        key: "overallLaneBestLapAudio",
        slot: "overallLaneBestLap",
        labelKey: "DE_LABEL_OVERALL_LANE_BEST_LAP_SOUND",
        elementId: "driver-overall-lane-best-lap-audio",
      },
    ],
  },
  {
    groupId: "driver-event-sounds-group",
    titleKey: "DE_GROUP_EVENT_SOUNDS",
    items: [
      {
        key: "pitInAudio",
        slot: "pitIn",
        labelKey: "DE_LABEL_PIT_IN_SOUND",
        elementId: "driver-pit-in-audio",
      },
      {
        key: "fuelAudio",
        slot: "fuel",
        labelKey: "DE_LABEL_FUEL_SOUND",
        elementId: "driver-fuel-audio",
        mode: "set",
      },
      {
        key: "penaltyAudio",
        slot: "falseStart",
        labelKey: "DE_LABEL_FALSE_START_SOUND",
        elementId: "driver-false-start-audio",
      },
      {
        key: "driftLapAudio",
        slot: "driftLap",
        labelKey: "DE_LABEL_DRIFT_LAP_SOUND",
        elementId: "driver-drift-lap-audio",
      },
    ],
  },
];
