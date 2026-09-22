package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.antigravity.models.Driver;
import com.antigravity.proto.DriverModel;
import com.antigravity.proto.Model;
import java.util.HashSet;
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

    com.antigravity.proto.AudioConfig overallBestLapAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("record_url")
            .setText("record_text")
            .build();

    com.antigravity.proto.AudioConfig overallLaneBestLapAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("record_lane_url")
            .setText("record_lane_text")
            .build();

    com.antigravity.proto.AudioConfig raceBestLapAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("tts")
            .setUrl("race_url")
            .setText("race_text")
            .build();

    com.antigravity.proto.AudioConfig raceLaneBestLapAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("race_lane_url")
            .setText("race_lane_text")
            .build();

    com.antigravity.proto.AudioConfig heatBestLapAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("heat_url")
            .setText("heat_text")
            .build();

    com.antigravity.proto.AudioConfig newRaceLeaderAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("new_race_leader_url")
            .setText("new_race_leader_text")
            .build();

    com.antigravity.proto.AudioConfig newHeatLeaderAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("new_heat_leader_url")
            .setText("new_heat_leader_text")
            .build();

    com.antigravity.proto.AudioConfig pitInAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("preset")
            .setUrl("pit_in_url")
            .setText("pit_in_text")
            .build();

    com.antigravity.proto.AudioConfig fuelAudioProto =
        com.antigravity.proto.AudioConfig.newBuilder()
            .setType("audio_set")
            .setUrl("fuel_set_url")
            .build();

    DriverModel proto =
        DriverModel.newBuilder()
            .setName("Alice")
            .setNickname("Rocket")
            .setAvatarUrl("rocket_avatar.png")
            .setLapAudio(lapAudioProto)
            .setBestLapAudio(bestLapAudioProto)
            .setPenaltyAudio(penaltyAudioProto)
            .setOverallBestLapAudio(overallBestLapAudioProto)
            .setOverallLaneBestLapAudio(overallLaneBestLapAudioProto)
            .setRaceBestLapAudio(raceBestLapAudioProto)
            .setRaceLaneBestLapAudio(raceLaneBestLapAudioProto)
            .setHeatBestLapAudio(heatBestLapAudioProto)
            .setNewRaceLeaderAudio(newRaceLeaderAudioProto)
            .setNewHeatLeaderAudio(newHeatLeaderAudioProto)
            .setPitInAudio(pitInAudioProto)
            .setFuelAudio(fuelAudioProto)
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

    assertNotNull(driver.getOverallBestLapAudio());
    assertEquals("preset", driver.getOverallBestLapAudio().getType());
    assertEquals("record_url", driver.getOverallBestLapAudio().getUrl());

    assertNotNull(driver.getOverallLaneBestLapAudio());
    assertEquals("preset", driver.getOverallLaneBestLapAudio().getType());
    assertEquals("record_lane_url", driver.getOverallLaneBestLapAudio().getUrl());

    assertNotNull(driver.getRaceBestLapAudio());
    assertEquals("tts", driver.getRaceBestLapAudio().getType());
    assertEquals("race_text", driver.getRaceBestLapAudio().getText());

    assertNotNull(driver.getRaceLaneBestLapAudio());
    assertEquals("preset", driver.getRaceLaneBestLapAudio().getType());
    assertEquals("race_lane_url", driver.getRaceLaneBestLapAudio().getUrl());

    assertNotNull(driver.getHeatBestLapAudio());
    assertEquals("preset", driver.getHeatBestLapAudio().getType());
    assertEquals("heat_url", driver.getHeatBestLapAudio().getUrl());

    assertNotNull(driver.getNewRaceLeaderAudio());
    assertEquals("preset", driver.getNewRaceLeaderAudio().getType());
    assertEquals("new_race_leader_url", driver.getNewRaceLeaderAudio().getUrl());

    assertNotNull(driver.getNewHeatLeaderAudio());
    assertEquals("preset", driver.getNewHeatLeaderAudio().getType());
    assertEquals("new_heat_leader_url", driver.getNewHeatLeaderAudio().getUrl());

    assertNotNull(driver.getPitInAudio());
    assertEquals("preset", driver.getPitInAudio().getType());
    assertEquals("pit_in_url", driver.getPitInAudio().getUrl());
    assertEquals("pit_in_text", driver.getPitInAudio().getText());

    assertNotNull(driver.getFuelAudio());
    assertEquals("audio_set", driver.getFuelAudio().getType());
    assertEquals("fuel_set_url", driver.getFuelAudio().getUrl());
  }

  @Test
  public void testRoundTrip() {
    com.antigravity.models.AudioConfig lapAudio =
        new com.antigravity.models.AudioConfig("preset", "l_url", "l_text"); // fqn-collision
    com.antigravity.models.AudioConfig bestLapAudio =
        new com.antigravity.models.AudioConfig("tts", "b_url", "b_text"); // fqn-collision
    com.antigravity.models.AudioConfig penaltyAudio =
        new com.antigravity.models.AudioConfig("preset", "p_url", "p_text"); // fqn-collision
    com.antigravity.models.AudioConfig overallBestLapAudio =
        new com.antigravity.models.AudioConfig("preset", "ob_url", "ob_text"); // fqn-collision
    com.antigravity.models.AudioConfig overallLaneBestLapAudio =
        new com.antigravity.models.AudioConfig("preset", "olb_url", "olb_text"); // fqn-collision
    com.antigravity.models.AudioConfig raceBestLapAudio =
        new com.antigravity.models.AudioConfig("tts", "rb_url", "rb_text"); // fqn-collision
    com.antigravity.models.AudioConfig raceLaneBestLapAudio =
        new com.antigravity.models.AudioConfig("preset", "rlb_url", "rlb_text"); // fqn-collision
    com.antigravity.models.AudioConfig heatBestLapAudio =
        new com.antigravity.models.AudioConfig("preset", "hb_url", "hb_text"); // fqn-collision
    com.antigravity.models.AudioConfig newRaceLeaderAudio =
        new com.antigravity.models.AudioConfig("preset", "nrl_url", "nrl_text"); // fqn-collision
    com.antigravity.models.AudioConfig newHeatLeaderAudio =
        new com.antigravity.models.AudioConfig("preset", "nhl_url", "nhl_text"); // fqn-collision
    com.antigravity.models.AudioConfig pitInAudio =
        new com.antigravity.models.AudioConfig("preset", "pi_url", "pi_text"); // fqn-collision
    com.antigravity.models.AudioConfig fuelAudio =
        new com.antigravity.models.AudioConfig("audio_set", "fl_set", null); // fqn-collision

    Driver original =
        new Driver.Builder()
            .withName("Bob")
            .withNickname("The Builder")
            .withAvatarUrl("builder_avatar.png")
            .withLapAudio(lapAudio)
            .withBestLapAudio(bestLapAudio)
            .withPenaltyAudio(penaltyAudio)
            .withOverallBestLapAudio(overallBestLapAudio)
            .withOverallLaneBestLapAudio(overallLaneBestLapAudio)
            .withRaceBestLapAudio(raceBestLapAudio)
            .withRaceLaneBestLapAudio(raceLaneBestLapAudio)
            .withHeatBestLapAudio(heatBestLapAudio)
            .withNewRaceLeaderAudio(newRaceLeaderAudio)
            .withNewHeatLeaderAudio(newHeatLeaderAudio)
            .withPitInAudio(pitInAudio)
            .withFuelAudio(fuelAudio)
            .withEntityId("d2")
            .withId("1")
            .build();

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

    assertNotNull(reconstructed.getOverallBestLapAudio());
    assertEquals(
        original.getOverallBestLapAudio().getUrl(),
        reconstructed.getOverallBestLapAudio().getUrl());

    assertNotNull(reconstructed.getOverallLaneBestLapAudio());
    assertEquals(
        original.getOverallLaneBestLapAudio().getUrl(),
        reconstructed.getOverallLaneBestLapAudio().getUrl());

    assertNotNull(reconstructed.getRaceBestLapAudio());
    assertEquals(
        original.getRaceBestLapAudio().getText(), reconstructed.getRaceBestLapAudio().getText());

    assertNotNull(reconstructed.getRaceLaneBestLapAudio());
    assertEquals(
        original.getRaceLaneBestLapAudio().getUrl(),
        reconstructed.getRaceLaneBestLapAudio().getUrl());

    assertNotNull(reconstructed.getHeatBestLapAudio());
    assertEquals(
        original.getHeatBestLapAudio().getUrl(), reconstructed.getHeatBestLapAudio().getUrl());

    assertNotNull(reconstructed.getNewRaceLeaderAudio());
    assertEquals(
        original.getNewRaceLeaderAudio().getUrl(), reconstructed.getNewRaceLeaderAudio().getUrl());

    assertNotNull(reconstructed.getNewHeatLeaderAudio());
    assertEquals(
        original.getNewHeatLeaderAudio().getUrl(), reconstructed.getNewHeatLeaderAudio().getUrl());

    assertNotNull(reconstructed.getPitInAudio());
    assertEquals(original.getPitInAudio().getUrl(), reconstructed.getPitInAudio().getUrl());

    assertNotNull(reconstructed.getFuelAudio());
    assertEquals(original.getFuelAudio().getUrl(), reconstructed.getFuelAudio().getUrl());
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

    assertNotNull(driver.getOverallBestLapAudio());
    assertEquals("preset", driver.getOverallBestLapAudio().getType());
    assertEquals("default_record_lap", driver.getOverallBestLapAudio().getUrl());

    assertNotNull(driver.getOverallLaneBestLapAudio());
    assertEquals("preset", driver.getOverallLaneBestLapAudio().getType());
    assertEquals("default_record_lane_lap", driver.getOverallLaneBestLapAudio().getUrl());

    assertNotNull(driver.getRaceBestLapAudio());
    assertEquals("preset", driver.getRaceBestLapAudio().getType());
    assertEquals("default_best_race_lap", driver.getRaceBestLapAudio().getUrl());

    assertNotNull(driver.getRaceLaneBestLapAudio());
    assertEquals("preset", driver.getRaceLaneBestLapAudio().getType());
    assertEquals("default_best_race_lane_lap", driver.getRaceLaneBestLapAudio().getUrl());

    assertNotNull(driver.getHeatBestLapAudio());
    assertEquals("preset", driver.getHeatBestLapAudio().getType());
    assertEquals("default_best_heat_lap", driver.getHeatBestLapAudio().getUrl());

    assertNotNull(driver.getNewRaceLeaderAudio());
    assertEquals("preset", driver.getNewRaceLeaderAudio().getType());
    assertEquals("default_new_race_leader", driver.getNewRaceLeaderAudio().getUrl());

    assertNotNull(driver.getNewHeatLeaderAudio());
    assertEquals("preset", driver.getNewHeatLeaderAudio().getType());
    assertEquals("default_new_heat_leader", driver.getNewHeatLeaderAudio().getUrl());

    assertNotNull(driver.getPitInAudio());
    assertEquals("preset", driver.getPitInAudio().getType());
    assertEquals("default_pit_in", driver.getPitInAudio().getUrl());

    assertNotNull(driver.getFuelAudio());
    assertEquals("audio_set", driver.getFuelAudio().getType());
    assertEquals("default_fuel_level", driver.getFuelAudio().getUrl());
  }

  @Test
  public void testDriverBuilderCopy() {
    Driver driver = new Driver("Bob", "The Builder", "d2", "id1");
    Driver copy = Driver.Builder.from(driver).withNickname("Builder Bob").build();

    assertEquals("Bob", copy.getName());
    assertEquals("Builder Bob", copy.getNickname());
    assertEquals("d2", copy.getEntityId());
    assertEquals("id1", copy.getId());
    assertEquals(driver.getOverallBestLapAudio().getUrl(), copy.getOverallBestLapAudio().getUrl());
    assertEquals(
        driver.getOverallLaneBestLapAudio().getUrl(), copy.getOverallLaneBestLapAudio().getUrl());
    assertEquals(driver.getRaceBestLapAudio().getUrl(), copy.getRaceBestLapAudio().getUrl());
    assertEquals(
        driver.getRaceLaneBestLapAudio().getUrl(), copy.getRaceLaneBestLapAudio().getUrl());
    assertEquals(driver.getHeatBestLapAudio().getUrl(), copy.getHeatBestLapAudio().getUrl());
    assertEquals(driver.getNewRaceLeaderAudio().getUrl(), copy.getNewRaceLeaderAudio().getUrl());
    assertEquals(driver.getNewHeatLeaderAudio().getUrl(), copy.getNewHeatLeaderAudio().getUrl());
    assertEquals(driver.getPitInAudio().getUrl(), copy.getPitInAudio().getUrl());
    assertEquals(driver.getFuelAudio().getUrl(), copy.getFuelAudio().getUrl());
  }

  @Test
  public void testToProto_WithNoneAudioConfig_DoesNotInjectDefaultUrls() {
    com.antigravity.models.AudioConfig noneAudio =
        new com.antigravity.models.AudioConfig("none", null, null);
    Driver driver =
        new Driver.Builder()
            .withName("Silent Driver")
            .withNickname("Silent")
            .withEntityId("d_silent")
            .withLapAudio(noneAudio)
            .withBestLapAudio(noneAudio)
            .withPenaltyAudio(noneAudio)
            .withOverallBestLapAudio(noneAudio)
            .withOverallLaneBestLapAudio(noneAudio)
            .withRaceBestLapAudio(noneAudio)
            .withRaceLaneBestLapAudio(noneAudio)
            .withHeatBestLapAudio(noneAudio)
            .withNewRaceLeaderAudio(noneAudio)
            .withNewHeatLeaderAudio(noneAudio)
            .withPitInAudio(noneAudio)
            .withFuelAudio(noneAudio)
            .build();

    DriverModel proto = DriverConverter.toProto(driver, new HashSet<>());
    assertNotNull(proto);

    assertEquals("none", proto.getLapAudio().getType());
    assertEquals("", proto.getLapAudio().getUrl());

    assertEquals("none", proto.getBestLapAudio().getType());
    assertEquals("", proto.getBestLapAudio().getUrl());

    assertEquals("none", proto.getOverallBestLapAudio().getType());
    assertEquals("", proto.getOverallBestLapAudio().getUrl());

    assertEquals("none", proto.getHeatBestLapAudio().getType());
    assertEquals("", proto.getHeatBestLapAudio().getUrl());

    assertEquals("none", proto.getRaceBestLapAudio().getType());
    assertEquals("", proto.getRaceBestLapAudio().getUrl());
  }

  @Test
  public void testToProto_WithEmptyPresetUrl_FallsBackToDefaultPreset() {
    com.antigravity.models.AudioConfig emptyUrlPreset =
        new com.antigravity.models.AudioConfig("preset", "", null);
    Driver driver =
        new Driver.Builder()
            .withName("Preset Driver")
            .withLapAudio(emptyUrlPreset)
            .withBestLapAudio(emptyUrlPreset)
            .withOverallBestLapAudio(emptyUrlPreset)
            .withPitInAudio(emptyUrlPreset)
            .build();

    DriverModel proto = DriverConverter.toProto(driver, new HashSet<>());
    assertNotNull(proto);

    assertEquals("preset", proto.getLapAudio().getType());
    assertEquals("default_beep", proto.getLapAudio().getUrl());

    assertEquals("preset", proto.getBestLapAudio().getType());
    assertEquals("default_driveby", proto.getBestLapAudio().getUrl());

    assertEquals("preset", proto.getOverallBestLapAudio().getType());
    assertEquals("default_record_lap", proto.getOverallBestLapAudio().getUrl());

    assertEquals("preset", proto.getPitInAudio().getType());
    assertEquals("default_pit_in", proto.getPitInAudio().getUrl());
  }
}
