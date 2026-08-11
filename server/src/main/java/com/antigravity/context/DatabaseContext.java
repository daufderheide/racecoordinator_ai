package com.antigravity.context;

import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.ServerConfigService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseContext {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseContext.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private volatile Connection connection;
  private volatile String currentDatabaseName;
  private final ServerConfigService configService;
  private final String dataRoot;

  public DatabaseContext(
      String initialDatabaseName, ServerConfigService configService, String dataRoot) {
    this.configService = configService;
    this.dataRoot = dataRoot.endsWith(File.separator) ? dataRoot : dataRoot + File.separator;
    this.switchDatabase(initialDatabaseName);
  }

  public String getDataRoot() {
    return dataRoot;
  }

  public synchronized Connection getConnection() {
    if (connection == null) {
      logger.error("DatabaseContext: Connection is NULL for database {}", currentDatabaseName);
    }
    return connection;
  }

  public synchronized String getCurrentDatabaseName() {
    return currentDatabaseName;
  }

  public ServerConfigService getConfigService() {
    return configService;
  }

  public synchronized void switchDatabase(String databaseName) {
    if (databaseName == null || databaseName.trim().isEmpty()) {
      logger.error("DatabaseContext: Attempted to switch to NULL or empty database name");
      return;
    }

    if (connection != null) {
      try {
        connection.close();
      } catch (SQLException e) {
        logger.warn("Error closing database connection during switch", e);
      }
    }

    this.currentDatabaseName = databaseName;
    File dbDir = new File(dataRoot + databaseName);
    if (!dbDir.exists()) {
      dbDir.mkdirs();
    }
    File dbFile = new File(dbDir, "database.db");

    try {
      String url = "jdbc:sqlite:" + dbFile.getAbsolutePath();
      connection = DriverManager.getConnection(url);
      try (Statement stmt = connection.createStatement()) {
        stmt.execute("PRAGMA journal_mode=WAL;");
        stmt.execute("PRAGMA synchronous=NORMAL;");
        stmt.execute("PRAGMA busy_timeout=5000;");
      }
      ensureTable("counters");
      ensureTable("system_info");
      ensureCountersSchema();
    } catch (SQLException e) {
      logger.error("Failed to connect to SQLite database at {}", dbFile.getAbsolutePath(), e);
      throw new RuntimeException("Database connection error: " + e.getMessage(), e);
    }

    if (this.configService != null) {
      this.configService.setLastActiveDatabase(databaseName);
    }
    logger.info("Switched SQLite context to database: {}", databaseName);
  }

  public synchronized void ensureTable(String tableName) {
    if (tableName == null || tableName.trim().isEmpty()) {
      return;
    }
    try (Statement stmt = getConnection().createStatement()) {
      if ("counters".equalsIgnoreCase(tableName)) {
        stmt.execute(
            "CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, seq INTEGER NOT NULL DEFAULT 0)");
      } else {
        stmt.execute(
            "CREATE TABLE IF NOT EXISTS "
                + tableName
                + " (entity_id TEXT PRIMARY KEY, sequence_id TEXT, json_data TEXT NOT NULL)");
      }
    } catch (SQLException e) {
      logger.error("Error creating table {}", tableName, e);
    }
  }

  private void ensureCountersSchema() {
    ensureTable("counters");
  }

  public synchronized String getNextSequence(String collectionName) {
    ensureCountersSchema();
    String sqlInsert =
        "INSERT INTO counters (name, seq) VALUES (?, 1) ON CONFLICT(name) DO UPDATE SET seq = seq + 1";
    String sqlSelect = "SELECT seq FROM counters WHERE name = ?";
    try (PreparedStatement pstmtInsert = getConnection().prepareStatement(sqlInsert)) {
      pstmtInsert.setString(1, collectionName);
      pstmtInsert.executeUpdate();
    } catch (SQLException e) {
      logger.error("Error incrementing sequence for {}", collectionName, e);
    }

    try (PreparedStatement pstmtSelect = getConnection().prepareStatement(sqlSelect)) {
      pstmtSelect.setString(1, collectionName);
      try (ResultSet rs = pstmtSelect.executeQuery()) {
        if (rs.next()) {
          return String.valueOf(rs.getInt("seq"));
        }
      }
    } catch (SQLException e) {
      logger.error("Error fetching sequence for {}", collectionName, e);
    }
    return "1";
  }

  public synchronized void resetSequence(String collectionName) {
    ensureCountersSchema();
    String sql = "DELETE FROM counters WHERE name = ?";
    try (PreparedStatement pstmt = getConnection().prepareStatement(sql)) {
      pstmt.setString(1, collectionName);
      pstmt.executeUpdate();
    } catch (SQLException e) {
      logger.error("Error resetting sequence for {}", collectionName, e);
    }
  }

  public synchronized void createDatabase(String databaseName) {
    File dbDir = new File(dataRoot + databaseName);
    File assetDir = new File(dbDir, "assets");
    if (!assetDir.exists() && !assetDir.mkdirs()) {
      throw new RuntimeException("Failed to create asset directory: " + assetDir.getAbsolutePath());
    }

    switchDatabase(databaseName);
    ensureTable("system_info");
    String sql =
        "INSERT OR REPLACE INTO system_info (entity_id, sequence_id, json_data) VALUES ('created_at', NULL, ?)";
    try (PreparedStatement pstmt = getConnection().prepareStatement(sql)) {
      pstmt.setString(1, "{\"created_at\":" + System.currentTimeMillis() + "}");
      pstmt.executeUpdate();
    } catch (SQLException e) {
      logger.error("Error setting system_info for new database {}", databaseName, e);
    }
    logger.info("Created database: {} at {}", databaseName, dbDir.getAbsolutePath());
  }

  public synchronized List<String> listDatabases() {
    return listDatabases(this.dataRoot);
  }

  public static List<String> listDatabases(String dataRoot) {
    List<String> dbs = new ArrayList<>();
    if (dataRoot == null) {
      return dbs;
    }
    String root = dataRoot.endsWith(File.separator) ? dataRoot : dataRoot + File.separator;
    File rootDir = new File(root);
    if (rootDir.exists() && rootDir.isDirectory()) {
      File[] subdirs = rootDir.listFiles(File::isDirectory);
      if (subdirs != null) {
        for (File subdir : subdirs) {
          File dbFile = new File(subdir, "database.db");
          if (dbFile.exists()) {
            dbs.add(subdir.getName());
          }
        }
      }
    }
    Collections.sort(dbs);
    return dbs;
  }

  public synchronized void copyDatabase(String sourceDbName, String targetDbName) {
    File sourceDir = new File(dataRoot + sourceDbName);
    File targetDir = new File(dataRoot + targetDbName);

    if (targetDbName.equals(currentDatabaseName)) {
      try {
        if (connection != null) connection.close();
      } catch (SQLException e) {
        logger.warn("Error closing connection before copy", e);
      }
    }

    if (targetDir.exists()) {
      deleteDirectory(targetDir);
    }

    try {
      copyDirectory(sourceDir, targetDir);
    } catch (IOException e) {
      logger.error("Failed to copy database files from {} to {}", sourceDbName, targetDbName, e);
      throw new RuntimeException("Failed to copy database: " + e.getMessage(), e);
    }

    if (targetDbName.equals(currentDatabaseName)) {
      switchDatabase(currentDatabaseName);
    }

    DatabaseContext targetContext = new DatabaseContext(targetDbName, configService, dataRoot);
    new AssetService(targetContext, dataRoot + targetDbName + "/assets").backfillDefaults();
  }

  public synchronized void deleteDatabase(String dbName) {
    if (dbName.equals(currentDatabaseName)) {
      try {
        if (connection != null) connection.close();
      } catch (SQLException e) {
        logger.warn("Error closing connection before delete", e);
      }
    }

    File dbDir = new File(dataRoot + dbName);
    deleteDirectory(dbDir);
    logger.info("Deleted database: {}", dbName);
  }

  private void copyDirectory(File source, File target) throws IOException {
    if (!target.exists()) {
      if (!target.mkdirs()) {
        throw new IOException("Failed to create directory: " + target.getAbsolutePath());
      }
    }
    File[] files = source.listFiles();
    if (files != null) {
      for (File file : files) {
        File targetFile = new File(target, file.getName());
        if (file.isDirectory()) {
          copyDirectory(file, targetFile);
        } else {
          Files.copy(file.toPath(), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
      }
    }
  }

  private void deleteDirectory(File dir) {
    if (dir.exists()) {
      File[] files = dir.listFiles();
      if (files != null) {
        for (File file : files) {
          if (file.isDirectory()) {
            deleteDirectory(file);
          } else {
            file.delete();
          }
        }
      }
      dir.delete();
    }
  }

  public synchronized void resetDatabaseToFactory(String dbName) {
    try (InputStream is = getClass().getResourceAsStream("/defaults/factory_default.zip")) {
      if (is != null) {
        logger.info("Restoring database '{}' from factory_default.zip resource", dbName);
        importDatabase(dbName, is);
        new AssetService(this, dataRoot + dbName + "/assets").backfillDefaults();
        return;
      }
    } catch (Exception e) {
      logger.error("Failed to restore factory_default.zip for database {}", dbName, e);
    }

    switchDatabase(dbName);
    new AssetService(this, dataRoot + dbName + "/assets").resetAssets();
    DatabaseService.getInstance().resetToFactory(this);
  }

  public synchronized DatabaseStats getDatabaseStats(String dbName) {
    File dbDir = new File(dataRoot + dbName);
    File dbFile = new File(dbDir, "database.db");

    Connection conn = null;
    boolean closeNeeded = false;
    if (dbName.equals(currentDatabaseName) && connection != null) {
      conn = connection;
    } else {
      try {
        conn = DriverManager.getConnection("jdbc:sqlite:" + dbFile.getAbsolutePath());
        closeNeeded = true;
      } catch (SQLException e) {
        logger.error("Error opening connection for stats on {}", dbName, e);
      }
    }

    long driverCount = getTableCount(conn, "drivers");
    long teamCount = getTableCount(conn, "teams");
    long trackCount = getTableCount(conn, "tracks");
    long raceCount = getTableCount(conn, "races");
    long eventCount = getTableCount(conn, "events");
    long seasonCount = getTableCount(conn, "seasons");
    long assetCount = getTableCount(conn, "assets");
    long raceRecordCount = getTableCount(conn, "race_history");
    long savedRaceCount = getTableCount(conn, "saved_races");

    double sizeBytes = dbFile.exists() ? dbFile.length() : 0;

    // Add asset file sizes
    File assetDir = new File(dbDir, "assets");
    if (assetDir.exists()) {
      sizeBytes += getDirectorySize(assetDir);
    }

    if (closeNeeded && conn != null) {
      try {
        conn.close();
      } catch (SQLException e) {
        // Ignore
      }
    }

    return new DatabaseStats(
        dbName,
        driverCount,
        teamCount,
        trackCount,
        raceCount,
        eventCount,
        seasonCount,
        assetCount,
        sizeBytes,
        raceRecordCount,
        0,
        savedRaceCount,
        0);
  }

  private long getTableCount(Connection conn, String tableName) {
    if (conn == null) return 0;
    String sql = "SELECT COUNT(*) FROM " + tableName;
    try (Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(sql)) {
      if (rs.next()) {
        return rs.getLong(1);
      }
    } catch (SQLException e) {
      // Table might not exist yet
    }
    return 0;
  }

  private long getDirectorySize(File dir) {
    long size = 0;
    File[] files = dir.listFiles();
    if (files != null) {
      for (File file : files) {
        if (file.isDirectory()) {
          size += getDirectorySize(file);
        } else {
          size += file.length();
        }
      }
    }
    return size;
  }

  public synchronized void exportDatabase(String dbName, OutputStream out) throws IOException {
    File dbDir = new File(dataRoot + dbName);
    File dbFile = new File(dbDir, "database.db");

    Connection conn = null;
    boolean closeNeeded = false;
    if (dbName.equals(currentDatabaseName) && connection != null) {
      conn = connection;
    } else {
      try {
        conn = DriverManager.getConnection("jdbc:sqlite:" + dbFile.getAbsolutePath());
        closeNeeded = true;
      } catch (SQLException e) {
        throw new IOException("Failed to connect to DB for export: " + e.getMessage(), e);
      }
    }

    try (ZipOutputStream zos = new ZipOutputStream(out)) {
      List<String> tableNames = new ArrayList<>();
      try (Statement stmt = conn.createStatement();
          ResultSet rs =
              stmt.executeQuery(
                  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")) {
        while (rs.next()) {
          tableNames.add(rs.getString(1));
        }
      } catch (SQLException e) {
        throw new IOException("Failed to query tables: " + e.getMessage(), e);
      }

      for (String tableName : tableNames) {
        ZipEntry entry = new ZipEntry("data/" + tableName + ".json");
        zos.putNextEntry(entry);

        PrintWriter writer = new PrintWriter(new OutputStreamWriter(zos, StandardCharsets.UTF_8));
        Set<String> columns = getTableColumns(conn, tableName);

        if (columns.contains("json_data")) {
          String selectSql = "SELECT json_data FROM " + tableName;
          try (Statement stmt = conn.createStatement();
              ResultSet rs = stmt.executeQuery(selectSql)) {
            while (rs.next()) {
              String json = rs.getString("json_data");
              if (json != null && !json.trim().isEmpty()) {
                writer.println(json);
              }
            }
          } catch (SQLException e) {
            logger.error("Error reading json_data from table {}", tableName, e);
          }
        } else if ("counters".equalsIgnoreCase(tableName)
            || (columns.contains("name") && columns.contains("seq"))) {
          String selectSql = "SELECT name, seq FROM counters";
          try (Statement stmt = conn.createStatement();
              ResultSet rs = stmt.executeQuery(selectSql)) {
            while (rs.next()) {
              writer.println(
                  "{\"_id\":\"" + rs.getString("name") + "\",\"seq\":" + rs.getInt("seq") + "}");
            }
          } catch (SQLException e) {
            logger.error("Error reading counters from table {}", tableName, e);
          }
        } else if (columns.contains("race_id") && columns.contains("records_blob")) {
          String selectSql = "SELECT race_id, records_blob FROM " + tableName;
          try (Statement stmt = conn.createStatement();
              ResultSet rs = stmt.executeQuery(selectSql)) {
            while (rs.next()) {
              String raceId = rs.getString("race_id");
              byte[] blob = rs.getBytes("records_blob");
              String base64 = blob != null ? Base64.getEncoder().encodeToString(blob) : "";
              writer.println(
                  "{\"race_id\":\"" + raceId + "\",\"records_blob\":\"" + base64 + "\"}");
            }
          } catch (SQLException e) {
            logger.error("Error reading records_blob from table {}", tableName, e);
          }
        } else {
          logger.warn(
              "Skipping export of table {} with unsupported schema: {}", tableName, columns);
        }
        writer.flush();
        zos.closeEntry();
      }

      File assetDir = new File(dbDir, "assets");
      if (assetDir.exists()) {
        addDirectoryToZip(zos, assetDir, "assets/");
      }
    } finally {
      if (closeNeeded && conn != null) {
        try {
          conn.close();
        } catch (SQLException e) {
          // Ignore
        }
      }
    }
  }

  private Set<String> getTableColumns(Connection conn, String tableName) {
    Set<String> columns = new HashSet<>();
    try (Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("PRAGMA table_info(" + tableName + ")")) {
      while (rs.next()) {
        columns.add(rs.getString("name").toLowerCase());
      }
    } catch (SQLException e) {
      logger.error("Error inspecting columns for table {}", tableName, e);
    }
    return columns;
  }

  private void addDirectoryToZip(ZipOutputStream zos, File dir, String baseName)
      throws IOException {
    File[] files = dir.listFiles();
    if (files == null) return;
    for (File file : files) {
      if (file.isDirectory()) {
        addDirectoryToZip(zos, file, baseName + file.getName() + "/");
      } else {
        ZipEntry entry = new ZipEntry(baseName + file.getName());
        zos.putNextEntry(entry);
        try (FileInputStream fis = new FileInputStream(file)) {
          byte[] buffer = new byte[8192];
          int length;
          while ((length = fis.read(buffer)) >= 0) {
            zos.write(buffer, 0, length);
          }
        }
        zos.closeEntry();
      }
    }
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public synchronized void importDatabase(String dbName, InputStream zipIn) throws IOException {
    File dbDir = new File(dataRoot + dbName);
    File assetDir = new File(dbDir, "assets");
    if (!assetDir.exists() && !assetDir.mkdirs()) {
      throw new IOException("Failed to create asset directory for " + dbName);
    }

    if (dbName.equals(currentDatabaseName) && connection != null) {
      try {
        connection.close();
      } catch (SQLException e) {
        logger.warn("Closing current connection before import reset", e);
      }
    }

    File dbFile = new File(dbDir, "database.db");
    if (dbFile.exists()) {
      dbFile.delete();
    }

    switchDatabase(dbName);

    try (ZipInputStream zis = new ZipInputStream(zipIn)) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        String entryName = entry.getName();
        if (entryName.startsWith("data/") && entryName.endsWith(".json")) {
          String tableName = entryName.substring(5, entryName.length() - 5);

          BufferedReader reader =
              new BufferedReader(new InputStreamReader(zis, StandardCharsets.UTF_8));
          String line;
          while ((line = reader.readLine()) != null) {
            if (line.trim().isEmpty()) continue;
            try {
              JsonNode node = objectMapper.readTree(line);
              if ("counters".equalsIgnoreCase(tableName)) {
                ensureTable("counters");
                String name =
                    node.has("_id") ? node.get("_id").asText() : node.get("name").asText();
                int seq = node.get("seq").asInt();
                String sql =
                    "INSERT INTO counters (name, seq) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET seq = excluded.seq";
                try (PreparedStatement pstmt = getConnection().prepareStatement(sql)) {
                  pstmt.setString(1, name);
                  pstmt.setInt(2, seq);
                  pstmt.executeUpdate();
                }
              } else if (tableName.endsWith("race_records") || node.has("records_blob")) {
                try (Statement stmt = getConnection().createStatement()) {
                  stmt.execute(
                      "CREATE TABLE IF NOT EXISTS "
                          + tableName
                          + " (race_id TEXT PRIMARY KEY, records_blob BLOB)");
                }
                String raceId = node.has("race_id") ? node.get("race_id").asText() : "";
                String base64 = node.has("records_blob") ? node.get("records_blob").asText() : "";
                byte[] blob = base64.isEmpty() ? new byte[0] : Base64.getDecoder().decode(base64);
                String sql =
                    "INSERT INTO "
                        + tableName
                        + " (race_id, records_blob) VALUES (?, ?) "
                        + "ON CONFLICT(race_id) DO UPDATE SET records_blob=excluded.records_blob";
                try (PreparedStatement pstmt = getConnection().prepareStatement(sql)) {
                  pstmt.setString(1, raceId);
                  pstmt.setBytes(2, blob);
                  pstmt.executeUpdate();
                }
              } else {
                ensureTable(tableName);
                String entityId = null;
                if (node.has("entity_id")) {
                  entityId = node.get("entity_id").asText();
                } else if (node.has("_id")) {
                  JsonNode idNode = node.get("_id");
                  if (idNode.isObject() && idNode.has("$oid")) {
                    entityId = idNode.get("$oid").asText();
                  } else {
                    entityId = idNode.asText();
                  }
                }
                if (entityId == null || entityId.trim().isEmpty()) {
                  entityId = java.util.UUID.randomUUID().toString();
                }

                String seqId = node.has("sequence_id") ? node.get("sequence_id").asText() : null;
                String sql =
                    "INSERT INTO "
                        + tableName
                        + " (entity_id, sequence_id, json_data) VALUES (?, ?, ?) "
                        + "ON CONFLICT(entity_id) DO UPDATE SET sequence_id=excluded.sequence_id, json_data=excluded.json_data";
                try (PreparedStatement pstmt = getConnection().prepareStatement(sql)) {
                  pstmt.setString(1, entityId);
                  pstmt.setString(2, seqId);
                  pstmt.setString(3, line);
                  pstmt.executeUpdate();
                }
              }
            } catch (Exception e) {
              logger.error("Failed to parse/import JSON line in table {}: {}", tableName, line, e);
            }
          }
        } else if (entryName.startsWith("assets/")) {
          String relativePath = entryName.substring(7);
          File assetFile = new File(assetDir, relativePath);
          if (entry.isDirectory()) {
            assetFile.mkdirs();
          } else {
            assetFile.getParentFile().mkdirs();
            try (FileOutputStream fos = new FileOutputStream(assetFile)) {
              byte[] buffer = new byte[8192];
              int length;
              while ((length = zis.read(buffer)) >= 0) {
                fos.write(buffer, 0, length);
              }
            }
          }
        }
        zis.closeEntry();
      }
    }

    new AssetService(this, dataRoot + dbName + "/assets").backfillDefaults();
  }

  public static class DatabaseStats {
    public String name;
    public long driverCount;
    public long teamCount;
    public long trackCount;
    public long raceCount;
    public long eventCount;
    public long seasonCount;
    public long assetCount;
    public double sizeBytes;
    public long raceRecordCount;
    public double raceRecordSizeBytes;
    public long savedRaceCount;
    public double savedRaceSizeBytes;

    public DatabaseStats(
        String name,
        long driverCount,
        long teamCount,
        long trackCount,
        long raceCount,
        long eventCount,
        long seasonCount,
        long assetCount,
        double sizeBytes,
        long raceRecordCount,
        double raceRecordSizeBytes,
        long savedRaceCount,
        double savedRaceSizeBytes) {
      this.name = name;
      this.driverCount = driverCount;
      this.teamCount = teamCount;
      this.trackCount = trackCount;
      this.raceCount = raceCount;
      this.eventCount = eventCount;
      this.seasonCount = seasonCount;
      this.assetCount = assetCount;
      this.sizeBytes = sizeBytes;
      this.raceRecordCount = raceRecordCount;
      this.raceRecordSizeBytes = raceRecordSizeBytes;
      this.savedRaceCount = savedRaceCount;
      this.savedRaceSizeBytes = savedRaceSizeBytes;
    }
  }
}
