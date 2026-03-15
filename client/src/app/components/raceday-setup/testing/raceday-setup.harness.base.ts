export abstract class RacedaySetupHarnessBase {
  static readonly hostSelector = 'app-raceday-setup';

  static readonly selectors = {
    splashScreen: '.splash-screen',
    connectionLostOverlay: '.connection-lost-overlay',
    connectionLostText: '.connection-lost-text',
    serverConfigBtn: '.server-config-btn',
    serverConfigModal: '.server-config-modal'
  };

  abstract isSplashScreenVisible(): Promise<boolean>;
  abstract isConnectionLostOverlayVisible(): Promise<boolean>;
  abstract getConnectionLostText(): Promise<string>;
  abstract clickServerConfig(): Promise<void>;
  abstract isServerConfigModalVisible(): Promise<boolean>;
}
