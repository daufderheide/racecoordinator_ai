import { Locator } from '@playwright/test';
import { ArduinoEditorHarnessBase } from './arduino-editor.harness.base';

export class ArduinoEditorHarnessE2e implements ArduinoEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get sections() { return this.locator.locator('.config-section'); }
  private get boardSelect() { return this.locator.locator('.board-controls select').first(); }
  private get pinItems() { return this.locator.locator('.pin-item'); }
  private get voltageSection() { return this.locator.locator('.voltage-config-section'); }

  private async getSectionByHeader(text: string): Promise<Locator> {
    // Find section that contains a header with the text
    const count = await this.sections.count();
    for (let i = 0; i < count; i++) {
      const section = this.sections.nth(i);
      const header = section.locator('.section-header').first();
      if (await header.isVisible() && (await header.innerText()).includes(text)) {
        return section;
      }
    }
    // Fallback or throw
    return this.sections.first(); // Not ideal, but locator.locator with hasText is better
  }

  private getSectionLocator(text: string): Locator {
    return this.locator.locator('.config-section', {
      has: this.locator.page().locator('.section-header', { hasText: text })
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
    // Use the getSectionLocator helper
    let section: Locator;
    if (name === 'arduino') {
      section = this.locator.locator('.arduino-config-container > .config-section').first();
    } else {
      section = this.getSectionLocator(textMap[name]);
    }
    await section.locator('.section-header').first().click();
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
      section = this.locator.locator('.arduino-config-container > .config-section').first();
    } else {
      section = this.getSectionLocator(textMap[name]);
    }
    return await section.locator(':scope > .section-content').first().isVisible();
  }

  async getBoardType(): Promise<string> {
    return await this.boardSelect.evaluate((select: HTMLSelectElement) => select.value);
  }

  async setBoardType(type: string): Promise<void> {
    await this.boardSelect.selectOption(type);
  }

  async getSelectedPinAction(isDigital: boolean, pin: number): Promise<string> {
    const prefix = isDigital ? 'D' : 'A';
    const item = this.pinItems.locator(`div:has-text("${prefix}${pin}")`).first(); // Needs to be careful with text match
    // Better: find .pin-item where label text is exact
    const count = await this.pinItems.count();
    for (let i = 0; i < count; i++) {
        const check = this.pinItems.nth(i);
        const label = await check.locator('.pin-header label').innerText();
        if (label === `${prefix}${pin}`) {
            return await check.locator('select option:checked').innerText();
        }
    }
    return '';
  }

  async isVoltageLinked(lane: number): Promise<boolean> {
    const icon = this.voltageSection.locator('.clickable-link-icon').first();
    const classes = await icon.getAttribute('class');
    return classes ? classes.includes('linked') : false;
  }

  async clickVoltageLink(lane: number): Promise<void> {
    const icon = this.voltageSection.locator('.clickable-link-icon').first();
    await icon.click();
  }
}
