package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Race;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Before;
import org.junit.Test;

public class RaceHeatTaskHandlerTest {

  private DatabaseContext mockDbCtx;
  private Javalin mockJavalin;
  private RaceHeatTaskHandler handler;

  @Before
  public void setUp() {
    mockDbCtx = mock(DatabaseContext.class);
    mockJavalin = mock(Javalin.class);
    handler = new RaceHeatTaskHandler(mockDbCtx, mockJavalin);
  }

  @Test
  public void testRouteRegistration() {
    verify(mockJavalin).get(eq("/api/races"), any(), eq(Role.VIEWER));
    verify(mockJavalin).post(eq("/api/races"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).post(eq("/api/races/{id}/copy"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).put(eq("/api/races/{id}"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).delete(eq("/api/races/{id}"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).post(eq("/api/races/{id}/reset-records"), any(), eq(Role.ADMIN));
    verify(mockJavalin).post(eq("/api/races/{id}/generate-heats"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).post(eq("/api/heats/preview"), any(), eq(Role.DIRECTOR));
  }

  @Test
  public void testHandleResetRace_RaceNotFound_Returns404() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("nonexistent");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    handler.handleResetRace(mockCtx);

    verify(mockCtx).status(404);
  }

  @Test(expected = IllegalArgumentException.class)
  public void testValidateRace_CustomRoundRobinWithoutSequence_ThrowsException() {
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withHeatRotationType(HeatRotationType.CustomRoundRobin)
            .build();
    handler.validateRace(race);
  }

  @Test
  public void testValidateRace_StandardRotation_Success() {
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withHeatRotationType(HeatRotationType.EuropeanRoundRobin)
            .build();
    handler.validateRace(race);
  }

  @Test(expected = IllegalArgumentException.class)
  public void testValidateRace_StepUpNegative_ThrowsException() {
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withHeatRotationType(HeatRotationType.EuropeanRoundRobin)
            .withStepUp(-1)
            .build();
    handler.validateRace(race);
  }

  @Test(expected = IllegalArgumentException.class)
  public void testValidateRace_StepUpExceedsLanesMinusOne_ThrowsException() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_stepup_val").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    lanes.add(new com.antigravity.models.Lane("red", "black", 100));
    lanes.add(new com.antigravity.models.Lane("blue", "white", 101));
    lanes.add(new com.antigravity.models.Lane("green", "yellow", 102));
    lanes.add(new com.antigravity.models.Lane("orange", "purple", 103));
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("4-Lane Track")
            .lanes(lanes)
            .entityId("track_4lanes")
            .build();
    new com.antigravity.repository.SqliteRepository<>(
            dbCtx, "tracks", com.antigravity.models.Track.class)
        .insert(track);

    Race race =
        new Race.Builder()
            .withName("Test Step Up Race")
            .withTrackEntityId("track_4lanes")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withStepUp(4) // 4 lanes -> max step-up is 3. 4 is invalid!
            .build();
    realHandler.validateRace(race);
  }

  @Test
  public void testValidateRace_StepUpValid_Success() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_stepup_val_ok").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    lanes.add(new com.antigravity.models.Lane("red", "black", 100));
    lanes.add(new com.antigravity.models.Lane("blue", "white", 101));
    lanes.add(new com.antigravity.models.Lane("green", "yellow", 102));
    lanes.add(new com.antigravity.models.Lane("orange", "purple", 103));
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("4-Lane Track")
            .lanes(lanes)
            .entityId("track_4lanes")
            .build();
    new com.antigravity.repository.SqliteRepository<>(
            dbCtx, "tracks", com.antigravity.models.Track.class)
        .insert(track);

    Race race =
        new Race.Builder()
            .withName("Test Step Up Race")
            .withTrackEntityId("track_4lanes")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withStepUp(3) // 4 lanes -> max step-up is 3. 3 is valid!
            .build();
    realHandler.validateRace(race);
  }

  @Test
  public void testPreviewHeats_StepUpExceedsLanesMinusOne_Returns400() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_stepup_preview").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    lanes.add(new com.antigravity.models.Lane("red", "black", 100));
    lanes.add(new com.antigravity.models.Lane("blue", "white", 101));
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("2-Lane Track")
            .lanes(lanes)
            .entityId("track_2lanes")
            .build();
    new com.antigravity.repository.SqliteRepository<>(
            dbCtx, "tracks", com.antigravity.models.Track.class)
        .insert(track);

    Context mockCtx = mock(Context.class);
    Map<String, Object> body = new HashMap<>();
    body.put("driverCount", 4);
    body.put("trackId", "track_2lanes");
    body.put("heatRotationType", "RoundRobin");
    body.put("stepUp", 2); // 2 lanes -> max step-up is 1. 2 exceeds max!
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    when(mockCtx.status(400)).thenReturn(mockCtx);

    realHandler.previewHeats(mockCtx);

    verify(mockCtx).status(400);
  }

  @Test
  public void testPreviewHeats_InvalidDriverCount_Returns400() {
    Context mockCtx = mock(Context.class);
    Map<String, Object> body = new HashMap<>();
    body.put("driverCount", 0);
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    when(mockCtx.status(400)).thenReturn(mockCtx);

    handler.previewHeats(mockCtx);

    verify(mockCtx).status(400);
  }

  @Test
  public void testParseCustomRotations_ValidRawList() {
    List<Map<String, Object>> rawList = new ArrayList<>();
    Map<String, Object> rot1 = new HashMap<>();
    rot1.put("numDrivers", 4);
    rot1.put("description", "4-Driver Test");
    rawList.add(rot1);

    List<com.antigravity.models.CustomRotation> result = handler.parseCustomRotations(rawList);
    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals("4-Driver Test", result.get(0).getDescription());
  }

  @org.junit.Rule
  public org.junit.rules.TemporaryFolder tempFolder = new org.junit.rules.TemporaryFolder();

  @Test
  public void testRaceCrudWithRealDatabase() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_race").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      // 1. Create Track for Race
      com.antigravity.repository.SqliteRepository<com.antigravity.models.Track> trackRepo =
          new com.antigravity.repository.SqliteRepository<>(
              dbCtx, "tracks", com.antigravity.models.Track.class);
      com.antigravity.models.Track track =
          new com.antigravity.models.Track.Builder()
              .name("Main Track")
              .entityId("t1")
              .lanes(
                  java.util.Arrays.asList(
                      new com.antigravity.models.Lane("#FFFFFF", "#FF0000", 50),
                      new com.antigravity.models.Lane("#FFFFFF", "#00FF00", 50)))
              .build();
      trackRepo.insert(track);

      // 2. Create Race
      Context ctxCreate = mock(Context.class);
      when(ctxCreate.body())
          .thenReturn(
              "{\"name\":\"Formula 1\",\"track_entity_id\":\"t1\",\"heat_rotation_type\":\"RoundRobin\",\"theme_id\":\"practice_theme_rc_ai\",\"entity_id\":\"new\"}");
      when(ctxCreate.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctxCreate);
      realHandler.handleCreateRace(ctxCreate);
      verify(ctxCreate).status(201);
      com.antigravity.repository.SqliteRepository<Race> raceRepo =
          new com.antigravity.repository.SqliteRepository<>(dbCtx, "races", Race.class);
      org.junit.Assert.assertEquals(
          "practice_theme_rc_ai", raceRepo.findByEntityId("1").getThemeId());

      // 3. Get Races
      Context ctxGet = mock(Context.class);
      realHandler.getRaces(ctxGet);
      verify(ctxGet).json(org.mockito.ArgumentMatchers.any());

      // 4. Update Race
      Context ctxUpdate = mock(Context.class);
      when(ctxUpdate.pathParam("id")).thenReturn("1");
      when(ctxUpdate.body())
          .thenReturn(
              "{\"name\":\"Formula 1 World Championship\",\"track_entity_id\":\"t1\",\"heat_rotation_type\":\"RoundRobin\",\"theme_id\":\"default_classic_rc_ai\",\"entity_id\":\"1\"}");
      realHandler.handleUpdateRace(ctxUpdate);
      verify(ctxUpdate).json(org.mockito.ArgumentMatchers.any());
      org.junit.Assert.assertEquals(
          "default_classic_rc_ai", raceRepo.findByEntityId("1").getThemeId());

      // 5. Generate Heats
      Context ctxGen = mock(Context.class);
      when(ctxGen.pathParam("id")).thenReturn("1");
      Map<String, Number> genBody = new HashMap<>();
      genBody.put("driverCount", 4);
      when(ctxGen.bodyAsClass(Map.class)).thenReturn(genBody);
      realHandler.generateHeats(ctxGen);
      verify(ctxGen).json(org.mockito.ArgumentMatchers.any());

      // 6. Reset Race
      Context ctxReset = mock(Context.class);
      when(ctxReset.pathParam("id")).thenReturn("1");
      when(ctxReset.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctxReset);
      realHandler.handleResetRace(ctxReset);
      verify(ctxReset).status(204);

      // 7. Preview Heats
      Context ctxPreview = mock(Context.class);
      Map<String, Object> prevBody = new HashMap<>();
      prevBody.put("driverCount", 4);
      prevBody.put("trackId", "t1");
      prevBody.put("rotationType", "RoundRobin");
      when(ctxPreview.bodyAsClass(Map.class)).thenReturn(prevBody);
      realHandler.previewHeats(ctxPreview);
      verify(ctxPreview).json(org.mockito.ArgumentMatchers.any());

      // 8. Delete Race
      Context ctxDelete = mock(Context.class);
      when(ctxDelete.pathParam("id")).thenReturn("1");
      when(ctxDelete.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctxDelete);
      realHandler.handleDeleteRace(ctxDelete);
      verify(ctxDelete).status(204);
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @SuppressWarnings("unchecked")
  @Test
  public void testPreviewHeats_CustomRoundRobin_FewerDriversThanTrackLanes() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_preview").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_preview_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      com.antigravity.repository.SqliteRepository<com.antigravity.models.Track> trackRepo =
          new com.antigravity.repository.SqliteRepository<>(
              dbCtx, "tracks", com.antigravity.models.Track.class);
      List<com.antigravity.models.Lane> sixLanes = new ArrayList<>();
      for (int i = 1; i <= 6; i++) {
        sixLanes.add(new com.antigravity.models.Lane("#FFFFFF", "#000000", i));
      }
      com.antigravity.models.Track track =
          new com.antigravity.models.Track.Builder()
              .name("6-Lane Track")
              .entityId("t6")
              .lanes(sixLanes)
              .build();
      trackRepo.insert(track);

      Context ctxPreview = mock(Context.class);
      Map<String, Object> prevBody = new HashMap<>();
      prevBody.put("driverCount", 4);
      prevBody.put("trackId", "t6");
      prevBody.put("rotationType", "CustomRoundRobin");
      prevBody.put("customRotationSequence", java.util.Arrays.asList(2, 3, 4, 5));
      when(ctxPreview.bodyAsClass(Map.class)).thenReturn(prevBody);

      org.mockito.ArgumentCaptor<Map> captor = org.mockito.ArgumentCaptor.forClass(Map.class);
      realHandler.previewHeats(ctxPreview);
      verify(ctxPreview).json(captor.capture());

      Map response = captor.getValue();
      assertNotNull(response);
      List<Map<String, Object>> heats = (List<Map<String, Object>>) response.get("heats");
      org.junit.Assert.assertEquals(4, heats.size());

      // Heat 1: L1=0, L2=1, L3=2, L4=3, L5=4, L6=0
      List<Map<String, Object>> h1Lanes = (List<Map<String, Object>>) heats.get(0).get("lanes");
      org.junit.Assert.assertEquals(0, h1Lanes.get(0).get("driverNumber"));
      org.junit.Assert.assertEquals(1, h1Lanes.get(1).get("driverNumber"));
      org.junit.Assert.assertEquals(2, h1Lanes.get(2).get("driverNumber"));
      org.junit.Assert.assertEquals(3, h1Lanes.get(3).get("driverNumber"));
      org.junit.Assert.assertEquals(4, h1Lanes.get(4).get("driverNumber"));
      org.junit.Assert.assertEquals(0, h1Lanes.get(5).get("driverNumber"));

      // Heat 2: L1=0, L2=4, L3=1, L4=2, L5=3, L6=0
      List<Map<String, Object>> h2Lanes = (List<Map<String, Object>>) heats.get(1).get("lanes");
      org.junit.Assert.assertEquals(0, h2Lanes.get(0).get("driverNumber"));
      org.junit.Assert.assertEquals(4, h2Lanes.get(1).get("driverNumber"));
      org.junit.Assert.assertEquals(1, h2Lanes.get(2).get("driverNumber"));
      org.junit.Assert.assertEquals(2, h2Lanes.get(3).get("driverNumber"));
      org.junit.Assert.assertEquals(3, h2Lanes.get(4).get("driverNumber"));
      org.junit.Assert.assertEquals(0, h2Lanes.get(5).get("driverNumber"));
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testPreviewHeats_StepUp_ValidatesAndGenerates() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_stepup_prev").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_stepup_prev_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      com.antigravity.repository.SqliteRepository<com.antigravity.models.Track> trackRepo =
          new com.antigravity.repository.SqliteRepository<>(
              dbCtx, "tracks", com.antigravity.models.Track.class);
      List<com.antigravity.models.Lane> fourLanes = new ArrayList<>();
      for (int i = 1; i <= 4; i++) {
        fourLanes.add(new com.antigravity.models.Lane("#FFFFFF", "#000000", i));
      }
      com.antigravity.models.Track track =
          new com.antigravity.models.Track.Builder()
              .name("4-Lane Track")
              .entityId("t4")
              .lanes(fourLanes)
              .build();
      trackRepo.insert(track);

      Context ctxPreview = mock(Context.class);
      Map<String, Object> prevBody = new HashMap<>();
      prevBody.put("driverCount", 5);
      prevBody.put("trackId", "t4");
      prevBody.put("rotationType", "RoundRobin");
      prevBody.put("stepUp", 1);
      when(ctxPreview.bodyAsClass(Map.class)).thenReturn(prevBody);

      org.mockito.ArgumentCaptor<Map> captor = org.mockito.ArgumentCaptor.forClass(Map.class);
      realHandler.previewHeats(ctxPreview);
      verify(ctxPreview).json(captor.capture());

      Map response = captor.getValue();
      assertNotNull(response);
      List<Map<String, Object>> heats = (List<Map<String, Object>>) response.get("heats");
      assertNotNull(heats);
      org.junit.Assert.assertFalse(heats.isEmpty());

      boolean hasStep1 = false;
      boolean hasStep2 = false;
      for (Map<String, Object> h : heats) {
        Number step = (Number) h.get("step");
        if (step != null && step.intValue() == 1) hasStep1 = true;
        if (step != null && step.intValue() == 2) hasStep2 = true;
      }
      org.junit.Assert.assertTrue(hasStep1);
      org.junit.Assert.assertTrue(hasStep2);
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testDeleteDefaultRace_TracksDeletionAndClearsOnCreate() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_del_race").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_del_race_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      com.antigravity.repository.SqliteRepository<Race> raceRepo =
          new com.antigravity.repository.SqliteRepository<>(dbCtx, "races", Race.class);
      Race practiceRace = new Race.Builder().withName("Practice").withEntityId("race_prac").build();
      Race fuelRace = new Race.Builder().withName("Fuel Race").withEntityId("race_fuel").build();
      raceRepo.insert(practiceRace);
      raceRepo.insert(fuelRace);

      // Delete Practice race
      Context ctxDeletePractice = mock(Context.class);
      when(ctxDeletePractice.pathParam("id")).thenReturn("race_prac");
      when(ctxDeletePractice.status(org.mockito.ArgumentMatchers.anyInt()))
          .thenReturn(ctxDeletePractice);
      realHandler.handleDeleteRace(ctxDeletePractice);
      verify(ctxDeletePractice).status(204);

      org.junit.Assert.assertTrue(dbCtx.isDefaultArtifactDeleted("race", "Practice"));
      org.junit.Assert.assertFalse(dbCtx.isDefaultArtifactDeleted("race", "Fuel Race"));

      // Delete Fuel race
      Context ctxDeleteFuel = mock(Context.class);
      when(ctxDeleteFuel.pathParam("id")).thenReturn("race_fuel");
      when(ctxDeleteFuel.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctxDeleteFuel);
      realHandler.handleDeleteRace(ctxDeleteFuel);
      verify(ctxDeleteFuel).status(204);

      org.junit.Assert.assertTrue(dbCtx.isDefaultArtifactDeleted("race", "Fuel Race"));

      // Recreate practice race -> clears deletion marker
      Race newPractice =
          new Race.Builder().withName("Practice").withEntityId("race_prac_new").build();
      realHandler.createRace(newPractice);
      org.junit.Assert.assertFalse(dbCtx.isDefaultArtifactDeleted("race", "Practice"));
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testValidateRace_WithCustomRotationResolvedByName() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_custom_rot").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      // 1. Create a 4-lane track
      com.antigravity.repository.SqliteRepository<com.antigravity.models.Track> trackRepo =
          new com.antigravity.repository.SqliteRepository<>(
              dbCtx, "tracks", com.antigravity.models.Track.class);
      com.antigravity.models.Track track =
          new com.antigravity.models.Track.Builder()
              .name("4 Lane Track")
              .entityId("track_4_lane")
              .lanes(
                  java.util.Arrays.asList(
                      new com.antigravity.models.Lane("#FFFFFF", "#FF0000", 50),
                      new com.antigravity.models.Lane("#FFFFFF", "#00FF00", 50),
                      new com.antigravity.models.Lane("#FFFFFF", "#0000FF", 50),
                      new com.antigravity.models.Lane("#FFFFFF", "#FFFF00", 50)))
              .build();
      trackRepo.insert(track);

      // 2. Save Custom Rotation asset with name "Llany Rotations"
      com.antigravity.service.AssetService assetService =
          new com.antigravity.service.AssetService(
              dbCtx,
              java.nio.file.Paths.get(dbCtx.getDataRoot(), dbCtx.getCurrentDatabaseName(), "assets")
                  .toString());

      com.antigravity.proto.CustomHeat heat1 =
          com.antigravity.proto.CustomHeat.newBuilder()
              .addAllDriverIndices(java.util.Arrays.asList(1, 2, 3, 4))
              .setGroup(0)
              .build();
      com.antigravity.proto.CustomRotation rot1 =
          com.antigravity.proto.CustomRotation.newBuilder()
              .setNumDrivers(4)
              .addHeats(heat1)
              .build();

      assetService.saveCustomRotation(
          "llany-rot-uuid", "Llany Rotations", 4, java.util.Collections.singletonList(rot1));

      // 3. Test resolveCustomRotations with "Llany Rotations" directly
      List<com.antigravity.models.CustomRotation> resolved =
          realHandler.resolveCustomRotations("Llany Rotations");
      org.junit.Assert.assertNotNull(resolved);
      org.junit.Assert.assertEquals(1, resolved.size());
      org.junit.Assert.assertEquals(4, resolved.get(0).getNumDrivers());

      // 4. Validate Race referencing custom rotation by name in customRotationAssetId
      Race raceByName =
          new Race.Builder()
              .withName("Custom Rotation Race")
              .withTrackEntityId("track_4_lane")
              .withHeatRotationType(HeatRotationType.Custom)
              .withCustomRotationAssetId("Llany Rotations")
              .build();

      realHandler.validateRace(raceByName);

      // 5. Validate Race referencing custom rotation in customRotationAssetName
      Race raceByNameField =
          new Race.Builder()
              .withName("Custom Rotation Race 2")
              .withTrackEntityId("track_4_lane")
              .withHeatRotationType(HeatRotationType.Custom)
              .withCustomRotationAssetName("Llany Rotations")
              .build();

      realHandler.validateRace(raceByNameField);

      // 6. Validate Race with completely orphaned asset ID, falling back to track lanes
      Race raceOrphaned =
          new Race.Builder()
              .withName("Custom Rotation Orphaned")
              .withTrackEntityId("track_4_lane")
              .withHeatRotationType(HeatRotationType.Custom)
              .withCustomRotationAssetId("orphaned-uuid-missing")
              .build();

      realHandler.validateRace(raceOrphaned);
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testValidateRace_WithCustomRotationStepUp() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_stepup_custom_rot").getAbsolutePath()
            + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      com.antigravity.repository.SqliteRepository<com.antigravity.models.Track> trackRepo =
          new com.antigravity.repository.SqliteRepository<>(
              dbCtx, "tracks", com.antigravity.models.Track.class);
      com.antigravity.models.Track track =
          new com.antigravity.models.Track.Builder()
              .name("4 Lane Track")
              .entityId("track_4_lane")
              .lanes(
                  java.util.Arrays.asList(
                      new com.antigravity.models.Lane("#FFFFFF", "#FF0000", 50),
                      new com.antigravity.models.Lane("#FFFFFF", "#00FF00", 50),
                      new com.antigravity.models.Lane("#FFFFFF", "#0000FF", 50),
                      new com.antigravity.models.Lane("#FFFFFF", "#FFFF00", 50)))
              .build();
      trackRepo.insert(track);

      com.antigravity.service.AssetService assetService =
          new com.antigravity.service.AssetService(
              dbCtx,
              java.nio.file.Paths.get(dbCtx.getDataRoot(), dbCtx.getCurrentDatabaseName(), "assets")
                  .toString());

      // 1. Valid step-up rotation: Step 1 regular drivers with boundary, Step 2 step-ups
      com.antigravity.proto.CustomHeat validHeat1 =
          com.antigravity.proto.CustomHeat.newBuilder()
              .addAllDriverIndices(java.util.Arrays.asList(1, 2, 3, 4))
              .setGroup(0)
              .setIsStepUpBoundary(true)
              .setStep(1)
              .build();
      com.antigravity.proto.CustomHeat validHeat2 =
          com.antigravity.proto.CustomHeat.newBuilder()
              .addAllDriverIndices(java.util.Arrays.asList(-1, -2, 1, 2))
              .setGroup(0)
              .setIsStepUpBoundary(false)
              .setStep(2)
              .build();
      com.antigravity.proto.CustomRotation validRot =
          com.antigravity.proto.CustomRotation.newBuilder()
              .setNumDrivers(4)
              .addHeats(validHeat1)
              .addHeats(validHeat2)
              .build();
      assetService.saveCustomRotation(
          "valid-stepup-uuid", "Step Up Valid", 4, java.util.Collections.singletonList(validRot));

      Race validRace =
          new Race.Builder()
              .withName("Valid Step Up Race")
              .withTrackEntityId("track_4_lane")
              .withHeatRotationType(HeatRotationType.Custom)
              .withCustomRotationAssetId("valid-stepup-uuid")
              .build();
      realHandler.validateRace(validRace);

      // 2. Invalid step-up rotation: Step-up in Step 1
      com.antigravity.proto.CustomHeat invalidHeat1 =
          com.antigravity.proto.CustomHeat.newBuilder()
              .addAllDriverIndices(java.util.Arrays.asList(-1, 2, 3, 4))
              .setGroup(0)
              .setStep(1)
              .build();
      com.antigravity.proto.CustomRotation invalidRot1 =
          com.antigravity.proto.CustomRotation.newBuilder()
              .setNumDrivers(4)
              .addHeats(invalidHeat1)
              .build();
      assetService.saveCustomRotation(
          "invalid-step1-uuid",
          "Step 1 Step-Up",
          4,
          java.util.Collections.singletonList(invalidRot1));

      Race invalidRace1 =
          new Race.Builder()
              .withName("Invalid Step 1 Race")
              .withTrackEntityId("track_4_lane")
              .withHeatRotationType(HeatRotationType.Custom)
              .withCustomRotationAssetId("invalid-step1-uuid")
              .build();
      try {
        realHandler.validateRace(invalidRace1);
        org.junit.Assert.fail("Expected IllegalArgumentException for step-up in step 1");
      } catch (IllegalArgumentException e) {
        org.junit.Assert.assertEquals("Step-up drivers are not allowed in step 1", e.getMessage());
      }

      // 3. Invalid out-of-range driver index (< -numLanes)
      com.antigravity.proto.CustomHeat invalidHeat2 =
          com.antigravity.proto.CustomHeat.newBuilder()
              .addAllDriverIndices(java.util.Arrays.asList(-5, 1, 2, 3))
              .setGroup(0)
              .setStep(2)
              .build();
      com.antigravity.proto.CustomRotation invalidRot2 =
          com.antigravity.proto.CustomRotation.newBuilder()
              .setNumDrivers(4)
              .addHeats(validHeat1)
              .addHeats(invalidHeat2)
              .build();
      assetService.saveCustomRotation(
          "invalid-range-uuid",
          "Out of Range Step-Up",
          4,
          java.util.Collections.singletonList(invalidRot2));

      Race invalidRace2 =
          new Race.Builder()
              .withName("Invalid Range Race")
              .withTrackEntityId("track_4_lane")
              .withHeatRotationType(HeatRotationType.Custom)
              .withCustomRotationAssetId("invalid-range-uuid")
              .build();
      try {
        realHandler.validateRace(invalidRace2);
        org.junit.Assert.fail("Expected IllegalArgumentException for driver index out of range");
      } catch (IllegalArgumentException e) {
        org.junit.Assert.assertTrue(e.getMessage().contains("Invalid driver index -5"));
      }

      // 4. Custom rotation with driver index greater than rot.getNumDrivers() (e.g. driver 10 with
      // numDrivers 4) is valid
      com.antigravity.proto.CustomHeat validHighDriverHeat =
          com.antigravity.proto.CustomHeat.newBuilder()
              .addAllDriverIndices(java.util.Arrays.asList(10, 9, 8, 0))
              .setGroup(1)
              .setStep(1)
              .setIsStepUpBoundary(true)
              .build();
      com.antigravity.proto.CustomRotation validHighDriverRot =
          com.antigravity.proto.CustomRotation.newBuilder()
              .setNumDrivers(4)
              .addHeats(validHighDriverHeat)
              .build();
      assetService.saveCustomRotation(
          "valid-high-driver-uuid",
          "High Driver Custom Rotation",
          4,
          java.util.Collections.singletonList(validHighDriverRot));

      Race validHighDriverRace =
          new Race.Builder()
              .withName("High Driver Race")
              .withTrackEntityId("track_4_lane")
              .withHeatRotationType(HeatRotationType.Custom)
              .withCustomRotationAssetId("valid-high-driver-uuid")
              .build();
      realHandler.validateRace(validHighDriverRace);

      // 5. Driver index exceeding max limit (e.g. 101) throws exception
      com.antigravity.proto.CustomHeat invalidLimitHeat =
          com.antigravity.proto.CustomHeat.newBuilder()
              .addAllDriverIndices(java.util.Arrays.asList(101, 2, 3, 4))
              .setGroup(1)
              .setStep(2)
              .build();
      com.antigravity.proto.CustomRotation invalidLimitRot =
          com.antigravity.proto.CustomRotation.newBuilder()
              .setNumDrivers(4)
              .addHeats(invalidLimitHeat)
              .build();
      assetService.saveCustomRotation(
          "invalid-limit-uuid",
          "Exceed Limit Rotation",
          4,
          java.util.Collections.singletonList(invalidLimitRot));

      Race invalidLimitRace =
          new Race.Builder()
              .withName("Invalid Limit Race")
              .withTrackEntityId("track_4_lane")
              .withHeatRotationType(HeatRotationType.Custom)
              .withCustomRotationAssetId("invalid-limit-uuid")
              .build();
      try {
        realHandler.validateRace(invalidLimitRace);
        org.junit.Assert.fail("Expected IllegalArgumentException for driver index exceeding limit");
      } catch (IllegalArgumentException e) {
        org.junit.Assert.assertTrue(e.getMessage().contains("Invalid driver index 101"));
      }
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testGetRaces_IncludesCompatibilityStatus() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_compat").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_compat_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      com.antigravity.repository.SqliteRepository<Race> raceRepo =
          new com.antigravity.repository.SqliteRepository<>(dbCtx, "races", Race.class);

      // Normal race
      Race normalRace = new Race.Builder().withName("Normal GP").withEntityId("race_1").build();
      raceRepo.save(normalRace);

      // Degraded race (contains future advisory feature in raw json)
      String futureJson =
          "{\"entity_id\":\"race_2\",\"name\":\"Future GP\",\"future_feature\":\"enabled\"}";
      String sql = "INSERT INTO races (entity_id, json_data) VALUES ('race_2', ?)";
      try (java.sql.PreparedStatement pstmt = dbCtx.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, futureJson);
        pstmt.executeUpdate();
      }

      Context ctx = mock(Context.class);
      org.mockito.ArgumentCaptor<List> captor = org.mockito.ArgumentCaptor.forClass(List.class);
      realHandler.getRaces(ctx);
      verify(ctx).json(captor.capture());

      List<DatabaseTaskHandler.RaceResponse> list = captor.getValue();
      assertEquals(2, list.size());

      DatabaseTaskHandler.RaceResponse resp1 =
          list.stream().filter(r -> "race_1".equals(r.race.getEntityId())).findFirst().orElse(null);
      assertNotNull(resp1);
      assertEquals(
          com.antigravity.models.RaceCompatibility.Status.COMPATIBLE,
          resp1.compatibility.getStatus());
      assertTrue(resp1.compatibility.isCanRun());
      assertFalse(resp1.compatibility.isReadOnly());

      DatabaseTaskHandler.RaceResponse resp2 =
          list.stream().filter(r -> "race_2".equals(r.race.getEntityId())).findFirst().orElse(null);
      assertNotNull(resp2);
      assertEquals(
          com.antigravity.models.RaceCompatibility.Status.DEGRADED,
          resp2.compatibility.getStatus());
      assertTrue(resp2.compatibility.isCanRun());
      assertFalse(resp2.compatibility.isReadOnly());
      assertTrue(resp2.compatibility.getIgnoredFeatures().contains("future_feature"));
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testHandleUpdateRace_IncompatibleRace_Returns400ReadOnly() throws Exception {
    String rootDir = tempFolder.newFolder("db_root_ro").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_ro_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      // Incompatible race with future unmapped scoring feature
      String incompatibleJson =
          "{\"entity_id\":\"race_incompat\",\"name\":\"Points Race\",\"future_scoring\":{\"enabled\":true}}";
      String sql = "INSERT INTO races (entity_id, json_data) VALUES ('race_incompat', ?)";
      try (java.sql.PreparedStatement pstmt = dbCtx.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, incompatibleJson);
        pstmt.executeUpdate();
      }

      Context ctx = mock(Context.class);
      when(ctx.pathParam("id")).thenReturn("race_incompat");
      when(ctx.status(400)).thenReturn(ctx);

      realHandler.handleUpdateRace(ctx);
      verify(ctx).status(400);
      verify(ctx).result(org.mockito.ArgumentMatchers.contains("read-only"));
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testHandleCopyRace_IncompatibleRaceWithFallbacks_CreatesRunnableCopy()
      throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_copy").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_copy_db", null, rootDir);
    Javalin app = mock(Javalin.class);
    RaceHeatTaskHandler realHandler = new RaceHeatTaskHandler(dbCtx, app);

    try {
      String rawJson =
          "{\"entity_id\":\"race_orig\",\"name\":\"Championship\","
              + "\"points_scoring\":{\"enabled\":true},"
              + "\"overall_scoring\":{\"ranking_method\":\"POINTS\"},"
              + "\"_compat_meta\":{\"features\":["
              + "{\"id\":\"points_overall\",\"criticality\":\"REQUIRED\",\"fallback\":{\"target_path\":\"overall_scoring.ranking_method\",\"value\":\"LAP_COUNT\"}}"
              + "]}}";

      String sql = "INSERT INTO races (entity_id, json_data) VALUES ('race_orig', ?)";
      try (java.sql.PreparedStatement pstmt = dbCtx.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, rawJson);
        pstmt.executeUpdate();
      }

      Context ctx = mock(Context.class);
      when(ctx.pathParam("id")).thenReturn("race_orig");
      when(ctx.status(201)).thenReturn(ctx);

      org.mockito.ArgumentCaptor<DatabaseTaskHandler.RaceResponse> captor =
          org.mockito.ArgumentCaptor.forClass(DatabaseTaskHandler.RaceResponse.class);

      realHandler.handleCopyRace(ctx);
      verify(ctx).status(201);
      verify(ctx).json(captor.capture());

      DatabaseTaskHandler.RaceResponse response = captor.getValue();
      assertNotNull(response);
      assertEquals("Championship (Copy)", response.race.getName());
      assertEquals(
          com.antigravity.models.RaceCompatibility.Status.COMPATIBLE,
          response.compatibility.getStatus());
      assertTrue(response.compatibility.isCanRun());
      assertFalse(response.compatibility.isReadOnly());
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }
}
