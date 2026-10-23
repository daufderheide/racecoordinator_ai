import { GroupOptions } from "@app/models/group_options";
import {
  AllowFinish,
  FinishMethod,
  HeatRanking,
  HeatRankingTiebreaker,
  HeatScoring,
} from "@app/models/heat_scoring";
import {
  OverallRanking,
  OverallRankingTiebreaker,
  OverallScoring,
} from "@app/models/overall_scoring";
import { Race } from "@app/models/race";
import { TeamOptions } from "@app/models/team_options";
import { Track } from "@app/models/track";
import { IRaceModel } from "@app/proto/antigravity";

import { AnalogFuelOptionsConverter } from "./analog_fuel_options.converter";
import { ConverterCache } from "./converter_cache";
import { DigitalFuelOptionsConverter } from "./digital_fuel_options.converter";
import { TrackConverter } from "./track.converter";

export class RaceConverter {
  private static cache = new ConverterCache<Race>();

  static clearCache() {
    this.cache.clear();
  }

  static fromProto(proto: IRaceModel): Race {
    if (!proto) {
      return new Race(
        "",
        "Unknown Race",
        new Track({
          entity_id: "",
          name: "Unknown Track",
          num_track_sections: 100,
          lanes: [],
          has_digital_fuel: false,
          arduino_configs: [],
        }),
        "RoundRobin",
        new HeatScoring(),
        new OverallScoring(),
      );
    }
    const p = proto as any;
    const objectId = proto.model?.entityId;
    const isReference = !proto.track;

    if (isReference) {
      const cached = this.cache.get(objectId || "");
      if (cached) return cached;
    }

    return this.cache.process(
      objectId,
      isReference,
      () => this.buildRaceFromProto(proto, p, objectId),
      () => {
        if (!proto.track && !isReference) {
          throw new Error(
            "RaceConverter: proto.track is missing for full Race",
          );
        }
      },
    );
  }

  private static buildRaceFromProto(
    proto: IRaceModel,
    p: any,
    objectId?: string | null,
  ): Race {
    const heatScoring = this.parseHeatScoring(p.heatScoring);
    const overallScoring = this.parseOverallScoring(p.overallScoring);
    const fuelOptions = AnalogFuelOptionsConverter.fromProto(proto.fuelOptions);
    const digitalFuelOptions = DigitalFuelOptionsConverter.fromProto(
      proto.digitalFuelOptions,
    );
    const teamOptions = this.parseTeamOptions(p.teamOptions);
    const groupOptions = this.parseGroupOptions(
      p.groupOptions || p.group_options,
    );

    return new Race(
      objectId || "",
      proto.name || "",
      TrackConverter.fromProto(proto.track!),
      this.parseHeatRotationType(proto.heatRotationType),
      heatScoring,
      overallScoring,
      fuelOptions,
      digitalFuelOptions,
      teamOptions,
      proto.autoAdvanceTime || 0,
      proto.autoStartTime || 0,
      proto.autoAdvanceWarmupTime || 0,
      proto.autoStartWarmupTime || 0,
      p.driftTime != null
        ? Number(p.driftTime)
        : p.drift_time != null
          ? Number(p.drift_time)
          : undefined,
      p.minLapTime != null
        ? Number(p.minLapTime)
        : p.min_lap_time != null
          ? Number(p.min_lap_time)
          : undefined,
      p.start_time != null
        ? Number(p.start_time)
        : p.startTime != null
          ? Number(p.startTime)
          : undefined,
      p.restart_time != null
        ? Number(p.restart_time)
        : p.restartTime != null
          ? Number(p.restartTime)
          : undefined,
      p.startRandomizer ||
        p.start_randomizer ||
        p.startDelay ||
        p.start_delay ||
        0.0,
      p.restartRandomizer ||
        p.restart_randomizer ||
        p.restartDelay ||
        p.restart_delay ||
        0.0,
      proto.soloLaneIndex || 0,
      p.customRotationSequence || p.custom_rotation_sequence || [],
      p.customRotationAssetId || p.custom_rotation_asset_id,
      p.customRotations || p.custom_rotations || [],
      p.heatTimesThrough || p.heat_times_through || 1,
      p.reverseHeats || p.reverse_heats || false,
      p.hotStart || p.hot_start || false,
      p.restartOnFalseStart || p.restart_on_false_start || false,
      p.startBehindSensor ?? p.start_behind_sensor ?? true,
      p.startAtCurrent ?? p.start_at_current ?? false,
      p.falseStartLapPenalty || p.false_start_lap_penalty || 0,
      p.falseStartTimePenalty || p.false_start_time_penalty || 0,
      groupOptions,
      p.practice || false,
      p.adjustDriftLaps ?? p.adjust_drift_laps ?? false,
      p.themeId || p.theme_id || undefined,
    );
  }

  private static parseHeatScoring(rawScoring: any): HeatScoring {
    if (!rawScoring) return new HeatScoring();

    let heatRanking = rawScoring.heatRanking;
    if (typeof heatRanking === "number") {
      const methods = [
        HeatRanking.HR_LAP_COUNT,
        HeatRanking.HR_FASTEST_LAP,
        HeatRanking.HR_TOTAL_TIME,
      ];
      heatRanking = methods[heatRanking] || HeatRanking.HR_LAP_COUNT;
    }

    let heatRankingTiebreaker = rawScoring.heatRankingTiebreaker;
    if (typeof heatRankingTiebreaker === "number") {
      const tiebreakers = [
        HeatRankingTiebreaker.HRT_FASTEST_LAP_TIME,
        HeatRankingTiebreaker.HRT_MEDIAN_LAP_TIME,
        HeatRankingTiebreaker.HRT_AVERAGE_LAP_TIME,
      ];
      heatRankingTiebreaker =
        tiebreakers[heatRankingTiebreaker] ||
        HeatRankingTiebreaker.HRT_FASTEST_LAP_TIME;
    }

    let allowFinish = rawScoring.allowFinish;
    if (typeof allowFinish === "number") {
      const allowFinishes = [
        AllowFinish.AF_NONE,
        AllowFinish.AF_ALLOW,
        AllowFinish.AF_SINGLE_LAP,
        AllowFinish.AF_NONE_AUTO_SEGMENTS,
        AllowFinish.AF_SINGLE_LAP_AUTO_SEGMENTS,
      ];
      allowFinish = allowFinishes[allowFinish] || AllowFinish.AF_NONE;
    }

    return new HeatScoring(
      rawScoring.finishMethod === 1 ? FinishMethod.Timed : FinishMethod.Lap,
      rawScoring.finishValue != null ? Number(rawScoring.finishValue) : 0,
      heatRanking as unknown as HeatRanking,
      heatRankingTiebreaker as unknown as HeatRankingTiebreaker,
      allowFinish as unknown as AllowFinish,
    );
  }

  private static parseOverallScoring(rawScoring: any): OverallScoring {
    if (!rawScoring) return new OverallScoring();

    let rankingMethod = rawScoring.rankingMethod;
    if (typeof rankingMethod === "number") {
      const methods = [
        OverallRanking.OR_LAP_COUNT,
        OverallRanking.OR_FASTEST_LAP,
        OverallRanking.OR_TOTAL_TIME,
        OverallRanking.OR_AVERAGE_LAP,
      ];
      rankingMethod = methods[rankingMethod] || OverallRanking.OR_LAP_COUNT;
    }

    let tiebreaker = rawScoring.tiebreaker;
    if (typeof tiebreaker === "number") {
      const tiebreakers = [
        OverallRankingTiebreaker.ORT_FASTEST_LAP_TIME,
        OverallRankingTiebreaker.ORT_MEDIAN_LAP_TIME,
        OverallRankingTiebreaker.ORT_AVERAGE_LAP_TIME,
        OverallRankingTiebreaker.ORT_TOTAL_TIME,
      ];
      tiebreaker =
        tiebreakers[tiebreaker] ||
        OverallRankingTiebreaker.ORT_FASTEST_LAP_TIME;
    }

    return new OverallScoring(
      rawScoring.droppedHeats || 0,
      rankingMethod as unknown as OverallRanking,
      tiebreaker as unknown as OverallRankingTiebreaker,
    );
  }

  private static parseTeamOptions(rawOptions: any): TeamOptions {
    if (!rawOptions) return new TeamOptions();
    return new TeamOptions(
      rawOptions.heatLapLimit || 0,
      rawOptions.heatTimeLimit || 0,
      rawOptions.overallLapLimit || 0,
      rawOptions.overallTimeLimit || 0,
      rawOptions.requirePitStopChangeDriver || false,
    );
  }

  private static parseHeatRotationType(heatRotationType: any): string {
    const rotationMap = [
      "RoundRobin",
      "FriendlyRoundRobin",
      "EuropeanRoundRobin",
      "SingleHeat",
      "SingleHeatSolo",
      "CustomRoundRobin",
      "Custom",
      "SingleHeatSoloAllLanes",
      "SingleHeatSoloAllLanesAccumulate",
    ];
    return typeof heatRotationType === "number"
      ? rotationMap[heatRotationType] || "RoundRobin"
      : heatRotationType || "RoundRobin";
  }

  private static parseGroupOptions(rawGroup: any): GroupOptions {
    if (!rawGroup) return new GroupOptions();
    return new GroupOptions(
      Boolean(rawGroup.enabled),
      rawGroup.maxGroups || rawGroup.max_groups || 1,
      Boolean(rawGroup.balance ?? false),
      Boolean(rawGroup.allowEmptyLanes ?? rawGroup.allow_empty_lanes ?? true),
      Boolean(
        rawGroup.forceMultipleOfMax ?? rawGroup.force_multiple_of_max ?? false,
      ),
      Boolean(rawGroup.rotateGroupHeats ?? rawGroup.rotate_group_heats ?? true),
      rawGroup.minAdvancing || rawGroup.min_advancing || 0,
      rawGroup.names || [],
    );
  }
}
