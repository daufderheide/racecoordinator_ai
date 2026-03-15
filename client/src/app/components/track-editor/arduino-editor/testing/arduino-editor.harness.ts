import { ComponentHarness } from '@angular/cdk/testing';
import { ArduinoEditorHarnessBase } from './arduino-editor.harness.base';

export class ArduinoEditorHarness extends ComponentHarness implements ArduinoEditorHarnessBase {
  static hostSelector = 'app-arduino-editor';

  protected getSections = this.locatorForAll('.config-section');
  protected getBoardSelect = this.locatorFor('.board-controls select');
  protected getPinItems = this.locatorForAll('.pin-item');
  protected getVoltageSection = this.locatorForOptional('.voltage-config-section');

  private async getSectionByHeader(text: string) {
    const sections = await this.getSections();
    for (const section of sections) {
      const header = await section.locatorFor('.section-header')();
      const headerText = await header.text();
      if (headerText.includes(text)) {
        return section;
      }
    }
    return null;
  }

  async toggleSection(name: 'arduino' | 'main' | 'digital' | 'analog' | 'voltage'): Promise<void> {
    const textMap = {
      arduino: 'Arduino Configuration',
      main: 'Main Configuration',
      digital: 'Digital Pins',
      analog: 'Analog Pins',
      voltage: 'Voltage Divider'
    };
    const section = await this.getSectionByHeader(textMap[name]);
    if (section) {
      const header = await section.locatorFor('.section-header')();
      await header.click();
    }
  }

  async isSectionExpanded(name: 'arduino' | 'main' | 'digital' | 'analog' | 'voltage'): Promise<boolean> {
    const textMap = {
      arduino: 'Arduino Configuration',
      main: 'Main Configuration',
      digital: 'Digital Pins',
      analog: 'Analog Pins',
      voltage: 'Voltage Divider'
    };
    const section = await this.getSectionByHeader(textMap[name]);
    if (section) {
      const content = await section.locatorForOptional('.section-content')();
      return content !== null;
    }
    return false;
  }

  async getBoardType(): Promise<string> {
    const select = await this.getBoardSelect();
    return await select.getProperty('value');
  }

  async setBoardType(type: string): Promise<void> {
    const select = await this.getBoardSelect();
    // Angular CDK select interaction
    // We can use dispatchEvent or better if there's a setting for it
    await select.dispatchEvent('change', { value: type });
  }

  async getSelectedPinAction(isDigital: boolean, pin: number): Promise<string> {
    const prefix = isDigital ? 'D' : 'A';
    const items = await this.getPinItems();
    for (const item of items) {
      const header = await item.locatorFor('.pin-header label')();
      if ((await header.text()) === `${prefix}${pin}`) {
        const select = await item.locatorFor('select')();
        // Return text of selected option
        const options = await select.locatorForAll('option')();
        for (const option of options) {
          if (await option.getProperty('selected')) {
            return await option.text();
          }
        }
      }
    }
    return '';
  }

  async isVoltageLinked(lane: number): Promise<boolean> {
    const section = await this.getVoltageSection();
    if (section) {
      const icon = await section.locatorFor(`.clickable-link-icon`)(); // Assuming shared link state class applies to all
      return await icon.hasClass('linked');
    }
    return false;
  }

  async clickVoltageLink(lane: number): Promise<void> {
    const section = await this.getVoltageSection();
    if (section) {
      const icon = await section.locatorFor(`.clickable-link-icon`)();
      await icon.click();
    }
  }
}
