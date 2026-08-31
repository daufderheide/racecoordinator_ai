package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Driver;
import com.antigravity.models.GroupOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.AssetMessage;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceHeatTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(RaceHeatTaskHandler.class);
  private final DatabaseContext databaseContext;
  private final SqliteRepository<Race> raceRepository;
  private final SqliteRepository<Track> trackRepository;

  public RaceHeatTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    this.raceRepository = new SqliteRepository<>(databaseContext, "races", Race.class);
    this.trackRepository = new SqliteRepository<>(databaseContext, "tracks", Track.class);

    app.get("/api/races", this::getRaces, Role.VIEWER);
    app.post("/api/races", this::handleCreateRace, Role.DIRECTOR);
    app.put("/api/races/{id}", this::handleUpdateRace, Role.DIRECTOR);
    app.delete("/api/races/{id}", this::handleDeleteRace, Role.DIRECTOR);
    app.post("/api/races/{id}/reset-records", this::handleResetRace, Role.ADMIN);
    app.post("/api/races/{id}/generate-heats", this::generateHeats, Role.DIRECTOR);
    app.post("/api/heats/preview", this::previewHeats, Role.DIRECTOR);
  }

  public void getRaces(Context ctx) {
    List<Race> races = raceRepository.findAll();

    List<DatabaseTaskHandler.RaceResponse> response = new ArrayList<>();
    for (Race race : races) {
      Track track = trackRepository.findByEntityId(race.getTrackEntityId());
      response.add(new DatabaseTaskHandler.RaceResponse(race, track));
    }
    ctx.json(response);
  }

  public void handleCreateRace(Context ctx) {
    try {
      Race race = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Race.class);
      try {
        validateRace(race);
        Race created = createRace(race);
        ctx.status(201).json(created);
      } catch (IllegalArgumentException e) {
        ctx.status(400).result(e.getMessage());
      }
    } catch (Exception e) {
      logger.error("Error creating race", e);
      ctx.status(500).result("Error creating race: " + e.getMessage());
    }
  }

  public Race createRace(Race race) {
    final String raceName = race.getName();
    boolean existing =
        raceRepository.findAll().stream()
            .anyMatch(
                r ->
                    r.getName() != null
                        && raceName != null
                        && r.getName().trim().equalsIgnoreCase(raceName.trim()));
    if (existing) {
      throw new IllegalArgumentException("Race name already exists");
    }

    if (race.getEntityId() == null
        || race.getEntityId().isEmpty()
        || "new".equals(race.getEntityId())) {
      String nextId = raceRepository.getNextSequence();
      race =
          new Race.Builder()
              .withName(race.getName())
              .withTrackEntityId(race.getTrackEntityId())
              .withHeatRotationType(race.getHeatRotationType())
              .withHeatScoring(race.getHeatScoring())
              .withOverallScoring(race.getOverallScoring())
              .withMinLapTime(race.getMinLapTime())
              .withFuelOptions(race.getFuelOptions())
              .withDigitalFuelOptions(race.getDigitalFuelOptions())
              .withTeamOptions(race.getTeamOptions())
              .withAutoAdvanceTime(race.getAutoAdvanceTime())
              .withAutoStartTime(race.getAutoStartTime())
              .withAutoAdvanceWarmupTime(race.getAutoAdvanceWarmupTime())
              .withAutoStartWarmupTime(race.getAutoStartWarmupTime())
              .withDriftTime(race.getDriftTime())
              .withStartTime(race.getStartTime())
              .withRestartTime(race.getRestartTime())
              .withStartRandomizer(race.getStartRandomizer())
              .withRestartRandomizer(race.getRestartRandomizer())
              .withSoloLaneIndex(race.getSoloLaneIndex())
              .withCustomRotationSequence(race.getCustomRotationSequence())
              .withCustomRotationAssetId(race.getCustomRotationAssetId())
              .withCustomRotations(race.getCustomRotations())
              .withHeatTimesThrough(race.getHeatTimesThrough())
              .withReverseHeats(race.isReverseHeats())
              .withHotStart(race.isHotStart())
              .withStartAtCurrent(race.isStartAtCurrent())
              .withRestartOnFalseStart(race.isRestartOnFalseStart())
              .withStartBehindSensor(race.isStartBehindSensor())
              .withFalseStartLapPenalty(race.getFalseStartLapPenalty())
              .withFalseStartTimePenalty(race.getFalseStartTimePenalty())
              .withGroupOptions(race.getGroupOptions())
              .withPractice(race.isPractice())
              .withAdjustDriftLaps(race.isAdjustDriftLaps())
              .withThemeId(race.getThemeId())
              .withEntityId(nextId)
              .build();
    }
    raceRepository.insert(race);
    return race;
  }

  public void handleUpdateRace(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      String body = ctx.body();
      Race race = DatabaseHandlerUtils.bodyAsClassWithId(body, Race.class);
      try {
        validateRace(race);
        Race updated = updateRace(id, race);
        ctx.json(updated);
      } catch (IllegalArgumentException e) {
        if ("Race not found".equals(e.getMessage())) {
          ctx.status(404).result(e.getMessage());
        } else {
          ctx.status(400).result(e.getMessage());
        }
      }
    } catch (Exception e) {
      logger.error("Error updating race", e);
      ctx.status(500).result("Error updating race: " + e.getMessage());
    }
  }

  public Race updateRace(String id, Race race) {
    final String updateRaceName = race.getName();
    boolean existing =
        raceRepository.findAll().stream()
            .anyMatch(
                r ->
                    !id.equals(r.getEntityId())
                        && r.getName() != null
                        && updateRaceName != null
                        && r.getName().trim().equalsIgnoreCase(updateRaceName.trim()));

    if (existing) {
      throw new IllegalArgumentException("Race name already exists");
    }

    race = new Race.Builder().from(race).withEntityId(id).withId(null).build();
    raceRepository.replace(id, race);
    return race;
  }

  public void handleDeleteRace(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      try {
        deleteRace(id);
        ctx.status(204);
      } catch (IllegalArgumentException e) {
        ctx.status(404).result(e.getMessage());
      }
    } catch (Exception e) {
      logger.error("Error deleting race", e);
      ctx.status(500).result("Error deleting race: " + e.getMessage());
    }
  }

  public void deleteRace(String id) {
    DatabaseService.getInstance().deleteAllRaceData(databaseContext, id);
    raceRepository.delete(id);
  }

  public void handleResetRace(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Race race = raceRepository.findByEntityId(id);
      if (race == null) {
        ctx.status(404).result("Race not found");
        return;
      }
      resetRace(id);
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error resetting race", e);
      ctx.status(500).result("Error resetting race: " + e.getMessage());
    }
  }

  public void resetRace(String id) {
    DatabaseService.getInstance().resetRaceData(databaseContext, id);
    com.antigravity.race.Race activeRace = // fqn-collision
        ClientSubscriptionManager.getInstance().getRace();
    if (activeRace != null
        && activeRace.getRaceModel() != null
        && id.equals(activeRace.getRaceModel().getEntityId())) {
      activeRace.resetRecords();
    }
  }

  public void generateHeats(Context ctx) {
    String raceId = ctx.pathParam("id");
    Map<String, Number> body = ctx.bodyAsClass(Map.class);
    Number driverCountNum = body.get("driverCount");
    int driverCount = driverCountNum != null ? driverCountNum.intValue() : 0;

    if (driverCount <= 0) {
      ctx.status(400).result("driverCount must be greater than 0");
      return;
    }

    Race race = raceRepository.findByEntityId(raceId);
    if (race == null) {
      ctx.status(404).result("Race not found");
      return;
    }

    Track track = trackRepository.findByEntityId(race.getTrackEntityId());
    if (track == null) {
      ctx.status(404).result("Track not found for race");
      return;
    }

    List<RaceParticipant> mockDrivers = new ArrayList<>();
    for (int i = 0; i < driverCount; i++) {
      Driver mockDriver = new Driver("Driver " + (i + 1), "Driver " + (i + 1));
      mockDrivers.add(new RaceParticipant(mockDriver));
    }

    com.antigravity.race.Race tempRace = // fqn-collision
        new com.antigravity.race.Race.Builder() // fqn-collision
            .model(race)
            .drivers(mockDrivers)
            .track(track)
            .databaseContext(databaseContext)
            .isDemoMode(true)
            .build();

    List<Heat> heats = tempRace.getHeats();

    List<Map<String, Object>> heatList = new ArrayList<>();
    for (Heat heat : heats) {
      Map<String, Object> heatMap = new HashMap<>();
      heatMap.put("heatNumber", heat.getHeatNumber());
      heatMap.put("group", heat.getGroup());

      List<Map<String, Object>> lanes = new ArrayList<>();
      List<DriverHeatData> drivers = heat.getDrivers();
      for (int laneIdx = 0; laneIdx < drivers.size(); laneIdx++) {
        DriverHeatData driverData = drivers.get(laneIdx);
        Map<String, Object> laneMap = new HashMap<>();
        laneMap.put("laneNumber", laneIdx + 1);
        laneMap.put("driverNumber", driverData.getDriver().getSeed());

        if (laneIdx < track.getLanes().size()) {
          Lane lane = track.getLanes().get(laneIdx);
          laneMap.put("backgroundColor", lane.getBackground_color());
          laneMap.put("foregroundColor", lane.getForeground_color());
        }

        lanes.add(laneMap);
      }
      heatMap.put("lanes", lanes);
      heatList.add(heatMap);
    }

    Map<String, Object> response = new HashMap<>();
    response.put("heats", heatList);
    ctx.json(response);

    tempRace.stop();
  }

  @SuppressWarnings({"unchecked", "checkstyle:MethodLength"})
  public void previewHeats(Context ctx) {
    Map<String, Object> body = ctx.bodyAsClass(Map.class);
    Number driverCountNum = (Number) body.get("driverCount");
    int driverCount = driverCountNum != null ? driverCountNum.intValue() : 0;
    String trackId = (String) body.get("trackId");
    String rotationType = (String) body.get("rotationType");
    logger.debug("previewHeats: body={}", body);
    Number soloLaneIndexNum = (Number) body.get("soloLaneIndex");
    int soloLaneIndex = soloLaneIndexNum != null ? soloLaneIndexNum.intValue() : 0;
    List<Integer> customRotationSequence = (List<Integer>) body.get("customRotationSequence");
    if (customRotationSequence == null) {
      customRotationSequence = (List<Integer>) body.get("custom_rotation_sequence");
    }

    String customRotationAssetId = (String) body.get("custom_rotation_asset_id");
    if (customRotationAssetId == null) {
      customRotationAssetId = (String) body.get("customRotationAssetId");
    }

    List<CustomRotation> customRotations = null;
    if (customRotationAssetId != null && !customRotationAssetId.isEmpty()) {
      customRotations = resolveCustomRotations(customRotationAssetId);
    } else {
      List<Map<String, Object>> customRotationsRaw =
          (List<Map<String, Object>>) body.get("custom_rotations");
      if (customRotationsRaw == null) {
        customRotationsRaw = (List<Map<String, Object>>) body.get("customRotations");
      }
      if (customRotationsRaw != null) {
        customRotations = parseCustomRotations(customRotationsRaw);
      }
    }

    Number heatTimesThroughNum = (Number) body.get("heatTimesThrough");
    if (heatTimesThroughNum == null) {
      heatTimesThroughNum = (Number) body.get("heat_times_through");
    }
    int heatTimesThrough = heatTimesThroughNum != null ? heatTimesThroughNum.intValue() : 1;

    Boolean reverseHeats = (Boolean) body.get("reverseHeats");
    if (reverseHeats == null) {
      reverseHeats = (Boolean) body.get("reverse_heats");
    }
    boolean reverseHeatsBool = reverseHeats != null ? reverseHeats : false;

    if (driverCount <= 0) {
      ctx.status(400).result("driverCount must be greater than 0");
      return;
    }

    if (trackId == null || trackId.isEmpty()) {
      ctx.status(400).result("trackId is required");
      return;
    }

    if (rotationType == null || rotationType.isEmpty()) {
      ctx.status(400).result("rotationType is required");
      return;
    }

    Track track = trackRepository.findByEntityId(trackId);
    if (track == null) {
      ctx.status(404).result("Track not found");
      return;
    }

    HeatRotationType rotationTypeEnum;
    try {
      rotationTypeEnum = HeatRotationType.valueOf(rotationType);
      if (rotationTypeEnum == HeatRotationType.CustomRoundRobin) {
        if (customRotationSequence == null || customRotationSequence.isEmpty()) {
          ctx.status(400).result("Custom rotation sequence is required");
          return;
        }
        int numLanes = track.getLanes().size();
        Set<Integer> uniqueLanes = new HashSet<>();
        for (Integer lane : customRotationSequence) {
          if (lane == null || lane < 0) {
            ctx.status(400).result("Lane numbers must be greater than or equal to 0 and not null");
            return;
          }
          if (lane > numLanes) {
            ctx.status(400)
                .result("Lane number " + lane + " exceeds track lane count (" + numLanes + ")");
            return;
          }
          if (lane > 0 && !uniqueLanes.add(lane)) {
            ctx.status(400)
                .result("Lane number " + lane + " appears more than once in rotation sequence");
            return;
          }
        }
      }
    } catch (IllegalArgumentException e) {
      ctx.status(400).result("Invalid rotation type: " + rotationType);
      return;
    }

    HeatScoring defaultHeatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            10,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring defaultOverallScoring = new OverallScoring();

    Map<String, Object> groupOptionsMap = (Map<String, Object>) body.get("groupOptions");
    if (groupOptionsMap == null) {
      groupOptionsMap = (Map<String, Object>) body.get("group_options");
    }
    GroupOptions groupOptions = null;
    if (groupOptionsMap != null) {
      Boolean enabled = (Boolean) groupOptionsMap.get("enabled");
      Number maxGroupsNum = (Number) groupOptionsMap.get("max_groups");
      if (maxGroupsNum == null) {
        maxGroupsNum = (Number) groupOptionsMap.get("maxGroups");
      }
      Integer maxGroups = maxGroupsNum != null ? maxGroupsNum.intValue() : null;
      Boolean balance = (Boolean) groupOptionsMap.get("balance");
      Boolean allowEmpty = (Boolean) groupOptionsMap.get("allow_empty_lanes");
      if (allowEmpty == null) {
        allowEmpty = (Boolean) groupOptionsMap.get("allowEmptyLanes");
      }
      Boolean forceMultiple = (Boolean) groupOptionsMap.get("force_multiple_of_max");
      if (forceMultiple == null) {
        forceMultiple = (Boolean) groupOptionsMap.get("forceMultipleOfMax");
      }
      Boolean rotateHeats = (Boolean) groupOptionsMap.get("rotate_group_heats");
      if (rotateHeats == null) {
        rotateHeats = (Boolean) groupOptionsMap.get("rotateGroupHeats");
      }
      Number minAdvancingNum = (Number) groupOptionsMap.get("min_advancing");
      if (minAdvancingNum == null) {
        minAdvancingNum = (Number) groupOptionsMap.get("minAdvancing");
      }
      Integer minAdvancing = minAdvancingNum != null ? minAdvancingNum.intValue() : 0;
      @SuppressWarnings("unchecked")
      List<String> names = (List<String>) groupOptionsMap.get("names");
      if (names == null) {
        @SuppressWarnings("unchecked")
        List<String> namesFallback = (List<String>) groupOptionsMap.get("group_names");
        names = namesFallback;
      }

      groupOptions =
          new GroupOptions(
              enabled,
              maxGroups,
              balance,
              allowEmpty,
              forceMultiple,
              rotateHeats,
              minAdvancing,
              names);
    }

    Race tempRaceConfig =
        new Race.Builder()
            .withName("Preview")
            .withTrackEntityId(trackId)
            .withHeatRotationType(rotationTypeEnum)
            .withHeatScoring(defaultHeatScoring)
            .withOverallScoring(defaultOverallScoring)
            .withAutoAdvanceTime(0.0)
            .withAutoStartTime(0.0)
            .withAutoAdvanceWarmupTime(0.0)
            .withAutoStartWarmupTime(0.0)
            .withSoloLaneIndex(soloLaneIndex)
            .withCustomRotationSequence(customRotationSequence)
            .withCustomRotationAssetId(customRotationAssetId)
            .withHeatTimesThrough(heatTimesThrough)
            .withReverseHeats(reverseHeatsBool)
            .withGroupOptions(groupOptions)
            .build();

    List<RaceParticipant> mockDrivers = new ArrayList<>();
    for (int i = 0; i < driverCount; i++) {
      Driver mockDriver = new Driver("Driver " + (i + 1), "Driver " + (i + 1));
      mockDrivers.add(new RaceParticipant(mockDriver));
    }

    com.antigravity.race.Race tempRace = // fqn-collision
        new com.antigravity.race.Race.Builder() // fqn-collision
            .model(tempRaceConfig)
            .customRotations(customRotations)
            .drivers(mockDrivers)
            .track(track)
            .isDemoMode(true)
            .build();

    List<Heat> heats = tempRace.getHeats();

    List<Map<String, Object>> heatList = new ArrayList<>();
    for (Heat heat : heats) {
      Map<String, Object> heatMap = new HashMap<>();
      heatMap.put("heatNumber", heat.getHeatNumber());
      heatMap.put("group", heat.getGroup());

      List<Map<String, Object>> lanes = new ArrayList<>();
      List<DriverHeatData> drivers = heat.getDrivers();
      for (int laneIdx = 0; laneIdx < drivers.size(); laneIdx++) {
        DriverHeatData driverData = drivers.get(laneIdx);
        Map<String, Object> laneMap = new HashMap<>();
        laneMap.put("laneNumber", laneIdx + 1);
        laneMap.put("driverNumber", driverData.getDriver().getSeed());

        if (laneIdx < track.getLanes().size()) {
          Lane lane = track.getLanes().get(laneIdx);
          laneMap.put("backgroundColor", lane.getBackground_color());
          laneMap.put("foregroundColor", lane.getForeground_color());
        }

        lanes.add(laneMap);
      }
      heatMap.put("lanes", lanes);
      heatList.add(heatMap);
    }

    Map<String, Object> response = new HashMap<>();
    response.put("heats", heatList);
    ctx.json(response);

    tempRace.stop();
  }

  public void validateRace(Race race) {
    if (race.getHeatRotationType() == HeatRotationType.CustomRoundRobin) {
      List<Integer> seq = race.getCustomRotationSequence();
      if (seq == null || seq.isEmpty()) {
        throw new IllegalArgumentException("Custom rotation sequence is required");
      }
      Track track = trackRepository.findByEntityId(race.getTrackEntityId());
      int numLanes = track != null ? track.getLanes().size() : Integer.MAX_VALUE;

      Set<Integer> uniqueLanes = new HashSet<>();
      for (Integer lane : seq) {
        if (lane == null || lane < 0) {
          throw new IllegalArgumentException(
              "Lane numbers must be greater than or equal to 0 and not null");
        }
        if (lane > numLanes) {
          throw new IllegalArgumentException(
              "Lane number " + lane + " exceeds track lane count (" + numLanes + ")");
        }
        if (lane > 0 && !uniqueLanes.add(lane)) {
          throw new IllegalArgumentException(
              "Lane number " + lane + " appears more than once in rotation sequence");
        }
      }
    } else if (race.getHeatRotationType() == HeatRotationType.Custom) {
      String assetId = race.getCustomRotationAssetId();
      if (assetId == null || assetId.isEmpty()) {
        throw new IllegalArgumentException("Custom rotation asset is required");
      }
      List<CustomRotation> rotations = resolveCustomRotations(assetId);
      if (rotations == null || rotations.isEmpty()) {
        throw new IllegalArgumentException("Custom rotation asset not found or empty");
      }
      Track track = trackRepository.findByEntityId(race.getTrackEntityId());
      int numLanes = track != null ? track.getLanes().size() : 0;

      Set<Integer> driverCounts = new HashSet<>();
      for (CustomRotation rot : rotations) {
        if (rot.getNumDrivers() <= 0) {
          throw new IllegalArgumentException("Driver count must be greater than 0");
        }
        if (!driverCounts.add(rot.getNumDrivers())) {
          throw new IllegalArgumentException(
              "Duplicate driver count in custom rotations: " + rot.getNumDrivers());
        }
        if (rot.getHeats() == null || rot.getHeats().isEmpty()) {
          throw new IllegalArgumentException(
              "At least one heat is required for custom rotation with "
                  + rot.getNumDrivers()
                  + " drivers");
        }
        for (CustomHeat heat : rot.getHeats()) {
          if (heat.getDriverIndices().size() != numLanes) {
            throw new IllegalArgumentException(
                "Heat must specify "
                    + numLanes
                    + " driver indices for a "
                    + numLanes
                    + " lane track");
          }
          for (Integer dIdx : heat.getDriverIndices()) {
            if (dIdx < 0 || dIdx > rot.getNumDrivers()) {
              throw new IllegalArgumentException(
                  "Invalid driver index "
                      + dIdx
                      + " for custom rotation with "
                      + rot.getNumDrivers()
                      + " drivers");
            }
          }
        }
      }
    }
  }

  public List<CustomRotation> resolveCustomRotations(String assetId) {
    if (assetId == null || assetId.isEmpty()) {
      return null;
    }
    AssetService assetService =
        new AssetService(
            databaseContext,
            databaseContext.getDataRoot() + databaseContext.getCurrentDatabaseName() + "/assets");
    AssetMessage asset = assetService.getAssetById(assetId);
    if (asset == null || asset.getCustomRotationsCount() == 0) {
      return null;
    }
    List<CustomRotation> list = new ArrayList<>();
    for (com.antigravity.proto.CustomRotation protoRot : // fqn-collision
        asset.getCustomRotationsList()) { // fqn-collision
      List<CustomHeat> heats = new ArrayList<>();
      for (com.antigravity.proto.CustomHeat protoHeat : protoRot.getHeatsList()) { // fqn-collision
        heats.add(
            new CustomHeat(
                new ArrayList<>(protoHeat.getDriverIndicesList()), protoHeat.getGroup()));
      }
      list.add(new CustomRotation(protoRot.getNumDrivers(), heats));
    }
    return list;
  }

  @SuppressWarnings("unchecked")
  public List<CustomRotation> parseCustomRotations(List<Map<String, Object>> customRotationsRaw) {
    if (customRotationsRaw == null) {
      return null;
    }
    List<CustomRotation> customRotations = new ArrayList<>();
    for (Map<String, Object> rotMap : customRotationsRaw) {
      Object numDriversObj = rotMap.get("numDrivers");
      if (numDriversObj == null) {
        numDriversObj = rotMap.get("num_drivers");
      }
      int numDrivers = ((Number) numDriversObj).intValue();
      List<Map<String, Object>> heatsRaw = (List<Map<String, Object>>) rotMap.get("heats");
      List<CustomHeat> heats = new ArrayList<>();
      if (heatsRaw != null) {
        for (Map<String, Object> heatMap : heatsRaw) {
          Object driverIndicesObj = heatMap.get("driverIndices");
          if (driverIndicesObj == null) {
            driverIndicesObj = heatMap.get("driver_indices");
          }
          List<Integer> driverIndices = (List<Integer>) driverIndicesObj;
          Object groupObj = heatMap.get("group");
          int group = groupObj != null ? ((Number) groupObj).intValue() : 0;
          heats.add(new CustomHeat(driverIndices, group));
        }
      }
      customRotations.add(new CustomRotation(numDrivers, heats));
    }
    return customRotations;
  }
}
