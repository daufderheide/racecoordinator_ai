package com.antigravity.handlers;

import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class DatabaseManagementTaskHandlerTest {

  private DatabaseContext mockDbCtx;
  private Javalin mockJavalin;
  private DatabaseManagementTaskHandler handler;

  @Before
  public void setUp() {
    mockDbCtx = mock(DatabaseContext.class);
    mockJavalin = mock(Javalin.class);
    handler = new DatabaseManagementTaskHandler(mockDbCtx, mockJavalin);
  }

  @Test
  public void testRouteRegistration() {
    verify(mockJavalin).get(eq("/api/databases"), any(), eq(Role.ADMIN));
    verify(mockJavalin).post(eq("/api/databases/switch"), any(), eq(Role.ADMIN));
    verify(mockJavalin).post(eq("/api/databases/create"), any(), eq(Role.ADMIN));
    verify(mockJavalin).post(eq("/api/databases/copy"), any(), eq(Role.ADMIN));
    verify(mockJavalin).post(eq("/api/databases/reset"), any(), eq(Role.ADMIN));
    verify(mockJavalin).post(eq("/api/databases/delete"), any(), eq(Role.ADMIN));
    verify(mockJavalin).get(eq("/api/databases/current"), any(), eq(Role.ADMIN));
    verify(mockJavalin).get(eq("/api/databases/{name}/export"), any(), eq(Role.ADMIN));
    verify(mockJavalin).post(eq("/api/databases/import"), any(), eq(Role.ADMIN));
  }

  @Test
  public void testListDatabases() {
    Context mockCtx = mock(Context.class);
    List<String> dbNames = Arrays.asList("admin", "testdb", "local");
    when(mockDbCtx.listDatabases()).thenReturn(dbNames);
    DatabaseContext.DatabaseStats stats = mock(DatabaseContext.DatabaseStats.class);
    when(mockDbCtx.getDatabaseStats("testdb")).thenReturn(stats);

    handler.listDatabases(mockCtx);

    verify(mockCtx).json(any());
  }

  @Test
  public void testSwitchDatabaseSuccess() {
    Context mockCtx = mock(Context.class);
    Map<String, String> body = new HashMap<>();
    body.put("name", "newdb");
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);

    handler.switchDatabase(mockCtx);

    verify(mockDbCtx).switchDatabase("newdb");
  }

  @Test
  public void testSwitchDatabaseEmptyName() {
    Context mockCtx = mock(Context.class);
    Map<String, String> body = new HashMap<>();
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    when(mockCtx.status(400)).thenReturn(mockCtx);

    handler.switchDatabase(mockCtx);

    verify(mockCtx).status(400);
  }

  @Test
  public void testDeleteDatabaseActiveDbError() {
    Context mockCtx = mock(Context.class);
    Map<String, String> body = new HashMap<>();
    body.put("name", "active_db");
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    when(mockDbCtx.getCurrentDatabaseName()).thenReturn("active_db");
    when(mockCtx.status(400)).thenReturn(mockCtx);

    handler.deleteDatabase(mockCtx);

    verify(mockCtx).status(400);
  }

  @Test
  public void testGetCurrentDatabase() {
    Context mockCtx = mock(Context.class);
    when(mockDbCtx.getCurrentDatabaseName()).thenReturn("testdb");
    DatabaseContext.DatabaseStats stats = mock(DatabaseContext.DatabaseStats.class);
    when(mockDbCtx.getDatabaseStats("testdb")).thenReturn(stats);

    handler.getCurrentDatabase(mockCtx);

    verify(mockCtx).json(stats);
  }

  @Test
  public void testCreateDatabase_SuccessAndValidation() {
    Context mockCtx = mock(Context.class);
    Map<String, String> body = new HashMap<>();
    body.put("name", "new_created_db");
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    when(mockDbCtx.listDatabases()).thenReturn(Arrays.asList("existing_db"));
    DatabaseContext.DatabaseStats stats = mock(DatabaseContext.DatabaseStats.class);
    when(mockDbCtx.getDatabaseStats("new_created_db")).thenReturn(stats);

    handler.createDatabase(mockCtx);
    verify(mockDbCtx).createDatabase("new_created_db");
    verify(mockDbCtx).switchDatabase("new_created_db");
    verify(mockDbCtx).resetDatabaseToFactory("new_created_db");
    verify(mockCtx).json(stats);

    // Duplicate database returns 409
    Context ctxDup = mock(Context.class);
    Map<String, String> bodyDup = new HashMap<>();
    bodyDup.put("name", "existing_db");
    when(ctxDup.bodyAsClass(Map.class)).thenReturn(bodyDup);
    when(ctxDup.status(409)).thenReturn(ctxDup);
    handler.createDatabase(ctxDup);
    verify(ctxDup).status(409);
  }

  @Test
  public void testCopyDatabase_SuccessAndValidation() {
    Context mockCtx = mock(Context.class);
    Map<String, String> body = new HashMap<>();
    body.put("name", "copied_db");
    body.put("source", "source_db");
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    when(mockDbCtx.listDatabases()).thenReturn(Arrays.asList("source_db"));
    DatabaseContext.DatabaseStats stats = mock(DatabaseContext.DatabaseStats.class);
    when(mockDbCtx.getDatabaseStats("copied_db")).thenReturn(stats);

    handler.copyDatabase(mockCtx);
    verify(mockDbCtx).copyDatabase("source_db", "copied_db");
    verify(mockCtx).json(stats);

    // Missing source returns 404
    Context ctx404 = mock(Context.class);
    Map<String, String> body404 = new HashMap<>();
    body404.put("name", "copied_db2");
    body404.put("source", "nonexistent_source");
    when(ctx404.bodyAsClass(Map.class)).thenReturn(body404);
    when(ctx404.status(404)).thenReturn(ctx404);
    handler.copyDatabase(ctx404);
    verify(ctx404).status(404);
  }

  @Test
  public void testResetDatabase_Success() {
    Context mockCtx = mock(Context.class);
    Map<String, String> body = new HashMap<>();
    body.put("name", "db_to_reset");
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    DatabaseContext.DatabaseStats stats = mock(DatabaseContext.DatabaseStats.class);
    when(mockDbCtx.getDatabaseStats("db_to_reset")).thenReturn(stats);

    handler.resetDatabase(mockCtx);
    verify(mockDbCtx).resetDatabaseToFactory("db_to_reset");
    verify(mockCtx).json(stats);
  }

  @Test
  public void testDeleteDatabase_Success() {
    Context mockCtx = mock(Context.class);
    Map<String, String> body = new HashMap<>();
    body.put("name", "db_to_delete");
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    when(mockDbCtx.getCurrentDatabaseName()).thenReturn("other_active_db");

    handler.deleteDatabase(mockCtx);
    verify(mockDbCtx).deleteDatabase("db_to_delete");
    verify(mockCtx).status(204);
  }

  @Test
  public void testExportDatabase_Success() throws Exception {
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    ServletOutputStream outStream = mock(ServletOutputStream.class);
    when(res.getOutputStream()).thenReturn(outStream);
    Context ctx = org.mockito.Mockito.spy(new Context(req, res, new HashMap<>()));
    org.mockito.Mockito.doReturn("RaceCoordinator_AI_DB").when(ctx).pathParam("name");

    handler.exportDatabase(ctx);

    verify(res).setContentType("application/zip");
    ArgumentCaptor<String> headerValCaptor = ArgumentCaptor.forClass(String.class);
    verify(res).setHeader(eq("Content-Disposition"), headerValCaptor.capture());
    assertTrue(
        headerValCaptor
            .getValue()
            .matches(
                "attachment; filename=\"RaceCoordinator_AI_DB--\\d{4}-\\d{2}-\\d{2}--\\d{2}-\\d{2}-\\d{2}_(AM|PM)\\.zip\""));
    verify(mockDbCtx).exportDatabase(eq("RaceCoordinator_AI_DB"), eq(outStream));
  }

  @Test
  public void testExportDatabase_Exception() throws Exception {
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    ServletOutputStream outStream = mock(ServletOutputStream.class);
    when(res.getOutputStream()).thenReturn(outStream);
    Context ctx = org.mockito.Mockito.spy(new Context(req, res, new HashMap<>()));
    org.mockito.Mockito.doReturn("bad_db").when(ctx).pathParam("name");
    doThrow(new IOException("Disk error")).when(mockDbCtx).exportDatabase(eq("bad_db"), any());

    handler.exportDatabase(ctx);

    verify(res).setStatus(500);
  }
}
