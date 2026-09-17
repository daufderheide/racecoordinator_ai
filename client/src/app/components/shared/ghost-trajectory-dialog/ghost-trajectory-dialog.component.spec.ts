import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GhostPacingService } from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";

import {
  GhostTrajectoryDialogComponent,
  TrajectoryReferenceOption,
} from "./ghost-trajectory-dialog.component";
import { GhostTrajectoryDialogHarness } from "./testing/ghost-trajectory-dialog.harness";

describe("GhostTrajectoryDialogComponent", () => {
  let component: GhostTrajectoryDialogComponent;
  let fixture: ComponentFixture<GhostTrajectoryDialogComponent>;

  beforeEach(async () => {
    const mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((key: string) => {
        const map: Record<string, string> = {
          GTD_TITLE: "Pacing & Trajectory Comparison",
          GTD_CLOSE_ARIA: "Close dialog",
          GTD_LIVE_DRIVER: "Live Driver",
          GTD_GHOST_REFERENCE: "Comparison",
          GTD_VS: "VS",
          GTD_LEAD_CHANGES: "Lead Changes",
          GTD_MAX_ADVANTAGE: "Max Advantage",
          GTD_MAX_DEFICIT: "Max Deficit",
          GTD_AVG_DELTA_LAP: "Avg Delta / Lap",
          GTD_TH_LAP: "Lap",
          GTD_CUMULATIVE: "(Cum.)",
          GTD_TH_DELTA: "Delta",
          GTD_TH_STATUS: "Status",
          GTD_STATUS_AHEAD: "Ahead",
          GTD_STATUS_BEHIND: "Behind",
          GTD_NO_DATA: "No lap data available for trajectory comparison",
          GTD_CLOSE: "Close",
          GTD_DRIVER_A: "Driver A",
          GTD_DRIVER_B: "Driver B",
          GTD_GHOST: "Ghost",
          GTD_BENCHMARK: "Benchmark",
        };
        return map[key] || key;
      }),
    };

    await TestBed.configureTestingModule({
      imports: [GhostTrajectoryDialogComponent],
      providers: [
        GhostPacingService,
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GhostTrajectoryDialogComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate trajectory comparison between driverA and selected reference", () => {
    const refOptions: TrajectoryReferenceOption[] = [
      { id: "d2", name: "Abby", lapTimes: [4.0, 4.0, 4.0] },
      { id: "d3", name: "Bob", lapTimes: [4.5, 4.5, 4.5] },
    ];

    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("driverAName", "Dave");
    fixture.componentRef.setInput("driverALapTimes", [3.8, 4.2, 3.9]);
    fixture.componentRef.setInput("referenceOptions", refOptions);
    fixture.componentRef.setInput("initialReferenceId", "d2");
    fixture.detectChanges();

    expect(component.selectedRefId()).toBe("d2");
    expect(component.selectedReference()?.name).toBe("Abby");
    expect(component.comparison().points.length).toBe(3);
    // L1: Dave (3.8) vs Abby (4.0) -> +0.2 ahead
    expect(component.comparison().points[0].delta).toBeCloseTo(0.2, 2);
    expect(component.comparison().points[0].isAhead).toBeTrue();

    // Switch reference to Bob (d3)
    component.onReferenceChange("d3");
    fixture.detectChanges();

    expect(component.selectedRefId()).toBe("d3");
    expect(component.selectedReference()?.name).toBe("Bob");
    // L1: Dave (3.8) vs Bob (4.5) -> +0.7 ahead
    expect(component.comparison().points[0].delta).toBeCloseTo(0.7, 2);
  });

  it("should support fixed benchmark fallback when no driver reference is selected", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("driverAName", "Dave");
    fixture.componentRef.setInput("driverALapTimes", [4.0, 4.2]);
    fixture.componentRef.setInput("referenceOptions", []);
    fixture.componentRef.setInput("benchmarkLapTime", 4.1);
    fixture.detectChanges();

    expect(component.selectedRefId()).toBe("__benchmark__");
    expect(component.selectedReference()).toBeNull();
    expect(component.currentReferenceName()).toContain("Benchmark (4.10s)");
    expect(component.comparison().points.length).toBe(2);
    expect(component.comparison().points[0].ghostCumulative).toBe(4.1);
  });

  it("should emit close on dismiss", () => {
    const closeSpy = jasmine.createSpy("close");
    component.close.subscribe(closeSpy);
    component.onDismiss();
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should interact correctly via GhostTrajectoryDialogHarness", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("driverAName", "Speedy");
    fixture.componentRef.setInput("driverALapTimes", [5.1, 5.0]);
    fixture.componentRef.setInput("benchmarkLapTime", 5.0);
    fixture.detectChanges();

    const harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      GhostTrajectoryDialogHarness,
    );

    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getDriverAName()).toBe("Speedy");
    expect(await harness.getMetricCardCount()).toBeGreaterThan(0);

    const closeSpy = jasmine.createSpy("close");
    component.close.subscribe(closeSpy);
    await harness.dismiss();
    expect(closeSpy).toHaveBeenCalled();
  });
});
