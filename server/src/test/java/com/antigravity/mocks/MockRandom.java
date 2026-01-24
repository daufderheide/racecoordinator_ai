package com.antigravity.mocks;

import java.util.LinkedList;
import java.util.Queue;
import java.util.Random;

public class MockRandom extends Random {
  // Queue of return values for nextInt(bound) logic if needed,
  // or just a simple list of values to cycle through.
  // For this specific requirement (different times), we want to control the
  // output.

  private Queue<Integer> nextIntValues = new LinkedList<>();

  @Override
  public int nextInt(int bound) {
    if (!nextIntValues.isEmpty()) {
      return nextIntValues.poll();
    }
    return super.nextInt(bound);
  }

  public void addNextInt(int value) {
    nextIntValues.add(value);
  }
}
