import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";

import { DataServerConfigHelper } from "./data-server-config.helper";

describe("DataServerConfigHelper", () => {
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    mockSettingsService = jasmine.createSpyObj<SettingsService>(
      "SettingsService",
      ["getSettings"],
    );
    mockLogger = jasmine.createSpyObj<LoggerService>("LoggerService", ["info"]);
    mockSettingsService.getSettings.and.returnValue({} as any);
  });

  it("should initialize default ip, port and baseUrl", () => {
    const helper = new DataServerConfigHelper(mockSettingsService, mockLogger);
    expect(helper.serverIp).toBeDefined();
    expect(helper.serverPort).toBeDefined();
    expect(helper.baseUrl).toContain("://");
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it("should use serverIp from SettingsService if configured", () => {
    mockSettingsService.getSettings.and.returnValue({
      serverIp: "192.168.1.50",
    } as any);
    const helper = new DataServerConfigHelper(mockSettingsService, mockLogger);
    expect(helper.serverIp).toBe("192.168.1.50");
    expect(helper.baseUrl).toBe(`http://192.168.1.50:${helper.serverPort}`);
  });

  it("should return false when setServerAddress called with same ip and port", () => {
    const helper = new DataServerConfigHelper(mockSettingsService, mockLogger);
    const sameIp = helper.serverIp;
    const samePort = helper.serverPort;
    const changed = helper.setServerAddress(sameIp, samePort);
    expect(changed).toBeFalse();
  });

  it("should return true and update values when setServerAddress called with new values", () => {
    const helper = new DataServerConfigHelper(mockSettingsService, mockLogger);
    const newIp = helper.serverIp === "10.0.0.1" ? "10.0.0.2" : "10.0.0.1";
    const newPort = helper.serverPort === 9090 ? 9091 : 9090;
    const changed = helper.setServerAddress(newIp, newPort);
    expect(changed).toBeTrue();
    expect(helper.serverIp).toBe(newIp);
    expect(helper.serverPort).toBe(newPort);
    expect(helper.baseUrl).toBe(`http://${newIp}:${newPort}`);
  });

  it("should update connection intent", () => {
    const helper = new DataServerConfigHelper(mockSettingsService, mockLogger);
    helper.setConnectionIntent("test-intent");
    expect(helper.connectionIntent).toBe("test-intent");
  });

  it("should compute protocols correctly", () => {
    const helper = new DataServerConfigHelper(mockSettingsService, mockLogger);
    expect(["http", "https"]).toContain(helper.serverProtocol);
    expect(["ws", "wss"]).toContain(helper.wsProtocol);
  });
});
