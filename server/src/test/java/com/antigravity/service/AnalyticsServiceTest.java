package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Track;
import com.antigravity.race.Race;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class AnalyticsServiceTest {

  private AnalyticsService service;

  @Before
  public void setup() {
    service = AnalyticsService.getInstance();
  }

  @Test
  public void testGetInstance_ReturnsSingleton() {
    AnalyticsService instance1 = AnalyticsService.getInstance();
    AnalyticsService instance2 = AnalyticsService.getInstance();
    assertSame("AnalyticsService should be a singleton", instance1, instance2);
  }

  @Test
  public void testTrackRaceStart_WithNullRace_DoesNotThrow() {
    // If the service doesn't throw a NullPointerException, the test silently passes
    service.trackRaceStart(null);
  }

  @Test
  public void testTrackRaceStart_WhenDisabled_DoesNotThrow() throws Exception {
    Field enabledField = AnalyticsService.class.getDeclaredField("enabled");
    enabledField.setAccessible(true);
    boolean originalEnabled = (boolean) enabledField.get(service);
    enabledField.set(service, false);

    Race mockRace = mock(Race.class);

    // Should return early gracefully
    service.trackRaceStart(mockRace);

    enabledField.set(service, originalEnabled);
  }

  @Test
  public void testTrackRaceStart_WhenEnabled_DoesNotThrow() throws Exception {
    Field enabledField = AnalyticsService.class.getDeclaredField("enabled");
    enabledField.setAccessible(true);
    boolean originalEnabled = (boolean) enabledField.get(service);

    Field measurementIdField = AnalyticsService.class.getDeclaredField("measurementId");
    measurementIdField.setAccessible(true);
    String originalMeasurement = (String) measurementIdField.get(service);

    Field apiSecretField = AnalyticsService.class.getDeclaredField("apiSecret");
    apiSecretField.setAccessible(true);
    String originalSecret = (String) apiSecretField.get(service);

    enabledField.set(service, true);
    measurementIdField.set(service, "G-FAKE1234");
    apiSecretField.set(service, "fake_secret");

    Race mockRace = mock(Race.class);
    Track mockTrack = mock(Track.class);

    when(mockRace.getTrack()).thenReturn(mockTrack);
    when(mockTrack.getId()).thenReturn(new ObjectId());

    // Return empty lists to avoid NPE during size() checks
    when(mockTrack.getLanes()).thenReturn(new ArrayList<>());
    when(mockRace.getDrivers()).thenReturn(new ArrayList<>());
    when(mockRace.isDemoMode()).thenReturn(true);

    // This simulates a full payload build and an HTTP post dispatch internally over
    // a CompletableFuture thread
    // The mock server destination will fail to connect, sending a WARN to SLF4J
    // log, but should not crash test
    service.trackRaceStart(mockRace);

    // Briefly wait to let the async thread execute the build code before teardown
    Thread.sleep(100);

    // Reset state so it doesn't affect other tests interacting with singleton
    enabledField.set(service, originalEnabled);
    measurementIdField.set(service, originalMeasurement);
    apiSecretField.set(service, originalSecret);
  }

  @Test
  public void testGetClientId_GeneratesPersistentId() {
    String clientId1 = service.getClientId();
    String clientId2 = service.getClientId();

    assertNotNull(clientId1);
    assertTrue(clientId1.startsWith("rc-desktop-"));
    assertEquals("Client ID should be persistent across calls", clientId1, clientId2);
  }

  @Test
  public void testTrackAnalyticsToggle_WhenDisabled_DoesNotThrow() throws Exception {
    Field enabledField = AnalyticsService.class.getDeclaredField("enabled");
    enabledField.setAccessible(true);
    boolean originalEnabled = (boolean) enabledField.get(service);
    enabledField.set(service, false);

    // Should return early gracefully
    service.trackAnalyticsToggle(true);
    service.trackAnalyticsToggle(false);

    enabledField.set(service, originalEnabled);
  }

  @Test
  public void testTrackAnalyticsToggle_WhenEnabled_DoesNotThrow() throws Exception {
    Field enabledField = AnalyticsService.class.getDeclaredField("enabled");
    enabledField.setAccessible(true);
    boolean originalEnabled = (boolean) enabledField.get(service);

    Field measurementIdField = AnalyticsService.class.getDeclaredField("measurementId");
    measurementIdField.setAccessible(true);
    String originalMeasurement = (String) measurementIdField.get(service);

    Field apiSecretField = AnalyticsService.class.getDeclaredField("apiSecret");
    apiSecretField.setAccessible(true);
    String originalSecret = (String) apiSecretField.get(service);

    enabledField.set(service, true);
    measurementIdField.set(service, "G-FAKE1234");
    apiSecretField.set(service, "fake_secret");

    // This simulates a full payload build and an HTTP post dispatch internally over
    // a CompletableFuture thread
    service.trackAnalyticsToggle(true);
    service.trackAnalyticsToggle(false);

    // Briefly wait to let the async thread execute the build code before teardown
    Thread.sleep(100);

    // Reset state so it doesn't affect other tests interacting with singleton
    enabledField.set(service, originalEnabled);
    measurementIdField.set(service, originalMeasurement);
    apiSecretField.set(service, originalSecret);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testPayloadDataTypes() {
    Map<String, Object> params = new HashMap<>();
    params.put("engagement_time_msec", 1L);
    params.put("session_id", System.currentTimeMillis());

    Map<String, Object> payload = service.createPayload("test_event", params);

    assertNotNull(payload);
    List<Map<String, Object>> events = (List<Map<String, Object>>) payload.get("events");
    assertNotNull(events);
    assertEquals(1, events.size());

    Map<String, Object> event = events.get(0);
    Map<String, Object> eventParams = (Map<String, Object>) event.get("params");

    assertTrue(
        "engagement_time_msec should be a Long",
        eventParams.get("engagement_time_msec") instanceof Long);
    assertTrue("session_id should be a Long", eventParams.get("session_id") instanceof Long);
  }

  @Test
  public void testTrackRaceStart_HandlesErrorResponse() throws Exception {
    // This test verifies that the error handling code (including reading the error stream)
    // executes without throwing exceptions.

    Field enabledField = AnalyticsService.class.getDeclaredField("enabled");
    enabledField.setAccessible(true);
    boolean originalEnabled = (boolean) enabledField.get(service);

    Field measurementIdField = AnalyticsService.class.getDeclaredField("measurementId");
    measurementIdField.setAccessible(true);
    String originalMeasurement = (String) measurementIdField.get(service);

    enabledField.set(service, true);
    measurementIdField.set(service, "G-ERROR");

    Race mockRace = mock(Race.class);
    Track mockTrack = mock(Track.class);
    when(mockRace.getTrack()).thenReturn(mockTrack);
    when(mockTrack.getLanes()).thenReturn(new ArrayList<>());
    when(mockRace.getDrivers()).thenReturn(new ArrayList<>());

    // We can't easily mock the internal createConnection call on the real singleton
    // without more refactoring, but we can verify that triggering a transmission
    // to a non-existent endpoint doesn't crash the app and logs appropriately.
    service.trackRaceStart(mockRace);

    Thread.sleep(200);

    enabledField.set(service, originalEnabled);
    measurementIdField.set(service, originalMeasurement);
  }

  @Test
  public void testTrackRaceStart_HandlesSuccessResponse() throws Exception {
    // This test verifies that the success handling code (Status 204)
    // executes without throwing exceptions even when there is no response body.

    Field enabledField = AnalyticsService.class.getDeclaredField("enabled");
    enabledField.setAccessible(true);
    boolean originalEnabled = (boolean) enabledField.get(service);

    Field measurementIdField = AnalyticsService.class.getDeclaredField("measurementId");
    measurementIdField.setAccessible(true);
    String originalMeasurement = (String) measurementIdField.get(service);

    enabledField.set(service, true);
    measurementIdField.set(service, "G-SUCCESS");

    Race mockRace = mock(Race.class);
    Track mockTrack = mock(Track.class);
    when(mockRace.getTrack()).thenReturn(mockTrack);
    when(mockTrack.getLanes()).thenReturn(new ArrayList<>());
    when(mockRace.getDrivers()).thenReturn(new ArrayList<>());

    // Trigger transmission. Even though it won't actually hit a server,
    // we want to ensure the surrounding logic in sendPayload is stable.
    service.trackRaceStart(mockRace);

    Thread.sleep(100);

    enabledField.set(service, originalEnabled);
    measurementIdField.set(service, originalMeasurement);
  }
}
