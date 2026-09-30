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
import com.antigravity.service.AssetDefaultsInitializer;
import com.antigravity.service.AssetService;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
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
    if (currentDbName == null || currentDbName.trim().isEmpty()) {
      currentDbName = "RaceCoordinator_AI_DB";
    }
    File assetsDir = new File(new File(databaseContext.getDataRoot(), currentDbName), "assets");
    return new AssetService(databaseContext, assetsDir.getAbsolutePath());
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
      String defaultFilename = AssetDefaultsInitializer.getDefaultFilename(id);
      if (defaultFilename != null) {
        serveFile(ctx, defaultFilename);
        return;
      }
      if (AssetDefaultsInitializer.getDefaultResourcePath(id) != null
          || id.startsWith("default_")) {
        serveFile(ctx, id);
        return;
      }
      setStatus(ctx, 404);
      setResult(ctx, "Asset not found");
      return;
    }

    String url = asset.getUrl();
    String filename = null;
    if (url != null && url.startsWith("/assets/")) {
      filename = url.substring("/assets/".length());
    } else if (asset.getName() != null && !asset.getName().isEmpty()) {
      filename = id + "_" + asset.getName().replaceAll("[^a-zA-Z0-9.-]", "_");
    }

    if (filename == null) {
      filename = id;
    }

    serveFile(ctx, filename);
  }

  private void serveAsset(Context ctx) {
    String filename = getPathParam(ctx, "filename");
    serveFile(ctx, filename);
  }

  public static String detectContentType(String filename, byte[] headerBytes) {
    String lowerName = (filename != null) ? filename.toLowerCase() : "";
    if (lowerName.endsWith(".png")) return "image/png";
    if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
    if (lowerName.endsWith(".gif")) return "image/gif";
    if (lowerName.endsWith(".svg")) return "image/svg+xml";
    if (lowerName.endsWith(".webp")) return "image/webp";
    if (lowerName.endsWith(".ico")) return "image/x-icon";
    if (lowerName.endsWith(".mp3")) return "audio/mpeg";
    if (lowerName.endsWith(".wav")) return "audio/wav";
    if (lowerName.endsWith(".ogg")) return "audio/ogg";

    // Magic bytes detection
    if (headerBytes != null && headerBytes.length >= 4) {
      // PNG: 89 50 4E 47
      if ((headerBytes[0] & 0xFF) == 0x89
          && headerBytes[1] == 'P'
          && headerBytes[2] == 'N'
          && headerBytes[3] == 'G') {
        return "image/png";
      }
      // JPEG: FF D8 FF
      if ((headerBytes[0] & 0xFF) == 0xFF
          && (headerBytes[1] & 0xFF) == 0xD8
          && (headerBytes[2] & 0xFF) == 0xFF) {
        return "image/jpeg";
      }
      // GIF: GIF8
      if (headerBytes[0] == 'G'
          && headerBytes[1] == 'I'
          && headerBytes[2] == 'F'
          && headerBytes[3] == '8') {
        return "image/gif";
      }
      // RIFF header (WAV or WEBP)
      if (headerBytes.length >= 12
          && headerBytes[0] == 'R'
          && headerBytes[1] == 'I'
          && headerBytes[2] == 'F'
          && headerBytes[3] == 'F') {
        if (headerBytes[8] == 'W'
            && headerBytes[9] == 'A'
            && headerBytes[10] == 'V'
            && headerBytes[11] == 'E') {
          return "audio/wav";
        }
        if (headerBytes[8] == 'W'
            && headerBytes[9] == 'E'
            && headerBytes[10] == 'B'
            && headerBytes[11] == 'P') {
          return "image/webp";
        }
      }
      // ID3 or MP3 sync word
      if (headerBytes[0] == 'I' && headerBytes[1] == 'D' && headerBytes[2] == '3') {
        return "audio/mpeg";
      }
      if ((headerBytes[0] & 0xFF) == 0xFF && (headerBytes[1] & 0xE0) == 0xE0) {
        return "audio/mpeg";
      }
      // OggS
      if (headerBytes[0] == 'O'
          && headerBytes[1] == 'g'
          && headerBytes[2] == 'g'
          && headerBytes[3] == 'S') {
        return "audio/ogg";
      }
      // SVG text check
      String start =
          new String(headerBytes, 0, Math.min(headerBytes.length, 64), StandardCharsets.UTF_8)
              .trim()
              .toLowerCase();
      if (start.startsWith("<svg") || start.contains("<svg") || start.startsWith("<?xml")) {
        return "image/svg+xml";
      }
    }

    return "application/octet-stream";
  }

  private void servePhysicalFile(Context ctx, File file) {
    try {
      byte[] header = new byte[64];
      int bytesRead;
      try (FileInputStream headerIs = new FileInputStream(file)) {
        bytesRead = headerIs.read(header);
      }
      String contentType = detectContentType(file.getName(), bytesRead > 0 ? header : null);
      setContentType(ctx, contentType);
      ctx.header("Accept-Ranges", "bytes");
      ctx.header("Content-Length", String.valueOf(file.length()));
      ctx.header("Cache-Control", "public, max-age=86400");
      setStream(ctx, new FileInputStream(file));
    } catch (FileNotFoundException e) {
      setStatus(ctx, 404);
      setResult(ctx, "Not Found");
    } catch (IOException e) {
      setStatus(ctx, 500);
      setResult(ctx, "Error reading file: " + e.getMessage());
    }
  }

  private boolean serveDefaultResourceFallback(Context ctx, String filename, File assetsDir) {
    String resourcePath = AssetDefaultsInitializer.getDefaultResourcePath(filename);
    if (resourcePath == null) {
      return false;
    }
    try (InputStream is = getClass().getResourceAsStream(resourcePath)) {
      if (is == null) {
        return false;
      }
      ByteArrayOutputStream buffer = new ByteArrayOutputStream();
      byte[] data = new byte[8192];
      int nRead;
      while ((nRead = is.read(data, 0, data.length)) != -1) {
        buffer.write(data, 0, nRead);
      }
      byte[] bytes = buffer.toByteArray();
      String contentType = detectContentType(resourcePath, bytes);
      setContentType(ctx, contentType);
      ctx.header("Accept-Ranges", "bytes");
      ctx.header("Content-Length", String.valueOf(bytes.length));
      ctx.header("Cache-Control", "public, max-age=86400");
      setStream(ctx, new ByteArrayInputStream(bytes));

      // Self-heal: persist to assetsDir on disk
      try {
        if (!assetsDir.exists()) {
          assetsDir.mkdirs();
        }
        String saveName = AssetDefaultsInitializer.getDefaultFilename(filename);
        if (saveName == null) {
          saveName = filename;
        }
        File targetFile = new File(assetsDir, saveName);
        if (!targetFile.exists()) {
          try (FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write(bytes);
          }
        }
      } catch (Exception ignored) {
      }
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  private boolean serveWebStaticFallback(Context ctx, String filename) {
    String[] possiblePaths = {"client/dist/client", "../client/dist/client", "web", "server/web"};
    for (String basePath : possiblePaths) {
      File staticAsset = new File(basePath + "/assets", filename);
      if (staticAsset.exists() && staticAsset.isFile()) {
        servePhysicalFile(ctx, staticAsset);
        return true;
      }
      File directAsset = new File(basePath, filename);
      if (directAsset.exists() && directAsset.isFile()) {
        servePhysicalFile(ctx, directAsset);
        return true;
      }
    }
    return false;
  }

  private void serveFile(Context ctx, String filename) {
    // Security check: prevent directory traversal
    if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
      setStatus(ctx, 403);
      setResult(ctx, "Forbidden");
      return;
    }

    String currentDbName = databaseContext.getCurrentDatabaseName();
    if (currentDbName == null || currentDbName.trim().isEmpty()) {
      currentDbName = "RaceCoordinator_AI_DB";
    }
    File assetsDir = new File(new File(databaseContext.getDataRoot(), currentDbName), "assets");
    File file = new File(assetsDir, filename);
    if (!file.exists() || !file.isFile()) {
      // Try fallback: Case-insensitive search or common misspellings for default assets
      if (assetsDir.exists() && assetsDir.isDirectory()) {
        File[] matchingFiles =
            assetsDir.listFiles(
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
                  if (candidateBase.equals(targetBase)) return true;
                  return candidate.startsWith(target + "_");
                });
        if (matchingFiles != null && matchingFiles.length > 0) {
          file = matchingFiles[0];
        }
      }
    }

    if (file.exists() && file.isFile()) {
      servePhysicalFile(ctx, file);
      return;
    }

    if (serveDefaultResourceFallback(ctx, filename, assetsDir)) {
      return;
    }

    if (serveWebStaticFallback(ctx, filename)) {
      return;
    }

    setStatus(ctx, 404);
    setResult(ctx, "Not Found");
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
