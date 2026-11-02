import defaultLayoutJson from "@app/models/defaults/default_ui_layout.json";
import legacyDefaultLayoutJson from "@app/models/defaults/legacy_default_ui_layout.json";
import legacyPracticeLayoutJson from "@app/models/defaults/legacy_practice_ui_layout.json";
import practiceLayoutJson from "@app/models/defaults/practice_ui_layout.json";

import type { LayoutConfig } from "./settings";

export const DEFAULT_LAYOUT: LayoutConfig =
  defaultLayoutJson as unknown as LayoutConfig;

export const DEFAULT_PRACTICE_LAYOUT: LayoutConfig =
  practiceLayoutJson as unknown as LayoutConfig;

export const LEGACY_DEFAULT_LAYOUT: LayoutConfig =
  legacyDefaultLayoutJson as unknown as LayoutConfig;

export const LEGACY_DEFAULT_PRACTICE_LAYOUT: LayoutConfig =
  legacyPracticeLayoutJson as unknown as LayoutConfig;
