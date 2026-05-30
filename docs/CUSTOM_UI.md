# Custom UI Guide

Race Coordinator AI allows you to completely customize the user interface for the **Raceday** and **Raceday Setup** screens. This is achieved by providing custom HTML, CSS, and TypeScript files that the application loads dynamically.

## Setting the Custom UI Folder

To enable custom UI components, you must first tell the application where to look for your files:

1. Launch the **Race Coordinator AI** client.
2. From the main setup screen, open the **Options** menu.
3. Select **Custom UI**.
4. Scroll down to the **Custom UI** section at the bottom of the editor.
5. Click **Select Folder** and choose a directory on your computer where you will store your custom UI files.
6. Once selected, the folder name will be displayed, and the application will immediately attempt to load any matching files from that directory.

> [!NOTE]
> The folder selection is stored in your browser's IndexedDB. If you clear your browser data or use a different browser/machine, you may need to re-select the folder.

## File Structure and Placement

The application looks for specific filenames to override the default views. You can place these files directly in the root of your selected custom folder, or within specific subfolders for better organization.

### Supported Files

| Target Screen | Required File | Optional Files | Recommended Subfolder |
| :--- | :--- | :--- | :--- |
| **Raceday** | `raceday.component.html` | `raceday.component.css`, `raceday.component.ts` | `raceday/` |
| **Raceday Setup** | `raceday-setup.component.html` | `raceday-setup.component.css`, `raceday-setup.component.ts` | `raceday-setup/` |

### How Loading Works

1. **Subfolder Search**: The app first looks for a subfolder matching the screen name (e.g., `/raceday/raceday.component.html`).
2. **Root Search**: If not found in a subfolder, it looks in the root of your custom folder (e.g., `/raceday.component.html`).
3. **Default Fallback**: If no `.html` file is found in either location, the application loads the default built-in UI.

## Creating Custom Components

### HTML (`.html`)
The HTML file defines the structure of your custom view. It has access to all the data and services provided by the base component.

### CSS (`.css`)
The CSS file allows you to style your custom HTML. Styles are scoped to your dynamic component.

### TypeScript (`.ts`)
The TypeScript file allows you to add custom logic. When providing a `.ts` file, it should contain the logic that would normally go inside an Angular `@Component` class. 

> [!IMPORTANT]
> Your custom component automatically extends a base class that provides access to essential services like `RaceService`, `DataService`, and `TranslationService`.

## Example Structure

```text
MyCustomUI/
├── raceday/
│   ├── raceday.component.html
│   ├── raceday.component.css
│   └── raceday.component.ts
└── raceday-setup.component.html
```

In this example:
- The **Raceday** screen is fully customized with HTML, CSS, and logic located in the `raceday/` subfolder.
- The **Raceday Setup** screen is customized with only a root HTML file (no custom CSS or logic).
