export abstract class RaceManagerHarnessBase {
  static readonly hostSelector = 'app-race-manager';

  static readonly selectors = {
    listContainer: '.list-container',
    listItem: '.list-item',
    selectedItem: '.list-item.selected',
    detailPanel: '.detail-panel',
    summarySection: '.summary-section',
    deleteButton: '#delete-track-btn',
    createButton: '#create-race-btn',
    confirmationModal: 'app-confirmation-modal'
  };

  abstract isVisible(): Promise<boolean>;
  abstract selectItem(index: number): Promise<void>;
}
