package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.javalin.Javalin;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class CameraTunnelServiceTest {

  private CameraTunnelService.ProcessRunner mockRunner;
  private Process mockProcess;

  @Before
  public void setUp() {
    mockRunner = mock(CameraTunnelService.ProcessRunner.class);
    mockProcess = mock(Process.class);
  }

  @After
  public void tearDown() {
    CameraTunnelService.setInstance(null);
  }

  @Test
  public void testInitialStatus() {
    CameraTunnelService service = new CameraTunnelService(mockRunner);
    CameraTunnelService.TunnelStatus status = service.getStatus();
    assertNotNull(status);
    assertFalse(status.active);
    assertNull(status.url);
    assertEquals("none", status.provider);
  }

  @Test
  public void testStartTunnelWithCloudflared() throws Exception {
    when(mockRunner.findExecutable("cloudflared")).thenReturn("/usr/local/bin/cloudflared");
    InputStream stream =
        new ByteArrayInputStream(
            "2026-09-25 INF Generated quick tunnel https://test-tunnel.trycloudflare.com\n"
                .getBytes(StandardCharsets.UTF_8));
    when(mockProcess.getInputStream()).thenReturn(stream);
    when(mockProcess.isAlive()).thenReturn(true);
    when(mockRunner.startProcess(any())).thenReturn(mockProcess);

    CameraTunnelService service = new CameraTunnelService(mockRunner);
    CameraTunnelService.TunnelStatus status = service.startTunnel(8080);

    assertTrue(status.active);
    assertEquals("https://test-tunnel.trycloudflare.com", status.url);
    assertEquals("cloudflared", status.provider);
    assertEquals(8080, status.port);

    // Call start again on same port should return existing active status
    CameraTunnelService.TunnelStatus secondStatus = service.startTunnel(8080);
    assertTrue(secondStatus.active);
    assertEquals("https://test-tunnel.trycloudflare.com", secondStatus.url);
  }

  @Test
  public void testStartTunnelWithNpxCloudflared() throws Exception {
    when(mockRunner.findExecutable("cloudflared")).thenReturn(null);
    when(mockRunner.findExecutable("npx")).thenReturn("/opt/homebrew/bin/npx");
    InputStream stream =
        new ByteArrayInputStream(
            "| https://track-cam-123.trycloudflare.com |\n".getBytes(StandardCharsets.UTF_8));
    when(mockProcess.getInputStream()).thenReturn(stream);
    when(mockProcess.isAlive()).thenReturn(true);
    when(mockRunner.startProcess(any())).thenReturn(mockProcess);

    CameraTunnelService service = new CameraTunnelService(mockRunner);
    CameraTunnelService.TunnelStatus status = service.startTunnel(7070);

    assertTrue(status.active);
    assertEquals("https://track-cam-123.trycloudflare.com", status.url);
    assertEquals("cloudflared", status.provider);
  }

  @Test
  public void testStartTunnelWithSsh() throws Exception {
    when(mockRunner.findExecutable("cloudflared")).thenReturn(null);
    when(mockRunner.findExecutable("npx")).thenReturn(null);
    when(mockRunner.findExecutable("ssh")).thenReturn("/usr/bin/ssh");
    InputStream stream =
        new ByteArrayInputStream(
            "Connecting... https://race-coord.lhr.life is ready\n"
                .getBytes(StandardCharsets.UTF_8));
    when(mockProcess.getInputStream()).thenReturn(stream);
    when(mockProcess.isAlive()).thenReturn(true);
    when(mockRunner.startProcess(any())).thenReturn(mockProcess);

    CameraTunnelService service = new CameraTunnelService(mockRunner);
    CameraTunnelService.TunnelStatus status = service.startTunnel(7070);

    assertTrue(status.active);
    assertEquals("https://race-coord.lhr.life", status.url);
    assertEquals("ssh", status.provider);
  }

  @Test
  public void testStartTunnelNoExecutablesAvailable() {
    when(mockRunner.findExecutable("cloudflared")).thenReturn(null);
    when(mockRunner.findExecutable("npx")).thenReturn(null);
    when(mockRunner.findExecutable("ssh")).thenReturn(null);

    CameraTunnelService service = new CameraTunnelService(mockRunner);
    CameraTunnelService.TunnelStatus status = service.startTunnel(7070);

    assertFalse(status.active);
    assertNull(status.url);
    assertEquals("none", status.provider);
    assertNotNull(status.error);
  }

  @Test
  public void testStopTunnel() throws Exception {
    when(mockRunner.findExecutable("cloudflared")).thenReturn("/usr/local/bin/cloudflared");
    InputStream stream =
        new ByteArrayInputStream(
            "Tunnel https://test.trycloudflare.com\n".getBytes(StandardCharsets.UTF_8));
    when(mockProcess.getInputStream()).thenReturn(stream);
    when(mockProcess.isAlive()).thenReturn(true);
    when(mockRunner.startProcess(any())).thenReturn(mockProcess);

    CameraTunnelService service = new CameraTunnelService(mockRunner);
    service.startTunnel(8080);
    assertTrue(service.getStatus().active);

    CameraTunnelService.TunnelStatus stoppedStatus = service.stopTunnel();
    assertFalse(stoppedStatus.active);
    assertNull(stoppedStatus.url);
    verify(mockProcess).destroyForcibly();
  }

  @Test
  public void testRegisterRoutes() {
    Javalin app = mock(Javalin.class);
    CameraTunnelService service = new CameraTunnelService(mockRunner);
    CameraTunnelService.registerRoutes(app, service);

    verify(app).get(org.mockito.ArgumentMatchers.eq("/api/camera-tunnel/status"), any());
    verify(app).post(org.mockito.ArgumentMatchers.eq("/api/camera-tunnel/start"), any());
    verify(app).post(org.mockito.ArgumentMatchers.eq("/api/camera-tunnel/stop"), any());
  }

  @Test
  public void testLocateExecutable() {
    String shPath = CameraTunnelService.locateExecutable("sh");
    if (!System.getProperty("os.name", "").toLowerCase().contains("win")) {
      assertNotNull(shPath);
    }
  }

  @Test
  public void testSingletonInstance() {
    CameraTunnelService instance1 = CameraTunnelService.getInstance();
    CameraTunnelService instance2 = CameraTunnelService.getInstance();
    assertEquals(instance1, instance2);
  }
}
