import { Injectable, isDevMode } from "@angular/core";
import { FileSystemService } from "@app/services/file-system.service";
import { FileAppender } from "@app/utils/logging/file-appender";
import {
  ConsoleAppender,
  LogAppender,
  LogEntry,
  LogLevel,
} from "@app/utils/logging/log-appender";

@Injectable({
  providedIn: "root",
})
export class LoggerService {
  private appenders: LogAppender[] = [];
  private minLevel: LogLevel = isDevMode() ? LogLevel.DEBUG : LogLevel.INFO;

  constructor() {
    this.appenders.push(new ConsoleAppender());
  }

  registerFileLogging(fileSystemService: FileSystemService): void {
    // Only register once
    if (this.appenders.some((a) => a instanceof FileAppender)) return;
    this.appenders.push(new FileAppender(fileSystemService));
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      level,
      timestamp: new Date(),
      message,
      args,
    };

    for (const appender of this.appenders) {
      try {
        appender.append(entry);
      } catch (err) {
        // Fallback to console if an appender fails
        console.error("Logger appender failed:", err);
      }
    }
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  setLevel(level: string): void {
    const enumKey = level.toUpperCase() as keyof typeof LogLevel;
    if (LogLevel[enumKey] !== undefined) {
      this.minLevel = LogLevel[enumKey];
    }
  }
}
