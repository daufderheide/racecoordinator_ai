package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.converters.HeatConverter;
import com.antigravity.converters.RaceParticipantConverter;
import com.antigravity.models.Driver;
import com.antigravity.models.GroupOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.proto.ModifyHeatsRequest;
import com.antigravity.proto.ModifyHeatsResponse;
import com.antigravity.proto.RegenerateHeatsRequest;
import com.antigravity.proto.RegenerateHeatsResponse;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RaceHeatManagerTest {

  private com.antigravity.race.Race testRace;
  private List<RaceParticipant> participants;
  private Track track;
  private com.antigravity.models.Race raceModel;

  @Before
  public void setUp() throws Exception {
    List<ArduinoConfig> mockConfig = Collections.singletonList(mock(ArduinoConfig.class));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "white", 101));

    track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(mockConfig)
            .entityId("track1")
            .id("1")
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

    raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(mockHeatScoring)
            .withOverallScoring(mockOverallScoring)
            .withEntityId("race1")
            .withId("1")
            .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1"), "p1"));
    participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", "1"), "p2"));
    participants.add(new RaceParticipant(new Driver("Driver 3", "D3", "d3", "1"), "p3"));

    List<DriverHeatData> heat1Drivers = new ArrayList<>();
    heat1Drivers.add(new DriverHeatData(participants.get(0)));
    heat1Drivers.add(new DriverHeatData(participants.get(1)));
    Heat heat1 = new Heat(1, heat1Drivers, mockHeatScoring, false);
    heat1.setObjectId("heat1");

    List<DriverHeatData> heat2Drivers = new ArrayList<>();
    heat2Drivers.add(new DriverHeatData(participants.get(2)));
    heat2Drivers.add(new DriverHeatData(new RaceParticipant(Driver.EMPTY_DRIVER)));
    Heat heat2 = new Heat(2, heat2Drivers, mockHeatScoring, false);
    heat2.setObjectId("heat2");

    List<Heat> heats = new ArrayList<>(Arrays.asList(heat1, heat2));

    testRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .heats(heats)
            .isDemoMode(true)
            .build();
  }

  @After
  public void tearDown() {
    if (testRace != null && testRace.getState() != null) {
      try {
        testRace.getState().exit(testRace);
      } catch (Exception ignored) {
      }
    }
    ClientSubscriptionManager.setInstance(null);
  }

  // -------------------------------------------------------------
  // Heat Modification & Validation Tests
  // -------------------------------------------------------------

  @Test
  public void testModifyHeats_ValidChange() {
    Heat heat1 = testRace.getHeats().get(0);
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(1))); // p2
    drivers.add(new DriverHeatData(participants.get(0))); // p1

    Heat modifiedHeat1 = new Heat(1, drivers, raceModel.getHeatScoring(), false);
    modifiedHeat1.setObjectId(heat1.getObjectId());

    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(modifiedHeat1, testRace.getHeats().get(1)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue("Modify heats should succeed: " + response.getErrorMessage(), response.getSuccess());
    assertEquals(
        "Heat 1 driver 0 should be p2",
        "p2",
        testRace.getHeats().get(0).getDrivers().get(0).getDriver().getObjectId());
    assertEquals(
        "Heat 1 driver 1 should be p1",
        "p1",
        testRace.getHeats().get(0).getDrivers().get(1).getDriver().getObjectId());
  }

  @Test
  public void testModifyHeats_DeleteStartedHeat_Fails() {
    testRace.getHeats().get(0).setStarted(true);

    ModifyHeatsRequest request =
        createRequest(participants, Collections.singletonList(testRace.getHeats().get(1)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail to delete started heat", response.getSuccess());
    assertTrue(
        response.getErrorMessage().contains("Cannot delete a heat that has already been started"));
  }

  @Test
  public void testModifyHeats_RemoveParticipantFromStartedHeat_Fails() {
    testRace.getHeats().get(0).setStarted(true);

    List<RaceParticipant> newParticipants = new ArrayList<>(participants);
    newParticipants.remove(0); // remove p1

    ModifyHeatsRequest request = createRequest(newParticipants, testRace.getHeats());
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail to remove participant who has raced", response.getSuccess());
    assertTrue(
        response
            .getErrorMessage()
            .contains("cannot be removed because they have already participated"));
  }

  @Test
  public void testModifyHeats_ChangeDriverInStartedHeat_Fails() {
    testRace.getHeats().get(0).setStarted(true);

    Heat heat1 = testRace.getHeats().get(0);
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(1)));
    drivers.add(new DriverHeatData(participants.get(0)));

    Heat modifiedHeat1 = new Heat(1, drivers, raceModel.getHeatScoring(), false);
    modifiedHeat1.setObjectId(heat1.getObjectId());
    modifiedHeat1.setStarted(true);

    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(modifiedHeat1, testRace.getHeats().get(1)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail to change participants in started heat", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("Cannot change participants in a started heat"));
  }

  @Test
  public void testModifyHeats_ChangeLanesInStartedHeat_Fails() {
    testRace.getHeats().get(0).setStarted(true);

    Heat heat1 = testRace.getHeats().get(0);
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(0)));

    Heat modifiedHeat1 = new Heat(1, drivers, raceModel.getHeatScoring(), false);
    modifiedHeat1.setObjectId(heat1.getObjectId());
    modifiedHeat1.setStarted(true);

    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(modifiedHeat1, testRace.getHeats().get(1)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail to change number of lanes in started heat", response.getSuccess());
    assertTrue(
        response.getErrorMessage().contains("Cannot change number of lanes in a started heat"));
  }

  @Test
  public void testModifyHeats_ChangeEmptyToDriverInStartedHeat_Fails() {
    testRace.getHeats().get(1).setStarted(true);

    Heat heat2 = testRace.getHeats().get(1);
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(2))); // p3
    drivers.add(new DriverHeatData(participants.get(0))); // p1

    Heat modifiedHeat2 = new Heat(2, drivers, raceModel.getHeatScoring(), false);
    modifiedHeat2.setObjectId(heat2.getObjectId());
    modifiedHeat2.setStarted(true);

    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(testRace.getHeats().get(0), modifiedHeat2));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse(
        "Should fail to change empty lane to driver in started heat", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("Cannot change participants in a started heat"));
  }

  @Test
  public void testModifyHeats_AddNewParticipant() {
    RaceParticipant p4 = new RaceParticipant(new Driver("Driver 4", "D4", "d4", "1"), "p4");
    List<RaceParticipant> newParticipants = new ArrayList<>(participants);
    newParticipants.add(p4);

    Heat heat2 = testRace.getHeats().get(1);
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(2))); // p3
    drivers.add(new DriverHeatData(p4)); // p4

    Heat modifiedHeat2 = new Heat(2, drivers, raceModel.getHeatScoring(), false);
    modifiedHeat2.setObjectId(heat2.getObjectId());

    ModifyHeatsRequest request =
        createRequest(newParticipants, Arrays.asList(testRace.getHeats().get(0), modifiedHeat2));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue(
        "Adding new participant should succeed: " + response.getErrorMessage(),
        response.getSuccess());
    assertEquals("Total participants should be 4", 4, testRace.getDrivers().size());
    assertEquals(
        "Heat 2 driver 1 should be p4",
        "p4",
        testRace.getHeats().get(1).getDrivers().get(1).getDriver().getObjectId());
  }

  @Test
  public void testModifyHeats_ReorderHeats() {
    List<Heat> newHeats = new ArrayList<>();
    newHeats.add(testRace.getHeats().get(1));
    newHeats.add(testRace.getHeats().get(0));

    newHeats.get(0).setHeatNumber(1);
    newHeats.get(1).setHeatNumber(2);

    ModifyHeatsRequest request = createRequest(participants, newHeats);
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue("Reordering heats should succeed", response.getSuccess());
    assertEquals(
        "Heat 1 should now be the old Heat 2", "heat2", testRace.getHeats().get(0).getObjectId());
    assertEquals(
        "Heat 2 should now be the old Heat 1", "heat1", testRace.getHeats().get(1).getObjectId());
  }

  @Test
  public void testRacingStateStartsHeat() {
    Heat heat = testRace.getHeats().get(0);
    testRace.setCurrentHeat(heat);
    assertFalse("Heat should not be started before Racing state", heat.isStarted());

    testRace.changeState(new Racing());
    assertTrue("Heat should be started after entering Racing state", heat.isStarted());
  }

  @Test
  public void testRegenerateHeats_StartedHeat_AllowsSame_FailsChanged() {
    testRace.getHeats().get(0).setStarted(true);

    RegenerateHeatsRequest.Builder requestBuilder = RegenerateHeatsRequest.newBuilder();
    for (RaceParticipant p : participants) {
      requestBuilder.addParticipants(RaceParticipantConverter.toProto(p, new HashSet<>()));
    }
    RegenerateHeatsResponse response = testRace.regenerateHeats(requestBuilder.build());
    assertTrue(
        "Should succeed to regenerate if started heats are not modified", response.getSuccess());

    List<RaceParticipant> differentParticipants = new ArrayList<>(participants);
    differentParticipants.remove(0); // Remove p1

    RegenerateHeatsRequest.Builder failRequestBuilder = RegenerateHeatsRequest.newBuilder();
    for (RaceParticipant p : differentParticipants) {
      failRequestBuilder.addParticipants(RaceParticipantConverter.toProto(p, new HashSet<>()));
    }
    RegenerateHeatsResponse failResponse = testRace.regenerateHeats(failRequestBuilder.build());
    assertFalse(
        "Should fail to regenerate if started heat would be modified", failResponse.getSuccess());
    assertTrue(failResponse.getErrorMessage().contains("RD_ERR_REGENERATE_STARTED_HEATS"));

    List<RaceParticipant> allowedParticipants = new ArrayList<>(participants);
    allowedParticipants.remove(2); // Remove p3 (Driver 3)

    RegenerateHeatsRequest.Builder allowedRequestBuilder = RegenerateHeatsRequest.newBuilder();
    for (RaceParticipant p : allowedParticipants) {
      allowedRequestBuilder.addParticipants(RaceParticipantConverter.toProto(p, new HashSet<>()));
    }
    RegenerateHeatsResponse allowedResponse =
        testRace.regenerateHeats(allowedRequestBuilder.build());
    assertTrue(
        "Should succeed to regenerate if removed driver did not run in any started heats",
        allowedResponse.getSuccess());
  }

  @Test
  public void testModifyHeats_RaceOver_Fails() {
    testRace.changeState(new com.antigravity.race.states.RaceOver());

    ModifyHeatsRequest request = createRequest(participants, testRace.getHeats());
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail to modify heats when race is over", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("Cannot modify heats when the race is over"));
  }

  @Test
  public void testRegenerateHeats_RaceOver_Fails() {
    testRace.changeState(new com.antigravity.race.states.RaceOver());

    RegenerateHeatsRequest request = RegenerateHeatsRequest.newBuilder().build();
    RegenerateHeatsResponse response = testRace.regenerateHeats(request);

    assertFalse("Should fail to regenerate heats when race is over", response.getSuccess());
    assertTrue(
        response.getErrorMessage().contains("Cannot regenerate heats when the race is over"));
  }

  @Test
  public void testModifyHeats_DuplicateDriverInHeat_Succeeds() {
    Heat heat1 = testRace.getHeats().get(0);
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(0))); // p1
    drivers.add(new DriverHeatData(participants.get(0))); // p1 (multi-lane assignment!)

    Heat modifiedHeat1 = new Heat(1, drivers, raceModel.getHeatScoring(), false);
    modifiedHeat1.setObjectId(heat1.getObjectId());

    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(modifiedHeat1, testRace.getHeats().get(1)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue(
        "Should succeed when same driver is assigned to multiple lanes", response.getSuccess());
  }

  @Test
  public void testModifyHeats_DuplicateParticipant_Fails() {
    List<RaceParticipant> dupeParticipants = new ArrayList<>(participants);
    dupeParticipants.add(participants.get(0)); // p1 again

    ModifyHeatsRequest request = createRequest(dupeParticipants, testRace.getHeats());
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail if duplicate participant is added", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("is added more than once"));
  }

  @Test
  public void testModifyHeats_OverlappingDriverInTeam_Fails() {
    Team team1 = new Team("Team 1", "url", Collections.singletonList("d1"), "t1", "1");
    RaceParticipant teamParticipant = new RaceParticipant(team1);
    teamParticipant.setObjectId("pt1");

    List<RaceParticipant> overlappingParticipants = new ArrayList<>(participants);
    overlappingParticipants.add(teamParticipant);

    ModifyHeatsRequest request = createRequest(overlappingParticipants, testRace.getHeats());
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail if driver is also in a team", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("Overlap detected"));
    assertTrue(
        response.getErrorMessage().contains("Driver in team Team 1 is already a participant"));
  }

  @Test
  public void testModifyHeats_OverlappingTeams_Fails() {
    Team team1 = new Team("Team 1", "url", Collections.singletonList("d1"), "t1", "1");
    RaceParticipant pt1 = new RaceParticipant(team1);
    pt1.setObjectId("pt1");

    Team team2 = new Team("Team 2", "url", Collections.singletonList("d1"), "t2", "1");
    RaceParticipant pt2 = new RaceParticipant(team2);
    pt2.setObjectId("pt2");

    List<RaceParticipant> overlappingParticipants = new ArrayList<>();
    overlappingParticipants.add(pt1);
    overlappingParticipants.add(pt2);

    ModifyHeatsRequest request = createRequest(overlappingParticipants, testRace.getHeats());
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail if two teams share a driver", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("Overlap detected"));
  }

  @Test
  public void testModifyHeats_DriverInMultipleGroups_Fails() {
    GroupOptions groupOptions = new GroupOptions(true, 2, true, false, false, false, 0);
    com.antigravity.models.Race groupRaceModel =
        new com.antigravity.models.Race.Builder()
            .from(raceModel)
            .withGroupOptions(groupOptions)
            .build();

    com.antigravity.race.Race groupRace =
        new com.antigravity.race.Race.Builder()
            .model(groupRaceModel)
            .drivers(participants)
            .track(track)
            .heats(testRace.getHeats())
            .isDemoMode(true)
            .build();

    Heat heat1 = groupRace.getHeats().get(0);
    Heat heat2 = groupRace.getHeats().get(1);
    heat1.setGroup(0);
    heat2.setGroup(1);

    List<DriverHeatData> heat2Drivers = new ArrayList<>();
    heat2Drivers.add(new DriverHeatData(participants.get(0))); // p1
    heat2Drivers.add(new DriverHeatData(new RaceParticipant(Driver.EMPTY_DRIVER)));
    Heat modifiedHeat2 = new Heat(2, heat2Drivers, raceModel.getHeatScoring(), false);
    modifiedHeat2.setObjectId(heat2.getObjectId());
    modifiedHeat2.setGroup(1);

    ModifyHeatsRequest request = createRequest(participants, Arrays.asList(heat1, modifiedHeat2));
    ModifyHeatsResponse response = groupRace.modifyHeats(request);

    assertFalse("Should fail if driver is in multiple groups", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("RD_ERR_PARTICIPANT_MULTIPLE_GROUPS"));
  }

  @Test
  public void testModifyHeats_NonSequentialGroup_Succeeds() {
    GroupOptions groupOptions = new GroupOptions(true, 2, true, false, false, false, 0);
    com.antigravity.models.Race groupRaceModel =
        new com.antigravity.models.Race.Builder()
            .from(raceModel)
            .withGroupOptions(groupOptions)
            .build();

    com.antigravity.race.Race groupRace =
        new com.antigravity.race.Race.Builder()
            .model(groupRaceModel)
            .drivers(participants)
            .track(track)
            .heats(testRace.getHeats())
            .isDemoMode(true)
            .build();

    Heat heat1 = groupRace.getHeats().get(0);
    Heat heat2 = groupRace.getHeats().get(1);
    heat1.setGroup(0);
    heat2.setGroup(2);

    ModifyHeatsRequest request = createRequest(participants, Arrays.asList(heat1, heat2));
    ModifyHeatsResponse response = groupRace.modifyHeats(request);

    assertTrue("Should succeed if group sequence has a gap", response.getSuccess());
  }

  @Test
  public void testModifyHeats_PreservesAndUpdatesSeeds() {
    List<RaceParticipant> updatedParticipants = new ArrayList<>();
    for (int i = 0; i < participants.size(); i++) {
      RaceParticipant p = participants.get(i);
      RaceParticipant pCopy = new RaceParticipant(p.getDriver(), p.getObjectId());
      pCopy.setSeed(i + 10);
      updatedParticipants.add(pCopy);
    }

    ModifyHeatsRequest request = createRequest(updatedParticipants, testRace.getHeats());
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue("Modify heats should succeed", response.getSuccess());
    assertEquals(
        "Participant 1 seed should be updated to 10", 10, testRace.getDrivers().get(0).getSeed());
    assertEquals(
        "Participant 2 seed should be updated to 11", 11, testRace.getDrivers().get(1).getSeed());
    assertEquals(
        "Participant 3 seed should be updated to 12", 12, testRace.getDrivers().get(2).getSeed());
  }

  @Test
  public void testModifyHeats_DeleteAllUnstartedHeats_TransitionsToRaceOver() {
    testRace.getHeats().get(0).setStarted(true);

    ModifyHeatsRequest request =
        createRequest(participants, Collections.singletonList(testRace.getHeats().get(0)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue("Modify heats should succeed", response.getSuccess());
    assertFalse(
        "Race should NOT transition to RaceOver during modification",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);

    boolean allStarted = !testRace.getHeats().isEmpty();
    for (Heat h : testRace.getHeats()) {
      if (!h.isStarted()) {
        allStarted = false;
        break;
      }
    }
    assertTrue("All remaining heats are started", allStarted);
  }

  @Test
  public void testModifyHeats_DeleteAllUnstartedHeatsAndAddNew_DoesNotTransitionToRaceOver() {
    testRace.getHeats().get(0).setStarted(true);

    List<DriverHeatData> heat3Drivers = new ArrayList<>();
    heat3Drivers.add(new DriverHeatData(participants.get(0)));
    heat3Drivers.add(new DriverHeatData(participants.get(1)));
    Heat heat3 = new Heat(3, heat3Drivers, raceModel.getHeatScoring(), false);
    heat3.setObjectId("heat3");

    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(testRace.getHeats().get(0), heat3));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue("Modify heats should succeed", response.getSuccess());
    assertFalse(
        "Race should NOT transition to RaceOver",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);

    boolean allStarted = !testRace.getHeats().isEmpty();
    for (Heat h : testRace.getHeats()) {
      if (!h.isStarted()) {
        allStarted = false;
        break;
      }
    }
    assertFalse("Not all heats are started", allStarted);
  }

  // -------------------------------------------------------------
  // Group Validation & Sequence Tests
  // -------------------------------------------------------------

  @Test
  public void testValidateGroups_Sequential() {
    com.antigravity.race.Race mockR = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race mockM = mock(com.antigravity.models.Race.class);
    when(mockR.getRaceModel()).thenReturn(mockM);
    RaceHeatManager manager = new RaceHeatManager(mockR);
    GroupOptions options = new GroupOptions(true, 10, true, true, false, false, 0);
    when(mockM.getGroupOptions()).thenReturn(options);

    ModifyHeatsRequest request =
        ModifyHeatsRequest.newBuilder()
            .addHeats(com.antigravity.proto.Heat.newBuilder().setGroup(0).build())
            .addHeats(com.antigravity.proto.Heat.newBuilder().setGroup(1).build())
            .build();

    String error = manager.validateGroups(request);
    assertNull("Should be valid", error);
  }

  @Test
  public void testValidateGroups_Gap() {
    com.antigravity.race.Race mockR = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race mockM = mock(com.antigravity.models.Race.class);
    when(mockR.getRaceModel()).thenReturn(mockM);
    RaceHeatManager manager = new RaceHeatManager(mockR);
    GroupOptions options = new GroupOptions(true, 10, true, true, false, false, 0);
    when(mockM.getGroupOptions()).thenReturn(options);

    ModifyHeatsRequest request =
        ModifyHeatsRequest.newBuilder()
            .addHeats(com.antigravity.proto.Heat.newBuilder().setGroup(0).build())
            .addHeats(com.antigravity.proto.Heat.newBuilder().setGroup(2).build())
            .build();

    String error = manager.validateGroups(request);
    assertNull("Should be valid even with a gap", error);
  }

  @Test
  public void testValidateGroups_Negative() {
    com.antigravity.race.Race mockR = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race mockM = mock(com.antigravity.models.Race.class);
    when(mockR.getRaceModel()).thenReturn(mockM);
    RaceHeatManager manager = new RaceHeatManager(mockR);
    GroupOptions options = new GroupOptions(true, 10, true, true, false, false, 0);
    when(mockM.getGroupOptions()).thenReturn(options);

    ModifyHeatsRequest request =
        ModifyHeatsRequest.newBuilder()
            .addHeats(com.antigravity.proto.Heat.newBuilder().setGroup(-1).build())
            .build();

    String error = manager.validateGroups(request);
    assertEquals("RD_ERR_GROUP_MIN_VALUE", error);
  }

  @Test
  public void testValidateGroups_Disabled() {
    com.antigravity.race.Race mockR = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race mockM = mock(com.antigravity.models.Race.class);
    when(mockR.getRaceModel()).thenReturn(mockM);
    RaceHeatManager manager = new RaceHeatManager(mockR);
    GroupOptions options = new GroupOptions(false, 10, true, true, false, false, 0);
    when(mockM.getGroupOptions()).thenReturn(options);

    ModifyHeatsRequest request =
        ModifyHeatsRequest.newBuilder()
            .addHeats(com.antigravity.proto.Heat.newBuilder().setGroup(5).build())
            .build();

    String error = manager.validateGroups(request);
    assertNull("Should be valid when groups disabled", error);
  }

  // -------------------------------------------------------------
  // Group Isolation & Group Rotation Tests
  // -------------------------------------------------------------

  @Test
  public void testGrouping_Isolation() {
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, false, 0);
    com.antigravity.models.Race gModel =
        new com.antigravity.models.Race.Builder()
            .from(raceModel)
            .withGroupOptions(groupOptions)
            .build();

    List<Lane> lanes4 = new ArrayList<>();
    lanes4.add(new Lane("Blue", "blue", 1));
    lanes4.add(new Lane("Red", "red", 2));
    lanes4.add(new Lane("White", "white", 3));
    lanes4.add(new Lane("Yellow", "yellow", 4));
    Track track4 = new Track.Builder().name("T4").lanes(lanes4).build();

    List<RaceParticipant> p8 = createParticipantList(8);

    com.antigravity.race.Race gRace =
        new com.antigravity.race.Race.Builder()
            .model(gModel)
            .drivers(p8)
            .track(track4)
            .isDemoMode(true)
            .build();

    List<Heat> heats = HeatBuilder.buildHeats(gRace, p8, new ArrayList<>());
    assertEquals(8, heats.size());

    for (Heat heat : heats) {
      int group = -1;
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (!dhd.getDriver().getDriver().isEmpty()) {
          int driverIdx = Integer.parseInt(dhd.getDriver().getDriver().getEntityId()) - 1;
          int expectedGroup = (driverIdx < 4) ? 0 : 1;
          if (group == -1) {
            group = expectedGroup;
          }
          assertEquals("Drivers from different groups in the same heat!", group, expectedGroup);
          assertEquals("Heat group label mismatch!", group, heat.getGroup());
        }
      }
    }
  }

  @Test
  public void testGrouping_RotateHeats() {
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, true, 0);
    com.antigravity.models.Race gModel =
        new com.antigravity.models.Race.Builder()
            .from(raceModel)
            .withGroupOptions(groupOptions)
            .build();

    List<Lane> lanes4 = new ArrayList<>();
    lanes4.add(new Lane("Blue", "blue", 1));
    lanes4.add(new Lane("Red", "red", 2));
    lanes4.add(new Lane("White", "white", 3));
    lanes4.add(new Lane("Yellow", "yellow", 4));
    Track track4 = new Track.Builder().name("T4").lanes(lanes4).build();

    List<RaceParticipant> p8 = createParticipantList(8);

    com.antigravity.race.Race gRace =
        new com.antigravity.race.Race.Builder()
            .model(gModel)
            .drivers(p8)
            .track(track4)
            .isDemoMode(true)
            .build();

    List<Heat> heats = HeatBuilder.buildHeats(gRace, p8, new ArrayList<>());
    assertEquals(8, heats.size());

    for (int i = 0; i < heats.size(); i++) {
      assertEquals(
          "Heat " + i + " should be from group " + (i % 2), i % 2, heats.get(i).getGroup());
    }
  }

  @Test
  public void testGrouping_BalanceSeeds() {
    GroupOptions groupOptions = new GroupOptions(true, 2, true, true, false, false, 0);
    com.antigravity.models.Race gModel =
        new com.antigravity.models.Race.Builder()
            .from(raceModel)
            .withGroupOptions(groupOptions)
            .build();

    List<Lane> lanes4 = new ArrayList<>();
    lanes4.add(new Lane("Blue", "blue", 1));
    lanes4.add(new Lane("Red", "red", 2));
    lanes4.add(new Lane("White", "white", 3));
    lanes4.add(new Lane("Yellow", "yellow", 4));
    Track track4 = new Track.Builder().name("T4").lanes(lanes4).build();

    List<RaceParticipant> p8 = createParticipantList(8);

    com.antigravity.race.Race gRace =
        new com.antigravity.race.Race.Builder()
            .model(gModel)
            .drivers(p8)
            .track(track4)
            .isDemoMode(true)
            .build();

    List<Heat> heats = HeatBuilder.buildHeats(gRace, p8, new ArrayList<>());

    for (Heat heat : heats) {
      if (heat.getGroup() == 0) {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (!dhd.getDriver().getDriver().isEmpty()) {
            int seed = Integer.parseInt(dhd.getDriver().getDriver().getEntityId());
            assertEquals("Balanced seed should be odd in group 0", 1, seed % 2);
          }
        }
      } else {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (!dhd.getDriver().getDriver().isEmpty()) {
            int seed = Integer.parseInt(dhd.getDriver().getDriver().getEntityId());
            assertEquals("Balanced seed should be even in group 1", 0, seed % 2);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Heat Reset & Progression Tests
  // -------------------------------------------------------------

  @Test
  public void testHeatRecordResetOnHeatChange() {
    testRace.injectProtocols(mock(ProtocolDelegate.class));
    testRace.changeState(new Racing());
    testRace.getCurrentHeat().getDrivers().get(0).setReactionTime(0.5);
    testRace.onLap(0, 1.5, 0, 0);

    assertEquals(2.0, testRace.getRecordData().getCurrent().getHeatFastestLap().getValue(), 0.001);

    Heat nextHeat = new Heat(2, new ArrayList<>(), new HeatScoring(), false);
    testRace.setCurrentHeat(nextHeat);

    assertEquals(
        "Heat record should be reset to 0",
        0.0,
        testRace.getRecordData().getCurrent().getHeatFastestLap().getValue(),
        0.001);
    assertEquals(
        "Heat record holder should be empty",
        "",
        testRace.getRecordData().getCurrent().getHeatFastestLap().getHolderName());
    assertEquals(
        "Race record should be preserved",
        2.0,
        testRace.getRecordData().getCurrent().getFastestLap().getValue(),
        0.001);
  }

  @Test
  public void testTimedRaceProgress() throws InterruptedException {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    Heat mockHeat = mock(Heat.class);
    HeatExecutionManager mockExecution = mock(HeatExecutionManager.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockRace.getHeatExecutionManager()).thenReturn(mockExecution);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

    HeatScoring timedScoring = new HeatScoring(FinishMethod.Timed, 60L, null, null, null);
    com.antigravity.models.Race m =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withHeatScoring(timedScoring)
            .build();
    when(mockRace.getRaceModel()).thenReturn(m);

    final float[] raceTime = {60.0f};
    when(mockRace.getRaceTime()).thenAnswer(invocation -> raceTime[0]);

    Racing racing = new Racing();
    racing.enter(mockRace);

    Thread.sleep(150);
    verify(mockRace, atLeastOnce()).setHeatProgress(0.0);

    raceTime[0] = 30.0f;
    Thread.sleep(150);
    verify(mockRace, atLeastOnce()).setHeatProgress(0.5);

    raceTime[0] = 0.0f;
    Thread.sleep(150);
    verify(mockRace, atLeastOnce()).setHeatProgress(1.0);

    racing.exit(mockRace);
  }

  @Test
  public void testLapBasedRaceProgress() throws InterruptedException {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    Heat mockHeat = mock(Heat.class);
    HeatExecutionManager mockExecution = mock(HeatExecutionManager.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockRace.getHeatExecutionManager()).thenReturn(mockExecution);
    when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
    when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

    HeatScoring lapScoring = new HeatScoring(FinishMethod.Lap, 10L, null, null, null);
    com.antigravity.models.Race m =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withHeatScoring(lapScoring)
            .build();
    when(mockRace.getRaceModel()).thenReturn(m);

    DriverHeatData d1 = mock(DriverHeatData.class);
    final int[] lapCount = {0};
    when(d1.getLapCount()).thenAnswer(invocation -> lapCount[0]);
    when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

    Racing racing = new Racing();
    racing.enter(mockRace);

    Thread.sleep(150);
    verify(mockRace, atLeastOnce()).setHeatProgress(0.0);

    lapCount[0] = 5;
    Thread.sleep(150);
    verify(mockRace, atLeastOnce()).setHeatProgress(0.5);

    lapCount[0] = 10;
    Thread.sleep(150);
    verify(mockRace, atLeastOnce()).setHeatProgress(1.0);

    racing.exit(mockRace);
  }

  private ModifyHeatsRequest createRequest(List<RaceParticipant> participants, List<Heat> heats) {
    ModifyHeatsRequest.Builder builder = ModifyHeatsRequest.newBuilder();
    for (RaceParticipant p : participants) {
      builder.addParticipants(RaceParticipantConverter.toProto(p, new HashSet<>()));
    }
    for (Heat h : heats) {
      builder.addHeats(HeatConverter.toProto(h, new HashSet<>()));
    }
    return builder.build();
  }

  private List<RaceParticipant> createParticipantList(int count) {
    List<RaceParticipant> list = new ArrayList<>();
    for (int i = 1; i <= count; i++) {
      list.add(
          new RaceParticipant(
              new Driver(
                  "D" + i,
                  "d" + i,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  String.valueOf(i),
                  null)));
    }
    return list;
  }
}
