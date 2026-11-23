import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";

export class DataServerConfigHelper {
  public serverIp =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  public serverPort = 7070;
  public connectionIntent = "";

  constructor(
    private settingsService: SettingsService,
    private logger: LoggerService,
  ) {
    if (typeof window !== "undefined" && window.location.hostname) {
      this.serverIp = window.location.hostname;
      if (window.location.port && window.location.port !== "4200") {
        this.serverPort = parseInt(window.location.port, 10);
      }
    }
    const settings = this.settingsService.getSettings();
    if (settings.serverIp) {
      this.serverIp = settings.serverIp;
    }
    if (
      settings.serverPort &&
      (typeof window === "undefined" ||
        !window.location.port ||
        window.location.port === "4200")
    ) {
      this.serverPort = settings.serverPort;
    }
    this.logger.info(
      `DataService initialized with Base Server URL: ${this.baseUrl}`,
    );
  }

  get serverProtocol(): string {
    return typeof window !== "undefined" &&
      window.location.protocol === "https:"
      ? "https"
      : "http";
  }

  get wsProtocol(): string {
    return typeof window !== "undefined" &&
      window.location.protocol === "https:"
      ? "wss"
      : "ws";
  }

  get baseUrl(): string {
    return `${this.serverProtocol}://${this.serverIp}:${this.serverPort}`;
  }

  setServerAddress(ip: string, port: number): boolean {
    if (this.serverIp === ip && this.serverPort === port) {
      return false;
    }
    this.serverIp = ip;
    this.serverPort = port;
    return true;
  }

  setConnectionIntent(intent: string): void {
    this.connectionIntent = intent;
  }
}
