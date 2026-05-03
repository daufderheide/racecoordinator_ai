import { TestBed } from "@angular/core/testing";

import { LogLevel } from "../utils/logging/log-appender";
import { LoggerService } from "./logger.service";

describe("LoggerService", () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService],
    });
    service = TestBed.inject(LoggerService);
    // Force a known level for testing
    service.setMinLevel(LogLevel.INFO);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should update minLevel via setLevel string", () => {
    service.setLevel("DEBUG");
    // We can't access minLevel directly as it is private, but we can test its effect
    const consoleSpy = spyOn(console, "debug");
    service.debug("test debug");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should update minLevel to ERROR via setLevel string", () => {
    service.setLevel("ERROR");
    const infoSpy = spyOn(console, "info");
    const errorSpy = spyOn(console, "error");

    service.info("test info");
    service.error("test error");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("should not change level if invalid string is provided", () => {
    service.setLevel("INFO");
    const infoSpy = spyOn(console, "info");

    service.setLevel("INVALID_LEVEL");
    service.info("test info");

    expect(infoSpy).toHaveBeenCalled();
  });

  it("should respect minLevel for info logs", () => {
    service.setMinLevel(LogLevel.WARN);
    const infoSpy = spyOn(console, "info");
    const warnSpy = spyOn(console, "warn");

    service.info("test info");
    service.warn("test warn");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should respect minLevel for debug logs", () => {
    service.setMinLevel(LogLevel.INFO);
    const debugSpy = spyOn(console, "debug");
    const infoSpy = spyOn(console, "info");

    service.debug("test debug");
    service.info("test info");

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
  });

  it("should respect minLevel for error logs", () => {
    service.setMinLevel(LogLevel.ERROR);
    const warnSpy = spyOn(console, "warn");
    const errorSpy = spyOn(console, "error");

    service.warn("test warn");
    service.error("test error");

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
