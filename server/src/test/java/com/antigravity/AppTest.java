package com.antigravity;

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
}
