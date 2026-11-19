package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Season;
import com.antigravity.repository.SqliteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.util.ArrayList;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.ArgumentCaptor;

/** https://github.com/daufderheide/racecoordinator_ai/issues/972 */
public class ClubPackageTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private ClubPackageTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    handler = new ClubPackageTaskHandler(databaseContext, mock(Javalin.class));
    ctx = mock(Context.class);
    when(ctx.status(anyInt())).thenReturn(ctx);
    when(ctx.contentType(anyString())).thenReturn(ctx);
    when(ctx.result(anyString())).thenReturn(ctx);
  }

  @After
  public void tearDown() throws Exception {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      databaseContext.getConnection().close();
    }
  }

  @Test
  public void testExportWithoutSeasonIsABadRequest() {
    handler.handleExport(ctx);
    verify(ctx).status(400);
  }

  @Test
  public void testExportOfAMissingSeasonIsNotFound() {
    when(ctx.queryParam("seasonId")).thenReturn("nope");
    handler.handleExport(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testExportPreviewAndCommitThroughTheEndpoints() throws Exception {
    String id = databaseContext.getNextSequence("seasons");
    new SqliteRepository<>(databaseContext, "seasons", Season.class)
        .insert(new Season("Club Night", 0, new ArrayList<>(), id, null));
    when(ctx.queryParam("seasonId")).thenReturn(id);
    when(ctx.queryParam("name")).thenReturn("Hobby Club 2026");

    handler.handleExport(ctx);

    ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
    verify(ctx)
        .header(
            eq("Content-Disposition"), eq("attachment; filename=\"Hobby Club 2026.rcclub.json\""));
    verify(ctx).result(body.capture());
    JsonNode pkg = new ObjectMapper().readTree(body.getValue());
    assertEquals("rc-ai-club-package", pkg.path("format").asText());

    Context previewCtx = mock(Context.class);
    when(previewCtx.contentType(anyString())).thenReturn(previewCtx);
    when(previewCtx.body()).thenReturn(body.getValue());
    handler.handlePreview(previewCtx);
    ArgumentCaptor<String> previewBody = ArgumentCaptor.forClass(String.class);
    verify(previewCtx).result(previewBody.capture());
    JsonNode preview = new ObjectMapper().readTree(previewBody.getValue());
    assertEquals("MERGE", preview.path("season").path("resolution").asText());
    assertTrue(preview.path("packageData").isObject());

    Context commitCtx = mock(Context.class);
    when(commitCtx.contentType(anyString())).thenReturn(commitCtx);
    when(commitCtx.body()).thenReturn(previewBody.getValue());
    handler.handleCommit(commitCtx);
    ArgumentCaptor<String> resultBody = ArgumentCaptor.forClass(String.class);
    verify(commitCtx).result(resultBody.capture());
    JsonNode result = new ObjectMapper().readTree(resultBody.getValue());
    assertTrue(result.path("success").asBoolean());
    assertEquals(id, result.path("seasonId").asText());
  }

  @Test
  public void testChampionshipNameIsRememberedAfterTheFirstExport() throws Exception {
    String id = databaseContext.getNextSequence("seasons");
    new SqliteRepository<>(databaseContext, "seasons", Season.class)
        .insert(new Season("Club 2026", 0, new ArrayList<>(), id, null));
    Context first = mock(Context.class);
    when(first.contentType(anyString())).thenReturn(first);
    when(first.queryParam("seasonId")).thenReturn(id);
    handler.handleChampionship(first);
    ArgumentCaptor<String> before = ArgumentCaptor.forClass(String.class);
    verify(first).result(before.capture());
    assertEquals("Club 2026", new ObjectMapper().readTree(before.getValue()).path("name").asText());

    when(ctx.queryParam("seasonId")).thenReturn(id);
    when(ctx.queryParam("name")).thenReturn("Hobby Club 2026");
    handler.handleExport(ctx);

    Context second = mock(Context.class);
    when(second.contentType(anyString())).thenReturn(second);
    when(second.queryParam("seasonId")).thenReturn(id);
    handler.handleChampionship(second);
    ArgumentCaptor<String> after = ArgumentCaptor.forClass(String.class);
    verify(second).result(after.capture());
    JsonNode n = new ObjectMapper().readTree(after.getValue());
    assertEquals("Hobby Club 2026", n.path("name").asText());
    assertTrue(n.path("remembered").asBoolean());
  }

  @Test
  public void testPreviewOfSomethingElseIsABadRequest() {
    when(ctx.body()).thenReturn("{\"hello\":\"world\"}");
    handler.handlePreview(ctx);
    verify(ctx).status(400);
    verify(ctx).result("CRI_ERR_NOT_A_CLUB_PACKAGE");
  }

  @Test
  public void testPreviewOfBrokenJsonIsABadRequest() {
    when(ctx.body()).thenReturn("not json");
    handler.handlePreview(ctx);
    verify(ctx).status(400);
  }
}
