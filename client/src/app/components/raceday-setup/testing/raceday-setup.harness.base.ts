export abstract class RacedaySetupHarnessBase {
  abstract isSplashScreenVisible(): Promise<boolean>;
  abstract isConnectionLostOverlayVisible(): Promise<boolean>;
  abstract getConnectionLostText(): Promise<string>;
  abstract clickServerConfig(): Promise<void>;
  abstract isServerConfigModalVisible(): Promise<boolean>;
}
