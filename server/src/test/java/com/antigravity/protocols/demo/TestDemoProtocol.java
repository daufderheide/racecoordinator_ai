package com.antigravity.protocols.demo;

import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolListener;
import org.junit.Test;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.Assert.*;

public class TestDemoProtocol {

  @Test
  public void testStatusSchedulerCleanup() throws Exception {
    Demo demo = new Demo(2);

    final AtomicInteger statusUpdates = new AtomicInteger(0);

    ProtocolListener mockListener = new ProtocolListener() {
      @Override
      public void onLap(int lane, double lapTime, int interfaceId) {
      }

      @Override
      public void onSegment(int lane, double segmentTime, int interfaceId) {
      }

      @Override
      public void onCallbutton(int lane) {
      }

      @Override
      public void onCarData(CarData carData) {
      }

      @Override
      public void onInterfaceStatus(InterfaceStatus status) {
        if (status == InterfaceStatus.CONNECTED) {
          statusUpdates.incrementAndGet();
        }
      }
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
