package com.antigravity.handlers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.model.DriverImportCommitRequest;
import com.antigravity.importer.model.DriverImportPreview;
import com.antigravity.importer.model.DriverImportResult;
import com.antigravity.importer.model.DriverImportRow;
import com.antigravity.models.Driver;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DriverImportTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private Javalin app;
  private DriverImportTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    app = mock(Javalin.class);
    ctx = mock(Context.class);

    when(ctx.status(anyInt())).thenReturn(ctx);

    handler = new DriverImportTaskHandler(databaseContext, driverRepository, app);
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
  public void testHandlePreviewNoFiles() {
    when(ctx.uploadedFiles()).thenReturn(Collections.emptyList());

    handler.handlePreview(ctx);

    verify(ctx).status(400);
    verify(ctx).result(anyString());
  }

  @Test
  public void testHandlePreviewWithCsv() throws Exception {
    UploadedFile file = mock(UploadedFile.class);
    when(file.getFilename()).thenReturn("drivers.csv");
    when(file.getContent())
        .thenReturn(
            new ByteArrayInputStream(
                "Name,Nickname\nMario,Mario\n".getBytes(StandardCharsets.UTF_8)));

    when(ctx.uploadedFiles()).thenReturn(Collections.singletonList(file));
    when(ctx.uploadedFile("file")).thenReturn(file);

    handler.handlePreview(ctx);

    verify(ctx).json(any(DriverImportPreview.class));
  }

  @Test
  public void testHandleCommit() {
    DriverImportRow row = new DriverImportRow();
    row.setResolvedName("Commit Driver");
    row.setResolvedNickname("CommitNick");
    row.setStatus("VALID");

    DriverImportCommitRequest req = new DriverImportCommitRequest(Collections.singletonList(row));
    when(ctx.bodyAsClass(DriverImportCommitRequest.class)).thenReturn(req);

    handler.handleCommit(ctx);

    verify(ctx).json(any(DriverImportResult.class));
  }

  @Test
  public void testHandleTemplate() {
    when(ctx.queryParam("format")).thenReturn("csv");
    handler.handleTemplate(ctx);
    verify(ctx).contentType("text/csv");
    verify(ctx).result(anyString());

    when(ctx.queryParam("format")).thenReturn("xlsx");
    handler.handleTemplate(ctx);
    verify(ctx).contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    when(ctx.queryParam("format")).thenReturn("json");
    handler.handleTemplate(ctx);
    verify(ctx).contentType("application/json");
  }
}
