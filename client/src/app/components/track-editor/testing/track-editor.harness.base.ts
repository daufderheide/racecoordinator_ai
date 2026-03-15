import { ArduinoEditorHarnessBase } from '..//arduino-editor/testing/arduino-editor.harness.base';

export abstract class TrackEditorHarnessBase {
  abstract getTrackName(): Promise<string>;
  abstract setTrackName(name: string): Promise<void>;
  abstract getLaneCount(): Promise<number>;
  abstract addLane(): Promise<void>;
  abstract removeLane(index: number): Promise<void>;
  abstract getLaneLength(index: number): Promise<number>;
  abstract setLaneLength(index: number, length: number): Promise<void>;
  abstract addInterface(): Promise<void>;
  abstract getArduinoEditorHarnesses(): Promise<ArduinoEditorHarnessBase[]>;
  abstract clickSaveAsNew(): Promise<void>;
  abstract isNameInvalid(): Promise<boolean>;
}

