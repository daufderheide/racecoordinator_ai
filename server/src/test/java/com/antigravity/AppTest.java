package com.antigravity;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class AppTest {

  @Test
  void shouldUseEmbeddedMongoByDefault() {
    boolean result = App.shouldUseEmbeddedMongo(new String[] {});
    assertTrue(result);
  }

  @Test
  void shouldDisableEmbeddedMongoWithArgument() {
    boolean result =
        App.shouldUseEmbeddedMongo(new String[] {"--no-embedded-mongo"});

    assertFalse(result);
  }
}