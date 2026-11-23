package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class RacePackageCommitRequestTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    RacePackageCommitRequest req = new RacePackageCommitRequest();
    assertNull(req.getTempPackageToken());
    assertEquals("CREATE_COPY", req.getDuplicateAction());
    assertEquals("CREATE_NEW", req.getConfigAction());
    assertNull(req.getRaceName());
    assertNotNull(req.getDriverResolutions());
    assertEquals(0, req.getDriverResolutions().size());
    assertNull(req.getSeasonId());

    req.setTempPackageToken("tok-1");
    req.setDuplicateAction("OVERWRITE");
    req.setConfigAction("USE_EXISTING");
    req.setRaceName("Grand Prix");
    req.setSeasonId("season-1");

    List<DriverResolution> resolutions = new ArrayList<>();
    resolutions.add(new DriverResolution("src-1", "LINK", "target-1", null));
    req.setDriverResolutions(resolutions);

    assertEquals("tok-1", req.getTempPackageToken());
    assertEquals("OVERWRITE", req.getDuplicateAction());
    assertEquals("USE_EXISTING", req.getConfigAction());
    assertEquals("Grand Prix", req.getRaceName());
    assertEquals("Grand Prix", req.getCustomConfigName());
    assertEquals("season-1", req.getSeasonId());
    assertEquals(1, req.getDriverResolutions().size());

    req.setCustomConfigName("Updated Grand Prix");
    assertEquals("Updated Grand Prix", req.getRaceName());
    assertEquals("Updated Grand Prix", req.getCustomConfigName());

    req.setDriverResolutions(null);
    assertNotNull(req.getDriverResolutions());
    assertEquals(0, req.getDriverResolutions().size());

    RacePackageCommitRequest fourArg =
        new RacePackageCommitRequest("tok-2", "SKIP", resolutions, "season-2");
    assertEquals("tok-2", fourArg.getTempPackageToken());
    assertEquals("SKIP", fourArg.getDuplicateAction());
    assertEquals("CREATE_NEW", fourArg.getConfigAction());
    assertEquals("season-2", fourArg.getSeasonId());

    RacePackageCommitRequest sixArg =
        new RacePackageCommitRequest(
            "tok-3", "CREATE_COPY", "CREATE_NEW", "GP 3", resolutions, "season-3");
    assertEquals("tok-3", sixArg.getTempPackageToken());
    assertEquals("CREATE_COPY", sixArg.getDuplicateAction());
    assertEquals("CREATE_NEW", sixArg.getConfigAction());
    assertEquals("GP 3", sixArg.getRaceName());
    assertEquals(1, sixArg.getDriverResolutions().size());
    assertEquals("season-3", sixArg.getSeasonId());

    RacePackageCommitRequest nullDefaults =
        new RacePackageCommitRequest("tok-4", null, null, null, null, null);
    assertEquals("CREATE_COPY", nullDefaults.getDuplicateAction());
    assertEquals("CREATE_NEW", nullDefaults.getConfigAction());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    List<DriverResolution> resolutions = new ArrayList<>();
    resolutions.add(new DriverResolution("d-1", "LINK", "t-1", null));

    RacePackageCommitRequest req =
        new RacePackageCommitRequest(
            "token-123", "OVERWRITE", "CREATE_NEW", "Championship Race", resolutions, "season-42");

    String json = mapper.writeValueAsString(req);
    RacePackageCommitRequest deserialized = mapper.readValue(json, RacePackageCommitRequest.class);

    assertNotNull(deserialized);
    assertEquals("token-123", deserialized.getTempPackageToken());
    assertEquals("OVERWRITE", deserialized.getDuplicateAction());
    assertEquals("CREATE_NEW", deserialized.getConfigAction());
    assertEquals("Championship Race", deserialized.getRaceName());
    assertEquals(1, deserialized.getDriverResolutions().size());
    assertEquals("season-42", deserialized.getSeasonId());
  }
}
