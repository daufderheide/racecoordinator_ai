package com.antigravity.handlers;

import static org.junit.Assert.assertNotNull;
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
    rawList.add(rot1);

    List<?> result = handler.parseCustomRotations(rawList);
    assertNotNull(result);
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
}
