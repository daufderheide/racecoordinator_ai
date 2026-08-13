export abstract class AssetManagerHarnessBase {
  static readonly hostSelector = "app-asset-manager";

  static readonly selectors = {
    dbName: ".active-db-name",
    totalSizeText: ".usage-text",
    assetCard: ".asset-card",
    filterTab: ".filter-tabs .tab",
    filterInput: ".filter-input",
    btnNewImageSet: ".new-set-zone button:nth-child(1)",
    btnNewAudioSet: ".new-set-zone button:nth-child(2)",
    btnNewCustomRotation: ".new-set-zone button:nth-child(3)",
    backBtn: "app-back-button button",
    assetName: ".asset-name",
  };

  abstract getDatabaseName(): Promise<string>;
  abstract getTotalSize(): Promise<string>;
  abstract getAssetCardsCount(): Promise<number>;
  abstract getAssetCardName(index: number): Promise<string>;
  abstract setFilterType(
    type:
      | "all"
      | "image"
      | "image_set"
      | "sound"
      | "audio"
      | "audio_set"
      | "custom_rotation",
  ): Promise<void>;
  abstract getActiveFilterType(): Promise<string>;
  abstract setSearchText(text: string): Promise<void>;
  abstract clickNewImageSet(): Promise<void>;
  abstract clickNewAudioSet(): Promise<void>;
  abstract clickNewCustomRotation(): Promise<void>;
  abstract clickBack(): Promise<void>;
}
