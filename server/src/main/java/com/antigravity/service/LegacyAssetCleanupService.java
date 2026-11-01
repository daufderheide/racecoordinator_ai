package com.antigravity.service;

import com.antigravity.service.AssetDefaultsInitializer.DefaultAsset;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LegacyAssetCleanupService {
  private static final Logger logger = LoggerFactory.getLogger(LegacyAssetCleanupService.class);

  private final AssetService assetService;
  private final String assetDir;

  public LegacyAssetCleanupService(AssetService assetService) {
    this.assetService = assetService;
    this.assetDir = assetService.getAssetDir();
  }

  public int cleanupLegacyDuplicates() {
    if (assetDir == null) {
      return 0;
    }
    File directory = new File(assetDir);
    if (!directory.exists() || !directory.isDirectory()) {
      return 0;
    }

    File[] files = directory.listFiles();
    if (files == null || files.length == 0) {
      return 0;
    }

    List<DefaultAsset> defaultAssets = AssetDefaultsInitializer.getAllDefaultAssets();
    int removedCount = 0;

    for (File file : files) {
      if (!file.isFile()) {
        continue;
      }
      DefaultAsset matchedAsset = findMatchingDefaultAsset(file.getName(), defaultAssets);
      if (matchedAsset == null) {
        continue;
      }
      String safeDisplayName = matchedAsset.displayName.replaceAll("[^a-zA-Z0-9.-]", "_");
      String activeFilename = matchedAsset.id + "_" + safeDisplayName;
      if (file.getName().equals(activeFilename)) {
        continue;
      }
      if (processCandidate(matchedAsset, file, activeFilename)) {
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info("Legacy asset cleanup completed. Removed {} duplicate file(s).", removedCount);
    }
    return removedCount;
  }

  static DefaultAsset findMatchingDefaultAsset(String filename, List<DefaultAsset> defaultAssets) {
    if (filename == null || defaultAssets == null) {
      return null;
    }
    DefaultAsset bestMatch = null;
    int longestPrefix = -1;
    for (DefaultAsset asset : defaultAssets) {
      String prefix = asset.id + "_";
      if (filename.startsWith(prefix) && prefix.length() > longestPrefix) {
        longestPrefix = prefix.length();
        bestMatch = asset;
      }
    }
    return bestMatch;
  }

  private boolean processCandidate(DefaultAsset asset, File candidateFile, String activeFilename) {
    byte[] candidateBytes = readFileBytes(candidateFile);
    if (candidateBytes == null || candidateBytes.length == 0) {
      return false;
    }
    String candidateHash = AssetService.calculateSha256(candidateBytes);

    File activeFile = new File(assetDir, activeFilename);
    byte[] activeBytes = readFileBytes(activeFile);
    String activeHash = (activeBytes != null) ? AssetService.calculateSha256(activeBytes) : null;

    String resourcePath = AssetDefaultsInitializer.getDefaultResourcePath(asset.id);
    byte[] bundledBytes = readBundledResource(resourcePath);
    String bundledHash = (bundledBytes != null) ? AssetService.calculateSha256(bundledBytes) : null;

    if (activeHash != null && candidateHash.equalsIgnoreCase(activeHash)) {
      return deleteCandidate(
          candidateFile, "exact duplicate matching active asset (" + activeFilename + ")");
    }

    if (bundledHash != null && candidateHash.equalsIgnoreCase(bundledHash)) {
      if (!activeFile.exists()) {
        promoteCandidate(asset, candidateFile, candidateBytes);
      }
      return deleteCandidate(
          candidateFile, "stock default remnant matching bundled resource signature");
    }

    if (bundledHash != null
        && activeHash != null
        && activeHash.equalsIgnoreCase(bundledHash)
        && !candidateHash.equalsIgnoreCase(bundledHash)) {
      logger.info(
          "Detected user-customized legacy asset in '{}'. Restoring to active asset '{}'.",
          candidateFile.getName(),
          activeFilename);
      promoteCandidate(asset, candidateFile, candidateBytes);
      return deleteCandidate(candidateFile, "promoted customized legacy file to active asset");
    }

    logger.warn(
        "Legacy file '{}' differs from both active asset '{}' and bundled default (signature mismatch). Preserving to prevent data loss.",
        candidateFile.getName(),
        activeFilename);
    return false;
  }

  private void promoteCandidate(DefaultAsset asset, File candidateFile, byte[] candidateBytes) {
    try {
      String type = AssetDefaultsInitializer.getAssetTypeForDefault(asset);
      assetService.saveAsset(asset.id, asset.displayName, type, candidateBytes);
      logger.info(
          "Successfully promoted legacy file '{}' to active asset '{}'",
          candidateFile.getName(),
          asset.id);
    } catch (Exception e) {
      logger.error(
          "Failed to promote legacy file '{}' for asset '{}'",
          candidateFile.getAbsolutePath(),
          asset.id,
          e);
    }
  }

  private boolean deleteCandidate(File file, String reason) {
    try {
      boolean deleted = Files.deleteIfExists(file.toPath());
      if (deleted) {
        logger.info("Safely deleted legacy asset file: {} [{}]", file.getName(), reason);
        return true;
      }
    } catch (IOException e) {
      logger.error("Failed to delete legacy asset file: {}", file.getAbsolutePath(), e);
    }
    return false;
  }

  private byte[] readFileBytes(File file) {
    if (file == null || !file.exists() || !file.isFile()) {
      return null;
    }
    try {
      return Files.readAllBytes(file.toPath());
    } catch (IOException e) {
      logger.warn("Failed to read bytes from file: {}", file.getAbsolutePath(), e);
      return null;
    }
  }

  private byte[] readBundledResource(String resourcePath) {
    if (resourcePath == null) {
      return null;
    }
    try (InputStream is = getClass().getResourceAsStream(resourcePath)) {
      if (is == null) {
        return null;
      }
      ByteArrayOutputStream buffer = new ByteArrayOutputStream();
      byte[] data = new byte[8192];
      int nRead;
      while ((nRead = is.read(data, 0, data.length)) != -1) {
        buffer.write(data, 0, nRead);
      }
      return buffer.toByteArray();
    } catch (IOException e) {
      logger.warn("Failed to read bundled resource: {}", resourcePath, e);
      return null;
    }
  }
}
