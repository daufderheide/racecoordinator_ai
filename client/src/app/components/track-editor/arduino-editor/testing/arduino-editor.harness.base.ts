export abstract class ArduinoEditorHarnessBase {
  static readonly hostSelector = 'app-arduino-editor';

  static readonly selectors = {
    section: '.config-section',
    boardSelect: '.board-controls select',
    pinItem: '.pin-item',
    voltageSection: '.voltage-config-section',
    sectionHeader: '.section-header',
    sectionContent: '.section-content',
    pinHeaderLabel: '.pin-header label',
    linkIcon: '.clickable-link-icon'
  };

  abstract toggleSection(name: 'arduino' | 'main' | 'digital' | 'analog' | 'voltage'): Promise<void>;
  abstract isSectionExpanded(name: 'arduino' | 'main' | 'digital' | 'analog' | 'voltage'): Promise<boolean>;
  abstract getBoardType(): Promise<string>;
  abstract setBoardType(type: string): Promise<void>;
  abstract getSelectedPinAction(isDigital: boolean, pin: number): Promise<string>;
  abstract isVoltageLinked(lane: number): Promise<boolean>;
  abstract clickVoltageLink(lane: number): Promise<void>;
}
