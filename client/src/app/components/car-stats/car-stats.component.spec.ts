import { Component, input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of, throwError } from "rxjs";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { DataService } from "@app/data.service";
import { CarStatRow } from "@app/models/car-stats";
import { TranslationService } from "@app/services/translation.service";
import {
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { CarStatsComponent } from "./car-stats.component";

@Component({ standalone: true, selector: "app-editor-title", template: "" })
class MockEditorTitleComponent {
  titleKey = input("");
  showPreviewBadge = input(false);
  showHelp = input(true);
  showUndo = input(true);
  showRedo = input(true);
}

const row = (over: Partial<CarStatRow> = {}): CarStatRow => ({
  key: "c1",
  label: "Audi R8",
  races: 2,
  heats: 5,
  laps: 40,
  best_lap_time: 3.25,
  median_lap_time: 3.6,
  average_lap_time: 3.7,
  best_lap_driver: "Speedy",
  last_raced: 0,
  ...over,
});

describe("CarStatsComponent (#1210)", () => {
  let fixture: ComponentFixture<CarStatsComponent>;
  let component: any;
  let data: jasmine.SpyObj<any>;

  async function setUp(carId: string | null = null) {
    mockTranslationService.translate.and.callFake((key: string) => key);
    data = jasmine.createSpyObj("DataService", [
      "getCars",
      "getCarFields",
      "getTracks",
      "getDrivers",
      "getCarStatistics",
    ]);
    data.getCars.and.returnValue(
      of([
        { entity_id: "c2", name: "Ford GT40", carClass: "Classic" },
        { entity_id: "c1", name: "Audi R8", carClass: "GT3" },
        { entity_id: "c3", name: "Porsche", carClass: "gt3" },
      ]),
    );
    data.getCarFields.and.returnValue(
      of([{ entity_id: "f1", name: "Tyre width", position: 0 }]),
    );
    data.getTracks.and.returnValue(of([{ entity_id: "t1", name: "Heights" }]));
    data.getDrivers.and.returnValue(
      of([{ entity_id: "d1", name: "Ann", nickname: "Speedy" }]),
    );
    data.getCarStatistics.and.returnValue(of([row()]));

    TestBed.overrideComponent(CarStatsComponent, {
      remove: { imports: [EditorTitleComponent] },
      add: { imports: [MockEditorTitleComponent] },
    });
    await TestBed.configureTestingModule({
      imports: [CarStatsComponent],
      providers: [
        { provide: DataService, useValue: data },
        { provide: TranslationService, useValue: mockTranslationService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (k: string) => (k === "carId" ? carId : null),
              },
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CarStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = (sel: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(sel);

  afterEach(() => resetMocks());

  it("loads the stats per car and fills the filters", async () => {
    await setUp();
    expect(data.getCarStatistics).toHaveBeenCalledWith({ groupBy: "car" });
    expect(component.cars().map((c: any) => c.name)).toEqual([
      "Audi R8",
      "Ford GT40",
      "Porsche",
    ]);
    // Classes once each, whatever their case.
    expect(component.classes()).toEqual(["Classic", "GT3"]);
    expect(component.drivers()).toEqual([{ id: "d1", name: "Speedy" }]);
    expect(
      component.groups().some((g: any) => g.value === "custom:f1"),
    ).toBeTrue();
  });

  it("shows a row per group with its lap times", async () => {
    await setUp();
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll("#car-stats-table tbody td"),
    ).map((td: any) => td.textContent.trim());
    expect(cells.slice(0, 8)).toEqual([
      "Audi R8",
      "2",
      "5",
      "40",
      "3.250",
      "Speedy",
      "3.600",
      "3.700",
    ]);
    expect(el("#car-stats-table th")?.textContent?.trim()).toBe("CS_GROUP_CAR");
  });

  it("starts with the car from the Slotcar editor", async () => {
    await setUp("c1");
    expect(data.getCarStatistics).toHaveBeenCalledWith({
      groupBy: "car",
      carId: "c1",
    });
  });

  it("reloads when the group, a filter or demo races change", async () => {
    await setUp();
    component.setGroup("track");
    expect(data.getCarStatistics).toHaveBeenCalledWith({ groupBy: "track" });
    component.setFilter("carClass", "GT3");
    expect(data.getCarStatistics).toHaveBeenCalledWith({
      groupBy: "track",
      carClass: "GT3",
    });
    component.setFilter("carClass", "");
    component.setDemo(true);
    expect(data.getCarStatistics).toHaveBeenCalledWith({
      groupBy: "track",
      carClass: undefined,
      isDemo: true,
    });
    const calls = data.getCarStatistics.calls.count();
    component.setGroup("track"); // unchanged: no reload
    component.setFilter("carId", "");
    expect(data.getCarStatistics.calls.count()).toBe(calls);
  });

  it("names the first column after the user's own field", async () => {
    await setUp();
    component.setGroup("custom:f1");
    fixture.detectChanges();
    expect(el("#car-stats-table th")?.textContent?.trim()).toBe("Tyre width");
  });

  it("says when no saved races match", async () => {
    await setUp();
    data.getCarStatistics.and.returnValue(of([]));
    component.setGroup("class");
    fixture.detectChanges();
    expect(el("#cs-empty")).not.toBeNull();
    expect(el("#car-stats-table")).toBeNull();
  });

  it("says when the stats can't be loaded", async () => {
    await setUp();
    data.getCarStatistics.and.returnValue(throwError(() => new Error("x")));
    component.setGroup("driver");
    fixture.detectChanges();
    expect(el("#cs-error")).not.toBeNull();
  });

  it("shows a dash for a group without valid laps", async () => {
    await setUp();
    data.getCarStatistics.and.returnValue(
      of([row({ best_lap_time: 0, best_lap_driver: "" })]),
    );
    component.setGroup("class");
    fixture.detectChanges();
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll("#car-stats-table tbody td"),
    ).map((td: any) => td.textContent.trim());
    expect(cells[4]).toBe("--.---");
    expect(cells[5]).toBe("—");
  });
});
