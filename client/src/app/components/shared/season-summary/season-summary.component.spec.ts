import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Season, SeasonStandingItem } from "@app/models/season";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import { SeasonSummaryComponent } from "./season-summary.component";

describe("SeasonSummaryComponent", () => {
  let component: SeasonSummaryComponent;
  let fixture: ComponentFixture<SeasonSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonSummaryComponent, TranslatePipe],
      providers: [
        {
          provide: TranslationService,
          useValue: {
            translate: (key: string) => key,
            getTranslation: (key: string) => key,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonSummaryComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty message when season is undefined", () => {
    fixture.componentRef.setInput("season", undefined);
    fixture.componentRef.setInput("emptyMessage", "RDS_NO_SEASON_SELECTED");
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector(".empty-standings");
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain("RDS_NO_SEASON_SELECTED");
  });

  it("should display empty standings when season has no races", () => {
    const season: Season = {
      entity_id: "s_empty",
      name: "Empty Season",
      drops: 1,
      races: [],
    };
    fixture.componentRef.setInput("season", season);
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector("#season-detail-name");
    expect(name.textContent).toContain("Empty Season");

    const drops = fixture.nativeElement.querySelector("#season-detail-drops");
    expect(drops.textContent).toContain("1");

    const races = fixture.nativeElement.querySelector("#season-detail-races");
    expect(races.textContent).toContain("0");

    const empty = fixture.nativeElement.querySelector(".empty-standings");
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain("SM_NO_RACES_RUN");
  });

  it("should render standings table with podium classes and medals when standings are provided", () => {
    const season: Season = {
      entity_id: "s1",
      name: "Pro Championship",
      drops: 0,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [],
        },
      ],
    };
    const standings: SeasonStandingItem[] = [
      {
        driver_id: "d1",
        driver_name: "First Driver",
        net_points: 50,
        gross_points: 70,
        dropped_points: 20,
        races_run: 3,
        race_scores: [],
      },
      {
        driver_id: "d2",
        driver_name: "Second Driver",
        net_points: 40,
        gross_points: 55,
        races_run: 3,
        race_scores: [],
      },
      {
        driver_id: "d3",
        driver_name: "Third Driver",
        net_points: 30,
        gross_points: 30,
        races_run: 2,
        race_scores: [],
      },
      {
        driver_id: "d4",
        driver_name: "Fourth Driver",
        net_points: 20,
        gross_points: 20,
        races_run: 2,
        race_scores: [],
      },
    ];

    fixture.componentRef.setInput("season", season);
    fixture.componentRef.setInput("standings", standings);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll(
      ".standings-header-container thead tr th",
    );
    expect(headers.length).toBe(6);
    expect(headers[0].textContent.trim()).toBe("SM_RANK");
    expect(headers[1].textContent.trim()).toBe("SM_DRIVER");
    expect(headers[2].textContent.trim()).toBe("SM_NET_POINTS");
    expect(headers[3].textContent.trim()).toBe("SM_GROSS_POINTS");
    expect(headers[4].textContent.trim()).toBe("SM_DROPPED_POINTS");
    expect(headers[5].textContent.trim()).toBe("SM_RACES");

    const rows = fixture.nativeElement.querySelectorAll(
      ".standings-body-container tbody tr",
    );
    expect(rows.length).toBe(4);

    expect(rows[0].classList).toContain("podium-1");
    expect(rows[0].textContent).toContain("🥇 1");
    expect(rows[0].textContent).toContain("First Driver");
    expect(rows[0].textContent).toContain("50");
    expect(rows[0].textContent).toContain("70");
    expect(rows[0].textContent).toContain("20");

    expect(rows[1].classList).toContain("podium-2");
    expect(rows[1].textContent).toContain("🥈 2");
    expect(rows[1].textContent).toContain("Second Driver");
    expect(rows[1].textContent).toContain("40");
    expect(rows[1].textContent).toContain("55");
    expect(rows[1].textContent).toContain("15");

    expect(rows[2].classList).toContain("podium-3");
    expect(rows[2].textContent).toContain("🥉 3");

    expect(rows[3].textContent).toContain("4");
    expect(rows[3].textContent).toContain("Fourth Driver");
  });

  it("should show demo badge when season contains demo races", () => {
    const season: Season = {
      entity_id: "s_demo",
      name: "Demo Season",
      drops: 0,
      races: [
        {
          race_id: "r1",
          race_name: "Demo Race",
          timestamp: 1000,
          is_demo: true,
          driver_results: [],
        },
      ],
    };
    fixture.componentRef.setInput("season", season);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector(
      "#season-detail-demo-badge",
    );
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("SE_DEMO_RACES_INCLUDED");
  });

  it("should compute standings automatically when standings input is omitted", () => {
    const season: Season = {
      entity_id: "s_calc",
      name: "Computed Season",
      drops: 0,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Driver A",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 0,
              total_points: 25,
            },
          ],
        },
      ],
    };
    fixture.componentRef.setInput("season", season);
    fixture.detectChanges();

    expect(component.computedStandings().length).toBe(1);
    expect(component.computedStandings()[0].driver_name).toBe("Driver A");
  });

  it("should apply compact class when compact input is true", () => {
    fixture.componentRef.setInput("compact", true);
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector(
      ".season-summary-container",
    );
    expect(container.classList).toContain("compact");
  });

  it("should set title attribute on driver column cells for full name tooltip", () => {
    const season: Season = {
      entity_id: "s_long",
      name: "Long Name Season",
      drops: 0,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [],
        },
      ],
    };
    const standings: SeasonStandingItem[] = [
      {
        driver_id: "d1",
        driver_name: "Very Long Driver Name That Can Truncate",
        net_points: 100,
        gross_points: 100,
        races_run: 5,
        race_scores: [],
      },
    ];

    fixture.componentRef.setInput("season", season);
    fixture.componentRef.setInput("standings", standings);
    fixture.detectChanges();

    const driverCell = fixture.nativeElement.querySelector(
      ".standings-body-container tbody tr td.col-driver",
    );
    expect(driverCell).toBeTruthy();
    expect(driverCell.getAttribute("title")).toBe(
      "Very Long Driver Name That Can Truncate",
    );
    expect(driverCell.textContent.trim()).toBe(
      "Very Long Driver Name That Can Truncate",
    );
  });

  it("should correctly display 3-digit ranks for positions greater than 99 in compact mode", () => {
    const season: Season = {
      entity_id: "s_large",
      name: "Large Field Season",
      drops: 0,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [],
        },
      ],
    };

    const standings: SeasonStandingItem[] = Array.from(
      { length: 105 },
      (_, idx) => ({
        driver_id: `d_${idx + 1}`,
        driver_name: `Driver ${idx + 1}`,
        net_points: 1000 - idx * 5,
        gross_points: 1000 - idx * 5,
        races_run: 1,
        race_scores: [],
      }),
    );

    fixture.componentRef.setInput("season", season);
    fixture.componentRef.setInput("standings", standings);
    fixture.componentRef.setInput("compact", true);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      ".standings-body-container tbody tr",
    );
    expect(rows.length).toBe(105);

    // Podium ranks
    expect(rows[0].querySelector(".col-rank").textContent.trim()).toBe("🥇 1");
    expect(rows[1].querySelector(".col-rank").textContent.trim()).toBe("🥈 2");
    expect(rows[2].querySelector(".col-rank").textContent.trim()).toBe("🥉 3");

    // Regular ranks including 2-digit and 3-digit
    expect(rows[3].querySelector(".col-rank").textContent.trim()).toBe("4");
    expect(rows[98].querySelector(".col-rank").textContent.trim()).toBe("99");
    expect(rows[99].querySelector(".col-rank").textContent.trim()).toBe("100");
    expect(rows[104].querySelector(".col-rank").textContent.trim()).toBe("105");
  });

  it("should display large 7-digit numeric values accurately across all stat columns", () => {
    const season: Season = {
      entity_id: "s_large_nums",
      name: "High Score Season",
      drops: 2,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [],
        },
      ],
    };

    const standings: SeasonStandingItem[] = [
      {
        driver_id: "d1",
        driver_name: "High Roller",
        net_points: 1234567,
        gross_points: 9876543.5,
        dropped_points: 8641976.5,
        races_run: 1234567,
        race_scores: [],
      },
    ];

    fixture.componentRef.setInput("season", season);
    fixture.componentRef.setInput("standings", standings);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector(
      ".standings-body-container tbody tr",
    );
    expect(row).toBeTruthy();

    const ptsCells = row.querySelectorAll("td.col-pts");
    expect(ptsCells.length).toBe(3);
    // Net Points (1,234,567)
    expect(ptsCells[0].textContent.replace(/,/g, "")).toContain("1234567");
    // Gross Points (9,876,543.5)
    expect(ptsCells[1].textContent.replace(/,/g, "")).toContain("9876543.5");
    // Dropped Points (8,641,976.5)
    expect(ptsCells[2].textContent.replace(/,/g, "")).toContain("8641976.5");

    const racesCell = row.querySelector("td.col-races");
    expect(racesCell.textContent.trim()).toBe("1234567");
  });

  it("should hide detail-header when showHeader input is false", () => {
    const season: Season = {
      entity_id: "s_no_header",
      name: "Headerless Season",
      drops: 1,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Driver 1",
              overall_rank: 1,
              overall_points: 25,
              total_points: 25,
              heat_points: 0,
            },
          ],
        },
      ],
    };

    fixture.componentRef.setInput("season", season);
    fixture.componentRef.setInput("showHeader", false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".detail-header")).toBeNull();
    expect(compiled.querySelector(".standings-wrapper")).toBeTruthy();

    fixture.componentRef.setInput("showHeader", true);
    fixture.detectChanges();
    expect(compiled.querySelector(".detail-header")).toBeTruthy();
    expect(compiled.querySelector("#season-detail-name")?.textContent).toBe(
      "Headerless Season",
    );
  });
});
