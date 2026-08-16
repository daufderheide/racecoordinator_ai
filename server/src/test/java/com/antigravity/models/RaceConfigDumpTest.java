package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import org.junit.Test;

public class RaceConfigDumpTest {

  @Test
  public void testConstructorsAndGetters() {
    RaceConfigDump dump =
        new RaceConfigDump(null, null, new ArrayList<>(), new ArrayList<>(), "base64data");

    assertEquals("base64data", dump.getRecordDataBase64());
    assertNotNull(dump.getDrivers());
    assertNotNull(dump.getCustomRotations());

    dump.setRecordDataBase64("updatedBase64");
    assertEquals("updatedBase64", dump.getRecordDataBase64());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RaceConfigDump dump =
        new RaceConfigDump(null, null, new ArrayList<>(), new ArrayList<>(), "base64");

    String json = mapper.writeValueAsString(dump);
    RaceConfigDump deserialized = mapper.readValue(json, RaceConfigDump.class);

    assertNotNull(deserialized);
    assertEquals("base64", deserialized.getRecordDataBase64());
  }
}
