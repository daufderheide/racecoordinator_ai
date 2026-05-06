import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { DataService } from "src/app/data.service";
import { SettingsService } from "src/app/services/settings.service";
import { ThemeService } from "src/app/services/theme.service";

import { CumulativeResultsComponent } from "./cumulative-results.component";

describe("CumulativeResultsComponent", () => {
  let component: CumulativeResultsComponent;
  let fixture: ComponentFixture<CumulativeResultsComponent>;
  let mockDataService: any;
  let mockSettingsService: any;
  let mockThemeService: any;
  let mockRouter: any;

  const mockRaceHistory = [
    {
      _id: "race1",
      track: { name: "Track A" },
      car_class: "GT",
      database_name: "DB1",
      statistics: { startMillis: 1000 },
      drivers: [
        {
          driver: { entity_id: "d1", name: "Driver 1" },
          totalLaps: 10,
          rankValue: 100,
          totalTime: 100,
          bestLapTime: 10.0,
          rank: 1,
        },
        {
          driver: { entity_id: "d2", name: "Driver 2" },
          totalLaps: 8,
          rankValue: 80,
          totalTime: 120,
          bestLapTime: 12.0,
          rank: 2,
        },
      ],
    },
    {
      _id: "race2",
      track: { name: "Track B" },
      car_class: "GT",
      database_name: "DB1",
      statistics: { startMillis: 2000 },
      drivers: [
        {
          driver: { entity_id: "d1", name: "Driver 1" },
          totalLaps: 15,
          rankValue: 150,
          totalTime: 150,
          bestLapTime: 9.5,
          rank: 1,
        },
        {
          driver: { entity_id: "d3", name: "Driver 3" },
          totalLaps: 12,
          rankValue: 120,
          totalTime: 140,
          bestLapTime: 11.0,
          rank: 2,
        },
      ],
    },
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", ["getRaceHistory"]);
    mockDataService.getRaceHistory.and.returnValue(of(mockRaceHistory));

    mockSettingsService = jasmine.createSpyObj("SettingsService", [
      "getSettings",
    ]);
    mockThemeService = jasmine.createSpyObj("ThemeService", ["getTheme"]);
    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);

    await TestBed.configureTestingModule({
      declarations: [CumulativeResultsComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: Router, useValue: mockRouter },
        ChangeDetectorRef,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CumulativeResultsComponent);
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

    it("should handle entity_id fallback", () => {
      expect(
        (component as any).getNormalizedId(null, { entity_id: "ent1" }),
      ).toBe("ent1");
    });

    it("should return empty string for generic timestamp objects to trigger fallback logic", () => {
      const tsObj = { timestamp: 123456789 };
      expect((component as any).getNormalizedId(tsObj)).toBe("");
    });
  });

  describe("Standings Calculation", () => {
    it("should aggregate stats for multiple races", () => {
      component.selectedRaces = new Set(["race1", "race2"]);
      component.calculateCumulativeStandings();

      expect(component.cumulativeStandings.length).toBe(3);

      const d1 = component.cumulativeStandings.find((d) => d.driverId === "d1");
      expect(d1?.totalLaps).toBe(25); // 10 + 15
      expect(d1?.totalPoints).toBe(250); // 100 + 150
      expect(d1?.racesCount).toBe(2);
      expect(d1?.bestLapTime).toBe(9.5);
    });

    it("should sort by laps by default", () => {
      component.selectedRaces = new Set(["race1", "race2"]);
      component.sortMode = "laps";
      component.calculateCumulativeStandings();

      expect(component.cumulativeStandings[0].driverId).toBe("d1"); // 25 laps
      expect(component.cumulativeStandings[1].driverId).toBe("d3"); // 12 laps
      expect(component.cumulativeStandings[2].driverId).toBe("d2"); // 8 laps
    });

    it("should sort by points when sortMode is points", () => {
      component.selectedRaces = new Set(["race1", "race2"]);
      component.sortMode = "points";
      component.calculateCumulativeStandings();

      expect(component.cumulativeStandings[0].driverId).toBe("d1"); // 250 pts
      expect(component.cumulativeStandings[1].driverId).toBe("d3"); // 120 pts
      expect(component.cumulativeStandings[2].driverId).toBe("d2"); // 80 pts
    });
  });

  describe("Filtering", () => {
    it("should filter by track", () => {
      component.selectedTrackFilter = "Track A";
      expect(component.filteredHistory.length).toBe(1);
      expect(component.filteredHistory[0]._id).toBe("race1");
    });

    it("should filter by car class", () => {
      component.selectedCarClassFilter = "GT";
      expect(component.filteredHistory.length).toBe(2);
    });

    it("should update filter options from history", () => {
      (component as any).updateFilterOptions();
      expect(component.availableTracks).toContain("Track A");
      expect(component.availableTracks).toContain("Track B");
      expect(component.availableCarClasses).toContain("GT");
    });
  });

  describe("Time Formatting", () => {
    it("should format seconds correctly", () => {
      expect(component.formatTotalTime(45.123)).toBe("45.123");
    });

    it("should format minutes correctly", () => {
      expect(component.formatTotalTime(125.456)).toBe("2:05.456");
    });

    it("should format hours correctly", () => {
      expect(component.formatTotalTime(3665.789)).toBe("1:01:05.789");
    });
  });
});
