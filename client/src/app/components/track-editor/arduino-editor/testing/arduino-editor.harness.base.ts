export abstract class ArduinoEditorHarnessBase {
  abstract toggleSection(name: 'arduino' | 'main' | 'digital' | 'analog' | 'voltage'): Promise<void>;
  abstract isSectionExpanded(name: 'arduino' | 'main' | 'digital' | 'analog' | 'voltage'): Promise<boolean>;
  abstract getBoardType(): Promise<string>;
  abstract setBoardType(type: string): Promise<void>;
  abstract getSelectedPinAction(isDigital: boolean, pin: number): Promise<string>;
  abstract isVoltageLinked(lane: number): Promise<boolean>;
  abstract clickVoltageLink(lane: number): Promise<void>;
}
