# Race Day Setup

The **Race Day Setup** screen is the launchpad for all racing sessions in Race Coordinator AI. From this screen, you configure participating drivers, select race formats and seasons, review heat rotation settings, and launch official or demo races.

## Overview {: #overview }

The Race Day Setup screen is organized into two main workspaces:

- **Driver Pool (Left Panel)**: Split into **Available Drivers** (your full roster ready to race) and **Racing Drivers** (the active drivers participating in the event and their seeding order).
- **Race Configuration & Controls (Right Panel)**: Includes Quick Start cards for recently run races, format and season selectors, real-time configuration summaries, and buttons to start an official or demo race.
- **Top Menu Bar**: Provides quick access to all configuration managers, race file management, and application preferences.

## Available Drivers {: #available-drivers }

The **Available Drivers** section lists all drivers and teams in your database who are eligible to join the race:

- **Adding Drivers**: Drag and drop any driver from the Available list to the Racing list, or simply double-click their name to add them to the bottom of the racing roster.
- **Search & Filtering**: Use the search input at the top of the list to filter drivers in real time by name or nickname. Press Up/Down arrow keys to navigate matching drivers and press Enter to add the highlighted driver.
- **Label Filters**: Filter available drivers by custom color-coded labels (e.g., "Pro", "Rookie") using the label dropdown. Toggle between matching **All** or **Any** selected labels.
- **Driver & Team Management**: Click the **Teams** pill button to open the Team Manager, or click the **Drivers** pill button to open the Driver Manager to create, edit, or configure drivers and teams.
- **Roster Validation**: Drivers currently in the racing list cannot be added twice. If a team is added to the racing list, its individual members are hidden from the available list, and vice versa.

## Racing Drivers {: #racing-drivers }

The **Racing Drivers** section displays the drivers selected to compete in the current race session:

- **Seeding Order**: The order of drivers in this list defines their starting seeding for heat rotations. Drag and drop drivers within the list to manually adjust the seeding order.
- **Removing Drivers**: Double-click any driver in the racing list or drag them out of the list to remove them from the race.
- **Action Toolbar**:
    - **View Full Roster**: Opens the complete database roster dialog.
    - **Add All (+)**: Adds all available drivers to the racing list with a single click.
    - **Remove All (-)**: Clears all drivers from the racing list.
    - **Randomize (Shuffle)**: Randomly shuffles the seeding order of all racing drivers.
- **Search Racing Drivers**: Filter the active racing roster in real time to locate drivers or remove them by pressing Enter.

## Race and Season Selection {: #race-and-season-selection }

The **Race and Season Selection** area allows you to choose what type of competition you want to run:

- **Race Selector**: Choose from single-race formats or multi-race events configured in your database. Each format defines heat rotation schemes, scoring methods (laps or timed), and finish conditions.
- **Race Search**: Filter races and events by name to quickly locate specific formats.
- **Season Selector**: Link the race to an active championship season to record points and update standings, or choose **None** for an exhibition or standalone race.
- **Configuration & Standings Summary**: Displays key configuration details for the selected race (ranking methods, fuel options, hands-free mode, track, and theme) or live championship standings for the selected season.
- **Edit Selected Race**: Click the pencil icon next to the selected race title to quickly open the Race Editor and adjust parameters before starting.

## Quick Start Races {: #quick-start-races }

Above the race selector, two large **Quick Start** cards display your two most recently run race configurations. Click either card to immediately select that race without opening dropdown menus.

## Starting a Race {: #starting-a-race }

When your driver roster and race format are ready, use the action buttons at the bottom right:

- **Start Race**: Begins the official race session. Requires your track hardware interface (e.g., Arduino, Phidget, Trakmate) to be configured and active.
- **Demo Race**: Starts a simulated demo race that mimics race events without requiring physical track sensors. Perfect for testing race setups, video layouts, and audio announcements.
- **Join Race / End Race**: When a race is currently in progress, these buttons allow you to rejoin the live session or safely end the running race.

## Menu Bar {: #menu-bar }

The modernized top menu bar provides centralized navigation across the entire application:

- **File**: Load saved races, view race history, export application settings to JSON, import settings, or quit the application.
- **Config**: Open configuration managers for Drivers, Teams, Races, Events, Seasons, Tracks, Layouts, Themes, Assets, and Databases.
- **Options**: Configure Custom UI preferences, Server settings, application language, check for software updates, and adjust demo mode options.
- **Help**: Adjust client and server log levels, view the About dialog, or open the Help Center.
