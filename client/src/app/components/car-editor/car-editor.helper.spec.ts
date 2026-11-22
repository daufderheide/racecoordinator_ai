import { Car } from "@app/models/car";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import enJson from "../../../assets/i18n/en.json";
import { CarField } from "@app/models/car-field";

import {
  areCarsEqual,
  choiceOptions,
  cloneCar,
  generateUniqueCarName,
  getCarEditorHelpSteps,
  getCarUnsavedReasons,
  getKnownCarClasses,
  resolveCarImageUrl,
  setCustomValue,
  withoutField,
} from "./car-editor.helper";

function full(): Car {
  return new Car("c1", "Porsche", {
    avatarUrl: "p.png",
    brand: "Scalextric",
    carClass: "GT3",
    scale: "1/32",
    motor: "21.5k",
    magnet: "None",
    chassis: "Sidewinder",
    gears: "9/27",
    tyres: "Urethane",
    modified: true,
    notes: "Lowered",
    customValues: { f1: "82" },
  });
}

describe("car-editor.helper", () => {
  describe("cloneCar / areCarsEqual", () => {
    it("clones every field into a new object", () => {
      const a = full();
      const b = cloneCar(a);
      expect(b).not.toBe(a);
      expect(b).toEqual(a);
      expect(areCarsEqual(a, b)).toBeTrue();
    });

    const changes: [string, (c: Car) => void][] = [
      ["name", (c) => (c.name = "X")],
      ["picture", (c) => (c.avatarUrl = "other.png")],
      ["brand", (c) => (c.brand = "X")],
      ["class", (c) => (c.carClass = "X")],
      ["scale", (c) => (c.scale = "1/24")],
      ["motor", (c) => (c.motor = "X")],
      ["magnet", (c) => (c.magnet = "X")],
      ["chassis", (c) => (c.chassis = "X")],
      ["gears", (c) => (c.gears = "X")],
      ["tyres", (c) => (c.tyres = "X")],
      ["modified", (c) => (c.modified = false)],
      ["notes", (c) => (c.notes = "X")],
      ["a custom value", (c) => (c.customValues = { f1: "83" })],
      ["a new custom value", (c) => (c.customValues = { f1: "82", f2: "x" })],
      ["a removed custom value", (c) => (c.customValues = {})],
    ];
    for (const [what, change] of changes) {
      it(`sees a change in ${what}`, () => {
        const a = full();
        const b = cloneCar(a);
        change(b);
        expect(areCarsEqual(a, b)).toBeFalse();
      });
    }

    it("treats no picture and an empty picture as the same", () => {
      const a = new Car("c1", "A");
      const b = new Car("c1", "A");
      b.avatarUrl = "";
      expect(areCarsEqual(a, b)).toBeTrue();
    });
  });

  describe("custom values", () => {
    it("clones the values into a new object", () => {
      const a = full();
      const b = cloneCar(a);
      b.customValues["f1"] = "99";
      expect(a.customValues["f1"]).toBe("82");
    });

    it("sets, trims and removes values", () => {
      const car = new Car("c1", "A");
      setCustomValue(car, "f1", " 9/27 ");
      expect(car.customValues).toEqual({ f1: "9/27" });
      setCustomValue(car, "f2", 82);
      expect(car.customValues["f2"]).toBe("82");
      setCustomValue(car, "f1", "  ");
      setCustomValue(car, "f2", null);
      expect(car.customValues).toEqual({});
    });

    it("stores yes as text and no as nothing", () => {
      const car = new Car("c1", "A");
      setCustomValue(car, "f1", true);
      expect(car.customValues["f1"]).toBe("true");
      setCustomValue(car, "f1", false);
      expect("f1" in car.customValues).toBeFalse();
    });

    it("replaces the values object, so undo snapshots stay apart", () => {
      const car = new Car("c1", "A", { customValues: { f1: "1" } });
      const before = car.customValues;
      setCustomValue(car, "f1", "2");
      expect(before["f1"]).toBe("1");
    });

    it("offers a car's old choice that is no longer in the list", () => {
      const f = new CarField("f", "Compound", "choice", ["Soft", "Hard"]);
      expect(choiceOptions(f, "Soft")).toEqual(["Soft", "Hard"]);
      expect(choiceOptions(f, "")).toEqual(["Soft", "Hard"]);
      expect(choiceOptions(f, "Wet")).toEqual(["Soft", "Hard", "Wet"]);
    });

    it("drops the value of a deleted field from a copy", () => {
      const car = new Car("c1", "A", { customValues: { f1: "1", f2: "2" } });
      const copy = withoutField(car, "f1");
      expect(copy.customValues).toEqual({ f2: "2" });
      expect(car.customValues).toEqual({ f1: "1", f2: "2" });
      expect(withoutField(car, "zz").customValues).toEqual(car.customValues);
    });
  });

  describe("generateUniqueCarName", () => {
    const cars = [new Car("1", "New Slotcar"), new Car("2", "new slotcar_1")];

    it("keeps a free name", () => {
      expect(generateUniqueCarName("Porsche", cars)).toBe("Porsche");
    });

    it("adds the first free number when taken (ignoring case)", () => {
      expect(generateUniqueCarName("New Slotcar", cars)).toBe("New Slotcar_2");
    });

    it("always adds a number when forced, replacing an old one", () => {
      expect(generateUniqueCarName("Porsche_4", cars, true)).toBe("Porsche_1");
    });
  });

  describe("getKnownCarClasses", () => {
    it("lists each class once, first spelling wins, sorted", () => {
      const cars = [
        new Car("1", "A", { carClass: "GT3" }),
        new Car("2", "B", { carClass: " gt3 " }),
        new Car("3", "C", { carClass: "Classic" }),
        new Car("4", "D", { carClass: "" }),
        new Car("5", "E", { carClass: "Group 10" }),
        new Car("6", "F", { carClass: "Group 2" }),
      ];
      expect(getKnownCarClasses(cars)).toEqual([
        "Classic",
        "Group 2",
        "Group 10",
        "GT3",
      ]);
    });

    it("is empty without classes", () => {
      expect(getKnownCarClasses([])).toEqual([]);
    });
  });

  describe("resolveCarImageUrl", () => {
    it("falls back to the default picture", () => {
      expect(resolveCarImageUrl(undefined)).toBe(
        "assets/images/default_avatar.svg",
      );
    });

    it("prefixes server paths", () => {
      expect(
        resolveCarImageUrl("/assets/p.png", {
          serverUrl: "http://srv",
          resolveAssetUrl: (u) => u,
        }),
      ).toBe("http://srv/assets/p.png");
    });

    it("keeps full urls", () => {
      expect(resolveCarImageUrl("http://x/p.png")).toBe("http://x/p.png");
    });
  });

  describe("getCarUnsavedReasons", () => {
    const others = [new Car("1", "Porsche"), new Car("2", "Ferrari")];

    it("is empty without a car", () => {
      expect(getCarUnsavedReasons(undefined, others, false, true)).toEqual([]);
    });

    it("reports an empty name", () => {
      expect(
        getCarUnsavedReasons(new Car("3", "  "), others, false, false),
      ).toEqual(["DISCARD_REASON_CAR_NAME_EMPTY"]);
    });

    it("reports a name another car has", () => {
      expect(
        getCarUnsavedReasons(new Car("3", "porsche"), others, false, false),
      ).toEqual(["DISCARD_REASON_CAR_NAME_DUPLICATE"]);
    });

    it("reports saving", () => {
      expect(
        getCarUnsavedReasons(new Car("3", "GT40"), others, true, true),
      ).toEqual(["DISCARD_REASON_SAVING"]);
    });

    it("reports leaving too quickly with unsaved changes", () => {
      expect(
        getCarUnsavedReasons(new Car("3", "GT40"), others, false, true),
      ).toEqual(["DISCARD_REASON_EXIT_TOO_QUICKLY"]);
    });

    it("is empty when nothing is wrong", () => {
      expect(
        getCarUnsavedReasons(new Car("1", "Porsche"), others, false, false),
      ).toEqual([]);
    });
  });

  describe("getCarEditorHelpSteps", () => {
    beforeEach(() => {
      mockTranslationService.translate.and.callFake((k: string) => k);
    });

    it("has the six steps in order", () => {
      const steps = getCarEditorHelpSteps(mockTranslationService as any);
      expect(steps.length).toBe(6);
      expect(steps[0].title).toBe("CE_HELP_WELCOME_TITLE");
      expect(steps[0].position).toBe("center");
      expect(steps[1].selector).toBe("#editor-object-nav");
      expect(steps[3].selector).toBe("#car-profile-panel");
      expect(steps[4].selector).toBe("#car-setup-section");
      expect(steps[5].selector).toBe("#car-custom-section");
    });

    it("uses keys that exist in en.json", () => {
      const en = enJson as Record<string, string>;
      const steps = getCarEditorHelpSteps(mockTranslationService as any);
      for (const step of steps) {
        if (step.title.startsWith("CE_")) {
          expect(en[step.title]).withContext(step.title).toBeTruthy();
          expect(en[step.content]).withContext(step.content).toBeTruthy();
        }
      }
    });

    it("links the welcome step to the Slotcar Editor article", () => {
      const en = enJson as Record<string, string>;
      expect(en["CE_HELP_WELCOME_CONTENT"]).toContain(
        'class="help-link help-article-car-editor"',
      );
    });
  });
});
