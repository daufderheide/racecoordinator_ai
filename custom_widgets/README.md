# Custom Widgets Repository

This directory contains community and user-contributed widget libraries for **Race Coordinator AI**.

## 📥 Download Widgets as ZIP

GitHub does not provide a built-in button to download a single subfolder, but you can download this entire directory or individual libraries as a ZIP archive using the direct 1-click links below:

- **Download All Custom Widgets**:
  - [📥 **Download `custom_widgets.zip`** (Direct)](https://download-directory.github.io/?url=https://github.com/daufderheide/racecoordinator_ai/tree/develop/custom_widgets)
  - [Alternative Mirror (DownGit)](https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/daufderheide/racecoordinator_ai/tree/develop/custom_widgets)

- **Download by Library**:
  - **dopamine**: [📥 Download `dopamine.zip`](https://download-directory.github.io/?url=https://github.com/daufderheide/racecoordinator_ai/tree/develop/custom_widgets/dopamine) ([DownGit Mirror](https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/daufderheide/racecoordinator_ai/tree/develop/custom_widgets/dopamine))

## Directory Structure

Each top-level directory represents a **Library** created and maintained by a user, club, or developer:

```text
custom_widgets/
├── dopamine/                                  # User Library: "dopamine"
│   └── advanced-laps/                         # Widget: "advanced-laps"
│       ├── widget.json                        # Manifest & configuration schema
│       ├── widget.html                        # Angular HTML template
│       ├── widget.css                         # Scoped styling
│       ├── widget.ts                          # Component logic extending CustomWidgetBaseComponent
│       └── widget.spec.ts                     # Unit test suite
└── [other-user-library]/                      # Additional user libraries
```

## How to Use in Race Coordinator AI

1. In Race Coordinator AI, navigate to **Options -> Custom UI (UI Editor)**.
2. Under **Custom UI**, click **Select Folder** for **Custom Widgets Folder**.
3. Select this `custom_widgets` directory (or download individual user library folders such as `dopamine/` into your chosen widgets folder).
4. The application will scan and organize widgets by library name in the Widget Library.
5. Drag and drop widgets into your custom layouts and configure their properties in the Widget Configuration.
