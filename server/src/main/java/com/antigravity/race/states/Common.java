package com.antigravity.race.states;

import com.antigravity.converters.HeatConverter;
import com.antigravity.proto.RaceData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Common {
  private static final Logger logger = LoggerFactory.getLogger(Common.class);

  public static boolean handleDriftLap(
      Race race,
      long stateStartTimeMillis,
      String stateName,
      int lane,
      double lapTime,
      int interfaceId,
      Runnable onLapCounted) {
    if (race != null && race.getRaceModel() != null) {
      double driftTime = race.getRaceModel().getDriftTime();
      if (driftTime > 0) {
        long elapsedMillis = System.currentTimeMillis() - stateStartTimeMillis;
        if (elapsedMillis <= driftTime * 1000) {
          logger.info(
              "{}: Counting lap during drift time. Elapsed: {}ms, Drift: {}ms",
              stateName,
              elapsedMillis,
              (driftTime * 1000));
          if (race.getHeatExecutionManager() != null) {
            boolean counted =
                race.getHeatExecutionManager().onLap(lane, lapTime, interfaceId, false, true, true);
            if (counted && onLapCounted != null) {
              onLapCounted.run();
            }
            return counted;
          }
        } else {
          logger.info(
              "{}: Drift time expired. Lap ignored. Elapsed: {}ms, Drift: {}ms",
              stateName,
              elapsedMillis,
              (driftTime * 1000));
        }
      }
    }
    return false;
  }

  public static void advanceToNextHeat(Race race) {
    List<Heat> heats = race.getHeats();
    Heat currentHeat = race.getCurrentHeat();
    int currentIndex = heats != null ? heats.indexOf(currentHeat) : -1;

    int nextIndex = -1;
    if (heats != null) {
      for (int i = currentIndex + 1; i < heats.size(); i++) {
        if (heats.get(i).getActiveDriverCount() > 0) {
          nextIndex = i;
          break;
        }
      }
    }

    if (nextIndex != -1) {
      race.setCurrentHeat(heats.get(nextIndex));
      race.resetRaceTime();
      race.prepareHeat();
      race.setAutoStartFired(false);
      race.setAutoAdvanceFired(false);
      race.changeState(new NotStarted());

      // Optimized update: send currentHeat and all heats
      Set<String> sentObjectIds = new HashSet<>();
      if (race.getDrivers() != null) {
        for (RaceParticipant p : race.getDrivers()) {
          sentObjectIds.add(HeatConverter.PARTICIPANT_PREFIX + p.getObjectId());
        }
      }

      com.antigravity.proto.Race raceProto = // fqn-collision
          com.antigravity.proto.Race.newBuilder() // fqn-collision
              .setCurrentHeat(HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
              .addAllHeats(
                  heats.stream()
                      .map(h -> HeatConverter.toProto(h, sentObjectIds))
                      .collect(Collectors.toList()))
              .build();

      race.broadcast(RaceData.newBuilder().setRace(raceProto).build());
    } else {
      race.changeState(new RaceOver());
    }
  }
}
