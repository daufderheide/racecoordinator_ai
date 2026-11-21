import { LaneColumnFitHelper } from "./raceday-lane-column-fit.helper";

describe("LaneColumnFitHelper.fitHeaderOnly", () => {
  let card: HTMLElement;
  let header: HTMLElement;

  beforeEach(() => {
    card = document.createElement("div");
    card.style.width = "400px";
    card.style.height = "200px";
    header = document.createElement("div");
    header.className = "lane-col-header";
    header.textContent = "PACING";
    card.appendChild(header);
    document.body.appendChild(card);
  });

  afterEach(() => card.remove());

  const ctx = (overrides: any = {}) => ({
    isHeaderWidget: false,
    cachedWidth: 400,
    cachedHeight: 200,
    settings: { headerFontSize: 12, showHeader: true } as any,
    widget: { scaleMode: "auto" } as any,
    headerLabel: "PACING",
    ...overrides,
  });

  it("applies the header font size, and a changed size on the next call", () => {
    const helper = new LaneColumnFitHelper();

    helper.fitHeaderOnly(card, ctx());
    const small = parseFloat(header.style.fontSize);
    expect(small).toBeGreaterThan(0);

    helper.fitHeaderOnly(
      card,
      ctx({ settings: { headerFontSize: 40, showHeader: true } }),
    );
    const large = parseFloat(header.style.fontSize);
    expect(large).toBeGreaterThan(small);
  });

  it("does not touch the header when nothing changed", () => {
    const helper = new LaneColumnFitHelper();
    helper.fitHeaderOnly(card, ctx());
    header.style.fontSize = "3px"; // would be overwritten by a re-fit
    helper.fitHeaderOnly(card, ctx());
    expect(header.style.fontSize).toBe("3px");
  });

  it("does nothing for header widgets, hidden headers or a missing card", () => {
    const helper = new LaneColumnFitHelper();
    helper.fitHeaderOnly(undefined, ctx());
    helper.fitHeaderOnly(card, ctx({ isHeaderWidget: true }));
    helper.fitHeaderOnly(
      card,
      ctx({ settings: { headerFontSize: 40, showHeader: false } }),
    );
    expect(header.style.fontSize).toBe("");
  });
});
