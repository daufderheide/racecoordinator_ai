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
  public void nextHeat(com.antigravity.race.Race race) {
    Common.advanceToNextHeat(race);
  }

  @Override
  public void skipHeat(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot skip heat: Race is not in NotStarted or Paused state.");
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

  @Override
  public void deferHeat(com.antigravity.race.Race race) {
    throw new IllegalStateException("Cannot defer heat: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void onLap(int lane, double lapTime) {
    System.out.println("HeatOver: Ignored onLap - Heat is over");
  }

  @Override
  public void onCarData(com.antigravity.protocols.CarData carData) {
    System.out.println("HeatOver: Ignored onCarData - Heat is over");
  }
}
