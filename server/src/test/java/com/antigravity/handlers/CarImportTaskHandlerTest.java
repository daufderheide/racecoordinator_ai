package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.model.CarImportCommitRequest;
import com.antigravity.importer.model.CarImportPreview;
import com.antigravity.importer.model.CarImportResult;
import com.antigravity.importer.model.CarImportRow;
import com.antigravity.models.Car;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.ArgumentCaptor;

public class CarImportTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private Javalin app;
  private Context ctx;
  private CarImportTaskHandler handler;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    new File(new File(databaseContext.getDataRoot(), "test_db"), "assets").mkdirs();
    app = mock(Javalin.class);
    ctx = mock(Context.class);
    when(ctx.status(anyInt())).thenReturn(ctx);
    handler = new CarImportTaskHandler(databaseContext, app);
  }

  @After
  public void tearDown() throws Exception {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      databaseContext.getConnection().close();
    }
  }

  private static UploadedFile upload(String name, String content) {
    UploadedFile file = mock(UploadedFile.class);
    when(file.getFilename()).thenReturn(name);
    when(file.getContent())
        .thenReturn(new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8)));
    return file;
  }

  @Test
  public void testRoutesAndRoles() {
    verify(app).post(eq("/api/cars/import/preview"), any(), eq(Role.DIRECTOR));
    verify(app).post(eq("/api/cars/import/commit"), any(), eq(Role.DIRECTOR));
    verify(app).get(eq("/api/cars/import/template"), any(), eq(Role.VIEWER));
  }

  @Test
  public void testPreviewWithoutFilesIs400() {
    when(ctx.uploadedFiles()).thenReturn(Collections.emptyList());
    handler.handlePreview(ctx);
    verify(ctx).status(400);
  }

  @Test
  public void testPreviewReadsTheFile() {
    UploadedFile file = upload("cars.csv", "Name,Class\nAudi,GT3\n");
    when(ctx.uploadedFiles()).thenReturn(Collections.singletonList(file));
    when(ctx.uploadedFile("file")).thenReturn(file);

    handler.handlePreview(ctx);

    ArgumentCaptor<Object> json = ArgumentCaptor.forClass(Object.class);
    verify(ctx).json(json.capture());
    CarImportPreview preview = (CarImportPreview) json.getValue();
    assertEquals(1, preview.getValidCount());
    assertEquals("Audi", preview.getRows().get(0).getResolvedName());
  }

  @Test
  public void testPreviewOfAnUnknownFileTypeIs400() {
    UploadedFile file = upload("cars.zip", "not a zip");
    when(ctx.uploadedFiles()).thenReturn(Collections.singletonList(file));
    when(ctx.uploadedFile("file")).thenReturn(file);
    handler.handlePreview(ctx);
    verify(ctx).status(400);
  }

  @Test
  public void testCommitSavesTheRows() {
    CarImportRow row = new CarImportRow();
    row.setResolvedName("Mini");
    CarImportCommitRequest request = new CarImportCommitRequest();
    request.setRows(Collections.singletonList(row));
    when(ctx.bodyAsClass(CarImportCommitRequest.class)).thenReturn(request);

    handler.handleCommit(ctx);

    ArgumentCaptor<Object> json = ArgumentCaptor.forClass(Object.class);
    verify(ctx).json(json.capture());
    assertEquals(1, ((CarImportResult) json.getValue()).getImportedCount());
    assertEquals(
        "Mini",
        new SqliteRepository<>(databaseContext, "cars", Car.class).findAll().get(0).getName());
  }

  @Test
  public void testCommitErrorIs500() {
    when(ctx.bodyAsClass(CarImportCommitRequest.class)).thenThrow(new RuntimeException("bad"));
    handler.handleCommit(ctx);
    verify(ctx).status(500);
  }

  @Test
  public void testTemplateIsACsvWithAnExampleCar() throws Exception {
    when(ctx.queryParam("format")).thenReturn(null);
    handler.handleTemplate(ctx);
    verify(ctx).contentType("text/csv");
    verify(ctx).header(eq("Content-Disposition"), eq("attachment; filename=\"cars_template.csv\""));
    ArgumentCaptor<InputStream> result = ArgumentCaptor.forClass(InputStream.class);
    verify(ctx).result(result.capture());
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    byte[] buf = new byte[4096];
    int n;
    while ((n = result.getValue().read(buf)) != -1) out.write(buf, 0, n);
    String csv = new String(out.toByteArray(), StandardCharsets.UTF_8);
    assertTrue(csv.startsWith("Name,Picture,Brand,Class"));
    assertTrue(csv.contains("Porsche 911 RSR #92"));
  }

  @Test
  public void testTemplateAsExcelAndJson() {
    when(ctx.queryParam("format")).thenReturn("xlsx");
    handler.handleTemplate(ctx);
    verify(ctx)
        .header(eq("Content-Disposition"), eq("attachment; filename=\"cars_template.xlsx\""));
    Context json = mock(Context.class);
    when(json.queryParam("format")).thenReturn("json");
    handler.handleTemplate(json);
    verify(json).contentType("application/json");
  }
}
