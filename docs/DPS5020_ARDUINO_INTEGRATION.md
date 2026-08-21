# RD DPS5020 Power Controller Integration via Arduino Extended Protocol

This document details the architectural specification and implementation guide for controlling the **RD DPS5020** (and compatible DPS-series CNC programmable step-down power supplies) from **Race Coordinator AI** via the **Arduino Extended Protocol**.

---

## 1. System Architecture

```
+------------------------------------+
|        Race Coordinator AI         |
|         (Java / Electron)          |
+-----------------+------------------+
                  |
                  | USB Serial (115200 baud)
                  | Extended Protocol ('E' opcodes)
                  v
+-----------------+------------------+
|           Arduino Board            |
|    (Mega / Uno / Nano / ESP32)     |
|   `racecoordinatorai_sketch.ino`   |
+-----------------+------------------+
                  |
                  | Serial UART (9600 baud, 8N1)
                  | Modbus-RTU Protocol (3.3V TTL)
                  v
+-----------------+------------------+
|      RD DPS5020 Power Supply       |
|    (0-50V, 0-20A Track Output)     |
+------------------------------------+
```

The Arduino acts as the intelligent bridge:
1. Receives high-level power control commands (`'E'` opcode 8) from Race Coordinator AI over the existing primary USB connection.
2. Translates them into Modbus-RTU frames and transmits them to the DPS5020 over a secondary serial port (e.g., `Serial1` on Mega, or `SoftwareSerial` on Uno/Nano).
3. Optionally polls DPS5020 registers for real-time telemetry (actual voltage, current, power, and protection status) and forwards them back to Race Coordinator AI.

---

## 2. Electrical Wiring & Hardware Setup

The DPS5020 communication port is a 4-pin header located on the back of the display/control board:

| DPS5020 Pin | Signal | Arduino Connection | Notes |
| :--- | :--- | :--- | :--- |
| **GND** | Ground | **GND** | Must share common ground with Arduino |
| **TX** | DPS Data Out (3.3V) | **Arduino RX** (e.g., Pin 10 or Serial1 RX19) | 3.3V logic is safely read by 5V Arduino |
| **RX** | DPS Data In (3.3V) | **Arduino TX** (e.g., Pin 11 or Serial1 TX18) | **Requires level shifter or voltage divider on 5V Arduinos** |
| **VCC** | 3.3V / 5V | *Not connected* | Leave disconnected when powered by main supply |

> [!CAUTION]
> **5V Logic Safety**: Standard Arduino Uno and Nano pins output 5V logic. Connecting Arduino 5V TX directly to DPS5020 3.3V RX can damage the power controller's microcontroller. Use a 3.3V level shifter or a resistor divider ($1\text{k}\Omega / 2\text{k}\Omega$). For 3.3V boards (ESP32, Teensy 4.x, SAMD21, RP2040), direct connection is safe.

---

## 3. Arduino Extended Protocol Specification

Race Coordinator AI uses the Extended Protocol message format:
`{ 0x45, <Opcode>, <Payload...>, 0x3B }` (`'E'`, opcode, payload, `';'`).

### 3.1 Extended Opcode Assignment

| Opcode | Identifier | Description |
| :--- | :--- | :--- |
| `0x00` | `EXT_OPCODE_RACE_STATE` | Current race state & countdown |
| `0x01` | `EXT_OPCODE_HEAT_LEADER` | Current heat leader lane |
| `0x02` | `EXT_OPCODE_HEAT_STANDINGS`| Ordered standings |
| `0x03` | `EXT_OPCODE_FUEL_LEVEL` | Fuel level percentage |
| `0x04` | `EXT_OPCODE_REFUELING` | Pit / refueling state |
| `0x05` | `EXT_OPCODE_TIME` | Elapsed race time percentage |
| `0x06` | `EXT_OPCODE_DESLOT` | Deslot counts |
| `0x07` | `EXT_OPCODE_LAP_PERF` | Lap performance comparison |
| **`0x08`** | **`EXT_OPCODE_POWER_CONTROL`** | **DPS5020 Power Controller Sub-commands** |

---

### 3.2 Power Control Sub-Commands (Host $\rightarrow$ Arduino)

All power sub-commands begin with prefix `0x45 0x08` (`'E'` `8`):

#### 1. Set Track Voltage (Sub-command `0x01`)
Sets target output voltage in hundredths of a volt ($1200 = 12.00\text{V}$, $1380 = 13.80\text{V}$).
```
Bytes: [ 0x45, 0x08, 0x01, <V_HIGH>, <V_LOW>, 0x3B ]
Example (12.00V -> 1200 = 0x04B0):
  0x45 0x08 0x01 0x04 0xB0 0x3B
```

#### 2. Set Current Limit (Sub-command `0x02`)
Sets maximum current limit in hundredths of an amp ($500 = 5.00\text{A}$, $2000 = 20.00\text{A}$).
```
Bytes: [ 0x45, 0x08, 0x02, <I_HIGH>, <I_LOW>, 0x3B ]
Example (10.00A -> 1000 = 0x03E8):
  0x45 0x08 0x02 0x03 0xE8 0x3B
```

#### 3. Set Output Power State (Sub-command `0x03`)
Instantly enables or disables main track power output.
```
Bytes: [ 0x45, 0x08, 0x03, <STATE>, 0x3B ]
  STATE: 0x00 = Power OFF (Track De-energized)
         0x01 = Power ON (Track Energized)
Example (Turn ON):
  0x45 0x08 0x03 0x01 0x3B
```

#### 4. Combined Voltage & Current Limit Set (Sub-command `0x04`)
Sets both voltage and current limit in a single atomic message using Modbus Function `0x10`.
```
Bytes: [ 0x45, 0x08, 0x04, <V_HIGH>, <V_LOW>, <I_HIGH>, <I_LOW>, 0x3B ]
Example (13.50V, 15.00A -> V=1350/0x0546, I=1500/0x05DC):
  0x45 0x08 0x04 0x05 0x46 0x05 0xDC 0x3B
```

#### 5. Configure Automatic Race-State Power Control (Sub-command `0x05`)
Configures the Arduino sketch to automatically toggle power or scale voltage based on race states without host latency:
```
Bytes: [ 0x45, 0x08, 0x05, <ENABLE_AUTO>, <RACE_V_H>, <RACE_V_L>, <CAUTION_V_H>, <CAUTION_V_L>, 0x3B ]
  ENABLE_AUTO: 0x00 = Manual host control only
               0x01 = Auto turn ON on Green, cut/reduce on Yellow/Pause/Finish
```

#### 6. Request Telemetry / Status (Sub-command `0x06`)
Requests immediate readback of measured output voltage, current, power, and protection status.
```
Bytes: [ 0x45, 0x08, 0x06, 0x3B ]
```

---

### 3.3 Power Telemetry Message (Arduino $\rightarrow$ Host)

When queried or periodically (e.g. 1Hz during race), the Arduino can send a telemetry packet back to Race Coordinator AI:

```
Bytes: [ 0x50, <UOUT_H>, <UOUT_L>, <IOUT_H>, <IOUT_L>, <PWR_H>, <PWR_L>, <STATUS>, 0x3B ]
  Opcode: 0x50 ('P' for Power)
  UOUT: Output voltage in centivolts (e.g. 1200 = 12.00V)
  IOUT: Output current in centiamps (e.g. 450 = 4.50A)
  PWR:  Output power in deciwatts/centiwatts
  STATUS: Bitmask / status code:
          Bit 0: Output enabled (1=ON, 0=OFF)
          Bit 1: Mode (0=Constant Voltage, 1=Constant Current)
          Bit 2-3: Protection (0=OK, 1=OVP, 2=OCP, 3=OPP)
  Terminator: 0x3B (';')
```

---

## 4. DPS5020 Modbus-RTU Register Reference

| Function | Modbus Register | Type | Decimal Places | Unit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`U-SET`** | `0x0000` | R/W | 2 | V | Voltage setting ($1200 = 12.00\text{V}$) |
| **`I-SET`** | `0x0001` | R/W | 2 | A | Current limit ($1000 = 10.00\text{A}$) |
| **`UOUT`** | `0x0002` | Read | 2 | V | Measured output voltage |
| **`IOUT`** | `0x0003` | Read | 2 | A | Measured output current |
| **`POWER`**| `0x0004` | Read | 1 or 2 | W | Measured output power |
| **`UIN`** | `0x0005` | Read | 2 | V | Input DC voltage |
| **`LOCK`** | `0x0006` | R/W | 0 | - | Front panel button lock (`0`=Unlock, `1`=Lock) |
| **`PROTECT`**|`0x0007` | Read | 0 | - | `0`=Normal, `1`=OVP, `2`=OCP, `3`=OPP |
| **`CV/CC`** | `0x0008` | Read | 0 | - | `0`=Constant Voltage (CV), `1`=Constant Current (CC) |
| **`ONOFF`** | `0x0009` | R/W | 0 | - | Output switch (`0`=OFF, `1`=ON) |
| **`B_LED`** | `0x000A` | R/W | 0 | - | Backlight level (`0`-`5`) |

---

## 5. Arduino Sketch Implementation Reference

### 5.1 Modbus CRC16 Calculation

```cpp
uint16_t calculateModbusCRC(const uint8_t *buffer, uint8_t length) {
  uint16_t crc = 0xFFFF;
  for (uint8_t pos = 0; pos < length; pos++) {
    crc ^= (uint16_t)buffer[pos];
    for (uint8_t i = 8; i != 0; i--) {
      if ((crc & 0x0001) != 0) {
        crc >>= 1;
        crc ^= 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}
```

### 5.2 DPS5020 Modbus Command Generation

```cpp
// Set Single Register (0x06)
void dpsSetRegister(Stream &dpsSerial, uint16_t regAddress, uint16_t value) {
  uint8_t frame[8];
  frame[0] = 0x01;              // Slave Address
  frame[1] = 0x06;              // Function Code: Write Single Register
  frame[2] = (regAddress >> 8); // Register Address High
  frame[3] = (regAddress & 0xFF);// Register Address Low
  frame[4] = (value >> 8);      // Value High
  frame[5] = (value & 0xFF);     // Value Low
  
  uint16_t crc = calculateModbusCRC(frame, 6);
  frame[6] = (crc & 0xFF);      // CRC Low
  frame[7] = (crc >> 8);        // CRC High

  dpsSerial.write(frame, sizeof(frame));
}

// Set Output On/Off
void dpsSetPowerOutput(Stream &dpsSerial, bool enabled) {
  dpsSetRegister(dpsSerial, 0x0009, enabled ? 1 : 0);
}

// Set Voltage (e.g. 1200 for 12.00V)
void dpsSetVoltage(Stream &dpsSerial, uint16_t voltageCentiVolts) {
  dpsSetRegister(dpsSerial, 0x0000, voltageCentiVolts);
}

// Set Current Limit (e.g. 500 for 5.00A)
void dpsSetCurrentLimit(Stream &dpsSerial, uint16_t currentCentiAmps) {
  dpsSetRegister(dpsSerial, 0x0001, currentCentiAmps);
}
```

### 5.3 Handling in `processExtendedRequest()`

```cpp
case extPowerControl: {
  uint8_t subCommand = inBuffer[2];
  switch (subCommand) {
    case 0x01: { // Set Voltage
      uint16_t voltage = ((uint16_t)inBuffer[3] << 8) | inBuffer[4];
      dpsSetVoltage(DPS_SERIAL, voltage);
      break;
    }
    case 0x02: { // Set Current Limit
      uint16_t current = ((uint16_t)inBuffer[3] << 8) | inBuffer[4];
      dpsSetCurrentLimit(DPS_SERIAL, current);
      break;
    }
    case 0x03: { // Set Output ON / OFF
      bool enable = (inBuffer[3] != 0);
      dpsSetPowerOutput(DPS_SERIAL, enable);
      break;
    }
    case 0x04: { // Combined Set Voltage & Current
      uint16_t voltage = ((uint16_t)inBuffer[3] << 8) | inBuffer[4];
      uint16_t current = ((uint16_t)inBuffer[5] << 8) | inBuffer[6];
      dpsSetVoltage(DPS_SERIAL, voltage);
      dpsSetCurrentLimit(DPS_SERIAL, current);
      break;
    }
  }
  break;
}
```

---

## 6. Race Coordinator AI Use Cases

1. **Digital Track Power Switching**: Replaces mechanical relay boards with silent, fast, and arc-free solid-state power switching.
2. **Preset Voltages per Race Class**: Automatically configure 10.0V for Box-Stock, 12.0V for Super-Stock, and 14.8V for Modified racing directly from the Heat / Race setup.
3. **Automated Yellow/Caution Speed Control**: Reduce voltage to 6.0V on yellow flags so cars pace at crawling speed rather than abruptly shutting down.
4. **Simulated Fuel Weight**: Dynamically step down voltage by small increments as fuel burns or step it up to simulate a lighter car.
5. **Over-Current & Short Protection**: Monitor telemetry to instantly detect lane shorts or stalled motors before track rails or power taps overheat.
