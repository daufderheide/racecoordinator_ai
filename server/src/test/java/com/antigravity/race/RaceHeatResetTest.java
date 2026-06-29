package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.race.states.Racing;
import com.antigravity.service.ServerConfigService;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class RaceHeatResetTest {

  private com.antigravity.race.Race race;
  private List<RaceParticipant> participants;

  @Before
  public void setUp() {
    ServerConfigService configService = mock(ServerConfigService.class);
    when(configService.getStartRandomizer()).thenReturn(0.0);
    when(configService.getRestartRandomizer()).thenReturn(0.0);

    DatabaseContext dbContext = mock(DatabaseContext.class);
    when(dbContext.getConfigService()).thenReturn(configService);

    ClientSubscriptionManager.getInstance().setDatabaseContext(dbContext);

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withEntityId("race1")
            .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("track1")
            .id(new ObjectId())
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
  }

  @Test
  public void testHeatRecordResetOnHeatChange() {
    // 1. Start Race and set a record in Heat 1
    race.changeState(new Racing());
    // Set reaction time so first hit is a lap
    race.getCurrentHeat().getDrivers().get(0).setReactionTime(0.5);
    race.onLap(0, 1.5, 0, 0); // 1.5 + 0.5 = 2.0

    assertEquals(2.0, race.getRecordData().getCurrent().getHeatFastestLap().getValue(), 0.001);

    // 2. Advance to next heat (simulated by setCurrentHeat)
    // In a real scenario, this is called by Race.nextHeat()
    Heat nextHeat =
        new Heat(1, new ArrayList<>(), new com.antigravity.models.HeatScoring(), false); // Heat 2
    race.setCurrentHeat(nextHeat);

    // 3. Verify heat record is reset to 0
    assertEquals(
        "Heat record should be reset to 0",
        0.0,
        race.getRecordData().getCurrent().getHeatFastestLap().getValue(),
        0.001);
    assertEquals(
        "Heat record holder should be empty",
        "",
        race.getRecordData().getCurrent().getHeatFastestLap().getHolderName());

    // 4. Verify race record is PRESERVED
    assertEquals(
        "Race record should be preserved",
        2.0,
        race.getRecordData().getCurrent().getFastestLap().getValue(),
        0.001);
  }
}
