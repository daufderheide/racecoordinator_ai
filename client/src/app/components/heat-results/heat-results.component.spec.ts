import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject, of } from "rxjs";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";

import { HeatResultsComponent } from "./heat-results.component";

@Pipe({ standalone: true,name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("HeatResultsComponent", () => {
  let component: HeatResultsComponent;
  let fixture: ComponentFixture<HeatResultsComponent>;
  let mockRaceConnectionService: any;
  let mockRaceService: any;

  beforeEach(async () => {
    mockRaceConnectionService = {
      connect: jasmine.createSpy("connect"),
      disconnect: jasmine.createSpy("disconnect"),
      laps$: new BehaviorSubject<any>(null),
    };

    mockRaceService = jasmine.createSpyObj("RaceService", [
      "getRace",
      "getCurrentHeat",
    ]);
    mockRaceService.currentHeat$ = of(null);

    // Mock Setup Data
    const mockDriver1 = new Driver("d1", "Alice", "Ally", "");
    const mockDriver2 = new Driver("d2", "Bob", "Bobby", "");

    const hd1 = new DriverHeatData(
      "hd1",
      { driver: mockDriver1 } as any,
      0,
      mockDriver1,
    );
    hd1.addLapTime(1, 10.5, 10.5, 10.5, 10.5, 1);
    hd1.addLapTime(2, 10.2, 10.35, 10.35, 10.2, 2);

    const hd2 = new DriverHeatData(
      "hd2",
      { driver: mockDriver2 } as any,
      1,
      mockDriver2,
    );
    hd2.addLapTime(1, 11.1, 11.1, 11.1, 11.1, 1);
    hd2.addLapTime(2, 10.9, 11.0, 11.0, 10.9, 2);

    const mockHeat = new Heat("h1", 1, [hd1, hd2]);
    const mockRace = new Race(
      "r1",
      "Race 1",
      {
        lanes: [
          { background_color: "#ff0000" },
          { background_color: "#0000ff" },
        ],
      } as any,
      "RoundRobin",
    );

    mockRaceService.getRace.and.returnValue(mockRace);
    mockRaceService.getCurrentHeat.and.returnValue(mockHeat);

    await TestBed.configureTestingModule({
      imports: [HeatResultsComponent, MockTranslatePipe],
      providers: [
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeatResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render dual graph containers", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".rankings-graph")).toBeTruthy();
    expect(compiled.querySelector(".laptimes-graph")).toBeTruthy();
  });

  it("should calculate ranking timeline correctly", () => {
    // Trigger graph update loop
    component.ngOnInit();

    expect(component["driverLines"].length).toBe(2);

    // Check first driver rank points
    const line1 = component["driverLines"][0];
    expect(line1.rankPoints.length).toBeGreaterThan(1);

    // Check points chronology ascending
    let prevX = -1;
    line1.rankPoints.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(prevX);
      prevX = p.x;
    });
  });

  it("should filter out Empty drivers from calculations", () => {
    const mockDriverEmpty = new Driver("d3", "Empty", "Empty", "");
    const hdEmpty = new DriverHeatData(
      "hdEmpty",
      { driver: mockDriverEmpty } as any,
      2,
      mockDriverEmpty,
    );

    const currentHeat = mockRaceService.getCurrentHeat();
    currentHeat.heatDrivers.push(hdEmpty);

    component.ngOnInit();

    // empty driver should be filtered
    expect(component["driverLines"].length).toBe(2);
  });
});
