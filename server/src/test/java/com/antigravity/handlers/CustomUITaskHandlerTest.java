package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomUI;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.ArgumentCaptor;

public class CustomUITaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private Javalin app;
  private CustomUITaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    app = mock(Javalin.class);
    ctx = mock(Context.class);

    handler = org.mockito.Mockito.spy(new CustomUITaskHandler(databaseContext, app));

    org.mockito.Mockito.doNothing().when(handler).setStatus(any(), anyInt());
    org.mockito.Mockito.doNothing().when(handler).setResult(any(), anyString());
    org.mockito.Mockito.doNothing().when(handler).setJson(any(), any());
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
  public void testEnsureDefaultCustomUIs_CreatesDefaults() {
    handler.ensureDefaultCustomUIs();

    handler.listCustomUIs(ctx);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(handler).setJson(eq(ctx), captor.capture());

    @SuppressWarnings("unchecked")
    List<CustomUI> uis = (List<CustomUI>) captor.getValue();
    assertNotNull(uis);
    assertTrue(uis.size() >= 3);

    boolean foundDefault = false;
    boolean foundPractice = false;
    boolean foundFuel = false;
    for (CustomUI ui : uis) {
      if (CustomUI.DEFAULT_UI_ID.equals(ui.getEntityId())) {
        foundDefault = true;
        assertTrue(ui.isDefault());
      }
      if (CustomUI.PRACTICE_UI_ID.equals(ui.getEntityId())) {
        foundPractice = true;
        assertTrue(ui.isDefault());
      }
      if (CustomUI.FUEL_UI_ID.equals(ui.getEntityId())) {
        foundFuel = true;
        assertTrue(ui.isDefault());
      }
    }
    assertTrue(foundDefault);
    assertTrue(foundPractice);
    assertTrue(foundFuel);
  }

  @Test
  public void testGetCustomUI_Found() {
    handler.ensureDefaultCustomUIs();

    when(handler.getPathParam(ctx, "id")).thenReturn(CustomUI.DEFAULT_UI_ID);
    handler.getCustomUI(ctx);
    verify(handler).setJson(eq(ctx), any(CustomUI.class));
  }

  @Test
  public void testGetCustomUI_NotFound() {
    handler.ensureDefaultCustomUIs();

    when(handler.getPathParam(ctx, "id")).thenReturn("non_existent_id");
    handler.getCustomUI(ctx);
    verify(handler).setStatus(ctx, 404);
  }

  @Test
  public void testCreateCustomUI_Success() {
    handler.ensureDefaultCustomUIs();

    CustomUI newUi =
        new CustomUI("My New Layout", false, "[]", null, null, null, null, null, "new", null);
    when(handler.getBody(ctx, CustomUI.class)).thenReturn(newUi);

    handler.createCustomUI(ctx);
    verify(handler).setStatus(ctx, 201);
  }

  @Test
  public void testCreateCustomUI_DuplicateName() {
    handler.ensureDefaultCustomUIs();

    CustomUI newUi =
        new CustomUI("My New Layout", false, "[]", null, null, null, null, null, "new", null);
    when(handler.getBody(ctx, CustomUI.class)).thenReturn(newUi);
    handler.createCustomUI(ctx);

    // Try creating duplicate name
    CustomUI duplicate =
        new CustomUI("My New Layout", false, "[]", null, null, null, null, null, null, null);
    when(handler.getBody(ctx, CustomUI.class)).thenReturn(duplicate);
    handler.createCustomUI(ctx);
    verify(handler).setStatus(ctx, 409);
  }

  @Test
  public void testUpdateCustomUI_DefaultAllowed() {
    handler.ensureDefaultCustomUIs();

    CustomUI updateDefault =
        new CustomUI(
            "Default UI Layout Updated",
            true,
            "[{\"widgetType\":\"lane-view\"}]",
            "[\"laneNumber\"]",
            null,
            null,
            null,
            null,
            CustomUI.DEFAULT_UI_ID,
            null);
    when(handler.getPathParam(ctx, "id")).thenReturn(CustomUI.DEFAULT_UI_ID);
    when(handler.getBody(ctx, CustomUI.class)).thenReturn(updateDefault);
    handler.updateCustomUI(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setJson(eq(ctx), any(CustomUI.class));
  }

  @Test
  public void testUpdateCustomUI_Success() {
    handler.ensureDefaultCustomUIs();

    // Create user UI
    CustomUI userUi =
        new CustomUI(
            "Editable Layout", false, "[]", null, null, null, null, null, "editable-1", null);
    when(handler.getBody(ctx, CustomUI.class)).thenReturn(userUi);
    handler.createCustomUI(ctx);

    // Update user UI -> success
    CustomUI updated =
        new CustomUI(
            "Edited Layout Name", false, "[]", null, null, null, null, null, "editable-1", null);
    when(handler.getPathParam(ctx, "id")).thenReturn("editable-1");
    when(handler.getBody(ctx, CustomUI.class)).thenReturn(updated);
    handler.updateCustomUI(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setJson(eq(ctx), any(CustomUI.class));
  }

  @Test
  public void testUpdateCustomUI_NotFound() {
    handler.ensureDefaultCustomUIs();

    CustomUI updated =
        new CustomUI(
            "Edited Layout Name", false, "[]", null, null, null, null, null, "missing-ui", null);
    when(handler.getPathParam(ctx, "id")).thenReturn("missing-ui");
    when(handler.getBody(ctx, CustomUI.class)).thenReturn(updated);
    handler.updateCustomUI(ctx);
    verify(handler).setStatus(ctx, 404);
  }

  @Test
  public void testDeleteCustomUI_DefaultAllowed() {
    handler.ensureDefaultCustomUIs();

    when(handler.getPathParam(ctx, "id")).thenReturn(CustomUI.DEFAULT_UI_ID);
    handler.deleteCustomUI(ctx);
    verify(handler).setStatus(ctx, 204);
  }

  @Test
  public void testDeleteCustomUI_NotFound() {
    handler.ensureDefaultCustomUIs();

    when(handler.getPathParam(ctx, "id")).thenReturn("non_existent");
    handler.deleteCustomUI(ctx);
    verify(handler).setStatus(ctx, 404);
  }

  @Test
  public void testDeleteCustomUI_Success() {
    handler.ensureDefaultCustomUIs();

    CustomUI customUi =
        new CustomUI(
            "Deletable Layout", false, "[]", null, null, null, null, null, "deletable-1", null);
    when(handler.getBody(ctx, CustomUI.class)).thenReturn(customUi);
    handler.createCustomUI(ctx);

    when(handler.getPathParam(ctx, "id")).thenReturn("deletable-1");
    handler.deleteCustomUI(ctx);
    verify(handler).setStatus(ctx, 204);
  }

  @Test
  public void testDuplicateCustomUI_Success() {
    handler.ensureDefaultCustomUIs();

    when(handler.getPathParam(ctx, "id")).thenReturn(CustomUI.DEFAULT_UI_ID);
    when(ctx.queryParam("name")).thenReturn(null);

    handler.duplicateCustomUI(ctx);
    verify(handler).setStatus(ctx, 201);
  }

  @Test
  public void testDuplicateCustomUI_NotFound() {
    handler.ensureDefaultCustomUIs();

    when(handler.getPathParam(ctx, "id")).thenReturn("missing-layout");
    handler.duplicateCustomUI(ctx);
    verify(handler).setStatus(ctx, 404);
  }

  @Test
  public void testCustomUIWithSequenceId2_PreservedAndDeletable() {
    handler.ensureDefaultCustomUIs();

    // Create custom UI with entityId "2"
    CustomUI custom2 =
        new CustomUI("My New Custom UI", false, "[]", null, null, null, null, null, "2", null);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "custom_uis", CustomUI.class)
        .save(custom2);

    // Call ensureDefaultCustomUIs again
    handler.ensureDefaultCustomUIs();

    // Verify custom UI "2" was NOT deleted or mutated into Fuel UI
    CustomUI retrieved =
        new com.antigravity.repository.SqliteRepository<>(
                databaseContext, "custom_uis", CustomUI.class)
            .findByEntityId("2");
    assertNotNull(retrieved);
    assertEquals("My New Custom UI", retrieved.getName());

    // Delete custom UI "2"
    when(handler.getPathParam(ctx, "id")).thenReturn("2");
    handler.deleteCustomUI(ctx);
    verify(handler).setStatus(ctx, 204);
  }
}
