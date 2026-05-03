export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  timestamp: Date;
  message: string;
  args?: any[];
}

export interface LogAppender {
  append(entry: LogEntry): void;
}

export class ConsoleAppender implements LogAppender {
  append(entry: LogEntry): void {
    const timestampStr = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    const prefix = `[${timestampStr}] [${levelStr}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, ...(entry.args || []));
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, ...(entry.args || []));
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, ...(entry.args || []));
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, ...(entry.args || []));
        break;
    }
  }
}
