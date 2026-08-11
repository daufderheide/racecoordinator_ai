package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class ReproduceExceptionTest {

  private Race raceModel;
  private Track track;
  private List<RaceParticipant> drivers;

  @Before
  public void setUp() {
    raceModel = mock(Race.class);
    track = mock(Track.class);
    drivers = new ArrayList<>();

    // 2 drivers
    drivers.add(new RaceParticipant(new Driver("D1", "d1", "id1", "1")));
    drivers.add(new RaceParticipant(new Driver("D2", "d2", "id2", "1")));

    // 4 lanes
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Red", "red", 1));
    lanes.add(new Lane("Blue", "blue", 2));
    lanes.add(new Lane("White", "white", 3));
    lanes.add(new Lane("Yellow", "yellow", 4));
    when(track.getLanes()).thenReturn(lanes);

    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.RoundRobin);
    when(raceModel.getHeatScoring()).thenReturn(new HeatScoring());
    when(raceModel.getOverallScoring()).thenReturn(new OverallScoring());
    when(raceModel.getTrackEntityId()).thenReturn("track1");
  }

  @Test
  public void reproduceFewerDriversThanLanes() {
    // This should not throw an exception
    com.antigravity.race.Race race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();

    assertNotNull(race);
    assertEquals(4, race.getHeats().size()); // numLanes = 4, so 4 heats

    // Check if heats have "Empty" drivers
    for (Heat heat : race.getHeats()) {
      assertEquals(4, heat.getDrivers().size());
      int emptyCount = 0;
      int activeCount = 0;
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd.getDriver().getDriver() == Driver.EMPTY_DRIVER) {
          emptyCount++;
        } else {
          activeCount++;
        }
      }
      // With 2 drivers and 4 lanes, each heat should have 2 active and 2 empty (normally)
      // Wait, let's verify if my math was right.
      // D1 rotations: H1-L1, H2-L2, H3-L3, H4-L4
      // D2 rotations: H1-L2, H2-L3, H3-L4, H4-L1
      // So yes, 2 active, 2 empty.
      assertEquals(2, activeCount);
      assertEquals(2, emptyCount);
    }
  }
}
