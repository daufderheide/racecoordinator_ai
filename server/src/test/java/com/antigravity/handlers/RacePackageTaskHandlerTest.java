package com.antigravity.handlers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.model.RacePackageCommitRequest;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.util.Collections;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class RacePackageTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private Javalin mockJavalin;
  private RacePackageTaskHandler handler;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    mockJavalin = mock(Javalin.class);
    handler = new RacePackageTaskHandler(databaseContext, mockJavalin);
  }

  @Test
  public void testRouteRegistration() {
    verify(mockJavalin).get(eq("/api/history/races/{id}/export-package"), any(), eq(Role.VIEWER));
    verify(mockJavalin).post(eq("/api/history/races/preview-package"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).post(eq("/api/history/races/commit-package"), any(), eq(Role.DIRECTOR));
  }

  @Test
  public void testExportPackage_NotFound_Returns404() {
    Context ctx = mock(Context.class);
    when(ctx.pathParam("id")).thenReturn("non-existent-id");
    when(ctx.status(404)).thenReturn(ctx);

    handler.handleExportPackage(ctx);

    verify(ctx).status(404);
  }

  @Test
  public void testPreviewPackage_NoFileUploaded_Returns400() {
    Context ctx = mock(Context.class);
    when(ctx.uploadedFile("file")).thenReturn(null);
    when(ctx.bodyAsBytes()).thenReturn(new byte[0]);
    when(ctx.status(400)).thenReturn(ctx);

    handler.handlePreviewPackage(ctx);

    verify(ctx).status(400);
  }

  @Test
  public void testCommitPackage_InvalidRequest_Returns400() {
    Context ctx = mock(Context.class);
    RacePackageCommitRequest req =
        new RacePackageCommitRequest("invalid-token", "CREATE_COPY", Collections.emptyList(), null);
    when(ctx.bodyAsClass(RacePackageCommitRequest.class)).thenReturn(req);
    when(ctx.status(400)).thenReturn(ctx);

    handler.handleCommitPackage(ctx);

    verify(ctx).status(400);
  }
}
