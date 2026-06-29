package com.antigravity.race;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.RaceOver;
import com.antigravity.service.DatabaseService;
import com.mongodb.client.MongoDatabase;
import java.util.ArrayList;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class DemoModePersistenceTest {

  private com.antigravity.race.Race race;
  private Track track;

  @Before
  public void setUp() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100, "l1", null));
    track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("track1")
            .id(null)
            .build();

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .withEntityId("race1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(new ArrayList<>())
            .track(track)
            .isDemoMode(true)
            .build();
  }

  @After
  public void tearDown() {
    DatabaseService.setInstance(new DatabaseService());
    ClientSubscriptionManager.getInstance().setDatabaseContext(null);
  }

  @Test
  public void testRaceOverSavesInDemoAndNormalMode() {
    DatabaseService mockService = mock(DatabaseService.class);
    DatabaseService.setInstance(mockService);

    DatabaseContext mockContext = mock(DatabaseContext.class);
    doReturn(mock(MongoDatabase.class)).when(mockContext).getDatabase();

    ClientSubscriptionManager.getInstance().setDatabaseContext(mockContext);

    // 1. Test Demo Mode
    RaceOver raceOver = new RaceOver();
    raceOver.enter(race);

    verify(mockService, times(1)).saveRaceHistory(any(), any());
    verify(mockService, times(1)).updateGlobalStatistics(any(), any());

    // Reset mock interactions for the next check
    reset(mockService);

    // 2. Test Normal Mode
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Normal Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .withEntityId("race2")
            .build();

    ArduinoConfig config = new ArduinoConfig();
    config.commPort = "COM1";
    List<ArduinoConfig> configs = new ArrayList<>();
    configs.add(config);

    Track normalTrack =
        new Track.Builder()
            .name(track.getName())
            .lanes(track.getLanes())
            .arduinoConfigs(configs)
            .entityId(track.getEntityId())
            .id(null)
            .build();

    com.antigravity.race.Race normalRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(new ArrayList<>())
            .track(normalTrack)
            .isDemoMode(false)
            .build();

    raceOver.enter(normalRace);

    verify(mockService, times(1)).saveRaceHistory(any(), any());
    verify(mockService, times(1)).updateGlobalStatistics(any(), any());
  }
}
