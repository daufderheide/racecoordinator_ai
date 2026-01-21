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
}
