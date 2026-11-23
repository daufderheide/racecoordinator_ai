package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class TeamExportImportHelperTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private SqliteRepository<Team> teamRepository;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    teamRepository = new SqliteRepository<>(databaseContext, "teams", Team.class);
  }

  @After
  public void tearDown() {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  @Test
  public void testCollectTeamsAndMemberDrivers_WithTeamParticipant() {
    // 1. Save member drivers to repository
    Driver d1 = new Driver.Builder().withEntityId("d1").withName("Driver One").build();
    Driver d2 = new Driver.Builder().withEntityId("d2").withName("Driver Two").build();
    driverRepository.save(d1);
    driverRepository.save(d2);

    // 2. Save team
    Team t =
        new Team.Builder()
            .withEntityId("team-1")
            .withName("Scuderia Racing")
            .withDriverIds(Arrays.asList("d1", "d2"))
            .build();
    teamRepository.save(t);

    // 3. Build history record with team participant
    RaceHistoryRecord history = new RaceHistoryRecord();
    RaceParticipant rp = new RaceParticipant();
    rp.setTeam(t);
    rp.setTeamParticipant(true);
    rp.setObjectId("t_team-1");
    history.setDrivers(Collections.singletonList(rp));

    List<Driver> outDrivers = new ArrayList<>();
    List<Team> collectedTeams =
        TeamExportImportHelper.collectTeamsAndMemberDrivers(
            history, teamRepository, driverRepository, outDrivers);

    assertEquals(1, collectedTeams.size());
    assertEquals("Scuderia Racing", collectedTeams.get(0).getName());
    assertEquals(2, outDrivers.size());
    assertTrue(outDrivers.stream().anyMatch(d -> "d1".equals(d.getEntityId())));
    assertTrue(outDrivers.stream().anyMatch(d -> "d2".equals(d.getEntityId())));
  }

  @Test
  public void testCollectTeamsAndMemberDrivers_WithHeatsAndTeamDrivers() {
    Driver d1 = new Driver.Builder().withEntityId("d1").withName("Driver One").build();
    Team t =
        new Team.Builder()
            .withEntityId("team-2")
            .withName("Apex Motorsport")
            .withDriverIds(Collections.singletonList("d1"))
            .build();
    teamRepository.save(t);
    driverRepository.save(d1);

    RaceHistoryRecord history = new RaceHistoryRecord();
    Heat heat = new Heat();
    DriverHeatData dhd = new DriverHeatData();
    RaceParticipant teamPart = new RaceParticipant();
    teamPart.setTeam(t);
    teamPart.setTeamParticipant(true);
    dhd.setDriver(teamPart);
    dhd.setActualDriver(d1);
    heat.setDrivers(Collections.singletonList(dhd));
    history.setHeats(Collections.singletonList(heat));

    List<Driver> outDrivers = new ArrayList<>();
    List<Team> collected =
        TeamExportImportHelper.collectTeamsAndMemberDrivers(
            history, teamRepository, driverRepository, outDrivers);

    assertEquals(1, collected.size());
    assertEquals("Apex Motorsport", collected.get(0).getName());
    assertEquals(1, outDrivers.size());
  }

  @Test
  public void testBuildTeamImportMappings() {
    Team localTeam = new Team.Builder().withEntityId("local-1").withName("Ferrari").build();
    teamRepository.save(localTeam);

    Team packageTeam1 = new Team.Builder().withEntityId("pkg-1").withName("Ferrari").build();
    Team packageTeam2 = new Team.Builder().withEntityId("pkg-2").withName("Red Bull").build();

    List<DriverImportMapping> mappings =
        TeamExportImportHelper.buildTeamImportMappings(
            Arrays.asList(packageTeam1, packageTeam2), teamRepository);

    assertEquals(2, mappings.size());

    DriverImportMapping m1 = mappings.get(0);
    assertEquals("t_pkg-1", m1.getSourceDriverId());
    assertEquals("EXACT_NAME", m1.getMatchType());
    assertEquals("LINK", m1.getSuggestedAction());
    assertEquals("t_local-1", m1.getMatchedLocalDriverId());

    DriverImportMapping m2 = mappings.get(1);
    assertEquals("t_pkg-2", m2.getSourceDriverId());
    assertEquals("NONE", m2.getMatchType());
    assertEquals("CREATE_NEW", m2.getSuggestedAction());
  }

  @Test
  public void testResolveTeams_LinkAndCreateNew() {
    Team existing = new Team.Builder().withEntityId("loc-100").withName("Existing Team").build();
    teamRepository.save(existing);

    Team pt1 = new Team.Builder().withEntityId("src-1").withName("Existing Team").build();
    Team pt2 =
        new Team.Builder()
            .withEntityId("src-2")
            .withName("Brand New Team")
            .withDriverIds(Collections.singletonList("d-src"))
            .build();

    Map<String, String> driverIdMap = new HashMap<>();
    driverIdMap.put("d-src", "d-local");

    List<DriverResolution> resolutions = new ArrayList<>();
    resolutions.add(new DriverResolution("t_src-1", "LINK", "t_loc-100", null));
    resolutions.add(new DriverResolution("t_src-2", "CREATE_NEW", null, "Brand New Team"));

    TeamExportImportHelper.ResolvedTeams res =
        TeamExportImportHelper.resolveTeams(
            Arrays.asList(pt1, pt2),
            driverIdMap,
            resolutions,
            teamRepository,
            Collections.emptyMap());

    assertEquals(1, res.getLinkedCount());
    assertEquals(1, res.getCreatedCount());

    Team linked = res.getResolvedMap().get("src-1");
    assertNotNull(linked);
    assertEquals("Existing Team", linked.getName());
    assertEquals("loc-100", linked.getEntityId());

    Team created = res.getResolvedMap().get("src-2");
    assertNotNull(created);
    assertEquals("Brand New Team", created.getName());
    assertTrue(created.getDriverIds().contains("d-local"));

    Team inDb = teamRepository.findByEntityId(created.getEntityId());
    assertNotNull(inDb);
  }

  @Test
  public void testRemapParticipantTeam() {
    Team localTeam =
        new Team.Builder()
            .withEntityId("t99")
            .withName("McLaren")
            .withAvatarUrl("mclaren.png")
            .build();

    Map<String, Team> resolvedTeams = new HashMap<>();
    resolvedTeams.put("src-t1", localTeam);
    resolvedTeams.put("t_src-t1", localTeam);

    Map<String, String> driverIdMap = new HashMap<>();
    driverIdMap.put("d-src1", "d-local1");
    Map<String, String> driverNameMap = new HashMap<>();
    driverNameMap.put("d-src1", "Lando");

    RaceParticipant rp = new RaceParticipant();
    rp.setObjectId("t_src-t1");
    rp.setTeam(new Team.Builder().withEntityId("src-t1").withName("Old McLaren").build());
    rp.setTeamParticipant(true);

    Driver td = new Driver.Builder().withEntityId("d-src1").withName("Old Lando").build();
    rp.setTeamDrivers(Collections.singletonList(td));

    TeamExportImportHelper.remapParticipantTeam(rp, resolvedTeams, driverIdMap, driverNameMap);

    assertEquals("t_t99", rp.getObjectId());
    assertEquals("McLaren", rp.getTeam().getName());
    assertEquals("t_t99", rp.getDriver().getEntityId());
    assertEquals("McLaren", rp.getDriver().getName());
    assertEquals(1, rp.getTeamDrivers().size());
    assertEquals("d-local1", rp.getTeamDrivers().get(0).getEntityId());
    assertEquals("Lando", rp.getTeamDrivers().get(0).getName());
  }
}
