import { Locator } from '@playwright/test';
import { ArduinoEditorHarnessBase } from './arduino-editor.harness.base';

export class ArduinoEditorHarnessE2e implements ArduinoEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return ArduinoEditorHarnessBase; }

  private get sections() { return this.locator.locator(this.base.selectors.section); }
  private get boardSelect() { return this.locator.locator(this.base.selectors.boardSelect).first(); }
  private get pinItems() { return this.locator.locator(this.base.selectors.pinItem); }
  private get voltageSection() { return this.locator.locator(this.base.selectors.voltageSection); }

  private async getSectionByHeader(text: string): Promise<Locator> {
    const count = await this.sections.count();
    for (let i = 0; i < count; i++) {
      const section = this.sections.nth(i);
      const header = section.locator(this.base.selectors.sectionHeader).first();
      if (await header.isVisible() && (await header.innerText()).includes(text)) {
        return section;
      }
    }
    return this.sections.first();
  }

  private getSectionLocator(text: string): Locator {
    return this.locator.locator(this.base.selectors.section, {
      has: this.locator.page().locator(this.base.selectors.sectionHeader, { hasText: text })
    });
  }

  async toggleSection(name: 'arduino' | 'main' | 'digital' | 'analog' | 'voltage'): Promise<void> {
    const textMap = {
      arduino: 'Arduino Configuration',
      main: 'Main Configuration',
      digital: 'Digital Pins',
      analog: 'Analog Pins',
      voltage: 'Voltage Divider'
    };
    let section: Locator;
    if (name === 'arduino') {
      section = this.locator.locator('.arduino-config-container > ' + this.base.selectors.section).first();
    } else {
      section = await this.getSectionByHeader(textMap[name]);
    }
    await section.locator(this.base.selectors.sectionHeader).first().click();
  }

  async isSectionExpanded(name: 'arduino' | 'main' | 'digital' | 'analog' | 'voltage'): Promise<boolean> {
    const textMap = {
      arduino: 'Arduino Configuration',
      main: 'Main Configuration',
      digital: 'Digital Pins',
      analog: 'Analog Pins',
      voltage: 'Voltage Divider'
    };
    let section: Locator;
    if (name === 'arduino') {
      section = this.locator.locator('.arduino-config-container > ' + this.base.selectors.section).first();
    } else {
      section = await this.getSectionByHeader(textMap[name]);
    }
    const content = section.locator(':scope > ' + this.base.selectors.sectionContent).first();
    const count = await content.count();
    return count > 0 && await content.isVisible();
  }

  async getBoardType(): Promise<string> {
    return await this.boardSelect.evaluate((select: HTMLSelectElement) => select.value);
  }

  async setBoardType(type: string): Promise<void> {
    await this.boardSelect.selectOption(type);
  }

  async getSelectedPinAction(isDigital: boolean, pin: number): Promise<string> {
    const prefix = isDigital ? 'D' : 'A';
    const count = await this.pinItems.count();
    for (let i = 0; i < count; i++) {
        const check = this.pinItems.nth(i);
        const label = await check.locator(this.base.selectors.pinHeaderLabel).innerText();
        if (label === `${prefix}${pin}`) {
            return await check.locator('select option:checked').innerText();
        }
    }
    return '';
  }

  async isVoltageLinked(lane: number): Promise<boolean> {
    const icon = this.voltageSection.locator(this.base.selectors.linkIcon).first();
    const classes = await icon.getAttribute('class');
    return classes ? classes.includes('linked') : false;
  }

  async clickVoltageLink(lane: number): Promise<void> {
    const icon = this.voltageSection.locator(this.base.selectors.linkIcon).first();
    await icon.click();
  }
}
