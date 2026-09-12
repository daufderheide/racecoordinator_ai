package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.service.ServerConfigService;
import com.antigravity.util.NativeDirectoryChooser;
import com.antigravity.util.NetworkUtils;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Task handler for server-backed Custom UI and Custom Widget directory management. Provides REST
 * endpoints for folder picking, path validation, widget discovery, and direct disk I/O.
 */
public class CustomDirectoryTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(CustomDirectoryTaskHandler.class);

  private static final List<String> SUPPORTED_CUSTOM_UI_FILES =
      Arrays.asList(
          "raceday-setup.component.html",
          "raceday.component.html",
          "race-results.component.html",
          "driver-results.component.html",
          "heat-results.component.html",
          "driver-station.component.html");

  private final ServerConfigService configService;

  public CustomDirectoryTaskHandler(Javalin app, ServerConfigService configService) {
    this.configService = configService;

    app.get("/api/filesystem/directories", this::getDirectories, Role.VIEWER);
    app.post("/api/filesystem/choose-folder", this::chooseFolder, Role.ADMIN);
    app.post("/api/filesystem/set-directory", this::setDirectory, Role.ADMIN);
    app.post("/api/filesystem/clear-directory", this::clearDirectory, Role.ADMIN);

    app.get("/api/filesystem/widgets/list", this::listWidgets, Role.VIEWER);
    app.get("/api/filesystem/widgets/file", this::getWidgetFile, Role.VIEWER);
    app.post("/api/filesystem/widgets/write-file", this::writeWidgetFile, Role.ADMIN);
    app.post("/api/filesystem/widgets/delete-dir", this::deleteWidgetDirectory, Role.ADMIN);

    app.get("/api/filesystem/custom-ui/has-files", this::hasCustomUiFiles, Role.VIEWER);
    app.get("/api/filesystem/custom-ui/file", this::getCustomUiFile, Role.VIEWER);
    app.post("/api/filesystem/custom-ui/append-file", this::appendCustomUiFile, Role.ADMIN);
    app.post("/api/filesystem/custom-ui/delete-file", this::deleteCustomUiFile, Role.ADMIN);
  }

  private static Map<String, Object> mapOf(Object... keyValues) {
    Map<String, Object> map = new HashMap<>();
    for (int i = 0; i < keyValues.length; i += 2) {
      map.put((String) keyValues[i], keyValues[i + 1]);
    }
    return map;
  }

  void getDirectories(Context ctx) {
    boolean isLocalhost = NetworkUtils.isLocalhost(ctx.ip(), null);
    Map<String, Object> response = new HashMap<>();
    response.put("customUiDirectory", configService.getCustomUiDirectory());
    response.put("customWidgetDirectory", configService.getCustomWidgetDirectory());
    response.put("isLocalhost", isLocalhost);
    ctx.json(response);
  }

  void chooseFolder(Context ctx) {
    boolean isLocalhost = NetworkUtils.isLocalhost(ctx.ip(), null);
    if (!isLocalhost) {
      ctx.status(400)
          .json(mapOf("success", false, "error", "Cannot open OS dialog on remote host"));
      return;
    }

    ChooseFolderRequest req = ctx.bodyAsClass(ChooseFolderRequest.class);
    String type = req.type != null ? req.type : "widgets";
    String title =
        req.title != null
            ? req.title
            : ("Select " + ("ui".equals(type) ? "Custom UI" : "Custom Widgets") + " Folder");

    String selectedPath = NativeDirectoryChooser.chooseDirectory(title);
    if (selectedPath == null || selectedPath.trim().isEmpty()) {
      ctx.json(mapOf("success", false, "cancelled", true));
      return;
    }

    File dir = new File(selectedPath.trim());
    if (!dir.exists() || !dir.isDirectory()) {
      ctx.status(400)
          .json(mapOf("success", false, "error", "Selected path is not a valid directory"));
      return;
    }

    String canonicalPath;
    try {
      canonicalPath = dir.getCanonicalPath();
    } catch (IOException e) {
      canonicalPath = dir.getAbsolutePath();
    }

    saveDirectorySetting(type, canonicalPath);

    Map<String, Object> result = new HashMap<>();
    result.put("success", true);
    result.put("path", canonicalPath);
    result.put("name", dir.getName());
    ctx.json(result);
  }

  void setDirectory(Context ctx) {
    SetDirectoryRequest req = ctx.bodyAsClass(SetDirectoryRequest.class);
    if (req.path == null || req.path.trim().isEmpty()) {
      ctx.status(400).json(mapOf("success", false, "error", "Path is required"));
      return;
    }

    File dir = new File(req.path.trim());
    if (!dir.exists() || !dir.isDirectory()) {
      ctx.status(400).json(mapOf("success", false, "error", "Directory does not exist"));
      return;
    }

    String canonicalPath;
    try {
      canonicalPath = dir.getCanonicalPath();
    } catch (IOException e) {
      canonicalPath = dir.getAbsolutePath();
    }

    String type = req.type != null ? req.type : "widgets";
    saveDirectorySetting(type, canonicalPath);

    Map<String, Object> result = new HashMap<>();
    result.put("success", true);
    result.put("path", canonicalPath);
    result.put("name", dir.getName());
    ctx.json(result);
  }

  void clearDirectory(Context ctx) {
    ClearDirectoryRequest req = ctx.bodyAsClass(ClearDirectoryRequest.class);
    String type = req.type != null ? req.type : "widgets";
    if ("ui".equals(type)) {
      configService.setCustomUiDirectory(null);
    } else {
      configService.setCustomWidgetDirectory(null);
    }
    ctx.json(mapOf("success", true));
  }

  private void saveDirectorySetting(String type, String path) {
    if ("ui".equals(type)) {
      configService.setCustomUiDirectory(path);
    } else {
      configService.setCustomWidgetDirectory(path);
    }
  }

  void listWidgets(Context ctx) {
    String widgetDirPath = configService.getCustomWidgetDirectory();
    if (widgetDirPath == null || widgetDirPath.trim().isEmpty()) {
      ctx.json(Collections.emptyList());
      return;
    }

    Path root = Paths.get(widgetDirPath.trim());
    if (!Files.exists(root) || !Files.isDirectory(root)) {
      ctx.json(Collections.emptyList());
      return;
    }

    List<DiscoveredWidgetDirDto> results = new ArrayList<>();
    try (Stream<Path> topLevelStream = Files.list(root)) {
      List<Path> topDirs = topLevelStream.filter(Files::isDirectory).collect(Collectors.toList());
      for (Path topDir : topDirs) {
        processTopLevelWidgetDir(topDir, results);
      }
    } catch (Exception e) {
      logger.error("Error discovering custom widgets in {}", widgetDirPath, e);
    }

    ctx.json(results);
  }

  void processTopLevelWidgetDir(Path topDir, List<DiscoveredWidgetDirDto> results) {
    Path topManifest = topDir.resolve("widget.json");
    if (Files.isRegularFile(topManifest)) {
      results.add(
          new DiscoveredWidgetDirDto(
              topDir.getFileName().toString(),
              topDir.getFileName().toString(),
              "custom-root",
              null));
      return;
    }

    String groupName = topDir.getFileName().toString();
    try (Stream<Path> childStream = Files.list(topDir)) {
      List<Path> childDirs = childStream.filter(Files::isDirectory).collect(Collectors.toList());
      if (childDirs.isEmpty()) {
        results.add(
            new DiscoveredWidgetDirDto(
                topDir.getFileName().toString(),
                topDir.getFileName().toString(),
                "custom-root",
                null));
        return;
      }

      for (Path childDir : childDirs) {
        processGroupChildWidgetDir(groupName, childDir, results);
      }
    } catch (Exception e) {
      logger.error("Error inspecting group directory {}", topDir, e);
    }
  }

  void processGroupChildWidgetDir(
      String groupName, Path childDir, List<DiscoveredWidgetDirDto> results) {
    Path childManifest = childDir.resolve("widget.json");
    if (Files.isRegularFile(childManifest)) {
      String rel = groupName + "/" + childDir.getFileName().toString();
      results.add(
          new DiscoveredWidgetDirDto(childDir.getFileName().toString(), rel, groupName, null));
      return;
    }

    String subgroupName = childDir.getFileName().toString();
    try (Stream<Path> subChildStream = Files.list(childDir)) {
      List<Path> subDirs = subChildStream.filter(Files::isDirectory).collect(Collectors.toList());
      for (Path subDir : subDirs) {
        Path subManifest = subDir.resolve("widget.json");
        if (Files.isRegularFile(subManifest)) {
          String rel = groupName + "/" + subgroupName + "/" + subDir.getFileName().toString();
          results.add(
              new DiscoveredWidgetDirDto(
                  subDir.getFileName().toString(), rel, groupName, subgroupName));
        }
      }
    } catch (Exception e) {
      logger.error("Error inspecting subgroup directory {}", childDir, e);
    }
  }

  void getWidgetFile(Context ctx) {
    String widgetDirPath = configService.getCustomWidgetDirectory();
    if (widgetDirPath == null) {
      ctx.status(404).result("Custom widget directory not configured");
      return;
    }

    String widgetPath = ctx.queryParam("path");
    String filename = ctx.queryParam("file");
    if (filename == null || filename.isEmpty()) {
      ctx.status(400).result("File parameter is required");
      return;
    }

    Path root = Paths.get(widgetDirPath).normalize();
    Path target =
        (widgetPath != null && !widgetPath.isEmpty())
            ? root.resolve(widgetPath).resolve(filename).normalize()
            : root.resolve(filename).normalize();

    if (!target.startsWith(root)) {
      ctx.status(400).result("Invalid path traversal");
      return;
    }

    if (!Files.exists(target) || !Files.isRegularFile(target)) {
      ctx.status(404).result("File not found");
      return;
    }

    try {
      String content = new String(Files.readAllBytes(target), StandardCharsets.UTF_8);
      ctx.result(content);
    } catch (IOException e) {
      ctx.status(500).result("Error reading file: " + e.getMessage());
    }
  }

  void writeWidgetFile(Context ctx) {
    String widgetDirPath = configService.getCustomWidgetDirectory();
    if (widgetDirPath == null) {
      ctx.status(400)
          .json(mapOf("success", false, "error", "Custom widget directory not configured"));
      return;
    }

    WriteWidgetFileRequest req = ctx.bodyAsClass(WriteWidgetFileRequest.class);
    if (req.file == null || req.file.isEmpty()) {
      ctx.status(400).json(mapOf("success", false, "error", "Filename is required"));
      return;
    }

    Path root = Paths.get(widgetDirPath).normalize();
    Path targetDir =
        (req.path != null && !req.path.isEmpty()) ? root.resolve(req.path).normalize() : root;
    Path targetFile = targetDir.resolve(req.file).normalize();

    if (!targetFile.startsWith(root)) {
      ctx.status(400).json(mapOf("success", false, "error", "Invalid path traversal"));
      return;
    }

    try {
      if (targetFile.getParent() != null) {
        Files.createDirectories(targetFile.getParent());
      }
      byte[] bytes = (req.content != null ? req.content : "").getBytes(StandardCharsets.UTF_8);
      Files.write(
          targetFile, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
      ctx.json(mapOf("success", true));
    } catch (IOException e) {
      ctx.status(500)
          .json(mapOf("success", false, "error", "Failed to write file: " + e.getMessage()));
    }
  }

  void deleteWidgetDirectory(Context ctx) {
    String widgetDirPath = configService.getCustomWidgetDirectory();
    if (widgetDirPath == null) {
      ctx.status(400)
          .json(mapOf("success", false, "error", "Custom widget directory not configured"));
      return;
    }

    DeleteWidgetDirRequest req = ctx.bodyAsClass(DeleteWidgetDirRequest.class);
    if (req.path == null || req.path.isEmpty()) {
      ctx.status(400).json(mapOf("success", false, "error", "Directory path is required"));
      return;
    }

    Path root = Paths.get(widgetDirPath).normalize();
    Path target = root.resolve(req.path).normalize();

    if (!target.startsWith(root) || target.equals(root)) {
      ctx.status(400)
          .json(mapOf("success", false, "error", "Invalid path traversal or cannot delete root"));
      return;
    }

    if (Files.exists(target)) {
      try (Stream<Path> walk = Files.walk(target)) {
        walk.sorted(Comparator.reverseOrder())
            .forEach(
                p -> {
                  try {
                    Files.delete(p);
                  } catch (IOException ignored) {
                    // Best effort
                  }
                });
      } catch (IOException e) {
        ctx.status(500)
            .json(
                mapOf("success", false, "error", "Failed to delete directory: " + e.getMessage()));
        return;
      }
    }

    ctx.json(mapOf("success", true));
  }

  void hasCustomUiFiles(Context ctx) {
    String uiDirPath = configService.getCustomUiDirectory();
    if (uiDirPath == null || uiDirPath.trim().isEmpty()) {
      ctx.json(mapOf("exists", false, "files", Collections.emptyList()));
      return;
    }

    Path root = Paths.get(uiDirPath.trim()).normalize();
    if (!Files.exists(root) || !Files.isDirectory(root)) {
      ctx.json(mapOf("exists", false, "files", Collections.emptyList()));
      return;
    }

    String filename = ctx.queryParam("filename");
    String subfolder = ctx.queryParam("subfolder");

    Path targetDir =
        (subfolder != null && !subfolder.isEmpty()) ? root.resolve(subfolder).normalize() : root;
    if (!targetDir.startsWith(root) || !Files.exists(targetDir)) {
      ctx.json(mapOf("exists", false, "files", Collections.emptyList()));
      return;
    }

    if (filename != null && !filename.isEmpty()) {
      Path targetFile = targetDir.resolve(filename).normalize();
      boolean exists = targetFile.startsWith(root) && Files.isRegularFile(targetFile);
      ctx.json(
          mapOf(
              "exists",
              exists,
              "files",
              exists ? Collections.singletonList(filename) : Collections.emptyList()));
      return;
    }

    List<String> presentFiles = new ArrayList<>();
    for (String supported : SUPPORTED_CUSTOM_UI_FILES) {
      Path candidate = targetDir.resolve(supported).normalize();
      if (candidate.startsWith(root) && Files.isRegularFile(candidate)) {
        presentFiles.add(supported);
      }
    }

    ctx.json(mapOf("exists", !presentFiles.isEmpty(), "files", presentFiles));
  }

  void getCustomUiFile(Context ctx) {
    String uiDirPath = configService.getCustomUiDirectory();
    if (uiDirPath == null) {
      ctx.status(404).result("Custom UI directory not configured");
      return;
    }

    String filename = ctx.queryParam("filename");
    String subfolder = ctx.queryParam("subfolder");
    if (filename == null || filename.isEmpty()) {
      ctx.status(400).result("Filename is required");
      return;
    }

    Path root = Paths.get(uiDirPath).normalize();
    Path targetDir =
        (subfolder != null && !subfolder.isEmpty()) ? root.resolve(subfolder).normalize() : root;
    Path targetFile = targetDir.resolve(filename).normalize();

    if (!targetFile.startsWith(root)) {
      ctx.status(400).result("Invalid path traversal");
      return;
    }

    if (!Files.exists(targetFile) || !Files.isRegularFile(targetFile)) {
      ctx.status(404).result("File not found");
      return;
    }

    try {
      String content = new String(Files.readAllBytes(targetFile), StandardCharsets.UTF_8);
      ctx.result(content);
    } catch (IOException e) {
      ctx.status(500).result("Error reading file: " + e.getMessage());
    }
  }

  void appendCustomUiFile(Context ctx) {
    String uiDirPath = configService.getCustomUiDirectory();
    if (uiDirPath == null) {
      ctx.status(400).json(mapOf("success", false, "error", "Custom UI directory not configured"));
      return;
    }

    AppendCustomUiFileRequest req = ctx.bodyAsClass(AppendCustomUiFileRequest.class);
    if (req.filename == null || req.filename.isEmpty()) {
      ctx.status(400).json(mapOf("success", false, "error", "Filename is required"));
      return;
    }

    Path root = Paths.get(uiDirPath).normalize();
    Path targetDir =
        (req.subfolder != null && !req.subfolder.isEmpty())
            ? root.resolve(req.subfolder).normalize()
            : root;
    Path targetFile = targetDir.resolve(req.filename).normalize();

    if (!targetFile.startsWith(root)) {
      ctx.status(400).json(mapOf("success", false, "error", "Invalid path traversal"));
      return;
    }

    try {
      if (targetFile.getParent() != null) {
        Files.createDirectories(targetFile.getParent());
      }
      byte[] bytes = (req.content != null ? req.content : "").getBytes(StandardCharsets.UTF_8);
      Files.write(targetFile, bytes, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
      ctx.json(mapOf("success", true));
    } catch (IOException e) {
      ctx.status(500)
          .json(mapOf("success", false, "error", "Failed to append file: " + e.getMessage()));
    }
  }

  void deleteCustomUiFile(Context ctx) {
    String uiDirPath = configService.getCustomUiDirectory();
    if (uiDirPath == null) {
      ctx.status(400).json(mapOf("success", false, "error", "Custom UI directory not configured"));
      return;
    }

    DeleteCustomUiFileRequest req = ctx.bodyAsClass(DeleteCustomUiFileRequest.class);
    if (req.filename == null || req.filename.isEmpty()) {
      ctx.status(400).json(mapOf("success", false, "error", "Filename is required"));
      return;
    }

    Path root = Paths.get(uiDirPath).normalize();
    Path targetDir =
        (req.subfolder != null && !req.subfolder.isEmpty())
            ? root.resolve(req.subfolder).normalize()
            : root;
    Path targetFile = targetDir.resolve(req.filename).normalize();

    if (!targetFile.startsWith(root)) {
      ctx.status(400).json(mapOf("success", false, "error", "Invalid path traversal"));
      return;
    }

    try {
      Files.deleteIfExists(targetFile);
      ctx.json(mapOf("success", true));
    } catch (IOException e) {
      ctx.status(500)
          .json(mapOf("success", false, "error", "Failed to delete file: " + e.getMessage()));
    }
  }

  public static class DiscoveredWidgetDirDto {
    public String name;
    public String relativePath;
    public String group;
    public String subgroup;

    public DiscoveredWidgetDirDto() {}

    public DiscoveredWidgetDirDto(String name, String relativePath, String group, String subgroup) {
      this.name = name;
      this.relativePath = relativePath;
      this.group = group;
      this.subgroup = subgroup;
    }
  }

  public static class ChooseFolderRequest {
    @JsonProperty("type")
    public String type;

    @JsonProperty("title")
    public String title;
  }

  public static class SetDirectoryRequest {
    @JsonProperty("type")
    public String type;

    @JsonProperty("path")
    public String path;
  }

  public static class ClearDirectoryRequest {
    @JsonProperty("type")
    public String type;
  }

  public static class WriteWidgetFileRequest {
    @JsonProperty("path")
    public String path;

    @JsonProperty("file")
    public String file;

    @JsonProperty("content")
    public String content;
  }

  public static class DeleteWidgetDirRequest {
    @JsonProperty("path")
    public String path;
  }

  public static class AppendCustomUiFileRequest {
    @JsonProperty("filename")
    public String filename;

    @JsonProperty("content")
    public String content;

    @JsonProperty("subfolder")
    public String subfolder;
  }

  public static class DeleteCustomUiFileRequest {
    @JsonProperty("filename")
    public String filename;

    @JsonProperty("subfolder")
    public String subfolder;
  }
}
