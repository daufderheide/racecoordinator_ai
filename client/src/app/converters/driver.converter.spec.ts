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
    };

    const driver = DriverConverter.fromProto(proto);
    expect(driver.entity_id).toBe("d1");
    expect(driver.name).toBe("Alice");
    expect(driver.nickname).toBe("Rocket");
    expect(driver.avatarUrl).toBe("alice_avatar.png");
    expect(driver.lapAudio?.url).toBe("lap_url");
    expect(driver.bestLapAudio?.type).toBe("tts");
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
    };

    const driver = DriverConverter.fromProto(proto);
    expect(driver.lapAudio.type).toBe("none");
    expect(driver.lapAudio.url).toBeUndefined();
    expect(driver.bestLapAudio.type).toBe("none");
    expect(driver.bestLapAudio.url).toBeUndefined();
    expect(driver.penaltyAudio.type).toBe("none");
    expect(driver.penaltyAudio.url).toBeUndefined();

    // In-place update
    const updateProto: IDriverModel = {
      model: { entityId: "d_none" },
      name: "Silent Driver Updated",
      lapAudio: { type: "none" },
      bestLapAudio: { type: "none" },
      penaltyAudio: { type: "none" },
    };
    const updatedDriver = DriverConverter.fromProto(updateProto);
    expect(updatedDriver.lapAudio.type).toBe("none");
    expect(updatedDriver.bestLapAudio.type).toBe("none");
    expect(updatedDriver.penaltyAudio.type).toBe("none");
  });
});
