package com.antigravity.race.states;

public class HeatOver implements IRaceState {
  @Override
  public void enter(com.antigravity.race.Race race) {
    System.out.println("HeatOver state entered.");
  }

  @Override
  public void exit(com.antigravity.race.Race race) {
    System.out.println("HeatOver state exited.");
  }

  @Override
  public void onLap(int lane, float lapTime) {
    System.out.println("Race: Ignored onLap - Heat is over");
  }

  @Override
  public void nextHeat(com.antigravity.race.Race race) {
    java.util.List<com.antigravity.race.Heat> heats = race.getHeats();
    com.antigravity.race.Heat currentHeat = race.getCurrentHeat();
    int currentIndex = heats.indexOf(currentHeat);

    if (currentIndex < heats.size() - 1) {
      // Logic moved from Race.moveToNextHeat
      race.setCurrentHeat(heats.get(currentIndex + 1));
      race.changeState(new NotStarted());

      // Optimized update: only send currentHeat
      java.util.Set<String> sentObjectIds = new java.util.HashSet<>();
      for (com.antigravity.race.RaceParticipant p : race.getDrivers()) {
        sentObjectIds.add(com.antigravity.converters.HeatConverter.PARTICIPANT_PREFIX + p.getObjectId());
      }

      com.antigravity.proto.Race raceProto = com.antigravity.proto.Race.newBuilder()
          .setCurrentHeat(com.antigravity.converters.HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
          .build();

      race.broadcast(com.antigravity.proto.RaceData.newBuilder()
          .setRace(raceProto)
          .build());
    } else {
      throw new IllegalStateException("No more heats available.");
    }
  }

  @Override
  public void start(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot start race: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void pause(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot pause race: Race is not in Starting or Racing state.");
  }

  @Override
  public void restartHeat(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot restart heat from state: " + this.getClass().getSimpleName());
  }
}
