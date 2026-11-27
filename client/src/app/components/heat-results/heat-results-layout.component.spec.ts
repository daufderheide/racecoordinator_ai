import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BehaviorSubject } from "rxjs";
import { CustomSelectComponent } from "@app/components/shared/custom-select/custom-select.component";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Heat } from "@app/race/heat";
import { CustomUiService } from "@app/services/custom-ui.service";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { HeatResultsLayoutComponent } from "./heat-results-layout.component";
import { heatResultsLayoutTemplate } from "./heat-results-layout.model";

describe("HeatResultsLayoutComponent", () => {
  let fixture: ComponentFixture<HeatResultsLayoutComponent>;
  let layouts: BehaviorSubject<CustomUI[]>;
  let settings: Settings;
  let saveSettings: jasmine.Spy;
  const savedLayout = {
    ...heatResultsLayoutTemplate(),
    entity_id: "club-results",
    name: "Club Results",
  };
  const first = new Heat("h1", 1, []);
  const current = new Heat("h2", 2, []);

  function open(): void {
    fixture = TestBed.createComponent(HeatResultsLayoutComponent);
    fixture.componentRef.setInput("heats", [first, current]);
    fixture.componentRef.setInput("selectableHeats", [first, current]);
    fixture.componentRef.setInput("selectedHeatIndex", 1);
    fixture.componentRef.setInput("currentHeat", current);
    fixture.componentRef.setInput("data", []);
    fixture.detectChanges();
  }

  function selects(): CustomSelectComponent[] {
    return fixture.debugElement
      .queryAll(By.directive(CustomSelectComponent))
      .map((element) => element.componentInstance);
  }

  beforeEach(() => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    layouts = new BehaviorSubject<CustomUI[]>([savedLayout]);
    settings = new Settings();
    saveSettings = jasmine.createSpy("saveSettings");
    TestBed.configureTestingModule({
      imports: [HeatResultsLayoutComponent],
      providers: [
        {
          provide: SettingsService,
          useValue: { getSettings: () => settings, saveSettings },
        },
        {
          provide: CustomUiService,
          useValue: { isInitialized: () => true, customUIs$: layouts },
        },
        { provide: CustomWidgetService, useValue: null },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
  });

  it("defaults to the built-in view and restores a saved layout choice after reopening", () => {
    open();
    expect(fixture.componentInstance.activeLayout()).toBeUndefined();
    selects()[0].onChange(savedLayout.entity_id);
    fixture.detectChanges();
    expect(saveSettings).toHaveBeenCalledWith(
      jasmine.objectContaining({ heatResultsLayoutId: "club-results" }),
    );
    expect(
      fixture.nativeElement.querySelector(".results-layout-canvas"),
    ).not.toBeNull();

    fixture.destroy();
    open();
    expect(fixture.componentInstance.activeLayout()?.purpose).toBe(
      "heat-results",
    );
    expect(selects().length).toBe(2);
    selects()[0].onChange("");
    fixture.detectChanges();
    expect(settings.heatResultsLayoutId).toBeUndefined();
    expect(
      fixture.nativeElement.querySelector(".results-layout-canvas"),
    ).toBeNull();
  });

  it("passes the selected heat through and falls back if the saved layout is removed", () => {
    settings.heatResultsLayoutId = savedLayout.entity_id;
    open();
    const emit = spyOn(fixture.componentInstance.heatSelected, "emit");
    selects()[1].onChange(0);
    expect(emit).toHaveBeenCalledWith(0);

    layouts.next([{ ...savedLayout, layoutJson: "malformed" }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.activeLayout()).toBeUndefined();
    expect(selects().length).toBe(0);
  });
});
