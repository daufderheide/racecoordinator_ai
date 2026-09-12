package com.antigravity.util;

import java.awt.GraphicsEnvironment;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Cross-platform helper to invoke native OS folder chooser dialogs on desktop environments (macOS
 * Finder, Windows Explorer, Linux Zenity/KDialog).
 */
public class NativeDirectoryChooser {

  private static final Logger logger = LoggerFactory.getLogger(NativeDirectoryChooser.class);
  private static final long TIMEOUT_SECONDS = 120;

  /**
   * Interface for executing OS command lines, allowing unit testing without actual GUI execution.
   */
  public interface CommandRunner {
    String runCommand(String[] command, long timeoutSeconds) throws Exception;
  }

  private static CommandRunner commandRunner = new DefaultCommandRunner();

  /** Public setter to allow unit testing with mock command runners. */
  public static void setCommandRunner(CommandRunner runner) {
    commandRunner = runner != null ? runner : new DefaultCommandRunner();
  }

  /**
   * Opens the native OS directory chooser dialog and returns the selected folder path.
   *
   * @param title the prompt or title displayed in the dialog
   * @return the selected path as a String, or null if cancelled, timed out, headless, or failed
   */
  public static String chooseDirectory(String title) {
    if (GraphicsEnvironment.isHeadless()) {
      logger.info("Cannot open native directory chooser in headless environment.");
      return null;
    }

    String os = System.getProperty("os.name", "").toLowerCase();
    String safeTitle = title != null ? title.replace("\"", "").replace("'", "") : "Select Folder";

    String[] command;
    if (os.contains("mac")) {
      command =
          new String[] {
            "osascript", "-e", "POSIX path of (choose folder with prompt \"" + safeTitle + "\")"
          };
    } else if (os.contains("win")) {
      String psScript =
          "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog; "
              + "$dialog.Description = '"
              + safeTitle
              + "'; "
              + "$dialog.ShowNewFolderButton = $true; "
              + "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { "
              + "[Console]::Out.WriteLine($dialog.SelectedPath) }";
      command =
          new String[] {
            "powershell.exe",
            "-NoProfile",
            "-NonInteractive",
            "-Sta",
            "-Command",
            "Add-Type -AssemblyName System.Windows.Forms; " + psScript
          };
    } else {
      // Linux: Try zenity first
      command = new String[] {"zenity", "--file-selection", "--directory", "--title=" + safeTitle};
    }

    try {
      String result = commandRunner.runCommand(command, TIMEOUT_SECONDS);
      if (result != null) {
        String trimmed = result.trim();
        if (!trimmed.isEmpty()) {
          return trimmed;
        }
      }
    } catch (Exception e) {
      logger.debug("Native directory chooser cancelled or encountered error: {}", e.getMessage());
    }

    return null;
  }

  private static class DefaultCommandRunner implements CommandRunner {
    @Override
    public String runCommand(String[] command, long timeoutSeconds) throws Exception {
      ProcessBuilder pb = new ProcessBuilder(command);
      pb.redirectErrorStream(true);
      Process process = pb.start();

      StringBuilder output = new StringBuilder();
      try (BufferedReader reader =
          new BufferedReader(
              new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
        String line;
        while ((line = reader.readLine()) != null) {
          output.append(line).append(System.lineSeparator());
        }
      }

      boolean completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
      if (!completed) {
        process.destroyForcibly();
        throw new RuntimeException(
            "Directory chooser timed out after " + timeoutSeconds + " seconds.");
      }

      if (process.exitValue() != 0) {
        throw new RuntimeException("Directory chooser exited with code: " + process.exitValue());
      }

      return output.toString();
    }
  }
}
