
package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.*;
import com.antigravity.service.AssetService;
import io.javalin.http.Context;

import java.util.List;

public class AssetTaskHandler {

  private final AssetService assetService;
  private final DatabaseContext databaseContext; // Added field

  public AssetTaskHandler(DatabaseContext databaseContext, io.javalin.Javalin app) { // Changed parameter type
    this.databaseContext = databaseContext; // Initialize new field
    this.assetService = new AssetService(databaseContext.getDatabase()); // Modified AssetService initialization

    app.get("/api/assets/list", this::listAssets);
    app.post("/api/assets/upload", this::uploadAsset);
    app.post("/api/assets/delete", this::deleteAsset);
    app.post("/api/assets/rename", this::renameAsset);
    app.get("/assets/{filename}", this::serveAsset);
  }

  private void serveAsset(Context ctx) {
    String filename = ctx.pathParam("filename");
    // Security check: prevent directory traversal
    if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
      ctx.status(403).result("Forbidden");
      return;
    }

    String currentDbName = databaseContext.getCurrentDatabaseName();
    if (currentDbName == null)
      currentDbName = "Race Coordinator AI DB";
    java.io.File file = new java.io.File("data/" + currentDbName + "/assets", filename);
    if (file.exists() && file.isFile()) {
      try {
        ctx.result(new java.io.FileInputStream(file));
        // Simple content type mapping
        String lowerName = filename.toLowerCase();
        if (lowerName.endsWith(".png"))
          ctx.contentType("image/png");
        else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg"))
          ctx.contentType("image/jpeg");
        else if (lowerName.endsWith(".gif"))
          ctx.contentType("image/gif");
        else if (lowerName.endsWith(".mp3"))
          ctx.contentType("audio/mpeg");
        else if (lowerName.endsWith(".wav"))
          ctx.contentType("audio/wav");
        else
          ctx.contentType("application/octet-stream");
      } catch (java.io.FileNotFoundException e) {
        ctx.status(404).result("Not Found");
      }
    } else {
      ctx.status(404).result("Not Found");
    }
  }

  private void listAssets(Context ctx) {
    try {
      AssetService service = new AssetService(databaseContext.getDatabase()); // Instantiate AssetService per request
      List<Asset> assets = service.getAllAssets(); // Changed type to IAsset and used local service
      ListAssetsResponse response = ListAssetsResponse.newBuilder()
          .addAllAssets(assets)
          .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      ctx.status(500).result("Error listing assets: " + e.getMessage());
      e.printStackTrace();
    }
  }

  private void uploadAsset(Context ctx) {
    try {
      UploadAssetRequest request = UploadAssetRequest.parseFrom(ctx.bodyAsBytes());
      AssetService service = new AssetService(databaseContext.getDatabase()); // Instantiate AssetService per request
      Asset asset = service.saveAsset(request.getName(), request.getType(), request.getData().toByteArray()); // Changed
                                                                                                              // type
                                                                                                              // to
                                                                                                              // IAsset
                                                                                                              // and
                                                                                                              // used
                                                                                                              // local
                                                                                                              // service

      UploadAssetResponse response = UploadAssetResponse.newBuilder()
          .setSuccess(true)
          .setMessage("Asset uploaded successfully")
          .setAsset(asset)
          .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      UploadAssetResponse response = UploadAssetResponse.newBuilder()
          .setSuccess(false)
          .setMessage("Error uploading asset: " + e.getMessage())
          .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    }
  }

  private void deleteAsset(Context ctx) {
    try {
      DeleteAssetRequest request = DeleteAssetRequest.parseFrom(ctx.bodyAsBytes());
      AssetService service = new AssetService(databaseContext.getDatabase()); // Instantiate AssetService per request
      boolean success = service.deleteAsset(request.getId()); // Used local service

      DeleteAssetResponse response = DeleteAssetResponse.newBuilder()
          .setSuccess(success)
          .setMessage(success ? "Asset deleted" : "Asset not found or could not be deleted")
          .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      DeleteAssetResponse response = DeleteAssetResponse.newBuilder()
          .setSuccess(false)
          .setMessage("Error deleting asset: " + e.getMessage())
          .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    }
  }

  private void renameAsset(Context ctx) {
    try {
      RenameAssetRequest request = RenameAssetRequest.parseFrom(ctx.bodyAsBytes());
      AssetService service = new AssetService(databaseContext.getDatabase()); // Instantiate AssetService per request
      boolean success = service.renameAsset(request.getId(), request.getNewName()); // Used local service

      RenameAssetResponse response = RenameAssetResponse.newBuilder()
          .setSuccess(success)
          .setMessage(success ? "Asset renamed" : "Asset not found")
          .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      e.printStackTrace();
      RenameAssetResponse response = RenameAssetResponse.newBuilder()
          .setSuccess(false)
          .setMessage("Error renaming asset: " + e.getMessage())
          .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    }
  }
}
