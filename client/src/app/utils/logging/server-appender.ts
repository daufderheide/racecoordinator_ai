import { LogAppender, LogEntry, LogLevel } from "./log-appender";

function generateClientId(): string {
  try {
    if (typeof sessionStorage !== "undefined") {
      const stored = sessionStorage.getItem("rc_client_id");
      if (stored) return stored;
      const newId = Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem("rc_client_id", newId);
      return newId;
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return Math.random().toString(36).substring(2, 8);
}

export class ServerLogAppender implements LogAppender {
  private pendingEntries: {
    level: string;
    message: string;
    clientId: string;
  }[] = [];
  private flushTimer: any = null;
  private isSending = false;
  private clientId: string;

  constructor(
    private baseUrlOrFn: string | (() => string),
    clientId?: string,
  ) {
    this.clientId = clientId || generateClientId();
  }

  public getClientId(): string {
    return this.clientId;
  }

  private getBaseUrl(): string {
    return typeof this.baseUrlOrFn === "function"
      ? this.baseUrlOrFn()
      : this.baseUrlOrFn;
  }

  append(entry: LogEntry): void {
    // Only forward warnings, errors, or performance diagnostic entries
    if (entry.level < LogLevel.WARN && !entry.message.includes("[PERF]")) {
      return;
    }

    const levelStr = LogLevel[entry.level] || "WARN";
    const argsStr =
      entry.args && entry.args.length > 0
        ? " " +
          entry.args
            .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
            .join(" ")
        : "";
    const fullMessage = `${entry.message}${argsStr}`;

    this.pendingEntries.push({
      level: levelStr,
      message: fullMessage,
      clientId: this.clientId,
    });

    // Limit buffer to 50 entries so we don't accumulate indefinitely if server is offline
    if (this.pendingEntries.length > 50) {
      this.pendingEntries.shift();
    }

    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimer || this.isSending) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, 200);
  }

  public flush(): void {
    if (this.isSending || this.pendingEntries.length === 0) return;
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return;

    this.isSending = true;
    const batch = [...this.pendingEntries];
    this.pendingEntries = [];

    const sendNext = async (idx: number) => {
      if (idx >= batch.length) {
        this.isSending = false;
        if (this.pendingEntries.length > 0) {
          this.scheduleFlush();
        }
        return;
      }
      const item = batch[idx];
      try {
        await fetch(`${baseUrl}/api/client-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      } catch (_err) {
        // Silently ignore network failures to avoid recursion
      }
      sendNext(idx + 1);
    };

    sendNext(0);
  }
}
