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
}
