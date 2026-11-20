import { shadowFor, withOpacity } from "./widget-style.utils";

describe("widget-style.utils", () => {
  describe("withOpacity", () => {
    it("leaves the colour alone at 100, without a setting or with nonsense", () => {
      expect(withOpacity("#c81e1e", 100)).toBe("#c81e1e");
      expect(withOpacity("#c81e1e", undefined)).toBe("#c81e1e");
      expect(withOpacity("#c81e1e", "")).toBe("#c81e1e");
      expect(withOpacity("#c81e1e", "abc")).toBe("#c81e1e");
    });

    it("turns hex colours into rgba with the opacity", () => {
      expect(withOpacity("#c81e1e", 50)).toBe("rgba(200, 30, 30, 0.5)");
      expect(withOpacity("#fff", 25)).toBe("rgba(255, 255, 255, 0.25)");
      // an alpha already in the colour is multiplied
      expect(withOpacity("#00000080", 50)).toBe("rgba(0, 0, 0, 0.251)");
    });

    it("multiplies the alpha of rgb / rgba colours", () => {
      expect(withOpacity("rgba(15, 23, 42, 0.85)", 50)).toBe(
        "rgba(15, 23, 42, 0.425)",
      );
      expect(withOpacity("rgb(1, 2, 3)", 0)).toBe("rgba(1, 2, 3, 0)");
    });

    it("keeps colours it can't change, and nothing stays nothing", () => {
      expect(withOpacity("red", 50)).toBe("red");
      expect(withOpacity("", 50)).toBeNull();
      expect(withOpacity(null, 50)).toBeNull();
    });
  });

  describe("shadowFor", () => {
    it("gives CSS for soft and raised, nothing otherwise", () => {
      expect(shadowFor("soft")).toContain("rgba(0, 0, 0, 0.45)");
      expect(shadowFor("raised")).toContain("0 7px 0");
      expect(shadowFor("none")).toBeNull();
      expect(shadowFor(undefined)).toBeNull();
      expect(shadowFor("glow")).toBeNull();
    });
  });
});
