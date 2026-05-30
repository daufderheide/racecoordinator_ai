import { CommonModule, DecimalPipe } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";

import { CumulativeResultsComponent } from "./cumulative-results.component";

describe("CumulativeResultsComponent (Race Insights)", () => {
  let component: CumulativeResultsComponent;
  let fixture: ComponentFixture<CumulativeResultsComponent>;
  let mockDataService: any;
  let mockSettingsService: any;
  let mockThemeService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getRaceHistory",
      "getSavedRaces",
    ]);
    mockDataService.getRaceHistory.and.returnValue(of([]));

    mockSettingsService = jasmine.createSpyObj("SettingsService", [
      "getSettings",
    ]);
    mockSettingsService.getSettings.and.returnValue({ shareAnalytics: true });

    mockThemeService = jasmine.createSpyObj("ThemeService", ["initialize"]);
    mockThemeService.initialize.and.returnValue(Promise.resolve());

    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        DecimalPipe,
        FormsModule,
        CumulativeResultsComponent,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CumulativeResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create the Race Insights (Cumulative Results) component", () => {
    expect(component).toBeTruthy();
  });

  it("should load race history on init", () => {
    expect(mockDataService.getRaceHistory).toHaveBeenCalled();
  });

  it("should toggle demo data and reload history", () => {
    component.showDemoData = false;
    component.toggleDemoData();
    expect(component.showDemoData).toBeTrue();
    expect(mockDataService.getRaceHistory).toHaveBeenCalledWith(true);
  });

  it("should calculate cumulative standings correctly", () => {
    const mockHistory = [
      {
        _id: "race1",
        drivers: [
          {
            driver: { name: "Alice", entity_id: "d1" },
            totalLaps: 10,
            totalTime: 100,
            rankValue: 5,
          },
          {
            driver: { name: "Bob", entity_id: "d2" },
            totalLaps: 8,
            totalTime: 100,
            rankValue: 3,
          },
        ],
      },
    ];
    component.history = mockHistory as any;
    component.selectedRaces = new Set(["race1"]);

    component.calculateCumulativeStandings();

    expect(component.cumulativeStandings.length).toBe(2);
    expect(component.cumulativeStandings[0].name).toBe("Alice");
    expect(component.cumulativeStandings[0].totalLaps).toBe(10);
    expect(component.cumulativeStandings[1].name).toBe("Bob");
    expect(component.cumulativeStandings[1].totalLaps).toBe(8);
  });

  it("should filter history based on track filter", () => {
    component.history = [
      { _id: "1", track: { name: "Track A" } },
      { _id: "2", track: { name: "Track B" } },
    ] as any;
    component.selectedTrackFilter = "Track A";

    const filtered = component.filteredHistory;
    expect(filtered.length).toBe(1);
    expect(filtered[0]._id).toBe("1");
  });
});
