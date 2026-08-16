package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.DemoConfig;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class RaceHardwareManagerTest {

  private com.antigravity.race.Race race;
  private ProtocolDelegate mockProtocols;
  private RaceHardwareManager hardwareManager;

  @Before
  public void setUp() throws Exception {
    ArduinoConfig arduinoConfig = new ArduinoConfig();
    arduinoConfig.commPort = "DEMO";
    List<ArduinoConfig> configs = Collections.singletonList(arduinoConfig);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));

    Track realTrack =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(configs)
            .entityId("track1")
            .id("track1_id")
            .build();

    HeatScoring mockHeatScoring = mock(HeatScoring.class);
    when(mockHeatScoring.getHeatRanking()).thenReturn(HeatScoring.HeatRanking.LAP_COUNT);
    when(mockHeatScoring.getHeatRankingTiebreaker())
        .thenReturn(HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    when(mockHeatScoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Timed);
    when(mockHeatScoring.getFinishValue()).thenReturn(100L);

    OverallScoring mockOverallScoring = mock(OverallScoring.class);
    when(mockOverallScoring.getRankingMethod()).thenReturn(OverallScoring.OverallRanking.LAP_COUNT);
    when(mockOverallScoring.getTiebreaker())
        .thenReturn(OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    Race realRaceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(mockHeatScoring)
            .withOverallScoring(mockOverallScoring)
            .withAutoStartTime(10.0)
            .withAutoAdvanceTime(10.0)
            .withEntityId("race1")
            .withId("race1_id")
            .build();

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(
        new RaceParticipant(
            new Driver("Test Driver", "D1", "driver1", "driver1_id"), "participant1"));

    race =
        new com.antigravity.race.Race.Builder()
            .model(realRaceModel)
            .drivers(drivers)
            .track(realTrack)
            .isDemoMode(false)
            .build();

    mockProtocols = mock(ProtocolDelegate.class);
    when(mockProtocols.isHealthy()).thenReturn(true);
    race.injectProtocols(mockProtocols);
    race.init();

    hardwareManager = race.getHardwareManager();
  }

  @Test
  public void testDisconnectDuringRacingPausesRaceAndCutsPower() {
    race.changeState(new Racing());
    assertTrue("Race should be in Racing state", race.getState() instanceof Racing);

    // Simulate hardware disconnect
    race.onInterfaceStatus(InterfaceStatus.DISCONNECTED, 0);

    assertTrue(
        "Race should transition to Paused state on disconnect", race.getState() instanceof Paused);
    assertFalse("Main track power should be OFF when paused due to disconnect", race.isMainPower());
  }

  @Test
  public void testDisconnectDuringStartingAbortsCountdown() {
    race.changeState(new Starting());
    assertTrue("Race should be in Starting state", race.getState() instanceof Starting);

    // Simulate hardware disconnect
    race.onInterfaceStatus(InterfaceStatus.DISCONNECTED, 0);

    assertFalse(
        "Race should no longer be in Starting countdown state",
        race.getState() instanceof Starting);
    assertTrue(
        "Race should transition to NotStarted or Paused",
        race.getState() instanceof NotStarted || race.getState() instanceof Paused);
    assertEquals("Auto start remaining should be 0", 0.0, race.getAutoStartRemaining(), 0.001);
  }

  @Test
  public void testDisconnectDuringNotStartedStopsAutoStart() {
    race.changeState(new NotStarted());
    assertTrue("Race should be in NotStarted state", race.getState() instanceof NotStarted);
    race.setAutoStartRemaining(10.0);

    // Simulate hardware disconnect
    race.onInterfaceStatus(InterfaceStatus.DISCONNECTED, 0);

    assertTrue("Race should remain in NotStarted state", race.getState() instanceof NotStarted);
    assertTrue("Auto start should be marked as fired/cancelled", race.isAutoStartFired());
    assertEquals(
        "Auto start remaining should be reset to 0", 0.0, race.getAutoStartRemaining(), 0.001);
  }

  @Test
  public void testDisconnectDuringHeatOverStopsAutoAdvance() {
    race.changeState(new HeatOver());
    assertTrue("Race should be in HeatOver state", race.getState() instanceof HeatOver);
    race.setAutoAdvanceRemaining(10.0);

    // Simulate hardware disconnect
    race.onInterfaceStatus(InterfaceStatus.DISCONNECTED, 0);

    assertTrue("Race should remain in HeatOver state", race.getState() instanceof HeatOver);
    assertTrue("Auto advance should be marked as fired/cancelled", race.isAutoAdvanceFired());
    assertEquals(
        "Auto advance remaining should be reset to 0", 0.0, race.getAutoAdvanceRemaining(), 0.001);
  }

  @Test
  public void testCreateProtocolsInDemoMode() {
    RaceHardwareManager manager = new RaceHardwareManager(race);
    manager.createProtocols(true, DemoConfig.getDefaultInstance());
    assertNotNull("Protocols should be created in demo mode", manager.getProtocols());
  }

  @Test
  public void testUpdatePowerForFlagStates() {
    hardwareManager.updatePowerForFlag(RaceFlag.GREEN);
    assertTrue("Main power should be ON for GREEN flag", race.isMainPower());

    hardwareManager.updatePowerForFlag(RaceFlag.YELLOW);
    assertFalse("Main power should be OFF for YELLOW flag", race.isMainPower());

    hardwareManager.updatePowerForFlag(RaceFlag.RED);
    assertFalse("Main power should be OFF for RED flag", race.isMainPower());

    hardwareManager.updatePowerForFlag(RaceFlag.WHITE);
    assertTrue("Main power should be ON for WHITE flag", race.isMainPower());
  }

  @Test
  public void testDelegationMethods() {
    when(mockProtocols.open()).thenReturn(true);
    when(mockProtocols.hasMainRelay()).thenReturn(true);
    when(mockProtocols.hasPerLaneRelays()).thenReturn(false);

    assertTrue(hardwareManager.open());
    assertTrue(hardwareManager.hasMainRelay());
    assertFalse(hardwareManager.hasPerLaneRelays());

    hardwareManager.forceMainPowerSync();
    verify(mockProtocols).setMainPower(race.isMainPower());

    hardwareManager.close();
    verify(mockProtocols).close();
  }
}
