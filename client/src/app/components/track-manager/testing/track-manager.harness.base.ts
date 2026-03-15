import { ArduinoSummaryHarnessBase } from '..//arduino-summary/testing/arduino-summary.harness.base';

export abstract class TrackManagerHarnessBase {
  abstract getTrackNames(): Promise<string[]>;
  abstract selectTrack(name: string): Promise<void>;
  abstract getSelectedTrackName(): Promise<string | null>;
  abstract clickCreateNew(): Promise<void>;
  abstract getArduinoSummaryHarnesses(): Promise<ArduinoSummaryHarnessBase[]>;
  abstract isLaneSummaryExpanded(): Promise<boolean>;
  abstract toggleLaneSummary(): Promise<void>;
}
