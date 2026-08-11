package com.antigravity.repository;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Model;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SqliteRepository<T> {

  private static final Logger logger = LoggerFactory.getLogger(SqliteRepository.class);
  private static final ObjectMapper objectMapper =
      new ObjectMapper()
          .configure(
              com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
              false);

  private final DatabaseContext databaseContext;
  private final String tableName;
  private final Class<T> clazz;

  public SqliteRepository(DatabaseContext databaseContext, String tableName, Class<T> clazz) {
    this.databaseContext = databaseContext;
    this.tableName = tableName;
    this.clazz = clazz;
    ensureTableExists();
  }

  private void ensureTableExists() {
    databaseContext.ensureTable(tableName);
  }

  private String extractEntityId(T entity) {
    if (entity instanceof Model) {
      return ((Model) entity).getEntityId();
    }
    try {
      java.lang.reflect.Method method = entity.getClass().getMethod("getEntityId");
      Object val = method.invoke(entity);
      if (val != null) return val.toString();
    } catch (Exception ignored) {
    }
    try {
      java.lang.reflect.Method method = entity.getClass().getMethod("getRaceId");
      Object val = method.invoke(entity);
      if (val != null) return val.toString();
    } catch (Exception ignored) {
    }
    try {
      java.lang.reflect.Method method = entity.getClass().getMethod("getId");
      Object val = method.invoke(entity);
      if (val != null) return val.toString();
    } catch (Exception ignored) {
    }
    return java.util.UUID.randomUUID().toString();
  }

  public List<T> findAll() {
    ensureTableExists();
    List<T> list = new ArrayList<>();
    String sql = "SELECT json_data FROM " + tableName;
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery()) {
      while (rs.next()) {
        String json = rs.getString("json_data");
        if (json != null && !json.trim().isEmpty()) {
          T entity = objectMapper.readValue(json, clazz);
          list.add(entity);
        }
      }
    } catch (Exception e) {
      logger.error("Error executing findAll on table {}", tableName, e);
    }
    return list;
  }

  public T findByEntityId(String id) {
    if (id == null || id.trim().isEmpty()) {
      return null;
    }
    ensureTableExists();
    String sql = "SELECT json_data FROM " + tableName + " WHERE entity_id = ?";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, id);
      try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
          String json = rs.getString("json_data");
          if (json != null && !json.trim().isEmpty()) {
            return objectMapper.readValue(json, clazz);
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error executing findByEntityId on table {}", tableName, e);
    }
    return null;
  }

  public void insert(T entity) {
    save(entity);
  }

  public void save(T entity) {
    if (entity == null) {
      return;
    }
    ensureTableExists();
    String entityId = extractEntityId(entity);
    try {
      String json = objectMapper.writeValueAsString(entity);
      String sql =
          "INSERT INTO "
              + tableName
              + " (entity_id, sequence_id, json_data) VALUES (?, ?, ?) "
              + "ON CONFLICT(entity_id) DO UPDATE SET sequence_id=excluded.sequence_id, json_data=excluded.json_data";
      try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, entityId);
        pstmt.setString(2, null);
        pstmt.setString(3, json);
        pstmt.executeUpdate();
      }
    } catch (Exception e) {
      logger.error("Error saving entity to table {}", tableName, e);
    }
  }

  public void replace(String id, T entity) {
    save(entity);
  }

  public void delete(String id) {
    if (id == null || id.trim().isEmpty()) {
      return;
    }
    ensureTableExists();
    String sql = "DELETE FROM " + tableName + " WHERE entity_id = ?";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, id);
      pstmt.executeUpdate();
    } catch (Exception e) {
      logger.error("Error deleting entity from table {}", tableName, e);
    }
  }

  public void drop() {
    ensureTableExists();
    String sql = "DELETE FROM " + tableName;
    try (Statement stmt = databaseContext.getConnection().createStatement()) {
      stmt.execute(sql);
    } catch (Exception e) {
      logger.error("Error clearing table {}", tableName, e);
    }
  }

  public String getNextSequence() {
    return databaseContext.getNextSequence(tableName);
  }
}
