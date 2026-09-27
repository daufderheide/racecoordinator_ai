import { Locator } from "@playwright/test";

import { HeatResultsHarnessBase } from "./heat-results.harness.base";

export class HeatResultsHarnessE2e implements HeatResultsHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return HeatResultsHarnessBase;
  }

  private get heatDriverExpanders() {
    return this.locator.locator(this.base.selectors.heatDriverExpander);
  }

  private get twinGraphs() {
    return this.locator.locator(this.base.selectors.twinGraphs).first();
  }

  private get legendItems() {
    return this.locator.locator(this.base.selectors.legendItem);
  }

  private get trajectoryModal() {
    return this.locator.locator(this.base.selectors.trajectoryModal).first();
  }

  private get trajectoryButtons() {
    return this.locator.locator(this.base.selectors.trajectoryButton);
  }

  getTrajectoryModal(): Locator {
    return this.trajectoryModal;
  }

  getTrajectoryButtonLocator(index = 0): Locator {
    return this.trajectoryButtons.nth(index);
  }

  getHeatDriverExpander(index = 0): Locator {
    return this.heatDriverExpanders.nth(index);
  }

  async hasHeatDriverExpander(): Promise<boolean> {
    return (await this.heatDriverExpanders.count()) > 0;
  }

  async hasTwinGraphs(): Promise<boolean> {
    return await this.twinGraphs.isVisible();
  }

  async getHeatDriverExpanderCount(): Promise<number> {
    return await this.heatDriverExpanders.count();
  }

  async hasTrajectoryModal(): Promise<boolean> {
    return await this.trajectoryModal.isVisible();
  }

  async hasTrajectoryButton(): Promise<boolean> {
    return (await this.trajectoryButtons.count()) > 0;
  }

  async clickTrajectoryButton(index = 0): Promise<void> {
    await this.getTrajectoryButtonLocator(index).click();
  }

  async toggleHeatDriverExpander(index = 0): Promise<void> {
    await this.heatDriverExpanders
      .nth(index)
      .locator(".heat-card-header")
      .click();
  }

  async hoverLegendItem(name: string): Promise<void> {
    const item = this.legendItems.filter({ hasText: name }).first();
    await item.hover();
  }
}
