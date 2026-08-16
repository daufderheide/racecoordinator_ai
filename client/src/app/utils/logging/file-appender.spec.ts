import { fakeAsync, tick } from "@angular/core/testing";
import { FileSystemService } from "@app/services/file-system.service";

import { FileAppender } from "./file-appender";
import { LogEntry, LogLevel } from "./log-appender";

describe("FileAppender", () => {
  let fileSystemServiceSpy: jasmine.SpyObj<FileSystemService>;

  beforeEach(() => {
    fileSystemServiceSpy = jasmine.createSpyObj("FileSystemService", [
      "deleteFile",
      "appendToFile",
    ]);
    fileSystemServiceSpy.deleteFile.and.resolveTo();
    fileSystemServiceSpy.appendToFile.and.resolveTo();
  });

  it("should initialize as first tab when no peer responds and delete old log file", fakeAsync(() => {
    const _appender = new FileAppender(fileSystemServiceSpy);

    tick(150);

    expect(fileSystemServiceSpy.deleteFile).toHaveBeenCalledWith(
      "race_coordinator_client.log",
    );
  }));

  it("should respond with PONG when receiving PING message on broadcast channel", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);
    const channel = (appender as any).channel as BroadcastChannel;

    spyOn(channel, "postMessage");

    // Simulate receiving PING
    channel.onmessage!({ data: "PING" } as MessageEvent);

    expect(channel.postMessage).toHaveBeenCalledWith("PONG");
  }));

  it("should not delete log file if PONG is received (not first tab)", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);
    const channel = (appender as any).channel as BroadcastChannel;

    // Simulate peer responding with PONG
    channel.onmessage!({ data: "PONG" } as MessageEvent);

    tick(150);

    expect(fileSystemServiceSpy.deleteFile).not.toHaveBeenCalled();
  }));

  it("should format and append log entries with object args and string args", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);
    tick(150);

    const entry1: LogEntry = {
      level: LogLevel.INFO,
      message: "Test message",
      timestamp: new Date("2026-01-01T12:00:00.000Z"),
      args: [{ key: "value" }, "extra"],
    };

    appender.append(entry1);
    tick(50);

    expect(fileSystemServiceSpy.appendToFile).toHaveBeenCalledWith(
      "race_coordinator_client.log",
      '[2026-01-01T12:00:00.000Z] [INFO] Test message {"key":"value"} extra\n',
    );
  }));

  it("should buffer log entries until initialization completes", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);

    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message: "Early error",
      timestamp: new Date("2026-01-01T12:00:00.000Z"),
    };

    appender.append(entry);
    // Not yet initialized
    expect(fileSystemServiceSpy.appendToFile).not.toHaveBeenCalled();

    tick(150);

    expect(fileSystemServiceSpy.appendToFile).toHaveBeenCalledWith(
      "race_coordinator_client.log",
      "[2026-01-01T12:00:00.000Z] [ERROR] Early error\n",
    );
  }));

  it("should handle error in appendToFile gracefully", fakeAsync(() => {
    spyOn(console, "error");
    fileSystemServiceSpy.appendToFile.and.rejectWith(new Error("Disk full"));

    const appender = new FileAppender(fileSystemServiceSpy);
    tick(150);

    const entry: LogEntry = {
      level: LogLevel.WARN,
      message: "Warning test",
      timestamp: new Date(),
    };

    appender.append(entry);
    tick(50);

    expect(console.error).toHaveBeenCalled();
  }));
});
