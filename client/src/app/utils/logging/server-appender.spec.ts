import { fakeAsync, tick } from "@angular/core/testing";

import { LogEntry, LogLevel } from "./log-appender";
import { ServerLogAppender } from "./server-appender";

describe("ServerLogAppender", () => {
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    fetchSpy = spyOn(window, "fetch").and.returnValue(
      Promise.resolve(new Response("OK", { status: 200 })),
    );
  });

  it("should ignore INFO and DEBUG entries without [PERF]", fakeAsync(() => {
    const appender = new ServerLogAppender("http://localhost:8080");
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: "Normal info log",
      timestamp: new Date(),
    };

    appender.append(entry);
    tick(300);

    expect(fetchSpy).not.toHaveBeenCalled();
  }));

  it("should forward INFO entry if it contains [PERF]", fakeAsync(() => {
    const appender = new ServerLogAppender(
      "http://localhost:8080",
      "test-client",
    );
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: "[PERF] Countdown tick diagnostic",
      timestamp: new Date(),
    };

    appender.append(entry);
    tick(300);

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8080/api/client-logs",
      jasmine.objectContaining({
        method: "POST",
        body: JSON.stringify({
          level: "INFO",
          message: "[PERF] Countdown tick diagnostic",
          clientId: "test-client",
        }),
      }),
    );
  }));

  it("should forward WARN and ERROR entries with clientId", fakeAsync(() => {
    const appender = new ServerLogAppender(
      "http://localhost:8080",
      "test-client",
    );
    const warnEntry: LogEntry = {
      level: LogLevel.WARN,
      message: "Warning message",
      args: [{ detail: "extra" }],
      timestamp: new Date(),
    };

    appender.append(warnEntry);
    tick(300);

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8080/api/client-logs",
      jasmine.objectContaining({
        method: "POST",
        body: JSON.stringify({
          level: "WARN",
          message: 'Warning message {"detail":"extra"}',
          clientId: "test-client",
        }),
      }),
    );
  }));

  it("should dynamically resolve baseUrl using a function", fakeAsync(() => {
    let currentUrl = "http://server-a:8080";
    const appender = new ServerLogAppender(() => currentUrl);

    appender.append({
      level: LogLevel.WARN,
      message: "Server A warning",
      timestamp: new Date(),
    });
    tick(300);

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://server-a:8080/api/client-logs",
      jasmine.any(Object),
    );

    currentUrl = "http://server-b:8080";
    appender.append({
      level: LogLevel.ERROR,
      message: "Server B error",
      timestamp: new Date(),
    });
    tick(300);

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://server-b:8080/api/client-logs",
      jasmine.any(Object),
    );
  }));

  it("should handle fetch rejection silently without throwing", fakeAsync(() => {
    fetchSpy.and.callFake(() => Promise.reject(new Error("Network failed")));
    const appender = new ServerLogAppender("http://localhost:8080");

    appender.append({
      level: LogLevel.WARN,
      message: "Failed send",
      timestamp: new Date(),
    });
    expect(() => tick(300)).not.toThrow();
  }));

  it("should limit buffer to 50 entries", () => {
    const appender = new ServerLogAppender("http://localhost:8080");
    for (let i = 0; i < 60; i++) {
      appender.append({
        level: LogLevel.WARN,
        message: `Warning #${i}`,
        timestamp: new Date(),
      });
    }

    const pending = (appender as any).pendingEntries;
    expect(pending.length).toBe(50);
    expect(pending[0].message).toBe("Warning #10");
  });
});
