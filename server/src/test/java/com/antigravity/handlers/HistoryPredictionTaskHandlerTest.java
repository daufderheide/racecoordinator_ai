package com.antigravity.handlers;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.RacePredictionRecord;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class HistoryPredictionTaskHandlerTest {

  private DatabaseContext mockDbCtx;
  private Javalin mockJavalin;
  private HistoryPredictionTaskHandler handler;

  @Before
  public void setUp() {
    mockDbCtx = mock(DatabaseContext.class);
    mockJavalin = mock(Javalin.class);
    handler = new HistoryPredictionTaskHandler(mockDbCtx, mockJavalin);
  }

  @Test
  public void testRouteRegistration() {
    verify(mockJavalin).get(eq("/api/history/races"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/history/races/{id}"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/history/races/{id}/export"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/history/stats"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/history/drivers/{driverId}/stats"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/predictions/races/{id}"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/predictions/evaluations/{id}"), any(), eq(Role.VIEWER));
  }

  @Test
  public void testIsStalePredictionRecord_NullRecordIsStale() {
    boolean stale = handler.isStalePredictionRecord(mockDbCtx, null, null, false);
    assertTrue("Null record should be stale", stale);
  }

  @Test
  public void testIsStalePredictionRecord_ValidStandingsNotStale() {
    RacePredictionRecord record = new RacePredictionRecord();
    RacePredictionRecord.PredictionSnapshot preRace = new RacePredictionRecord.PredictionSnapshot();
    List<RacePredictionRecord.DriverProjection> standings = new ArrayList<>();

    RacePredictionRecord.DriverProjection dp1 =
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", 1, 100.0, 0.0, 0.6, 0.9);
    dp1.setTotalSimulations(1000);
    RacePredictionRecord.DriverProjection dp2 =
        new RacePredictionRecord.DriverProjection("d_2", "Driver 2", 2, 98.0, 0.0, 0.4, 0.8);
    dp2.setTotalSimulations(1000);
    standings.add(dp1);
    standings.add(dp2);
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    boolean stale = handler.isStalePredictionRecord(mockDbCtx, record, null, false);
    assertFalse("Valid standings should not be stale", stale);
  }

  @Test
  public void testGetPredictionEvaluationRecord_ActiveRaceNotOverReturns404() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("current");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    com.antigravity.race.Race mockActiveRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race mockRaceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withEntityId("race_123")
            .build();
    when(mockActiveRace.getRaceModel()).thenReturn(mockRaceModel);
    when(mockActiveRace.getState()).thenReturn(new com.antigravity.race.states.Racing());

    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(mockActiveRace);

    handler.getPredictionEvaluationRecord(mockCtx);

    verify(mockCtx).header("Cache-Control", "no-cache, no-store, must-revalidate");
    verify(mockCtx).status(404);
  }
}
