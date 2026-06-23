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

  /* eslint-disable max-lines-per-function */
  static fromProto(proto: IRaceModel): Race {
    if (!proto) {
      return new Race(
        "",
        "Unknown Race",
        new Track("", "Unknown Track", 100, [], false, []),
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
      /* eslint-disable max-lines-per-function */
      () => {
        let heatScoring = new HeatScoring();
        if (p.heatScoring) {
          let heatRanking = p.heatScoring.heatRanking;
          if (typeof heatRanking === "number") {
            const methods = [
              HeatRanking.HR_LAP_COUNT,
              HeatRanking.HR_FASTEST_LAP,
              HeatRanking.HR_TOTAL_TIME,
            ];
            heatRanking = methods[heatRanking] || HeatRanking.HR_LAP_COUNT;
          }

          let heatRankingTiebreaker = p.heatScoring.heatRankingTiebreaker;
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

          let allowFinish = p.heatScoring.allowFinish;
          if (typeof allowFinish === "number") {
            const allowFinishes = [
              AllowFinish.AF_NONE,
              AllowFinish.AF_ALLOW,
              AllowFinish.AF_SINGLE_LAP,
              AllowFinish.AF_NONE_AUTO_SEGMENTS,
            ];
            allowFinish = allowFinishes[allowFinish] || AllowFinish.AF_NONE;
          }

          heatScoring = new HeatScoring(
            p.heatScoring.finishMethod === 1
              ? FinishMethod.Timed
              : FinishMethod.Lap,
            p.heatScoring.finishValue ? Number(p.heatScoring.finishValue) : 10,
            heatRanking as unknown as HeatRanking,
            heatRankingTiebreaker as unknown as HeatRankingTiebreaker,
            allowFinish as unknown as AllowFinish,
          );
        }

        let overallScoring = new OverallScoring();
        if (p.overallScoring) {
          let rankingMethod = p.overallScoring.rankingMethod;
          if (typeof rankingMethod === "number") {
            const methods = [
              OverallRanking.OR_LAP_COUNT,
              OverallRanking.OR_FASTEST_LAP,
              OverallRanking.OR_TOTAL_TIME,
              OverallRanking.OR_AVERAGE_LAP,
            ];
            rankingMethod =
              methods[rankingMethod] || OverallRanking.OR_LAP_COUNT;
          }

          let tiebreaker = p.overallScoring.tiebreaker;
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

          overallScoring = new OverallScoring(
            p.overallScoring.droppedHeats || 0,
            rankingMethod as unknown as OverallRanking,
            tiebreaker as unknown as OverallRankingTiebreaker,
          );
        }

        const fuelOptions = AnalogFuelOptionsConverter.fromProto(
          proto.fuelOptions,
        );
        const digitalFuelOptions = DigitalFuelOptionsConverter.fromProto(
          proto.digitalFuelOptions,
        );

        return new Race(
          objectId || "",
          proto.name || "",
          TrackConverter.fromProto(proto.track!),
          (() => {
            const rotationMap = [
              "RoundRobin",
              "FriendlyRoundRobin",
              "EuropeanRoundRobin",
              "SingleHeat",
              "SingleHeatSolo",
            ];
            return typeof proto.heatRotationType === "number"
              ? rotationMap[proto.heatRotationType] || "RoundRobin"
              : proto.heatRotationType || "RoundRobin";
          })(),
          heatScoring,
          overallScoring,
          fuelOptions,
          digitalFuelOptions,
          p.teamOptions
            ? new TeamOptions(
                p.teamOptions.heatLapLimit || 0,
                p.teamOptions.heatTimeLimit || 0,
                p.teamOptions.overallLapLimit || 0,
                p.teamOptions.overallTimeLimit || 0,
                p.teamOptions.requirePitStopChangeDriver || false,
              )
            : new TeamOptions(),
          proto.autoAdvanceTime || 0,
          proto.autoStartTime || 0,
          proto.autoAdvanceWarmupTime || 0,
          proto.autoStartWarmupTime || 0,
          p.driftTime || p.drift_time || 0.5,
          p.minLapTime || p.min_lap_time || 1.5,
          p.startTime || p.start_time || 5.0,
          p.restartTime || p.restart_time || 5.0,
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
          p.falseStartLapPenalty || p.false_start_lap_penalty || 0,
          p.falseStartTimePenalty || p.false_start_time_penalty || 0,
          p.groupOptions || p.group_options
            ? new GroupOptions(
                !!(p.groupOptions?.enabled || p.group_options?.enabled),
                p.groupOptions?.maxGroups || p.group_options?.max_groups || 1,
                !!(
                  p.groupOptions?.balance ??
                  p.group_options?.balance ??
                  false
                ),
                !!(
                  p.groupOptions?.allowEmptyLanes ??
                  p.group_options?.allow_empty_lanes ??
                  true
                ),
                !!(
                  p.groupOptions?.forceMultipleOfMax ??
                  p.group_options?.force_multiple_of_max ??
                  false
                ),
                !!(
                  p.groupOptions?.rotateGroupHeats ??
                  p.group_options?.rotate_group_heats ??
                  true
                ),
                p.groupOptions?.minAdvancing ||
                  p.group_options?.min_advancing ||
                  0,
              )
            : new GroupOptions(),
        );
      },
      () => {
        if (!proto.track && !isReference) {
          throw new Error(
            "RaceConverter: proto.track is missing for full Race",
          );
        }
      },
    );
  }
}
