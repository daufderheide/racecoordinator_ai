package com.antigravity.repository;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Model;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SqliteRepository<T> {

  private static final Logger logger = LoggerFactory.getLogger(SqliteRepository.class);
  private static final ObjectMapper objectMapper =
      new ObjectMapper()
          .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
          .configure(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL, true);

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
    if (databaseContext == null || databaseContext.getConnection() == null) {
      return list;
    }
    String sql = "SELECT json_data FROM " + tableName;
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery()) {
      while (rs.next()) {
        String json = rs.getString("json_data");
        if (json != null && !json.trim().isEmpty()) {
          T entity = deserialize(json);
          if (entity != null) {
            list.add(entity);
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error executing findAll on table {}", tableName, e);
    }
    return list;
  }

  public T findByEntityId(String id) {
    String json = findRawJsonByEntityId(id);
    if (json != null && !json.trim().isEmpty()) {
      try {
        return deserialize(json);
      } catch (Exception e) {
        logger.error("Error executing findByEntityId on table {}", tableName, e);
      }
    }
    return null;
  }

  private T deserialize(String json) throws Exception {
    if (json == null || json.trim().isEmpty()) {
      return null;
    }
    if (!json.contains("\"@id\"")) {
      JsonNode node = objectMapper.readTree(json);
      if (node != null && node.isObject() && !node.has("@id")) {
        ((ObjectNode) node).put("@id", 1);
        return objectMapper.treeToValue(node, clazz);
      }
    }
    return objectMapper.readValue(json, clazz);
  }

  public String findRawJsonByEntityId(String id) {
    if (id == null || id.trim().isEmpty()) {
      return null;
    }
    ensureTableExists();
    if (databaseContext == null || databaseContext.getConnection() == null) {
      return null;
    }
    String sql = "SELECT json_data FROM " + tableName + " WHERE entity_id = ?";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, id);
      try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
          return rs.getString("json_data");
        }
      }
    } catch (Exception e) {
      logger.error("Error executing findRawJsonByEntityId on table {}", tableName, e);
    }
    return null;
  }

  public Map<String, String> findAllRawJson() {
    ensureTableExists();
    Map<String, String> map = new HashMap<>();
    if (databaseContext == null || databaseContext.getConnection() == null) {
      return map;
    }
    String sql = "SELECT entity_id, json_data FROM " + tableName;
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery()) {
      while (rs.next()) {
        String entityId = rs.getString("entity_id");
        String json = rs.getString("json_data");
        if (entityId != null && json != null) {
          map.put(entityId, json);
        }
      }
    } catch (Exception e) {
      logger.error("Error executing findAllRawJson on table {}", tableName, e);
    }
    return map;
  }

  public void insert(T entity) {
    save(entity);
  }

  public void save(T entity) {
    if (entity == null) {
      return;
    }
    ensureTableExists();
    if (databaseContext == null || databaseContext.getConnection() == null) {
      return;
    }
    String entityId = extractEntityId(entity);
    try {
      String newJson = objectMapper.writeValueAsString(entity);
      String existingJson = findRawJsonByEntityId(entityId);
      String json = mergeUnmappedProperties(existingJson, newJson);
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

  private String mergeUnmappedProperties(String existingJson, String newJson) {
    if (existingJson == null || existingJson.trim().isEmpty()) {
      return newJson;
    }
    try {
      JsonNode existingTree = objectMapper.readTree(existingJson);
      JsonNode newTree = objectMapper.readTree(newJson);
      if (existingTree.isObject() && newTree.isObject()) {
        preserveUnmappedFields((ObjectNode) newTree, (ObjectNode) existingTree);
        return objectMapper.writeValueAsString(newTree);
      }
    } catch (Exception e) {
      logger.warn(
          "Could not merge unmapped properties for table {}, using updated JSON", tableName, e);
    }
    return newJson;
  }

  private static void preserveUnmappedFields(ObjectNode target, ObjectNode source) {
    Iterator<Map.Entry<String, JsonNode>> fields = source.fields();
    while (fields.hasNext()) {
      Map.Entry<String, JsonNode> entry = fields.next();
      String fieldName = entry.getKey();
      JsonNode sourceVal = entry.getValue();

      if (!target.has(fieldName)) {
        target.set(fieldName, sourceVal);
      } else {
        JsonNode targetVal = target.get(fieldName);
        if (targetVal.isObject() && sourceVal.isObject()) {
          preserveUnmappedFields((ObjectNode) targetVal, (ObjectNode) sourceVal);
        }
      }
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
    if (databaseContext == null || databaseContext.getConnection() == null) {
      return;
    }
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
    if (databaseContext == null || databaseContext.getConnection() == null) {
      return;
    }
    String sql = "DELETE FROM " + tableName;
    try (Statement stmt = databaseContext.getConnection().createStatement()) {
      stmt.execute(sql);
    } catch (Exception e) {
      logger.error("Error clearing table {}", tableName, e);
    }
  }

  public String getNextSequence() {
    if (databaseContext == null) {
      return null;
    }
    return databaseContext.getNextSequence(tableName);
  }
}
