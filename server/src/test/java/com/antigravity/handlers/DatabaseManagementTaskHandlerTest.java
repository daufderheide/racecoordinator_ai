package com.antigravity.handlers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Before;
import org.junit.Test;

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
}
