package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Lane;
import com.antigravity.proto.LaneModel;
import java.util.HashSet;
import java.util.Set;
import org.junit.Test;

public class LaneConverterTest {

  @Test
  public void testToProto_FirstTimeSent() {
    Lane lane = new Lane("#000000", "#ff0000", 45);
    Set<String> sentObjectIds = new HashSet<>();

    LaneModel proto = LaneConverter.toProto(lane, sentObjectIds);

    assertNotNull(proto);
    assertEquals(lane.getObjectId(), proto.getObjectId());
    assertEquals("#ff0000", proto.getForegroundColor());
    assertEquals("#000000", proto.getBackgroundColor());
    assertEquals(45.0, proto.getLength(), 0.001);
    assertTrue(sentObjectIds.contains("Lane_" + lane.getObjectId()));
  }

  @Test
  public void testToProto_AlreadySent() {
    Lane lane = new Lane("#00ff00", "#ffffff", 50);
    Set<String> sentObjectIds = new HashSet<>();
    sentObjectIds.add("Lane_" + lane.getObjectId());

    LaneModel proto = LaneConverter.toProto(lane, sentObjectIds);

    assertNotNull(proto);
    assertEquals(lane.getObjectId(), proto.getObjectId());
    // Foreground and background should not be populated on subsequent sends (default empty strings)
    assertEquals("", proto.getForegroundColor());
    assertEquals("", proto.getBackgroundColor());
    assertEquals(0.0, proto.getLength(), 0.001);
  }
}
