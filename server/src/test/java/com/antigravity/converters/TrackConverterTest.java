package com.antigravity.converters;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Track;
import com.antigravity.proto.TrackModel;
import com.antigravity.protocols.trackmate.TrackmateConfig;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import org.junit.Test;

public class TrackConverterTest {

  @Test
  public void testToProto_WithTrackmateConfig() {
    TrackmateConfig tmConfig = new TrackmateConfig();
    tmConfig.name = "My TM";
    tmConfig.commPort = "COM3";
    tmConfig.numLanes = 4;
    tmConfig.debounce = 2;

    Track track =
        new Track.Builder()
            .name("My Track")
            .lanes(new ArrayList<>())
            .trackmateConfigs(Collections.singletonList(tmConfig))
            .entityId("t1")
            .build();

    TrackModel proto = TrackConverter.toProto(track, new HashSet<>());

    assertEquals("My Track", proto.getName());
    assertEquals(1, proto.getTrackmateConfigsCount());
    assertEquals("My TM", proto.getTrackmateConfigs(0).getName());
    assertEquals("COM3", proto.getTrackmateConfigs(0).getCommPort());
    assertEquals(4, proto.getTrackmateConfigs(0).getNumLanes());
    assertEquals(2, proto.getTrackmateConfigs(0).getDebounce());
  }
}
