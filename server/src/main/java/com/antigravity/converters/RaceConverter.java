package com.antigravity.converters;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.DigitalFuelOptions;
import com.antigravity.models.FuelOptions;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Track;
import com.antigravity.proto.SeasonStanding;
import com.antigravity.util.SeasonPointsCalculator;
import com.antigravity.util.SeasonPointsCalculator.DriverRaceScoreDetail;
import com.antigravity.util.SeasonPointsCalculator.DriverSeasonStanding;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class RaceConverter {

  @SuppressWarnings("checkstyle:MethodLength")
  public static com.antigravity.proto.RaceModel toProto( // fqn-collision
      Race race, Track track, Set<String> sentObjectIds) { // fqn-collision
    String key = "Race_" + race.getObjectId();
    if (sentObjectIds.contains(key)) {
      return com.antigravity.proto.RaceModel.newBuilder() // fqn-collision
          .setModel(
              (com.antigravity.proto.Model) // fqn-collision
                  com.antigravity.proto.Model.newBuilder() // fqn-collision
                      .setEntityId(race.getObjectId())
                      .build()) // fqn-collision
          .build();
    } else {
      sentObjectIds.add(key);
      com.antigravity.proto.RaceModel.Builder builder = // fqn-collision
          com.antigravity.proto.RaceModel.newBuilder() // fqn-collision
              .setModel(
                  (com.antigravity.proto.Model) // fqn-collision
                      com.antigravity.proto.Model.newBuilder() // fqn-collision
                          .setEntityId(race.getObjectId())
                          .build()) // fqn-collision
              .setName(race.getName())
              .setTrack(TrackConverter.toProto(track, sentObjectIds));

      if (race.getHeatScoring() != null) {
        HeatScoring scoring = race.getHeatScoring();
        builder.setHeatScoring(
            com.antigravity.proto.HeatScoring.newBuilder() // fqn-collision
                .setFinishMethod(
                    com.antigravity.proto.HeatScoring.FinishMethod // fqn-collision
                        .valueOf(scoring.getFinishMethod().name()))
                .setFinishValue(scoring.getFinishValue())
                .setHeatRanking(
                    com.antigravity.proto.HeatScoring.HeatRanking // fqn-collision
                        .valueOf("HR_" + scoring.getHeatRanking().name()))
                .setHeatRankingTiebreaker(
                    com.antigravity.proto.HeatScoring.HeatRankingTiebreaker // fqn-collision
                        .valueOf("HRT_" + scoring.getHeatRankingTiebreaker().name()))
                .setAllowFinish(
                    com.antigravity.proto.HeatScoring.AllowFinish // fqn-collision
                        .valueOf(
                        "AF_"
                            + (scoring.getAllowFinish() != null
                                ? scoring
                                    .getAllowFinish()
                                    .name()
                                    .replaceAll("([a-z])([A-Z])", "$1_$2")
                                    .toUpperCase()
                                : "NONE")))
                .build());
      }

      if (race.getOverallScoring() != null) {
        OverallScoring scoring = race.getOverallScoring();
        builder.setOverallScoring(
            com.antigravity.proto.OverallScoring.newBuilder() // fqn-collision
                .setDroppedHeats(scoring.getDroppedHeats())
                .setRankingMethod(
                    com.antigravity.proto.OverallScoring.OverallRanking // fqn-collision
                        .valueOf("OR_" + scoring.getRankingMethod().name()))
                .setTiebreaker(
                    com.antigravity.proto.OverallScoring.OverallRankingTiebreaker // fqn-collision
                        .valueOf("ORT_" + scoring.getTiebreaker().name()))
                .build());
      }

      builder.setMinLapTime(race.getMinLapTime());

      if (race.getFuelOptions() != null) {
        AnalogFuelOptions fuel = race.getFuelOptions();
        builder.setFuelOptions(
            com.antigravity.proto.AnalogFuelOptions.newBuilder() // fqn-collision
                .setEnabled(fuel.isEnabled())
                .setResetFuelAtHeatStart(fuel.isResetFuelAtHeatStart())
                .setEndHeatOnOutOfFuel(
                    fuel.getOutOfFuelAction() == FuelOptions.OutOfFuelAction.END_HEAT)
                .setOutOfFuelAction(
                    com.antigravity.proto.OutOfFuelAction.valueOf( // fqn-collision
                        fuel.getOutOfFuelAction().name()))
                .setCapacity(fuel.getCapacity())
                .setUsageType(
                    com.antigravity.proto.FuelUsageType.valueOf( // fqn-collision
                        fuel.getUsageType().name())) // fqn-collision
                .setUsageRate(fuel.getUsageRate())
                .setStartLevel(fuel.getStartLevel())
                .setRefuelRate(fuel.getRefuelRate())
                .setPitStopDelay(fuel.getPitStopDelay())
                .setReferenceTime(fuel.getReferenceTime())
                .setPowerStutterOnTime(fuel.getPowerStutterOnTime())
                .setPowerStutterOffTime(fuel.getPowerStutterOffTime())
                .build());
      }

      if (race.getDigitalFuelOptions() != null) {
        DigitalFuelOptions fuel = race.getDigitalFuelOptions();
        builder.setDigitalFuelOptions(
            com.antigravity.proto.DigitalFuelOptions.newBuilder() // fqn-collision
                .setEnabled(fuel.isEnabled())
                .setResetFuelAtHeatStart(fuel.isResetFuelAtHeatStart())
                .setEndHeatOnOutOfFuel(
                    fuel.getOutOfFuelAction() == FuelOptions.OutOfFuelAction.END_HEAT)
                .setOutOfFuelAction(
                    com.antigravity.proto.OutOfFuelAction.valueOf( // fqn-collision
                        fuel.getOutOfFuelAction().name()))
                .setCapacity(fuel.getCapacity())
                .setUsageType(
                    com.antigravity.proto.FuelUsageType.valueOf( // fqn-collision
                        fuel.getUsageType().name())) // fqn-collision
                .setUsageRate(fuel.getUsageRate())
                .setStartLevel(fuel.getStartLevel())
                .setRefuelRate(fuel.getRefuelRate())
                .setPitStopDelay(fuel.getPitStopDelay())
                .build());
      }
      if (race.getTeamOptions() != null) {
        TeamOptions options = race.getTeamOptions();
        builder.setTeamOptions(
            com.antigravity.proto.TeamOptions.newBuilder() // fqn-collision
                .setHeatLapLimit(options.getHeatLapLimit())
                .setHeatTimeLimit(options.getHeatTimeLimit())
                .setOverallLapLimit(options.getOverallLapLimit())
                .setOverallTimeLimit(options.getOverallTimeLimit())
                .setRequirePitStopChangeDriver(options.isRequirePitStopChangeDriver())
                .build());
      }
      builder.setAutoAdvanceTime(race.getAutoAdvanceTime());
      builder.setAutoStartTime(race.getAutoStartTime());
      builder.setAutoAdvanceWarmupTime(race.getAutoAdvanceWarmupTime());
      builder.setAutoStartWarmupTime(race.getAutoStartWarmupTime());
      builder.setDriftTime(race.getDriftTime());
      builder.setStartTime(race.getStartTime());
      builder.setRestartTime(race.getRestartTime());
      builder.setStartRandomizer(race.getStartRandomizer());
      builder.setRestartRandomizer(race.getRestartRandomizer());
      if (race.getHeatRotationType() != null) {
        String rotationName =
            race.getHeatRotationType().name().replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase();
        builder.setHeatRotationType(
            com.antigravity.proto.HeatRotationType.valueOf(rotationName)); // fqn-collision
      }
      builder.setSoloLaneIndex(race.getSoloLaneIndex());
      builder.setPractice(race.isPractice());
      builder.setAdjustDriftLaps(race.isAdjustDriftLaps());
      if (race.getThemeId() != null) {
        builder.setThemeId(race.getThemeId());
      }
      if (race.getCustomRotationSequence() != null) {
        builder.addAllCustomRotationSequence(race.getCustomRotationSequence());
      }
      if (race.getCustomRotationAssetId() != null) {
        builder.setCustomRotationAssetId(race.getCustomRotationAssetId());
      }
      builder.setHeatTimesThrough(race.getHeatTimesThrough());
      builder.setReverseHeats(race.isReverseHeats());

      if (race.getGroupOptions() != null) {
        com.antigravity.models.GroupOptions groups = race.getGroupOptions(); // fqn-collision
        com.antigravity.proto.GroupOptions.Builder groupBuilder = // fqn-collision
            com.antigravity.proto.GroupOptions.newBuilder() // fqn-collision
                .setEnabled(groups.isEnabled())
                .setMaxGroups(groups.getMaxGroups())
                .setBalance(groups.isBalance())
                .setAllowEmptyLanes(groups.isAllowEmptyLanes())
                .setForceMultipleOfMax(groups.isForceMultipleOfMax())
                .setRotateGroupHeats(groups.isRotateGroupHeats());
        if (groups.getNames() != null) {
          groupBuilder.addAllNames(groups.getNames());
        }
        builder.setGroupOptions(groupBuilder.build());
      }

      return builder.build();
    }
  }

  public static com.antigravity.proto.Race toProto( // fqn-collision
      com.antigravity.race.Race race) { // fqn-collision
    return toProto(race, new HashSet<>());
  }

  public static com.antigravity.proto.Race toProto( // fqn-collision
      com.antigravity.race.Race race, Set<String> sentObjectIds) { // fqn-collision
    com.antigravity.proto.Race.Builder builder = // fqn-collision
        com.antigravity.proto.Race.newBuilder() // fqn-collision
            .setRace(toProto(race.getRaceModel(), race.getTrack(), sentObjectIds))
            .addAllDrivers(
                race.getDrivers().stream()
                    .map(p -> RaceParticipantConverter.toProto(p, sentObjectIds))
                    .collect(Collectors.toList()))
            .addAllHeats(
                race.getHeats().stream()
                    .map(h -> HeatConverter.toProto(h, sentObjectIds))
                    .collect(Collectors.toList()))
            .setCurrentHeat(HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
            .setRecordData(race.getRecordData());

    com.antigravity.race.EventExecutionManager eventMgr = // fqn-collision
        com.antigravity.race.EventExecutionManager.getInstance(); // fqn-collision
    if (eventMgr.isEventActive()) {
      builder.setIsEvent(true);
      if (eventMgr.getActiveEvent() != null) {
        builder.setEventId(eventMgr.getActiveEvent().getEntityId());
        builder.setEventName(eventMgr.getActiveEvent().getName());
        builder.setTotalEventRaces(eventMgr.getActiveEvent().getRaces().size());
      }
      builder.setCurrentEventRaceIndex(eventMgr.getCurrentRaceIndex());
      builder.setAutoAdvanceRemainingSeconds(eventMgr.getAutoAdvanceRemainingSeconds());
    }

    if (race.getSeasonEntityId() != null && !race.getSeasonEntityId().isEmpty()) {
      String seasonId = race.getSeasonEntityId();
      builder.setIsSeason(true);
      builder.setSeasonId(seasonId);
      com.antigravity.context.DatabaseContext dbCtx = race.getDatabaseContext(); // fqn-collision
      if (dbCtx == null) {
        dbCtx =
            com.antigravity.race.ClientSubscriptionManager.getInstance() // fqn-collision
                .getDatabaseContext(); // fqn-collision
      }
      if (dbCtx != null
          && com.antigravity.service.DatabaseService.getInstance() != null) { // fqn-collision
        com.antigravity.models.Season season = // fqn-collision
            com.antigravity.service.DatabaseService.getInstance() // fqn-collision
                .getSeason(dbCtx, seasonId);
        if (season != null) {
          builder.setSeasonName(season.getName());
          List<DriverSeasonStanding> standings =
              SeasonPointsCalculator.calculateLiveStandings(season, race);
          if (standings != null) {
            for (DriverSeasonStanding standing : standings) {
              DriverRaceScoreDetail currentDetail = standing.getCurrentRaceScoreDetail();
              SeasonStanding.Builder sBuilder =
                  SeasonStanding.newBuilder()
                      .setDriverId(standing.getDriverId())
                      .setDriverName(standing.getDriverName())
                      .setNetPoints(standing.getNetPoints())
                      .setGrossPoints(standing.getGrossPoints())
                      .setDroppedPoints(standing.getDroppedPoints())
                      .setRacesRun(standing.getRacesRun())
                      .setCurrentRacePoints(standing.getCurrentRacePoints());
              if (currentDetail != null) {
                sBuilder
                    .setCurrentRaceOverallPoints(currentDetail.getOverallPoints())
                    .setCurrentRaceOverallBonusPoints(currentDetail.getOverallBonusPoints())
                    .setCurrentRaceHeatPoints(currentDetail.getHeatPoints())
                    .setCurrentRaceHeatBonusPoints(currentDetail.getHeatBonusPoints())
                    .setCurrentRaceOverallRank(currentDetail.getOverallRank());
                if (currentDetail.getOverallBonusBreakdown() != null) {
                  sBuilder.putAllCurrentRaceOverallBonusBreakdown(
                      currentDetail.getOverallBonusBreakdown());
                }
                if (currentDetail.getHeatBonusBreakdown() != null) {
                  sBuilder.putAllCurrentRaceHeatBonusBreakdown(
                      currentDetail.getHeatBonusBreakdown());
                }
              }
              builder.addSeasonStandings(sBuilder.build());
            }
          }
        }
      }
    }

    if (race.getStatistics() != null && race.getStatistics().getStartMillis() > 0) {
      builder.setStartTimeMillis(race.getStatistics().getStartMillis());
    }

    return builder.build();
  }
}
