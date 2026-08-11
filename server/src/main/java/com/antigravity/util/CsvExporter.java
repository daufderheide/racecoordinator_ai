package com.antigravity.util;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.RacePredictionRecord.PredictionSnapshot;
import com.antigravity.models.Track;
import com.antigravity.proto.CurrentRecords;
import com.antigravity.proto.OverallRecords;
import com.antigravity.proto.RecordData;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.DriverHeatData.LapData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.RacePredictionService;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.google.protobuf.Descriptors;
import com.google.protobuf.Message;
import com.google.protobuf.MessageOrBuilder;
import com.google.protobuf.UnknownFieldSet;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

public class CsvExporter {

  private interface MessageOrBuilderMixin {
    @JsonIgnore
    Map<Descriptors.FieldDescriptor, Object> getAllFields();

    @JsonIgnore
    UnknownFieldSet getUnknownFields();

    @JsonIgnore
    Descriptors.Descriptor getDescriptorForType();

    @JsonIgnore
    Message getDefaultInstanceForType();

    @JsonIgnore
    String getInitializationErrorString();
  }

  private static final ObjectMapper mapper =
      new ObjectMapper()
          .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
          .addMixIn(MessageOrBuilder.class, MessageOrBuilderMixin.class);

  private final Race race;
  private final Map<String, Driver> driverLookup = new HashMap<>();

  private CsvExporter(Race race) {
    this.race = race;
    if (race != null && race.getDrivers() != null) {
      for (RaceParticipant rp : race.getDrivers()) {
        if (rp.getDriver() != null && rp.getDriver().getEntityId() != null) {
          driverLookup.put(rp.getDriver().getEntityId(), rp.getDriver());
        }
        if (rp.isTeamParticipant() && rp.getTeamDrivers() != null) {
          for (Driver d : rp.getTeamDrivers()) {
            if (d.getEntityId() != null) {
              driverLookup.put(d.getEntityId(), d);
            }
          }
        }
      }
    }
  }

  public static String export(Race race) {
    return new CsvExporter(race).doExport();
  }

  private String doExport() {
    StringBuilder sb = new StringBuilder();

    // Section 0: Race Record Data
    sb.append("#Section,Race Record Data\n\n");
    RecordData recordData = race.getRecordData();
    if (recordData != null) {
      OverallRecords overall = recordData.getOverall();
      if (overall != null) {
        appendTable(sb, "Overall Fastest Lap", Collections.singletonList(overall.getFastestLap()));
        appendTable(
            sb, "Overall Highest Score", Collections.singletonList(overall.getHighestScore()));
        appendTable(sb, "Overall Lane Fastest Laps", overall.getLaneFastestLapList());
        appendTable(sb, "Overall Lane Highest Scores", overall.getLaneHighestScoreList());
      }

      CurrentRecords current = recordData.getCurrent();
      if (current != null) {
        appendTable(sb, "Race Fastest Lap", Collections.singletonList(current.getFastestLap()));
        appendTable(sb, "Race Highest Score", Collections.singletonList(current.getHighestScore()));
        appendTable(
            sb, "Lane Records (Current Race) Fastest Laps", current.getLaneFastestLapList());
        appendTable(
            sb, "Lane Records (Current Race) Highest Scores", current.getLaneHighestScoreList());
      }
    }

    // Section 1: Track Information
    sb.append("#Section,Track Information\n\n");
    Track track = race.getTrack();
    if (track != null) {
      appendTable(sb, "Track Properties", Collections.singletonList(track));
    }

    // Section 2: Race Configuration
    sb.append("#Section,Race Configuration\n\n");
    if (race.getRaceModel() != null) {
      appendTable(sb, "Race Model", Collections.singletonList(race.getRaceModel()));
    }

    // Section 3: Race Statistics
    sb.append("#Section,Race Statistics\n\n");
    if (race.getStatistics() != null) {
      appendTable(sb, "Race Stats", Collections.singletonList(race.getStatistics()));
    }

    // Section 4: Race Predictions
    appendPredictionsSection(sb);

    // Section 5: Overall Standings
    sb.append("#Section,Overall Standings\n\n");
    if (race.getDrivers() != null && !race.getDrivers().isEmpty()) {
      appendTable(sb, "Standings", race.getDrivers());
    }

    // Section 5: Heat List
    sb.append("#Section,Heat List\n\n");
    List<Heat> heats = race.getHeats();
    if (heats != null) {
      List<HeatListRow> heatListRows = new ArrayList<>();
      for (int hIdx = 0; hIdx < heats.size(); hIdx++) {
        Heat heat = heats.get(hIdx);
        if (heat.getDrivers() != null) {
          for (int lIdx = 0; lIdx < heat.getDrivers().size(); lIdx++) {
            DriverHeatData dhd = heat.getDrivers().get(lIdx);
            if (dhd != null && dhd.getDriver() != null) {
              HeatListRow row = new HeatListRow();
              row.heatNumber = heat.getHeatNumber();
              row.laneNumber = lIdx + 1;

              if (dhd.getActualDriver() != null) {
                row.driverName = dhd.getActualDriver().getName();
                row.driverNickname = dhd.getActualDriver().getNickname();
              } else if (dhd.getDriver().getDriver() != null) {
                row.driverName = dhd.getDriver().getDriver().getName();
                row.driverNickname = dhd.getDriver().getDriver().getNickname();
              }

              if (dhd.getDriver().isTeamParticipant() && dhd.getDriver().getTeam() != null) {
                row.teamName = dhd.getDriver().getTeam().getName();
              }

              heatListRows.add(row);
            }
          }
        }
      }
      if (!heatListRows.isEmpty()) {
        appendTable(sb, "Heat List", heatListRows);
      }
    }

    // Section 6: Heats
    sb.append("#Section,Heats\n\n");
    if (heats != null) {
      for (int hIdx = 0; hIdx < heats.size(); hIdx++) {
        Heat heat = heats.get(hIdx);
        if (heat.getStatistics() != null) {
          appendTable(
              sb,
              "Heat " + (hIdx + 1) + " Statistics",
              Collections.singletonList(heat.getStatistics()));
        }

        if (heat.getDrivers() != null && !heat.getDrivers().isEmpty()) {
          appendTable(sb, "Heat " + (hIdx + 1) + " Driver Data", heat.getDrivers());

          List<LapData> allLaps = new ArrayList<>();
          for (DriverHeatData dhd : heat.getDrivers()) {
            if (dhd.getLaps() != null) {
              allLaps.addAll(dhd.getLaps());
            }
          }
          if (!allLaps.isEmpty()) {
            appendTable(sb, "Heat " + (hIdx + 1) + " Laps", allLaps);
          }
        }
      }
    }

    return sb.toString();
  }

  private void appendTable(StringBuilder sb, String tableName, List<?> objects) {
    sb.append("#Table: ").append(tableName).append("\n");
    if (objects == null || objects.isEmpty()) {
      sb.append("\n");
      return;
    }

    List<Map<String, String>> rowMaps = new ArrayList<>();
    Set<String> allKeys = new LinkedHashSet<>();
    for (Object obj : objects) {
      Map<String, String> flatMap = toFlatMap(obj);
      rowMaps.add(flatMap);
      allKeys.addAll(flatMap.keySet());
    }

    // Remove complex fields that Jackson might serialize weirdly if they are lists or maps that
    // weren't flattened perfectly
    // or just leave them. We handle them gracefully in flattenMap.

    List<String> keysList = new ArrayList<>(allKeys);
    sb.append(String.join(",", keysList)).append("\n");

    for (Map<String, String> rowMap : rowMaps) {
      List<String> rowValues = new ArrayList<>();
      for (String key : keysList) {
        rowValues.add(escape(rowMap.getOrDefault(key, "")));
      }
      sb.append(String.join(",", rowValues)).append("\n");
    }
    sb.append("\n");
  }

  private Map<String, String> toFlatMap(Object obj) {
    Map<String, String> flattened = new LinkedHashMap<>();
    if (obj == null) return flattened;
    Map<String, Object> map = mapper.convertValue(obj, new TypeReference<Map<String, Object>>() {});

    @SuppressWarnings("unchecked")
    Map<String, Object> cleanedMap = (Map<String, Object>) cleanObject(map);

    flattenMap("", cleanedMap, flattened);

    Map<String, String> finalFlattened = new LinkedHashMap<>();
    for (Map.Entry<String, String> entry : flattened.entrySet()) {
      String key = entry.getKey();
      if (key.endsWith(".driverId") || key.equals("driverId")) {
        String driverId = entry.getValue();
        if (driverLookup.containsKey(driverId)) {
          Driver d = driverLookup.get(driverId);
          String prefix = key.substring(0, key.length() - "driverId".length());
          finalFlattened.put(prefix + "driverName", d.getName());
          finalFlattened.put(prefix + "driverNickname", d.getNickname());
        } else {
          String prefix = key.substring(0, key.length() - "driverId".length());
          finalFlattened.put(prefix + "driverName", "Unknown");
          finalFlattened.put(prefix + "driverNickname", "Unknown");
        }
      } else {
        finalFlattened.put(key, entry.getValue());
      }
    }

    return finalFlattened;
  }

  private static final Set<String> IGNORED_FIELD_NAMES =
      new HashSet<>(
          Arrays.asList(
              "@id",
              "objectId",
              "avatarUrl",
              "lapAudio",
              "bestLapAudio",
              "penaltyAudio",
              "audioSlots",
              "entityId",
              "id",
              "allScoringLaps",
              "initialized",
              "serializedSize",
              "holderNameBytes",
              "holderNicknameBytes",
              "holderTeamNameBytes",
              "entity_id",
              "empty",
              "driverIds",
              "lapSoundUrl",
              "bestLapSoundUrl",
              "penaltySoundUrl",
              "lapSoundType",
              "bestLapSoundType",
              "penaltySoundType",
              "lapSoundText",
              "bestLapSoundText",
              "penaltySoundText",
              "stableId",
              "laps",
              "_id",
              "refueling",
              "remainingFalseStartTimePenalty",
              "emainingFalseStartTimePenalty",
              "flag",
              "pendingLapTime"));

  private static boolean shouldIgnoreField(String fieldName) {
    return IGNORED_FIELD_NAMES.contains(fieldName);
  }

  private static Object cleanObject(Object value) {
    if (value instanceof Map) {
      Map<String, Object> map = (Map<String, Object>) value;
      Object emptyObj = map.get("empty");
      if (Boolean.TRUE.equals(emptyObj) || "true".equals(String.valueOf(emptyObj))) {
        return null;
      }
      Object driverObj = map.get("driver");
      if (driverObj instanceof Map) {
        Map<String, Object> driverMap = (Map<String, Object>) driverObj;
        Object driverEmpty = driverMap.get("empty");
        if (Boolean.TRUE.equals(driverEmpty) || "true".equals(String.valueOf(driverEmpty))) {
          return null;
        }
      }
      Map<String, Object> cleanedMap = new LinkedHashMap<>();
      for (Map.Entry<String, Object> entry : map.entrySet()) {
        if (!shouldIgnoreField(entry.getKey())) {
          if (entry.getValue() == null) {
            cleanedMap.put(entry.getKey(), null);
          } else {
            Object cleanedChild = cleanObject(entry.getValue());
            if (cleanedChild != null) {
              cleanedMap.put(entry.getKey(), cleanedChild);
            }
          }
        }
      }
      return cleanedMap;
    } else if (value instanceof List) {
      List<Object> list = (List<Object>) value;
      List<Object> cleanedList = new ArrayList<>();
      for (Object item : list) {
        if (item == null) {
          cleanedList.add(null);
        } else {
          Object cleanedItem = cleanObject(item);
          if (cleanedItem != null) {
            cleanedList.add(cleanedItem);
          }
        }
      }
      return cleanedList;
    }
    return value;
  }

  private static String formatDecimal(double val) {
    if (Double.isNaN(val) || Double.isInfinite(val)) {
      return String.valueOf(val);
    }
    return BigDecimal.valueOf(val).setScale(3, RoundingMode.HALF_UP).toPlainString();
  }

  private static String formatListValue(List<?> list) {
    if (list == null) {
      return "[]";
    }
    List<String> items = new ArrayList<>();
    for (Object item : list) {
      items.add(formatValue(item));
    }
    return items.toString();
  }

  private static String formatValue(Object value) {
    if (value == null) {
      return "";
    }
    if (value instanceof List) {
      return formatListValue((List<?>) value);
    }
    if (value instanceof Double || value instanceof Float || value instanceof BigDecimal) {
      return formatDecimal(((Number) value).doubleValue());
    }
    if (value instanceof String) {
      String str = (String) value;
      try {
        if (str.contains(".")
            && !str.contains("T")
            && !str.contains("-")
            && !str.contains(":")
            && !str.endsWith("%")) {
          double d = Double.parseDouble(str);
          return formatDecimal(d);
        }
      } catch (NumberFormatException ignored) {
        // Not a plain number string
      }
      return str;
    }
    return String.valueOf(value);
  }

  private static void flattenMap(
      String prefix, Map<String, Object> map, Map<String, String> flattened) {
    if (map == null) return;

    for (Map.Entry<String, Object> entry : map.entrySet()) {
      String key = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
      Object value = entry.getValue();
      if (value == null) {
        flattened.put(key, "");
      } else if (value instanceof Map) {
        flattenMap(key, (Map<String, Object>) value, flattened);
      } else {
        flattened.put(key, formatValue(value));
      }
    }
  }

  private static String escape(String value) {
    if (value == null) {
      return "";
    }
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  public static class HeatListRow {
    public int heatNumber;
    public int laneNumber;
    public String driverName;
    public String driverNickname;
    public String teamName;

    public int getHeatNumber() {
      return heatNumber;
    }

    public int getLaneNumber() {
      return laneNumber;
    }

    public String getDriverName() {
      return driverName;
    }

    public String getDriverNickname() {
      return driverNickname;
    }

    public String getTeamName() {
      return teamName;
    }
  }

  private void appendPredictionsSection(StringBuilder sb) {
    sb.append("#Section,Race Predictions\n\n");
    PredictionEvaluationRecord evalRecord = getPredictionEvaluation(race);
    if (evalRecord != null) {
      ModelEvaluationRow evalRow = new ModelEvaluationRow();
      evalRow.brierScore = evalRecord.getBrierScore();
      evalRow.rankMae = evalRecord.getRankMae();
      evalRow.lapProjectionMae = evalRecord.getLapProjectionMae();
      appendTable(sb, "Post-Race Model Evaluation", Collections.singletonList(evalRow));
    }

    PredictionSnapshot snapshot = getPredictionSnapshot(race);
    if (snapshot != null
        && snapshot.getProjectedStandings() != null
        && !snapshot.getProjectedStandings().isEmpty()) {
      List<PredictionRow> predRows = new ArrayList<>();
      for (RacePredictionRecord.DriverProjection proj : snapshot.getProjectedStandings()) {
        PredictionRow row = new PredictionRow();
        row.projectedRank =
            proj.getProjectedRank() > 0 ? String.valueOf(proj.getProjectedRank()) : "--";
        row.driverName = proj.getDriverName();
        row.winProbability = formatPercent(proj.getWinProbability());
        row.podiumProbability = formatPercent(proj.getPodiumProbability());
        row.projectedLaps =
            proj.getProjectedLaps() >= 0 ? formatDecimal(proj.getProjectedLaps()) : "--";
        predRows.add(row);
      }
      appendTable(sb, "Pre-Race Projections & Odds", predRows);
    }
  }

  private static String formatPercent(double prob) {
    if (prob < 0) {
      return "--%";
    }
    return Math.round(prob * 100) + "%";
  }

  private DatabaseContext getActiveDatabaseContext() {
    try {
      return ClientSubscriptionManager.getInstance().getDatabaseContext();
    } catch (Exception e) {
      // Ignore
    }
    return null;
  }

  private PredictionSnapshot getPredictionSnapshot(Race race) {
    if (race == null) {
      return null;
    }
    String raceId = race.getRaceModel() != null ? race.getRaceModel().getEntityId() : null;
    boolean isDemo = race.isDemoMode();

    DatabaseContext context = getActiveDatabaseContext();

    if (context != null && raceId != null && !raceId.isEmpty()) {
      RacePredictionRecord record =
          DatabaseService.getInstance().getRacePredictionRecord(context, raceId, isDemo);
      if (record != null && record.getPreRace() != null) {
        return record.getPreRace();
      }
    }

    try {
      if (race.getRaceModel() != null
          && race.getDrivers() != null
          && !race.getDrivers().isEmpty()
          && race.getHeats() != null
          && !race.getHeats().isEmpty()) {
        RacePredictionRecord record =
            RacePredictionService.getInstance()
                .generateAndSavePreRacePrediction(
                    context,
                    raceId != null ? raceId : "temp",
                    race.getRaceModel(),
                    race.getDrivers(),
                    race.getHeats(),
                    isDemo);
        if (record != null && record.getPreRace() != null) {
          return record.getPreRace();
        }
      }
    } catch (Exception e) {
      // Ignore
    }
    return null;
  }

  private PredictionEvaluationRecord getPredictionEvaluation(Race race) {
    if (race == null) {
      return null;
    }
    String raceId = race.getRaceModel() != null ? race.getRaceModel().getEntityId() : null;
    boolean isDemo = race.isDemoMode();

    try {
      DatabaseContext context = getActiveDatabaseContext();
      if (context != null && raceId != null && !raceId.isEmpty()) {
        return DatabaseService.getInstance().getPredictionEvaluationRecord(context, raceId, isDemo);
      }
    } catch (Exception e) {
      // Ignore
    }
    return null;
  }

  public static class ModelEvaluationRow {
    public double brierScore;
    public double rankMae;
    public double lapProjectionMae;

    public double getBrierScore() {
      return brierScore;
    }

    public double getRankMae() {
      return rankMae;
    }

    public double getLapProjectionMae() {
      return lapProjectionMae;
    }
  }

  public static class PredictionRow {
    public String projectedRank;
    public String driverName;
    public String winProbability;
    public String podiumProbability;
    public String projectedLaps;

    public String getProjectedRank() {
      return projectedRank;
    }

    public String getDriverName() {
      return driverName;
    }

    public String getWinProbability() {
      return winProbability;
    }

    public String getPodiumProbability() {
      return podiumProbability;
    }

    public String getProjectedLaps() {
      return projectedLaps;
    }
  }
}
