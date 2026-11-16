package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.antigravity.protocols.ds.DsConfig;
import com.antigravity.protocols.ds.DsType;
import org.junit.Test;

public class DsConfigConverterTest {

  @Test
  public void testNullConfigReturnsDefaultProto() {
    com.antigravity.proto.DsConfig proto = DsConfigConverter.toProto(null); // fqn-collision
    assertNotNull(proto);
    assertEquals("", proto.getName());
    assertEquals("", proto.getCommPort());
  }

  @Test
  public void testNullProtoReturnsNullConfig() {
    DsConfig config = DsConfigConverter.fromProto(null);
    assertNull(config);
  }

  @Test
  public void testRoundtripConversionAllTypes() {
    for (DsType type : DsType.values()) {
      DsConfig config =
          new DsConfig.Builder()
              .name("DS Interface " + type.name())
              .commPort("COM3")
              .type(type)
              .build();

      com.antigravity.proto.DsConfig proto = DsConfigConverter.toProto(config); // fqn-collision
      assertNotNull(proto);
      assertEquals("DS Interface " + type.name(), proto.getName());
      assertEquals("COM3", proto.getCommPort());
      assertEquals(type.ordinal(), proto.getTypeValue());
      assertEquals(type.getBaudRate(), proto.getBaudRate());

      DsConfig converted = DsConfigConverter.fromProto(proto);
      assertNotNull(converted);
      assertEquals("DS Interface " + type.name(), converted.getName());
      assertEquals("COM3", converted.getCommPort());
      assertEquals(type, converted.getType());
      assertEquals(type.getBaudRate(), converted.getBaudRate());
    }
  }

  @Test
  public void testInvalidTypeValueDefaultsToDs300() {
    com.antigravity.proto.DsConfig proto = // fqn-collision
        com.antigravity.proto.DsConfig.newBuilder() // fqn-collision
            .setName("DS Test")
            .setCommPort("COM1")
            .setTypeValue(999)
            .build();

    DsConfig converted = DsConfigConverter.fromProto(proto);
    assertNotNull(converted);
    assertEquals(DsType.DS_300, converted.getType());
  }
}
