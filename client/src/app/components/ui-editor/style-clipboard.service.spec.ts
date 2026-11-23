import { TestBed } from "@angular/core/testing";

import { StyleClipboardService } from "./style-clipboard.service";

describe("StyleClipboardService (phase 5a)", () => {
  afterEach(() =>
    sessionStorage.removeItem("rcai.layoutEditor.styleClipboard"),
  );

  it("keeps the copy for the session and survives a reload", () => {
    const svc = TestBed.inject(StyleClipboardService);
    const copy = { widgetType: "timer", values: { shadow: "soft" }, main: {} };
    svc.set(copy);
    expect(svc.copied()).toEqual(copy);
    expect(
      JSON.parse(sessionStorage.getItem("rcai.layoutEditor.styleClipboard")!),
    ).toEqual(copy);
    svc.set(null);
    expect(
      sessionStorage.getItem("rcai.layoutEditor.styleClipboard"),
    ).toBeNull();
  });
});
