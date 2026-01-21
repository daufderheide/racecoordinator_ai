package com.antigravity.race.states;

public class RaceOver implements IRaceState {
  @Override
  public void enter(com.antigravity.race.Race race) {
    System.out.println("RaceOver state entered.");
  }

  @Override
  public void exit(com.antigravity.race.Race race) {
    System.out.println("RaceOver state exited.");
  }

  @Override
  public void onLap(int lane, float lapTime) {
    System.out.println("Race: Ignored onLap - Race is over");
  }

  @Override
  public void nextHeat(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot move to next heat from state: " + this.getClass().getSimpleName());
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
