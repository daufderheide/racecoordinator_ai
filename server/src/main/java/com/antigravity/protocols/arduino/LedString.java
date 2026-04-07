package com.antigravity.protocols.arduino;

import java.util.List;
import java.util.Objects;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LedString {
  public int stringNum;
  public List<Integer> leds;
  public int numUsedLeds;
  public int addressableLeds;
  public int brightness;
  public double yellowFlagFlashRate;
  public List<String> ledLaneColorOverrides;

  public LedString() {
    this.leds = new ArrayList<>();
    this.ledLaneColorOverrides = new ArrayList<>();
    this.brightness = 255;
    this.yellowFlagFlashRate = 5.0;
  }

  @JsonCreator
  public LedString(
      @JsonProperty("stringNum") int stringNum,
      @JsonProperty("leds") List<Integer> leds,
      @JsonProperty("brightness") int brightness,
      @JsonProperty("yellowFlagFlashRate") double yellowFlagFlashRate,
      @JsonProperty("ledLaneColorOverrides") List<String> ledLaneColorOverrides) {
    this.stringNum = stringNum;
    this.leds = leds != null ? leds : new ArrayList<>();
    this.brightness = brightness;
    this.yellowFlagFlashRate = yellowFlagFlashRate;
    this.ledLaneColorOverrides = ledLaneColorOverrides != null ? ledLaneColorOverrides : new ArrayList<>();

    this.numUsedLeds = 0;
    this.addressableLeds = 0;
    for (int i = 0; i < this.leds.size(); i++) {
      Integer behavior = this.leds.get(i);
      if (behavior != null && behavior != 0) { // 0 = RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED_VALUE
        this.numUsedLeds++;
        this.addressableLeds = (i + 1);
      }
    }
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    LedString that = (LedString) o;
    return stringNum == that.stringNum &&
        brightness == that.brightness &&
        Double.compare(that.yellowFlagFlashRate, yellowFlagFlashRate) == 0 &&
        Objects.equals(leds, that.leds) &&
        Objects.equals(ledLaneColorOverrides, that.ledLaneColorOverrides);
  }

  @Override
  public int hashCode() {
    return Objects.hash(stringNum, leds, brightness, yellowFlagFlashRate, ledLaneColorOverrides);
  }
}
