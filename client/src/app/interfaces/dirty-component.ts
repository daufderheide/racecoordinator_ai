export interface DirtyComponent {
  /**
   * Returns true if there are unsaved changes.
   */
  hasChanges(): boolean;

  /**
   * Set to true when navigation has been manually confirmed (e.g. by a shared modal).
   */
  isNavigationApproved: boolean;

  /**
   * Optional method returning translation keys for reasons why changes could not be saved.
   */
  getUnsavedReasons?(): string[];

  /**
   * Optional confirmation method returning a Promise or boolean to prompt custom confirmation modal.
   */
  confirmDiscard?(): Promise<boolean> | boolean;

  /**
   * Optional deactivation hook returning a Promise or boolean.
   */
  canDeactivate?(): Promise<boolean> | boolean;
}
