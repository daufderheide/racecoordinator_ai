import { ArduinoSummaryHarnessBase } from '..//arduino-summary/testing/arduino-summary.harness.base';

export abstract class TrackManagerHarnessBase {
  static readonly hostSelector = 'app-track-manager';

  static readonly selectors = {
    trackItem: '.sidebar-list .list-item',
    createButton: '#add-item-btn',
    detailHeader: '.detail-panel .detail-header h2',
    itemName: '.item-name',
    laneExpanderHeader: '.lane-viz-container .section-header',
    laneExpanderContent: '.lane-viz-container .section-content'
  };

  abstract getTrackNames(): Promise<string[]>;
  abstract selectTrack(name: string): Promise<void>;
  abstract getSelectedTrackName(): Promise<string | null>;
  abstract clickCreateNew(): Promise<void>;
  abstract getArduinoSummaryHarnesses(): Promise<ArduinoSummaryHarnessBase[]>;
  abstract isLaneSummaryExpanded(): Promise<boolean>;
  abstract toggleLaneSummary(): Promise<void>;
}
