import { FileSystemService } from "@app/services/file-system.service";

import { LogAppender, LogEntry, LogLevel } from "./log-appender";

export class FileAppender implements LogAppender {
  private readonly LOG_FILENAME = "race_coordinator_client.log";
  private buffer: string[] = [];
  private isProcessing = false;
  private channel: BroadcastChannel;
  private initialized = false;
  private isLeader = false;
  private unloadListener?: () => void;

  constructor(private fileSystemService: FileSystemService) {
    this.channel = new BroadcastChannel("rc_logging_channel");
    this.setupUnloadListener();
    this.checkIfFirstTab();
  }

  private setupUnloadListener(): void {
    if (typeof window !== "undefined") {
      this.unloadListener = () => {
        if (this.isLeader) {
          try {
            this.channel.postMessage({ type: "LEADER_LEAVING" });
          } catch {
            // Ignore channel post errors on page unload
          }
        }
      };
      window.addEventListener("pagehide", this.unloadListener);
      window.addEventListener("beforeunload", this.unloadListener);
    }
  }

  private checkIfFirstTab(): void {
    let peerResponded = false;

    this.channel.onmessage = (event: MessageEvent) => {
      this.handleChannelMessage(event, (responded) => {
        peerResponded = responded;
      });
    };

    this.channel.postMessage("PING");

    setTimeout(async () => {
      if (!peerResponded) {
        this.isLeader = true;
        await this.fileSystemService.deleteFile(this.LOG_FILENAME);
      } else {
        this.isLeader = false;
      }
      this.initialized = true;
      if (this.isLeader) {
        this.processBuffer();
      } else {
        this.flushFollowerBuffer();
      }
    }, 100);
  }

  private handleChannelMessage(
    event: MessageEvent,
    onPeerResponse?: (val: boolean) => void,
  ): void {
    const data = event.data;
    if (data === "PING" || data?.type === "PING") {
      this.channel.postMessage("PONG");
    } else if (data === "PONG" || data?.type === "PONG") {
      onPeerResponse?.(true);
    } else if (data?.type === "APPEND" && Array.isArray(data.lines)) {
      if (this.isLeader) {
        this.buffer.push(...data.lines);
        if (this.initialized) {
          this.processBuffer();
        }
      }
    } else if (data?.type === "LEADER_LEAVING") {
      if (!this.isLeader) {
        this.isLeader = true;
        if (this.initialized) {
          this.processBuffer();
        }
      }
    }
  }

  append(entry: LogEntry): void {
    const timestampStr = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    const argsStr =
      entry.args && entry.args.length > 0
        ? " " +
          entry.args
            .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
            .join(" ")
        : "";
    const logLine = `[${timestampStr}] [${levelStr}] ${entry.message}${argsStr}\n`;

    if (!this.initialized) {
      this.buffer.push(logLine);
      return;
    }

    if (this.isLeader) {
      this.buffer.push(logLine);
      this.processBuffer();
    } else {
      this.channel.postMessage({ type: "APPEND", lines: [logLine] });
    }
  }

  private flushFollowerBuffer(): void {
    if (this.buffer.length === 0 || this.isLeader) return;
    const lines = this.buffer;
    this.buffer = [];
    this.channel.postMessage({ type: "APPEND", lines });
  }

  private async processBuffer(): Promise<void> {
    if (this.isProcessing || this.buffer.length === 0 || !this.isLeader) return;

    this.isProcessing = true;
    const toWrite = this.buffer;
    this.buffer = [];

    let success = false;
    try {
      const content = toWrite.join("");
      await this.fileSystemService.appendToFile(this.LOG_FILENAME, content);
      success = true;
    } catch (err) {
      console.error("FileAppender failed to write logs:", err);
      const remaining = toWrite.slice(-500);
      this.buffer = [...remaining, ...this.buffer].slice(-1000);
    } finally {
      this.isProcessing = false;
      if (success && this.buffer.length > 0 && this.isLeader) {
        this.processBuffer();
      }
    }
  }

  destroy(): void {
    if (this.unloadListener && typeof window !== "undefined") {
      window.removeEventListener("pagehide", this.unloadListener);
      window.removeEventListener("beforeunload", this.unloadListener);
    }
    try {
      this.channel.close();
    } catch {
      // Ignore channel close errors
    }
  }
}
