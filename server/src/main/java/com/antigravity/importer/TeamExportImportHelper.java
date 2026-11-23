package com.antigravity.importer;

import com.antigravity.importer.model.DriverImportMapping;
import com.antigravity.importer.model.DriverResolution;
import com.antigravity.models.Driver;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Team;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.repository.SqliteRepository;
import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class TeamExportImportHelper {

  private static final Logger logger = LoggerFactory.getLogger(TeamExportImportHelper.class);

  private TeamExportImportHelper() {}

  public static List<Team> collectTeamsAndMemberDrivers(
      RaceHistoryRecord history,
      SqliteRepository<Team> teamRepo,
      SqliteRepository<Driver> driverRepo,
      List<Driver> outCollectedDrivers) {

    Map<String, Team> teamMap = new LinkedHashMap<>();
    Set<String> collectedDriverIds = new HashSet<>();
    if (outCollectedDrivers != null) {
      for (Driver d : outCollectedDrivers) {
        if (d != null && d.getEntityId() != null) {
          collectedDriverIds.add(d.getEntityId());
        }
      }
    }

    if (history == null) {
      return new ArrayList<>();
    }

    // 1. Scan drivers
    if (history.getDrivers() != null) {
      for (RaceParticipant rp : history.getDrivers()) {
        inspectParticipantForTeam(rp, teamRepo, teamMap);
        collectParticipantTeamDrivers(rp, collectedDriverIds, outCollectedDrivers);
      }
    }

    // 2. Scan heats
    if (history.getHeats() != null) {
      for (Heat h : history.getHeats()) {
        if (h.getDrivers() != null) {
          for (DriverHeatData dhd : h.getDrivers()) {
            if (dhd != null && dhd.getDriver() != null) {
              inspectParticipantForTeam(dhd.getDriver(), teamRepo, teamMap);
              collectParticipantTeamDrivers(
                  dhd.getDriver(), collectedDriverIds, outCollectedDrivers);
            }
          }
        }
      }
    }

    // 3. For all discovered teams, ensure all member drivers are collected
    if (driverRepo != null && outCollectedDrivers != null) {
      for (Team team : teamMap.values()) {
        if (team.getDriverIds() != null) {
          for (String dId : team.getDriverIds()) {
            if (dId != null && !dId.trim().isEmpty() && !collectedDriverIds.contains(dId)) {
              Driver fullDriver = driverRepo.findByEntityId(dId);
              if (fullDriver != null) {
                outCollectedDrivers.add(fullDriver);
                collectedDriverIds.add(fullDriver.getEntityId());
              }
            }
          }
        }
      }
    }

    return new ArrayList<>(teamMap.values());
  }

  private static void inspectParticipantForTeam(
      RaceParticipant rp, SqliteRepository<Team> teamRepo, Map<String, Team> teamMap) {
    if (rp == null) {
      return;
    }

    Team team = rp.getTeam();
    String teamId = null;

    if (team != null) {
      teamId = team.getEntityId();
      if ((teamId == null || teamId.trim().isEmpty()) && team.getName() != null) {
        teamId = team.getName().trim().toLowerCase(Locale.ROOT);
      }
    } else if (rp.isTeamParticipant()
        || (rp.getDriver() != null && isSyntheticTeamDriver(rp.getDriver()))) {
      String rawId = rp.getDriver() != null ? rp.getDriver().getEntityId() : rp.getObjectId();
      if (rawId != null && rawId.startsWith("t_")) {
        teamId = rawId.substring(2);
      }
    }

    if (teamId == null || teamId.trim().isEmpty() || teamMap.containsKey(teamId)) {
      return;
    }

    // Look up full team in repo
    Team fullTeam = null;
    if (teamRepo != null) {
      fullTeam = teamRepo.findByEntityId(teamId);
      if (fullTeam == null && team != null && team.getName() != null) {
        fullTeam = findTeamByName(team.getName(), teamRepo.findAll());
      }
      if (fullTeam == null && rp.getDriver() != null && rp.getDriver().getName() != null) {
        fullTeam = findTeamByName(rp.getDriver().getName(), teamRepo.findAll());
      }
    }

    if (fullTeam != null) {
      teamMap.put(teamId, fullTeam);
      teamMap.put(fullTeam.getEntityId(), fullTeam);
    } else if (team != null) {
      teamMap.put(teamId, team);
    } else if (rp.getDriver() != null) {
      String tName = rp.getDriver().getName() != null ? rp.getDriver().getName() : "Team";
      Team stub =
          new Team.Builder()
              .withEntityId(teamId)
              .withName(tName)
              .withAvatarUrl(rp.getDriver().getAvatarUrl())
              .build();
      teamMap.put(teamId, stub);
    }
  }

  private static boolean isSyntheticTeamDriver(Driver d) {
    return d != null && d.getEntityId() != null && d.getEntityId().startsWith("t_");
  }

  public static List<DriverImportMapping> buildTeamImportMappings(
      List<Team> packageTeams, SqliteRepository<Team> teamRepo) {
    List<DriverImportMapping> mappings = new ArrayList<>();
    if (packageTeams == null || packageTeams.isEmpty()) {
      return mappings;
    }

    List<Team> localTeams = teamRepo != null ? teamRepo.findAll() : new ArrayList<>();
    Map<String, Team> byName = new HashMap<>();
    for (Team lt : localTeams) {
      if (lt.getName() != null) {
        byName.put(lt.getName().trim().toLowerCase(Locale.ROOT), lt);
      }
    }

    for (Team pt : packageTeams) {
      String pName = pt.getName() != null ? pt.getName().trim() : "";
      Team matched = byName.get(pName.toLowerCase(Locale.ROOT));
      String srcId = "t_" + pt.getEntityId();

      if (matched != null) {
        mappings.add(
            new DriverImportMapping(
                srcId,
                pName,
                "",
                "t_" + matched.getEntityId(),
                matched.getName(),
                "EXACT_NAME",
                "LINK"));
      } else {
        mappings.add(new DriverImportMapping(srcId, pName, "", null, null, "NONE", "CREATE_NEW"));
      }
    }
    return mappings;
  }

  private static void collectParticipantTeamDrivers(
      RaceParticipant rp, Set<String> collectedDriverIds, List<Driver> outCollectedDrivers) {
    if (rp != null && rp.getTeamDrivers() != null && outCollectedDrivers != null) {
      for (Driver d : rp.getTeamDrivers()) {
        if (d != null && d.getEntityId() != null && !collectedDriverIds.contains(d.getEntityId())) {
          outCollectedDrivers.add(d);
          collectedDriverIds.add(d.getEntityId());
        }
      }
    }
  }

  public static class ResolvedTeams {
    private final Map<String, Team> resolvedMap = new HashMap<>();
    private int createdCount;
    private int linkedCount;

    public Map<String, Team> getResolvedMap() {
      return resolvedMap;
    }

    public int getCreatedCount() {
      return createdCount;
    }

    public int getLinkedCount() {
      return linkedCount;
    }
  }

  public static ResolvedTeams resolveTeams(
      List<Team> packageTeams,
      Map<String, String> driverIdMap,
      List<DriverResolution> resolutions,
      SqliteRepository<Team> teamRepo,
      Map<String, String> uploadedAssetLookup) {

    ResolvedTeams result = new ResolvedTeams();
    if (packageTeams == null || packageTeams.isEmpty() || teamRepo == null) {
      return result;
    }

    Map<String, DriverResolution> resMap = buildResolutionMap(resolutions);
    List<Team> localTeams = teamRepo.findAll();
    Set<String> existingNames = collectExistingTeamNames(localTeams);

    for (Team pt : packageTeams) {
      resolveSingleTeam(
          pt,
          resMap,
          existingNames,
          localTeams,
          driverIdMap,
          teamRepo,
          uploadedAssetLookup,
          result);
    }

    return result;
  }

  private static Map<String, DriverResolution> buildResolutionMap(
      List<DriverResolution> resolutions) {
    Map<String, DriverResolution> resMap = new HashMap<>();
    if (resolutions != null) {
      for (DriverResolution r : resolutions) {
        if (r.getSourceDriverId() != null) {
          resMap.put(r.getSourceDriverId(), r);
          if (r.getSourceDriverId().startsWith("t_")) {
            resMap.put(r.getSourceDriverId().substring(2), r);
          }
        }
      }
    }
    return resMap;
  }

  private static Set<String> collectExistingTeamNames(List<Team> localTeams) {
    Set<String> existingNames = new HashSet<>();
    if (localTeams != null) {
      for (Team lt : localTeams) {
        if (lt.getName() != null) {
          existingNames.add(lt.getName().trim());
        }
      }
    }
    return existingNames;
  }

  private static void resolveSingleTeam(
      Team pt,
      Map<String, DriverResolution> resMap,
      Set<String> existingNames,
      List<Team> localTeams,
      Map<String, String> driverIdMap,
      SqliteRepository<Team> teamRepo,
      Map<String, String> uploadedAssetLookup,
      ResolvedTeams result) {

    String rawId = pt.getEntityId();
    String prefixedId = "t_" + rawId;
    DriverResolution res = resMap.get(prefixedId);
    if (res == null) {
      res = resMap.get(rawId);
    }

    Team matchedLocal = findMatchingLocalTeam(pt, res, localTeams, teamRepo);
    if (matchedLocal != null) {
      result.resolvedMap.put(rawId, matchedLocal);
      result.resolvedMap.put(prefixedId, matchedLocal);
      result.linkedCount++;
      logger.info("Team '{}' linked to local team '{}'", pt.getName(), matchedLocal.getName());
    } else {
      Team newTeam =
          createNewTeam(pt, res, existingNames, driverIdMap, teamRepo, uploadedAssetLookup);
      result.resolvedMap.put(rawId, newTeam);
      result.resolvedMap.put(prefixedId, newTeam);
      result.createdCount++;
      logger.info(
          "Created new team '{}' with entityId '{}'", newTeam.getName(), newTeam.getEntityId());
    }
  }

  private static Team findMatchingLocalTeam(
      Team pt, DriverResolution res, List<Team> localTeams, SqliteRepository<Team> teamRepo) {
    if (res != null
        && "LINK".equalsIgnoreCase(res.getAction())
        && res.getTargetDriverId() != null) {
      String targetId = res.getTargetDriverId();
      if (targetId.startsWith("t_")) {
        targetId = targetId.substring(2);
      }
      return teamRepo.findByEntityId(targetId);
    } else if (res == null || !"CREATE_NEW".equalsIgnoreCase(res.getAction())) {
      return findTeamByName(pt.getName(), localTeams);
    }
    return null;
  }

  private static Team createNewTeam(
      Team pt,
      DriverResolution res,
      Set<String> existingNames,
      Map<String, String> driverIdMap,
      SqliteRepository<Team> teamRepo,
      Map<String, String> uploadedAssetLookup) {

    String candidateName =
        (res != null && res.getNewDriverName() != null && !res.getNewDriverName().trim().isEmpty())
            ? res.getNewDriverName().trim()
            : (pt.getName() != null ? pt.getName().trim() : "Team");

    String newName = candidateName;
    if (DriverImporter.containsCaseInsensitive(existingNames, newName)) {
      newName = DriverImporter.generateUniqueName(newName, existingNames);
    }
    existingNames.add(newName);

    List<String> newDriverIds = new ArrayList<>();
    if (pt.getDriverIds() != null) {
      for (String dId : pt.getDriverIds()) {
        if (dId != null) {
          String mapped = driverIdMap != null ? driverIdMap.getOrDefault(dId, dId) : dId;
          newDriverIds.add(mapped);
        }
      }
    }

    String avatarUrl = pt.getAvatarUrl();
    if (avatarUrl != null && uploadedAssetLookup != null) {
      String simple = new File(avatarUrl).getName().toLowerCase(Locale.ROOT);
      if (uploadedAssetLookup.containsKey(simple)) {
        avatarUrl = uploadedAssetLookup.get(simple);
      }
    }

    String nextId = teamRepo.getNextSequence();
    Team newTeam =
        new Team.Builder()
            .from(pt)
            .withEntityId(nextId)
            .withName(newName)
            .withAvatarUrl(avatarUrl)
            .withDriverIds(newDriverIds)
            .withId(null)
            .build();
    teamRepo.insert(newTeam);
    return newTeam;
  }

  public static void remapParticipantTeam(
      RaceParticipant rp,
      Map<String, Team> resolvedTeams,
      Map<String, String> driverIdMap,
      Map<String, String> driverNameMap) {
    if (rp == null || resolvedTeams == null) {
      return;
    }

    String teamKey = null;
    if (rp.getTeam() != null && rp.getTeam().getEntityId() != null) {
      teamKey = rp.getTeam().getEntityId();
    } else if (rp.getDriver() != null && isSyntheticTeamDriver(rp.getDriver())) {
      teamKey = rp.getDriver().getEntityId().substring(2);
    } else if (rp.getObjectId() != null && rp.getObjectId().startsWith("t_")) {
      teamKey = rp.getObjectId().substring(2);
    }

    if (teamKey == null) {
      return;
    }

    Team targetTeam = resolvedTeams.get(teamKey);
    if (targetTeam == null) {
      targetTeam = resolvedTeams.get("t_" + teamKey);
    }

    if (targetTeam != null) {
      rp.setTeam(targetTeam);
      rp.setTeamParticipant(true);
      String newPrefixedId = "t_" + targetTeam.getEntityId();
      rp.setObjectId(newPrefixedId);

      Driver updatedDriver =
          new Driver.Builder()
              .withName(targetTeam.getName())
              .withAvatarUrl(targetTeam.getAvatarUrl())
              .withEntityId(newPrefixedId)
              .withLabelIds(targetTeam.getLabelIds())
              .build();
      rp.setDriver(updatedDriver);

      if (rp.getTeamDrivers() != null && driverIdMap != null) {
        List<Driver> updatedTeamDrivers = new ArrayList<>();
        for (Driver td : rp.getTeamDrivers()) {
          if (td != null && td.getEntityId() != null && driverIdMap.containsKey(td.getEntityId())) {
            String newDId = driverIdMap.get(td.getEntityId());
            String newDName =
                driverNameMap != null ? driverNameMap.get(td.getEntityId()) : td.getName();
            updatedTeamDrivers.add(
                Driver.Builder.from(td)
                    .withEntityId(newDId)
                    .withName(newDName != null ? newDName : td.getName())
                    .build());
          } else {
            updatedTeamDrivers.add(td);
          }
        }
        rp.setTeamDrivers(updatedTeamDrivers);
      }
    }
  }

  private static Team findTeamByName(String name, List<Team> teams) {
    if (name == null || teams == null) {
      return null;
    }
    String trimmed = name.trim();
    for (Team t : teams) {
      if (t != null && t.getName() != null && t.getName().trim().equalsIgnoreCase(trimmed)) {
        return t;
      }
    }
    return null;
  }
}
