import { AnchorPoint } from "../../components/raceday/column_definition";
import { Settings } from "../../models/settings";

export function createDefaultSettings(
  overrides: Partial<Settings> = {},
): Settings {
  const s = new Settings();
  s.racedaySetupWalkthroughSeen = true;
  s.trackManagerHelpShown = true;
  s.trackEditorHelpShown = true;
  s.driverEditorHelpShown = true;
  s.driverManagerHelpShown = true;
  s.teamManagerHelpShown = true;
  s.teamEditorHelpShown = true;
  s.carEditorHelpShown = true;
  s.assetManagerHelpShown = true;
  s.raceManagerHelpShown = true;
  s.raceEditorHelpShown = true;

  s.racedayColumns = ["driver.name", "lapCount"];
  s.columnLayouts = {
    "driver.name": { [AnchorPoint.CenterCenter]: "driver.name" },
    lapCount: { [AnchorPoint.CenterCenter]: "lapCount" },
  };
  s.columnAnchors = {
    "driver.name": AnchorPoint.CenterCenter,
    lapCount: AnchorPoint.CenterCenter,
  };
  s.columnVisibility = {};

  return Object.assign(s, overrides);
}
