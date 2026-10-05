package com.antigravity.util;

/** Report containing diagnostic information about a port conflict. */
public class PortConflictReport {

  public enum ConflictType {
    PROCESS_IN_USE,
    WINDOWS_EXCLUDED_PORT_RANGE,
    UNKNOWN
  }

  private final int port;
  private final ConflictType conflictType;
  private final Long pid;
  private final String processName;
  private final String executablePath;
  private final String commandLine;
  private final String applicationName;
  private final String portRange;

  public PortConflictReport(
      int port,
      ConflictType conflictType,
      Long pid,
      String processName,
      String executablePath,
      String commandLine,
      String applicationName,
      String portRange) {
    this.port = port;
    this.conflictType = conflictType;
    this.pid = pid;
    this.processName = processName;
    this.executablePath = executablePath;
    this.commandLine = commandLine;
    this.applicationName = applicationName;
    this.portRange = portRange;
  }

  public PortConflictReport(
      int port,
      ConflictType conflictType,
      Long pid,
      String processName,
      String executablePath,
      String portRange) {
    this(port, conflictType, pid, processName, executablePath, null, null, portRange);
  }

  public static PortConflictReport forProcess(
      int port,
      Long pid,
      String processName,
      String executablePath,
      String commandLine,
      String applicationName) {
    return new PortConflictReport(
        port,
        ConflictType.PROCESS_IN_USE,
        pid,
        processName,
        executablePath,
        commandLine,
        applicationName,
        null);
  }

  public static PortConflictReport forProcess(
      int port, Long pid, String processName, String executablePath) {
    return forProcess(port, pid, processName, executablePath, null, null);
  }

  public static PortConflictReport forExcludedRange(int port, String portRange) {
    return new PortConflictReport(
        port, ConflictType.WINDOWS_EXCLUDED_PORT_RANGE, null, null, null, null, null, portRange);
  }

  public static PortConflictReport forUnknown(int port) {
    return new PortConflictReport(port, ConflictType.UNKNOWN, null, null, null, null, null, null);
  }

  public int getPort() {
    return port;
  }

  public ConflictType getConflictType() {
    return conflictType;
  }

  public Long getPid() {
    return pid;
  }

  public String getProcessName() {
    return processName;
  }

  public String getExecutablePath() {
    return executablePath;
  }

  public String getCommandLine() {
    return commandLine;
  }

  public String getApplicationName() {
    return applicationName;
  }

  public String getPortRange() {
    return portRange;
  }

  /** Formats a detailed multi-line diagnostic string suitable for server logs. */
  public String toDiagnosticString() {
    StringBuilder sb = new StringBuilder();
    sb.append("=== Port Conflict Diagnostic Report ===").append(System.lineSeparator());
    sb.append("Target Port : ").append(port).append(System.lineSeparator());
    sb.append("Status      : ").append(conflictType).append(System.lineSeparator());

    if (conflictType == ConflictType.PROCESS_IN_USE) {
      if (applicationName != null) {
        sb.append("Application : ").append(applicationName).append(System.lineSeparator());
      }
      if (processName != null) {
        sb.append("Process Name: ").append(processName).append(System.lineSeparator());
      }
      if (pid != null) {
        sb.append("PID         : ").append(pid).append(System.lineSeparator());
      }
      if (executablePath != null && !executablePath.trim().isEmpty()) {
        sb.append("Path        : ").append(executablePath).append(System.lineSeparator());
      }
      if (commandLine != null && !commandLine.trim().isEmpty()) {
        sb.append("Command Line: ").append(commandLine).append(System.lineSeparator());
      }
    } else if (conflictType == ConflictType.WINDOWS_EXCLUDED_PORT_RANGE) {
      sb.append("Exclusion   : ")
          .append(portRange)
          .append(" (WinNAT / Hyper-V / WSL2)")
          .append(System.lineSeparator());
    } else {
      sb.append("Details     : Port in use or unavailable; no process or exclusion matched.")
          .append(System.lineSeparator());
    }
    sb.append("========================================");
    return sb.toString();
  }

  /** Formats a clean, readable dialog message for GUI popups and user troubleshooting. */
  public String toDialogMessage() {
    StringBuilder sb = new StringBuilder();
    sb.append("Failed to start Web Server on port ").append(port).append(".\n\n");

    if (conflictType == ConflictType.PROCESS_IN_USE) {
      sb.append("Port ").append(port).append(" is currently in use by another application:\n");
      if (applicationName != null) {
        sb.append("  • Application: ").append(applicationName).append("\n");
      }
      if (processName != null) {
        sb.append("  • Process: ").append(processName);
        if (pid != null) {
          sb.append(" (PID: ").append(pid).append(")");
        }
        sb.append("\n");
      } else if (pid != null) {
        sb.append("  • PID: ").append(pid).append("\n");
      }
      if (executablePath != null && !executablePath.trim().isEmpty()) {
        sb.append("  • Path: ").append(executablePath).append("\n");
      }
      if (commandLine != null && !commandLine.trim().isEmpty()) {
        String shortCmd = commandLine.trim();
        if (shortCmd.length() > 140) {
          shortCmd = shortCmd.substring(0, 140) + "...";
        }
        sb.append("  • Command: ").append(shortCmd).append("\n");
      }
      sb.append("\nTroubleshooting Steps:\n");
      if (pid != null) {
        sb.append("1. Close or terminate the conflicting application (PID: ")
            .append(pid)
            .append(").\n");
      } else {
        sb.append("1. Close or terminate the conflicting application.\n");
      }
      if (applicationName != null
          && applicationName.toLowerCase().contains("race coordinator ai")) {
        sb.append("   Another instance of Race Coordinator AI appears to already be running.\n");
      }
      sb.append(
          "2. Or start with '--port <port>' (or set SERVER_PORT / PORT environment variable).");
    } else if (conflictType == ConflictType.WINDOWS_EXCLUDED_PORT_RANGE) {
      sb.append("Port ").append(port).append(" falls within a Windows excluded port range");
      if (portRange != null) {
        sb.append(" (").append(portRange).append(")");
      }
      sb.append(".\n");
      sb.append("This is caused by Windows dynamic port reservations (WinNAT / Hyper-V / WSL2).\n");
      sb.append("No application is listening on port ")
          .append(port)
          .append(", but Windows has reserved it.\n\n");
      sb.append("Troubleshooting Steps:\n");
      sb.append("1. Restart the Windows NAT service from an Administrator Command Prompt:\n");
      sb.append("     net stop winnat\n");
      sb.append("     net start winnat\n");
      sb.append("2. Or restart your computer.\n");
      sb.append(
          "3. Or start with '--port <port>' (or set SERVER_PORT / PORT environment variable).");
    } else {
      sb.append("Port is already in use or unavailable.\n\n");
      sb.append("Troubleshooting Steps:\n");
      sb.append("1. Terminate the process using port ")
          .append(port)
          .append(", or restart your computer.\n");
      sb.append(
          "2. Or start with '--port <port>' (or set SERVER_PORT / PORT environment variable).");
    }

    return sb.toString();
  }
}
