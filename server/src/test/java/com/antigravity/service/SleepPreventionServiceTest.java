package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class SleepPreventionServiceTest {

  private SleepPreventionService service;
  private SleepPreventionService.ProcessSpawner mockSpawner;
  private Process mockProcess;

  @Before
  public void setUp() {
    service = new SleepPreventionService();
    mockSpawner = mock(SleepPreventionService.ProcessSpawner.class);
    mockProcess = mock(Process.class);
    when(mockProcess.isAlive()).thenReturn(true);
    service.setProcessSpawner(mockSpawner);
  }

  @After
  public void tearDown() {
    service.releaseSleepLock();
  }

  @Test
  public void testBuildCommandLinux() {
    String[] cmd = SleepPreventionService.buildCommand("linux");
    assertNotNull(cmd);
    assertEquals("systemd-inhibit", cmd[0]);
    assertEquals("--what=idle:sleep", cmd[1]);
  }

  @Test
  public void testBuildCommandMac() {
    String[] cmd = SleepPreventionService.buildCommand("mac os x");
    assertNotNull(cmd);
    assertEquals("caffeinate", cmd[0]);
    assertEquals("-d", cmd[1]);
  }

  @Test
  public void testBuildCommandWindows() {
    String[] cmd = SleepPreventionService.buildCommand("windows 11");
    assertNotNull(cmd);
    assertEquals("powershell.exe", cmd[0]);
    assertTrue(cmd[6].contains("SetThreadExecutionState"));
  }

  @Test
  public void testBuildCommandUnknownOs() {
    String[] cmd = SleepPreventionService.buildCommand("solaris");
    assertNull(cmd);
  }

  @Test
  public void testAcquireAndReleaseSleepLock() throws Exception {
    when(mockSpawner.spawn(any())).thenReturn(mockProcess);

    boolean acquired = service.acquireSleepLock();
    assertTrue("Should successfully acquire sleep lock", acquired);
    assertTrue("Sleep lock should be active", service.isSleepLockActive());
    assertNotNull("Active platform should be recorded", service.getActivePlatform());

    // Second acquire should be no-op and return true
    boolean reacquired = service.acquireSleepLock();
    assertTrue(reacquired);
    verify(mockSpawner, times(1)).spawn(any());

    boolean released = service.releaseSleepLock();
    assertTrue("Should successfully release sleep lock", released);
    verify(mockProcess, times(1)).destroy();
    assertFalse("Sleep lock should no longer be active", service.isSleepLockActive());
    assertNull("Active platform should be cleared", service.getActivePlatform());
  }

  @Test
  public void testAcquireFailsGracefullyOnException() throws Exception {
    when(mockSpawner.spawn(any())).thenThrow(new IOException("Command not found"));

    boolean acquired = service.acquireSleepLock();
    assertFalse("Acquisition should fail gracefully", acquired);
    assertFalse(service.isSleepLockActive());
  }

  @Test
  public void testReleaseWhenInactiveReturnsFalse() {
    assertFalse(service.isSleepLockActive());
    boolean released = service.releaseSleepLock();
    assertFalse(released);
  }
}
