package com.antigravity.handlers;

import com.antigravity.models.AnalyticsToggleRequest;
import com.antigravity.service.AnalyticsService;
import com.antigravity.util.NetworkUtils;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.javalin.http.Context;
import java.util.HashMap;
import java.util.Map;

public class AnalyticsHandler implements AnalyticsHelper {

  public AnalyticsHandler() {}

  public void getAnalyticsConfig(Context ctx) {
    getAnalyticsConfig(ctx, this);
  }

  public void getAnalyticsConfig(Context ctx, AnalyticsHelper helper) {
    Map<String, String> config = new HashMap<>();
    config.put("clientId", AnalyticsService.getInstance().getClientId());
    config.put("measurementId", AnalyticsService.getInstance().getMeasurementId());
    helper.setJson(ctx, config);
  }

  public void toggleAnalytics(Context ctx) {
    toggleAnalytics(ctx, this);
  }

  public void toggleAnalytics(Context ctx, AnalyticsHelper helper) {
    String remoteAddr = helper.getRemoteAddr(ctx);
    String remoteHost = helper.getRemoteHost(ctx);

    boolean isLocalhost = NetworkUtils.isLocalhost(remoteAddr, remoteHost);

    if (!isLocalhost) {
      helper.setStatus(ctx, 403);
      helper.setResult(
          ctx,
          "Analytics settings can only be changed from a local connection. Detected: "
              + remoteAddr);
      return;
    }

    try {
      ObjectMapper mapper = helper.getObjectMapper();
      AnalyticsToggleRequest request =
          mapper.readValue(helper.getBodyBytes(ctx), AnalyticsToggleRequest.class);
      if (request == null) {
        helper.setStatus(ctx, 400);
        helper.setResult(ctx, "Invalid request body. Expected JSON with 'enabled' field.");
        return;
      }

      boolean enabled = request.isEnabled();
      AnalyticsService.getInstance().setUserEnabled(enabled);
      helper.setStatus(ctx, 200);
      helper.setResult(ctx, "Analytics status updated to " + enabled);
    } catch (Exception e) {
      helper.setStatus(ctx, 500);
      helper.setResult(ctx, "Internal Error: " + e.getMessage());
    }
  }

  @Override
  public String getRemoteAddr(Context ctx) {
    return ctx.req.getRemoteAddr();
  }

  @Override
  public String getRemoteHost(Context ctx) {
    return ctx.req.getRemoteHost();
  }

  @Override
  public void setStatus(Context ctx, int status) {
    ctx.status(status);
  }

  @Override
  public void setResult(Context ctx, String result) {
    ctx.result(result);
  }

  @Override
  public void setJson(Context ctx, Object obj) {
    ctx.json(obj);
  }

  @Override
  public byte[] getBodyBytes(Context ctx) {
    return ctx.bodyAsBytes();
  }

  @Override
  public ObjectMapper getObjectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.enable(SerializationFeature.INDENT_OUTPUT);
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    return mapper;
  }

  @Override
  @SuppressWarnings("unchecked")
  public Map<String, String> getPathParamMap(Context ctx) {
    return ctx.pathParamMap();
  }

  @Override
  @SuppressWarnings("unchecked")
  public Map<String, Object> getBody(Context ctx) {
    return ctx.bodyAsClass(HashMap.class);
  }
}
