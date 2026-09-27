import { ComponentHarness } from "@angular/cdk/testing";

import { HeatResultsHarnessBase } from "./heat-results.harness.base";

export class HeatResultsHarness
  extends ComponentHarness
  implements HeatResultsHarnessBase
{
  static hostSelector = HeatResultsHarnessBase.hostSelector;

  protected getHeatDriverExpandersEl = this.locatorForAll(
    HeatResultsHarnessBase.selectors.heatDriverExpander,
  );
  protected getTwinGraphsEl = this.locatorForOptional(
    HeatResultsHarnessBase.selectors.twinGraphs,
  );
  protected getTrajectoryModalEl = this.locatorForOptional(
    HeatResultsHarnessBase.selectors.trajectoryModal,
  );
  protected getTrajectoryButtonsEl = this.locatorForAll(
    HeatResultsHarnessBase.selectors.trajectoryButton,
  );

  async hasHeatDriverExpander(): Promise<boolean> {
    return (await this.getHeatDriverExpandersEl()).length > 0;
  }

  async hasTwinGraphs(): Promise<boolean> {
    return (await this.getTwinGraphsEl()) !== null;
  }

  async getHeatDriverExpanderCount(): Promise<number> {
    return (await this.getHeatDriverExpandersEl()).length;
  }

  async hasTrajectoryModal(): Promise<boolean> {
    return (await this.getTrajectoryModalEl()) !== null;
  }

  async hasTrajectoryButton(): Promise<boolean> {
    return (await this.getTrajectoryButtonsEl()).length > 0;
  }

  async clickTrajectoryButton(index = 0): Promise<void> {
    const buttons = await this.getTrajectoryButtonsEl();
    if (buttons.length > index) {
      await buttons[index].click();
    }
  }
}
