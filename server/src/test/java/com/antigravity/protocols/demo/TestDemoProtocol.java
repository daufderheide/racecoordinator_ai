package com.antigravity.protocols.demo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolListener;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.Test;

public class TestDemoProtocol {

  @Test
  public void testStatusSchedulerCleanup() throws Exception {
    Demo demo = new Demo(2, false);

    final AtomicInteger statusUpdates = new AtomicInteger(0);

    ProtocolListener mockListener =
        new ProtocolListener() {
          @Override
          public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {}

          @Override
          public void onSegment(
              int lane, double segmentTime, int interfaceId, int interfaceIndex) {}

          @Override
          public void onCallbutton(int lane, int interfaceIndex) {}

          @Override
          public void onCarData(CarData carData) {}

          @Override
          public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {
            if (status == InterfaceStatus.CONNECTED) {
              statusUpdates.incrementAndGet();
            }
          }

          @Override
          public void onInterfaceEvent(InterfaceEvent event) {}
        };

    demo.setListener(mockListener);

    // Open should start the scheduler
    demo.open();

    // Wait for at least one status update (scheduler runs immediately then every
    // 1s)
    // Give it up to 2 seconds
    long start = System.currentTimeMillis();
    while (statusUpdates.get() == 0 && (System.currentTimeMillis() - start) < 2000) {
      Thread.sleep(100);
    }

    assertTrue("Should have received at least one CONNECTED status", statusUpdates.get() > 0);

    // Close should stop the scheduler
    demo.close();

    // Wait a bit to ensure no more calls come in
    Thread.sleep(2000);

    // Let's reset the counter to be sure
    statusUpdates.set(0);

    Thread.sleep(2000);

    assertEquals("Should receive 0 updates after close (and grace period)", 0, statusUpdates.get());
  }
}
