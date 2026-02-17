package com.antigravity.converters;

import java.util.Set;

public class RaceConverter {
        public static com.antigravity.proto.RaceModel toProto(com.antigravity.models.Race race,
                        com.antigravity.models.Track track,
                        Set<String> sentObjectIds) {
                String key = "Race_" + race.getObjectId();
                if (sentObjectIds.contains(key)) {
                        return com.antigravity.proto.RaceModel.newBuilder()
                                        .setModel(com.antigravity.proto.Model.newBuilder()
                                                        .setEntityId(race.getObjectId()).build())
                                        .build();
                } else {
                        sentObjectIds.add(key);
                        com.antigravity.proto.RaceModel.Builder builder = com.antigravity.proto.RaceModel.newBuilder()
                                        .setModel(com.antigravity.proto.Model.newBuilder()
                                                        .setEntityId(race.getObjectId()).build())
                                        .setName(race.getName())
                                        .setTrack(TrackConverter.toProto(track, sentObjectIds));

                        if (race.getHeatScoring() != null) {
                                com.antigravity.models.HeatScoring scoring = race.getHeatScoring();
                                builder.setHeatScoring(com.antigravity.proto.HeatScoring.newBuilder()
                                                .setFinishMethod(
                                                                com.antigravity.proto.HeatScoring.FinishMethod
                                                                                .valueOf(scoring.getFinishMethod()
                                                                                                .name()))
                                                .setFinishValue(scoring.getFinishValue())
                                                .setHeatRanking(com.antigravity.proto.HeatScoring.HeatRanking
                                                                .valueOf("HR_" + scoring.getHeatRanking().name()))
                                                .setHeatRankingTiebreaker(
                                                                com.antigravity.proto.HeatScoring.HeatRankingTiebreaker
                                                                                .valueOf("HRT_" + scoring
                                                                                                .getHeatRankingTiebreaker()
                                                                                                .name()))
                                                .setAllowFinish(com.antigravity.proto.HeatScoring.AllowFinish
                                                                .valueOf("AF_" + (scoring.getAllowFinish() != null
                                                                                ? scoring.getAllowFinish().name()
                                                                                                .replaceAll("([a-z])([A-Z])",
                                                                                                                "$1_$2")
                                                                                                .toUpperCase()
                                                                                : "NONE")))
                                                .build());
                        }

                        if (race.getOverallScoring() != null) {
                                com.antigravity.models.OverallScoring scoring = race.getOverallScoring();
                                builder.setOverallScoring(com.antigravity.proto.OverallScoring.newBuilder()
                                                .setDroppedHeats(scoring.getDroppedHeats())
                                                .setRankingMethod(com.antigravity.proto.OverallScoring.OverallRanking
                                                                .valueOf("OR_" + scoring.getRankingMethod().name()))
                                                .setTiebreaker(com.antigravity.proto.OverallScoring.OverallRankingTiebreaker
                                                                .valueOf("ORT_" + scoring.getTiebreaker().name()))
                                                .build());
                        }

                        builder.setMinLapTime(race.getMinLapTime());

                        return builder.build();
                }
        }

        public static com.antigravity.proto.Race toProto(com.antigravity.race.Race race,
                        java.util.Set<String> sentObjectIds) {
                return com.antigravity.proto.Race.newBuilder()
                                .setRace(toProto(race.getRaceModel(), race.getTrack(), sentObjectIds))
                                .addAllDrivers(race.getDrivers().stream()
                                                .map(p -> RaceParticipantConverter.toProto(p, sentObjectIds))
                                                .collect(java.util.stream.Collectors.toList()))
                                .addAllHeats(race.getHeats().stream()
                                                .map(h -> HeatConverter.toProto(h, sentObjectIds))
                                                .collect(java.util.stream.Collectors.toList()))
                                .setCurrentHeat(HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
                                .build();
        }
}
