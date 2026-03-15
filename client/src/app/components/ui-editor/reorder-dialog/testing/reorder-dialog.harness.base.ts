export abstract class ReorderDialogHarnessBase {
  static readonly hostSelector = 'app-reorder-dialog';

  static readonly selectors = {
    backdrop: '.modal-backdrop',
    title: '.title',
    valueChip: '.value-chip',
    slotItem: '.slot-item',
    saveBtn: '.btn-save',
    cancelBtn: '.btn-secondary',
    slotTitle: '.slot-title',
    removeBtn: '.remove-btn',
    resetDefaultsBtn: '.btn-reset-defaults'
  };

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

