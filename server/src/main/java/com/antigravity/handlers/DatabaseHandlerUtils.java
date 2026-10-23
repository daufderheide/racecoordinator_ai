package com.antigravity.handlers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/** Utility methods for database handler operations and deserialization. */
public final class DatabaseHandlerUtils {

  private DatabaseHandlerUtils() {}

  public static <T> T bodyAsClassWithId(String body, Class<T> clazz) throws Exception {
    if (body == null) {
      return null;
    }
    ObjectMapper mapper = new ObjectMapper();
    if (!body.trim().isEmpty()) {
      JsonNode node = mapper.readTree(body);
      if (node != null && node.isObject() && !node.has("@id")) {
        ((ObjectNode) node).put("@id", 1);
        body = mapper.writeValueAsString(node);
      }
    }
    return mapper.readValue(body, clazz);
  }
}
