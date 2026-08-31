export abstract class AboutDialogHarnessBase {
  static readonly hostSelector = "app-about-dialog";

  static readonly selectors = {
    content: ".modal-content",
    title: ".modal-title",
    versionInfo: ".version-info",
    charityInfo: ".charity-info",
    donateLink: ".donate-link",
    creditsPanel: ".credits-panel",
    creditNames: ".credit-name",
    tabButtons: ".tab-btn",
    closeButton: ".btn-confirm",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getVersionInfoText(): Promise<string>;
  abstract clickClose(): Promise<void>;
  abstract clickTab(index: number): Promise<void>;
  abstract isCharityTabVisible(): Promise<boolean>;
  abstract getDonateLinkHref(): Promise<string | null>;
  abstract isCreditsTabVisible(): Promise<boolean>;
  abstract getCreditNames(): Promise<string[]>;
}
