import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";
import { CustomSelectComponent } from "@app/components/shared/custom-select/custom-select.component";
import { Settings } from "@app/models/settings";
import { CustomUiService } from "@app/services/custom-ui.service";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { ResultsLayoutComponent } from "./results-layout.component";
import { resultsLayoutTemplate } from "./results-layout.model";

describe("ResultsLayoutComponent on Race Results", () => {
  let fixture: ComponentFixture<ResultsLayoutComponent>;
  let settings: Settings;
  let saveSettings: jasmine.Spy;
  const heatLayout = {
    ...resultsLayoutTemplate("heat-results"),
    entity_id: "heat",
  };
  const raceLayout = {
    ...resultsLayoutTemplate("race-results"),
    entity_id: "race",
  };

  const driverLayout = {
    ...resultsLayoutTemplate("driver-results"),
    entity_id: "driver",
  };

  function open(
    purpose: "race-results" | "driver-results" = "race-results",
  ): void {
    fixture = TestBed.createComponent(ResultsLayoutComponent);
    fixture.componentRef.setInput("purpose", purpose);
    fixture.componentRef.setInput(
      "context",
      purpose === "race-results"
        ? { raceStandingsWidgetContext: { rows: [], scoreFormat: "1.0-0" } }
        : { driverResultsSections: {} },
    );
    fixture.detectChanges();
  }

  function picker(): CustomSelectComponent {
    return fixture.debugElement.query(By.directive(CustomSelectComponent))
      .componentInstance;
  }

  beforeEach(() => {
    settings = new Settings();
    settings.heatResultsLayoutId = heatLayout.entity_id;
    saveSettings = jasmine.createSpy("saveSettings");
    mockTranslationService.translate.and.callFake((key: string) => key);
    TestBed.configureTestingModule({
      imports: [ResultsLayoutComponent],
      providers: [
        {
          provide: CustomUiService,
          useValue: {
            isInitialized: () => true,
            customUIs$: of([heatLayout, raceLayout, driverLayout]),
          },
        },
        { provide: CustomWidgetService, useValue: null },
        {
          provide: SettingsService,
          useValue: { getSettings: () => settings, saveSettings },
        },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
  });

  it("remembers Driver Results separately from Heat Results and Race Results", () => {
    settings.raceResultsLayoutId = raceLayout.entity_id;
    open("driver-results");
    expect(picker().customOptions.map((option) => option.value())).toEqual([
      "",
      driverLayout.entity_id,
    ]);
    picker().onChange(driverLayout.entity_id);
    expect(settings.driverResultsLayoutId).toBe(driverLayout.entity_id);
    expect(settings.raceResultsLayoutId).toBe(raceLayout.entity_id);
    expect(settings.heatResultsLayoutId).toBe(heatLayout.entity_id);
    fixture.destroy();
    open("driver-results");
    expect(fixture.componentInstance.activeLayout()?.purpose).toBe(
      "driver-results",
    );
  });

  it("selects and restores the Race Results layout independently from the Heat Results preference", () => {
    open();
    expect(fixture.componentInstance.activeLayout()).toBeUndefined();
    expect(picker().customOptions.map((option) => option.value())).toEqual([
      "",
      "race",
    ]);
    picker().onChange("heat");
    expect(saveSettings).not.toHaveBeenCalled();
    picker().onChange("race");
    fixture.detectChanges();
    expect(fixture.componentInstance.activeLayout()?.purpose).toBe(
      "race-results",
    );
    expect(settings.heatResultsLayoutId).toBe("heat");
    expect(settings.raceResultsLayoutId).toBe("race");
    fixture.destroy();
    open();
    expect(fixture.componentInstance.activeLayout()?.purpose).toBe(
      "race-results",
    );
    picker().onChange("");
    fixture.detectChanges();
    expect(fixture.componentInstance.activeLayout()).toBeUndefined();
    expect(settings.raceResultsLayoutId).toBeUndefined();
    expect(settings.heatResultsLayoutId).toBe("heat");
  });
});
