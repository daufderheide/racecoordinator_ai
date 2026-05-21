package com.antigravity;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

public class AppTest {

  @Test
  public void shouldUseEmbeddedMongoByDefault() {
    boolean result = App.shouldUseEmbeddedMongo(new String[] {});
    assertTrue(result);
  }

  @Test
  public void shouldDisableEmbeddedMongoWhenArgumentIsPresent() {
    boolean result = App.shouldUseEmbeddedMongo(new String[] {"--no-embedded-mongo"});
    assertFalse(result);
  }
}
