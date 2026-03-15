export abstract class ReorderDialogHarnessBase {
  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getAvailableValues(): Promise<string[]>;
  abstract getSlotCount(): Promise<number>;
  abstract getSlotTitle(index: number): Promise<string>;
  abstract clickRemoveSlot(index: number): Promise<void>;
  abstract clickResetDefaults(): Promise<void>;
  abstract clickSave(): Promise<void>;
  abstract clickCancel(): Promise<void>;
}

