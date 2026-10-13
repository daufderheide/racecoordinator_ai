package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class AppInstanceCoordinatorTest {

  private AppInstanceCoordinator.InstanceActionPrompter originalPrompter;
  private AppInstanceCoordinator.InstanceStopper originalStopper;
  private AppInstanceCoordinator.BrowserLauncher originalBrowserLauncher;

  @Before
  public void setUp() {
    originalPrompter = null;
    originalStopper = null;
    originalBrowserLauncher = null;
    AppInstanceCoordinator.setErrorNotifier((msg, title) -> {});
    AppInstanceCoordinator.setBrowserLauncher(url -> {});
    AppInstanceCoordinator.setExitHandler(status -> {});
    AppInstanceCoordinator.setStatusQuerier(null);
    AppInstanceCoordinator.setPrompter(null);
    AppInstanceCoordinator.setStopper(null);
  }

  @After
  public void tearDown() {
    AppInstanceCoordinator.setPrompter(null);
    AppInstanceCoordinator.setStopper(null);
    AppInstanceCoordinator.setBrowserLauncher(null);
    AppInstanceCoordinator.setErrorNotifier(null);
    AppInstanceCoordinator.setExitHandler(null);
    AppInstanceCoordinator.setStatusQuerier(null);
  }

  private int findFreePort() throws Exception {
    try (ServerSocket ss = new ServerSocket(0)) {
      return ss.getLocalPort();
    }
  }

  @Test
  public void testIsRaceCoordinatorRunningTrue() throws Exception {
    int port = findFreePort();
    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
    server.createContext(
        "/api/version",
        exchange -> {
          byte[] response = "1.0.1".getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(200, response.length);
          try (OutputStream os = exchange.getResponseBody()) {
            os.write(response);
          }
        });
    server.start();

    try {
      boolean isRunning = AppInstanceCoordinator.isRaceCoordinatorRunning(port);
      assertTrue("Should detect Race Coordinator AI is running", isRunning);
    } finally {
      server.stop(0);
    }
  }

  @Test
  public void testIsRaceCoordinatorRunningFalseWhenOffline() throws Exception {
    int port = findFreePort();
    boolean isRunning = AppInstanceCoordinator.isRaceCoordinatorRunning(port);
    assertFalse("Should return false when port is offline", isRunning);
  }

  @Test
  public void testIsRaceCoordinatorRunningFalseWhenNon200() throws Exception {
    int port = findFreePort();
    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
    server.createContext(
        "/api/version",
        exchange -> {
          exchange.sendResponseHeaders(404, 0);
          exchange.close();
        });
    server.start();

    try {
      boolean isRunning = AppInstanceCoordinator.isRaceCoordinatorRunning(port);
      assertFalse("Should return false when endpoint returns 404", isRunning);
    } finally {
      server.stop(0);
    }
  }

  @Test
  public void testIsPortAvailable() throws Exception {
    int port = findFreePort();
    assertTrue("Unused port should be available", AppInstanceCoordinator.isPortAvailable(port));

    try (ServerSocket ss = new ServerSocket(port)) {
      assertFalse(
          "Occupied port should not be available", AppInstanceCoordinator.isPortAvailable(port));
    }
  }

  @Test
  public void testQueryServerStatusWithStatusEndpoint() throws Exception {
    int port = findFreePort();
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
    server.createContext(
        "/api/server/status",
        exchange -> {
          byte[] response =
              "{\"version\":\"1.0.1\",\"activeClients\":3,\"pendingShutdown\":false}"
                  .getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(200, response.length);
          try (OutputStream os = exchange.getResponseBody()) {
            os.write(response);
          }
          exchange.close();
        });
    server.start();

    try {
      AppInstanceCoordinator.ServerStatus status =
          AppInstanceCoordinator.defaultQueryServerStatus(port);
      assertTrue("Should be reachable", status.isReachable());
      assertEquals("1.0.1", status.getVersion());
      assertEquals(3, status.getActiveClients());
      assertFalse(status.isPendingShutdown());
    } finally {
      server.stop(0);
    }
  }

  @Test
  public void testQueryServerStatusFallbackToVersionEndpoint() throws Exception {
    int port = findFreePort();
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
    server.createContext(
        "/api/version",
        exchange -> {
          byte[] response = "1.0.1".getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(200, response.length);
          try (OutputStream os = exchange.getResponseBody()) {
            os.write(response);
          }
          exchange.close();
        });
    server.start();

    try {
      AppInstanceCoordinator.ServerStatus status =
          AppInstanceCoordinator.defaultQueryServerStatus(port);
      assertTrue("Should be reachable via fallback", status.isReachable());
      assertEquals("unknown", status.getVersion());
      assertEquals(1, status.getActiveClients());
      assertFalse(status.isPendingShutdown());
    } finally {
      server.stop(0);
    }
  }

  @Test
  public void testQueryServerStatusOffline() throws Exception {
    int port = findFreePort();
    AppInstanceCoordinator.ServerStatus status =
        AppInstanceCoordinator.defaultQueryServerStatus(port);
    assertFalse("Offline port should not be reachable", status.isReachable());
    assertEquals(0, status.getActiveClients());
    assertFalse(status.isPendingShutdown());
  }

  @Test
  public void testHandleAlreadyRunningPortOfflineWhenQueried() {
    AtomicBoolean restarted = new AtomicBoolean(false);
    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(false, null, 0, false));

    AppInstanceCoordinator.handleAlreadyRunning(7070, false, () -> restarted.set(true));
    assertTrue("Should restart if server went offline before query", restarted.get());
  }

  @Test
  public void testHandleAlreadyRunningLayer1ZeroClientsTakeover() {
    AtomicBoolean restarted = new AtomicBoolean(false);
    AtomicBoolean stopperCalled = new AtomicBoolean(false);
    AtomicBoolean prompterCalled = new AtomicBoolean(false);

    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 0, false));
    AppInstanceCoordinator.setStopper(
        port -> {
          stopperCalled.set(true);
          return true;
        });
    AppInstanceCoordinator.setPrompter(
        port -> {
          prompterCalled.set(true);
          return AppInstanceCoordinator.ACTION_EXIT;
        });

    AppInstanceCoordinator.handleAlreadyRunning(7070, false, () -> restarted.set(true));
    assertTrue("Stopper should be called to vacate port", stopperCalled.get());
    assertTrue("Should restart immediately when activeClients <= 0", restarted.get());
    assertFalse("Prompter should not be called when activeClients <= 0", prompterCalled.get());
  }

  @Test
  public void testHandleAlreadyRunningLayer1PendingShutdownTakeover() {
    AtomicBoolean restarted = new AtomicBoolean(false);
    AtomicBoolean stopperCalled = new AtomicBoolean(false);
    AtomicBoolean prompterCalled = new AtomicBoolean(false);

    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 2, true));
    AppInstanceCoordinator.setStopper(
        port -> {
          stopperCalled.set(true);
          return true;
        });
    AppInstanceCoordinator.setPrompter(
        port -> {
          prompterCalled.set(true);
          return AppInstanceCoordinator.ACTION_EXIT;
        });

    AppInstanceCoordinator.handleAlreadyRunning(7070, false, () -> restarted.set(true));
    assertTrue("Stopper should be called to vacate port", stopperCalled.get());
    assertTrue("Should restart immediately when pendingShutdown is true", restarted.get());
    assertFalse("Prompter should not be called when pendingShutdown is true", prompterCalled.get());
  }

  @Test
  public void testHandleAlreadyRunningLayer2AutoDismissTakeOver() {
    AtomicBoolean restarted = new AtomicBoolean(false);
    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 1, false));
    AppInstanceCoordinator.setPrompter(port -> AppInstanceCoordinator.ACTION_TAKE_OVER);

    AppInstanceCoordinator.handleAlreadyRunning(7070, false, () -> restarted.set(true));
    assertTrue("Should take over and restart when auto-dismissed", restarted.get());
  }

  @Test
  public void testHandleAlreadyRunningLayer3OpenBrowserWhenExistingStopped() {
    AtomicBoolean restarted = new AtomicBoolean(false);
    AtomicReference<String> launchedUrl = new AtomicReference<>();
    AtomicInteger exitCode = new AtomicInteger(-1);

    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 1, false));
    AppInstanceCoordinator.setPrompter(port -> AppInstanceCoordinator.ACTION_OPEN_BROWSER);
    AppInstanceCoordinator.setBrowserLauncher(launchedUrl::set);
    AppInstanceCoordinator.setExitHandler(exitCode::set);

    AppInstanceCoordinator.handleAlreadyRunning(7070, false, () -> restarted.set(true));
    assertTrue(
        "Should start this instance when old instance stopped during prompt", restarted.get());
    assertEquals("Should not launch browser when old instance died", null, launchedUrl.get());
    assertEquals("Should not exit when taking over", -1, exitCode.get());
  }

  @Test
  public void testHandleAlreadyRunningLayer3OpenBrowserWhenExistingAlive() throws Exception {
    int port = findFreePort();
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
    server.createContext(
        "/api/version",
        exchange -> {
          byte[] response = "1.0.1".getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(200, response.length);
          try (OutputStream os = exchange.getResponseBody()) {
            os.write(response);
          }
          exchange.close();
        });
    server.start();

    try {
      AtomicBoolean restarted = new AtomicBoolean(false);
      AtomicReference<String> launchedUrl = new AtomicReference<>();
      AtomicInteger exitCode = new AtomicInteger(-1);

      AppInstanceCoordinator.setStatusQuerier(
          p -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 1, false));
      AppInstanceCoordinator.setPrompter(p -> AppInstanceCoordinator.ACTION_OPEN_BROWSER);
      AppInstanceCoordinator.setBrowserLauncher(launchedUrl::set);
      AppInstanceCoordinator.setExitHandler(exitCode::set);

      AppInstanceCoordinator.handleAlreadyRunning(port, false, () -> restarted.set(true));
      assertFalse(
          "Should not restart when user opted to open browser of live instance", restarted.get());
      assertEquals("http://localhost:" + port, launchedUrl.get());
      assertEquals("Should exit with 0 after opening browser", 0, exitCode.get());
    } finally {
      server.stop(0);
    }
  }

  @Test
  public void testHandleAlreadyRunningRestartSuccess() {
    AtomicBoolean restarted = new AtomicBoolean(false);
    AtomicInteger exitCode = new AtomicInteger(-1);
    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 1, false));
    AppInstanceCoordinator.setPrompter(port -> AppInstanceCoordinator.ACTION_RESTART);
    AppInstanceCoordinator.setStopper(port -> true);
    AppInstanceCoordinator.setExitHandler(exitCode::set);

    AppInstanceCoordinator.handleAlreadyRunning(7070, false, () -> restarted.set(true));
    assertTrue("Restart callback should be called", restarted.get());
    assertEquals("Should not exit on successful restart", -1, exitCode.get());
  }

  @Test
  public void testHandleAlreadyRunningRestartFailure() {
    AtomicBoolean restarted = new AtomicBoolean(false);
    AtomicInteger exitCode = new AtomicInteger(-1);
    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 1, false));
    AppInstanceCoordinator.setPrompter(port -> AppInstanceCoordinator.ACTION_RESTART);
    AppInstanceCoordinator.setStopper(port -> false);
    AppInstanceCoordinator.setExitHandler(exitCode::set);

    AppInstanceCoordinator.handleAlreadyRunning(7070, false, () -> restarted.set(true));
    assertFalse("Restart callback should not be called", restarted.get());
    assertEquals("Should exit with code 1 on failed restart", 1, exitCode.get());
  }

  @Test
  public void testHandleAlreadyRunningExit() {
    AtomicInteger exitCode = new AtomicInteger(-1);
    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 1, false));
    AppInstanceCoordinator.setPrompter(port -> AppInstanceCoordinator.ACTION_EXIT);
    AppInstanceCoordinator.setExitHandler(exitCode::set);

    AppInstanceCoordinator.handleAlreadyRunning(7070, false, () -> {});
    assertEquals("Should exit with code 0 on user exit", 0, exitCode.get());
  }

  @Test
  public void testHandleAlreadyRunningHeadless() {
    AtomicInteger exitCode = new AtomicInteger(-1);
    AppInstanceCoordinator.setStatusQuerier(
        port -> new AppInstanceCoordinator.ServerStatus(true, "1.0.1", 1, false));
    AppInstanceCoordinator.setExitHandler(exitCode::set);

    AppInstanceCoordinator.handleAlreadyRunning(7070, true, () -> {});
    assertEquals("Headless should exit with code 0", 0, exitCode.get());
  }

  @Test
  public void testActionPrompterConstants() {
    assertEquals(0, AppInstanceCoordinator.ACTION_OPEN_BROWSER);
    assertEquals(1, AppInstanceCoordinator.ACTION_RESTART);
    assertEquals(2, AppInstanceCoordinator.ACTION_EXIT);
    assertEquals(3, AppInstanceCoordinator.ACTION_TAKE_OVER);
  }

  @Test
  public void testDefaultInstanceStopperWithShutdownEndpoint() throws Exception {
    int port = findFreePort();
    AtomicBoolean shutdownCalled = new AtomicBoolean(false);
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
    server.createContext(
        "/api/server/shutdown",
        exchange -> {
          shutdownCalled.set(true);
          byte[] response = "Shutting down".getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(200, response.length);
          try (OutputStream os = exchange.getResponseBody()) {
            os.write(response);
          }
          exchange.close();
          new Thread(() -> server.stop(0)).start();
        });
    server.start();

    try {
      AppInstanceCoordinator.DefaultInstanceStopper stopper =
          new AppInstanceCoordinator.DefaultInstanceStopper();
      boolean stopped = stopper.stopInstance(port);
      assertTrue("Stopper should report instance was stopped", stopped);
      assertTrue("Shutdown endpoint should have been called", shutdownCalled.get());
    } finally {
      server.stop(0);
    }
  }
}
