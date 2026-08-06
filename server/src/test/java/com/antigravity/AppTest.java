package com.antigravity;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class AppTest {
  @Test
  public void testApp() {
    try {
      Class<?> clazz = Class.forName("com.antigravity.service.DriverStatisticsTest");
      System.out.println(
          "CLASS LOADED FROM: " + clazz.getProtectionDomain().getCodeSource().getLocation());
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  @Test
  public void testParseServerPortDefault() {
    int port = App.parseServerPort(new String[0]);
    assertEquals(7070, port);
  }

  @Test
  public void testParseServerPortArgs() {
    assertEquals(9090, App.parseServerPort(new String[] {"--port", "9090"}));
    assertEquals(9091, App.parseServerPort(new String[] {"-p", "9091"}));
    assertEquals(9092, App.parseServerPort(new String[] {"--port=9092"}));
  }

  @Test
  public void testParseMongoPortDefault() {
    int port = App.parseMongoPort(new String[0]);
    assertEquals(8085, port);
  }

  @Test
  public void testParseMongoPortArgs() {
    assertEquals(8888, App.parseMongoPort(new String[] {"--mongo-port", "8888"}));
    assertEquals(8889, App.parseMongoPort(new String[] {"--mongo-port=8889"}));
  }
}
