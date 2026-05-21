package com.antigravity;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class AppTest {

  @Test
  public void shouldUseEmbeddedMongoByDefault() {
    boolean result = App.shouldUseEmbeddedMongo(new String[] {});

    assertTrue(result);
  }

  @Test
  public void shouldDisableEmbeddedMongoWhenArgumentIsPresent() {
    boolean result =
        App.shouldUseEmbeddedMongo(new String[] {"--no-embedded-mongo"});

    assertFalse(result);
  }
}