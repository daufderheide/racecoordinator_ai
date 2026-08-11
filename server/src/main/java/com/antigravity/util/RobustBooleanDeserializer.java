package com.antigravity.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;

public class RobustBooleanDeserializer extends JsonDeserializer<Boolean> {

  @Override
  public Boolean deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
    JsonToken token = p.currentToken();
    if (token == JsonToken.VALUE_TRUE) {
      return Boolean.TRUE;
    }
    if (token == JsonToken.VALUE_FALSE) {
      return Boolean.FALSE;
    }
    if (token == JsonToken.VALUE_NUMBER_INT) {
      return p.getIntValue() != 0;
    }
    if (token == JsonToken.VALUE_STRING) {
      String text = p.getText().trim();
      if ("true".equalsIgnoreCase(text) || "1".equals(text)) {
        return Boolean.TRUE;
      }
      if ("false".equalsIgnoreCase(text) || "0".equals(text)) {
        return Boolean.FALSE;
      }
    }
    if (token == JsonToken.VALUE_NULL) {
      return null;
    }
    return Boolean.FALSE;
  }
}
