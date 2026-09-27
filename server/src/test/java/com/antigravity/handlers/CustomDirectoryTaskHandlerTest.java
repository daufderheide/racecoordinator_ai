package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.service.ServerConfigService;
import com.antigravity.util.NativeDirectoryChooser;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.ArgumentCaptor;

public class CustomDirectoryTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private Javalin app;
  private ServerConfigService configService;
  private CustomDirectoryTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() {
    app = mock(Javalin.class);
    configService = mock(ServerConfigService.class);
    ctx = mock(Context.class);
    handler = new CustomDirectoryTaskHandler(app, configService);

    when(ctx.status(anyInt())).thenReturn(ctx);
  }

  @After
  public void tearDown() {
    NativeDirectoryChooser.setCommandRunner(null);
  }

  @Test
  public void testGetDirectories() {
    when(ctx.ip()).thenReturn("127.0.0.1");
    when(configService.getCustomUiDirectory()).thenReturn("/custom/ui");
    when(configService.getCustomWidgetDirectory()).thenReturn("/custom/widgets");

    ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
    handler.getDirectories(ctx);

    verify(ctx).json(captor.capture());
    Map<String, Object> response = captor.getValue();
    assertEquals("/custom/ui", response.get("customUiDirectory"));
    assertEquals("/custom/widgets", response.get("customWidgetDirectory"));
    assertEquals(true, response.get("isLocalhost"));
  }

  @Test
  public void testSetDirectory_ValidPath() throws Exception {
    File folder = tempFolder.newFolder("my_widgets");
    CustomDirectoryTaskHandler.SetDirectoryRequest req =
        new CustomDirectoryTaskHandler.SetDirectoryRequest();
    req.type = "widgets";
    req.path = folder.getAbsolutePath();

    when(ctx.bodyAsClass(CustomDirectoryTaskHandler.SetDirectoryRequest.class)).thenReturn(req);

    ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
    handler.setDirectory(ctx);

    verify(configService).setCustomWidgetDirectory(folder.getCanonicalPath());
    verify(ctx).json(captor.capture());
    assertEquals(true, captor.getValue().get("success"));
  }

  @Test
  public void testSetDirectory_InvalidPath() {
    CustomDirectoryTaskHandler.SetDirectoryRequest req =
        new CustomDirectoryTaskHandler.SetDirectoryRequest();
    req.type = "widgets";
    req.path = "/invalid/non_existent_folder_xyz_123";

    when(ctx.bodyAsClass(CustomDirectoryTaskHandler.SetDirectoryRequest.class)).thenReturn(req);

    handler.setDirectory(ctx);

    verify(ctx).status(400);
  }

  @Test
  public void testClearDirectory() {
    CustomDirectoryTaskHandler.ClearDirectoryRequest req =
        new CustomDirectoryTaskHandler.ClearDirectoryRequest();
    req.type = "ui";
    when(ctx.bodyAsClass(CustomDirectoryTaskHandler.ClearDirectoryRequest.class)).thenReturn(req);

    handler.clearDirectory(ctx);
    verify(configService).setCustomUiDirectory(null);

    req.type = "widgets";
    handler.clearDirectory(ctx);
    verify(configService).setCustomWidgetDirectory(null);
  }

  @Test
  public void testChooseFolder_RemoteBlocked() {
    when(ctx.ip()).thenReturn("192.168.1.100");

    handler.chooseFolder(ctx);
    verify(ctx).status(400);
  }

  @Test
  public void testChooseFolder_Success() throws Exception {
    File folder = tempFolder.newFolder("picked_widgets");
    when(ctx.ip()).thenReturn("127.0.0.1");

    CustomDirectoryTaskHandler.ChooseFolderRequest req =
        new CustomDirectoryTaskHandler.ChooseFolderRequest();
    req.type = "widgets";
    when(ctx.bodyAsClass(CustomDirectoryTaskHandler.ChooseFolderRequest.class)).thenReturn(req);

    NativeDirectoryChooser.setCommandRunner((cmd, timeout) -> folder.getAbsolutePath() + "\n");

    ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
    handler.chooseFolder(ctx);

    verify(configService).setCustomWidgetDirectory(folder.getCanonicalPath());
    verify(ctx).json(captor.capture());
    assertEquals(true, captor.getValue().get("success"));
  }

  @Test
  public void testWidgetLifecycleAndDiscovery() throws Exception {
    File widgetRoot = tempFolder.newFolder("widgets_root");
    when(configService.getCustomWidgetDirectory()).thenReturn(widgetRoot.getAbsolutePath());

    // 1. Write widget files
    CustomDirectoryTaskHandler.WriteWidgetFileRequest writeReq =
        new CustomDirectoryTaskHandler.WriteWidgetFileRequest();
    writeReq.path = "sample/my-widget";
    writeReq.file = "widget.json";
    writeReq.content = "{\"id\":\"my-widget\"}";

    when(ctx.bodyAsClass(CustomDirectoryTaskHandler.WriteWidgetFileRequest.class))
        .thenReturn(writeReq);
    handler.writeWidgetFile(ctx);

    assertTrue(Files.exists(widgetRoot.toPath().resolve("sample/my-widget/widget.json")));

    // 2. Read widget file
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(anyInt())).thenReturn(ctx);
    when(ctx.queryParam("path")).thenReturn("sample/my-widget");
    when(ctx.queryParam("file")).thenReturn("widget.json");
    handler.getWidgetFile(ctx);
    verify(ctx).result("{\"id\":\"my-widget\"}");

    // 3. List discovered widgets
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(anyInt())).thenReturn(ctx);
    ArgumentCaptor<List<CustomDirectoryTaskHandler.DiscoveredWidgetDirDto>> listCaptor =
        ArgumentCaptor.forClass(List.class);
    handler.listWidgets(ctx);
    verify(ctx).json(listCaptor.capture());

    List<CustomDirectoryTaskHandler.DiscoveredWidgetDirDto> discovered = listCaptor.getValue();
    assertEquals(1, discovered.size());
    assertEquals("my-widget", discovered.get(0).name);
    assertEquals("sample/my-widget", discovered.get(0).relativePath);
    assertEquals("sample", discovered.get(0).group);

    // 4. Delete widget directory
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(anyInt())).thenReturn(ctx);
    CustomDirectoryTaskHandler.DeleteWidgetDirRequest delReq =
        new CustomDirectoryTaskHandler.DeleteWidgetDirRequest();
    delReq.path = "sample";
    when(ctx.bodyAsClass(CustomDirectoryTaskHandler.DeleteWidgetDirRequest.class))
        .thenReturn(delReq);

    handler.deleteWidgetDirectory(ctx);
    assertFalse(Files.exists(widgetRoot.toPath().resolve("sample")));
  }

  @Test
  public void testCustomUiFileOperations() throws Exception {
    File uiRoot = tempFolder.newFolder("ui_root");
    when(configService.getCustomUiDirectory()).thenReturn(uiRoot.getAbsolutePath());

    // 1. Append/create file
    CustomDirectoryTaskHandler.AppendCustomUiFileRequest appendReq =
        new CustomDirectoryTaskHandler.AppendCustomUiFileRequest();
    appendReq.filename = "raceday.component.html";
    appendReq.content = "<div>Custom Raceday</div>";
    when(ctx.bodyAsClass(CustomDirectoryTaskHandler.AppendCustomUiFileRequest.class))
        .thenReturn(appendReq);
    handler.appendCustomUiFile(ctx);

    // 2. Check hasCustomUiFiles
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(anyInt())).thenReturn(ctx);
    ArgumentCaptor<Map<String, Object>> hasCaptor = ArgumentCaptor.forClass(Map.class);
    when(ctx.queryParam("filename")).thenReturn("raceday.component.html");
    handler.hasCustomUiFiles(ctx);
    verify(ctx).json(hasCaptor.capture());
    assertEquals(true, hasCaptor.getValue().get("exists"));

    // 3. Read custom UI file
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(anyInt())).thenReturn(ctx);
    when(ctx.queryParam("filename")).thenReturn("raceday.component.html");
    handler.getCustomUiFile(ctx);
    verify(ctx).result("<div>Custom Raceday</div>");

    // 4. Delete custom UI file
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(anyInt())).thenReturn(ctx);
    CustomDirectoryTaskHandler.DeleteCustomUiFileRequest delReq =
        new CustomDirectoryTaskHandler.DeleteCustomUiFileRequest();
    delReq.filename = "raceday.component.html";
    when(ctx.bodyAsClass(CustomDirectoryTaskHandler.DeleteCustomUiFileRequest.class))
        .thenReturn(delReq);
    handler.deleteCustomUiFile(ctx);

    assertFalse(Files.exists(uiRoot.toPath().resolve("raceday.component.html")));
  }

  @Test
  public void testPathTraversalBlocked() {
    File widgetRoot = tempFolder.getRoot();
    when(configService.getCustomWidgetDirectory()).thenReturn(widgetRoot.getAbsolutePath());

    when(ctx.queryParam("path")).thenReturn("../");
    when(ctx.queryParam("file")).thenReturn("etc/passwd");

    handler.getWidgetFile(ctx);
    verify(ctx).status(400);
  }
}
