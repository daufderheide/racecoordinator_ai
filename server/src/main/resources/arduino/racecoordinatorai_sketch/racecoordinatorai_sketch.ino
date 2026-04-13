/*
   Arduino slot car lap sensor

   I/O Sketch - V2.0.0.0

   The Race Coordinator Arduino sketch is covered by the Creative Commons -
   Attribution-NonCommercial-ShareAlike 4.0 International license. Copyright
   2014 by Dave Aufderheide and Kevin Gee.  All rights reserved. If you find
   this sketch and corresponding wiring suggestions useful please consider
   making a donation to the RC charity http://racecoordinator.net/charity.html

   This is a human-readable summary of (and not a substitute for) the license
   which can be found here:
   http://creativecommons.org/licenses/by-nc-sa/4.0/legalcode

   You are free to:

   Share — copy and redistribute the material in any medium or format
   Adapt — remix, transform, and build upon the material
   The licensor cannot revoke these freedoms as long as you follow the license
   terms. Under the following terms:

   Attribution — You must give appropriate credit, provide a link to the
   license, and indicate if changes were made. You may do so in any reasonable
   manner, but not in any way that suggests the licensor endorses you or your
   use. NonCommercial — You may not use the material for commercial purposes.
   ShareAlike — If you remix, transform, or build upon the material, you must
   distribute your contributions under the same license as the original. No
   additional restrictions — You may not apply legal terms or technological
   measures that legally restrict others from doing anything the license
   permits. Notices:

   You do not have to comply with the license for elements of the material in
   the public domain or where your use is permitted by an applicable exception
   or limitation. No warranties are given. The license may not give you all of
   the permissions necessary for your intended use. For example, other rights
   such as publicity, privacy, or moral rights may limit how you use the
   material.

   For complete license details please visit:
   http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

// Comment in to enable rgb led support.  You'll also likely
// need to make other changes.  Search for WITH_FAST_LED and
// the places you need to modify should be clearly marked.
#define WITH_FAST_LED

// Comment in to enable the watch dog, which is a slightly
// better way to do a software reset of the board.  Unfortunately
// not all boards support it.
// #define WITH_WATCH_DOG

// Comment in to enable support for toggling on/off fuel stuttering
// which causes relays to open/close when a driver is out of fuel in
// a fuel race.  Additional configuration is required so if you enable
// this support search for WITH_FUEL_STUTTER to find the clearly
// marked places in code you also likely need to change.
// #define WITH_FUEL_STUTTER

// Enable to print clear text into a serial monitor.  This has
// limitations and is only useful to debug the sketch.  If this is
// enabled, RC will not work with the sketch.
// #define WITH_SERIAL_DEBUG

#ifdef WITH_WATCH_DOG
#include <avr/wdt.h>
#endif

#ifdef WITH_FAST_LED
#include <FastLED.h>
#endif

const byte term = 0x3B; // ;

// Version is "major"."minor"."patch"."drop"
// V2.0.0.0
const byte rcVersion[] = {0x56, 0x01, 0x00, 0x00, 0x0, term};

// Setting for the baud rate RC will run at 115200
const long iBaudRate = 115200;
// For WAVGAT boards set this baudrate in the sketch and
// connect to the board at 9600.  My money says timing
// will be 4x off so we'll likely have to adjust timing
// in the sketch.  If we were to support this, we should
// probably create a "WAVGOT" board type.
// const long iBaudRate = 38400;

// Bytes for messages
const byte resetRequest = 0x52;         // R
const byte pinModeRequest = 0x50;       // P
const byte analogPinModeRequest = 0x70; // p
const byte writeRequest = 0x4F;         // O
const byte analogRequest = 0x41;        // A
const byte digitalRequest = 0x44;       // D

// Extended protocol
const byte extendedRequest = 0x45; // E
// Extended protocol sub-commands
const byte extRaceState = 0;
const byte extHeatLeader = 1;
const byte extHeatStandings = 2;
const byte extFuel = 3;
const byte extRefueling = 4;
const byte extRaceTime = 5;
const byte extDeslot = 6;
const byte extLapPerformance = 7;

const byte getInfoRequest = 0x47;   // G
const byte versionRequest = 0x56;   // V
const byte timeResetRequest = 0x54; // T
const byte debounceRequest = 0x64;  // d
const byte ledModeRequest = 0x6C;   // l
const byte ledWriteRequest = 0x4C;  // L

byte timeResponse[] = {0x54, 0x00, 0x00, 0x00, 0x00, 0, term};

byte inputChanged[] = {0x49, 0xFF, 0xFF, 0xFF, term};

// Opcode count [pin byte1 byte2 byte3 byte4] term
// Max 10 pins right now
#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)
byte analogData[] = {0x41, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, term};
#else
// Uno only has 6 analog pins, 33 bytes is enough
byte analogData[33];
#endif

// Unknown
const byte getInfo[] = {0x47, 0x3F, 0xFF, 0xFF, term}; // G ? -1 -1 ;
// Trinket
// const byte getInfo[] = {0x47, 0x54, 0x05, 0x00, term};  // G T 5 0 ;
// Nano
// const byte getInfo[] = {0x47, 0x4E, 0x08, 0x0E, term};  // N N 8 14 ;
// Uno
// const byte getInfo[] = {0x47, 0x55, 0x06, 0x0E, term};  // G U 6 14 ;
// Mega
// const byte getInfo[] = {0x47, 0x4D, 0x10, 0x36, term};  // G M 16 54 ;

int iPinSignal = HIGH;
byte iNumReadPins = 0;
byte *pReadPins = NULL;
byte *pLastReadSignal = NULL;

unsigned long ulDebounceHighUs = 0;
unsigned long ulDebounceLowUs = 0;
byte *pDebounceState = NULL;
byte *pDebounceNextState = NULL;
unsigned long *pDebounceTime = NULL;

#ifdef WITH_FUEL_STUTTER

// TODO: WITH_FUEL_STUTTER: Set these to the values you want
#define FUEL_NUM_LANES 4
#define FUEL_ON_TIME_US (1000L * 1000L)
#define FUEL_OFF_TIME_US (1000L * 1000L)
#define FUEL_POWER_ON HIGH
#define FUEL_POWER_OFF LOW

boolean fuelHeatInProgress;
boolean fuelOOF[FUEL_NUM_LANES];
boolean fuelPowerOn[FUEL_NUM_LANES];
long fuelTimeUs[FUEL_NUM_LANES];
byte fuelRelayPin[FUEL_NUM_LANES];
byte fuelRCPower[FUEL_NUM_LANES];
#endif

boolean bReset = true;
byte iNumWritePins = 0;

// inBuffer will hold any requests made by RC i.e. power control
#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)
byte inBuffer[512];
#else
byte inBuffer[128];
#endif
int iReadCount = 0;
boolean bRead = false;

// Hw timing
unsigned long ulPrevHwTimeUs;

// Just keep track of last keepAlive signal
unsigned long ulPrevPingUs;
unsigned long ulPingTimeUs = 1000000UL;
#ifdef WITH_SERIAL_DEBUG
#define INT_TO_TXT_CONVERSION +'0'
#define TXT_TO_INT_CONVERSION -'0'

#define SERIAL_PRINT(x) Serial.print(x);
#define SERIAL_PRINTLN(x) Serial.println(x);
#else
#define INT_TO_TXT_CONVERSION
#define TXT_TO_INT_CONVERSION

#define SERIAL_PRINT(x)
#define SERIAL_PRINTLN(x)
#endif

unsigned long ulCurDebounceUs;

#ifdef WITH_FAST_LED
// RGB pixels
#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)
#define MAX_RGB_LED_STRINGS 32
#else
#define MAX_RGB_LED_STRINGS 6
#endif

typedef struct {
  int numLeds;
  CRGB *leds;
} s_rgbLedString;

s_rgbLedString rgbLedStrings[MAX_RGB_LED_STRINGS];
CLEDController *rgbLedControllers[MAX_RGB_LED_STRINGS];
byte rgbLedBrightness[MAX_RGB_LED_STRINGS];
byte rgbLedPins[MAX_RGB_LED_STRINGS];
int rgbLedUpdateRateMs = 20;
boolean rgbLedUpdateString[MAX_RGB_LED_STRINGS];
unsigned long rgbLedUpdateTime;
boolean rgbLedInit = false;

int findRgbSlotByPin(byte pin) {
  for (int i = 0; i < MAX_RGB_LED_STRINGS; i++) {
    if (rgbLedPins[i] == pin && rgbLedStrings[i].numLeds > 0)
      return i;
  }
  return -1;
}

int allocateRgbSlotForPin(byte pin) {
  int slot = findRgbSlotByPin(pin);
  if (slot != -1)
    return slot;
  for (int i = 0; i < MAX_RGB_LED_STRINGS; i++) {
    if (rgbLedPins[i] == 0)
      return i;
  }
  return -1;
}

// WITH_FAST_LED: user todo:
// For the pins you plan to use, change the NEOPIXEL to the correct type
// for your LEDs.
//
// NOTE: This is a really old list, there may be new values possible.
//
// NOTE: There are actually others that require a CLOCK pin that we could
// support but as of right now I didn't bother.
//
// Here's all the types of leds FastLed supports.
//
//  NEOPIXEL
//  TM1803
//  TM1804
//  TM1809
//  WS2811
//  WS2812
//  WS2812B
//  APA104
//  UCS1903
//  UCS1903B
//  GW6205
//  GW6205_400

// Change this if you have a different pixel type than what we support out of
// the box. This is used if you select 'Other' in the Arduino Config Editor.
#define OTHER_LED_TYPE NEOPIXEL

#if defined(__AVR_ATmega328P__) || defined(__AVR_ATmega328__)
// Uno/Nano optimization: Only support NEOPIXEL and OTHER_LED_TYPE to save Flash
#define ADD_LEDS_ON_PIN(PIN)                                                   \
  case PIN:                                                                    \
    if (ledType == 12)                                                         \
      return &FastLED.addLeds<OTHER_LED_TYPE, PIN>(leds, numLeds);             \
    return &FastLED.addLeds<NEOPIXEL, PIN>(leds, numLeds);
#else
// Mega support for more types
#define ADD_LEDS_ON_PIN(PIN)                                                   \
  case PIN:                                                                    \
    switch (ledType) {                                                         \
    case 1:                                                                    \
      return &FastLED.addLeds<WS2811, PIN>(leds, numLeds);                     \
    case 2:                                                                    \
      return &FastLED.addLeds<WS2812, PIN>(leds, numLeds);                     \
    case 3:                                                                    \
      return &FastLED.addLeds<WS2812B, PIN>(leds, numLeds);                    \
    case 4:                                                                    \
      return &FastLED.addLeds<TM1803, PIN>(leds, numLeds);                     \
    case 5:                                                                    \
      return &FastLED.addLeds<TM1804, PIN>(leds, numLeds);                     \
    case 6:                                                                    \
      return &FastLED.addLeds<TM1809, PIN>(leds, numLeds);                     \
    case 7:                                                                    \
      return &FastLED.addLeds<APA104, PIN>(leds, numLeds);                     \
    case 8:                                                                    \
      return &FastLED.addLeds<UCS1903, PIN>(leds, numLeds);                    \
    case 9:                                                                    \
      return &FastLED.addLeds<UCS1903B, PIN>(leds, numLeds);                   \
    case 10:                                                                   \
      return &FastLED.addLeds<GW6205, PIN>(leds, numLeds);                     \
    case 11:                                                                   \
      return &FastLED.addLeds<GW6205_400, PIN>(leds, numLeds);                 \
    case 12:                                                                   \
      return &FastLED.addLeds<OTHER_LED_TYPE, PIN>(leds, numLeds);             \
    default:                                                                   \
      return &FastLED.addLeds<NEOPIXEL, PIN>(leds, numLeds);                   \
    }
#endif

CLEDController *addFastLedController(int pin, CRGB *leds, int numLeds,
                                     byte ledType) {
  switch (pin) {
#if defined(__AVR_ATmega328P__) || defined(__AVR_ATmega328__)
    // Uno/Nano optimization: Skip pins 0, 1 (Serial) and 13 (LED_BUILTIN) to
    // save Flash
    ADD_LEDS_ON_PIN(2)
    ADD_LEDS_ON_PIN(3)
    ADD_LEDS_ON_PIN(4)
    ADD_LEDS_ON_PIN(5)
    ADD_LEDS_ON_PIN(6)
    ADD_LEDS_ON_PIN(7)
    ADD_LEDS_ON_PIN(8)
    ADD_LEDS_ON_PIN(9)
    ADD_LEDS_ON_PIN(10)
    ADD_LEDS_ON_PIN(11)
    ADD_LEDS_ON_PIN(12)
#else
    ADD_LEDS_ON_PIN(0)
    ADD_LEDS_ON_PIN(1)
    ADD_LEDS_ON_PIN(2)
    ADD_LEDS_ON_PIN(3)
    ADD_LEDS_ON_PIN(4)
    ADD_LEDS_ON_PIN(5)
    ADD_LEDS_ON_PIN(6)
    ADD_LEDS_ON_PIN(7)
    ADD_LEDS_ON_PIN(8)
    ADD_LEDS_ON_PIN(9)
    ADD_LEDS_ON_PIN(10)
    ADD_LEDS_ON_PIN(11)
    ADD_LEDS_ON_PIN(12)
    ADD_LEDS_ON_PIN(13)
#endif
#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)
    ADD_LEDS_ON_PIN(14)
    ADD_LEDS_ON_PIN(15)
    ADD_LEDS_ON_PIN(16)
    ADD_LEDS_ON_PIN(17)
    ADD_LEDS_ON_PIN(18)
    ADD_LEDS_ON_PIN(19)
    ADD_LEDS_ON_PIN(20)
    ADD_LEDS_ON_PIN(21)
    ADD_LEDS_ON_PIN(22)
    ADD_LEDS_ON_PIN(23)
    ADD_LEDS_ON_PIN(24)
    ADD_LEDS_ON_PIN(25)
    ADD_LEDS_ON_PIN(26)
    ADD_LEDS_ON_PIN(27)
    ADD_LEDS_ON_PIN(28)
    ADD_LEDS_ON_PIN(29)
    ADD_LEDS_ON_PIN(30)
    ADD_LEDS_ON_PIN(31)
    ADD_LEDS_ON_PIN(32)
    ADD_LEDS_ON_PIN(33)
    ADD_LEDS_ON_PIN(34)
    ADD_LEDS_ON_PIN(35)
    ADD_LEDS_ON_PIN(36)
    ADD_LEDS_ON_PIN(37)
    ADD_LEDS_ON_PIN(38)
    ADD_LEDS_ON_PIN(39)
    ADD_LEDS_ON_PIN(40)
    ADD_LEDS_ON_PIN(41)
    ADD_LEDS_ON_PIN(42)
    ADD_LEDS_ON_PIN(43)
    ADD_LEDS_ON_PIN(44)
    ADD_LEDS_ON_PIN(45)
    ADD_LEDS_ON_PIN(46)
    ADD_LEDS_ON_PIN(47)
    ADD_LEDS_ON_PIN(48)
    ADD_LEDS_ON_PIN(49)
    ADD_LEDS_ON_PIN(50)
    ADD_LEDS_ON_PIN(51)
    ADD_LEDS_ON_PIN(52)
    ADD_LEDS_ON_PIN(53)
#endif
    ADD_LEDS_ON_PIN(A0)
    ADD_LEDS_ON_PIN(A1)
    ADD_LEDS_ON_PIN(A2)
    ADD_LEDS_ON_PIN(A3)
    ADD_LEDS_ON_PIN(A4)
    ADD_LEDS_ON_PIN(A5)
#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)
    ADD_LEDS_ON_PIN(A6)
    ADD_LEDS_ON_PIN(A7)
    ADD_LEDS_ON_PIN(A8)
    ADD_LEDS_ON_PIN(A9)
    ADD_LEDS_ON_PIN(A10)
    ADD_LEDS_ON_PIN(A11)
    ADD_LEDS_ON_PIN(A12)
    ADD_LEDS_ON_PIN(A13)
    ADD_LEDS_ON_PIN(A14)
    ADD_LEDS_ON_PIN(A15)
#endif
  default:
    return NULL;
  }
}
#endif

/*
   Setup on start configure input pins for track sensors
*/
void setup() {
  Serial.begin(iBaudRate);

  // If the Leonardo or Micro is used,
  // wait for the serial monitor to open.
  while (!Serial)
    ;

  SERIAL_PRINT(F("Num Read Pins: "));
  SERIAL_PRINTLN(iNumReadPins);

  SERIAL_PRINT(F("A0 = "));
  SERIAL_PRINT(A0);
  SERIAL_PRINT(F(", A5 = "));
  SERIAL_PRINTLN(A5);

  // First send the version number
  Serial.write(rcVersion, sizeof(rcVersion));

#ifdef WITH_FAST_LED
  // Mark all the rgb leds as unused
  for (int i = 0; i < MAX_RGB_LED_STRINGS; i++) {
    if (rgbLedStrings[i].numLeds > 0 && rgbLedInit) {
      free(rgbLedStrings[i].leds);
    }
    rgbLedStrings[i].numLeds = 0;
    rgbLedPins[i] = 0;
    rgbLedUpdateString[i] = false;
  }
  rgbLedInit = true;
  rgbLedUpdateTime = 0xffffffff;
#endif

#ifdef WITH_FUEL_STUTTER
  // TODO: WITH_FUEL_STUTTER:
  // This puts the lane relays on pins D2-D5, change
  // this to your pin configuration as needed.  Make sure
  // to comment in/out any lanes you are/are not using.
  // The defaults here are assuming a 4 lane track.
  fuelRelayPin[0] = 2; // Lane 1
  fuelRelayPin[1] = 3; // Lane 2
  fuelRelayPin[2] = 4; // Lane 3
  fuelRelayPin[3] = 5; // Lane 4
                       //  fuelRelayPin[4] = 6;  // Lane 5
                       //  fuelRelayPin[5] = 7;  // Lane 6
                       //  fuelRelayPin[6] = 8;  // Lane 7
                       //  fuelRelayPin[7] = 9;  // Lane 8

  fuelHeatInProgress = false;
  for (int i = 0; i < FUEL_NUM_LANES; i++) {
    fuelOOF[i] = false;
    fuelPowerOn[i] = false;
    fuelTimeUs[i] = 0;
    fuelRCPower[i] = FUEL_POWER_OFF;
    pinMode(fuelRelayPin[i], OUTPUT);
  }

#endif

  ulPrevHwTimeUs = micros();
  // Force an immediate ping
  ulPrevPingUs = ulPrevHwTimeUs - ulPingTimeUs;
  sendPing();

  ulCurDebounceUs = micros();
}

/*
   Main loop for processing lap counting
*/

unsigned long ulStartMs = 0;
unsigned long ulLoopCnt = 0;

#ifdef WITH_FUEL_STUTTER
void stutterRelays(unsigned long ulDeltaUs) {
  if (fuelHeatInProgress) {
    for (int i = 0; i < FUEL_NUM_LANES; i++) {
      // Fuel Stuttering only occurs if RC wants the power
      // on for a lane.  Otherwise don't touch it.
      if (fuelRCPower[i] == FUEL_POWER_ON) {
        if (fuelOOF[i]) {
          fuelTimeUs[i] -= ulDeltaUs;
          if (fuelTimeUs[i] < 0) {
            if (fuelPowerOn[i]) {
              // Turn power off
              fuelTimeUs[i] = FUEL_OFF_TIME_US;
              fuelPowerOn[i] = false;
              digitalWrite(fuelRelayPin[i], FUEL_POWER_OFF);
            } else {
              // Turn power on
              fuelTimeUs[i] = FUEL_ON_TIME_US;
              fuelPowerOn[i] = true;
              digitalWrite(fuelRelayPin[i], FUEL_POWER_ON);
            }
          }
        } else {
          if (!fuelPowerOn[i]) {
            // Turn power on
            fuelTimeUs[i] = FUEL_ON_TIME_US;
            fuelPowerOn[i] = true;
            digitalWrite(fuelRelayPin[i], FUEL_POWER_ON);
          }
        }
      }
    }
  } else {
    // Force the relay pin to the state RC wants.
    for (int i = 0; i < FUEL_NUM_LANES; i++) {
      digitalWrite(fuelRelayPin[i], fuelRCPower[i]);
    }
  }
}
#endif

void loop() {
  // Need micros for debounce and milis for timing data
  // TODO: consider calling micros and milis rather than
  // the divide.  There's a good chance the divide is more
  // expensive than the milis call...  we'll see
  unsigned long ulCurTimeUs = micros();
  unsigned long ulDeltaUs = ulCurTimeUs - ulCurDebounceUs;
  ulCurDebounceUs = ulCurTimeUs;

  unsigned long ulCurTimeMs = ulCurTimeUs / 1000;

  for (int i = 0; i < iNumReadPins; i++) {
    handleDebounce(i, ulCurTimeUs, ulDeltaUs);
    iPinSignal = digitalRead(pReadPins[i]);

    // Send if the input has changed or
    // this is the first time through the loop
    if (bReset) {
      sendStateChange(i, iPinSignal, ulCurTimeMs);
    } else if (iPinSignal != pLastReadSignal[i]) {
      setupStateChange(i, iPinSignal, ulCurTimeMs);
    }
    pLastReadSignal[i] = iPinSignal;
  }
  bReset = false;

  // If there is some data from RC to process do it here
  if (bRead) {
    processRequest();
  }
#ifdef WITH_FAST_LED
  else if (ulCurTimeMs >= rgbLedUpdateTime) {
    // NOTE: We've seen that if we try to update the pixels too fast
    // that crazy things happen.  So we'll make sure we don't update
    // them faster than 10ms and we'll only update them if we didn't
    // read anything from the serial port.  This should allow us to
    // read any transient led updates from RC and still refresh the
    // pixels fast enough so you can't actually tell we may delay
    // the update.
    rgbLedUpdateTime = 0xffffffff;
    for (int i = 0; i < MAX_RGB_LED_STRINGS; i++) {
      if (rgbLedUpdateString[i]) {
        rgbLedControllers[i]->showLeds(rgbLedBrightness[i]);
        rgbLedUpdateString[i] = false;

        // Only update 1 led string every 10 ms
        rgbLedUpdateTime = ulCurTimeMs + rgbLedUpdateRateMs;
        break;
      }
    }
  }
#endif

#ifdef WITH_FUEL_STUTTER
  stutterRelays(ulDeltaUs);
#endif

  readAnalog(ulDeltaUs);

  keepAlive();

#ifdef WITH_SERIAL_DEBUG
  ulLoopCnt++;
  if (ulLoopCnt == 50000) {
    unsigned long endMs = millis();
    unsigned long timeMs = endMs - ulStartMs;

    SERIAL_PRINT(F("Avg Poll time: "));
    SERIAL_PRINT((timeMs / (float)ulLoopCnt));
    SERIAL_PRINTLN(F("ms"));

    ulStartMs = endMs;
    ulLoopCnt = 0;
  }
#endif
}

#ifdef WITH_SERIAL_DEBUG
// 5s
long long lAnalogReadDelayUs = (5L * 1000L * 1000L);
#else
// 10ms
long long lAnalogReadDelayUs = (10L * 1000L);
#endif
long long lAnalogReadTimeUs = 0L;
int iNumAnalogReadPins = 0;
byte *pAnalogReadPins = NULL;

void readAnalog(unsigned long deltaUs) {
  if (iNumAnalogReadPins <= 0) {
    return;
  }

  lAnalogReadTimeUs -= deltaUs;
  if (lAnalogReadTimeUs <= 0) {
    lAnalogReadTimeUs += lAnalogReadDelayUs;

    SERIAL_PRINTLN(F("Reading analog pins..."));

    int index = 2;
    for (int i = 0; i < iNumAnalogReadPins; i++) {
      SERIAL_PRINT(F("Reading analog pin: "));
      SERIAL_PRINT(pAnalogReadPins[i] - A0);

      int analogValue = analogRead(pAnalogReadPins[i]);

      SERIAL_PRINT(F(" -- value is: "));
      SERIAL_PRINTLN(analogValue);

      analogData[index] = pAnalogReadPins[i] - A0;
      analogData[index + 1] = ((analogValue >> 24) & 0xff);
      analogData[index + 2] = ((analogValue >> 16) & 0xff);
      analogData[index + 3] = ((analogValue >> 8) & 0xff);
      analogData[index + 4] = (analogValue & 0xff);

      index += 5;
    }
    analogData[index] = term;

    int byteCount = 1 + 1 + (5 * iNumAnalogReadPins) + 1;
    Serial.write(analogData, byteCount);
  }
}

void handleDebounce(int pinIndex, unsigned long ulCurTimeMs,
                    unsigned long ulDeltaUs) {
  if (pDebounceTime[pinIndex] != 0xffffffff) {
    // Currently debouncing this pin
    pDebounceTime[pinIndex] += ulDeltaUs;

    unsigned long time = ulDebounceHighUs;
    if (pDebounceNextState[pinIndex] == LOW) {
      time = ulDebounceLowUs;
    }

    if (pDebounceTime[pinIndex] >= time) {
      // State confirmed
      SERIAL_PRINT(F("Pin "));
      SERIAL_PRINT(pReadPins[pinIndex]);
      SERIAL_PRINT(F(" state changed confirmed to "));
      SERIAL_PRINT(pDebounceNextState[pinIndex]);
      SERIAL_PRINT(F(" with debounce time of "));
      SERIAL_PRINT(pDebounceTime[pinIndex]);
      SERIAL_PRINTLN(F("us"));

      sendStateChange(pinIndex, pDebounceNextState[pinIndex], ulCurTimeMs);
      pDebounceState[pinIndex] = pDebounceNextState[pinIndex];
      pDebounceTime[pinIndex] = 0xffffffff;
    }
  }
}

void sendStateChange(int pinIndex, int pinState, unsigned long ulCurTimeMs) {
  SERIAL_PRINT(F("Pin "));
  SERIAL_PRINT(pReadPins[pinIndex]);
  SERIAL_PRINT(F(" changed, was "));
  SERIAL_PRINT(pLastReadSignal[pinIndex]);
  SERIAL_PRINT(F(", is "));
  SERIAL_PRINT(iPinSignal);
  SERIAL_PRINT(F(" at time "));
  SERIAL_PRINTLN(ulCurTimeMs);

  // Set the signal in the message
  byte pinType = 0x44;
  byte pin = pReadPins[pinIndex];
  if (pReadPins[pinIndex] >= A0) {
    // Analog pin
    pinType = 0x41;
    pin -= A0;
  }

  sendTime(ulCurTimeMs);

  pDebounceState[pinIndex] = pinState;
  pDebounceNextState[pinIndex] = pinState;
  pDebounceTime[pinIndex] = 0xffffffff;

  // Force pin value to 0 or 1.  This is probably
  // not needed, but it's what RC is looking for
  if (pinState == HIGH) {
    pinState = 1;
  } else {
    pinState = 0;
  }

  inputChanged[1] = pinType;
  inputChanged[2] = pin;
  inputChanged[3] = pinState;

  // TODO: Handle debounce, make sure one way or the other
  // to force the write if bReset is true...
  // TODO: Probably only debounce digital pins
  Serial.write(inputChanged, sizeof(inputChanged));
}

void setupStateChange(int pinIndex, int pinState, unsigned long ulCurTimeMs) {
  if (pinState == pDebounceState[pinIndex]) {
    // Pin bounced
    SERIAL_PRINT(F("Pin "));
    SERIAL_PRINT(pReadPins[pinIndex]);
    SERIAL_PRINT(F(" bounced back to "));
    SERIAL_PRINT(pinState);
    SERIAL_PRINT(F(" with bounce time "));
    SERIAL_PRINTLN(pDebounceTime[pinIndex]);

    pDebounceNextState[pinIndex] = pinState;
    pDebounceTime[pinIndex] = 0xffffffff;
  } else if (pinState != pDebounceNextState[pinIndex]) {
    pDebounceNextState[pinIndex] = pinState;
    pDebounceTime[pinIndex] = 0;

    SERIAL_PRINT(F("Pin "));
    SERIAL_PRINT(pReadPins[pinIndex]);
    SERIAL_PRINT(F(" setting up debounce to state "));
    SERIAL_PRINTLN(pinState);
  } else {
    // Should never be here, this would mean we're trying
    // to change states to the state we're already debouncing
    // which shouldn't be possible.
    SERIAL_PRINT(F("ERROR: Pin "));
    SERIAL_PRINT(pReadPins[pinIndex]);
    SERIAL_PRINT(F(" changing state to same state we're already debouncing: "));
    SERIAL_PRINTLN(pinState);
  }
}

/*
   Process any requests from RC
*/
void processRequest() {
  SERIAL_PRINTLN(F(""));
  SERIAL_PRINT(F("PR Opcode: "));
  SERIAL_PRINTLN(inBuffer[0]);

  switch (inBuffer[0]) {
  case resetRequest:
    processResetRequest();
    break;

  case ledModeRequest:
    processLedModeRequest();
    break;

  case ledWriteRequest:
    processLedWriteRequest();
    break;

  case pinModeRequest:
    processPinModeRequest();
    break;

  case analogPinModeRequest:
    processAnalogPinModeRequest();
    break;

  case writeRequest:
    processWriteRequest();
    break;

  case getInfoRequest:
    Serial.write(getInfo, sizeof(getInfo));
    break;

  case versionRequest:
    Serial.write(rcVersion, sizeof(rcVersion));
    break;

  case timeResetRequest:
    processTimeResetRequest();
    break;

  case debounceRequest:
    processDebounceRequest();
    break;

  case extendedRequest:
    processExtendedRequest();
    break;

  default:
    SERIAL_PRINTLN(F(""));
    SERIAL_PRINT(F("***Unknown OpCode: "));
    SERIAL_PRINTLN(inBuffer[1]);
    break;
  }
  SERIAL_PRINTLN(F("**** PM DONE ****"));

  iReadCount = 0;
  bRead = false;
}

void processResetRequest() {
  if (inBuffer[1] == 0x45 && inBuffer[2] == 0x53 && inBuffer[3] == 0x45 &&
      inBuffer[4] == 0x54) {
    SERIAL_PRINTLN(F(""));
    SERIAL_PRINTLN(F("Handle Reset"));
    softwareReboot();
  }
}

void processLedModeRequest() {
#ifdef WITH_FAST_LED
  SERIAL_PRINTLN(F(""));
  SERIAL_PRINT(F("Setting LED Pin mode: "));

  byte pin = inBuffer[1];
  byte numLeds = inBuffer[2];

  SERIAL_PRINTLN(pin);

  if (numLeds > 0) {
    int stringNum = allocateRgbSlotForPin(pin);
    if (stringNum == -1) {
      SERIAL_PRINTLN(F("Error: No available LED slots"));
      return;
    }
#ifdef WITH_SERIAL_DEBUG
    rgbLedBrightness[stringNum] = 64;
#else
    rgbLedBrightness[stringNum] = inBuffer[3];
    rgbLedUpdateRateMs = inBuffer[4];
    rgbLedUpdateRateMs |= (inBuffer[5] << 8);
#endif
    SERIAL_PRINTLN(F(""));
    SERIAL_PRINT(F("Led String Slot "));
    SERIAL_PRINT(stringNum);
    SERIAL_PRINT(F(", Pin "));
    SERIAL_PRINT(pin);
    SERIAL_PRINT(F(", numLeds "));
    SERIAL_PRINT(numLeds);
    SERIAL_PRINTLN(F(" enabled"));

    bool needsController = false;
    if (numLeds > rgbLedStrings[stringNum].numLeds ||
        pin != rgbLedPins[stringNum]) {
      needsController = true;
      if (rgbLedStrings[stringNum].numLeds > 0) {
        free(rgbLedStrings[stringNum].leds);
      }
      rgbLedStrings[stringNum].numLeds = numLeds;
      rgbLedPins[stringNum] = pin;
      rgbLedStrings[stringNum].leds = (CRGB *)malloc(sizeof(CRGB) * numLeds);
    }

    for (int i = 0; i < rgbLedStrings[stringNum].numLeds; i++) {
      rgbLedStrings[stringNum].leds[i] = CRGB::Black;
    }

    if (needsController) {
      byte ledType = inBuffer[6];
      rgbLedControllers[stringNum] =
          addFastLedController(pin, rgbLedStrings[stringNum].leds,
                               rgbLedStrings[stringNum].numLeds, ledType);
    }
  } else {
    // numLeds == 0 means disable this pin
    int stringNum = findRgbSlotByPin(pin);
    if (stringNum != -1) {
      SERIAL_PRINT(F("Disabling LED string on pin "));
      SERIAL_PRINTLN(pin);
      if (rgbLedStrings[stringNum].numLeds > 0) {
        free(rgbLedStrings[stringNum].leds);
      }
      rgbLedStrings[stringNum].numLeds = 0;
      rgbLedPins[stringNum] = 0;
      rgbLedControllers[stringNum] = NULL;
    }
  }
#endif
}

void processLedWriteRequest() {
#ifdef WITH_FAST_LED
  byte pin = inBuffer[1];
  byte numUpdates = inBuffer[2];
  int stringNum = findRgbSlotByPin(pin);

  if (stringNum != -1) {
    SERIAL_PRINTLN(F(""));
    SERIAL_PRINT(F("Setting pixels on led pin "));
    SERIAL_PRINT(pin);
    SERIAL_PRINT(F(" with "));
    SERIAL_PRINT(numUpdates);
    SERIAL_PRINTLN(F(" updates"));

    int bufferIndex = 3;
    for (int i = 0; i < numUpdates; i++) {
      byte pixel = inBuffer[bufferIndex + 0];
      byte r = inBuffer[bufferIndex + 1];
      byte g = inBuffer[bufferIndex + 2];
      byte b = inBuffer[bufferIndex + 3];
      bufferIndex += 4;

      if (pixel < rgbLedStrings[stringNum].numLeds) {
#ifdef WITH_SERIAL_DEBUG
        r *= 255;
        g *= 255;
        b *= 255;
#endif
        SERIAL_PRINT(F("Setting Pixel: "));
        SERIAL_PRINT(pixel);
        SERIAL_PRINT(F(" ["));
        SERIAL_PRINT(r);
        SERIAL_PRINT(F(", "));
        SERIAL_PRINT(g);
        SERIAL_PRINT(F(", "));
        SERIAL_PRINT(b);
        SERIAL_PRINTLN(F("]"));

        rgbLedStrings[stringNum].leds[pixel].r = r;
        rgbLedStrings[stringNum].leds[pixel].g = g;
        rgbLedStrings[stringNum].leds[pixel].b = b;
      }
    }

    // Wait a small amount of time before updating the strings so that
    // we can filter out transients from RC and make sure we don't spam
    // the leds too hard.
    // NOTE: if rgbLedUpdateTime != 0xffffffff we should consider not
    // updating this time.  But the rate RC updates the leds should not
    // be this fast and we're trying to avoid transients so for now this
    // is fine.
    rgbLedUpdateTime = millis() + rgbLedUpdateRateMs;
    rgbLedUpdateString[stringNum] = true;
  }
#endif
}

/*
   Receive any messages from RC
   add them until we have a complete message
*/
void serialEvent() {
  while (!bRead && Serial.available()) {
    byte inChar = Serial.read();

    // Note: The opening of the serial port ends up sending us
    // a bunch of control characters.  We've only ever seen 0xF0,
    // but to be safe let's ignore lots of junk as long as we
    // haven't read in one of our opcodes yet.
    if (iReadCount > 0 || (inChar > 0x19 && inChar < 0x7f)) {
      inBuffer[iReadCount++] = inChar;
      if (inChar == term) {
        bRead = true;
      }
    }
  }
}

void processPinModeRequest() {
  if (inBuffer[1] == 0x49) {
    // Read pins
    SERIAL_PRINTLN("");
    SERIAL_PRINTLN("Read Pin Modes");

    // Free the old setup if it existed
    if (pReadPins != NULL) {
      free(pReadPins);
      free(pLastReadSignal);

      free(pDebounceState);
      free(pDebounceNextState);
      free(pDebounceTime);
    }

    // Setup the new configuration
    iNumReadPins = inBuffer[2] TXT_TO_INT_CONVERSION;
    pReadPins = (byte *)malloc(iNumReadPins * sizeof(byte));
    pLastReadSignal = (byte *)malloc(iNumReadPins * sizeof(byte));

    pDebounceState = (byte *)malloc(iNumReadPins * sizeof(byte));
    pDebounceNextState = (byte *)malloc(iNumReadPins * sizeof(byte));
    pDebounceTime =
        (unsigned long *)malloc(iNumReadPins * sizeof(unsigned long));

    int iBufIndex = 3;
    for (int i = 0; i < iNumReadPins; i++) {
      pDebounceState[i] = HIGH;
      pDebounceNextState[i] = HIGH;
      pDebounceTime[i] = 0xffffffff;

      pLastReadSignal[i] = HIGH;
      int mode = INPUT_PULLUP;
      int pin = inBuffer[iBufIndex + 1] TXT_TO_INT_CONVERSION;

      if (inBuffer[iBufIndex] == 0x41) {
        // Analog pin
        pin += A0;
      }

      pReadPins[i] = pin;
      iBufIndex += 2;
      pinMode(pin, mode);
    }
    // Force send the initial pin states
    bReset = true;
  } else {
    // Write pins
    SERIAL_PRINTLN("");
    SERIAL_PRINTLN("Write Pin Modes");

    iNumWritePins = inBuffer[2] TXT_TO_INT_CONVERSION;
    int iBufIndex = 3;
    for (int i = 0; i < iNumWritePins; i++) {
      int pin = inBuffer[iBufIndex + 1] TXT_TO_INT_CONVERSION;
      if (inBuffer[iBufIndex] == 0x41) {
        // Analog pin
        pin += A0;
      }

      SERIAL_PRINTLN(F(""));
      SERIAL_PRINT(F("Write pin:"));
      SERIAL_PRINTLN(pin);

      iBufIndex += 2;
      pinMode(pin, OUTPUT);
    }
  }
}

void processAnalogPinModeRequest() {
  // Setup pins that read raw analog data
  SERIAL_PRINTLN(F(""));
  SERIAL_PRINTLN(F("Analog Read Pin Modes"));

  // Free the old setup if it existed
  if (pAnalogReadPins != NULL) {
    free(pAnalogReadPins);
  }

  // Setup the new configuration
  iNumAnalogReadPins = inBuffer[1] TXT_TO_INT_CONVERSION;
  pAnalogReadPins = (byte *)malloc(iNumAnalogReadPins * sizeof(byte));
  analogData[1] = iNumAnalogReadPins;

  SERIAL_PRINT(F("   Num Pins: "));
  SERIAL_PRINTLN(analogData[1]);

  int iBufIndex = 2;
  for (int i = 0; i < iNumAnalogReadPins; i++) {
    // Skip past pin type.  This pin mode uses the same code in RC, but we
    // already know the pin type is Analog
    int pin = inBuffer[iBufIndex + 1] TXT_TO_INT_CONVERSION;

    SERIAL_PRINT("      Pin: ");
    SERIAL_PRINTLN(pin);

    pin += A0;

    pAnalogReadPins[i] = pin;
    iBufIndex += 2;
    pinMode(pin, INPUT);
  }
}

void processWriteRequest() {
  int pin = inBuffer[2] TXT_TO_INT_CONVERSION;
  if (inBuffer[1] == 0x41) {
    // Write to an analog pin
    pin += A0;
  }

  byte state = inBuffer[3] TXT_TO_INT_CONVERSION;
#ifdef WITH_FUEL_STUTTER
  // Check if this is a per lane relay pin, if so,
  // figure out what to do
  boolean fuelPin = false;
  for (int i = 0; i < FUEL_NUM_LANES; i++) {
    if (fuelRelayPin[i] == pin) {
      // This is a fuel relay pin
      fuelPin = true;
      fuelRCPower[i] = state;

      if (state == FUEL_POWER_OFF) {
        fuelPowerOn[i] = false;
        fuelTimeUs[i] = 0;
      }

      break;
    }
  }

  // Let the stutter code handle turning the relay back on
  if (fuelPin && state == FUEL_POWER_ON) {
    break;
  }
#endif

  digitalWrite(pin, inBuffer[3] TXT_TO_INT_CONVERSION);

  SERIAL_PRINTLN(F(""));
  SERIAL_PRINT(F("Write Pin: "));
  SERIAL_PRINT(pin);
  SERIAL_PRINT(F(" to "));
  SERIAL_PRINTLN(inBuffer[3] TXT_TO_INT_CONVERSION);
}

void processTimeResetRequest() {
  // Note: RC does not send a lane, but DRC does
  // I don't this DRC needs to...
  byte lane;
  if (inBuffer[1] == term) {
    lane = 0;
  } else {
    lane = inBuffer[1] TXT_TO_INT_CONVERSION;
  }

  SERIAL_PRINT("TIME RESET REQUEST LANE: ");
  SERIAL_PRINTLN(lane);

  // First send whatever time we have, the RMS
  // will either take it or dump it, but we don't care.
  sendTime(0xffffffff);

  // Now mark it such that the next time sent has
  // the reset flag so the RMS knows what to do.
  timeResponse[5] = (1 << lane);
}

void processDebounceRequest() {
  ulDebounceHighUs = (inBuffer[1] TXT_TO_INT_CONVERSION) * 1000;
  ulDebounceHighUs += (inBuffer[2] TXT_TO_INT_CONVERSION) * 4;
  ulDebounceLowUs = (inBuffer[3] TXT_TO_INT_CONVERSION) * 1000;
  ulDebounceLowUs += (inBuffer[4] TXT_TO_INT_CONVERSION) * 4;

  SERIAL_PRINT("Debounce set to H/L");
  SERIAL_PRINT(ulDebounceHighUs);
  SERIAL_PRINT("/");
  SERIAL_PRINTLN(ulDebounceLowUs)
}

void processExtendedRequest() {
  // NOTE: Extended protocol can be anything the application chooses to send.
  // The extended protocol always starts with 0x45 (E) and ends with the
  // terminator 0x3B (;)
  SERIAL_PRINT(F("Got Extended Protocal: "));
  SERIAL_PRINT(inBuffer[0]);
  SERIAL_PRINT(F(" "));
  SERIAL_PRINT(inBuffer[1]);
  SERIAL_PRINT(F(" "));
  SERIAL_PRINT(inBuffer[2]);
  SERIAL_PRINT(F(" "));
  SERIAL_PRINT(inBuffer[3]);
  SERIAL_PRINT(F(" "));
  SERIAL_PRINTLN(inBuffer[4]);

  switch ((inBuffer[1] TXT_TO_INT_CONVERSION)) {
  case extRaceState: {
    SERIAL_PRINTLN(F("Got extRaceState"));

    //  Race State
    switch (inBuffer[2]) {
    case 0:
    case 1:
      // Heat not started (0)
      // Heat not restarted (1)
#ifdef WITH_FUEL_STUTTER
      fuelHeatInProgress = false;
#endif
      break;

    case 2:
    case 3:
      // Heat starting (2)
      // Heat re-started (3)

      // NOTE: inBuffer[3] is the countdown timer (4, 3, 2, 1, 0)
      // But there's some whacked things like a -2 which I think is
      // a jammed in "go" state.  It should be considered a green flag
#ifdef WITH_FUEL_STUTTER
      fuelHeatInProgress = true;
#endif
      break;

    case 4:
      // Heat is running
#ifdef WITH_FUEL_STUTTER
      fuelHeatInProgress = true;
#endif
      break;

    case 5:
      // Heat is paused
#ifdef WITH_FUEL_STUTTER
      fuelHeatInProgress = false;
#endif
      break;

    case 6:
      // Heat ended
#ifdef WITH_FUEL_STUTTER
      fuelHeatInProgress = false;
#endif
      break;

    case 7:
      // Race ended
#ifdef WITH_FUEL_STUTTER
      fuelHeatInProgress = false;
#endif
      break;

    case 8:
      // RC is closing
#ifdef WITH_FUEL_STUTTER
      fuelHeatInProgress = false;
#endif
      break;
    }
    break;
  }
  case extHeatLeader:
    // Heat Leader
    // byte lane = inBuffer[2];
    SERIAL_PRINTLN("Got extHeatLeader");
    break;

  case extHeatStandings:
    // Heat Standings
    // byte count = inBuffer[2];
    // for (i = 0; i < count; i++) {
    // Each value is the lane at the positional index
    // So the current 1st place lane would be
    // inbuffer[3 + 0]
    // Position [i] = inbuffer[3 + i];
    // }
    SERIAL_PRINTLN("Got extHeatStandings");
    break;

  case extFuel:
    // Fuel
#ifdef WITH_FUEL_STUTTER
  {
    SERIAL_PRINTLN("**********Got extFuel*********");

    byte lane = inBuffer[2] TXT_TO_INT_CONVERSION;
    if (lane < FUEL_NUM_LANES) {
      byte level = inBuffer[3] TXT_TO_INT_CONVERSION;

      SERIAL_PRINT("Got fuel for lane ");
      SERIAL_PRINT(lane);
      SERIAL_PRINT(" and value ");
      SERIAL_PRINTLN(level);

      if (level == 0 && !fuelOOF[lane]) {
        // Assume power is on, setting time to 0 will cause it
        // to turn off
        fuelOOF[lane] = true;
        fuelTimeUs[lane] = 0;
        fuelPowerOn[lane] = true;
      } else if (level > 0) {
        // This will turn power back on if its not already
        fuelOOF[lane] = false;
      }
    }
  }
#endif
  break;

  case extRefueling:
    // Refueling
    // byte lane = inBuffer[2];
    // bool refueling = (inBuffer[3] != 0);
    SERIAL_PRINTLN("**********Got extRefueling*********");
    break;

  case extRaceTime:
    // Race Time
    // byte timePct = inBuffer[2];
    // timePct range is [0, 100]
    SERIAL_PRINTLN("**********Got extRaceTime*********");
    break;

  case extDeslot:
    // Deslot
    // byte lane = inBuffer[2];
    // byte deslotes = inBuffer[3];
    // byte maxDeslots = inBuffer[4];
    SERIAL_PRINTLN("**********Got extDeslot*********");
    break;

  case extLapPerformance:
    // Lap Performance
    // byte lane = inBuffer[2];
    // Performance values.  I think 0 indicates the last lap
    // underperforms, 1 indicates the last lap is better and
    // 2 indicates that the performance value is not applicable
    // byte recordPerf = inBuffer[3];
    // byte heatPerf = inBuffer[4];
    // byte selfPerf = inBuffer[5];
    // byte bestLap = inBuffer[6];
    // byte bestHeatLap = inBuffer[7];
    SERIAL_PRINTLN(F("**********Got extLapPerformance*********"));
    break;
  }
}

unsigned long g_curTimeMs = 0;
void sendTime(unsigned long ulCurTimeMs) {
  // Total Hack
  if (ulCurTimeMs == 0xffffffff) {
    // Force time to be sent, but don't change the
    // last time value used.
    ulCurTimeMs = g_curTimeMs;
    g_curTimeMs++;
  }

  if (g_curTimeMs != ulCurTimeMs) {
    g_curTimeMs = g_curTimeMs;

    unsigned long ulCurTimeUs = micros();
    unsigned long ulDeltaUs = ulCurTimeUs - ulPrevHwTimeUs;
    ulPrevHwTimeUs = ulCurTimeUs;

    timeResponse[1] = ((ulDeltaUs >> 24) & 0xff);
    timeResponse[2] = ((ulDeltaUs >> 16) & 0xff);
    timeResponse[3] = ((ulDeltaUs >> 8) & 0xff);
    timeResponse[4] = (ulDeltaUs & 0xff);

    Serial.write(timeResponse, sizeof(timeResponse));

    SERIAL_PRINT(F("TIME RESPONSE: "));
    SERIAL_PRINTLN(timeResponse[5]);

    // Make sure the reset bit is cleared after we send
    // so the reset will only be there once.
    timeResponse[5] = 0;
  }
}

void sendPing() {
  ulPrevPingUs += ulPingTimeUs;
  sendTime(0xffffffff);
}

/*
   RC requires a keep alive once every 5 seconds
   so do 1 every second just in case
*/
void keepAlive() {
  unsigned long ulCurTimeUs = micros();
  unsigned long ulDeltaUs = ulCurTimeUs - ulPrevPingUs;

  if (ulDeltaUs > ulPingTimeUs) {
    sendPing();
  }
}

#ifdef WITH_FAST_LED
void resetLeds() {
  // NOTE: watch dog is a full reset so if we want
  // to reset the pixels we just have to do this and
  // pray
  for (int i = 0; i < MAX_RGB_LED_STRINGS; i++) {
    boolean needShow = false;
    for (int k = 0; k < rgbLedStrings[i].numLeds; k++) {
      rgbLedStrings[i].leds[k] = CRGB::Black;
      needShow = true;
    }

    if (needShow) {
      rgbLedControllers[i]->showLeds(rgbLedBrightness[i]);
    }
  }
}
#endif

void softwareReboot() {
#ifdef WITH_FAST_LED
  resetLeds();
#endif

#ifdef WITH_WATCH_DOG
  wdt_enable(WDTO_15MS);
  while (1) {
    SERIAL_PRINTLN(F("Waiting for watch dog reboot"));
  }
#else
  SERIAL_PRINTLN(F("Doing software reboot"));
  asm volatile("jmp 0");
#endif
}
