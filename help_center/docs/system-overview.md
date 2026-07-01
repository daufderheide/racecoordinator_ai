# System Overview

Race Coordinator AI has higher system requirements than most other lap counting software packages. Make sure your PC meets all the requirements listed below.

## System Architecture

Race Coordinator AI consists of a central software application running on a PC, Mac, or Linux system that interfaces with various hardware components. The system architecture includes the following:

- Race Coordinator AI software (Java server and angular web client)
- Windows PC, Mac, or Linux system
- Track sensors
- Slot Car controllers (analog or digital)
- Slot cars (analog or digital)
- (Optional) Relays to control track power
- (Optional) Local Area Network / Internet connection

## Hardware Requirements

- Track compatible with Race Coordinator AI software
- Analog slot cars or Digital slot cars fitted with the appropriate sensors
- Analog or Digital controllers compatible with RC AI
- Sensors: Lap counting, optional position, optional pit in/out
- Although sound capability in the PC is not required for RC AI operation, it does enrich the race experience.

## Software Requirements

### Windows 8 and older
- Java 8
- MongoDB 3.2

### Windows 10 and higher
- Java 17
- MongoDB 6.0

### MacOs and Linux
- Java 17
- MongoDB 6.0

### Mobile Devices and Tablets
- Web browser capable of displaying the RC AI web pages (virtually any modern mobile device will work).

### Raspberry Pi
- Java 17
- MongoDB 6.0

!!! Raspberry Pi is currently not supported, but it can be and is planned to be in the future.

!!! NOTE:
    Mobile devices currentl do not support running the RC AI server/database.  They can, however, be used to display the RC AI web pages and allow remote control of the race.
    
!!! NOTE:
    Support for Windows 8 and older is continginent on Java 8 and MongoDB 3.2 being able to support RC AI.  If a feature of Java 17 or MongoDB 6.0 is needed, support for Windows 8 and older will be immediately dropped.