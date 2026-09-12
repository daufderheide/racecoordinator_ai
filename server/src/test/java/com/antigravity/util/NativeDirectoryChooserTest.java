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
}
