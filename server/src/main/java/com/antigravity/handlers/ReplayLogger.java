package com.antigravity.handlers;

import com.antigravity.models.ReplayCommandDump;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReplayLogger {

  private static final Logger logger = LoggerFactory.getLogger(ReplayLogger.class);

  public static Map<String, Object> mapOf(Object... kv) {
    Map<String, Object> map = new HashMap<>();
    for (int i = 0; i < kv.length; i += 2) {
      map.put((String) kv[i], kv[i + 1]);
    }
    return map;
  }

  public static void logReplayCommand(String command, Object params) {
    if (logger.isTraceEnabled()) {
      try {
        ReplayCommandDump dump = new ReplayCommandDump(command, params);
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        logger.trace("ReplayCommandDump: {}", mapper.writeValueAsString(dump));
      } catch (Exception e) {
        logger.error("Failed to serialize replay command dump for " + command, e);
      }
    }
  }
}
