package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.models.Team;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.ArgumentCaptor;

public class DriverLabelTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private SqliteRepository<Team> teamRepository;
  private SqliteRepository<DriverLabel> driverLabelRepository;
  private Javalin app;
  private DriverLabelTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    teamRepository = new SqliteRepository<>(databaseContext, "teams", Team.class);
    driverLabelRepository =
        new SqliteRepository<>(databaseContext, "driver_labels", DriverLabel.class);
    app = mock(Javalin.class);
    ctx = mock(Context.class);

    handler = new DriverLabelTaskHandler(databaseContext, driverRepository, teamRepository, app);
  }

  @After
  public void tearDown() {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  @Test
  public void testGetLabels() {
    DriverLabel l1 = new DriverLabel("Pro", "#ef4444", "lbl-1");
    DriverLabel l2 = new DriverLabel("Rookie", "#10b981", "lbl-2");
    driverLabelRepository.insert(l1);
    driverLabelRepository.insert(l2);

    handler.getLabels(ctx);

    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(ctx).json(captor.capture());
    @SuppressWarnings("unchecked")
    List<DriverLabel> result = (List<DriverLabel>) captor.getValue();
    assertEquals(2, result.size());
  }

  @Test
  public void testGetLabelById_Found() {
    DriverLabel label = new DriverLabel("Super Pro", "#8b5cf6", "lbl-99");
    driverLabelRepository.insert(label);

    when(ctx.pathParam("id")).thenReturn("lbl-99");
    handler.getLabelById(ctx);

    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(ctx).json(captor.capture());
    DriverLabel result = (DriverLabel) captor.getValue();
    assertEquals("Super Pro", result.getName());
    assertEquals("#8b5cf6", result.getColor());
  }

  @Test
  public void testGetLabelById_NotFound() {
    when(ctx.pathParam("id")).thenReturn("nonexistent");
    when(ctx.status(anyInt())).thenReturn(ctx);

    handler.getLabelById(ctx);

    verify(ctx).status(404);
    verify(ctx).result("Driver label not found");
  }

  @Test
  public void testCreateLabel_Success() {
    when(ctx.body()).thenReturn("{\"name\":\"Kids\",\"color\":\"#f59e0b\"}");
    when(ctx.status(anyInt())).thenReturn(ctx);

    handler.createLabel(ctx);

    verify(ctx).status(201);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(ctx).json(captor.capture());
    DriverLabel created = (DriverLabel) captor.getValue();
    assertEquals("Kids", created.getName());
    assertEquals("#f59e0b", created.getColor());
    assertNotNull(created.getEntityId());

    DriverLabel inRepo = driverLabelRepository.findByEntityId(created.getEntityId());
    assertNotNull(inRepo);
    assertEquals("Kids", inRepo.getName());
  }

  @Test
  public void testCreateLabel_EmptyName() {
    when(ctx.body()).thenReturn("{\"name\":\"  \",\"color\":\"#f59e0b\"}");
    when(ctx.status(anyInt())).thenReturn(ctx);

    handler.createLabel(ctx);

    verify(ctx).status(400);
    verify(ctx).result("Label name cannot be empty");
  }

  @Test
  public void testCreateLabel_DuplicateName() {
    driverLabelRepository.insert(new DriverLabel("Veteran", "#3b82f6", "lbl-v"));

    when(ctx.body()).thenReturn("{\"name\":\"veteran\",\"color\":\"#ff0000\"}");
    when(ctx.status(anyInt())).thenReturn(ctx);

    handler.createLabel(ctx);

    verify(ctx).status(409);
    verify(ctx).result("A label with this name already exists");
  }

  @Test
  public void testUpdateLabel_Success() {
    DriverLabel original = new DriverLabel("Class B", "#3b82f6", "lbl-b");
    driverLabelRepository.insert(original);

    when(ctx.pathParam("id")).thenReturn("lbl-b");
    when(ctx.body()).thenReturn("{\"name\":\"Class B Modified\",\"color\":\"#10b981\"}");

    handler.updateLabel(ctx);

    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(ctx).json(captor.capture());
    DriverLabel updated = (DriverLabel) captor.getValue();
    assertEquals("Class B Modified", updated.getName());
    assertEquals("#10b981", updated.getColor());

    DriverLabel inRepo = driverLabelRepository.findByEntityId("lbl-b");
    assertNotNull(inRepo);
    assertEquals("Class B Modified", inRepo.getName());
    assertEquals("#10b981", inRepo.getColor());
  }

  @Test
  public void testUpdateLabel_EmptyName() {
    DriverLabel original = new DriverLabel("Class C", "#3b82f6", "lbl-c");
    driverLabelRepository.insert(original);

    when(ctx.pathParam("id")).thenReturn("lbl-c");
    when(ctx.body()).thenReturn("{\"name\":\"  \",\"color\":\"#10b981\"}");
    when(ctx.status(anyInt())).thenReturn(ctx);

    handler.updateLabel(ctx);

    verify(ctx).status(400);
    verify(ctx).result("Label name cannot be empty");
  }

  @Test
  public void testUpdateLabel_DuplicateName() {
    driverLabelRepository.insert(new DriverLabel("Class A", "#3b82f6", "lbl-a"));
    driverLabelRepository.insert(new DriverLabel("Class B", "#ef4444", "lbl-b"));

    when(ctx.pathParam("id")).thenReturn("lbl-b");
    when(ctx.body()).thenReturn("{\"name\":\"Class A\",\"color\":\"#10b981\"}");
    when(ctx.status(anyInt())).thenReturn(ctx);

    handler.updateLabel(ctx);

    verify(ctx).status(409);
    verify(ctx).result("A label with this name already exists");
  }

  @Test
  public void testDeleteLabel_RemovesFromRepoAndCleansUpDrivers() {
    DriverLabel label1 = new DriverLabel("Label 1", "#3b82f6", "lbl-del");
    DriverLabel label2 = new DriverLabel("Label 2", "#10b981", "lbl-keep");
    driverLabelRepository.insert(label1);
    driverLabelRepository.insert(label2);

    Driver driver1 =
        new Driver.Builder()
            .withEntityId("d-1")
            .withName("Driver One")
            .withNickname("D1")
            .withLabelIds(Arrays.asList("lbl-del", "lbl-keep"))
            .build();
    Driver driver2 =
        new Driver.Builder()
            .withEntityId("d-2")
            .withName("Driver Two")
            .withNickname("D2")
            .withLabelIds(Arrays.asList("lbl-keep"))
            .build();

    driverRepository.insert(driver1);
    driverRepository.insert(driver2);

    when(ctx.pathParam("id")).thenReturn("lbl-del");
    when(ctx.status(anyInt())).thenReturn(ctx);

    handler.deleteLabel(ctx);

    verify(ctx).status(204);
    assertNull(driverLabelRepository.findByEntityId("lbl-del"));
    assertNotNull(driverLabelRepository.findByEntityId("lbl-keep"));

    Driver updatedD1 = driverRepository.findByEntityId("d-1");
    assertNotNull(updatedD1);
    assertEquals(1, updatedD1.getLabelIds().size());
    assertFalse(updatedD1.getLabelIds().contains("lbl-del"));
    assertTrue(updatedD1.getLabelIds().contains("lbl-keep"));

    Driver updatedD2 = driverRepository.findByEntityId("d-2");
    assertNotNull(updatedD2);
    assertEquals(1, updatedD2.getLabelIds().size());
    assertTrue(updatedD2.getLabelIds().contains("lbl-keep"));
  }

  @Test
  public void testDeleteLabel_RemovesFromRepoAndCleansUpTeams() {
    DriverLabel label1 = new DriverLabel("Label 1", "#3b82f6", "lbl-del-team");
    DriverLabel label2 = new DriverLabel("Label 2", "#10b981", "lbl-keep-team");
    driverLabelRepository.insert(label1);
    driverLabelRepository.insert(label2);

    Team team1 =
        new Team.Builder()
            .withEntityId("t-1")
            .withName("Team One")
            .withLabelIds(Arrays.asList("lbl-del-team", "lbl-keep-team"))
            .build();
    Team team2 =
        new Team.Builder()
            .withEntityId("t-2")
            .withName("Team Two")
            .withLabelIds(Arrays.asList("lbl-keep-team"))
            .build();

    teamRepository.insert(team1);
    teamRepository.insert(team2);

    when(ctx.pathParam("id")).thenReturn("lbl-del-team");
    when(ctx.status(anyInt())).thenReturn(ctx);

    handler.deleteLabel(ctx);

    verify(ctx).status(204);
    assertNull(driverLabelRepository.findByEntityId("lbl-del-team"));
    assertNotNull(driverLabelRepository.findByEntityId("lbl-keep-team"));

    Team updatedT1 = teamRepository.findByEntityId("t-1");
    assertNotNull(updatedT1);
    assertEquals(1, updatedT1.getLabelIds().size());
    assertFalse(updatedT1.getLabelIds().contains("lbl-del-team"));
    assertTrue(updatedT1.getLabelIds().contains("lbl-keep-team"));

    Team updatedT2 = teamRepository.findByEntityId("t-2");
    assertNotNull(updatedT2);
    assertEquals(1, updatedT2.getLabelIds().size());
    assertTrue(updatedT2.getLabelIds().contains("lbl-keep-team"));
  }
}
