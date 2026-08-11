package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.proto.Heat;
import com.antigravity.proto.RaceParticipant;
import com.antigravity.race.Race;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.Before;
import org.junit.Test;

public class RaceSerializationTest {

  private com.antigravity.models.Race raceModel;
  private Track track;
  private List<com.antigravity.race.RaceParticipant> drivers;

  @Before
  public void setUp() {
    raceModel = mock(com.antigravity.models.Race.class);
    track = mock(Track.class);
    drivers = new ArrayList<>();

    // 1 real driver
    drivers.add(
        new com.antigravity.race.RaceParticipant(
            new Driver("Real Driver", "Real Nick", "real1", "1")));

    // 2 lanes
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Red", "red", 1));
    lanes.add(new Lane("Blue", "blue", 2));
    when(track.getLanes()).thenReturn(lanes);
    when(track.getArduinoConfigs()).thenReturn(new ArrayList<>());
    when(track.getEntityId()).thenReturn("track1");
    when(track.getObjectId()).thenReturn("track1");
    when(track.getName()).thenReturn("Track 1");

    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.RoundRobin);
    when(raceModel.getHeatScoring()).thenReturn(new HeatScoring());
    when(raceModel.getOverallScoring()).thenReturn(new OverallScoring());
    when(raceModel.getTrackEntityId()).thenReturn("track1");
    when(raceModel.getEntityId()).thenReturn("race1");
    when(raceModel.getObjectId()).thenReturn("race1");
    when(raceModel.getName()).thenReturn("Race 1");
  }

  @Test
  public void testSerializeRaceWithEmptyLanes() {
    // This creates a race with 1 real driver and 1 empty driver (numLanes = 2)
    Race race =
        new Race.Builder().model(raceModel).drivers(drivers).track(track).isDemoMode(true).build();

    Set<String> sentObjectIds = new HashSet<>();
    com.antigravity.proto.Race proto = RaceConverter.toProto(race, sentObjectIds);

    assertNotNull(proto);
    assertEquals(2, proto.getDriversCount());

    // Check drivers in proto
    RaceParticipant emptyParticipant = null;
    RaceParticipant realParticipant = null;

    for (RaceParticipant p : proto.getDriversList()) {
      if ("Real Driver".equals(p.getDriver().getName())) {
        realParticipant = p;
      } else if ("Empty".equals(p.getDriver().getName())) {
        emptyParticipant = p;
      }
    }

    assertNotNull("Real participant should be in proto", realParticipant);
    assertNotNull("Empty participant should be in proto", emptyParticipant);

    // Verify empty driver fields
    assertEquals("Empty", emptyParticipant.getDriver().getName());
    assertEquals("Empty", emptyParticipant.getDriver().getNickname());
    assertEquals(Driver.EMPTY_DRIVER_ID, emptyParticipant.getDriver().getModel().getEntityId());

    // Verify heats also have the correct drivers
    assertTrue(proto.getHeatsCount() > 0);
    Heat heat0 = proto.getHeats(0);
    assertEquals(2, heat0.getHeatDriversCount());
  }
}
