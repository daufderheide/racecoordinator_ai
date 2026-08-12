package com.antigravity.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;

/** Utility methods for database handler operations and deserialization. */
public final class DatabaseHandlerUtils {

  private DatabaseHandlerUtils() {}

  public static <T> T bodyAsClassWithId(String body, Class<T> clazz) throws Exception {
    if (body != null && !body.contains("\"@id\"")) {
      body = body.replaceFirst("\\{", "{\"@id\":1,");
    }
    ObjectMapper mapper = new ObjectMapper();
    return mapper.readValue(body, clazz);
  }
}
