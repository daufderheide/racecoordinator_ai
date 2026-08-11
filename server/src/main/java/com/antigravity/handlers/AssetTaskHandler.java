package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.DeleteAssetRequest;
import com.antigravity.proto.DeleteAssetResponse;
import com.antigravity.proto.ListAssetsResponse;
import com.antigravity.proto.RenameAssetRequest;
import com.antigravity.proto.RenameAssetResponse;
import com.antigravity.proto.SaveAudioSetRequest;
import com.antigravity.proto.SaveAudioSetResponse;
import com.antigravity.proto.SaveCustomRotationRequest;
import com.antigravity.proto.SaveCustomRotationResponse;
import com.antigravity.proto.SaveImageSetRequest;
import com.antigravity.proto.SaveImageSetResponse;
import com.antigravity.proto.UploadAssetRequest;
import com.antigravity.proto.UploadAssetResponse;
import com.antigravity.service.AssetService;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.List;

public class AssetTaskHandler {

  private final DatabaseContext databaseContext;

  public AssetTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;

    app.get("/api/assets/list", this::listAssets);
    app.post("/api/assets/upload", this::uploadAsset);
    app.post("/api/assets/delete", this::deleteAsset);
    app.post("/api/assets/rename", this::renameAsset);
    app.post("/api/assets/save-image-set", this::saveImageSet);
    app.post("/api/assets/save-audio-set", this::saveAudioSet);
    app.post("/api/assets/save-custom-rotation", this::saveCustomRotation);
    app.get("/api/assets/download/{id}", this::downloadAsset);
    app.get("/assets/{filename}", this::serveAsset);
  }

  protected AssetService getAssetService() {
    String currentDbName = databaseContext.getCurrentDatabaseName();
    if (currentDbName == null) {
      currentDbName = "Race Coordinator AI DB";
    }
    return new AssetService(
        databaseContext, databaseContext.getDataRoot() + currentDbName + "/assets");
  }

  void setStatus(Context ctx, int status) {
    ctx.status(status);
  }

  void setResult(Context ctx, String result) {
    ctx.result(result);
  }

  void setResult(Context ctx, byte[] result) {
    ctx.result(result);
  }

  void setJson(Context ctx, Object obj) {
    ctx.json(obj);
  }

  void setStream(Context ctx, InputStream is) {
    ctx.result(is);
  }

  void setContentType(Context ctx, String contentType) {
    ctx.contentType(contentType);
  }

  String getPathParam(Context ctx, String key) {
    return ctx.pathParam(key);
  }

  byte[] getBodyBytes(Context ctx) {
    return ctx.bodyAsBytes();
  }

  public void downloadAsset(Context ctx) {
    String id = getPathParam(ctx, "id");
    AssetService service = getAssetService();
    AssetMessage asset = service.getAssetById(id);
    if (asset == null) {
      setStatus(ctx, 404);
      setResult(ctx, "Asset not found");
      return;
    }

    String url = asset.getUrl();
    String filename = null;
    if (url != null && url.startsWith("/assets/")) {
      filename = url.substring("/assets/".length());
    }

    if (filename == null) {
      setStatus(ctx, 404);
      setResult(ctx, "Asset file not found");
      return;
    }

    serveFile(ctx, filename);
  }

  private void serveAsset(Context ctx) {
    String filename = getPathParam(ctx, "filename");
    serveFile(ctx, filename);
  }

  private void serveFile(Context ctx, String filename) {
    // Security check: prevent directory traversal
    if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
      setStatus(ctx, 403);
      setResult(ctx, "Forbidden");
      return;
    }

    String currentDbName = databaseContext.getCurrentDatabaseName();
    if (currentDbName == null) {
      currentDbName = "Race Coordinator AI DB";
    }
    File file = new File(databaseContext.getDataRoot() + currentDbName + "/assets", filename);
    if (!file.exists() || !file.isFile()) {
      // Try fallback: Case-insensitive search or common misspellings for default assets
      File dir = new File(databaseContext.getDataRoot() + currentDbName + "/assets");
      if (dir.exists() && dir.isDirectory()) {
        File[] matchingFiles =
            dir.listFiles(
                (d, name) -> {
                  String target = filename.toLowerCase();
                  String candidate = name.toLowerCase();
                  if (candidate.equals(target)) return true;
                  // Handle cases where extension was added/removed (e.g., penalty.wav vs Penalty)
                  String targetBase =
                      target.contains(".") ? target.substring(0, target.lastIndexOf('.')) : target;
                  String candidateBase =
                      candidate.contains(".")
                          ? candidate.substring(0, candidate.lastIndexOf('.'))
                          : candidate;
                  return candidateBase.equals(targetBase);
                });
        if (matchingFiles != null && matchingFiles.length > 0) {
          file = matchingFiles[0];
        }
      }
    }

    if (file.exists() && file.isFile()) {
      try {
        setStream(ctx, new FileInputStream(file));
        // Simple content type mapping
        String lowerName = file.getName().toLowerCase();
        if (lowerName.endsWith(".png")) {
          setContentType(ctx, "image/png");
        } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
          setContentType(ctx, "image/jpeg");
        } else if (lowerName.endsWith(".gif")) {
          setContentType(ctx, "image/gif");
        } else if (lowerName.endsWith(".mp3")) {
          setContentType(ctx, "audio/mpeg");
        } else if (lowerName.endsWith(".wav")) {
          setContentType(ctx, "audio/wav");
        } else {
          setContentType(ctx, "application/octet-stream");
        }
      } catch (FileNotFoundException e) {
        setStatus(ctx, 404);
        setResult(ctx, "Not Found");
      }
    } else {
      setStatus(ctx, 404);
      setResult(ctx, "Not Found");
    }
  }

  private void listAssets(Context ctx) {
    try {
      AssetService service = getAssetService();
      List<AssetMessage> assets = service.getAllAssets();
      ListAssetsResponse response = ListAssetsResponse.newBuilder().addAllAssets(assets).build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    } catch (Exception e) {
      setStatus(ctx, 500);
      setResult(ctx, "Error listing assets: " + e.getMessage());
      e.printStackTrace();
    }
  }

  private void uploadAsset(Context ctx) {
    try {
      UploadAssetRequest request = UploadAssetRequest.parseFrom(getBodyBytes(ctx));
      AssetService service = getAssetService();
      AssetMessage asset =
          service.saveAsset(request.getName(), request.getType(), request.getData().toByteArray());

      UploadAssetResponse response =
          UploadAssetResponse.newBuilder()
              .setSuccess(true)
              .setMessage("Asset uploaded successfully")
              .setAsset(asset)
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      UploadAssetResponse response =
          UploadAssetResponse.newBuilder()
              .setSuccess(false)
              .setMessage("Error uploading asset: " + e.getMessage())
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    }
  }

  public void deleteAsset(Context ctx) {
    try {
      DeleteAssetRequest request = DeleteAssetRequest.parseFrom(getBodyBytes(ctx));
      AssetService service = getAssetService();
      boolean success = service.deleteAsset(request.getId());

      DeleteAssetResponse response =
          DeleteAssetResponse.newBuilder()
              .setSuccess(success)
              .setMessage(success ? "Asset deleted" : "Asset not found or could not be deleted")
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      DeleteAssetResponse response =
          DeleteAssetResponse.newBuilder()
              .setSuccess(false)
              .setMessage("Error deleting asset: " + e.getMessage())
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    }
  }

  private void renameAsset(Context ctx) {
    try {
      RenameAssetRequest request = RenameAssetRequest.parseFrom(getBodyBytes(ctx));
      AssetService service = getAssetService();
      boolean success = service.renameAsset(request.getId(), request.getNewName());

      RenameAssetResponse response =
          RenameAssetResponse.newBuilder()
              .setSuccess(success)
              .setMessage(success ? "Asset renamed" : "Asset not found")
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      RenameAssetResponse response =
          RenameAssetResponse.newBuilder()
              .setSuccess(false)
              .setMessage("Error renaming asset: " + e.getMessage())
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    }
  }

  public void saveImageSet(Context ctx) {
    try {
      SaveImageSetRequest request = SaveImageSetRequest.parseFrom(getBodyBytes(ctx));
      AssetService service = getAssetService();
      AssetMessage asset =
          service.saveImageSet(request.getId(), request.getName(), request.getEntriesList());

      SaveImageSetResponse response =
          SaveImageSetResponse.newBuilder()
              .setSuccess(true)
              .setMessage("Image set saved successfully")
              .setAsset(asset)
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      SaveImageSetResponse response =
          SaveImageSetResponse.newBuilder()
              .setSuccess(false)
              .setMessage("Error saving image set: " + e.getMessage())
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    }
  }

  public void saveAudioSet(Context ctx) {
    try {
      SaveAudioSetRequest request = SaveAudioSetRequest.parseFrom(getBodyBytes(ctx));
      AssetService service = getAssetService();
      AssetMessage asset =
          service.saveAudioSet(request.getId(), request.getName(), request.getEntriesList());

      SaveAudioSetResponse response =
          SaveAudioSetResponse.newBuilder()
              .setSuccess(true)
              .setMessage("Audio set saved successfully")
              .setAsset(asset)
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      SaveAudioSetResponse response =
          SaveAudioSetResponse.newBuilder()
              .setSuccess(false)
              .setMessage("Error saving audio set: " + e.getMessage())
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    }
  }

  public void saveCustomRotation(Context ctx) {
    try {
      SaveCustomRotationRequest request = SaveCustomRotationRequest.parseFrom(getBodyBytes(ctx));
      AssetService service = getAssetService();
      AssetMessage asset =
          service.saveCustomRotation(
              request.getId(),
              request.getName(),
              request.getNumLanes(),
              request.getRotationsList());

      SaveCustomRotationResponse response =
          SaveCustomRotationResponse.newBuilder()
              .setSuccess(true)
              .setMessage("Custom rotation saved successfully")
              .setAsset(asset)
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      SaveCustomRotationResponse response =
          SaveCustomRotationResponse.newBuilder()
              .setSuccess(false)
              .setMessage("Error saving custom rotation: " + e.getMessage())
              .build();
      setContentType(ctx, "application/octet-stream");
      setResult(ctx, response.toByteArray());
    }
  }
}
