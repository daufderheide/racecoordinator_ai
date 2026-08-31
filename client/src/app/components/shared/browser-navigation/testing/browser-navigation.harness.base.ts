export class BrowserNavigationHarnessBase {
  static readonly hostSelector = "app-browser-navigation";

  static readonly selectors = {
    container: ".browser-nav-container",
    backButton: "#browser-nav-back-btn",
    forwardButton: "#browser-nav-forward-btn",
  };
}
