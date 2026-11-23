import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FontService } from "@app/services/font.service";

import {
  GeometryChange,
  InspectorFormComponent,
  resetInspectorFormMemory,
} from "./inspector-form.component";
import { InspectorField, InspectorSchema } from "./inspector-schema";

describe("InspectorFormComponent", () => {
  let fixture: ComponentFixture<InspectorFormComponent>;
  let component: InspectorFormComponent;
  let settings: Record<string, any>;
  let widget: any;
  let changes: number;
  let geometry: GeometryChange[];
  let resets: string[];

  // "records" has registry defaults, which the form uses for changed/reset.
  const schema: InspectorSchema = {
    widgetType: "records",
    icon: "emoji_events",
    folders: [
      {
        id: "frame",
        groups: [
          {
            titleKey: "G_FILL",
            fields: [
              {
                id: "backgroundColor",
                type: "color",
                key: "backgroundColor",
                labelKey: "BG_LABEL",
              },
            ],
          },
          {
            titleKey: "G_BORDER",
            fields: [
              {
                id: "showBorder",
                type: "switch",
                key: "showBorder",
                labelKey: "SHOW_BORDER",
              },
              {
                id: "borderWidth",
                type: "stepper",
                key: "borderWidth",
                labelKey: "BORDER_WIDTH",
                min: 0,
                max: 10,
                visibleWhen: (s) => s["showBorder"] !== false,
              },
            ],
          },
        ],
      },
      {
        id: "content",
        groups: [
          {
            fields: [
              {
                id: "showHeatBest",
                type: "switch",
                key: "showHeatBest",
                labelKey: "HEAT_BEST",
                searchTerms: "visible heat",
              },
              {
                id: "mode",
                type: "segment",
                key: "testMode",
                labelKey: "MODE",
                default: "a",
                options: [
                  { value: "a", label: "A" },
                  { value: "b", label: "B" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "text",
        groups: [
          {
            fields: [
              {
                id: "header",
                type: "textPart",
                labelKey: "PART_HEADER",
                sample: "Sample",
                keys: {
                  font: "headerFontFamily",
                  size: "headerFontSize",
                  color: "headerTextColor",
                },
              },
            ],
          },
        ],
      },
      {
        id: "layout",
        groups: [
          {
            fields: [
              {
                id: "position",
                type: "geometry",
                pair: "position",
                labelKey: "POS",
              },
              { id: "size", type: "geometry", pair: "size", labelKey: "SIZE" },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    resetInspectorFormMemory();
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Inter", "Orbitron"],
    });
    await TestBed.configureTestingModule({
      imports: [InspectorFormComponent],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    settings = {
      showHeatBest: true,
      headerFontFamily: "",
      headerFontSize: 17,
      headerTextColor: "",
      backgroundColor: "",
      showBorder: true,
      borderWidth: 1,
      borderRadius: 6,
    };
    widget = {
      id: "w1",
      widgetType: "records",
      x: 100,
      y: 50,
      width: 400,
      height: 200,
      customSettings: settings,
    };
    changes = 0;
    geometry = [];
    resets = [];

    fixture = TestBed.createComponent(InspectorFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("schema", schema);
    fixture.componentRef.setInput("settings", settings);
    fixture.componentRef.setInput("widget", widget);
    component.settingsChange.subscribe(() => changes++);
    component.geometryChange.subscribe((g) => geometry.push(g));
    component.reset.subscribe((r) => resets.push(r.labelKey));
    fixture.detectChanges();
  });

  const el = (): HTMLElement => fixture.nativeElement;
  const q = (sel: string) => el().querySelector(sel) as HTMLElement | null;
  const qa = (sel: string) =>
    Array.from(el().querySelectorAll(sel)) as HTMLElement[];
  const render = () => fixture.detectChanges();

  it("shows folders in the fixed order, whatever the schema order", () => {
    expect(qa(".kit-folder").map((f) => f.dataset["folder"])).toEqual([
      "content",
      "text",
      "frame",
      "layout",
    ]);
  });

  it("opens Content by default and shows a summary on closed folders", () => {
    expect(q('[data-folder="content"]')!.classList).toContain("open");
    expect(q('[data-folder="frame"]')!.classList).not.toContain("open");
    expect(
      q('[data-folder="frame"] .kit-folder-summary')!.textContent,
    ).toContain("1px");
    expect(
      q('[data-folder="layout"] .kit-folder-summary')!.textContent!.trim(),
    ).toBe("100, 50 · 400 × 200");
  });

  it('selects an option stored as text by an older inspector ("2" = 2)', () => {
    const f: InspectorField = {
      id: "dec",
      type: "segment",
      key: "decimalPlaces",
      labelKey: "UE_INSPECTOR_DECIMAL_PLACES",
      options: [
        { value: 2, label: "2" },
        { value: 3, label: "3" },
      ],
    };
    settings["decimalPlaces"] = "2";
    expect(component.isOption(f, f.options[0])).toBeTrue();
    expect(component.isOption(f, f.options[1])).toBeFalse();
  });

  it("stores a worked-out field through its write function", () => {
    const f: InspectorField = {
      id: "lane",
      type: "stepper",
      key: "targetIndex",
      labelKey: "UE_INSPECTOR_TARGET_LANE",
      min: 1,
      max: 8,
      maxFrom: (c) => c.totalLanes,
      read: (s) => Number(s["targetIndex"] ?? 0) + 1,
      write: (s, v) => (s["targetIndex"] = Number(v) - 1),
    };
    fixture.componentRef.setInput("totalLanes", 6);
    component.setField(f, 3);
    expect(settings["targetIndex"]).toBe(2);
    expect(component.value(f)).toBe(3);
    expect(component.maxFor(f)).toBe(6);
    expect(changes).toBe(1);
  });

  it("rounds a scaled position in the Layout summary", () => {
    fixture.componentRef.setInput("widget", {
      ...fixture.componentInstance.widget(),
      y: 741.7358609997833,
    });
    fixture.detectChanges();
    expect(
      q('[data-folder="layout"] .kit-folder-summary')!.textContent!.trim(),
    ).toBe("100, 742 · 400 × 200");
  });

  it("opens and closes a folder and remembers it for the widget type", () => {
    q("#kit-folder-frame")!.click();
    render();
    expect(q('[data-folder="frame"]')!.classList).toContain("open");
    expect(q('[data-field="backgroundColor"]')).not.toBeNull();
    q("#kit-folder-frame")!.click();
    render();
    expect(q('[data-field="backgroundColor"]')).toBeNull();
  });

  it("writes a switch into the settings and emits change", () => {
    q("#kit-showHeatBest")!.click();
    render();
    expect(settings["showHeatBest"]).toBeFalse();
    expect(changes).toBe(1);
    expect(q('[data-field="showHeatBest"] .kit-dot')).not.toBeNull();
    expect(q('[data-folder="content"] .kit-badge')!.textContent!.trim()).toBe(
      "1",
    );
  });

  it("resets one setting to its registry default", () => {
    settings["showHeatBest"] = false;
    render();
    (
      q('[data-field="showHeatBest"] [data-reset]') as HTMLButtonElement
    ).click();
    render();
    expect(settings["showHeatBest"]).toBeTrue();
    expect(resets).toEqual(["HEAT_BEST"]);
    expect(q('[data-field="showHeatBest"] .kit-dot')).toBeNull();
  });

  it("uses the field's own default when the registry has none", () => {
    expect(component.value(schema.folders[1].groups[0].fields[1])).toBe("a");
    expect(q('[data-field="mode"] .kit-dot')).toBeNull();
    qa('[data-field="mode"] .kit-seg button')[1].click();
    render();
    expect(settings["testMode"]).toBe("b");
    expect(q('[data-field="mode"] .kit-dot')).not.toBeNull();
  });

  it("resets a whole folder", () => {
    settings["showHeatBest"] = false;
    settings["testMode"] = "b";
    render();
    (q('[data-folder-reset="content"]') as HTMLButtonElement).click();
    render();
    expect(settings["showHeatBest"]).toBeTrue();
    expect(settings["testMode"]).toBe("a");
    expect(resets).toEqual(["UE_KIT_FOLDER_CONTENT"]);
  });

  it("hides a field until its condition is met", () => {
    q("#kit-folder-frame")!.click();
    render();
    expect(q('[data-field="borderWidth"]')).not.toBeNull();
    settings["showBorder"] = false;
    render();
    expect(q('[data-field="borderWidth"]')).toBeNull();
  });

  it("filters on search, opens matching folders and highlights the match", () => {
    fixture.componentRef.setInput("query", "border");
    render();
    expect(qa(".kit-folder").map((f) => f.dataset["folder"])).toEqual([
      "frame",
    ]);
    expect(q('[data-folder="frame"]')!.classList).toContain("open");
    expect(q('[data-field="showBorder"]')!.classList).toContain("hit");
    expect(q('[data-field="showBorder"] mark')!.textContent).toBe("BORDER");
    expect(component.hasResults()).toBeTrue();
    fixture.componentRef.setInput("query", "nothing-like-this");
    render();
    expect(component.hasResults()).toBeFalse();
  });

  it("finds a field through its extra search words", () => {
    fixture.componentRef.setInput("query", "visible");
    render();
    expect(q('[data-field="showHeatBest"]')).not.toBeNull();
  });

  it("shows only changed settings when asked", () => {
    settings["borderWidth"] = 3;
    fixture.componentRef.setInput("onlyChanged", true);
    render();
    expect(qa("[data-field]").map((f) => f.dataset["field"])).toEqual([
      "borderWidth",
    ]);
  });

  it("opens a text part, shows its summary and writes its keys", () => {
    q("#kit-folder-text")!.click();
    render();
    expect(q('[data-field="header"] .kit-part-meta')!.textContent).toContain(
      "17px",
    );
    (q('[data-field="header"] .kit-part-head') as HTMLButtonElement).click();
    render();
    const font = q("#kit-header-font") as HTMLSelectElement;
    font.value = "Orbitron";
    font.dispatchEvent(new Event("change"));
    render();
    expect(settings["headerFontFamily"]).toBe("Orbitron");
    expect(q('[data-field="header"] .kit-dot')).not.toBeNull();
    (q('[data-field="header"] [data-reset]') as HTMLButtonElement).click();
    render();
    expect(settings["headerFontFamily"]).toBe("");
  });

  it("emits geometry changes and can keep the proportions", () => {
    q("#kit-folder-layout")!.click();
    render();
    const x = q("#kit-position-0") as HTMLInputElement;
    x.value = "120";
    x.dispatchEvent(new Event("change"));
    expect(geometry).toEqual([{ prop: "x", value: 120 }]);

    geometry = [];
    (q('[data-field="size"] .kit-icon-btn') as HTMLButtonElement).click();
    render();
    const w = q("#kit-size-0") as HTMLInputElement;
    w.value = "800";
    w.dispatchEvent(new Event("change"));
    expect(geometry).toEqual([
      { prop: "width", value: 800 },
      { prop: "height", value: 400 },
    ]);
  });

  it("disables width fields that are calculated automatically", () => {
    fixture.componentRef.setInput("widthLocked", true);
    q("#kit-folder-layout")!.click();
    render();
    expect((q("#kit-size-0") as HTMLInputElement).disabled).toBeTrue();
    expect((q("#kit-size-1") as HTMLInputElement).disabled).toBeFalse();
  });

  it("disables position and size while the widget is locked, and says so on the folder", () => {
    fixture.componentRef.setInput("settings", { ...settings, locked: true });
    render();
    expect(
      q('[data-folder="layout"] .kit-folder-summary')!.textContent!.trim(),
    ).toBe("100, 50 · 400 × 200 · UE_KIT_LOCKED");
    q("#kit-folder-layout")!.click();
    render();
    for (const id of ["position-0", "position-1", "size-0", "size-1"]) {
      expect((q(`#kit-${id}`) as HTMLInputElement).disabled).toBeTrue();
    }
  });

  it("runs button actions and disables the ones that can't run (phase 4b)", () => {
    const runs: string[] = [];
    fixture.componentRef.setInput("schema", {
      widgetType: "records",
      folders: [
        {
          id: "layout",
          groups: [
            {
              fields: [
                {
                  id: "layer",
                  type: "buttons",
                  labelKey: "LAYER",
                  buttons: [
                    {
                      id: "front",
                      icon: "flip_to_front",
                      labelKey: "FRONT",
                      run: (c: any) => runs.push(`front ${c.widget.id}`),
                      disabled: () => true,
                    },
                    {
                      id: "back",
                      icon: "flip_to_back",
                      labelKey: "BACK",
                      run: (c: any) => runs.push(`back ${c.widget.id}`),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    render();
    q("#kit-folder-layout")?.click();
    render();
    const front = q('[data-button="front"]') as HTMLButtonElement;
    const back = q('[data-button="back"]') as HTMLButtonElement;
    expect(front.disabled).toBeTrue();
    expect(back.getAttribute("aria-label")).toBe("BACK");
    back.click();
    expect(runs).toEqual(["back w1"]);
    expect(changes).toBe(0);
  });

  it("offers Auto next to left / centre / right for an aligned part (phase 3c)", () => {
    fixture.componentRef.setInput("schema", {
      widgetType: "records",
      folders: [
        {
          id: "text",
          groups: [
            {
              fields: [
                {
                  id: "header",
                  type: "textPart",
                  labelKey: "HEADER",
                  keys: { size: "headerFontSize", align: "headerAlignment" },
                  keyDefaults: { align: "" },
                },
              ],
            },
          ],
        },
      ],
    });
    render();
    q("#kit-folder-text")?.click();
    render();
    q('[data-field="header"] .kit-part-head')?.click();
    render();
    const row = Array.from(
      el().querySelectorAll('[data-field="header"] .kit-seg'),
    ).find((x) => x.querySelector("[data-align]")) as HTMLElement;
    const buttons = Array.from(row.querySelectorAll("button"));
    expect(buttons.length).toBe(4);
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    (row.querySelector('[data-align="right"]') as HTMLButtonElement).click();
    render();
    expect(settings["headerAlignment"]).toBe("right");
    buttons[0].click();
    render();
    expect(settings["headerAlignment"]).toBe("");
  });
});
