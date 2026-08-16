package com.antigravity.util;

import static org.junit.Assert.assertNotNull;

import org.junit.Test;

public class ConstructorCheckTest {

  @Test
  public void testConstructorCheckInstantiationAndMain() {
    ConstructorCheck checker = new ConstructorCheck();
    assertNotNull(checker);

    ConstructorCheck.main(new String[0]);
  }
}
