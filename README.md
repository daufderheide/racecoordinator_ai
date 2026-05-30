# Race Coordinator AI

**A free, modern lap-counting and race-management program for slot car racing.**

Race Coordinator handles everything from a single basement track running a
casual round robin to multi-day club events with practice, qualifying, finals,
and a season-long championship — for an unlimited number of drivers across an
unlimited number of lanes.

![Race Coordinator AI splash screen](docs/images/splash-screen.png)

## Highlights

- Unlimited drivers and lanes per race
- Built-in race formats: round robin, solo, single-lane heats, F1-style scoring,
  step-up races, team racing, season/championship mode
- Custom heat editor for any rotation you can dream up
- Analog fuel simulation, per-lane relay support, false-start detection
- Skinnable race screens with a customizable
  [Custom UI](docs/CUSTOM_UI.md) layout system
- Save/load races, with auto-save protection against power outages
- Permanent race-stat history, exportable to Excel
- Demo mode — try it out on any PC even without a track connected

![Race day in progress](docs/images/raceday.png)

## Supported Track Hardware

Race Coordinator works with all the common track interfaces and sensor types:

- Trackmate
- Arduino
- Web camera
- Parallel port and Game port
- DS Electronics DS200, DS300, DSxx
- Phidget sensors and relays
- Titus / Bfpe
- USB Slot Master
- IR sensors, reed switches, dead strips
- Track-call buttons and master / per-lane power relays

## Install

Download the latest installer from the
[Releases page](https://github.com/daufderheide/racecoordinator_ai/releases).

### Windows

Pick **one** of:

- **`RaceCoordinatorAI_Online_Setup.exe`** — preferred. Downloads Java 17 and
  MongoDB 6.0 during install (needs an internet connection).
- **`RaceCoordinatorAI_Offline_Legacy_Setup.exe`** — for offline machines or
  legacy systems (XP / 7 / 8). Bundles Java 8 and MongoDB 3.2.

Double-click the `.exe`, accept the prompts, and use the desktop shortcuts the
installer creates.

### macOS

Download **`RaceCoordinator_Mac.dmg`**, open it, and drag the application to
your Applications folder. The first launch will prompt you to download Java
if it isn't already installed.

### Linux / Raspberry Pi

Download **`RaceCoordinator_Universal.zip`**, extract it, and run:

```bash
chmod +x start_linux_rpi.sh
./start_linux_rpi.sh
```

Java 8 or newer is required. On Raspberry Pi:
`sudo apt-get install openjdk-8-jre`.

### System requirements

- **Windows:** XP SP3 or newer (Windows 7/8/XP additionally needs the
  [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784)
  so MongoDB 3.2 can start)
- **macOS:** 10.15 (Catalina) or newer recommended
- **Linux / Raspberry Pi:** any modern distribution with Java 8+
- **Minimum hardware:** 1 GHz CPU, 1 GB RAM, 500 MB free disk space

## First Race

Race Coordinator ships with a starter database that already contains a few
drivers, cars, a four-lane track, and example races (Round Robin, Practice).
Many users never need to touch anything else — open the **Race Day** screen,
pick a race, and click **Race!**.

Want to try it before plugging anything in? Race Coordinator has a
**Demonstration Mode** that generates synthetic laps based on your current
race settings, so you can explore the UI from any PC.

## Help & Support

- **Built-in help center:** [daufderheide.github.io/racecoordinator_ai](https://daufderheide.github.io/racecoordinator_ai/)
  — guides for every screen, available in English, Spanish, French, German,
  Dutch, Portuguese, and Italian.
- **Community support:** [racecoordinator.net/Support](http://www.racecoordinator.net/Support.html)
- **Bug reports:** open an issue on the
  [GitHub repo](https://github.com/daufderheide/racecoordinator_ai/issues).

## For Developers

If you want to build, run, test, or contribute to Race Coordinator AI, head
over to the [Developer Guide](docs/DEVELOPING.md). Other internal docs:

- [Analytics](docs/ANALYTICS.md) — GA4 event taxonomy
- [Custom UI](docs/CUSTOM_UI.md) — how the skinnable race-screen system works
- [Text-to-Speech](docs/TTS.md) — TTS announcer configuration
- [Repo Cleanup](docs/REPO_CLEANUP.md) — record of the most recent
  reorganization (script moves, snapshot un-tracking, doc moves)

## License

See [LICENSE](LICENSE).
