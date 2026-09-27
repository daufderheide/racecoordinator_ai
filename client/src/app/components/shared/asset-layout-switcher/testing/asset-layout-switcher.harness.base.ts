import { AssetLayoutMode } from "@app/models/asset";

export abstract class AssetLayoutSwitcherHarnessBase {
  static readonly hostSelector = "app-asset-layout-switcher";

  static readonly selectors = {
    group: ".layout-switcher-group",
    listBtn: ".layout-btn-list",
    smallBtn: ".layout-btn-small",
    mediumBtn: ".layout-btn-medium",
    largeBtn: ".layout-btn-large",
  };

  abstract getActiveMode(): Promise<AssetLayoutMode | null>;
  abstract setLayoutMode(mode: AssetLayoutMode): Promise<void>;
}
