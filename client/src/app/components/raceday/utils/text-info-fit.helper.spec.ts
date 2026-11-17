import { AbsoluteWidgetNode } from "@app/models/settings";

import { TextInfoFitHelper } from "./text-info-fit.helper";

describe("TextInfoFitHelper", () => {
  let panelEl: HTMLElement;
  let labelEl: HTMLElement;
  let valueEl: HTMLElement;

  beforeEach(() => {
    panelEl = document.createElement("div");
    panelEl.style.width = "300px";
    panelEl.style.height = "50px";

    labelEl = document.createElement("span");
    labelEl.className = "label-text";
    labelEl.textContent = "LABEL";

    valueEl = document.createElement("span");
    valueEl.className = "value-text";
    valueEl.textContent = "VALUE";

    panelEl.appendChild(labelEl);
    panelEl.appendChild(valueEl);
    document.body.appendChild(panelEl);
  });

  afterEach(() => {
    panelEl.remove();
  });

  it("should do nothing if panelEl is null or undefined", () => {
    expect(() => TextInfoFitHelper.fitText(null, null)).not.toThrow();
    expect(() => TextInfoFitHelper.fitText(undefined, null)).not.toThrow();
  });

  it("should apply custom font sizes when both are provided", () => {
    const widget: AbsoluteWidgetNode = {
      id: "w1",
      widgetType: "race-name",
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      zIndex: 1,
      scaleMode: "auto",
      customSettings: {
        labelFontSize: 22,
        valueFontSize: 28,
      },
    };

    TextInfoFitHelper.fitText(panelEl, widget);

    expect(panelEl.style.getPropertyValue("--header-label-font-size")).toBe(
      "22px",
    );
    expect(panelEl.style.getPropertyValue("--header-value-font-size")).toBe(
      "28px",
    );
  });

  it("should calculate proportional value size when only labelFontSize is provided", () => {
    const widget: AbsoluteWidgetNode = {
      id: "w1",
      widgetType: "track-name",
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      zIndex: 1,
      scaleMode: "auto",
      customSettings: {
        labelFontSize: 20,
      },
    };

    TextInfoFitHelper.fitText(panelEl, widget);

    const expectedValue = Math.floor(20 / (55 / 80));
    expect(panelEl.style.getPropertyValue("--header-label-font-size")).toBe(
      "20px",
    );
    expect(panelEl.style.getPropertyValue("--header-value-font-size")).toBe(
      `${expectedValue}px`,
    );
  });

  it("should calculate proportional label size when only valueFontSize is provided", () => {
    const widget: AbsoluteWidgetNode = {
      id: "w1",
      widgetType: "event-name",
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      zIndex: 1,
      scaleMode: "auto",
      customSettings: {
        valueFontSize: 30,
      },
    };

    TextInfoFitHelper.fitText(panelEl, widget);

    const expectedLabel = Math.floor(30 * (55 / 80));
    expect(panelEl.style.getPropertyValue("--header-label-font-size")).toBe(
      `${expectedLabel}px`,
    );
    expect(panelEl.style.getPropertyValue("--header-value-font-size")).toBe(
      "30px",
    );
  });

  it("should remove properties when scaleMode is fixed and no custom font sizes are given", () => {
    panelEl.style.setProperty("--header-label-font-size", "15px");
    panelEl.style.setProperty("--header-value-font-size", "20px");

    const widget: AbsoluteWidgetNode = {
      id: "w1",
      widgetType: "season-name",
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      zIndex: 1,
      scaleMode: "fixed",
    };

    TextInfoFitHelper.fitText(panelEl, widget);

    expect(panelEl.style.getPropertyValue("--header-label-font-size")).toBe("");
    expect(panelEl.style.getPropertyValue("--header-value-font-size")).toBe("");
  });

  it("should compute auto-fit font sizes when scaleMode is auto and no custom font sizes are given", () => {
    Object.defineProperty(panelEl, "clientWidth", {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(panelEl, "clientHeight", {
      value: 50,
      configurable: true,
    });

    const widget: AbsoluteWidgetNode = {
      id: "w1",
      widgetType: "heat-info",
      x: 0,
      y: 0,
      width: 300,
      height: 50,
      zIndex: 1,
      scaleMode: "auto",
    };

    TextInfoFitHelper.fitText(panelEl, widget);

    const labelSize = panelEl.style.getPropertyValue(
      "--header-label-font-size",
    );
    const valueSize = panelEl.style.getPropertyValue(
      "--header-value-font-size",
    );

    expect(labelSize).toMatch(/^\d+px$/);
    expect(valueSize).toMatch(/^\d+px$/);
    expect(parseInt(labelSize, 10)).toBeGreaterThan(0);
    expect(parseInt(valueSize, 10)).toBeGreaterThan(0);
  });

  it("should respect options.labelEls and options.valueEls if explicitly passed", () => {
    const customLabel = document.createElement("span");
    customLabel.textContent = "CUSTOM";
    const customValue = document.createElement("span");
    customValue.textContent = "VAL";

    const widget: AbsoluteWidgetNode = {
      id: "w1",
      widgetType: "race-name",
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      zIndex: 1,
      scaleMode: "auto",
    };

    TextInfoFitHelper.fitText(panelEl, widget, {
      labelEls: [customLabel],
      valueEls: [customValue],
      labelRatio: 0.5,
    });

    expect(
      panelEl.style.getPropertyValue("--header-label-font-size"),
    ).toBeDefined();
    expect(
      panelEl.style.getPropertyValue("--header-value-font-size"),
    ).toBeDefined();
  });
});
