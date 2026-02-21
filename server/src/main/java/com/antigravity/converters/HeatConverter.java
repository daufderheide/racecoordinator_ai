package com.antigravity.converters;

import com.antigravity.proto.Heat;
import com.antigravity.proto.DriverHeatData;
import com.antigravity.proto.RaceParticipant;
import java.util.Set;
import java.util.stream.Collectors;
import com.antigravity.converters.DriverConverter;

public class HeatConverter {
  public static final String PARTICIPANT_PREFIX = "Participant_";

  public static Heat toProto(com.antigravity.race.Heat heat, java.util.Set<String> sentObjectIds) {
    String key = "Heat_" + heat.getObjectId();
    if (sentObjectIds.contains(key)) {
      return Heat.newBuilder()
          .setObjectId(heat.getObjectId())
          .build();
    } else {
      sentObjectIds.add(key);
      return Heat.newBuilder()
          .setObjectId(heat.getObjectId())
          .addAllHeatDrivers(heat.getDrivers().stream()
              .map(d -> toProto(d, sentObjectIds))
              .collect(Collectors.toList()))
          .setHeatNumber(heat.getHeatNumber())
          .addAllStandings(heat.getStandings())
          .build();
    }
  }

  private static void logToFile(String message) {
    try {
      String tmpDir = System.getProperty("java.io.tmpdir");
      java.nio.file.Path logPath = java.nio.file.Paths.get(tmpDir, "race_debug.log");
      java.nio.file.Files.write(logPath, (message + "\n").getBytes(),
          java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
    } catch (Exception e) {
      // Ignore
    }
  }

  public static DriverHeatData toProto(com.antigravity.race.DriverHeatData data,
      java.util.Set<String> sentObjectIds) {
    String key = data.getObjectId();
    if (sentObjectIds.contains(key)) {
      return DriverHeatData.newBuilder()
          .setObjectId(data.getObjectId())
          .setDriverId(data.getActualDriver() != null ? data.getActualDriver().getEntityId() : "")
          .build();
    } else {
      sentObjectIds.add(key);
      if (data.getActualDriver() != null) {
        logToFile("HeatConverter: Serializing DriverHeatData " + data.getObjectId() + " with ActualDriver: "
            + data.getActualDriver().getName() + " (ID: " + data.getActualDriver().getEntityId() + ")");
      } else {
        logToFile("HeatConverter: DriverHeatData " + data.getObjectId() + " has NO ActualDriver");
      }
      return DriverHeatData.newBuilder()
          .setObjectId(data.getObjectId())
          .setDriver(RaceParticipantConverter.toProto(data.getDriver(), sentObjectIds))
          .setDriverId(data.getActualDriver() != null ? data.getActualDriver().getEntityId() : "")
          .setActualDriver(data.getActualDriver() != null
              ? DriverConverter.toProto(data.getActualDriver(), sentObjectIds)
              : com.antigravity.proto.DriverModel.getDefaultInstance())
          .setGapLeader(data.getGapLeader())
          .setGapPosition(data.getGapPosition())
          .build();
    }
  }
}
