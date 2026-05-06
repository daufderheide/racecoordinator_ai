import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { DataService } from "src/app/data.service";

import { RaceDetailComponent } from "./race-detail.component";

describe("RaceDetailComponent", () => {
  let component: RaceDetailComponent;
  let fixture: ComponentFixture<RaceDetailComponent>;
  let mockDataService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  const mockRace = {
    _id: "race1",
    track: {
      name: "Track A",
      lanes: [{ background_color: "red" }, { background_color: "blue" }],
    },
    statistics: { startMillis: 1000 },
    drivers: [
      {
        driver: { entity_id: "d1", name: "Driver 1" },
        totalLaps: 20,
        rankValue: 200,
        totalTime: 200,
        rank: 1,
      },
      {
        driver: { entity_id: "d2", name: "Driver 2" },
        totalLaps: 18,
        rankValue: 180,
        totalTime: 210,
        rank: 2,
      },
    ],
    heats: [
      {
        drivers: [
          {
            driver: {
              totalLaps: 10,
              rankValue: 100,
              totalTime: 100,
              driver: { entity_id: "d1", name: "Driver 1" },
            },
          },
          {
            driver: {
              totalLaps: 8,
              rankValue: 80,
              totalTime: 105,
              driver: { entity_id: "d2", name: "Driver 2" },
            },
          },
        ],
      },
      {
        drivers: [
          {
            driver: {
              totalLaps: 10,
              rankValue: 100,
              totalTime: 100,
              driver: { entity_id: "d1", name: "Driver 1" },
            },
          },
          // Driver 2 sits out in heat 2
        ],
      },
    ],
  };

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getRaceHistoryById",
      "getRaceHistory",
    ]);
    mockDataService.getRaceHistoryById.and.returnValue(of(mockRace));
    mockDataService.getRaceHistory.and.returnValue(of([mockRace]));

    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockActivatedRoute = {
      params: of({ id: "race1" }),
      snapshot: {
        queryParamMap: {
          get: (key: string) => "false",
        },
      },
    };

    await TestBed.configureTestingModule({
      declarations: [RaceDetailComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        ChangeDetectorRef,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RaceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ID Normalization", () => {
    it("should handle string IDs", () => {
      expect((component as any).getNormalizedId("123456")).toBe("123456");
    });

    it("should handle $oid objects", () => {
      expect((component as any).getNormalizedId({ $oid: "abc" })).toBe("abc");
    });

    it("should fallback to index-based ID for generic timestamp objects", () => {
      const tsObj = { timestamp: 123456789 };
      const fallback = { statistics: { startMillis: 1000 } };
      expect((component as any).getNormalizedId(tsObj, fallback, 5)).toBe(
        "fallback-5-1000",
      );
    });
  });

  describe("Cumulative Stats", () => {
    it("should calculate cumulative laps correctly for the first heat", () => {
      component.selectedHeatIndex = 0;
      component.calculateCumulativeLaps();
      expect(component.getCumulativeLaps("d1")).toBe(10);
      expect(component.getCumulativeLaps("d2")).toBe(8);
    });

    it("should calculate cumulative laps correctly for the second heat", () => {
      component.selectedHeatIndex = 1;
      component.calculateCumulativeLaps();
      expect(component.getCumulativeLaps("d1")).toBe(20); // 10 + 10
      expect(component.getCumulativeLaps("d2")).toBe(8); // 8 + 0 (sitout)
    });
  });

  describe("Segment Drivers", () => {
    it("should identify sitouts correctly", () => {
      component.selectedHeatIndex = 1;
      component.calculateCumulativeLaps();
      component.prepareSegmentDrivers();

      const d1 = component.segmentDrivers.find(
        (sd) => sd.driver.entity_id === "d1",
      );
      const d2 = component.segmentDrivers.find(
        (sd) => sd.driver.entity_id === "d2",
      );

      expect(d1.isSitout).toBeFalse();
      expect(d2.isSitout).toBeTrue();
    });

    it("should sort drivers by cumulative standings", () => {
      component.selectedHeatIndex = 0;
      component.calculateCumulativeLaps();
      component.prepareSegmentDrivers();

      expect(component.segmentDrivers[0].driver.entity_id).toBe("d1"); // 10 laps
      expect(component.segmentDrivers[1].driver.entity_id).toBe("d2"); // 8 laps
    });
  });

  describe("Find In History", () => {
    it("should find the correct race by normalized ID", () => {
      const history = [mockRace];
      const found = (component as any).findInHistory(history, "race1");
      expect(found).toBeTruthy();
      expect(found._id).toBe("race1");
    });
  });
});
