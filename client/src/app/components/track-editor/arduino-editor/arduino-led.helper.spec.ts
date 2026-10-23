import { Lane } from "@app/models/lane";
import { RgbLedBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import {
  buildColorOrders,
  buildLedBehaviors,
  buildLedTypes,
  getLedActionLabel,
  getLedBaseTranslationKey,
  getRgbLedColorHex,
  getRgbLedColorShadow,
} from "./arduino-led.helper";

describe("arduino-led.helper", () => {
  let translationService: TranslationService;

  beforeEach(() => {
    translationService =
      new TranslationServiceMock() as unknown as TranslationService;
  });

  const lanes: Lane[] = [
    { entity_id: "1", length: 10, background_color: "#ff0000" } as Lane,
    { entity_id: "2", length: 10, background_color: "#0000ff" } as Lane,
  ];

  it("buildLedBehaviors builds global groups and per-lane actions", () => {
    const behaviors = buildLedBehaviors(lanes, translationService);
    expect(behaviors.length).toBeGreaterThan(0);
    const leaderGroup = behaviors.find((b) => b.key === "AE_LED_GROUP_LEADER");
    expect(leaderGroup).toBeDefined();

    const fuelGroup = behaviors.find((b) => b.key === "AE_LED_GROUP_FUEL");
    expect(fuelGroup).toBeDefined();
    expect(
      fuelGroup?.actions.some(
        (a) =>
          a.value ===
          RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE.toString(),
      ),
    ).toBeTrue();
  });

  it("buildLedTypes returns appropriate choices for Uno vs Mega", () => {
    const unoTypes = buildLedTypes(translationService, 0);
    expect(unoTypes.length).toBe(3);
    expect(unoTypes.some((t) => t.value === "1")).toBeTrue();

    const megaTypes = buildLedTypes(translationService, 1);
    expect(megaTypes.length).toBe(6);
  });

  it("buildColorOrders returns color order list", () => {
    const orders = buildColorOrders(translationService);
    expect(orders.length).toBe(6);
    expect(orders[0].value).toBe("0");
  });

  it("getLedActionLabel resolves label across groups", () => {
    const behaviors = buildLedBehaviors(lanes, translationService);
    const label = getLedActionLabel(1, behaviors, translationService);
    expect(label).toBeTruthy();
    expect(
      getLedActionLabel(99999, behaviors, translationService),
    ).toBeTruthy();
  });

  it("getRgbLedColorHex and getRgbLedColorShadow return styles or undefined", () => {
    expect(getRgbLedColorHex("red")).toBe("#ef4444");
    expect(getRgbLedColorHex("green")).toBe("#22c55e");
    expect(getRgbLedColorHex("blue")).toBe("#3b82f6");
    expect(getRgbLedColorHex("off")).toBeUndefined();

    expect(getRgbLedColorShadow("red")).toContain("rgba(239, 68, 68");
    expect(getRgbLedColorShadow("off")).toBeUndefined();
  });

  it("getLedBaseTranslationKey maps action prefixes to keys", () => {
    expect(getLedBaseTranslationKey("RGB_LED_BEHAVIOR_HEAT_LEADER_BASE")).toBe(
      "AE_LED_BEHAVIOR_HEAT_LEADER_LANE",
    );
    expect(getLedBaseTranslationKey("RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE")).toBe(
      "AE_LED_BEHAVIOR_FUEL_LEVEL_LANE",
    );
    expect(getLedBaseTranslationKey("custom_action")).toBe("custom_action");
  });
});
