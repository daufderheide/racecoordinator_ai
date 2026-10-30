import { fitLaneColumnHeaderText } from "./raceday-lane-column-header-fit.helper";

describe("raceday-lane-column-header-fit.helper", () => {
  it("should gracefully do nothing if header element is missing", () => {
    const cardEl = document.createElement("div");
    expect(() =>
      fitLaneColumnHeaderText(cardEl, {} as any, null, "TEST"),
    ).not.toThrow();
  });

  it("should respect fixed scaleMode and use explicit headerFontSize", () => {
    const cardEl = document.createElement("div");
    const headerEl = document.createElement("div");
    headerEl.className = "lane-col-header";
    cardEl.appendChild(headerEl);

    fitLaneColumnHeaderText(
      cardEl,
      { headerFontSize: 16 } as any,
      { scaleMode: "fixed" } as any,
      "Fixed Header",
      200,
      40,
    );

    expect(headerEl.style.fontSize).toBe("16px");
  });

  it("should wrap multi-line header text when wrapping allows a larger font size without overflowing", () => {
    const cardEl = document.createElement("div");
    cardEl.className = "header-widget-card";
    const headerEl = document.createElement("div");
    headerEl.className = "lane-col-header header-widget-only";
    cardEl.appendChild(headerEl);

    fitLaneColumnHeaderText(
      cardEl,
      { isHeaderWidget: true } as any,
      { scaleMode: "auto" } as any,
      "Super Long Nickname Name Should Fit",
      120,
      40,
    );

    expect(headerEl.style.whiteSpace).toBe("normal");
    expect(headerEl.style.wordBreak).toBe("break-word");
    const parsedSize = parseInt(headerEl.style.fontSize, 10);
    expect(parsedSize).toBeGreaterThanOrEqual(7);
  });

  it("should scale down single line text when text has no spaces", () => {
    const cardEl = document.createElement("div");
    cardEl.className = "header-widget-card";
    const headerEl = document.createElement("div");
    headerEl.className = "lane-col-header header-widget-only";
    cardEl.appendChild(headerEl);

    fitLaneColumnHeaderText(
      cardEl,
      { isHeaderWidget: true } as any,
      { scaleMode: "auto" } as any,
      "OVERALL_POSITION_NO_SPACE",
      80,
      36,
    );

    expect(headerEl.style.whiteSpace).toBe("nowrap");
    const parsedSize = parseInt(headerEl.style.fontSize, 10);
    expect(parsedSize).toBeLessThanOrEqual(14);
    expect(parsedSize).toBeGreaterThanOrEqual(7);
  });
});
