package com.antigravity.service;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Cross-platform service that prevents OS idle sleep, system suspension, and display blanking
 * during active races across Linux (systemd-inhibit), macOS (caffeinate), and Windows
 * (PowerShell/SetThreadExecutionState).
 */
public class SleepPreventionService {

  private static final Logger logger = LoggerFactory.getLogger(SleepPreventionService.class);

  /**
   * Interface for spawning OS processes to support unit testing without running real system
   * commands.
   */
  public interface ProcessSpawner {
    Process spawn(String[] command) throws IOException;
  }

  private static final SleepPreventionService INSTANCE = new SleepPreventionService();

  private ProcessSpawner processSpawner = new DefaultProcessSpawner();
  private Process lockProcess = null;
  private String activePlatform = null;

  public static SleepPreventionService getInstance() {
    return INSTANCE;
  }

  SleepPreventionService() {
    Runtime.getRuntime().addShutdownHook(new Thread(this::releaseSleepLock));
  }

  public void setProcessSpawner(ProcessSpawner spawner) {
    this.processSpawner = spawner != null ? spawner : new DefaultProcessSpawner();
  }

  public synchronized boolean acquireSleepLock() {
    if (lockProcess != null && lockProcess.isAlive()) {
      return true;
    }

    String os = System.getProperty("os.name", "").toLowerCase();
    String[] command = buildCommand(os);
    if (command == null) {
      logger.debug("Sleep prevention not supported on OS: {}", os);
      return false;
    }

    try {
      lockProcess = processSpawner.spawn(command);
      activePlatform = os;
      logger.info("Acquired OS sleep inhibition lock on {}", os);
      return true;
    } catch (Exception e) {
      logger.warn("Failed to acquire OS sleep inhibition lock on {}: {}", os, e.getMessage());
      lockProcess = null;
      activePlatform = null;
      return false;
    }
  }

  public synchronized boolean releaseSleepLock() {
    if (lockProcess == null) {
      return false;
    }

    try {
      lockProcess.destroy();
      logger.info("Released OS sleep inhibition lock on {}", activePlatform);
    } catch (Exception e) {
      logger.warn("Error releasing sleep inhibition lock: {}", e.getMessage());
    } finally {
      lockProcess = null;
      activePlatform = null;
    }
    return true;
  }

  public synchronized boolean isSleepLockActive() {
    return lockProcess != null && lockProcess.isAlive();
  }

  public synchronized String getActivePlatform() {
    return activePlatform;
  }

  static String[] buildCommand(String os) {
    if (os.contains("linux")) {
      return new String[] {
        "systemd-inhibit",
        "--what=idle:sleep",
        "--who=Race Coordinator AI",
        "--why=Active race in progress",
        "sleep",
        "infinity"
      };
    } else if (os.contains("mac")) {
      return new String[] {"caffeinate", "-d", "-i", "-s"};
    } else if (os.contains("win")) {
      String psScript =
          "$code = '[DllImport(\"kernel32.dll\")] public static extern uint"
              + " SetThreadExecutionState(uint esFlags);'; "
              + "$type = Add-Type -MemberDefinition $code -Name Power -Namespace Win32 -PassThru; "
              + "$type::SetThreadExecutionState(0x80000003); "
              + "while ($true) { Start-Sleep -Seconds 3600 }";
      return new String[] {
        "powershell.exe",
        "-NoProfile",
        "-NonInteractive",
        "-WindowStyle",
        "Hidden",
        "-Command",
        psScript
      };
    }
    return null;
  }

  static class DefaultProcessSpawner implements ProcessSpawner {
    @Override
    public Process spawn(String[] command) throws IOException {
      return new ProcessBuilder(command).start();
    }
  }
}
