package com.antigravity.protocols.arduino;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LedString {

  public int pin;
  public List<Integer> leds;
  public int numUsedLeds;
  public int addressableLeds;
  public int brightness;
  public int ledType;
  public double flagFlashRate;
  public List<String> ledLaneColorOverrides;

  public LedString() {
    this.leds = new ArrayList<>();
    this.ledLaneColorOverrides = new ArrayList<>();
    this.brightness = 255;
    this.ledType = 0;
    this.flagFlashRate = 5.0;
    this.pin = 0;
  }

  @JsonCreator
  public LedString(
      @JsonProperty("pin") int pin,
      @JsonProperty("leds") List<Integer> leds,
      @JsonProperty("brightness") int brightness,
      @JsonProperty("ledType") int ledType,
      @JsonProperty("flagFlashRate") double flagFlashRate,
      @JsonProperty("ledLaneColorOverrides") List<String> ledLaneColorOverrides) {
    this.pin = pin;
    this.leds = leds != null ? leds : new ArrayList<>();
    this.brightness = brightness;
    this.ledType = ledType;
    this.flagFlashRate = flagFlashRate;
    this.ledLaneColorOverrides =
        ledLaneColorOverrides != null ? ledLaneColorOverrides : new ArrayList<>();

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
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    LedString that = (LedString) o;
    return pin == that.pin
        && brightness == that.brightness
        && ledType == that.ledType
        && Double.compare(that.flagFlashRate, flagFlashRate) == 0
        && Objects.equals(leds, that.leds)
        && Objects.equals(ledLaneColorOverrides, that.ledLaneColorOverrides);
  }

  @Override
  public int hashCode() {
    return Objects.hash(pin, leds, brightness, ledType, flagFlashRate, ledLaneColorOverrides);
  }
}
