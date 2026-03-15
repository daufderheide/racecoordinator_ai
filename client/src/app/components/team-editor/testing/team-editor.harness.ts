import { ComponentHarness } from '@angular/cdk/testing';
import { TeamEditorHarnessBase } from './team-editor.harness.base';

export class TeamEditorHarness extends ComponentHarness implements TeamEditorHarnessBase {
  static hostSelector = TeamEditorHarnessBase.hostSelector;

  protected getNameInput = this.locatorFor(TeamEditorHarnessBase.selectors.nameInput);
  protected getSaveBtn = this.locatorFor(TeamEditorHarnessBase.selectors.saveBtn);
  protected getSaveAsNewBtn = this.locatorFor(TeamEditorHarnessBase.selectors.saveAsNewBtn);
  protected getDriverItems = this.locatorForAll(TeamEditorHarnessBase.selectors.driverItem);
  protected getAvatarSelector = this.locatorFor(TeamEditorHarnessBase.selectors.avatarSelector);

  async getName(): Promise<string> {
    const input = await this.getNameInput();
    return await input.getProperty('value');
  }

  async setName(name: string): Promise<void> {
    const input = await this.getNameInput();
    await input.clear();
    await input.sendKeys(name);
  }

  async clickSave(): Promise<void> {
    const btn = await this.getSaveBtn();
    await btn.click();
  }

  async clickSaveAsNew(): Promise<void> {
    const btn = await this.getSaveAsNewBtn();
    await btn.click();
  }

  async getDriverCount(): Promise<number> {
    return (await this.getDriverItems()).length;
  }

  async getDriverName(index: number): Promise<string> {
    const items = await this.getDriverItems();
    if (index < items.length) {
      const nameEl = await items[index].locatorFor('.driver-name')();
      return await nameEl.text();
    }
    return '';
  }

  async isDriverSelected(index: number): Promise<boolean> {
    const items = await this.getDriverItems();
    if (index < items.length) {
        return await items[index].hasClass('selected');
    }
    return false;
  }

  async toggleDriver(index: number): Promise<void> {
    const items = await this.getDriverItems();
    if (index < items.length) {
        await items[index].click();
    }
  }

  async clickAvatar(): Promise<void> {
    const avatar = await this.getAvatarSelector();
    await avatar.click();
  }

  async isSaveEnabled(): Promise<boolean> {
    const btn = await this.getSaveBtn();
    return !(await btn.getProperty('disabled'));
  }
}

