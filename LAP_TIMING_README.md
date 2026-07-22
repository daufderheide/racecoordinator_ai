# Race Coordinator AI: Lap Timing Architecture
Date reviewed: 07/22/2026

This document explains the architecture and logic behind lap timing in Race Coordinator AI, specifically for the Arduino and Trackmate hardware interfaces.

## 1. Hardware-Level Timing (The Foundation)
To guarantee extremely high precision and avoid PC operating system latency (jitter), both interfaces rely on hardware-level timers rather than using the PC's clock. The PC software never uses `System.currentTimeMillis()` or any other OS-level clock to determine a lap time.

### Arduino
*   The custom Arduino sketch uses its internal `micros()` clock for microsecond precision.
*   It handles debouncing locally on the board. 
*   The Arduino continuously sends a "heartbeat" message to the PC containing the `timeInUse` (time elapsed since the last heartbeat). The PC accurately accumulates this time for each lane into a `HwTime` object.
*   **The "Delta-Before-Event" Design:** When a car crosses the sensor, the Arduino immediately calculates the exact microsecond delta since the *last* time it sent a message to the PC. It sends a "Time Update" message to the PC **immediately before** it sends the "Pin Trigger" message. This guarantees precision regardless of how slow the PC is to read the data.

### Trackmate
*   Trackmate hardware intrinsically calculates lap times natively in milliseconds on the board itself.
*   When a car crosses a sensor, the board sends an ASCII signal (e.g., 'A' for lane 1) followed by the actual lap time digits.
*   The software reads this lap time directly from the hardware byte stream.

### The `HwTime` Accumulator
On the PC software side (in `DefaultProtocol`), there is an accumulator (`HwTime`) for every lane. It adds up the microsecond/millisecond ticks sent by the hardware. When a sensor hit is validated, the software asks `HwTime` for the current elapsed time and immediately resets that accumulator for the next lap.

## 2. PC Threading & Latency Immunity
**Threading or inter-component communication on the PC software side cannot impact the timing accuracy.** 

Because the hardware sends the exact elapsed time *and then* the lap trigger over the serial port, both of those messages sit safely in a queue (a serial buffer) waiting for the PC to read them. If the Java software on the PC is busy—perhaps rendering a UI update, running a database query, or paused by a Garbage Collection cycle—it doesn't matter. 

Once the PC thread wakes up and processes the serial data:
1. It reads the first message, adds the exact hardware time delta to the accumulator.
2. It reads the next message (the lap trigger) and grabs that perfectly accurate accumulated time.

The only way inter-component communication could theoretically impact timing is if the PC software froze for so long (e.g., many seconds) that the serial buffer completely filled up and dropped incoming bytes.

## 3. Minimum Lap Times (and "Pending" Laps)
When a sensor trigger reaches the core race logic (`HeatExecutionManager`), the first major check is the **Minimum Lap Time**. 

If a lap time is recorded that is *faster* than the track's configured Min Lap Time, it is **rejected**. However, the time itself is **not thrown away**.
*   The software flags the lap as a `MIN_LAP_TIME` rejection.
*   The rejected time is added to a hidden variable called `pendingLapTime` for that driver.
*   When the car finally crosses the sensor again with a *valid* lap, the software takes the new lap time and **adds the `pendingLapTime` to it**. 

This prevents issues where a sensor bounces or double-triggers. The tiny ghost lap is simply absorbed into the driver's true, full lap time.

## 4. Yellow Flags (Paused Heats) & Drift Time
Yellow flags drastically alter how time is tracked to ensure drivers aren't penalized for pausing the race:
*   **Partial Time Capture:** The exact millisecond the race is paused, the software asks the hardware interfaces for the current partial lap times (the time elapsed since the driver's last lap). This partial time is scooped up and stored in their `pendingLapTime`.
*   **Drift Laps:** If a car is moving fast when a yellow flag is thrown, they might coast over the start/finish line while the race is paused. If a car crosses the line *within* the configured **Drift Time** window after pausing, the lap is accepted and flagged as an `isDrift` lap.
*   **Resuming:** When the race resumes (Green flag), the hardware timers are wiped and restarted. The time spent sitting on the track during the pause is entirely ignored. When the driver completes their next lap, the total lap time will simply be: `(Partial Time BEFORE pause) + (Time AFTER resume)`.

## 5. Other Factors Affecting Lap Times
A few other things can intercept or alter a lap time before it hits the scoreboard:

*   **Reaction Time:** If "Start Behind Sensor" is enabled, the very first sensor hit of the race is not treated as a lap. It is treated as the driver's "Reaction Time" off the start line.
*   **Out of Fuel (Analog):** If analog fuel is enabled and a driver's fuel level hits 0, their lap will be rejected (unless the penalty is set to "Power Stutter"). The rejected time is added to `pendingLapTime` while they are out of fuel.
*   **Refueling:** When a car is in the pits refueling, the lap timer continues to run normally, meaning the time stationary becomes part of their total lap time. However, the system tracks exactly how many seconds were spent actively refueling. Before deducting fuel for that lap, it subtracts the refuel time to calculate their true "Racing Time" (e.g., a 15-second lap with 10 seconds of refueling is treated as a 5-second lap for fuel burn).
    *   **Refueling During a Pause:** If the heat is paused while a car is refueling, both the lap timer and the refuel timer freeze completely. The car will not gain any fuel during the pause, and the paused time will not count against their lap time. When the race resumes, both timers pick up exactly where they left off.
*   **Team Limits:** In team races with maximum lap or time limits, a lap that pushes a driver over their limit is rejected, and their time is held until a driver swap occurs. 

In summary, the system is designed to be completely lossless and hardware-accurate. Any rejected or interrupted lap (whether due to bounces, pauses, or penalties) will hold onto that time and bundle it into the driver's next valid lap, while completely ignoring any software-side delays.
