import {
  AllowFinish,
  FinishMethod,
  HeatRanking,
  HeatRankingTiebreaker,
  HeatScoring,
} from "src/app/models/heat_scoring";
import {
  OverallRanking,
  OverallRankingTiebreaker,
  OverallScoring,
} from "src/app/models/overall_scoring";
import { Race } from "src/app/models/race";
import { TeamOptions } from "src/app/models/team_options";
import { Track } from "src/app/models/track";
import { com } from "src/app/proto/message";

import { AnalogFuelOptionsConverter } from "./analog_fuel_options.converter";
import { ConverterCache } from "./converter_cache";
import { DigitalFuelOptionsConverter } from "./digital_fuel_options.converter";
import { TrackConverter } from "./track.converter";

export class RaceConverter {
  private static cache = new ConverterCache<Race>();

  static clearCache() {
    this.cache.clear();
  }

  static fromProto(proto: com.antigravity.IRaceModel): Race {
    if (!proto) {
      return new Race(
        "",
        "Unknown Race",
        new Track("", "Unknown Track", [], false, []),
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
          p.driftTime !== undefined
            ? p.driftTime
            : p.drift_time !== undefined
              ? p.drift_time
              : 0.5,
          p.minLapTime !== undefined
            ? p.minLapTime
            : p.min_lap_time !== undefined
              ? p.min_lap_time
              : 1.5,
          p.startTime !== undefined
            ? p.startTime
            : p.start_time !== undefined
              ? p.start_time
              : 5.0,
          p.restartTime !== undefined
            ? p.restartTime
            : p.restart_time !== undefined
              ? p.restart_time
              : 5.0,
          p.startDelay !== undefined
            ? p.startDelay
            : p.start_delay !== undefined
              ? p.start_delay
              : 0.0,
          p.restartDelay !== undefined
            ? p.restartDelay
            : p.restart_delay !== undefined
              ? p.restart_delay
              : 0.0,
          proto.soloLaneIndex || 0,
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
