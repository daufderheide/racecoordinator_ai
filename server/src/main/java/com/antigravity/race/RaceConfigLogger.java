package com.antigravity.race;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Race;
import com.antigravity.models.RaceConfigDump;
import com.antigravity.models.Track;
import com.antigravity.proto.RecordData;
import com.antigravity.service.DatabaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.util.Base64;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class RaceConfigLogger {
  private static final Logger logger = LoggerFactory.getLogger(RaceConfigLogger.class);
  private static final ObjectMapper MAPPER =
      new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

  private RaceConfigLogger() {}

  public static void dumpConfiguration(
      Race model,
      Track track,
      List<RaceParticipant> drivers,
      List<CustomRotation> customRotations,
      DatabaseContext databaseContext,
      boolean isDemoMode) {
    if (!logger.isTraceEnabled()) {
      return;
    }
    try {
      RaceConfigDump dump = new RaceConfigDump();
      dump.setRace(model);
      dump.setTrack(track);
      dump.setDrivers(drivers);
      dump.setCustomRotations(customRotations);
      if (databaseContext != null && model != null && model.getEntityId() != null) {
        DatabaseService dbService = DatabaseService.getInstance();
        if (dbService != null) {
          RecordData existingRecords =
              dbService.getRaceRecords(databaseContext, model.getEntityId(), isDemoMode);
          if (existingRecords != null) {
            dump.setRecordDataBase64(
                Base64.getEncoder().encodeToString(existingRecords.toByteArray()));
          }
        }
      }
      String json = MAPPER.writeValueAsString(dump);
      logger.trace("RaceConfigDump: {}", json);
    } catch (Exception e) {
      logger.error("Failed to dump race configuration for log replay", e);
    }
  }
}
