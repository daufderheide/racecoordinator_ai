package com.antigravity.handlers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.AssetMessage;
import com.antigravity.service.AssetService;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class AssetTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private Javalin app;
  private AssetTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("TestDB", null, rootDir);
    app = mock(Javalin.class);
    ctx = mock(Context.class);

    AssetService assetService = mock(AssetService.class);
    handler = org.mockito.Mockito.spy(new AssetTaskHandler(databaseContext, app));
    org.mockito.Mockito.doReturn(assetService).when(handler).getAssetService();

    org.mockito.Mockito.doNothing().when(handler).setStatus(any(), anyInt());
    org.mockito.Mockito.doNothing().when(handler).setResult(any(), anyString());
    org.mockito.Mockito.doNothing().when(handler).setResult(any(), any(byte[].class));
    org.mockito.Mockito.doNothing().when(handler).setStream(any(), any());
    org.mockito.Mockito.doNothing().when(handler).setContentType(any(), anyString());
    org.mockito.Mockito.doReturn("dummy").when(handler).getPathParam(any(), anyString());
    org.mockito.Mockito.doReturn(new byte[0]).when(handler).getBodyBytes(any());
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
  public void testDownloadAsset_ImageSetFallback() throws Exception {
    String assetId = "set-123";
    org.mockito.Mockito.doReturn(assetId).when(handler).getPathParam(ctx, "id");

    AssetService assetService = handler.getAssetService();
    when(assetService.getAssetById(assetId))
        .thenReturn(
            AssetMessage.newBuilder().setType("image_set").setUrl("/assets/thumb_123.png").build());

    File assetsDir = new File(databaseContext.getDataRoot() + "TestDB/assets");
    assetsDir.mkdirs();
    new File(assetsDir, "thumb_123.png").createNewFile();

    handler.downloadAsset(ctx);

    verify(handler, org.mockito.Mockito.never()).setStatus(eq(ctx), eq(404));
    verify(handler).setStream(eq(ctx), any());
  }

  @Test
  public void testSaveAudioSet() throws Exception {
    com.antigravity.proto.SaveAudioSetRequest request =
        com.antigravity.proto.SaveAudioSetRequest.newBuilder().setName("My Audio Set").build();
    org.mockito.Mockito.doReturn(request.toByteArray()).when(handler).getBodyBytes(any());

    AssetService assetService = handler.getAssetService();
    when(assetService.saveAudioSet(any(), anyString(), any()))
        .thenReturn(AssetMessage.newBuilder().build());

    handler.saveAudioSet(ctx);
    verify(handler).setResult(any(), any(byte[].class));
  }

  private void invoke(AssetTaskHandler handler, String methodName, Context ctx) throws Exception {
    java.lang.reflect.Method m =
        AssetTaskHandler.class.getDeclaredMethod(methodName, Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);
  }

  @Test
  public void testListAssets() throws Exception {
    AssetService assetService = handler.getAssetService();
    when(assetService.getAllAssets()).thenReturn(java.util.Collections.emptyList());

    invoke(handler, "listAssets", ctx);
    verify(handler).setResult(eq(ctx), any(byte[].class));
  }

  @Test
  public void testUploadAsset() throws Exception {
    com.antigravity.proto.UploadAssetRequest req =
        com.antigravity.proto.UploadAssetRequest.newBuilder()
            .setName("sample.png")
            .setType("image")
            .setData(com.google.protobuf.ByteString.copyFromUtf8("fake_image_bytes"))
            .build();
    org.mockito.Mockito.doReturn(req.toByteArray()).when(handler).getBodyBytes(any());

    AssetService assetService = handler.getAssetService();
    when(assetService.saveAsset(anyString(), anyString(), any()))
        .thenReturn(AssetMessage.newBuilder().setName("sample.png").build());

    invoke(handler, "uploadAsset", ctx);
    verify(handler).setResult(eq(ctx), any(byte[].class));
  }

  @Test
  public void testDeleteAsset() throws Exception {
    com.antigravity.proto.DeleteAssetRequest req =
        com.antigravity.proto.DeleteAssetRequest.newBuilder().setId("asset_123").build();
    org.mockito.Mockito.doReturn(req.toByteArray()).when(handler).getBodyBytes(any());

    AssetService assetService = handler.getAssetService();
    when(assetService.deleteAsset("asset_123")).thenReturn(true);

    handler.deleteAsset(ctx);
    verify(handler).setResult(eq(ctx), any(byte[].class));
  }

  @Test
  public void testRenameAsset() throws Exception {
    com.antigravity.proto.RenameAssetRequest req =
        com.antigravity.proto.RenameAssetRequest.newBuilder()
            .setId("asset_123")
            .setNewName("renamed.png")
            .build();
    org.mockito.Mockito.doReturn(req.toByteArray()).when(handler).getBodyBytes(any());

    AssetService assetService = handler.getAssetService();
    when(assetService.renameAsset("asset_123", "renamed.png")).thenReturn(true);

    invoke(handler, "renameAsset", ctx);
    verify(handler).setResult(eq(ctx), any(byte[].class));
  }

  @Test
  public void testSaveImageSet() throws Exception {
    com.antigravity.proto.SaveImageSetRequest req =
        com.antigravity.proto.SaveImageSetRequest.newBuilder().setName("Sample Set").build();
    org.mockito.Mockito.doReturn(req.toByteArray()).when(handler).getBodyBytes(any());

    AssetService assetService = handler.getAssetService();
    when(assetService.saveImageSet(any(), anyString(), any()))
        .thenReturn(AssetMessage.newBuilder().build());

    invoke(handler, "saveImageSet", ctx);
    verify(handler).setResult(eq(ctx), any(byte[].class));
  }

  @Test
  public void testSaveCustomRotation() throws Exception {
    com.antigravity.proto.SaveCustomRotationRequest req =
        com.antigravity.proto.SaveCustomRotationRequest.newBuilder()
            .setName("4-Lane Rotation")
            .build();
    org.mockito.Mockito.doReturn(req.toByteArray()).when(handler).getBodyBytes(any());

    AssetService assetService = handler.getAssetService();
    when(assetService.saveCustomRotation(
            any(), anyString(), org.mockito.ArgumentMatchers.anyInt(), any()))
        .thenReturn(AssetMessage.newBuilder().build());

    invoke(handler, "saveCustomRotation", ctx);
    verify(handler).setResult(eq(ctx), any(byte[].class));
  }

  @Test
  public void testServeFile_DirectoryTraversalBlocked() throws Exception {
    org.mockito.Mockito.doReturn("../secret.txt").when(handler).getPathParam(ctx, "filename");

    invoke(handler, "serveAsset", ctx);
    verify(handler).setStatus(eq(ctx), eq(403));
  }

  @Test
  public void testServeFile_NotFound() throws Exception {
    org.mockito.Mockito.doReturn("nonexistent.png").when(handler).getPathParam(ctx, "filename");

    invoke(handler, "serveAsset", ctx);
    verify(handler).setStatus(eq(ctx), eq(404));
  }

  @Test
  public void testDetectContentType() {
    byte[] pngHeader = new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    org.junit.Assert.assertEquals(
        "image/png",
        AssetTaskHandler.detectContentType("default_black-blue_Helmet_Black-Blue", pngHeader));

    byte[] jpgHeader = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
    org.junit.Assert.assertEquals(
        "image/jpeg", AssetTaskHandler.detectContentType("unknown_file", jpgHeader));

    byte[] gifHeader = new byte[] {'G', 'I', 'F', '8', '9', 'a'};
    org.junit.Assert.assertEquals(
        "image/gif", AssetTaskHandler.detectContentType("no_ext_gif", gifHeader));

    byte[] wavHeader = new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'};
    org.junit.Assert.assertEquals(
        "audio/wav", AssetTaskHandler.detectContentType("default_beep_Lap_Beep", wavHeader));

    byte[] webpHeader = new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};
    org.junit.Assert.assertEquals(
        "image/webp", AssetTaskHandler.detectContentType("image_without_ext", webpHeader));

    byte[] mp3Header = new byte[] {'I', 'D', '3', 3, 0, 0};
    org.junit.Assert.assertEquals(
        "audio/mpeg", AssetTaskHandler.detectContentType("audio_no_ext", mp3Header));

    byte[] mp3SyncHeader = new byte[] {(byte) 0xFF, (byte) 0xFB, 0, 0};
    org.junit.Assert.assertEquals(
        "audio/mpeg", AssetTaskHandler.detectContentType("audio_sync", mp3SyncHeader));

    byte[] oggHeader = new byte[] {'O', 'g', 'g', 'S', 0, 0};
    org.junit.Assert.assertEquals(
        "audio/ogg", AssetTaskHandler.detectContentType("audio_ogg", oggHeader));

    byte[] svgHeader =
        "<svg xmlns=\"http://www.w3.org/2000/svg\">"
            .getBytes(java.nio.charset.StandardCharsets.UTF_8);
    org.junit.Assert.assertEquals(
        "image/svg+xml", AssetTaskHandler.detectContentType("vector_no_ext", svgHeader));

    byte[] xmlSvgHeader =
        "<?xml version=\"1.0\"?><svg>".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    org.junit.Assert.assertEquals(
        "image/svg+xml", AssetTaskHandler.detectContentType("xml_vector", xmlSvgHeader));

    byte[] unknownHeader = new byte[] {1, 2, 3, 4};
    org.junit.Assert.assertEquals(
        "application/octet-stream",
        AssetTaskHandler.detectContentType("binary.bin", unknownHeader));

    org.junit.Assert.assertEquals("image/png", AssetTaskHandler.detectContentType("pic.png", null));
    org.junit.Assert.assertEquals(
        "image/jpeg", AssetTaskHandler.detectContentType("pic.jpg", null));
    org.junit.Assert.assertEquals(
        "image/jpeg", AssetTaskHandler.detectContentType("pic.jpeg", null));
    org.junit.Assert.assertEquals("image/gif", AssetTaskHandler.detectContentType("pic.gif", null));
    org.junit.Assert.assertEquals(
        "image/svg+xml", AssetTaskHandler.detectContentType("pic.svg", null));
    org.junit.Assert.assertEquals(
        "image/webp", AssetTaskHandler.detectContentType("pic.webp", null));
    org.junit.Assert.assertEquals(
        "image/x-icon", AssetTaskHandler.detectContentType("fav.ico", null));
    org.junit.Assert.assertEquals(
        "audio/mpeg", AssetTaskHandler.detectContentType("snd.mp3", null));
    org.junit.Assert.assertEquals("audio/wav", AssetTaskHandler.detectContentType("snd.wav", null));
    org.junit.Assert.assertEquals("audio/ogg", AssetTaskHandler.detectContentType("snd.ogg", null));
    org.junit.Assert.assertEquals(
        "application/octet-stream", AssetTaskHandler.detectContentType(null, null));
  }

  @Test
  public void testServeAsset_DefaultResourceFallback() throws Exception {
    org.mockito.Mockito.doReturn("default_black-blue_Helmet_Black-Blue")
        .when(handler)
        .getPathParam(ctx, "filename");

    invoke(handler, "serveAsset", ctx);

    verify(handler, org.mockito.Mockito.never()).setStatus(eq(ctx), eq(404));
    verify(handler).setContentType(eq(ctx), eq("image/png"));
    verify(handler).setStream(eq(ctx), any());
  }

  @Test
  public void testServeAsset_PhysicalFileWithoutExtension() throws Exception {
    File assetsDir = new File(new File(databaseContext.getDataRoot(), "TestDB"), "assets");
    assetsDir.mkdirs();
    File testImg = new File(assetsDir, "custom_helmet_no_ext");
    byte[] pngData = new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0};
    try (java.io.FileOutputStream fos = new java.io.FileOutputStream(testImg)) {
      fos.write(pngData);
    }

    org.mockito.Mockito.doReturn("custom_helmet_no_ext")
        .when(handler)
        .getPathParam(ctx, "filename");

    invoke(handler, "serveAsset", ctx);

    verify(handler, org.mockito.Mockito.never()).setStatus(eq(ctx), eq(404));
    verify(handler).setContentType(eq(ctx), eq("image/png"));
    verify(handler).setStream(eq(ctx), any());
  }

  @Test
  public void testServeAsset_CaseInsensitiveAndExtensionRemovalFallback() throws Exception {
    File assetsDir = new File(new File(databaseContext.getDataRoot(), "TestDB"), "assets");
    assetsDir.mkdirs();
    File testSound = new File(assetsDir, "Penalty.wav");
    byte[] wavData = new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'};
    try (java.io.FileOutputStream fos = new java.io.FileOutputStream(testSound)) {
      fos.write(wavData);
    }

    // Request with lowercase and without extension
    org.mockito.Mockito.doReturn("penalty").when(handler).getPathParam(ctx, "filename");

    invoke(handler, "serveAsset", ctx);

    verify(handler, org.mockito.Mockito.never()).setStatus(eq(ctx), eq(404));
    verify(handler).setContentType(eq(ctx), eq("audio/wav"));
  }

  @Test
  public void testDownloadAsset_NotFoundAndInvalidUrls() {
    AssetService assetService = handler.getAssetService();
    when(assetService.getAssetById("null_asset")).thenReturn(null);
    org.mockito.Mockito.doReturn("null_asset").when(handler).getPathParam(ctx, "id");
    handler.downloadAsset(ctx);
    verify(handler).setStatus(eq(ctx), eq(404));

    when(assetService.getAssetById("no_url_asset")).thenReturn(AssetMessage.newBuilder().build());
    org.mockito.Mockito.doReturn("no_url_asset").when(handler).getPathParam(ctx, "id");
    handler.downloadAsset(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setStatus(eq(ctx), eq(404));

    when(assetService.getAssetById("ext_url_asset"))
        .thenReturn(AssetMessage.newBuilder().setUrl("http://example.com/pic.png").build());
    org.mockito.Mockito.doReturn("ext_url_asset").when(handler).getPathParam(ctx, "id");
    handler.downloadAsset(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setStatus(eq(ctx), eq(404));
  }

  @Test
  public void testDownloadAsset_DefaultAssetFallbackWhenNotInDb() {
    AssetService assetService = handler.getAssetService();
    when(assetService.getAssetById("default_yellow_flag")).thenReturn(null);
    org.mockito.Mockito.doReturn("default_yellow_flag").when(handler).getPathParam(ctx, "id");
    handler.downloadAsset(ctx);

    verify(handler, org.mockito.Mockito.never()).setStatus(eq(ctx), eq(404));
    verify(handler).setStream(eq(ctx), any());
  }

  @Test
  public void testDownloadAsset_DeriveFilenameFromName() throws Exception {
    File assetsDir = new File(new File(databaseContext.getDataRoot(), "TestDB"), "assets");
    assetsDir.mkdirs();
    File testFile = new File(assetsDir, "custom_1_Custom_Sound.wav");
    byte[] wavData = new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'};
    try (java.io.FileOutputStream fos = new java.io.FileOutputStream(testFile)) {
      fos.write(wavData);
    }

    AssetService assetService = handler.getAssetService();
    when(assetService.getAssetById("custom_1"))
        .thenReturn(AssetMessage.newBuilder().setName("Custom Sound").build());
    org.mockito.Mockito.doReturn("custom_1").when(handler).getPathParam(ctx, "id");

    handler.downloadAsset(ctx);

    verify(handler, org.mockito.Mockito.never()).setStatus(eq(ctx), eq(404));
    verify(handler).setStream(eq(ctx), any());
  }

  @Test
  public void testServeFile_DirectoryTraversalWithSlashes() throws Exception {
    org.mockito.Mockito.doReturn("folder/subfile.png").when(handler).getPathParam(ctx, "filename");
    invoke(handler, "serveAsset", ctx);
    verify(handler).setStatus(eq(ctx), eq(403));

    org.mockito.Mockito.doReturn("folder\\subfile.png").when(handler).getPathParam(ctx, "filename");
    invoke(handler, "serveAsset", ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setStatus(eq(ctx), eq(403));
  }
}
