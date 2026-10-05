import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot } from "@angular/router";

import { racedayTitleResolver, routes } from "./app.routes";
import { ThemeService } from "./services/theme.service";
import { TranslationService } from "./services/translation.service";

describe("app.routes and racedayTitleResolver", () => {
  let mockThemeService: any;
  let mockTranslationService: any;

  beforeEach(() => {
    mockThemeService = {
      getActiveTheme: jasmine.createSpy("getActiveTheme").and.returnValue(null),
      getThemes: jasmine.createSpy("getThemes").and.returnValue([]),
    };

    mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((key: string) => {
        if (key === "UE_LABEL_DEFAULT_THEME") return "RaceCoordinator AI";
        if (key === "UE_LABEL_PRACTICE_THEME")
          return "RaceCoordinator AI (Practice)";
        if (key === "UE_LABEL_FUEL_THEME") return "RaceCoordinator AI (Fuel)";
        return key;
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
  });

  it("should define raceday routes with racedayTitleResolver", () => {
    const racedayRoute = routes.find((r) => r.path === "raceday");
    const defaultRacedayRoute = routes.find(
      (r) => r.path === "default-raceday",
    );

    expect(racedayRoute?.title).toBe(racedayTitleResolver);
    expect(defaultRacedayRoute?.title).toBe(racedayTitleResolver);
  });

  it("should return Raceday when themeId query param is absent", () => {
    const route = { queryParams: {} } as unknown as ActivatedRouteSnapshot;
    const title = TestBed.runInInjectionContext(() =>
      racedayTitleResolver(route, {} as any),
    );
    expect(title).toBe("Raceday");
  });

  it("should return custom theme name when theme is found in themeService", () => {
    mockThemeService.getActiveTheme.and.returnValue({
      entity_id: "t_custom",
      name: "Custom Grand Prix",
    });

    const route = {
      queryParams: { themeId: "t_custom" },
    } as unknown as ActivatedRouteSnapshot;
    const title = TestBed.runInInjectionContext(() =>
      racedayTitleResolver(route, {} as any),
    );
    expect(title).toBe("Custom Grand Prix");
  });

  it("should return localized title for practice theme", () => {
    const route = {
      queryParams: { themeId: "practice_theme_rc_ai" },
    } as unknown as ActivatedRouteSnapshot;
    const title = TestBed.runInInjectionContext(() =>
      racedayTitleResolver(route, {} as any),
    );
    expect(title).toBe("RaceCoordinator AI (Practice)");
  });

  it("should return localized title for fuel theme", () => {
    const route = {
      queryParams: { themeId: "default_fuel_theme_rc_ai" },
    } as unknown as ActivatedRouteSnapshot;
    const title = TestBed.runInInjectionContext(() =>
      racedayTitleResolver(route, {} as any),
    );
    expect(title).toBe("RaceCoordinator AI (Fuel)");
  });

  it("should return localized title for default classic theme", () => {
    const route = {
      queryParams: { themeId: "default_classic_rc_ai" },
    } as unknown as ActivatedRouteSnapshot;
    const title = TestBed.runInInjectionContext(() =>
      racedayTitleResolver(route, {} as any),
    );
    expect(title).toBe("RaceCoordinator AI");
  });
});
