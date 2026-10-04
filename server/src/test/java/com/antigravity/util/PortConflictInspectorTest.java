package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.Test;

public class PortConflictInspectorTest {

  @After
  public void tearDown() {
    PortConflictInspector.setCommandRunner(null);
  }

  @Test
  public void testInspectWindows_ProcessFoundWithTasklistAndPowershell() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("netstat")) {
            return "  Proto  Local Address          Foreign Address        State           PID\n"
                + "  TCP    0.0.0.0:7070           0.0.0.0:0              LISTENING       4920\n";
          } else if (cmd.contains("tasklist")) {
            return "\"Openfire.exe\",\"4920\",\"Services\",\"0\",\"250,000 K\"\n";
          } else if (cmd.contains("powershell")) {
            return "C:\\Program Files\\Openfire\\bin\\Openfire.exe\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Windows 11");

    assertEquals(7070, report.getPort());
    assertEquals(PortConflictReport.ConflictType.PROCESS_IN_USE, report.getConflictType());
    assertEquals(Long.valueOf(4920L), report.getPid());
    assertEquals("Openfire.exe", report.getProcessName());
    assertEquals("C:\\Program Files\\Openfire\\bin\\Openfire.exe", report.getExecutablePath());
  }

  @Test
  public void testInspectWindows_ProcessFoundTasklistOnly_PowershellFails() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("netstat")) {
            return "  TCP    127.0.0.1:7070         0.0.0.0:0              LISTENING       5555\n";
          } else if (cmd.contains("tasklist")) {
            return "\"javaw.exe\",\"5555\",\"Console\",\"1\",\"45,120 K\"\n";
          } else if (cmd.contains("powershell")) {
            throw new RuntimeException("PowerShell unavailable");
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Windows Server");

    assertEquals(PortConflictReport.ConflictType.PROCESS_IN_USE, report.getConflictType());
    assertEquals(Long.valueOf(5555L), report.getPid());
    assertEquals("javaw.exe", report.getProcessName());
    assertNull(report.getExecutablePath());
  }

  @Test
  public void testInspectWindows_WinNATExcludedRangeIpv4() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("netstat")) {
            return "Active Connections\n";
          } else if (cmd.contains("ipv4") && cmd.contains("excludedportrange")) {
            return "Protocol tcp Port Exclusion Ranges\n\n"
                + "Start Port    End Port\n"
                + "----------    --------\n"
                + "      1026        1125\n"
                + "      7014        7113\n"
                + "     50000       50059     *\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Windows 10");

    assertEquals(7070, report.getPort());
    assertEquals(
        PortConflictReport.ConflictType.WINDOWS_EXCLUDED_PORT_RANGE, report.getConflictType());
    assertEquals("7014 - 7113", report.getPortRange());
    assertNull(report.getPid());
  }

  @Test
  public void testInspectWindows_WinNATExcludedRangeIpv6() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("netstat")) {
            return "";
          } else if (cmd.contains("ipv4")) {
            return "Start Port End Port\n 1000 2000\n";
          } else if (cmd.contains("ipv6")) {
            return "Start Port End Port\n 7050 7090\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Windows 11");

    assertEquals(
        PortConflictReport.ConflictType.WINDOWS_EXCLUDED_PORT_RANGE, report.getConflictType());
    assertEquals("7050 - 7090", report.getPortRange());
  }

  @Test
  public void testInspectWindows_UnknownWhenNoMatch() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("netstat")) {
            return "";
          } else if (cmd.contains("excludedportrange")) {
            return "Start Port End Port\n 1000 2000\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Windows 10");

    assertEquals(PortConflictReport.ConflictType.UNKNOWN, report.getConflictType());
  }

  @Test
  public void testInspectUnix_LsofFoundWithPs() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("lsof")) {
            return "COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n"
                + "java    51234 dave   88u  IPv6 0x123      0t0  TCP *:7070 (LISTEN)\n";
          } else if (cmd.contains("ps")) {
            return "/usr/bin/java\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Mac OS X");

    assertEquals(PortConflictReport.ConflictType.PROCESS_IN_USE, report.getConflictType());
    assertEquals(Long.valueOf(51234L), report.getPid());
    assertEquals("java", report.getProcessName());
    assertEquals("/usr/bin/java", report.getExecutablePath());
  }

  @Test
  public void testInspectUnix_LinuxSsFallback() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("lsof")) {
            return "";
          } else if (cmd.contains("ss")) {
            return "LISTEN 0 50 *:7070 *:* users:((\"myserver\",pid=65432,fd=10))\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Linux");

    assertEquals(PortConflictReport.ConflictType.PROCESS_IN_USE, report.getConflictType());
    assertEquals(Long.valueOf(65432L), report.getPid());
    assertEquals("myserver", report.getProcessName());
  }

  @Test
  public void testInspectUnix_UnknownWhenNoMatch() {
    PortConflictInspector.setCommandRunner((command, timeoutSeconds) -> "");

    PortConflictReport report = PortConflictInspector.inspect(7070, "Linux");

    assertEquals(PortConflictReport.ConflictType.UNKNOWN, report.getConflictType());
  }

  @Test
  public void testParseListeningPidFromNetstat_VariousFormats() {
    assertNull(PortConflictInspector.parseListeningPidFromNetstat(null, 7070));
    assertNull(PortConflictInspector.parseListeningPidFromNetstat("", 7070));

    // IPv4 0.0.0.0
    String out1 = "  TCP    0.0.0.0:7070           0.0.0.0:0              LISTENING       1234\n";
    assertEquals(
        Long.valueOf(1234L), PortConflictInspector.parseListeningPidFromNetstat(out1, 7070));

    // IPv4 127.0.0.1
    String out2 = "  TCP    127.0.0.1:7070         0.0.0.0:0              LISTENING       2345\n";
    assertEquals(
        Long.valueOf(2345L), PortConflictInspector.parseListeningPidFromNetstat(out2, 7070));

    // IPv6 [::]
    String out3 = "  TCP    [::]:7070              [::]:0                 LISTENING       3456\n";
    assertEquals(
        Long.valueOf(3456L), PortConflictInspector.parseListeningPidFromNetstat(out3, 7070));

    // Non-listening states should be ignored
    String outEstablished =
        "  TCP    0.0.0.0:7070           10.0.0.1:50000         ESTABLISHED     9999\n";
    assertNull(PortConflictInspector.parseListeningPidFromNetstat(outEstablished, 7070));

    // Substring port matching should NOT falsely match (e.g. port 70 vs 7070)
    String outPort7070 =
        "  TCP    0.0.0.0:7070           0.0.0.0:0              LISTENING       1234\n";
    assertNull(PortConflictInspector.parseListeningPidFromNetstat(outPort7070, 70));
  }

  @Test
  public void testParseProcessNameFromTasklist() {
    assertNull(PortConflictInspector.parseProcessNameFromTasklist(null));
    assertNull(PortConflictInspector.parseProcessNameFromTasklist(""));
    assertNull(PortConflictInspector.parseProcessNameFromTasklist("INFO: No tasks are running.\n"));

    String csv = "\"javaw.exe\",\"1234\",\"Console\",\"1\",\"45,120 K\"\n";
    assertEquals("javaw.exe", PortConflictInspector.parseProcessNameFromTasklist(csv));
  }

  @Test
  public void testParseExcludedPortRange() {
    assertNull(PortConflictInspector.parseExcludedPortRange(null, 7070));
    assertNull(PortConflictInspector.parseExcludedPortRange("", 7070));

    String table =
        "Start Port    End Port\n"
            + "----------    --------\n"
            + "      1026        1125\n"
            + "      7014        7113\n"
            + "     50000       50059     *\n";

    // Middle of range
    assertEquals("7014 - 7113", PortConflictInspector.parseExcludedPortRange(table, 7070));

    // Lower boundary
    assertEquals("7014 - 7113", PortConflictInspector.parseExcludedPortRange(table, 7014));

    // Upper boundary
    assertEquals("7014 - 7113", PortConflictInspector.parseExcludedPortRange(table, 7113));

    // Asterisk line
    assertEquals("50000 - 50059", PortConflictInspector.parseExcludedPortRange(table, 50020));

    // Outside range
    assertNull(PortConflictInspector.parseExcludedPortRange(table, 7013));
    assertNull(PortConflictInspector.parseExcludedPortRange(table, 7114));
  }

  @Test
  public void testParseLsofOutput() {
    assertNull(PortConflictInspector.parseLsofOutput(null));
    assertNull(PortConflictInspector.parseLsofOutput(""));

    String lsof =
        "COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n"
            + "java    51234 dave   88u  IPv6 0x123      0t0  TCP *:7070 (LISTEN)\n";
    PortConflictInspector.ParsedProcess proc = PortConflictInspector.parseLsofOutput(lsof);
    assertNotNull(proc);
    assertEquals(51234L, proc.pid);
    assertEquals("java", proc.processName);
  }

  @Test
  public void testParseSsOutput() {
    assertNull(PortConflictInspector.parseSsOutput(null));
    assertNull(PortConflictInspector.parseSsOutput(""));

    String ss = "LISTEN 0 50 *:7070 *:* users:((\"myproc\",pid=4321,fd=4))\n";
    PortConflictInspector.ParsedProcess proc = PortConflictInspector.parseSsOutput(ss);
    assertNotNull(proc);
    assertEquals(4321L, proc.pid);
    assertEquals("myproc", proc.processName);
  }

  @Test
  public void testInspectWindows_RaceCoordinatorAiServerDetected() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("netstat")) {
            return "  TCP    0.0.0.0:7070           0.0.0.0:0              LISTENING       1234\n";
          } else if (cmd.contains("tasklist")) {
            return "\"java.exe\",\"1234\",\"Console\",\"1\",\"250,000 K\"\n";
          } else if (cmd.contains("powershell")) {
            return "PATH=C:\\Program Files\\Java\\jdk-21\\bin\\java.exe\n"
                + "CMD=\"C:\\Program Files\\Java\\jdk-21\\bin\\java.exe\" -Dapp.data.dir=C:\\rc\\data -cp server.jar com.antigravity.App\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Windows 11");

    assertEquals(7070, report.getPort());
    assertEquals(PortConflictReport.ConflictType.PROCESS_IN_USE, report.getConflictType());
    assertEquals(Long.valueOf(1234L), report.getPid());
    assertEquals("java.exe", report.getProcessName());
    assertEquals("C:\\Program Files\\Java\\jdk-21\\bin\\java.exe", report.getExecutablePath());
    assertEquals(
        "Race Coordinator AI Server (another instance is already running)",
        report.getApplicationName());
    assertTrue(report.getCommandLine().contains("com.antigravity.App"));
    assertTrue(report.toDialogMessage().contains("Race Coordinator AI Server"));
    assertTrue(report.toDialogMessage().contains("Another instance of Race Coordinator AI"));
  }

  @Test
  public void testInspectWindows_JavaJarDetected() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("netstat")) {
            return "  TCP    0.0.0.0:7070           0.0.0.0:0              LISTENING       4321\n";
          } else if (cmd.contains("tasklist")) {
            return "\"javaw.exe\",\"4321\",\"Console\",\"1\",\"80,000 K\"\n";
          } else if (cmd.contains("powershell")) {
            return "PATH=C:\\Java\\javaw.exe\nCMD=javaw -jar \"C:\\apps\\custom_app.jar\"\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Windows 10");

    assertEquals("Java Application (custom_app.jar)", report.getApplicationName());
    assertEquals("C:\\Java\\javaw.exe", report.getExecutablePath());
    assertEquals("javaw -jar \"C:\\apps\\custom_app.jar\"", report.getCommandLine());
  }

  @Test
  public void testInspectUnix_RaceCoordinatorAiServerDetected() {
    PortConflictInspector.setCommandRunner(
        (command, timeoutSeconds) -> {
          String cmd = String.join(" ", command);
          if (cmd.contains("lsof")) {
            return "COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n"
                + "java    9876 dave   88u  IPv6 0x123      0t0  TCP *:7070 (LISTEN)\n";
          } else if (cmd.contains("command=")) {
            return "java -Dapp.data.dir=/Users/dave/rc/data -cp server.jar com.antigravity.App\n";
          } else if (cmd.contains("comm=")) {
            return "/Library/Java/JavaVirtualMachines/jdk-21/Contents/Home/bin/java\n";
          }
          return null;
        });

    PortConflictReport report = PortConflictInspector.inspect(7070, "Mac OS X");

    assertEquals(7070, report.getPort());
    assertEquals(Long.valueOf(9876L), report.getPid());
    assertEquals("java", report.getProcessName());
    assertEquals(
        "Race Coordinator AI Server (another instance is already running)",
        report.getApplicationName());
    assertEquals(
        "/Library/Java/JavaVirtualMachines/jdk-21/Contents/Home/bin/java",
        report.getExecutablePath());
    assertTrue(report.getCommandLine().contains("com.antigravity.App"));
  }

  @Test
  public void testResolveApplicationName_VariousScenarios() {
    assertEquals(
        "Race Coordinator AI Server (another instance is already running)",
        PortConflictInspector.resolveApplicationName(
            "java.exe", "java -cp target_dist/classes com.antigravity.App"));

    assertEquals(
        "Race Coordinator AI Client (Angular dev server)",
        PortConflictInspector.resolveApplicationName(
            "node.exe", "node C:\\racecoordinator_ai\\client\\node_modules\\.bin\\ng.js serve"));

    assertEquals(
        "Angular Dev Server",
        PortConflictInspector.resolveApplicationName(
            "node", "node /usr/local/bin/ng serve --port 4200"));

    assertEquals(
        "Java Application (minecraft.jar)",
        PortConflictInspector.resolveApplicationName(
            "java", "java -Xmx2G -jar /opt/minecraft/minecraft.jar nogui"));

    assertEquals(
        "Java Application",
        PortConflictInspector.resolveApplicationName("javaw.exe", "javaw -Xms512M"));

    assertEquals(
        "Node.js Application",
        PortConflictInspector.resolveApplicationName("node", "node server.js"));

    assertNull(
        PortConflictInspector.resolveApplicationName(
            "Openfire.exe", "C:\\Openfire\\bin\\openfire.exe"));
  }

  @Test
  public void testParseWindowsProcessDetails_Formats() {
    PortConflictInspector.ProcessDetails d1 =
        PortConflictInspector.parseWindowsProcessDetails(
            "PATH=C:\\Java\\bin\\java.exe\nCMD=java -jar test.jar\n");
    assertEquals("C:\\Java\\bin\\java.exe", d1.path);
    assertEquals("java -jar test.jar", d1.commandLine);

    PortConflictInspector.ProcessDetails d2 =
        PortConflictInspector.parseWindowsProcessDetails("C:\\Simple\\Path.exe\n");
    assertEquals("C:\\Simple\\Path.exe", d2.path);
    assertNull(d2.commandLine);

    PortConflictInspector.ProcessDetails d3 =
        PortConflictInspector.parseWindowsProcessDetails(null);
    assertNull(d3.path);
    assertNull(d3.commandLine);
  }

  @Test
  public void testDefaultCommandRunner_ExecutesHostCommand() throws Exception {
    PortConflictInspector.DefaultCommandRunner runner =
        new PortConflictInspector.DefaultCommandRunner();
    String out = runner.runCommand(new String[] {"echo", "test_port_inspector"}, 5);
    assertNotNull(out);
    assertTrue(out.contains("test_port_inspector"));
  }

  @Test
  public void testInspect_LiveInvocationDoesNotThrow() {
    PortConflictReport report = PortConflictInspector.inspect(65431);
    assertNotNull(report);
    assertEquals(65431, report.getPort());
  }
}
