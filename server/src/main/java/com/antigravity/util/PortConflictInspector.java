package com.antigravity.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility for diagnosing port conflicts when the server fails to bind its configured port. Inspects
 * running processes and detects Windows dynamic port reservations (WinNAT / Hyper-V).
 */
public class PortConflictInspector {

  private static final Logger logger = LoggerFactory.getLogger(PortConflictInspector.class);

  private static final Pattern EXCLUDED_RANGE_PATTERN = Pattern.compile("^\\s*(\\d+)\\s+(\\d+)");
  private static final Pattern SS_USERS_PATTERN =
      Pattern.compile("users:\\(\\(\"([^\"]+)\",pid=(\\d+)");

  private static CommandRunner commandRunner = new DefaultCommandRunner();

  public interface CommandRunner {
    String runCommand(String[] command, long timeoutSeconds) throws Exception;
  }

  public static void setCommandRunner(CommandRunner runner) {
    commandRunner = (runner != null) ? runner : new DefaultCommandRunner();
  }

  static class ParsedProcess {
    final long pid;
    final String processName;

    ParsedProcess(long pid, String processName) {
      this.pid = pid;
      this.processName = processName;
    }
  }

  public static PortConflictReport inspect(int port) {
    return inspect(port, System.getProperty("os.name", ""));
  }

  public static PortConflictReport inspect(int port, String osName) {
    if (osName != null && osName.toLowerCase().contains("win")) {
      return inspectWindows(port);
    }
    return inspectUnix(port, osName);
  }

  static class ProcessDetails {
    final String path;
    final String commandLine;

    ProcessDetails(String path, String commandLine) {
      this.path = path;
      this.commandLine = commandLine;
    }
  }

  private static PortConflictReport inspectWindows(int port) {
    try {
      String netstatOut = runCommandSafe(new String[] {"netstat", "-ano", "-p", "tcp"}, 3);
      Long pid = parseListeningPidFromNetstat(netstatOut, port);

      if (pid != null) {
        String tasklistOut =
            runCommandSafe(
                new String[] {"tasklist", "/FI", "PID eq " + pid, "/FO", "CSV", "/NH"}, 3);
        String processName = parseProcessNameFromTasklist(tasklistOut);

        String psOut =
            runCommandSafe(
                new String[] {
                  "powershell.exe",
                  "-NoProfile",
                  "-NonInteractive",
                  "-Command",
                  "$p = Get-CimInstance Win32_Process -Filter 'ProcessId = "
                      + pid
                      + "' -ErrorAction SilentlyContinue; if (-not $p) { $p = Get-WmiObject Win32_Process -Filter 'ProcessId = "
                      + pid
                      + "' -ErrorAction SilentlyContinue }; if ($p) { if ($p.ExecutablePath) { Write-Output ('PATH=' + $p.ExecutablePath) }; if ($p.CommandLine) { Write-Output ('CMD=' + $p.CommandLine) } } else { $gp = Get-Process -Id "
                      + pid
                      + " -ErrorAction SilentlyContinue; if ($gp -and $gp.Path) { Write-Output ('PATH=' + $gp.Path) } }"
                },
                3);
        ProcessDetails details = parseWindowsProcessDetails(psOut);
        String applicationName = resolveApplicationName(processName, details.commandLine);

        return PortConflictReport.forProcess(
            port, pid, processName, details.path, details.commandLine, applicationName);
      }

      String netshOut =
          runCommandSafe(
              new String[] {
                "netsh", "interface", "ipv4", "show", "excludedportrange", "protocol=tcp"
              },
              3);
      String range = parseExcludedPortRange(netshOut, port);

      if (range == null) {
        String netshIpv6 =
            runCommandSafe(
                new String[] {
                  "netsh", "interface", "ipv6", "show", "excludedportrange", "protocol=tcp"
                },
                3);
        range = parseExcludedPortRange(netshIpv6, port);
      }

      if (range != null) {
        return PortConflictReport.forExcludedRange(port, range);
      }
    } catch (Exception e) {
      logger.debug("Error during Windows port conflict inspection: {}", e.getMessage());
    }

    return PortConflictReport.forUnknown(port);
  }

  private static PortConflictReport inspectUnix(int port, String osName) {
    try {
      String lsofOut =
          runCommandSafe(new String[] {"lsof", "-n", "-P", "-iTCP:" + port, "-sTCP:LISTEN"}, 3);
      ParsedProcess proc = parseLsofOutput(lsofOut);

      if (proc == null && osName != null && osName.toLowerCase().contains("linux")) {
        String ssOut = runCommandSafe(new String[] {"ss", "-lptn", "sport = :" + port}, 3);
        proc = parseSsOutput(ssOut);
      }

      if (proc != null) {
        String cmdOut =
            runCommandSafe(
                new String[] {"ps", "-p", String.valueOf(proc.pid), "-o", "command="}, 2);
        String commandLine = (cmdOut != null && !cmdOut.trim().isEmpty()) ? cmdOut.trim() : null;

        String pathOut =
            runCommandSafe(new String[] {"ps", "-p", String.valueOf(proc.pid), "-o", "comm="}, 2);
        String path = (pathOut != null && !pathOut.trim().isEmpty()) ? pathOut.trim() : null;

        String applicationName = resolveApplicationName(proc.processName, commandLine);
        return PortConflictReport.forProcess(
            port, proc.pid, proc.processName, path, commandLine, applicationName);
      }
    } catch (Exception e) {
      logger.debug("Error during Unix port conflict inspection: {}", e.getMessage());
    }

    return PortConflictReport.forUnknown(port);
  }

  static ProcessDetails parseWindowsProcessDetails(String output) {
    if (output == null || output.trim().isEmpty()) {
      return new ProcessDetails(null, null);
    }
    String path = null;
    StringBuilder cmd = new StringBuilder();
    boolean capturingCmd = false;

    for (String line : output.split("\\r?\\n")) {
      String trimmed = line.trim();
      if (trimmed.startsWith("PATH=")) {
        path = trimmed.substring("PATH=".length()).trim();
      } else if (trimmed.startsWith("CMD=")) {
        capturingCmd = true;
        cmd.append(trimmed.substring("CMD=".length()));
      } else if (capturingCmd) {
        cmd.append(" ").append(trimmed);
      } else if (path == null && !trimmed.isEmpty()) {
        path = trimmed;
      }
    }
    String commandLine = cmd.length() > 0 ? cmd.toString().trim() : null;
    return new ProcessDetails(path, commandLine);
  }

  static String resolveApplicationName(String processName, String commandLine) {
    if (commandLine != null && !commandLine.trim().isEmpty()) {
      String lowerCmd = commandLine.toLowerCase();
      if (lowerCmd.contains("racecoordinator")
          || lowerCmd.contains("com.antigravity.app")
          || lowerCmd.contains("com.antigravity.")) {
        if (lowerCmd.contains("app") || lowerCmd.contains("server")) {
          return "Race Coordinator AI Server (another instance is already running)";
        } else if (lowerCmd.contains("ng") || lowerCmd.contains("client")) {
          return "Race Coordinator AI Client (Angular dev server)";
        }
        return "Race Coordinator AI (another instance is already running)";
      }
      if (lowerCmd.contains("ng serve")
          || lowerCmd.contains("@angular/cli")
          || lowerCmd.matches(".*\\bng(\\.js|\\.cmd|\\.ps1)?\\s+serve.*")) {
        return "Angular Dev Server";
      }
      if (processName != null && isJavaProcess(processName)) {
        String jarName = extractJarName(commandLine);
        if (jarName != null) {
          return "Java Application (" + jarName + ")";
        }
        return "Java Application";
      }
      if (processName != null && isNodeProcess(processName)) {
        return "Node.js Application";
      }
    } else if (processName != null && isJavaProcess(processName)) {
      return "Java Application";
    }
    return null;
  }

  static boolean isJavaProcess(String processName) {
    if (processName == null) {
      return false;
    }
    String p = processName.toLowerCase();
    return p.equals("java") || p.equals("java.exe") || p.equals("javaw") || p.equals("javaw.exe");
  }

  static boolean isNodeProcess(String processName) {
    if (processName == null) {
      return false;
    }
    String p = processName.toLowerCase();
    return p.equals("node") || p.equals("node.exe");
  }

  static String extractJarName(String commandLine) {
    Pattern jarPattern =
        Pattern.compile("-jar\\s+[\"']?([^\"'\\r\\n]+?\\.jar)[\"']?", Pattern.CASE_INSENSITIVE);
    Matcher matcher = jarPattern.matcher(commandLine);
    if (matcher.find()) {
      String jarPath = matcher.group(1);
      int lastSlash = Math.max(jarPath.lastIndexOf('/'), jarPath.lastIndexOf('\\'));
      return (lastSlash >= 0) ? jarPath.substring(lastSlash + 1) : jarPath;
    }
    return null;
  }

  static Long parseListeningPidFromNetstat(String output, int port) {
    if (output == null || output.trim().isEmpty()) {
      return null;
    }
    String targetPortStr = Integer.toString(port);
    for (String line : output.split("\\r?\\n")) {
      String trimmed = line.trim();
      if (!trimmed.toUpperCase().startsWith("TCP")) {
        continue;
      }
      String[] parts = trimmed.split("\\s+");
      if (parts.length >= 5) {
        String localAddr = parts[1];
        String state = parts[3];
        String pidStr = parts[4];
        if ("LISTENING".equalsIgnoreCase(state)) {
          int colonIdx = localAddr.lastIndexOf(':');
          if (colonIdx >= 0) {
            String portStr = localAddr.substring(colonIdx + 1);
            if (targetPortStr.equals(portStr)) {
              try {
                long pid = Long.parseLong(pidStr);
                if (pid > 0) {
                  return pid;
                }
              } catch (NumberFormatException ignored) {
              }
            }
          }
        }
      }
    }
    return null;
  }

  static String parseProcessNameFromTasklist(String output) {
    if (output == null || output.trim().isEmpty()) {
      return null;
    }
    for (String line : output.split("\\r?\\n")) {
      String trimmed = line.trim();
      if (trimmed.startsWith("\"")) {
        int endQuote = trimmed.indexOf('"', 1);
        if (endQuote > 1) {
          return trimmed.substring(1, endQuote);
        }
      }
    }
    return null;
  }

  static String parseExcludedPortRange(String output, int port) {
    if (output == null || output.trim().isEmpty()) {
      return null;
    }
    for (String line : output.split("\\r?\\n")) {
      Matcher matcher = EXCLUDED_RANGE_PATTERN.matcher(line);
      if (matcher.find()) {
        try {
          int startPort = Integer.parseInt(matcher.group(1));
          int endPort = Integer.parseInt(matcher.group(2));
          if (port >= startPort && port <= endPort) {
            return startPort + " - " + endPort;
          }
        } catch (NumberFormatException ignored) {
        }
      }
    }
    return null;
  }

  static ParsedProcess parseLsofOutput(String output) {
    if (output == null || output.trim().isEmpty()) {
      return null;
    }
    String[] lines = output.split("\\r?\\n");
    for (String line : lines) {
      String trimmed = line.trim();
      if (trimmed.toUpperCase().startsWith("COMMAND") || trimmed.isEmpty()) {
        continue;
      }
      String[] parts = trimmed.split("\\s+");
      if (parts.length >= 2) {
        String processName = parts[0];
        try {
          long pid = Long.parseLong(parts[1]);
          return new ParsedProcess(pid, processName);
        } catch (NumberFormatException ignored) {
        }
      }
    }
    return null;
  }

  static ParsedProcess parseSsOutput(String output) {
    if (output == null || output.trim().isEmpty()) {
      return null;
    }
    Matcher matcher = SS_USERS_PATTERN.matcher(output);
    if (matcher.find()) {
      String name = matcher.group(1);
      try {
        long pid = Long.parseLong(matcher.group(2));
        return new ParsedProcess(pid, name);
      } catch (NumberFormatException ignored) {
      }
    }
    return null;
  }

  private static String runCommandSafe(String[] command, long timeoutSeconds) {
    try {
      return commandRunner.runCommand(command, timeoutSeconds);
    } catch (Exception e) {
      logger.debug("Failed executing {}: {}", command[0], e.getMessage());
      return null;
    }
  }

  static class DefaultCommandRunner implements CommandRunner {
    @Override
    public String runCommand(String[] command, long timeoutSeconds) throws Exception {
      ProcessBuilder pb = new ProcessBuilder(command);
      pb.redirectErrorStream(true);
      Process process = pb.start();

      final StringBuilder output = new StringBuilder();
      Thread readerThread =
          new Thread(
              () -> {
                try (BufferedReader reader =
                    new BufferedReader(
                        new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                  String line;
                  while ((line = reader.readLine()) != null) {
                    output.append(line).append(System.lineSeparator());
                  }
                } catch (Exception ignored) {
                }
              });
      readerThread.setDaemon(true);
      readerThread.start();

      boolean completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
      if (!completed) {
        process.destroyForcibly();
        return null;
      }
      readerThread.join(1000);
      return output.toString();
    }
  }
}
