import { BackButtonHarnessBase } from '../../back-button/testing/back-button.harness.base';
import { ToolbarHarnessBase } from '../../toolbar/testing/toolbar.harness.base';

export abstract class ManagerHeaderHarnessBase {
  static readonly hostSelector = 'app-manager-header';

  static readonly selectors = {
    title: '.page-title',
    backButton: BackButtonHarnessBase.hostSelector,
    toolbar: ToolbarHarnessBase.hostSelector
  };

  abstract getTitle(): Promise<string>;
  abstract hasBackButton(): Promise<boolean>;
  abstract hasToolbar(): Promise<boolean>;
  abstract getBackButton(): Promise<any>;
  abstract getToolbar(): Promise<any>;
}
