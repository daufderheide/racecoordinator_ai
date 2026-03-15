export abstract class AssetManagerHarnessBase {
  abstract getDatabaseName(): Promise<string>;
  abstract getTotalSize(): Promise<string>;
  abstract getAssetCardsCount(): Promise<number>;
  abstract getAssetCardName(index: number): Promise<string>;
  abstract setFilterType(type: 'all' | 'image' | 'image_set' | 'sound'): Promise<void>;
  abstract getActiveFilterType(): Promise<string>;
  abstract clickBack(): Promise<void>;
}
