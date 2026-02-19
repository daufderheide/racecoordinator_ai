export interface DirtyComponent {
  /**
   * Returns true if there are unsaved changes.
   */
  hasChanges(): boolean;

  /**
   * Set to true when navigation has been manually confirmed (e.g. by a shared modal).
   */
  isNavigationApproved: boolean;
}
