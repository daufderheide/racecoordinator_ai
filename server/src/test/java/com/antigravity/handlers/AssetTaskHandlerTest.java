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
}
