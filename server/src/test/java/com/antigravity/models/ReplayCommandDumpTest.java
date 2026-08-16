package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class ReplayCommandDumpTest {

  @Test
  public void testConstructorsAndGetters() {
    ReplayCommandDump dump = new ReplayCommandDump("start-race", "params");
    assertEquals("start-race", dump.getCommand());
    assertEquals("params", dump.getParameters());

    dump.setCommand("pause-race");
    dump.setParameters(123);
    assertEquals("pause-race", dump.getCommand());
    assertEquals(123, dump.getParameters());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    ReplayCommandDump dump = new ReplayCommandDump("stop-race", null);

    String json = mapper.writeValueAsString(dump);
    ReplayCommandDump deserialized = mapper.readValue(json, ReplayCommandDump.class);

    assertNotNull(deserialized);
    assertEquals("stop-race", deserialized.getCommand());
  }
}
