import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { ThemeService } from "@app/services/theme.service";

import { DisplayClient } from "./display-client";

@Pipe({
  name: "translate",
  standalone: true,
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("DisplayClient", () => {
  let component: DisplayClient;
  let fixture: ComponentFixture<DisplayClient>;
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;
  let dataServiceSpy: jasmine.SpyObj<DataService>;
  let router: Router;

  beforeEach(async () => {
    themeServiceSpy = jasmine.createSpyObj("ThemeService", [
      "getThemes",
      "initialize",
      "getActiveTheme",
    ]);
    themeServiceSpy.getThemes.and.returnValue([
      { entity_id: "theme1", name: "Theme 1" } as any,
      { entity_id: "theme2", name: "Theme 2" } as any,
    ]);
    themeServiceSpy.initialize.and.returnValue(Promise.resolve());
    themeServiceSpy.getActiveTheme.and.returnValue(null);

    dataServiceSpy = jasmine.createSpyObj("DataService", ["getThemes"]);
    dataServiceSpy.getThemes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        DisplayClient,
        RouterTestingModule,
        BrowserAnimationsModule,
        MockTranslatePipe,
      ],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: DataService, useValue: dataServiceSpy },
      ],
    })
      .overrideComponent(DisplayClient, {
        remove: { imports: [TranslatePipe] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DisplayClient);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load themes on init", () => {
    expect(themeServiceSpy.getThemes).toHaveBeenCalled();
    expect(component.themes.length).toBe(2);
    expect(component.selectedThemeId).toBe("theme1");
  });

  it("should call themeService.initialize() when getThemes() is initially empty", async () => {
    themeServiceSpy.getThemes.and.returnValues(
      [],
      [{ entity_id: "theme3", name: "Theme 3", is_default: true } as any],
    );
    await component.loadThemes();
    expect(themeServiceSpy.initialize).toHaveBeenCalled();
    expect(component.themes.length).toBe(1);
    expect(component.selectedThemeId).toBe("theme3");
  });

  it("should fallback to dataService.getThemes() when initialize throws", async () => {
    themeServiceSpy.getThemes.and.returnValue([]);
    themeServiceSpy.initialize.and.returnValue(Promise.reject("error"));
    dataServiceSpy.getThemes.and.returnValue(
      of([{ entity_id: "theme_fallback", name: "Theme Fallback" } as any]),
    );

    await component.loadThemes();
    expect(component.themes.length).toBe(1);
    expect(component.selectedThemeId).toBe("theme_fallback");
  });

  it("should not navigate if no theme is selected", () => {
    component.selectedThemeId = "";
    component.launchDisplay();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("should navigate to raceday with themeId query param when a theme is selected", () => {
    component.selectedThemeId = "theme1";
    component.launchDisplay();
    expect(router.navigate).toHaveBeenCalledWith(["/default-raceday"], {
      queryParams: { themeId: "theme1" },
    });
  });
});
