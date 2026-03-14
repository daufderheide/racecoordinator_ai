export abstract class ItemSelectorHarnessBase {
  /** Checks if the item selector modal is present and visible */
  abstract isVisible(): Promise<boolean>;

  /** Gets the number of items displayed in the selector */
  abstract getItemsCount(): Promise<number>;

  /** Gets the text content of the item at the specified index */
  abstract getItemText(index: number): Promise<string>;

  /** Clicks the item at the specified index */
  abstract clickItem(index: number): Promise<void>;

  /** Clicks the play preview button for the item at the specified index (if sound) */
  abstract clickPlayItem(index: number): Promise<void>;

  /** Clicks the backdrop to close the selector */
  abstract clickClose(): Promise<void>;
}
