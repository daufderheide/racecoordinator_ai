package com.antigravity.converters;

import com.antigravity.models.Race;
import com.antigravity.proto.Model;
import com.antigravity.proto.RaceModel;
import com.antigravity.proto.TrackModel;
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

                        if (race.getRaceScoring() != null) {
                                com.antigravity.models.RaceScoring scoring = race.getRaceScoring();
                                builder.setRaceScoring(com.antigravity.proto.RaceScoring.newBuilder()
                                                .setFinishMethod(
                                                                com.antigravity.proto.RaceScoring.FinishMethod
                                                                                .valueOf(scoring.getFinishMethod()
                                                                                                .name()))
                                                .setFinishValue(scoring.getFinishValue())
                                                .setHeatRanking(com.antigravity.proto.RaceScoring.HeatRanking
                                                                .valueOf(scoring.getHeatRanking().name()))
                                                .setHeatRankingTiebreaker(
                                                                com.antigravity.proto.RaceScoring.TieBreaker
                                                                                .valueOf(scoring.getHeatRankingTiebreaker()
                                                                                                .name()))
                                                .build());
                        }

                        return builder.build();
                }
        }

        public static com.antigravity.proto.Race toProto(com.antigravity.race.Race race,
                        java.util.Set<String> sentObjectIds) {
                return com.antigravity.proto.Race.newBuilder()
                                .setRace(toProto(race.getRaceModel(), race.getTrack(), sentObjectIds))
                                .addAllDrivers(race.getDrivers().stream()
                                                .map(p -> DriverConverter.toProto(p.getDriver(), sentObjectIds))
                                                .collect(java.util.stream.Collectors.toList()))
                                .addAllHeats(race.getHeats().stream()
                                                .map(h -> HeatConverter.toProto(h, sentObjectIds))
                                                .collect(java.util.stream.Collectors.toList()))
                                .setCurrentHeat(HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
                                .build();
        }
}
