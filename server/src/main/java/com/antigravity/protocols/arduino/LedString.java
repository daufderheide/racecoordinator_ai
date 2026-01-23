package com.antigravity.protocols.arduino;

public class LedString {
  public byte stringNum_;
  public int[] leds_;
  public int numUsedLeds_;
  public int addressableLeds_;
  public int brightness_;
  public double yellowFlagFlashRate_;

  public static final int LED_UNUSED = 0;
  public static final int LED_HEAT_LEADER = 1;
  public static final int LED_HEAT_TIME = 2;
  public static final int LED_RACE_STATE_BASE = 1000;
  public static final int LED_RACE_STATE_MAX = 1999;
  public static final int LED_HEAT_LEADER_BASE = 2000;
  public static final int LED_HEAT_LEADER_MAX = 2999;
  public static final int LED_COUNTDOWN_BASE = 3000;
  public static final int LED_COUNTDOWN_MAX = 3999;
  public static final int LED_FUEL_LEVEL_BASE = 4000;
  public static final int LED_FUEL_LEVEL_MAX = 4999;
  public static final int LED_REFUELING_BASE = 5000;
  public static final int LED_REFUELING_MAX = 5999;
  public static final int LED_LAP_INDICATOR_BASE = 6000;
  public static final int LED_LAP_INDICATOR_MAX = 6999;
  public static final int LED_LAP_SENSOR_BASE = 7000;
  public static final int LED_LAP_SENSOR_MAX = 7999;

  public byte stringNum;
  public int[] leds;
  public int numUsedLeds;
  public int addressableLeds;
  public int brightness;
  public double yellowFlagFlashRate;

  public LedString(byte stringNum, int[] leds, int brightness, double yellowFlagFlashRate) {
    this.stringNum = stringNum;
    this.leds = leds;
    this.brightness = brightness;
    this.yellowFlagFlashRate = yellowFlagFlashRate;

    this.numUsedLeds = 0;
    this.addressableLeds = 0;
    for (int i = 0; i < this.leds.length; i++) {
      if (this.leds[i] != LED_UNUSED) {
        this.numUsedLeds++;
        this.addressableLeds = (i + 1);
      }
    }
  }
}
