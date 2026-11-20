import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WIDGET_SCHEMAS } from "@app/components/ui-editor/inspector-schemas/widget-schemas";
import { FontService } from "@app/services/font.service";

import { resetInspectorFormMemory } from "./inspector-form.component";
import {
  InspectorShellComponent,
  PANEL_THEME_STORAGE_KEY,
  readPanelTheme,
} from "./inspector-shell.component";

@Component({
  standalone: true,
  imports: [InspectorShellComponent],
  template: `
    <app-inspector-shell
      [widget]="widget"
      [schema]="schema"
      displayName="Records"
      typeLabelKey="UE_WIDGET_TYPE_RECORDS"
      (change)="changes = changes + 1; changedWidget = $event"
      (deleteWidget)="deleted = true"
      (previous)="moves.push(-1)"
      (next)="moves.push(1)"
      (undo)="undone = true"
    >
      <div class="legacy-marker">old inspector</div>
    </app-inspector-shell>
  `,
})
class HostComponent {
  widget: any = {
    id: "w1",
    widgetType: "records",
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    customSettings: {
      showRaceRecordLap: true,
      showRaceRecordScore: true,
      showCurrentRaceBest: true,
      showHeatBest: true,
      headerFontFamily: "",
      headerFontSize: 17,
      headerTextColor: "",
      valueFontFamily: "",
      valueFontSize: 19,
      valueTextColor: "",
      backgroundColor: "",
      showBorder: true,
      borderStyle: "solid",
      borderColor: "#ffffff",
      borderWidth: 1,
      borderRadius: 6,
    },
  };
  schema: any = WIDGET_SCHEMAS["records"];
  changes = 0;
  changedWidget: any = null;
  deleted = false;
  undone = false;
  moves: number[] = [];
}

describe("InspectorShellComponent", () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    resetInspectorFormMemory();
    try {
      localStorage.removeItem(PANEL_THEME_STORAGE_KEY);
    } catch {
      // ignore
    }
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Inter"],
    });
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    try {
      localStorage.removeItem(PANEL_THEME_STORAGE_KEY);
    } catch {
      // ignore
    }
  });

  const q = (sel: string) =>
    fixture.nativeElement.querySelector(sel) as HTMLElement | null;

  it("starts yellow and stores the dark choice", () => {
    expect(q(".kit-panel")!.getAttribute("data-panel-theme")).toBe("yellow");
    q("#kit-theme-toggle")!.click();
    fixture.detectChanges();
    expect(q(".kit-panel")!.getAttribute("data-panel-theme")).toBe("dark");
    expect(localStorage.getItem(PANEL_THEME_STORAGE_KEY)).toBe("dark");
    expect(readPanelTheme()).toBe("dark");
  });

  it("reads yellow for anything that isn't 'dark'", () => {
    localStorage.setItem(PANEL_THEME_STORAGE_KEY, "purple");
    expect(readPanelTheme()).toBe("yellow");
  });

  it("shows the widget name, the new form and not the old inspector", () => {
    expect(q(".inspector-widget-subtitle")!.textContent!.trim()).toBe(
      "Records",
    );
    expect(q("app-inspector-form")).not.toBeNull();
    expect(q(".legacy-marker")).toBeNull();
    expect(q("#kit-search")).not.toBeNull();
  });

  it("shows the old inspector as 'All settings' for widgets without a schema", () => {
    host.schema = null;
    fixture.detectChanges();
    expect(q("app-inspector-form")).toBeNull();
    expect(q(".kit-folder-legacy .legacy-marker")!.textContent).toContain(
      "old inspector",
    );
    expect(q("#kit-search")).toBeNull();
  });

  it("passes changes, delete and previous/next up to the editor", () => {
    (q("#kit-showHeatBest") as HTMLButtonElement).click();
    q(".inspector-delete-btn")!.click();
    q("#kit-prev-widget")!.click();
    q("#kit-next-widget")!.click();
    expect(host.changes).toBe(1);
    expect(host.changedWidget).toBe(host.widget);
    expect(host.widget.customSettings.showHeatBest).toBeFalse();
    expect(host.deleted).toBeTrue();
    expect(host.moves).toEqual([-1, 1]);
  });

  it("counts changed settings on the Changed chip and filters on it", () => {
    host.widget.customSettings.showHeatBest = false;
    host.widget.customSettings.borderWidth = 4;
    fixture.detectChanges();
    expect(q(".kit-chip-count")!.textContent!.trim()).toBe("2");
    q("#kit-only-changed")!.click();
    fixture.detectChanges();
    const fields = Array.from(
      fixture.nativeElement.querySelectorAll("[data-field]"),
    ).map((e: any) => e.dataset.field);
    expect(fields).toEqual(["showHeatBest", "borderWidth"]);
  });

  it("offers Undo after a reset and passes it to the editor", () => {
    host.widget.customSettings.showHeatBest = false;
    fixture.detectChanges();
    (
      q('[data-field="showHeatBest"] [data-reset]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(q(".kit-toast")).not.toBeNull();
    (q(".kit-toast-undo") as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.undone).toBeTrue();
    expect(q(".kit-toast")).toBeNull();
  });

  it("filters with search and shows a message when nothing matches", () => {
    const input = q("#kit-search") as HTMLInputElement;
    input.value = "zzzz";
    input.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    expect(q(".kit-empty")).not.toBeNull();
  });

  it("jumps to search with '/' and clears it with Esc", () => {
    const input = q("#kit-search") as HTMLInputElement;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
    expect(document.activeElement).toBe(input);
    input.value = "font";
    input.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    fixture.detectChanges();
    expect(input.value).toBe("");
  });
});
