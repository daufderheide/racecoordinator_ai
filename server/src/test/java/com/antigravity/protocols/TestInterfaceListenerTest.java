package com.antigravity.protocols;

import com.antigravity.proto.InterfaceEvent;
import org.junit.Test;

public class TestInterfaceListenerTest {

  @Test
  public void testCallbacksDoNotThrow() {
    TestInterfaceListener listener = new TestInterfaceListener();
    listener.onLap(0, 5.25, 1, 0);
    listener.onSegment(0, 2.10, 1, 0);
    listener.onCallbutton(0, 0);
    listener.onCarData(new CarData(0, 5.0, 1.0, 1.0, true, CarLocation.Main, CarLocation.Main, 0));
    listener.onInterfaceEvent(InterfaceEvent.newBuilder().build());
  }
}
