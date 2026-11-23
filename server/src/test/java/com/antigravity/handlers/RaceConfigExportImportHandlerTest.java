package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.CustomRotationExportImportHelper;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Race;
import com.antigravity.repository.SqliteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class RaceConfigExportImportHandlerTest {

  private DatabaseContext mockDbCtx;
  private SqliteRepository<Race> mockRaceRepo;
  private Javalin mockJavalin;
  private RaceConfigExportImportHandler handler;
  private ObjectMapper objectMapper = new ObjectMapper();

  @Before
  @SuppressWarnings("unchecked")
  public void setUp() {
    mockDbCtx = mock(DatabaseContext.class);
    mockRaceRepo = (SqliteRepository<Race>) mock(SqliteRepository.class);
    mockJavalin = mock(Javalin.class);
    handler = new RaceConfigExportImportHandler(mockDbCtx, mockRaceRepo, mockJavalin);
  }

  @Test
  public void testRouteRegistration() {
    verify(mockJavalin).get(eq("/api/races/{id}/export-config"), any(), eq(Role.VIEWER));
    verify(mockJavalin).post(eq("/api/races/import-config"), any(), eq(Role.DIRECTOR));
  }

  @Test
  public void testExportConfig_NotFound_Returns404() {
    Context ctx = mock(Context.class);
    when(ctx.pathParam("id")).thenReturn("missing-id");
    when(ctx.status(404)).thenReturn(ctx);

    handler.exportConfig(ctx);

    verify(ctx).status(404);
  }

  @Test
  public void testExportConfig_Success() {
    Context ctx = mock(Context.class);
    Race race =
        new Race.Builder()
            .withEntityId("race-1")
            .withName("GT3 Sprint")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .build();
    when(mockRaceRepo.findByEntityId("race-1")).thenReturn(race);
    when(ctx.pathParam("id")).thenReturn("race-1");

    handler.exportConfig(ctx);

    verify(ctx)
        .header(eq("Content-Disposition"), eq("attachment; filename=\"GT3_Sprint.rccfg.json\""));
    verify(ctx).contentType(eq("application/json; charset=utf-8"));
  }

  @Test
  public void testImportConfig_EmptyContent_Returns400() {
    Context ctx = mock(Context.class);
    when(ctx.body()).thenReturn("");
    when(ctx.status(400)).thenReturn(ctx);

    handler.importConfig(ctx);

    verify(ctx).status(400);
  }

  @Test
  public void testImportConfig_NoConflict_SavesAndReturns201() throws Exception {
    Context ctx = mock(Context.class);
    Race race =
        new Race.Builder()
            .withName("New Championship")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .build();
    String json = objectMapper.writeValueAsString(race);
    when(ctx.body()).thenReturn(json);
    when(mockRaceRepo.findAll()).thenReturn(new ArrayList<>());
    when(ctx.status(201)).thenReturn(ctx);

    handler.importConfig(ctx);

    verify(ctx).status(201);
    ArgumentCaptor<Race> captor = ArgumentCaptor.forClass(Race.class);
    verify(mockRaceRepo).save(captor.capture());
    assertEquals("New Championship", captor.getValue().getName());
    assertNotNull(captor.getValue().getEntityId());
  }

  @Test
  public void testImportConfig_ConflictWithoutResolution_Returns409() throws Exception {
    Context ctx = mock(Context.class);
    Race existing =
        new Race.Builder()
            .withEntityId("existing-1")
            .withName("GT3 Sprint")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .build();
    when(mockRaceRepo.findAll()).thenReturn(new ArrayList<>(Arrays.asList(existing)));

    Race incoming =
        new Race.Builder()
            .withName("GT3 Sprint")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .build();
    String json = objectMapper.writeValueAsString(incoming);
    when(ctx.body()).thenReturn(json);
    when(ctx.status(409)).thenReturn(ctx);

    handler.importConfig(ctx);

    verify(ctx).status(409);
  }

  @Test
  public void testImportConfig_ConflictWithOverwrite_ReplacesExisting() throws Exception {
    Context ctx = mock(Context.class);
    Race existing =
        new Race.Builder()
            .withEntityId("existing-1")
            .withId("id-1")
            .withName("GT3 Sprint")
            .withMinLapTime(2.0)
            .build();
    when(mockRaceRepo.findAll()).thenReturn(new ArrayList<>(Arrays.asList(existing)));

    Race incoming = new Race.Builder().withName("GT3 Sprint").withMinLapTime(1.2).build();
    String json = objectMapper.writeValueAsString(incoming);
    when(ctx.body()).thenReturn(json);
    when(ctx.queryParam("resolution")).thenReturn("OVERWRITE");
    when(ctx.status(201)).thenReturn(ctx);

    handler.importConfig(ctx);

    verify(ctx).status(201);
    ArgumentCaptor<Race> captor = ArgumentCaptor.forClass(Race.class);
    verify(mockRaceRepo).replace(eq("existing-1"), captor.capture());
    assertEquals("existing-1", captor.getValue().getEntityId());
    assertEquals(1.2, captor.getValue().getMinLapTime(), 0.001);
  }

  @Test
  public void testImportConfig_ConflictWithAutoRename_SavesWithNewName() throws Exception {
    Context ctx = mock(Context.class);
    Race existing = new Race.Builder().withEntityId("existing-1").withName("GT3 Sprint").build();
    when(mockRaceRepo.findAll()).thenReturn(new ArrayList<>(Arrays.asList(existing)));

    Race incoming = new Race.Builder().withName("GT3 Sprint").build();
    String json = objectMapper.writeValueAsString(incoming);
    when(ctx.body()).thenReturn(json);
    when(ctx.queryParam("resolution")).thenReturn("AUTO_RENAME");
    when(ctx.status(201)).thenReturn(ctx);

    handler.importConfig(ctx);

    verify(ctx).status(201);
    ArgumentCaptor<Race> captor = ArgumentCaptor.forClass(Race.class);
    verify(mockRaceRepo).save(captor.capture());
    assertEquals("GT3 Sprint (1)", captor.getValue().getName());
  }

  @Test
  public void testExportConfig_WithCustomRotation_IncludesCustomRotation() throws Exception {
    Context ctx = mock(Context.class);
    com.antigravity.models.CustomHeat heat =
        new com.antigravity.models.CustomHeat(Arrays.asList(0, 1, 2, 3), 0, false, 0);
    com.antigravity.models.CustomRotation rot =
        new com.antigravity.models.CustomRotation(4, Collections.singletonList(heat));

    Race race =
        new Race.Builder()
            .withEntityId("race-rot")
            .withName("Custom Rotation Race")
            .withCustomRotations(Collections.singletonList(rot))
            .build();
    when(mockRaceRepo.findByEntityId("race-rot")).thenReturn(race);
    when(ctx.pathParam("id")).thenReturn("race-rot");

    ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
    when(ctx.result(jsonCaptor.capture())).thenReturn(ctx);

    handler.exportConfig(ctx);

    verify(ctx).contentType(eq("application/json; charset=utf-8"));
    String outputJson = jsonCaptor.getValue();
    assertTrue(outputJson.contains("custom_rotation"));
    assertTrue(outputJson.contains("Custom Rotation Race Rotation"));
  }

  @Test
  public void testImportConfig_WithCustomRotation_ReconcilesRotation() throws Exception {
    Context ctx = mock(Context.class);
    com.antigravity.models.CustomHeat heat =
        new com.antigravity.models.CustomHeat(Arrays.asList(0, 1, 2, 3), 0, false, 0);
    com.antigravity.models.CustomRotation rot =
        new com.antigravity.models.CustomRotation(4, Collections.singletonList(heat));
    CustomRotationExportImportHelper.CustomRotationPackage rotPkg =
        new CustomRotationExportImportHelper.CustomRotationPackage(
            "Imported Rotation", 4, Collections.singletonList(rot));

    Race race = new Race.Builder().withName("Imported Config Race").build();

    RaceConfigExportImportHandler.RaceConfigPackage pkg =
        new RaceConfigExportImportHandler.RaceConfigPackage(
            1, "RACE_CONFIG", "1.0.0", race, rotPkg);
    String json = objectMapper.writeValueAsString(pkg);

    when(ctx.body()).thenReturn(json);
    when(ctx.status(201)).thenReturn(ctx);

    handler.importConfig(ctx);

    verify(ctx).status(201);
    ArgumentCaptor<Race> captor = ArgumentCaptor.forClass(Race.class);
    verify(mockRaceRepo).save(captor.capture());
    assertEquals("Imported Config Race", captor.getValue().getName());
  }
}
