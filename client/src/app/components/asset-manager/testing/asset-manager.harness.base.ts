export abstract class AssetManagerHarnessBase {
  static readonly hostSelector = 'app-asset-manager';

  static readonly selectors = {
    dbName: '.active-db-name',
    totalSizeText: '.usage-text',
    assetCard: '.asset-card',
    filterTab: '.filter-tabs .tab',
    backBtn: 'app-back-button button',
    assetName: '.asset-name'
  };

  abstract getDatabaseName(): Promise<string>;
  abstract getTotalSize(): Promise<string>;
  abstract getAssetCardsCount(): Promise<number>;
  abstract getAssetCardName(index: number): Promise<string>;
  abstract setFilterType(type: 'all' | 'image' | 'image_set' | 'sound'): Promise<void>;
  abstract getActiveFilterType(): Promise<string>;
  abstract clickBack(): Promise<void>;
}
