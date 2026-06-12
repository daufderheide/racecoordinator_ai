package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.antigravity.models.Driver;
import com.antigravity.proto.DriverModel;
import com.antigravity.proto.Model;
import java.util.HashSet;
import org.bson.types.ObjectId;
import org.junit.Test;

public class DriverConverterTest {

  @Test
  public void testFromProto_Null() {
    assertNull(DriverConverter.fromProto(null));
  }

  @Test
  public void testFromProto_Full() {
    com.antigravity.proto.AudioConfig lapAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("lap_url")
            .setText("lap_text")
            .build();

    com.antigravity.proto.AudioConfig bestLapAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("tts")
            .setUrl("best_url")
            .setText("best_text")
            .build();

    com.antigravity.proto.AudioConfig penaltyAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("penalty_url")
            .setText("penalty_text")
            .build();

    DriverModel proto =
        DriverModel.newBuilder()
            .setName("Alice")
            .setNickname("Rocket")
            .setAvatarUrl("rocket_avatar.png")
            .setLapAudio(lapAudioProto)
            .setBestLapAudio(bestLapAudioProto)
            .setPenaltyAudio(penaltyAudioProto)
            .setModel(Model.newBuilder().setEntityId("d1").build())
            .build();

    Driver driver = DriverConverter.fromProto(proto);

    assertNotNull(driver);
    assertEquals("Alice", driver.getName());
    assertEquals("Rocket", driver.getNickname());
    assertEquals("rocket_avatar.png", driver.getAvatarUrl());
    assertEquals("d1", driver.getEntityId());

    // Audio assertions
    assertNotNull(driver.getLapAudio());
    assertEquals("preset", driver.getLapAudio().getType());
    assertEquals("lap_url", driver.getLapAudio().getUrl());
    assertEquals("lap_text", driver.getLapAudio().getText());

    assertNotNull(driver.getBestLapAudio());
    assertEquals("tts", driver.getBestLapAudio().getType());
    assertEquals("best_url", driver.getBestLapAudio().getUrl());
    assertEquals("best_text", driver.getBestLapAudio().getText());

    assertNotNull(driver.getPenaltyAudio());
    assertEquals("preset", driver.getPenaltyAudio().getType());
    assertEquals("penalty_url", driver.getPenaltyAudio().getUrl());
    assertEquals("penalty_text", driver.getPenaltyAudio().getText());
  }

  @Test
  public void testRoundTrip() {
    com.antigravity.models.AudioConfig lapAudio =
        new com.antigravity.models.AudioConfig("preset", "l_url", "l_text"); // fqn-collision
    com.antigravity.models.AudioConfig bestLapAudio =
        new com.antigravity.models.AudioConfig("tts", "b_url", "b_text"); // fqn-collision
    com.antigravity.models.AudioConfig penaltyAudio =
        new com.antigravity.models.AudioConfig("preset", "p_url", "p_text"); // fqn-collision

    Driver original =
        new Driver(
            "Bob",
            "The Builder",
            "builder_avatar.png",
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "d2",
            new ObjectId());

    DriverModel proto = DriverConverter.toProto(original, new HashSet<>());
    Driver reconstructed = DriverConverter.fromProto(proto);

    assertNotNull(reconstructed);
    assertEquals(original.getName(), reconstructed.getName());
    assertEquals(original.getNickname(), reconstructed.getNickname());
    assertEquals(original.getAvatarUrl(), reconstructed.getAvatarUrl());
    assertEquals(original.getEntityId(), reconstructed.getEntityId());

    assertNotNull(reconstructed.getLapAudio());
    assertEquals(original.getLapAudio().getType(), reconstructed.getLapAudio().getType());
    assertEquals(original.getLapAudio().getUrl(), reconstructed.getLapAudio().getUrl());
    assertEquals(original.getLapAudio().getText(), reconstructed.getLapAudio().getText());

    assertNotNull(reconstructed.getBestLapAudio());
    assertEquals(original.getBestLapAudio().getType(), reconstructed.getBestLapAudio().getType());
    assertEquals(original.getBestLapAudio().getUrl(), reconstructed.getBestLapAudio().getUrl());
    assertEquals(original.getBestLapAudio().getText(), reconstructed.getBestLapAudio().getText());

    assertNotNull(reconstructed.getPenaltyAudio());
    assertEquals(original.getPenaltyAudio().getType(), reconstructed.getPenaltyAudio().getType());
    assertEquals(original.getPenaltyAudio().getUrl(), reconstructed.getPenaltyAudio().getUrl());
    assertEquals(original.getPenaltyAudio().getText(), reconstructed.getPenaltyAudio().getText());
  }

  @Test
  public void testDriverConstructorDefaults() {
    Driver driver = new Driver("Bob", "The Builder", "d2", null);
    assertNotNull(driver.getLapAudio());
    assertEquals("preset", driver.getLapAudio().getType());
    assertEquals("default_beep", driver.getLapAudio().getUrl());

    assertNotNull(driver.getBestLapAudio());
    assertEquals("preset", driver.getBestLapAudio().getType());
    assertEquals("default_driveby", driver.getBestLapAudio().getUrl());

    assertNotNull(driver.getPenaltyAudio());
    assertEquals("preset", driver.getPenaltyAudio().getType());
    assertEquals("default_penalty", driver.getPenaltyAudio().getUrl());
  }
}
