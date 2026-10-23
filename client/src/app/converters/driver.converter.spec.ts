import { Driver } from "@app/models/driver";
import { IDriverModel } from "@app/proto/antigravity";

import { DriverConverter } from "./driver.converter";

describe("DriverConverter", () => {
  beforeEach(() => {
    DriverConverter.clearCache();
  });

  it("should convert proto to Driver object", () => {
    const proto: IDriverModel = {
      model: { entityId: "d1" },
      name: "Alice",
      nickname: "Rocket",
      avatarUrl: "alice_avatar.png",
      lapAudio: { type: "preset", url: "lap_url", text: "lap_text" },
      bestLapAudio: { type: "tts", url: "best_url", text: "best_text" },
      penaltyAudio: {
        type: "preset",
        url: "penalty_url",
        text: "penalty_text",
      },
      overallBestLapAudio: { type: "preset", url: "overall_best_url" },
      overallLaneBestLapAudio: { type: "preset", url: "overall_lane_best_url" },
      raceBestLapAudio: { type: "preset", url: "race_best_url" },
      raceLaneBestLapAudio: { type: "preset", url: "race_lane_best_url" },
      heatBestLapAudio: { type: "preset", url: "heat_best_url" },
      newRaceLeaderAudio: { type: "preset", url: "new_race_leader_url" },
      newHeatLeaderAudio: { type: "preset", url: "new_heat_leader_url" },
      pitInAudio: { type: "preset", url: "pit_in_url" },
      fuelAudio: { type: "audio_set", url: "default_fuel_level" },
      driftLapAudio: { type: "tts", text: "drift_text" },
    };

    const driver = DriverConverter.fromProto(proto);
    expect(driver.entity_id).toBe("d1");
    expect(driver.name).toBe("Alice");
    expect(driver.nickname).toBe("Rocket");
    expect(driver.avatarUrl).toBe("alice_avatar.png");
    expect(driver.lapAudio?.url).toBe("lap_url");
    expect(driver.bestLapAudio?.type).toBe("tts");
    expect(driver.overallBestLapAudio?.url).toBe("overall_best_url");
    expect(driver.overallLaneBestLapAudio?.url).toBe("overall_lane_best_url");
    expect(driver.raceBestLapAudio?.url).toBe("race_best_url");
    expect(driver.raceLaneBestLapAudio?.url).toBe("race_lane_best_url");
    expect(driver.heatBestLapAudio?.url).toBe("heat_best_url");
    expect(driver.newRaceLeaderAudio?.url).toBe("new_race_leader_url");
    expect(driver.newHeatLeaderAudio?.url).toBe("new_heat_leader_url");
    expect(driver.pitInAudio?.url).toBe("pit_in_url");
    expect(driver.fuelAudio?.url).toBe("default_fuel_level");
    expect(driver.driftLapAudio?.type).toBe("tts");
    expect(driver.driftLapAudio?.text).toBe("drift_text");
  });

  it("should update cached driver in-place during fromProto", () => {
    const proto1: IDriverModel = {
      model: { entityId: "d1" },
      name: "Alice",
      avatarUrl: "alice_avatar.png",
    };

    const driver1 = DriverConverter.fromProto(proto1);
    expect(driver1.avatarUrl).toBe("alice_avatar.png");

    const proto2: IDriverModel = {
      model: { entityId: "d1" },
      name: "Alice Updated",
      avatarUrl: "alice_avatar_updated.png",
    };

    const driver2 = DriverConverter.fromProto(proto2);
    // Identity verification
    expect(driver2).toBe(driver1);
    expect(driver1.name).toBe("Alice Updated");
    expect(driver1.avatarUrl).toBe("alice_avatar_updated.png");
  });

  it("should update cached driver in-place during fromJSON", () => {
    const json1 = {
      entity_id: "d1",
      name: "Bob",
      avatarUrl: "bob_avatar.png",
    };

    const driver1 = DriverConverter.fromJSON(json1);
    expect(driver1.avatarUrl).toBe("bob_avatar.png");

    const json2 = {
      entity_id: "d1",
      name: "Bob Updated",
      avatarUrl: "bob_avatar_updated.png",
    };

    const driver2 = DriverConverter.fromJSON(json2);
    expect(driver2).toBe(driver1);
    expect(driver1.name).toBe("Bob Updated");
    expect(driver1.avatarUrl).toBe("bob_avatar_updated.png");
  });

  it("should update cached driver in-place during register", () => {
    const proto = {
      model: { entityId: "d1" },
      name: "Charlie",
      avatarUrl: "charlie_avatar.png",
    };

    const driverFromProto = DriverConverter.fromProto(proto);
    expect(driverFromProto.avatarUrl).toBe("charlie_avatar.png");

    const manualDriver = new Driver(
      "d1",
      "Charlie Updated",
      "",
      "charlie_avatar_updated.png",
    );

    DriverConverter.register(manualDriver);

    // Verify cache in-place update occurred on the original cached reference
    expect(driverFromProto.name).toBe("Charlie Updated");
    expect(driverFromProto.avatarUrl).toBe("charlie_avatar_updated.png");
  });

  it("should preserve type none for audio configs during fromProto", () => {
    const proto: IDriverModel = {
      model: { entityId: "d_none" },
      name: "Silent Driver",
      nickname: "Silent",
      lapAudio: { type: "none" },
      bestLapAudio: { type: "none" },
      penaltyAudio: { type: "none" },
      overallBestLapAudio: { type: "none" },
      overallLaneBestLapAudio: { type: "none" },
      raceBestLapAudio: { type: "none" },
      raceLaneBestLapAudio: { type: "none" },
      heatBestLapAudio: { type: "none" },
      pitInAudio: { type: "none" },
      fuelAudio: { type: "none" },
      driftLapAudio: { type: "none" },
    };

    const driver = DriverConverter.fromProto(proto);
    expect(driver.lapAudio.type).toBe("none");
    expect(driver.lapAudio.url).toBeUndefined();
    expect(driver.bestLapAudio.type).toBe("none");
    expect(driver.bestLapAudio.url).toBeUndefined();
    expect(driver.penaltyAudio.type).toBe("none");
    expect(driver.penaltyAudio.url).toBeUndefined();
    expect(driver.overallBestLapAudio.type).toBe("none");
    expect(driver.overallBestLapAudio.url).toBeUndefined();
    expect(driver.overallLaneBestLapAudio.type).toBe("none");
    expect(driver.overallLaneBestLapAudio.url).toBeUndefined();
    expect(driver.raceBestLapAudio.type).toBe("none");
    expect(driver.raceBestLapAudio.url).toBeUndefined();
    expect(driver.raceLaneBestLapAudio.type).toBe("none");
    expect(driver.raceLaneBestLapAudio.url).toBeUndefined();
    expect(driver.heatBestLapAudio.type).toBe("none");
    expect(driver.heatBestLapAudio.url).toBeUndefined();
    expect(driver.pitInAudio.type).toBe("none");
    expect(driver.pitInAudio.url).toBeUndefined();
    expect(driver.fuelAudio.type).toBe("none");
    expect(driver.fuelAudio.url).toBeUndefined();
    expect(driver.driftLapAudio.type).toBe("none");
    expect(driver.driftLapAudio.url).toBeUndefined();

    // In-place update
    const updateProto: IDriverModel = {
      model: { entityId: "d_none" },
      name: "Silent Driver Updated",
      lapAudio: { type: "none" },
      bestLapAudio: { type: "none" },
      penaltyAudio: { type: "none" },
      overallBestLapAudio: { type: "none" },
      overallLaneBestLapAudio: { type: "none" },
      raceBestLapAudio: { type: "none" },
      raceLaneBestLapAudio: { type: "none" },
      heatBestLapAudio: { type: "none" },
      pitInAudio: { type: "none" },
      fuelAudio: { type: "none" },
      driftLapAudio: { type: "none" },
    };
    const updatedDriver = DriverConverter.fromProto(updateProto);
    expect(updatedDriver.lapAudio.type).toBe("none");
    expect(updatedDriver.bestLapAudio.type).toBe("none");
    expect(updatedDriver.penaltyAudio.type).toBe("none");
    expect(updatedDriver.overallBestLapAudio.type).toBe("none");
    expect(updatedDriver.overallLaneBestLapAudio.type).toBe("none");
    expect(updatedDriver.raceBestLapAudio.type).toBe("none");
    expect(updatedDriver.raceLaneBestLapAudio.type).toBe("none");
    expect(updatedDriver.heatBestLapAudio.type).toBe("none");
    expect(updatedDriver.pitInAudio.type).toBe("none");
    expect(updatedDriver.fuelAudio.type).toBe("none");
    expect(updatedDriver.driftLapAudio.type).toBe("none");
  });

  it("should coerce fuelAudio preset type to audio_set in fromProto and fromJSON", () => {
    const proto: IDriverModel = {
      model: { entityId: "d_legacy_fuel" },
      name: "Legacy Fuel Driver",
      fuelAudio: { type: "preset", url: "default_fuel_level" },
    };

    const driverFromProto = DriverConverter.fromProto(proto);
    expect(driverFromProto.fuelAudio.type).toBe("audio_set");
    expect(driverFromProto.fuelAudio.url).toBe("default_fuel_level");

    DriverConverter.clearCache();

    const json = {
      entity_id: "d_legacy_json_fuel",
      name: "Legacy JSON Fuel Driver",
      fuelAudio: { type: "preset", url: "default_fuel_level" },
    };

    const driverFromJSON = DriverConverter.fromJSON(json);
    expect(driverFromJSON.fuelAudio.type).toBe("audio_set");
    expect(driverFromJSON.fuelAudio.url).toBe("default_fuel_level");
  });

  it("should preserve none audio configs in fromJSON without falling back to presets", () => {
    const json = {
      entity_id: "d_json_none",
      name: "Silent JSON Driver",
      nickname: "Silent",
      lapAudio: { type: "none" },
      bestLapAudio: { type: "none" },
      penaltyAudio: { type: "none" },
      overallBestLapAudio: { type: "none" },
      overallLaneBestLapAudio: { type: "none" },
      raceBestLapAudio: { type: "none" },
      raceLaneBestLapAudio: { type: "none" },
      heatBestLapAudio: { type: "none" },
      pitInAudio: { type: "none" },
      fuelAudio: { type: "none" },
      driftLapAudio: { type: "none" },
    };

    const driver = DriverConverter.fromJSON(json);
    expect(driver.lapAudio.type).toBe("none");
    expect(driver.lapAudio.url).toBeUndefined();
    expect(driver.bestLapAudio.type).toBe("none");
    expect(driver.bestLapAudio.url).toBeUndefined();
    expect(driver.penaltyAudio.type).toBe("none");
    expect(driver.penaltyAudio.url).toBeUndefined();
    expect(driver.overallBestLapAudio.type).toBe("none");
    expect(driver.overallLaneBestLapAudio.type).toBe("none");
    expect(driver.raceBestLapAudio.type).toBe("none");
    expect(driver.raceLaneBestLapAudio.type).toBe("none");
    expect(driver.heatBestLapAudio.type).toBe("none");
    expect(driver.pitInAudio.type).toBe("none");
    expect(driver.fuelAudio.type).toBe("none");
    expect(driver.driftLapAudio.type).toBe("none");
  });

  it("should synchronize all audio properties in register() into cached instances", () => {
    const original = DriverConverter.fromJSON({
      entity_id: "d_reg_test",
      name: "Reg Test",
      lapAudio: { type: "preset", url: "default_beep" },
      bestLapAudio: { type: "preset", url: "default_driveby" },
      pitInAudio: { type: "preset", url: "default_pit_in" },
      fuelAudio: { type: "audio_set", url: "default_fuel_level" },
    });

    const updated = new Driver({
      entity_id: "d_reg_test",
      name: "Reg Test Updated",
      lapAudio: { type: "none" },
      bestLapAudio: { type: "none" },
      penaltyAudio: { type: "none" },
      overallBestLapAudio: { type: "none" },
      overallLaneBestLapAudio: { type: "none" },
      raceBestLapAudio: { type: "none" },
      raceLaneBestLapAudio: { type: "none" },
      heatBestLapAudio: { type: "none" },
      newRaceLeaderAudio: { type: "none" },
      newHeatLeaderAudio: { type: "none" },
      pitInAudio: { type: "none" },
      fuelAudio: { type: "none" },
      driftLapAudio: { type: "none" },
    });

    DriverConverter.register(updated);

    expect(original.name).toBe("Reg Test Updated");
    expect(original.lapAudio.type).toBe("none");
    expect(original.bestLapAudio.type).toBe("none");
    expect(original.pitInAudio.type).toBe("none");
    expect(original.fuelAudio.type).toBe("none");
    expect(original.driftLapAudio.type).toBe("none");
  });

  it("should sanitize audio and supply default URLs on in-place cache updates in fromProto", () => {
    const proto1: IDriverModel = {
      model: { entityId: "d_cache_sanitize" },
      name: "Cache Sanitize Driver",
      lapAudio: { type: "preset", url: "default_beep" },
    };
    const driver = DriverConverter.fromProto(proto1);
    expect(driver.lapAudio.url).toBe("default_beep");

    // Proto update arrives with empty preset url
    const proto2: IDriverModel = {
      model: { entityId: "d_cache_sanitize" },
      name: "Cache Sanitize Driver",
      lapAudio: { type: "preset", url: "" },
      overallBestLapAudio: { type: "preset", url: "" },
    };
    DriverConverter.fromProto(proto2);
    expect(driver.lapAudio.url).toBe("default_beep");
    expect(driver.overallBestLapAudio.url).toBe("default_record_lap");
  });

  it("should sanitize audio and supply default URLs on in-place cache updates in fromJSON", () => {
    const json1 = {
      entity_id: "d_json_cache_sanitize",
      name: "JSON Cache Sanitize",
      lapAudio: { type: "preset", url: "default_beep" },
    };
    const driver = DriverConverter.fromJSON(json1);
    expect(driver.lapAudio.url).toBe("default_beep");

    // JSON update arrives with empty preset url
    const json2 = {
      entity_id: "d_json_cache_sanitize",
      name: "JSON Cache Sanitize",
      lapAudio: { type: "preset", url: "" },
      pitInAudio: { type: "preset", url: "   " },
    };
    DriverConverter.fromJSON(json2);
    expect(driver.lapAudio.url).toBe("default_beep");
    expect(driver.pitInAudio.url).toBe("default_pit_in");
  });

  it("should map label_ids from proto and update cache in-place", () => {
    const proto: IDriverModel = {
      model: { entityId: "d_proto_label" },
      name: "Label Driver",
      label_ids: ["lbl-1", "lbl-2"],
    } as any;

    const driver = DriverConverter.fromProto(proto);
    expect(driver.labelIds).toEqual(["lbl-1", "lbl-2"]);

    // Update in-place
    const proto2: IDriverModel = {
      model: { entityId: "d_proto_label" },
      name: "Label Driver Updated",
      label_ids: ["lbl-3"],
    } as any;
    DriverConverter.fromProto(proto2);
    expect(driver.labelIds).toEqual(["lbl-3"]);
  });

  it("should map labelIds from JSON and register updates", () => {
    const json = {
      entity_id: "d_json_label",
      name: "JSON Label Driver",
      labelIds: ["lbl-a", "lbl-b"],
    };
    const driver = DriverConverter.fromJSON(json);
    expect(driver.labelIds).toEqual(["lbl-a", "lbl-b"]);

    const updated = Driver.createDefault(
      "d_json_label",
      "JSON Label Driver",
      "",
      undefined,
      ["lbl-c"],
    );
    DriverConverter.register(updated);
    expect(driver.labelIds).toEqual(["lbl-c"]);
  });
});
