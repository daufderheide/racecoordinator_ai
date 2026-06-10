import { ComponentHarness } from "@angular/cdk/testing";
import { AcknowledgementModalHarness } from "@app/components/shared/acknowledgement-modal/testing/acknowledgement-modal.harness";
import { ConfirmationModalHarness } from "@app/components/shared/confirmation-modal/testing/confirmation-modal.harness";

import { RacedayModalsHarnessBase } from "./raceday-modals.harness.base";

export class RacedayModalsHarness
  extends ComponentHarness
  implements RacedayModalsHarnessBase
{
  static hostSelector = RacedayModalsHarnessBase.hostSelector;

  protected getAckModalEl = this.locatorForOptional(
    AcknowledgementModalHarness,
  );
  protected getConfirmationModals = this.locatorForAll(
    ConfirmationModalHarness,
  );

  async isAckModalVisible(): Promise<boolean> {
    const ack = await this.getAckModalEl();
    return ack ? await ack.isVisible() : false;
  }

  private async isConfirmationModalVisible(index: number): Promise<boolean> {
    const modals = await this.getConfirmationModals();
    if (index < modals.length) {
      return await modals[index].isVisible();
    }
    return false;
  }

  async isExitModalVisible(): Promise<boolean> {
    return await this.isConfirmationModalVisible(0);
  }

  async isSkipHeatModalVisible(): Promise<boolean> {
    return await this.isConfirmationModalVisible(1);
  }

  async isSkipRaceModalVisible(): Promise<boolean> {
    return await this.isConfirmationModalVisible(2);
  }

  async isRestartHeatModalVisible(): Promise<boolean> {
    return await this.isConfirmationModalVisible(3);
  }

  async isDeferHeatModalVisible(): Promise<boolean> {
    return await this.isConfirmationModalVisible(4);
  }
}
