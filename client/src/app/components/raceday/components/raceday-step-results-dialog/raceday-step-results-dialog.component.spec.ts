import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LayoutConfig, Settings } from "@app/models/settings";
import { CustomUiService } from "@app/services/custom-ui.service";
import { ThemeService } from "@app/services/theme.service";

import { RacedayStepResultsDialogComponent } from "./raceday-step-results-dialog.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("RacedayStepResultsDialogComponent", () => {
  let component: RacedayStepResultsDialogComponent;
  let fixture: ComponentFixture<RacedayStepResultsDialogComponent>;
  let mockThemeService: any;
  let mockCustomUiService: any;

  beforeEach(async () => {
    mockThemeService = {
      getActiveTheme: jasmine.createSpy("getActiveTheme").and.returnValue({
        step_results_ui_id: "custom_step_ui",
      }),
    };

    mockCustomUiService = {
      getCustomUI: jasmine
        .createSpy("getCustomUI")
        .and.callFake((id: string) => {
          if (id === "custom_step_ui") {
            return {
              entity_id: "custom_step_ui",
              layoutJson: JSON.stringify({
                baseWidth: 1920,
                baseHeight: 1080,
                widgets: [
                  {
                    id: "w-custom",
                    widgetType: "label",
                    x: 0,
                    y: 0,
                    width: 200,
                    height: 50,
                    zIndex: 1,
                  },
                ],
              }),
            };
          }
          return undefined;
        }),
    };

    await TestBed.configureTestingModule({
      imports: [RacedayStepResultsDialogComponent, MockTranslatePipe],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: CustomUiService, useValue: mockCustomUiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayStepResultsDialogComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not render dialog when visible is false", () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".step-results-dialog-backdrop")).toBeNull();
  });

  it("should render dialog and widgets when visible is true", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector(".step-results-dialog-backdrop"),
    ).toBeTruthy();
    expect(
      compiled.querySelector(".step-results-dialog-container"),
    ).toBeTruthy();
    expect(compiled.querySelector(".step-results-close-btn")).toBeTruthy();
  });

  it("should resolve custom UI from ThemeService and CustomUiService", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const layout = component.resolvedLayout();
    expect(layout.widgets.length).toBe(1);
    expect(layout.widgets[0].id).toBe("w-custom");
  });

  it("should fallback to Settings.DEFAULT_STEP_RESULTS_LAYOUT when UI is not found", () => {
    mockThemeService.getActiveTheme.and.returnValue(null);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const layout = component.resolvedLayout();
    expect(layout).toBe(Settings.DEFAULT_STEP_RESULTS_LAYOUT);
  });

  it("should prioritize customLayout input override if provided", () => {
    const override: LayoutConfig = {
      baseWidth: 1600,
      baseHeight: 900,
      widgets: [
        {
          id: "w-override",
          widgetType: "timer",
          x: 10,
          y: 10,
          width: 100,
          height: 40,
          zIndex: 1,
        },
      ],
    };

    fixture.componentRef.setInput("customLayout", override);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const layout = component.resolvedLayout();
    expect(layout.widgets[0].id).toBe("w-override");
  });

  it("should emit close when close button is clicked", () => {
    const closeSpy = spyOn(component.close, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      ".step-results-close-btn",
    ) as HTMLButtonElement;
    btn.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it("should emit close on Escape keydown", () => {
    const closeSpy = spyOn(component.close, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should emit close when clicking backdrop", () => {
    const closeSpy = spyOn(component.close, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const backdrop = (fixture.nativeElement as HTMLElement).querySelector(
      ".step-results-dialog-backdrop",
    ) as HTMLElement;
    backdrop.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it("should forward actions and CLOSE through dialogParentComponent", () => {
    const parentOnFileMenuSelect = jasmine.createSpy("onFileMenuSelect");
    const parentComp = {
      onFileMenuSelect: parentOnFileMenuSelect,
      currentStepResults: { step: 1, standings: [] },
    };

    fixture.componentRef.setInput("parentComponent", parentComp);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const closeSpy = spyOn(component.close, "emit");
    const dialogParent = component.dialogParentComponent();

    // CLOSE action
    dialogParent.onFileMenuSelect("CLOSE");
    expect(closeSpy).toHaveBeenCalled();

    // Other action
    dialogParent.onFileMenuSelect("SAVE");
    expect(parentOnFileMenuSelect).toHaveBeenCalledWith("SAVE");

    // closeStepResultsDialog direct call
    dialogParent.closeStepResultsDialog();
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it("should build step drivers and format stepStatus in dialogParentComponent", () => {
    fixture.componentRef.setInput("stepResults", {
      step: 1,
      group: 1,
      nextStep: 2,
      stepUpCount: 1,
      standings: [
        {
          rank: 1,
          driverId: "d1",
          driverName: "Speedy",
          totalLaps: 12,
          totalTime: 25.5,
          bestLapTime: 2.1,
          steppingUp: true,
          stepUpIndex: 1,
        },
        {
          rank: 2,
          driverId: "d2",
          driverName: "Slowy",
          totalLaps: 10,
          totalTime: 28.0,
          bestLapTime: 2.5,
          steppingUp: false,
          stepUpIndex: 0,
        },
      ],
    });
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const dialogParent = component.dialogParentComponent();
    expect(dialogParent.drivers.length).toBe(2);
    expect(dialogParent.drivers[0].driver.name).toBe("Speedy");
    expect(dialogParent.drivers[0].isSteppingUp).toBeTrue();
    expect(dialogParent.drivers[1].isSteppingUp).toBeFalse();

    const formattedUp = dialogParent.formatValue(
      "stepStatus",
      true,
      dialogParent.drivers[0],
      null,
      "",
      {},
    );
    expect(formattedUp).toBe("RD_STEPPING_UP");
    const formattedDown = dialogParent.formatValue(
      "stepStatus",
      false,
      dialogParent.drivers[1],
      null,
      "",
      {},
    );
    expect(formattedDown).toBe("RD_ELIMINATED");
  });
});
