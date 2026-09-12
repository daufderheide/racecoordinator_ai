package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.After;
import org.junit.Test;

public class NativeDirectoryChooserTest {

  @After
  public void tearDown() {
    NativeDirectoryChooser.setCommandRunner(null);
  }

  @Test
  public void testChooseDirectory_Success() {
    NativeDirectoryChooser.setCommandRunner((command, timeoutSeconds) -> "/Users/test/widgets\n");

    String result = NativeDirectoryChooser.chooseDirectory("Select Widgets");
    assertEquals("/Users/test/widgets", result);
  }

  @Test
  public void testChooseDirectory_CancelledThrowsException() {
    NativeDirectoryChooser.setCommandRunner(
        (command, timeoutSeconds) -> {
          throw new RuntimeException("User cancelled");
        });

    String result = NativeDirectoryChooser.chooseDirectory("Select Widgets");
    assertNull(result);
  }

  @Test
  public void testChooseDirectory_EmptyOutput() {
    NativeDirectoryChooser.setCommandRunner((command, timeoutSeconds) -> "   \n");

    String result = NativeDirectoryChooser.chooseDirectory("Select Widgets");
    assertNull(result);
  }

  @Test
  public void testBuildCommand_Mac() {
    String[] cmd = NativeDirectoryChooser.buildCommand("mac os x", "Choose \"Folder\"");
    assertEquals("osascript", cmd[0]);
    assertEquals("-e", cmd[1]);
    org.junit.Assert.assertTrue(cmd[2].contains("Choose Folder"));
  }

  @Test
  public void testBuildCommand_Windows() {
    String[] cmd = NativeDirectoryChooser.buildCommand("windows 11", "Pick 'Folder'");
    assertEquals("powershell.exe", cmd[0]);
    assertEquals("-NoProfile", cmd[1]);
    org.junit.Assert.assertTrue(cmd[cmd.length - 1].contains("Pick Folder"));
  }

  @Test
  public void testBuildCommand_Linux() {
    String[] cmd = NativeDirectoryChooser.buildCommand("linux", "Select Directory");
    assertEquals("zenity", cmd[0]);
    assertEquals("--file-selection", cmd[1]);
    assertEquals("--directory", cmd[2]);
    assertEquals("--title=Select Directory", cmd[3]);
  }

  @Test
  public void testBuildCommand_NullTitle() {
    String[] cmd = NativeDirectoryChooser.buildCommand("linux", null);
    assertEquals("--title=Select Folder", cmd[3]);
  }

  @Test
  public void testDefaultCommandRunner_FailureOrEcho() throws Exception {
    NativeDirectoryChooser.DefaultCommandRunner runner =
        new NativeDirectoryChooser.DefaultCommandRunner();
    String os = System.getProperty("os.name", "").toLowerCase();
    if (os.contains("mac") || os.contains("linux")) {
      String out = runner.runCommand(new String[] {"echo", "test_path"}, 5);
      assertEquals("test_path", out.trim());
    }
  }
}
