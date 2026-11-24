package com.antigravity.importer;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.AssetMessage;
import com.antigravity.service.AssetDefaultsInitializer;
import com.antigravity.service.AssetService;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Collects the media files (pictures and sounds) that an export ZIP carries next to its data file.
 *
 * <p>For each asset URL, id, preset or built-in default it finds the file's bytes, stores each file
 * only once (matched by its contents), gives it a unique name inside the ZIP and remembers which
 * ZIP entry every spelling of that URL points to. The exporters then write those entry names into
 * their data file.
 */
public class ExportMediaCollector {

  /** Media type for pictures: stored under {@code images/}. */
  public static final String IMAGE = "image";

  /** Media type for sounds: stored under {@code audio/}. */
  public static final String SOUND = "sound";

  private static final Logger logger = LoggerFactory.getLogger(ExportMediaCollector.class);

  /** One media file that goes into the export ZIP. */
  public static class MediaFile {
    private final String zipEntryName;
    private final byte[] data;
    private final String hash;

    public MediaFile(String zipEntryName, byte[] data, String hash) {
      this.zipEntryName = zipEntryName;
      this.data = data;
      this.hash = hash;
    }

    public String getZipEntryName() {
      return zipEntryName;
    }

    public byte[] getData() {
      return data;
    }

    public String getHash() {
      return hash;
    }
  }

  private static class ResolvedAsset {
    final byte[] data;
    final String suggestedName;

    ResolvedAsset(byte[] data, String suggestedName) {
      this.data = data;
      this.suggestedName = suggestedName;
    }
  }

  private final DatabaseContext databaseContext;
  private final AssetService assetService;
  private final Map<String, MediaFile> hashToFileMap = new LinkedHashMap<>();
  private final Map<String, String> urlToZipEntryMap = new HashMap<>();
  private final Set<String> usedEntryNames = new HashSet<>();

  public ExportMediaCollector(DatabaseContext databaseContext, AssetService assetService) {
    this.databaseContext = databaseContext;
    this.assetService = assetService;
  }

  /**
   * Adds the file behind {@code urlOrId} to the export. Does nothing for an empty value, for a file
   * that can't be found, or for a URL that was added before. A file with the same contents as one
   * added before is not stored twice: the URL then points to the existing ZIP entry.
   *
   * @param mediaType {@link #IMAGE} or {@link #SOUND}
   */
  public void add(String urlOrId, String mediaType) {
    if (urlOrId == null || urlOrId.trim().isEmpty()) {
      return;
    }
    String key = urlOrId.trim();
    if (urlToZipEntryMap.containsKey(key)) {
      return;
    }

    ResolvedAsset asset = resolveAssetData(key);
    if (asset == null || asset.data == null || asset.data.length == 0) {
      return;
    }

    String hash = AssetService.calculateSha256(asset.data);
    if (hashToFileMap.containsKey(hash)) {
      // The same picture or sound is used elsewhere: reuse its entry.
      registerUrlMappings(key, hashToFileMap.get(hash).getZipEntryName());
      return;
    }

    String folder = IMAGE.equals(mediaType) ? "images/" : "audio/";
    String uniqueName = chooseUniqueEntryName(asset.suggestedName, mediaType, folder);
    String zipEntryName = folder + uniqueName;
    usedEntryNames.add(zipEntryName.toLowerCase(Locale.ROOT));

    hashToFileMap.put(hash, new MediaFile(zipEntryName, asset.data, hash));
    registerUrlMappings(key, zipEntryName);
  }

  /**
   * Which ZIP entry each added URL points to, including the other spellings of the same URL (with
   * or without {@code preset:} or {@code /assets/}, and the ids of built-in defaults).
   */
  public Map<String, String> getUrlToZipEntryMap() {
    return Collections.unmodifiableMap(urlToZipEntryMap);
  }

  /** The collected files, each once, in the order they were first added. */
  public Collection<MediaFile> getFiles() {
    return Collections.unmodifiableCollection(hashToFileMap.values());
  }

  /** Builds the export ZIP: the data file first, then the media files. */
  public static byte[] buildZip(
      String dataFileName, byte[] dataFileBytes, Iterable<MediaFile> mediaFiles)
      throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zos = new ZipOutputStream(baos)) {
      zos.putNextEntry(new ZipEntry(dataFileName));
      zos.write(dataFileBytes);
      zos.closeEntry();

      for (MediaFile media : mediaFiles) {
        zos.putNextEntry(new ZipEntry(media.getZipEntryName()));
        zos.write(media.getData());
        zos.closeEntry();
      }
    }
    return baos.toByteArray();
  }

  private void registerUrlMappings(String urlOrId, String zipEntryName) {
    if (urlOrId == null || urlOrId.trim().isEmpty() || zipEntryName == null) {
      return;
    }
    urlToZipEntryMap.put(urlOrId, zipEntryName);

    String clean = urlOrId.trim();
    if (clean.toLowerCase(Locale.ROOT).startsWith("preset:")) {
      String without = clean.substring(7).trim();
      urlToZipEntryMap.put(without, zipEntryName);
    } else {
      urlToZipEntryMap.put("preset:" + clean, zipEntryName);
    }

    if (clean.startsWith("/assets/")) {
      String stripped = clean.substring("/assets/".length());
      urlToZipEntryMap.put(stripped, zipEntryName);
    } else {
      urlToZipEntryMap.put("/assets/" + clean, zipEntryName);
    }

    // Default helmet url variant like /assets/default_black-yellow_Helmet_Black-Yellow
    if (clean.startsWith("/assets/default_") && clean.contains("_Helmet_")) {
      String helmetSuffix = clean.substring(clean.indexOf("_Helmet_") + 8).toLowerCase(Locale.ROOT);
      urlToZipEntryMap.put(
          "assets/defaults/helmets/helmet_" + helmetSuffix.replace(" ", "_") + ".png",
          zipEntryName);
    }

    // Map aliases for default assets
    String defaultResPath = AssetDefaultsInitializer.getDefaultResourcePath(clean);
    if (defaultResPath == null && clean.startsWith("/assets/")) {
      defaultResPath =
          AssetDefaultsInitializer.getDefaultResourcePath(clean.substring("/assets/".length()));
    }
    if (defaultResPath != null) {
      registerDefaultAssetAliases(defaultResPath, zipEntryName);
    }
  }

  private void registerDefaultAssetAliases(String defaultResPath, String zipEntryName) {
    for (AssetDefaultsInitializer.DefaultAsset def :
        AssetDefaultsInitializer.getDefaultImageAssets()) {
      String res = AssetDefaultsInitializer.getDefaultResourcePath(def.id);
      if (defaultResPath.equalsIgnoreCase(res)) {
        urlToZipEntryMap.put(def.id, zipEntryName);
        urlToZipEntryMap.put("/assets/" + def.id, zipEntryName);
        String fn = AssetDefaultsInitializer.getDefaultFilename(def.id);
        if (fn != null) {
          urlToZipEntryMap.put(fn, zipEntryName);
          urlToZipEntryMap.put("/assets/" + fn, zipEntryName);
        }
      }
    }
    for (AssetDefaultsInitializer.DefaultAsset def :
        AssetDefaultsInitializer.getDefaultAudioAssets()) {
      String res = AssetDefaultsInitializer.getDefaultResourcePath(def.id);
      if (defaultResPath.equalsIgnoreCase(res)) {
        urlToZipEntryMap.put(def.id, zipEntryName);
        urlToZipEntryMap.put("preset:" + def.id, zipEntryName);
        urlToZipEntryMap.put("/assets/" + def.id, zipEntryName);
        String fn = AssetDefaultsInitializer.getDefaultFilename(def.id);
        if (fn != null) {
          urlToZipEntryMap.put(fn, zipEntryName);
          urlToZipEntryMap.put("/assets/" + fn, zipEntryName);
        }
      }
    }
  }

  private ResolvedAsset resolveAssetData(String urlOrId) {
    if (urlOrId == null || urlOrId.trim().isEmpty()) {
      return null;
    }

    String cleanUrl = urlOrId.trim();
    if (cleanUrl.toLowerCase(Locale.ROOT).startsWith("preset:")) {
      cleanUrl = cleanUrl.substring(7).trim();
    }

    String currentDbName =
        databaseContext != null && databaseContext.getCurrentDatabaseName() != null
            ? databaseContext.getCurrentDatabaseName()
            : "RaceCoordinator_AI_DB";
    File assetsDir =
        databaseContext != null
            ? new File(new File(databaseContext.getDataRoot(), currentDbName), "assets")
            : new File("assets");

    String filename =
        cleanUrl.startsWith("/assets/") ? cleanUrl.substring("/assets/".length()) : cleanUrl;

    String defaultResPath = AssetDefaultsInitializer.getDefaultResourcePath(cleanUrl);
    if (defaultResPath == null) {
      defaultResPath = AssetDefaultsInitializer.getDefaultResourcePath(filename);
    }
    String defaultSuggestedName = defaultResPath != null ? extractSimpleName(defaultResPath) : null;

    // 1. Check physical file directly in assets directory
    File directFile = new File(assetsDir, filename);
    if (directFile.exists() && directFile.isFile() && directFile.length() > 0) {
      try {
        byte[] bytes = Files.readAllBytes(directFile.toPath());
        String suggested =
            defaultSuggestedName != null ? defaultSuggestedName : extractSimpleName(filename);
        return new ResolvedAsset(bytes, suggested);
      } catch (Exception e) {
        logger.warn("Could not read asset file: {}", directFile.getAbsolutePath(), e);
      }
    }

    // 2. Try finding via AssetService metadata
    if (assetService != null) {
      AssetMessage assetMsg = assetService.getAssetById(filename);
      if (assetMsg == null && filename.contains("_") && !filename.startsWith("default_")) {
        String idPrefix = filename.substring(0, filename.indexOf('_'));
        assetMsg = assetService.getAssetById(idPrefix);
      }
      if (assetMsg != null) {
        String realFilename =
            assetMsg.getUrl() != null && assetMsg.getUrl().startsWith("/assets/")
                ? assetMsg.getUrl().substring("/assets/".length())
                : filename;
        File assetFile = new File(assetsDir, realFilename);
        if (assetFile.exists() && assetFile.isFile() && assetFile.length() > 0) {
          try {
            byte[] bytes = Files.readAllBytes(assetFile.toPath());
            String name =
                defaultSuggestedName != null
                    ? defaultSuggestedName
                    : (assetMsg.getName() != null && !assetMsg.getName().isEmpty()
                        ? assetMsg.getName()
                        : extractSimpleName(realFilename));
            return new ResolvedAsset(bytes, name);
          } catch (Exception e) {
            logger.warn(
                "Could not read asset file from service metadata: {}",
                assetFile.getAbsolutePath(),
                e);
          }
        }
      }
    }

    // 3. Check case-insensitive match in assets directory
    if (assetsDir.exists() && assetsDir.isDirectory()) {
      File[] matching =
          assetsDir.listFiles(
              (d, name) -> name.equalsIgnoreCase(filename) || name.endsWith("_" + filename));
      if (matching != null && matching.length > 0) {
        try {
          byte[] bytes = Files.readAllBytes(matching[0].toPath());
          String suggested =
              defaultSuggestedName != null
                  ? defaultSuggestedName
                  : extractSimpleName(matching[0].getName());
          return new ResolvedAsset(bytes, suggested);
        } catch (Exception e) {
          logger.warn(
              "Could not read case-matched asset file: {}", matching[0].getAbsolutePath(), e);
        }
      }
    }

    // 4. Default resource fallback from classpath if not present on disk
    if (defaultResPath != null) {
      byte[] bytes = readResourceBytes(defaultResPath);
      if (bytes != null && bytes.length > 0) {
        return new ResolvedAsset(bytes, defaultSuggestedName);
      }
    }

    return null;
  }

  private byte[] readResourceBytes(String resourcePath) {
    if (resourcePath == null) {
      return null;
    }
    try (InputStream is = AssetDefaultsInitializer.class.getResourceAsStream(resourcePath)) {
      if (is == null) {
        return null;
      }
      ByteArrayOutputStream buffer = new ByteArrayOutputStream();
      byte[] buf = new byte[8192];
      int nRead;
      while ((nRead = is.read(buf, 0, buf.length)) != -1) {
        buffer.write(buf, 0, nRead);
      }
      return buffer.toByteArray();
    } catch (Exception e) {
      logger.warn("Could not read default resource bytes: {}", resourcePath, e);
      return null;
    }
  }

  private String extractSimpleName(String filename) {
    if (filename == null) return "sound.wav";
    String simple = filename;
    int slashIdx = Math.max(simple.lastIndexOf('/'), simple.lastIndexOf('\\'));
    if (slashIdx >= 0) {
      simple = simple.substring(slashIdx + 1);
    }
    // If UUID prefix (e.g. 12345678-1234-..._beep.wav or uuid_beep.wav), strip it
    int underscoreIdx = simple.indexOf('_');
    if (underscoreIdx > 0 && underscoreIdx < simple.length() - 1) {
      simple = simple.substring(underscoreIdx + 1);
    }
    return simple;
  }

  private String chooseUniqueEntryName(String suggestedName, String mediaType, String folder) {
    String baseName =
        suggestedName != null && !suggestedName.trim().isEmpty() ? suggestedName.trim() : "";
    baseName = baseName.replaceAll("[^a-zA-Z0-9.-]", "_");

    if (baseName.isEmpty() || baseName.startsWith(".")) {
      baseName = IMAGE.equals(mediaType) ? "avatar.png" : "audio.wav";
    }

    String name = baseName;
    String nameWithoutExt = name;
    String ext = "";
    int dotIdx = name.lastIndexOf('.');
    if (dotIdx > 0) {
      nameWithoutExt = name.substring(0, dotIdx);
      ext = name.substring(dotIdx);
    }

    if (ext.isEmpty()) {
      ext = IMAGE.equals(mediaType) ? ".png" : ".wav";
      name = nameWithoutExt + ext;
    }

    int counter = 1;
    while (usedEntryNames.contains((folder + name).toLowerCase(Locale.ROOT))) {
      name = nameWithoutExt + "_" + counter + ext;
      counter++;
    }
    return name;
  }
}
