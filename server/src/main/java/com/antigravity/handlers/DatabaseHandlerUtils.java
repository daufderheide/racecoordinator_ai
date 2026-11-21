package com.antigravity.handlers;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/** Utility methods for database handler operations and deserialization. */
public final class DatabaseHandlerUtils {

  private static final ObjectMapper objectMapper =
      new ObjectMapper()
          .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
          .configure(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL, true);

  private DatabaseHandlerUtils() {}

  public static <T> T bodyAsClassWithId(String body, Class<T> clazz) throws Exception {
    if (body == null) {
      return null;
    }
    if (!body.trim().isEmpty()) {
      JsonNode node = objectMapper.readTree(body);
      if (node != null && node.isObject() && !node.has("@id")) {
        ((ObjectNode) node).put("@id", 1);
        return objectMapper.treeToValue(node, clazz);
      }
    }
    return objectMapper.readValue(body, clazz);
  }
}
