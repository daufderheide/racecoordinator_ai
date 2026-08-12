package com.antigravity.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.http.Context;
import java.util.Map;

public interface AnalyticsHelper {
  String getRemoteAddr(Context ctx);

  String getRemoteHost(Context ctx);

  void setStatus(Context ctx, int status);

  void setResult(Context ctx, String result);

  void setJson(Context ctx, Object obj);

  byte[] getBodyBytes(Context ctx);

  ObjectMapper getObjectMapper();

  Map<String, String> getPathParamMap(Context ctx);

  Map<String, Object> getBody(Context ctx);
}
