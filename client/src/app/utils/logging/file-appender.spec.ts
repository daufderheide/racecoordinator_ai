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

  it("should forward log entries to leader via broadcast channel if not first tab", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);
    const channel = (appender as any).channel as BroadcastChannel;
    spyOn(channel, "postMessage");

    // Simulate peer responding with PONG
    channel.onmessage!({ data: "PONG" } as MessageEvent);
    tick(150);

    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: "Follower tab message",
      timestamp: new Date("2026-01-01T12:00:00.000Z"),
    };

    appender.append(entry);
    tick(50);

    // Follower tab should NOT call appendToFile directly
    expect(fileSystemServiceSpy.appendToFile).not.toHaveBeenCalled();
    // Follower tab SHOULD send APPEND message on broadcast channel
    expect(channel.postMessage).toHaveBeenCalledWith({
      type: "APPEND",
      lines: ["[2026-01-01T12:00:00.000Z] [INFO] Follower tab message\n"],
    });
  }));

  it("should flush buffered logs to leader when follower finishes initializing", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);
    const channel = (appender as any).channel as BroadcastChannel;
    spyOn(channel, "postMessage");

    const entry: LogEntry = {
      level: LogLevel.WARN,
      message: "Early follower log",
      timestamp: new Date("2026-01-01T12:00:00.000Z"),
    };

    appender.append(entry);

    // Simulate peer responding with PONG
    channel.onmessage!({ data: "PONG" } as MessageEvent);
    tick(150);

    expect(channel.postMessage).toHaveBeenCalledWith({
      type: "APPEND",
      lines: ["[2026-01-01T12:00:00.000Z] [WARN] Early follower log\n"],
    });
    expect(fileSystemServiceSpy.appendToFile).not.toHaveBeenCalled();
  }));

  it("should receive APPEND message and append to file if leader tab", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);
    const channel = (appender as any).channel as BroadcastChannel;
    tick(150); // Becomes leader

    // Simulate receiving APPEND message from a follower tab
    channel.onmessage!({
      data: {
        type: "APPEND",
        lines: ["[2026-01-01T12:00:00.000Z] [WARN] Remote log from tab 2\n"],
      },
    } as MessageEvent);
    tick(50);

    expect(fileSystemServiceSpy.appendToFile).toHaveBeenCalledWith(
      "race_coordinator_client.log",
      "[2026-01-01T12:00:00.000Z] [WARN] Remote log from tab 2\n",
    );
  }));

  it("should promote follower tab to leader when receiving LEADER_LEAVING message", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);
    const channel = (appender as any).channel as BroadcastChannel;

    // Simulate being a follower
    channel.onmessage!({ data: "PONG" } as MessageEvent);
    tick(150);
    expect((appender as any).isLeader).toBeFalse();

    // Leader leaves
    channel.onmessage!({ data: { type: "LEADER_LEAVING" } } as MessageEvent);
    expect((appender as any).isLeader).toBeTrue();

    // Now appends should go directly to file
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: "Now I am leader",
      timestamp: new Date("2026-01-01T12:00:00.000Z"),
    };
    appender.append(entry);
    tick(50);

    expect(fileSystemServiceSpy.appendToFile).toHaveBeenCalledWith(
      "race_coordinator_client.log",
      "[2026-01-01T12:00:00.000Z] [INFO] Now I am leader\n",
    );
  }));

  it("should broadcast LEADER_LEAVING on page unload if leader", fakeAsync(() => {
    const appender = new FileAppender(fileSystemServiceSpy);
    const channel = (appender as any).channel as BroadcastChannel;
    spyOn(channel, "postMessage");
    tick(150); // Becomes leader

    const unloadListener = (appender as any).unloadListener;
    expect(unloadListener).toBeDefined();
    unloadListener();

    expect(channel.postMessage).toHaveBeenCalledWith({
      type: "LEADER_LEAVING",
    });
  }));

  it("should close channel on destroy", () => {
    const appender = new FileAppender(fileSystemServiceSpy);
    const channel = (appender as any).channel as BroadcastChannel;
    spyOn(channel, "close");

    appender.destroy();

    expect(channel.close).toHaveBeenCalled();
  });
});
