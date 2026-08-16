package com.antigravity.handlers;

import static org.junit.Assert.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Race;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Before;
import org.junit.Test;

public class RaceHeatTaskHandlerTest {

  private DatabaseContext mockDbCtx;
  private Javalin mockJavalin;
  private RaceHeatTaskHandler handler;

  @Before
  public void setUp() {
    mockDbCtx = mock(DatabaseContext.class);
    mockJavalin = mock(Javalin.class);
    handler = new RaceHeatTaskHandler(mockDbCtx, mockJavalin);
  }

  @Test
  public void testRouteRegistration() {
    verify(mockJavalin).get(eq("/api/races"), any(), eq(Role.VIEWER));
    verify(mockJavalin).post(eq("/api/races"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).put(eq("/api/races/{id}"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).delete(eq("/api/races/{id}"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).post(eq("/api/races/{id}/reset-records"), any(), eq(Role.ADMIN));
    verify(mockJavalin).post(eq("/api/races/{id}/generate-heats"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).post(eq("/api/heats/preview"), any(), eq(Role.DIRECTOR));
  }

  @Test
  public void testHandleResetRace_RaceNotFound_Returns404() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("nonexistent");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    handler.handleResetRace(mockCtx);

    verify(mockCtx).status(404);
  }

  @Test(expected = IllegalArgumentException.class)
  public void testValidateRace_CustomRoundRobinWithoutSequence_ThrowsException() {
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withHeatRotationType(HeatRotationType.CustomRoundRobin)
            .build();
    handler.validateRace(race);
  }

  @Test
  public void testValidateRace_StandardRotation_Success() {
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withHeatRotationType(HeatRotationType.EuropeanRoundRobin)
            .build();
    handler.validateRace(race);
  }

  @Test
  public void testPreviewHeats_InvalidDriverCount_Returns400() {
    Context mockCtx = mock(Context.class);
    Map<String, Object> body = new HashMap<>();
    body.put("driverCount", 0);
    when(mockCtx.bodyAsClass(Map.class)).thenReturn(body);
    when(mockCtx.status(400)).thenReturn(mockCtx);

    handler.previewHeats(mockCtx);

    verify(mockCtx).status(400);
  }

  @Test
  public void testParseCustomRotations_ValidRawList() {
    List<Map<String, Object>> rawList = new ArrayList<>();
    Map<String, Object> rot1 = new HashMap<>();
    rot1.put("numDrivers", 4);
    rawList.add(rot1);

    List<?> result = handler.parseCustomRotations(rawList);
    assertNotNull(result);
  }
}
