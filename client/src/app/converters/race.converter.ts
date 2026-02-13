import { Race } from "../models/race";
import { com } from "../proto/message";
import { TrackConverter } from "./track.converter";
import { ConverterCache } from "./converter_cache";
import { HeatScoring, FinishMethod, HeatRanking, HeatRankingTiebreaker, AllowFinish } from "../models/heat_scoring";
import { OverallScoring, OverallRanking, OverallRankingTiebreaker } from "../models/overall_scoring";

export class RaceConverter {
    private static cache = new ConverterCache<Race>();

    static clearCache() {
        this.cache.clear();
    }

    static fromProto(proto: com.antigravity.IRaceModel): Race {
        const p = proto as any;
        const objectId = proto.model?.entityId;
        const isReference = !proto.track;

        return this.cache.process(
            objectId,
            isReference,
            () => {
                let heatScoring = new HeatScoring();
                if (p.heatScoring) {
                    let heatRanking = p.heatScoring.heatRanking;
                    if (typeof heatRanking === 'number') {
                        const methods = [HeatRanking.HR_LAP_COUNT, HeatRanking.HR_FASTEST_LAP, HeatRanking.HR_TOTAL_TIME];
                        heatRanking = methods[heatRanking] || HeatRanking.HR_LAP_COUNT;
                    }

                    let heatRankingTiebreaker = p.heatScoring.heatRankingTiebreaker;
                    if (typeof heatRankingTiebreaker === 'number') {
                        const tiebreakers = [HeatRankingTiebreaker.HRT_FASTEST_LAP_TIME, HeatRankingTiebreaker.HRT_MEDIAN_LAP_TIME, HeatRankingTiebreaker.HRT_AVERAGE_LAP_TIME];
                        heatRankingTiebreaker = tiebreakers[heatRankingTiebreaker] || HeatRankingTiebreaker.HRT_FASTEST_LAP_TIME;
                    }

                    let allowFinish = p.heatScoring.allowFinish;
                    if (typeof allowFinish === 'number') {
                        const allowFinishes = [AllowFinish.AF_NONE, AllowFinish.AF_ALLOW, AllowFinish.AF_SINGLE_LAP];
                        allowFinish = allowFinishes[allowFinish] || AllowFinish.AF_NONE;
                    }

                    heatScoring = new HeatScoring(
                        p.heatScoring.finishMethod === 1 ? FinishMethod.Timed : FinishMethod.Lap,
                        p.heatScoring.finishValue ? Number(p.heatScoring.finishValue) : 10,
                        heatRanking as unknown as HeatRanking,
                        heatRankingTiebreaker as unknown as HeatRankingTiebreaker,
                        allowFinish as unknown as AllowFinish
                    );
                }

                let overallScoring = new OverallScoring();
                if (p.overallScoring) {
                    let rankingMethod = p.overallScoring.rankingMethod;
                    if (typeof rankingMethod === 'number') {
                        const methods = [OverallRanking.OR_LAP_COUNT, OverallRanking.OR_FASTEST_LAP, OverallRanking.OR_TOTAL_TIME, OverallRanking.OR_AVERAGE_LAP];
                        rankingMethod = methods[rankingMethod] || OverallRanking.OR_LAP_COUNT;
                    }

                    let tiebreaker = p.overallScoring.tiebreaker;
                    if (typeof tiebreaker === 'number') {
                        const tiebreakers = [OverallRankingTiebreaker.ORT_FASTEST_LAP_TIME, OverallRankingTiebreaker.ORT_MEDIAN_LAP_TIME, OverallRankingTiebreaker.ORT_AVERAGE_LAP_TIME, OverallRankingTiebreaker.ORT_TOTAL_TIME];
                        tiebreaker = tiebreakers[tiebreaker] || OverallRankingTiebreaker.ORT_FASTEST_LAP_TIME;
                    }

                    overallScoring = new OverallScoring(
                        p.overallScoring.droppedHeats || 0,
                        rankingMethod as unknown as OverallRanking,
                        tiebreaker as unknown as OverallRankingTiebreaker
                    );
                }

                return new Race(
                    objectId || '',
                    proto.name || '',
                    TrackConverter.fromProto(proto.track!),
                    heatScoring,
                    overallScoring
                );
            },
            () => {
                if (!proto.track) {
                    if (!objectId) {
                        throw new Error("RaceConverter: proto.track is undefined and no objectId");
                    }
                    throw new Error("RaceConverter: proto.track is undefined for new/full Race");
                }
            }
        );
    }
}
