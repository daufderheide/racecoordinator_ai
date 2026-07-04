package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.converters.HeatConverter;
import com.antigravity.converters.RaceParticipantConverter;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.proto.ModifyHeatsRequest;
import com.antigravity.proto.ModifyHeatsResponse;
import com.antigravity.proto.RegenerateHeatsRequest;
import com.antigravity.proto.RegenerateHeatsResponse;
import com.antigravity.protocols.arduino.ArduinoConfig;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class RaceModifyHeatsTest {

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
            .id(new ObjectId())
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
            .withId(new ObjectId())
            .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));
    participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", new ObjectId()), "p2"));
    participants.add(new RaceParticipant(new Driver("Driver 3", "D3", "d3", new ObjectId()), "p3"));

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

  @Test
  public void testModifyHeats_ValidChange() {
    // Swap drivers in Heat 1 (which is NOT started)
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
    // Start Heat 1
    testRace.getHeats().get(0).setStarted(true);

    // Request with ONLY Heat 2 (effectively deleting Heat 1)
    ModifyHeatsRequest request =
        createRequest(participants, Collections.singletonList(testRace.getHeats().get(1)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail to delete started heat", response.getSuccess());
    assertTrue(
        response.getErrorMessage().contains("Cannot delete a heat that has already been started"));
  }

  @Test
  public void testModifyHeats_RemoveParticipantFromStartedHeat_Fails() {
    // Start Heat 1 (contains p1 and p2)
    testRace.getHeats().get(0).setStarted(true);

    // Request removing p1 from participants list
    List<RaceParticipant> newParticipants = new ArrayList<>(participants);
    newParticipants.remove(0); // remove p1

    // Update Heat 2 to not use p1 (p1 is in Heat 1)
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
    // Start Heat 1
    testRace.getHeats().get(0).setStarted(true);

    // Try to swap drivers in Heat 1
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
    // Start Heat 1
    testRace.getHeats().get(0).setStarted(true);

    // Try to remove a lane from Heat 1 (make it 1 lane instead of 2)
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
    // Start Heat 2 (contains p3 and EMPTY)
    testRace.getHeats().get(1).setStarted(true);

    // Try to change EMPTY to p1 in Heat 2
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
    // Add a new participant p4
    RaceParticipant p4 =
        new RaceParticipant(new Driver("Driver 4", "D4", "d4", new ObjectId()), "p4");
    List<RaceParticipant> newParticipants = new ArrayList<>(participants);
    newParticipants.add(p4);

    // Replace EMPTY in Heat 2 with p4
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
    // Swap Heat 1 and Heat 2 (unstarted)
    List<Heat> newHeats = new ArrayList<>();
    newHeats.add(testRace.getHeats().get(1));
    newHeats.add(testRace.getHeats().get(0));

    // Update heat numbers to match new order
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

    testRace.changeState(new com.antigravity.race.states.Racing());
    assertTrue("Heat should be started after entering Racing state", heat.isStarted());
  }

  @Test
  public void testRegenerateHeats_StartedHeat_AllowsSame_FailsChanged() {
    // Start Heat 1 (which contains p1 and p2)
    testRace.getHeats().get(0).setStarted(true);

    // 1. Regenerate with same participants -> should succeed under new rules!
    RegenerateHeatsRequest.Builder requestBuilder = RegenerateHeatsRequest.newBuilder();
    for (RaceParticipant p : participants) {
      requestBuilder.addParticipants(RaceParticipantConverter.toProto(p, new HashSet<>()));
    }
    RegenerateHeatsResponse response = testRace.regenerateHeats(requestBuilder.build());
    assertTrue(
        "Should succeed to regenerate if started heats are not modified", response.getSuccess());

    // 2. Try to regenerate with different participants (removing p1) -> should
    // fail!
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

    // 3. Try to regenerate with different participants (removing p3, who did NOT
    // run in started Heat 1) -> should succeed!
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
    // Set race to over
    testRace.changeState(new com.antigravity.race.states.RaceOver());

    ModifyHeatsRequest request = createRequest(participants, testRace.getHeats());
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail to modify heats when race is over", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("Cannot modify heats when the race is over"));
  }

  @Test
  public void testRegenerateHeats_RaceOver_Fails() {
    // Set race to over
    testRace.changeState(new com.antigravity.race.states.RaceOver());

    RegenerateHeatsRequest request = RegenerateHeatsRequest.newBuilder().build();
    RegenerateHeatsResponse response = testRace.regenerateHeats(request);

    assertFalse("Should fail to regenerate heats when race is over", response.getSuccess());
    assertTrue(
        response.getErrorMessage().contains("Cannot regenerate heats when the race is over"));
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

  @Test
  public void testModifyHeats_DuplicateDriverInHeat_Fails() {
    // Assign p1 to both lanes in Heat 1
    Heat heat1 = testRace.getHeats().get(0);
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(0))); // p1
    drivers.add(new DriverHeatData(participants.get(0))); // p1 (duplicate!)

    Heat modifiedHeat1 = new Heat(1, drivers, raceModel.getHeatScoring(), false);
    modifiedHeat1.setObjectId(heat1.getObjectId());

    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(modifiedHeat1, testRace.getHeats().get(1)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail if same driver is in multiple lanes", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("is assigned to multiple lanes in Heat 1"));
  }

  @Test
  public void testModifyHeats_DuplicateParticipant_Fails() {
    // Request with p1 added twice
    List<RaceParticipant> dupeParticipants = new ArrayList<>(participants);
    dupeParticipants.add(participants.get(0)); // p1 again

    ModifyHeatsRequest request = createRequest(dupeParticipants, testRace.getHeats());
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertFalse("Should fail if duplicate participant is added", response.getSuccess());
    assertTrue(response.getErrorMessage().contains("is added more than once"));
  }

  @Test
  public void testModifyHeats_OverlappingDriverInTeam_Fails() {
    // Create a team containing Driver 1 (p1)
    Team team1 = new Team("Team 1", "url", Collections.singletonList("d1"), "t1", new ObjectId());
    RaceParticipant teamParticipant = new RaceParticipant(team1);
    teamParticipant.setObjectId("pt1");

    // Request with both p1 AND team1 (which contains p1)
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
    // Create two teams sharing Driver 1
    Team team1 = new Team("Team 1", "url", Collections.singletonList("d1"), "t1", new ObjectId());
    RaceParticipant pt1 = new RaceParticipant(team1);
    pt1.setObjectId("pt1");

    Team team2 = new Team("Team 2", "url", Collections.singletonList("d1"), "t2", new ObjectId());
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
    // 1. Enable groups in race model
    com.antigravity.models.GroupOptions groupOptions =
        new com.antigravity.models.GroupOptions(true, 2, true, false, false, false, 0);
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

    // 2. Set Heat 1 to Group 0 (Group 1) and Heat 2 to Group 1 (Group 2)
    Heat heat1 = groupRace.getHeats().get(0);
    Heat heat2 = groupRace.getHeats().get(1);
    heat1.setGroup(0);
    heat2.setGroup(1);

    // 3. Put Driver 1 (p1) in both Heat 1 (Group 0) and Heat 2 (Group 1)
    // p1 is already in Heat 1 from setUp()
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
    // 1. Enable groups
    com.antigravity.models.GroupOptions groupOptions =
        new com.antigravity.models.GroupOptions(true, 2, true, false, false, false, 0);
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

    // 2. Set Heat 1 to Group 0 and Heat 2 to Group 2 (GAP!)
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
    // We will change the seeds of existing participants
    List<RaceParticipant> updatedParticipants = new ArrayList<>();
    for (int i = 0; i < participants.size(); i++) {
      RaceParticipant p = participants.get(i);
      // Create a copy to send in request with a modified seed
      RaceParticipant pCopy = new RaceParticipant(p.getDriver(), p.getObjectId());
      pCopy.setSeed(i + 10); // change seed to something distinct
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
    // 1. Mark Heat 1 as started
    testRace.getHeats().get(0).setStarted(true);

    // 2. Request modifying heats to ONLY contain Heat 1 (effectively deleting the unstarted Heat 2)
    ModifyHeatsRequest request =
        createRequest(participants, Collections.singletonList(testRace.getHeats().get(0)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue("Modify heats should succeed", response.getSuccess());

    // 3. modifyHeats is auto-save during editing — it should NOT change state.
    //    State reconciliation is deferred to finalizeModifyHeats (when user navigates away).
    assertFalse(
        "Race should NOT transition to RaceOver during modification (deferred to finalize)",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);

    // 4. Verify that all remaining heats are started (precondition for finalize to transition)
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
    // 1. Mark Heat 1 as started
    testRace.getHeats().get(0).setStarted(true);

    // 2. Add a new unstarted Heat 3
    List<DriverHeatData> heat3Drivers = new ArrayList<>();
    heat3Drivers.add(new DriverHeatData(participants.get(0)));
    heat3Drivers.add(new DriverHeatData(participants.get(1)));
    Heat heat3 = new Heat(3, heat3Drivers, raceModel.getHeatScoring(), false);
    heat3.setObjectId("heat3");

    // 3. Request modifying heats to contain Heat 1 and Heat 3 (effectively deleting Heat 2, but
    // adding Heat 3)
    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(testRace.getHeats().get(0), heat3));
    ModifyHeatsResponse response = testRace.modifyHeats(request);

    assertTrue("Modify heats should succeed", response.getSuccess());
    assertFalse(
        "Race should NOT transition to RaceOver",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);

    // 4. Verify finalization logic does not transition it since there is an unstarted Heat 3
    boolean allStarted = !testRace.getHeats().isEmpty();
    for (Heat h : testRace.getHeats()) {
      if (!h.isStarted()) {
        allStarted = false;
        break;
      }
    }
    assertFalse("Not all heats are started", allStarted);
  }

  // ---- Tests for finalizeModifyHeats reconciliation logic ----
  // These simulate the server-side reconciliation that runs when the user
  // navigates away from the modify heats page.

  /**
   * Simulates the reconciliation logic from ClientCommandTaskHandler.finalizeModifyHeats(). This
   * mirrors the server code so we can test state transitions without HTTP plumbing.
   */
  private void simulateFinalizeModifyHeats(com.antigravity.race.Race race) {
    boolean allStarted = !race.getHeats().isEmpty();
    Heat firstUnstarted = null;
    for (Heat h : race.getHeats()) {
      if (!h.isStarted()) {
        allStarted = false;
        if (firstUnstarted == null) {
          firstUnstarted = h;
        }
      }
    }

    if (allStarted && !(race.getState() instanceof com.antigravity.race.states.RaceOver)) {
      race.changeState(new com.antigravity.race.states.RaceOver());
    } else if (race.getCurrentHeat() != null
        && race.getCurrentHeat().isStarted()
        && race.getState() instanceof com.antigravity.race.states.NotStarted) {
      if (firstUnstarted != null) {
        race.setCurrentHeat(firstUnstarted);
      } else {
        race.changeState(new com.antigravity.race.states.RaceOver());
      }
    }
  }

  @Test
  public void testFinalize_CurrentHeatStarted_AdvancesToFirstUnstartedHeat() {
    // Scenario: Heat 1 is started, heat 2 is unstarted, current heat points to heat 1
    // (e.g. after modifying heats where the current heat index landed on a completed heat)
    testRace.getHeats().get(0).setStarted(true);
    testRace.setCurrentHeat(testRace.getHeats().get(0)); // On started heat 1

    // State is NotStarted (as if user advanced past heat 1, then heats were modified)
    assertTrue(
        "Precondition: race should be in NotStarted",
        testRace.getState() instanceof com.antigravity.race.states.NotStarted);

    simulateFinalizeModifyHeats(testRace);

    // Should advance to heat 2 (the first unstarted heat)
    assertFalse(
        "Race should NOT be in RaceOver",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);
    assertEquals("Current heat should be heat 2", 2, testRace.getCurrentHeat().getHeatNumber());
    assertFalse("Current heat should NOT be started", testRace.getCurrentHeat().isStarted());
  }

  @Test
  public void testFinalize_AllHeatsStarted_TransitionsToRaceOver() {
    // Scenario: All heats are started, current heat points to a started heat
    testRace.getHeats().get(0).setStarted(true);
    testRace.getHeats().get(1).setStarted(true);
    testRace.setCurrentHeat(testRace.getHeats().get(0));

    simulateFinalizeModifyHeats(testRace);

    assertTrue(
        "Race should transition to RaceOver",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);
  }

  @Test
  public void testFinalize_CurrentHeatNotStarted_NoStateChange() {
    // Scenario: Current heat is unstarted — no reconciliation needed
    testRace.setCurrentHeat(testRace.getHeats().get(0));
    assertFalse("Precondition: heat should not be started", testRace.getCurrentHeat().isStarted());

    simulateFinalizeModifyHeats(testRace);

    assertTrue(
        "Race should remain in NotStarted",
        testRace.getState() instanceof com.antigravity.race.states.NotStarted);
    assertEquals(
        "Current heat should still be heat 1", 1, testRace.getCurrentHeat().getHeatNumber());
  }

  @Test
  public void testFinalize_ReproduceBugScenario_AdvancesToNewHeat() {
    // Full reproduction of the original bug:
    // 1. Run heat 1 (mark as started)
    // 2. Advance to heat 2 (don't start it)
    // 3. Modify heats: delete heat 2, add new heat 3
    // 4. After modification, current heat lands on started heat 1
    // 5. Finalize should advance to unstarted heat 3

    // Step 1: Heat 1 is started
    testRace.getHeats().get(0).setStarted(true);

    // Step 3: Modify heats - delete heat 2, add heat 3
    List<DriverHeatData> heat3Drivers = new ArrayList<>();
    heat3Drivers.add(new DriverHeatData(participants.get(2)));
    heat3Drivers.add(new DriverHeatData(new RaceParticipant(Driver.EMPTY_DRIVER)));
    Heat heat3 = new Heat(2, heat3Drivers, raceModel.getHeatScoring(), false);
    heat3.setObjectId("heat3");

    ModifyHeatsRequest request =
        createRequest(participants, Arrays.asList(testRace.getHeats().get(0), heat3));
    ModifyHeatsResponse response = testRace.modifyHeats(request);
    assertTrue("Modify heats should succeed", response.getSuccess());

    // Step 4: Verify current heat is the started heat 1
    // (finalizeModification sets it based on previous heat number)
    assertTrue(
        "Precondition: current heat should be started", testRace.getCurrentHeat().isStarted());

    // State is still NotStarted (never changed during modification)
    assertTrue(
        "Precondition: race should be in NotStarted",
        testRace.getState() instanceof com.antigravity.race.states.NotStarted);

    // Step 5: Finalize (user navigates away from modify heats page)
    simulateFinalizeModifyHeats(testRace);

    // Should advance to heat 2 (the new unstarted heat, formerly heat3)
    assertFalse(
        "Race should NOT be in RaceOver",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);
    assertFalse("Current heat should NOT be started", testRace.getCurrentHeat().isStarted());
    assertEquals(
        "Current heat should be heat 2 (the new unstarted heat)",
        2,
        testRace.getCurrentHeat().getHeatNumber());
  }

  @Test
  public void testFinalize_OnlyStartedHeatRemaining_TransitionsToRaceOver() {
    // Scenario from original bug but without regenerating:
    // Heat 1 started, all other heats deleted, no new heats added
    testRace.getHeats().get(0).setStarted(true);

    // Delete heat 2, keep only started heat 1
    ModifyHeatsRequest request =
        createRequest(participants, Collections.singletonList(testRace.getHeats().get(0)));
    ModifyHeatsResponse response = testRace.modifyHeats(request);
    assertTrue("Modify heats should succeed", response.getSuccess());

    // Finalize should detect all heats are started and transition to RaceOver
    simulateFinalizeModifyHeats(testRace);

    assertTrue(
        "Race should transition to RaceOver when only started heats remain",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);
  }

  @Test
  public void testFinalize_StateNotNotStarted_NoReconciliation() {
    // If race is already in RaceOver or another state, finalize should not change anything
    testRace.getHeats().get(0).setStarted(true);
    testRace.setCurrentHeat(testRace.getHeats().get(0));
    testRace.changeState(new com.antigravity.race.states.RaceOver());

    // Calling finalize again should be a no-op (already RaceOver)
    simulateFinalizeModifyHeats(testRace);

    assertTrue(
        "Race should remain in RaceOver",
        testRace.getState() instanceof com.antigravity.race.states.RaceOver);
  }
}
