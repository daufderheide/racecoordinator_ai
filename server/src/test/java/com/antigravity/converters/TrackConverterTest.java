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

  @Test
  public void testToProto_WithPhidgetConfig() {
    com.antigravity.protocols.phidget.PhidgetConfig phidgetConfig =
        new com.antigravity.protocols.phidget.PhidgetConfig();
    phidgetConfig.name = "My Phidget";
    phidgetConfig.serialNumber = 5551212;

    Track track =
        new Track.Builder()
            .name("Phidget Track")
            .lanes(new ArrayList<>())
            .phidgetConfigs(Collections.singletonList(phidgetConfig))
            .entityId("t2")
            .build();

    TrackModel proto = TrackConverter.toProto(track, new HashSet<>());

    assertEquals("Phidget Track", proto.getName());
    assertEquals(1, proto.getPhidgetConfigsCount());
    assertEquals("My Phidget", proto.getPhidgetConfigs(0).getName());
    assertEquals(5551212, proto.getPhidgetConfigs(0).getSerialNumber());
  }

  @Test
  public void testToProto_WithTrackScale() {
    Track track =
        new Track.Builder().name("Scale Track").trackScale(0.03125).entityId("t3").build();

    TrackModel proto = TrackConverter.toProto(track, new HashSet<>());

    assertEquals("Scale Track", proto.getName());
    assertEquals(0.03125, proto.getTrackScale(), 0.0001);
  }

  @Test
  public void testToProto_WithDsConfig() {
    com.antigravity.protocols.ds.DsConfig dsConfig = // fqn-collision
        new com.antigravity.protocols.ds.DsConfig( // fqn-collision
            "My DS-200", "COM4", com.antigravity.protocols.ds.DsType.DS_200); // fqn-collision

    Track track =
        new Track.Builder()
            .name("DS Track")
            .lanes(new ArrayList<>())
            .dsConfigs(Collections.singletonList(dsConfig))
            .entityId("t4")
            .build();

    TrackModel proto = TrackConverter.toProto(track, new HashSet<>());

    assertEquals("DS Track", proto.getName());
    assertEquals(1, proto.getDsConfigsCount());
    assertEquals("My DS-200", proto.getDsConfigs(0).getName());
    assertEquals("COM4", proto.getDsConfigs(0).getCommPort());
    assertEquals(com.antigravity.proto.DsType.DS_200, proto.getDsConfigs(0).getType());
    assertEquals(4800, proto.getDsConfigs(0).getBaudRate());
  }
}
