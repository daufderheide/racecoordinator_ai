import {
  applyValueWrapStyles,
  computeBestWrapTextFontSize,
  computeSingleLineTextScale,
  isNameOrTeamProperty,
  isNumericalOrTimeText,
} from "./raceday-lane-column-text-wrap.helper";

describe("raceday-lane-column-text-wrap.helper", () => {
  describe("isNameOrTeamProperty", () => {
    it("should return true for driver names, nicknames, and team names", () => {
      expect(isNameOrTeamProperty("driver.name")).toBeTrue();
      expect(isNameOrTeamProperty("driver.name_0")).toBeTrue();
      expect(isNameOrTeamProperty("driver.nickname")).toBeTrue();
      expect(isNameOrTeamProperty("driver.nickname_1")).toBeTrue();
      expect(isNameOrTeamProperty("participant.team.name")).toBeTrue();
      expect(isNameOrTeamProperty("team.name")).toBeTrue();
      expect(isNameOrTeamProperty("team")).toBeTrue();
      expect(isNameOrTeamProperty("name")).toBeTrue();
      expect(isNameOrTeamProperty("nickname")).toBeTrue();
    });

    it("should return false for numbers, lap counts, lap times, gaps, and rankings", () => {
      expect(isNameOrTeamProperty("lapCount")).toBeFalse();
      expect(isNameOrTeamProperty("physicalLapCount")).toBeFalse();
      expect(isNameOrTeamProperty("lastLapTime")).toBeFalse();
      expect(isNameOrTeamProperty("bestLapTime")).toBeFalse();
      expect(isNameOrTeamProperty("avgLapTime")).toBeFalse();
      expect(isNameOrTeamProperty("medianLapTime")).toBeFalse();
      expect(isNameOrTeamProperty("gapToLeader")).toBeFalse();
      expect(isNameOrTeamProperty("gapToPosition")).toBeFalse();
      expect(isNameOrTeamProperty("position")).toBeFalse();
      expect(isNameOrTeamProperty("overallPosition")).toBeFalse();
      expect(isNameOrTeamProperty("seed")).toBeFalse();
      expect(isNameOrTeamProperty("fuel")).toBeFalse();
      expect(isNameOrTeamProperty(undefined)).toBeFalse();
      expect(isNameOrTeamProperty("")).toBeFalse();
    });
  });

  describe("isNumericalOrTimeText", () => {
    it("should detect numbers, times, gaps, and racing status placeholders", () => {
      expect(isNumericalOrTimeText("12.345")).toBeTrue();
      expect(isNumericalOrTimeText("+0.123")).toBeTrue();
      expect(isNumericalOrTimeText("-1.500")).toBeTrue();
      expect(isNumericalOrTimeText("150")).toBeTrue();
      expect(isNumericalOrTimeText("1:23.456")).toBeTrue();
      expect(isNumericalOrTimeText("--.---")).toBeTrue();
      expect(isNumericalOrTimeText("DNS")).toBeTrue();
      expect(isNumericalOrTimeText("DNF")).toBeTrue();
      expect(isNumericalOrTimeText("DQ")).toBeTrue();
    });

    it("should return false for driver and team names", () => {
      expect(isNumericalOrTimeText("Bad Cheese")).toBeFalse();
      expect(isNumericalOrTimeText("Uncle Jon")).toBeFalse();
      expect(isNumericalOrTimeText("Alexander Hamilton")).toBeFalse();
      expect(isNumericalOrTimeText("Red Bull Racing")).toBeFalse();
      expect(isNumericalOrTimeText("")).toBeFalse();
    });
  });

  describe("computeBestWrapTextFontSize", () => {
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      const canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d")!;
    });

    it("should return larger font size when wrapping multi-word text than single line", () => {
      const words = ["Really", "Long", "Driver", "Name"];
      const baseFontSize = 36;
      const singleLineSize = 12;
      const availWidth = 100;
      const availHeight = 60;

      const wrapSize = computeBestWrapTextFontSize(
        ctx,
        words,
        baseFontSize,
        singleLineSize,
        availWidth,
        availHeight,
        "sans-serif",
      );

      expect(wrapSize).toBeGreaterThan(singleLineSize);
    });

    it("should return 0 when available height cannot accommodate at least 2 lines", () => {
      const words = ["Two", "Words"];
      const wrapSize = computeBestWrapTextFontSize(
        ctx,
        words,
        36,
        15,
        100,
        15,
        "sans-serif",
      );
      expect(wrapSize).toBe(0);
    });
  });

  describe("computeSingleLineTextScale", () => {
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      const canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d")!;
    });

    it("should scale down font size when text overflows width", () => {
      const size = computeSingleLineTextScale(
        ctx,
        "Very Long Single Line Text That Exceeds Width",
        40,
        80,
        50,
        "sans-serif",
        10,
      );
      expect(size).toBeLessThan(40);
      expect(size).toBeGreaterThanOrEqual(10);
    });
  });

  describe("applyValueWrapStyles", () => {
    let cardEl: HTMLElement;
    let valueEl: HTMLElement;
    let textEl: HTMLElement;

    beforeEach(() => {
      cardEl = document.createElement("div");
      valueEl = document.createElement("div");
      valueEl.className = "lane-col-value";
      textEl = document.createElement("span");
      textEl.className = "lane-col-text";
      valueEl.appendChild(textEl);
      cardEl.appendChild(valueEl);
    });

    it("should apply normal white-space and break-word when isWrapped is true", () => {
      applyValueWrapStyles(cardEl, true, true);
      expect(textEl.style.whiteSpace).toBe("normal");
      expect(textEl.style.wordBreak).toBe("break-word");
      expect(valueEl.style.whiteSpace).toBe("normal");
    });

    it("should enforce nowrap when allowWrap is false", () => {
      applyValueWrapStyles(cardEl, false, false);
      expect(textEl.style.whiteSpace).toBe("nowrap");
      expect(valueEl.style.whiteSpace).toBe("nowrap");
    });
  });
});
