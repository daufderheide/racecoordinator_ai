package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class PortConflictReportTest {

  @Test
  public void testForProcess_WithAllFields() {
    PortConflictReport report =
        PortConflictReport.forProcess(
            7070, 1234L, "Openfire.exe", "C:\\Program Files\\Openfire\\bin\\Openfire.exe");

    assertEquals(7070, report.getPort());
    assertEquals(PortConflictReport.ConflictType.PROCESS_IN_USE, report.getConflictType());
    assertEquals(Long.valueOf(1234L), report.getPid());
    assertEquals("Openfire.exe", report.getProcessName());
    assertEquals("C:\\Program Files\\Openfire\\bin\\Openfire.exe", report.getExecutablePath());
    assertNull(report.getPortRange());

    String diag = report.toDiagnosticString();
    assertTrue(diag.contains("Target Port : 7070"));
    assertTrue(diag.contains("Status      : PROCESS_IN_USE"));
    assertTrue(diag.contains("Process Name: Openfire.exe"));
    assertTrue(diag.contains("PID         : 1234"));
    assertTrue(diag.contains("Path        : C:\\Program Files\\Openfire\\bin\\Openfire.exe"));

    String dialog = report.toDialogMessage();
    assertTrue(dialog.contains("Failed to start Web Server on port 7070."));
    assertTrue(dialog.contains("Process: Openfire.exe (PID: 1234)"));
    assertTrue(dialog.contains("Path: C:\\Program Files\\Openfire\\bin\\Openfire.exe"));
    assertTrue(dialog.contains("1. Close or terminate the conflicting application (PID: 1234)."));
    assertTrue(dialog.contains("2. Or start with '--port <port>'"));
  }

  @Test
  public void testForProcess_WithoutPathOrPid() {
    PortConflictReport report = PortConflictReport.forProcess(7070, null, "javaw.exe", null);

    assertNull(report.getPid());
    assertEquals("javaw.exe", report.getProcessName());
    assertNull(report.getExecutablePath());

    String diag = report.toDiagnosticString();
    assertTrue(diag.contains("Process Name: javaw.exe"));

    String dialog = report.toDialogMessage();
    assertTrue(dialog.contains("Process: javaw.exe"));
    assertTrue(dialog.contains("1. Close or terminate the conflicting application."));
  }

  @Test
  public void testForProcess_WithPidOnly() {
    PortConflictReport report = PortConflictReport.forProcess(7070, 9999L, null, null);

    assertEquals(Long.valueOf(9999L), report.getPid());
    assertNull(report.getProcessName());

    String dialog = report.toDialogMessage();
    assertTrue(dialog.contains("PID: 9999"));
    assertTrue(dialog.contains("1. Close or terminate the conflicting application (PID: 9999)."));
  }

  @Test
  public void testForExcludedRange() {
    PortConflictReport report = PortConflictReport.forExcludedRange(7070, "7014 - 7113");

    assertEquals(7070, report.getPort());
    assertEquals(
        PortConflictReport.ConflictType.WINDOWS_EXCLUDED_PORT_RANGE, report.getConflictType());
    assertNull(report.getPid());
    assertNull(report.getProcessName());
    assertEquals("7014 - 7113", report.getPortRange());

    String diag = report.toDiagnosticString();
    assertTrue(diag.contains("Target Port : 7070"));
    assertTrue(diag.contains("Status      : WINDOWS_EXCLUDED_PORT_RANGE"));
    assertTrue(diag.contains("Exclusion   : 7014 - 7113 (WinNAT / Hyper-V / WSL2)"));

    String dialog = report.toDialogMessage();
    assertTrue(dialog.contains("falls within a Windows excluded port range (7014 - 7113)"));
    assertTrue(dialog.contains("WinNAT / Hyper-V / WSL2"));
    assertTrue(dialog.contains("net stop winnat"));
    assertTrue(dialog.contains("net start winnat"));
    assertTrue(dialog.contains("restart your computer"));
  }

  @Test
  public void testForExcludedRange_NullRange() {
    PortConflictReport report = PortConflictReport.forExcludedRange(7070, null);
    assertNull(report.getPortRange());

    String dialog = report.toDialogMessage();
    assertTrue(dialog.contains("falls within a Windows excluded port range."));
    assertTrue(dialog.contains("net stop winnat"));
  }

  @Test
  public void testForUnknown() {
    PortConflictReport report = PortConflictReport.forUnknown(8080);

    assertEquals(8080, report.getPort());
    assertEquals(PortConflictReport.ConflictType.UNKNOWN, report.getConflictType());
    assertNull(report.getPid());
    assertNull(report.getProcessName());
    assertNull(report.getExecutablePath());
    assertNull(report.getPortRange());

    String diag = report.toDiagnosticString();
    assertTrue(diag.contains("Target Port : 8080"));
    assertTrue(diag.contains("Status      : UNKNOWN"));

    String dialog = report.toDialogMessage();
    assertTrue(dialog.contains("Failed to start Web Server on port 8080."));
    assertTrue(dialog.contains("Port is already in use or unavailable."));
    assertTrue(dialog.contains("1. Terminate the process using port 8080"));
  }

  @Test
  public void testForProcess_WithApplicationNameAndCommandLine() {
    PortConflictReport report =
        PortConflictReport.forProcess(
            7070,
            5555L,
            "java.exe",
            "C:\\Java\\bin\\java.exe",
            "java -jar server.jar",
            "Race Coordinator AI Server (another instance is already running)");

    assertEquals(
        "Race Coordinator AI Server (another instance is already running)",
        report.getApplicationName());
    assertEquals("java -jar server.jar", report.getCommandLine());

    String diag = report.toDiagnosticString();
    assertTrue(diag.contains("Application : Race Coordinator AI Server"));
    assertTrue(diag.contains("Command Line: java -jar server.jar"));

    String dialog = report.toDialogMessage();
    assertTrue(dialog.contains("Application: Race Coordinator AI Server"));
    assertTrue(dialog.contains("Command: java -jar server.jar"));
    assertTrue(
        dialog.contains("Another instance of Race Coordinator AI appears to already be running."));
  }

  @Test
  public void testForProcess_TruncatesLongCommandLineInDialog() {
    String longCmd =
        "java -cp very/long/path/with/lots/of/libraries/"
            + "library1.jar:library2.jar:library3.jar:library4.jar:library5.jar:library6.jar:"
            + "library7.jar:library8.jar:library9.jar:library10.jar:library11.jar com.antigravity.App";
    PortConflictReport report =
        PortConflictReport.forProcess(
            7070, 1111L, "java", "/usr/bin/java", longCmd, "Race Coordinator AI Server");

    String dialog = report.toDialogMessage();
    assertTrue(dialog.contains("..."));
    assertTrue(report.toDiagnosticString().contains(longCmd));
  }
}
