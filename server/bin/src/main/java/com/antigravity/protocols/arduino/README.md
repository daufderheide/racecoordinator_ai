# Input
The RMS (PC) receives several input messages from the Arduino:

## Heartbeat message:
  7 total bytes
  1 byte for opcode
  4 bytes for time in usec since last heartbeat
  1 byte if the time was the first time after a reset or not (0 = no, 1 = yes)
  1 byte for terminator

### Example:
  x 54 01 02 03 04 00 3B
Where The 4 bytes for time are sent MSB to LSB
usec = (1 << 24 | 2 << 16 | 3 << 8 | 4)

## Version message:
  6 total bytes
  1 byte for opcode
  4 bytes for the version (major, minor, patch, build)
  1 byte for terminator

### Example:
  x 56 01 02 03 04 3B

## Input message:
    5 total bytes
    1 byte for opcode
    1 byte for A/D (0x41 = analog, 0x44 = digital)
    1 byte for pin
    1 byte for state
    1 byte for the terminator

### Example:
  x 49 41 01 01 3B

# Output
The RMS (PC) can send several output messages to the Arduino control it's behavior.

## RESET_COMMAND 
= { 0x52, 0x45, 0x53, 0x45, 0x54, 0x3B };          // R E S E T ;
    
## VERSION_COMMAND 
= { 0x56, 0x3B };                                // V ;
    
## PIN_MODE_READ 
= { 0x50, 0x49 };                                  // P I # [pin1 pin2 ..] ;
    
## PIN_MODE_WRITE 
This message is a P and an O followed by two bytes per input pin.  The first byte is either A or D for analog or digital and the second byte is the pin number.  The message is terminated by a semicolon.
= { 0x50, 0x4F, ... 0x3B };                                 // P O # [pin1 pin2 ..] ;
    
## WRITE_ANALOG_PIN 
= { 0x4F, 0x41, 0xFF, 0x01, 0x3B };             // O A # 0/1 ;
    
## WRITE_DIGITAL_PIN 
= { 0x4F, 0x44, 0xFF, 0x01, 0x3B };            // O D # 0/1 ;
    
## DEBOUNCE_COMMAND 
= { 0x64, 0x0, 0x0, 0x0, 0x0, 0x3B };           // d Hms Hus Lms Lus ;
    
## TIME_COMMAND 
= { 0x54, 0x3B };                                   // T ;
    
## LED_MODE 
= { 0x6C, 0x0, 0x0, 0x0, 0x0, 0x0, 0x3B };              // l string# led# brightness updateRateLow updateRateHigh ;
    
## LED_VALUE 
= { 0x4C, 0x0, 0x1, 0x0, 0x0, 0x0, 0x0, 0x3B };        // L string# # [led# r g b ..] ;

## Extended Protocol Messsages
### Opcodes
EXT_OPCODE_RACE_STATE = 0;
EXT_OPCODE_HEAT_LEADER = 1;
EXT_OPCODE_HEAT_STANDINGS = 2;
EXT_OPCODE_FUEL_LEVEL = 3;
EXT_OPCODE_REFUELING = 4;
EXT_OPCODE_TIME = 5;
EXT_OPCODE_DESLOT = 6;
EXT_OPCODE_LAP_PERF = 7;

### EXT_RACE_STATE 
= { 0x45, 0xFF, 0xFF, 0xFF, 0x3B };               // E opcode state time ;
    
### EXT_HEAT_LEADER 
= { 0x45, 0xFF, 0xFF, 0x3B };                    // E opcode lane ;
    
### EXT_FUEL_LEVEL 
= { 0x45, 0xFF, 0xFF, 0xFF, 0x3B };               // E opcode lane levelPCT ;
    
### EXT_DESLOTS 
= { 0x45, 0xFF, 0xFF, 0xFF, 0xFF, 0x3B };            // E opcode lane deslots maxDeslots ; 
    
### EXT_REFUELING 
= { 0x45, 0xFF, 0xFF, 0xFF, 0x3B };                // E opcode lane refueling ;
    
### EXT_TIME 
= { 0x45, 0xFF, 0xFF, 0x3B };                           // E opcode percent ; 
                            
### EXT_HEAT_STANDINGS 
= { 0x45, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x3B };

### EXT_LAP_PERFORMANCE 
= { 0x45, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x3B };
