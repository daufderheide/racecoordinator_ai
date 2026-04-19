package com.antigravity.protocols.arduino;

import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.proto.RgbLedBehavior;
import com.antigravity.proto.RgbLedState;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Helper class for managing RGB LED logic for the Arduino Protocol. Consolidates LED state and
 * message formation to keep ArduinoProtocol cleaner.
 */
public class ArduinoLedHelper {
  private static final Logger logger = LoggerFactory.getLogger(ArduinoLedHelper.class);
  private static final byte TERMINATOR = 0x3B;

  private final ArduinoProtocol protocol;
  private final Map<Integer, Integer> lastAddressableLeds = new HashMap<>();
  private final Map<Integer, Integer> lastBrightness = new HashMap<>();
  private final Map<Integer, Integer> lastNumUsedLeds = new HashMap<>();
  private final Map<String, Long> lastLedColors = new HashMap<>();
  private RaceState lastState = RaceState.UNKNOWN_STATE;
  private RaceFlag lastFlag = RaceFlag.UNKNOWN_FLAG; // Default to unknown
  private double lastCountdown = 0.0;
  private Double lastHeatProgress = null;
  private long lastStateChangeTime = 0;
  private final Map<Integer, Double> lastFuelLevels = new HashMap<>();

  public ArduinoLedHelper(ArduinoProtocol protocol) {
    this.protocol = protocol;
  }

  public void sendRgbLedMode() {
    if (!protocol.isSerialOpen()) {
      return;
    }

    ArduinoConfig config = protocol.getConfig();
    // Track strings we updated/sent in this configuration
    Set<Integer> updatedPins = new HashSet<>();

    if (config.ledStrings != null) {
      for (LedString ledString : config.ledStrings) {
        int pinId = ledString.pin;
        int currentMax = ledString.addressableLeds;
        int currentBrightness = ledString.brightness;
        int currentUsed = ledString.numUsedLeds;

        int previousMax = lastAddressableLeds.getOrDefault(pinId, 0);
        int previousBrightness = lastBrightness.getOrDefault(pinId, -1);
        int previousUsed = lastNumUsedLeds.getOrDefault(pinId, 0);

        // Only send mode if the number of addressable leds changed, brightness changed,
        // or any led transitioned between used and unused.
        if (currentMax != previousMax
            || currentBrightness != previousBrightness
            || currentUsed != previousUsed) {
          int maxCount = Math.max(currentMax, previousMax);
          if (maxCount > 0) {
            sendRgbLedModeMessage(pinId, maxCount, currentBrightness, ledString.ledType);
          }
        }

        lastAddressableLeds.put(pinId, currentMax);
        lastBrightness.put(pinId, currentBrightness);
        lastNumUsedLeds.put(pinId, currentUsed);
        updatedPins.add(pinId);
      }
    }

    // Handle removed strings: send a clear command (0 brightness) for any string
    // that existed previously but is not in the new config.
    for (Integer pinId : new ArrayList<>(lastAddressableLeds.keySet())) {
      if (!updatedPins.contains(pinId)) {
        int previousMax = lastAddressableLeds.get(pinId);
        if (previousMax > 0) {
          sendRgbLedModeMessage(pinId, previousMax, 0, 0); // Brightness 0 for disabled
        }
        lastAddressableLeds.remove(pinId);
        lastBrightness.remove(pinId);
        lastNumUsedLeds.remove(pinId);
      }
    }
  }

  private void sendRgbLedModeMessage(int pinId, int ledCount, int brightness, int ledType) {
    // { 0x6C, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x3B }
    // opcode pin ledCount brightness updateRateLow updateRateHigh ledType ;
    byte[] message = new byte[8];
    int updateRate = 20;

    message[0] = 0x6C; // 'l'
    message[1] = (byte) (getPhysicalPin(pinId) & 0xFF);
    message[2] = (byte) (ledCount & 0xFF);
    message[3] = (byte) (brightness & 0xFF);
    message[4] = (byte) (updateRate & 0xFF);
    message[5] = (byte) ((updateRate >> 8) & 0xFF);
    message[6] = (byte) (ledType & 0xFF);
    message[7] = TERMINATOR;

    protocol.writeData(message);
    logger.info(
        "[{}] Sent RGB_LED_MODE - Pin: {}, Count: {}, Brightness: {}, UpdateRate: {}",
        protocol.getLogTime(),
        pinId,
        ledCount,
        brightness,
        updateRate);
  }

  public void clearLeds() {
    ArduinoConfig config = protocol.getConfig();
    if (config.ledStrings == null) {
      return;
    }

    for (LedString ledString : config.ledStrings) {
      List<RgbLedState> updates = new ArrayList<>();
      for (int i = 0; i < ledString.addressableLeds; i++) {
        updates.add(RgbLedState.newBuilder().setIndex(i).setR(0).setG(0).setB(0).build());
      }
      if (!updates.isEmpty()) {
        setStringRgbLedValues(ledString.pin, updates);
      }
    }
    lastLedColors.clear();
  }

  public void resetCache() {
    lastLedColors.clear();
    lastState = RaceState.UNKNOWN_STATE;
    lastFlag = RaceFlag.UNKNOWN_FLAG;
    lastCountdown = 0.0;
    lastStateChangeTime = 0;
  }

  public void setStringRgbLedValues(int pinId, List<RgbLedState> rgbLeds) {
    if (!protocol.isSerialOpen() || rgbLeds == null || rgbLeds.isEmpty()) {
      return;
    }

    // Determine how many LEDs we can fit in one packet based on hardware buffer
    // limits.
    // Packet structure: opcode(1) + pin(1) + count(1) + items(4*count) +
    // terminator(1)
    int maxBufferSize = protocol.getMaxBufferSize();
    int maxLedsPerPacket = Math.max(1, (maxBufferSize - 4) / 4);

    int totalLeds = rgbLeds.size();
    int processedLeds = 0;

    while (processedLeds < totalLeds) {
      int currentBatchSize = Math.min(maxLedsPerPacket, totalLeds - processedLeds);
      List<RgbLedState> batch = rgbLeds.subList(processedLeds, processedLeds + currentBatchSize);

      int msgLen = 3 + (currentBatchSize * 4) + 1;
      byte[] message = new byte[msgLen];

      message[0] = 0x4C; // 'L'
      message[1] = (byte) (getPhysicalPin(pinId) & 0xFF);
      message[2] = (byte) (currentBatchSize & 0xFF);

      int idx = 3;
      for (RgbLedState led : batch) {
        message[idx++] = (byte) (led.getIndex() & 0xFF);
        message[idx++] = (byte) (led.getR() & 0xFF);
        message[idx++] = (byte) (led.getG() & 0xFF);
        message[idx++] = (byte) (led.getB() & 0xFF);
      }

      message[idx] = TERMINATOR;

      protocol.writeData(message);
      logger.info(
          "[{}] Sent SET_RGB_LED_VALUES batch - Pin: {}, Batch Size: {}/{}",
          protocol.getLogTime(),
          pinId,
          currentBatchSize,
          totalLeds);

      processedLeds += currentBatchSize;
    }
  }

  public void setRefueling(int laneIndex, boolean isRefueling) {
    ArduinoConfig config = protocol.getConfig();
    if (config.ledStrings == null) {
      return;
    }

    int refuelingBehavior = RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + laneIndex;

    for (LedString ledString : config.ledStrings) {
      List<RgbLedState> updates = new ArrayList<>();
      boolean success = true;

      for (int i = 0; i < ledString.leds.size(); i++) {
        int behavior = ledString.leds.get(i);
        if (behavior == refuelingBehavior) {
          int[] rgb = {0, 0, 0};
          if (isRefueling) {
            if (laneIndex < 0 || laneIndex >= ledString.ledLaneColorOverrides.size()) {
              logger.error("Missing color mapping for lane {} on pin {}", laneIndex, ledString.pin);
              success = false;
              break;
            }
            rgb = parseColor(ledString.ledLaneColorOverrides.get(laneIndex));
          }
          updates.add(
              RgbLedState.newBuilder().setIndex(i).setR(rgb[0]).setG(rgb[1]).setB(rgb[2]).build());
        }
      }

      if (success && !updates.isEmpty()) {
        setStringRgbLedValues(ledString.pin, updates);
      }
    }
  }

  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    RaceState oldState = this.lastState;
    if (state != oldState) {
      lastStateChangeTime = getCurrentTimeMillis();
    }
    this.lastState = state;
    this.lastFlag = flag;
    this.lastCountdown = countdown;

    if ((state == RaceState.UNKNOWN_STATE
            || state == RaceState.RACE_OVER
            || state == RaceState.HEAT_OVER)
        && (oldState != RaceState.UNKNOWN_STATE
            && oldState != RaceState.RACE_OVER
            && oldState != RaceState.HEAT_OVER)) {
      lastHeatProgress = null;
      lastFuelLevels.clear();
      clearLeds();
    }

    refreshRaceState();
    refreshThermometers();
  }

  private void refreshThermometers() {
    if (lastHeatProgress != null) {
      this.setHeatProgress(lastHeatProgress);
    }
    for (Map.Entry<Integer, Double> entry : lastFuelLevels.entrySet()) {
      this.setFuelLevel(entry.getKey(), (int) (entry.getValue() * 100.0));
    }
  }

  public void refreshRaceState() {
    ArduinoConfig config = protocol.getConfig();
    if (config.ledStrings == null) {
      return;
    }

    RaceState state = lastState;
    RaceFlag flag = lastFlag;
    double countdown = lastCountdown;

    if (state == RaceState.UNKNOWN_STATE || flag == RaceFlag.UNKNOWN_FLAG) {
      return;
    }

    int raceStateBehavior = RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE;
    long now = getCurrentTimeMillis();

    for (LedString ledString : config.ledStrings) {
      List<RgbLedState> updates = new ArrayList<>();

      for (int i = 0; i < ledString.leds.size(); i++) {
        int behavior = ledString.leds.get(i);
        if (behavior >= raceStateBehavior && behavior <= raceStateBehavior + 5) {
          int[] rgb1 = {0, 0, 0};
          int[] rgb2 = {0, 0, 0};
          boolean isInterleaved = false;
          boolean canFlash = false;

          switch (flag) {
            case RED:
              rgb1 = new int[] {255, 0, 0};
              break;
            case GREEN:
              rgb1 = new int[] {0, 255, 0};
              break;
            case YELLOW:
              isInterleaved = true;
              canFlash = true;
              rgb1 = new int[] {255, 255, 0}; // Yellow
              rgb2 = new int[] {0, 0, 0}; // Black
              break;
            case WHITE:
              rgb1 = new int[] {255, 255, 255};
              break;
            case CHECKERED:
              isInterleaved = true;
              canFlash = true;
              rgb1 = new int[] {255, 255, 255}; // White
              rgb2 = new int[] {0, 0, 0}; // Black
              break;
            case GREEN_YELLOW:
              isInterleaved = true;
              canFlash = true;
              rgb1 = new int[] {0, 255, 0}; // Green
              rgb2 = new int[] {255, 255, 0}; // Yellow
              break;
            default:
              break;
          }

          if (canFlash && ledString.flagFlashRate > 0) {
            long halfPeriod = (long) (1000.0 / (ledString.flagFlashRate * 2.0));
            boolean toggle = (now / halfPeriod) % 2 != 0;
            if (toggle) {
              int[] temp = rgb1;
              rgb1 = rgb2;
              rgb2 = temp;
            }
          }

          int[] finalRgb = rgb1;
          if (isInterleaved && (behavior % 2 != 0)) {
            finalRgb = rgb2;
          }

          String key = ledString.pin + "_" + i;
          long currentColor =
              ((long) (finalRgb[0] & 0xFF) << 16)
                  | ((long) (finalRgb[1] & 0xFF) << 8)
                  | (long) (finalRgb[2] & 0xFF);
          Long lastColor = lastLedColors.get(key);

          if (lastColor == null || lastColor != currentColor) {
            updates.add(
                RgbLedState.newBuilder()
                    .setIndex(i)
                    .setR(finalRgb[0])
                    .setG(finalRgb[1])
                    .setB(finalRgb[2])
                    .build());
            lastLedColors.put(key, currentColor);
          }
        } else if (behavior >= RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE
            && behavior < RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE + 100) {
          int n = behavior - RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE;
          int r = 0;
          int g = 0;
          int b = 0;

          if (state == RaceState.STARTING) {
            // Use floor to ensure we turn on the next LED at the start of the second.
            // e.g. at 5.0s, floor=5, LED 5 turns on.
            // at 4.9s, floor=4, LED 5 and 4 turn on.
            if (Math.floor(countdown) <= (double) n && countdown >= 0) {
              r = 255;
            }
          } else if (state == RaceState.RACING && flag == RaceFlag.GREEN) {
            if (now - lastStateChangeTime < 1000) {
              g = 255;
            }
          }

          String key = ledString.pin + "_" + i;
          long currentColor =
              ((long) (r & 0xFF) << 16) | ((long) (g & 0xFF) << 8) | (long) (b & 0xFF);
          Long lastColor = lastLedColors.get(key);

          if (lastColor == null || lastColor != currentColor) {
            updates.add(RgbLedState.newBuilder().setIndex(i).setR(r).setG(g).setB(b).build());
            lastLedColors.put(key, currentColor);
          }
        }
      }

      if (!updates.isEmpty()) {
        setStringRgbLedValues(ledString.pin, updates);
      }
    }
  }

  public void setHeatStandings(List<Integer> laneIndices) {
    if (laneIndices == null || laneIndices.isEmpty()) {
      return;
    }

    int leaderLaneIndex = laneIndices.get(0);
    int leaderBehavior = RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE + leaderLaneIndex;

    ArduinoConfig config = protocol.getConfig();
    if (config.ledStrings != null) {
      for (LedString ledString : config.ledStrings) {
        if (leaderLaneIndex < 0 || leaderLaneIndex >= ledString.ledLaneColorOverrides.size()) {
          // TODO(aufderheide): We should log this error or assert on it, it should never
          // happen.
          continue;
        }

        int[] rgb = parseColor(ledString.ledLaneColorOverrides.get(leaderLaneIndex));

        List<RgbLedState> updates = new ArrayList<>();
        boolean success = true;

        for (int i = 0; i < ledString.leds.size(); i++) {
          int behavior = ledString.leds.get(i);
          // Check if this LED is configured as a heat leader
          if (behavior >= RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE
              && behavior < RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE) {
            if (behavior == leaderBehavior) {
              updates.add(
                  RgbLedState.newBuilder()
                      .setIndex(i)
                      .setR(rgb[0])
                      .setG(rgb[1])
                      .setB(rgb[2])
                      .build());
            } else {
              // Not the leader lane, turn off
              updates.add(RgbLedState.newBuilder().setIndex(i).setR(0).setG(0).setB(0).build());
            }
          } else if (behavior == RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_VALUE) {
            // Generic heat leader behavior
            updates.add(
                RgbLedState.newBuilder()
                    .setIndex(i)
                    .setR(rgb[0])
                    .setG(rgb[1])
                    .setB(rgb[2])
                    .build());
          }
        }

        if (success && !updates.isEmpty()) {
          setStringRgbLedValues(ledString.pin, updates);
        }
      }
    }
  }

  public void setFuelLevel(int laneIndex, int fuelLevelPct) {
    double percentage = fuelLevelPct / 100.0;
    this.lastFuelLevels.put(laneIndex, percentage);
    updateThermometer(
        RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE, laneIndex, percentage, false);
  }

  public void setHeatProgress(double percentage) {
    this.lastHeatProgress = percentage;
    // Heat Progress behavior ID is 2 (global, so laneIndex doesn't matter, we'll
    // use 0)
    // and pass percentage directly.
    updateThermometer(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE, -2, percentage, true);
  }

  /**
   * Updates a series of LEDs in a "thermometer" style based on a percentage.
   *
   * @param behaviorBase The base ID for the behavior (e.g. RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE)
   * @param laneIndex The lane index (thermometers are lane-specific). Use -2 for global behaviors.
   * @param percentage Flow percentage (0.0 to 1.0). For Fuel, 1.0 is full. For Progress, 1.0 is
   *     complete.
   * @param displayAsProgress If true, 0% is Green and 100% is Red. If false, 100% is Green and 0%
   *     is Red.
   */
  public void updateThermometer(
      int behaviorBase, int laneIndex, double percentage, boolean displayAsProgress) {
    ArduinoConfig config = protocol.getConfig();
    if (config.ledStrings == null) {
      return;
    }

    int behaviorId = (laneIndex == -2) ? behaviorBase : behaviorBase + laneIndex;

    for (LedString ledString : config.ledStrings) {
      List<RgbLedState> updates = new ArrayList<>();

      int thermometerSize = 0;
      for (int behavior : ledString.leds) {
        if (behavior == behaviorId) {
          thermometerSize++;
        }
      }

      if (thermometerSize == 0) {
        continue;
      }

      // Logic percentage 'p': 1.0 is "best" (all on/green), 0.0 is "worst/finish"
      // (all off)
      double p = displayAsProgress ? (1.0 - percentage) : percentage;

      // Force progress thermometers to stay complete (all on) during NOT_STARTED
      if (displayAsProgress && p < 1.0 && lastState == RaceState.NOT_STARTED) {
        p = 1.0;
      }

      int numRed = 0;
      int numYellow = 0;
      int numGreen = 0;
      int onRed = 0;
      int onYellow = 0;
      int onGreen = 0;

      if (thermometerSize >= 3) {
        numRed = Math.max(1, (int) Math.floor(thermometerSize * 0.25));
        numYellow = Math.max(1, (int) Math.floor(thermometerSize * 0.25));
        numGreen = thermometerSize - numRed - numYellow;

        if (p > 0) {
          // Red range (0 to 0.25]
          onRed = (int) Math.ceil(Math.min(p, 0.25) / 0.25 * numRed);
          if (p > 0.25) {
            // Yellow range (0.25 to 0.5]
            onYellow = (int) Math.ceil(Math.min(p - 0.25, 0.25) / 0.25 * numYellow);
            if (p > 0.5) {
              // Green range (0.5 to 1.0]
              onGreen = (int) Math.ceil((p - 0.5) / 0.5 * numGreen);
            }
          }
        }
      } else {
        // N <= 2: All leds share the same color based on group state
        if (p > 0) {
          if (p >= 0.5) {
            onGreen = thermometerSize; // Use onGreen as a proxy for "All Green"
          } else if (p >= 0.25) {
            onYellow = thermometerSize; // Use onYellow as a proxy for "All Yellow"
          } else {
            onRed = thermometerSize; // Use onRed as a proxy for "All Red"
          }
        }
      }

      int ledInThermometer = 1;
      for (int i = 0; i < ledString.leds.size(); i++) {
        int behavior = ledString.leds.get(i);
        if (behavior == behaviorId) {
          int r = 0;
          int g = 0;
          int b = 0;

          if (thermometerSize >= 3) {
            if (ledInThermometer <= numGreen) {
              if (ledInThermometer > (numGreen - onGreen)) g = 255;
            } else if (ledInThermometer <= (numGreen + numYellow)) {
              int yellowIdx = ledInThermometer - numGreen;
              if (yellowIdx > (numYellow - onYellow)) {
                r = 255;
                g = 255;
              }
            } else {
              int redIdx = ledInThermometer - numGreen - numYellow;
              if (redIdx > (numRed - onRed)) {
                r = 255;
              }
            }
          } else {
            // N <= 2
            if (onGreen > 0) {
              g = 255;
            } else if (onYellow > 0) {
              r = 255;
              g = 255;
            } else if (onRed > 0) {
              r = 255;
            }
          }

          String key = ledString.pin + "_" + i;
          long currentColor =
              ((long) (r & 0xFF) << 16) | ((long) (g & 0xFF) << 8) | (long) (b & 0xFF);
          Long lastColor = lastLedColors.get(key);

          if (lastColor == null || lastColor != currentColor) {
            updates.add(RgbLedState.newBuilder().setIndex(i).setR(r).setG(g).setB(b).build());
            lastLedColors.put(key, currentColor);
          }
          ledInThermometer++;
        }
      }

      if (!updates.isEmpty()) {
        setStringRgbLedValues(ledString.pin, updates);
      }
    }
  }

  /**
   * Translates internal software pin IDs (0-53 digital, 1000-1015 analog) to physical Arduino pin
   * bytes based on the board type.
   */
  private int getPhysicalPin(int interfaceId) {
    boolean isAnalog = interfaceId >= 1000;
    int index = isAnalog ? interfaceId - 1000 : interfaceId;
    ArduinoConfig config = protocol.getConfig();
    boolean isMega = config.hardwareType == 1;

    if (isAnalog) {
      // Mega: A0 are pins 54-69
      // Uno: A0 are pins 14-19
      return isMega ? 54 + index : 14 + index;
    }
    return index;
  }

  private int[] parseColor(String hex) {
    if (hex == null || hex.isEmpty()) {
      return new int[] {0, 0, 0};
    }
    if (hex.startsWith("#")) {
      hex = hex.substring(1);
    }
    try {
      if (hex.length() == 6) {
        int r = Integer.parseInt(hex.substring(0, 2), 16);
        int g = Integer.parseInt(hex.substring(2, 4), 16);
        int b = Integer.parseInt(hex.substring(4, 6), 16);
        return new int[] {r, g, b};
      }
    } catch (NumberFormatException e) {
      logger.error("Failed to parse color hex: {}", hex, e);
    }
    return new int[] {0, 0, 0};
  }

  protected long getCurrentTimeMillis() {
    return System.currentTimeMillis();
  }
}
