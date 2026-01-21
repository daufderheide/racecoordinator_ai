package com.antigravity.race.states;

import com.antigravity.race.Race;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.converters.HeatConverter;
import com.antigravity.proto.RaceData;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Common {
  public static void advanceToNextHeat(Race race) {
    List<Heat> heats = race.getHeats();
    Heat currentHeat = race.getCurrentHeat();
    int currentIndex = heats.indexOf(currentHeat);

    if (currentIndex < heats.size() - 1) {
      race.setCurrentHeat(heats.get(currentIndex + 1));
      race.changeState(new NotStarted());

      // Optimized update: only send currentHeat
      Set<String> sentObjectIds = new HashSet<>();
      for (RaceParticipant p : race.getDrivers()) {
        sentObjectIds.add(HeatConverter.PARTICIPANT_PREFIX + p.getObjectId());
      }

      com.antigravity.proto.Race raceProto = com.antigravity.proto.Race.newBuilder()
          .setCurrentHeat(HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
          .build();

      race.broadcast(RaceData.newBuilder()
          .setRace(raceProto)
          .build());
    } else {
      race.changeState(new RaceOver());
    }
  }
}
