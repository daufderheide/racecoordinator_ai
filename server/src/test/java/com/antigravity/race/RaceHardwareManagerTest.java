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

    hardwareManager.updatePowerForFlag(RaceFlag.GREEN_YELLOW);
    assertTrue("Main power should be ON for GREEN_YELLOW (warmup) flag", race.isMainPower());

    // Checkered flag with allow finish disabled
    when(race.getRaceModel().getHeatScoring().getAllowFinish())
        .thenReturn(HeatScoring.AllowFinish.None);
    hardwareManager.updatePowerForFlag(RaceFlag.CHECKERED);
    assertFalse(
        "Main power should be OFF for CHECKERED when allow finish is disabled", race.isMainPower());

    // Checkered flag with allow finish enabled
    when(race.getRaceModel().getHeatScoring().getAllowFinish())
        .thenReturn(HeatScoring.AllowFinish.Allow);
    hardwareManager.updatePowerForFlag(RaceFlag.CHECKERED);
    assertTrue(
        "Main power should be ON for CHECKERED when allow finish is enabled", race.isMainPower());

    // Checkered flag with single lap allow finish
    when(race.getRaceModel().getHeatScoring().getAllowFinish())
        .thenReturn(HeatScoring.AllowFinish.SingleLap);
    hardwareManager.updatePowerForFlag(RaceFlag.CHECKERED);
    assertTrue(
        "Main power should be ON for CHECKERED when single lap allow finish is enabled",
        race.isMainPower());
  }

  @Test
  public void testUpdatePowerForFlagDuringRacingState() {
    race.changeState(new com.antigravity.race.states.Racing());

    when(race.getRaceModel().getHeatScoring().getAllowFinish())
        .thenReturn(HeatScoring.AllowFinish.SingleLap);

    // During Racing state with AllowFinish.SingleLap, power should stay ON for finishing flags
    hardwareManager.updatePowerForFlag(RaceFlag.GREEN);
    assertTrue("Main power should be ON for GREEN", race.isMainPower());

    hardwareManager.updatePowerForFlag(RaceFlag.WHITE);
    assertTrue("Main power should be ON for WHITE", race.isMainPower());

    hardwareManager.updatePowerForFlag(RaceFlag.CHECKERED);
    assertTrue(
        "Main power should be ON for CHECKERED in Racing state with SingleLap", race.isMainPower());

    // With AllowFinish.None, power should turn OFF for CHECKERED
    when(race.getRaceModel().getHeatScoring().getAllowFinish())
        .thenReturn(HeatScoring.AllowFinish.None);
    hardwareManager.updatePowerForFlag(RaceFlag.CHECKERED);
    assertFalse(
        "Main power should be OFF for CHECKERED in Racing state with AllowFinish.None",
        race.isMainPower());
  }

  private com.antigravity.race.Race createHotStartRace(ProtocolDelegate protocols) {
    Race hotRaceModel =
        new Race.Builder()
            .withName("Hot Start Race")
            .withTrackEntityId("track1")
            .withHotStart(true)
            .withStartAtCurrent(true)
            .withEntityId("race_hot")
            .withId("race_hot_id")
            .build();

    com.antigravity.race.Race hotRace =
        new com.antigravity.race.Race.Builder()
            .model(hotRaceModel)
            .drivers(race.getDrivers())
            .track(race.getTrack())
            .isDemoMode(false)
            .build();

    when(protocols.isHealthy()).thenReturn(true);
    when(protocols.open()).thenReturn(true);
    hotRace.injectProtocols(protocols);
    hotRace.init();

    Heat heat1 = hotRace.getHeats().get(0);
    heat1.setStarted(true);

    List<DriverHeatData> heat2Drivers = new ArrayList<>();
    heat2Drivers.add(new DriverHeatData(race.getDrivers().get(0)));
    Heat heat2 = new Heat(2, heat2Drivers, hotRace.getRaceModel().getHeatScoring(), false);
    hotRace.getHeats().add(heat2);
    hotRace.setCurrentHeat(heat2);

    Starting testStarting =
        new Starting() {
          @Override
          public void enter(com.antigravity.race.Race race) {}

          @Override
          public void exit(com.antigravity.race.Race race) {}
        };
    hotRace.changeState(testStarting);
    return hotRace;
  }

  @Test
  public void testHotStartPowerControlsWithoutPerLaneRelays() {
    ProtocolDelegate hotProtocols = mock(ProtocolDelegate.class);
    when(hotProtocols.hasPerLaneRelays()).thenReturn(false);

    com.antigravity.race.Race hotRace = createHotStartRace(hotProtocols);
    RaceHardwareManager hotManager = hotRace.getHardwareManager();

    hotManager.updatePowerForFlag(RaceFlag.RED);
    assertFalse(
        "Main power should be OFF if cold lanes exist and no per-lane relays",
        hotRace.isMainPower());
  }

  @Test
  public void testHotStartPowerControlsWithPerLaneRelays() {
    ProtocolDelegate hotProtocols = mock(ProtocolDelegate.class);
    when(hotProtocols.hasPerLaneRelays()).thenReturn(true);

    com.antigravity.race.Race hotRace = createHotStartRace(hotProtocols);
    RaceHardwareManager hotManager = hotRace.getHardwareManager();

    hotManager.updatePowerForFlag(RaceFlag.RED);
    assertTrue("Main power should be ON when per-lane relays are available", hotRace.isMainPower());
    assertFalse("Cold lane power should be OFF", hotRace.isLanePower(0));
  }

  @Test
  public void testInitializeHardwareState() {
    hardwareManager.initializeHardwareState();
    verify(mockProtocols).initializeHardwareState();
  }

  @Test(expected = IllegalArgumentException.class)
  public void testCreateProtocolsRealModeWithoutConfigsThrowsException() {
    Track emptyTrack =
        new Track.Builder()
            .name("Empty Track")
            .lanes(Collections.emptyList())
            .arduinoConfigs(Collections.emptyList())
            .phidgetConfigs(Collections.emptyList())
            .trackmateConfigs(Collections.emptyList())
            .bartConfigs(Collections.emptyList())
            .entityId("empty_track")
            .id("empty_track_id")
            .build();

    com.antigravity.race.Race emptyRace =
        new com.antigravity.race.Race.Builder()
            .model(race.getRaceModel())
            .drivers(race.getDrivers())
            .track(emptyTrack)
            .isDemoMode(false)
            .build();

    RaceHardwareManager manager = new RaceHardwareManager(emptyRace);
    manager.createProtocols(false, DemoConfig.getDefaultInstance());
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
