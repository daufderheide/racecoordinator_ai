import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { HeatDividerInfo } from "../heats-filter-bar/heats-filter.utils";
import { HeatsGridDividerComponent } from "./heats-grid-divider.component";

describe("HeatsGridDividerComponent", () => {
  let fixture: ComponentFixture<HeatsGridDividerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatsGridDividerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatsGridDividerComponent);
  });

  it("should render only group chip when groupChanged is true and stepChanged is false", () => {
    const divider: HeatDividerInfo = {
      show: true,
      stepChanged: false,
      groupChanged: true,
      groupIndex: 1,
      groupLabel: "Group 2",
    };
    fixture.componentRef.setInput("divider", divider);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains("group-only")).toBeTrue();
    expect(host.classList.contains("step-only")).toBeFalse();

    const groupChip = fixture.debugElement.query(By.css(".group-chip"));
    expect(groupChip).not.toBeNull();
    expect(groupChip.nativeElement.textContent).toContain("Group 2");

    const stepChip = fixture.debugElement.query(By.css(".step-chip"));
    expect(stepChip).toBeNull();
  });

  it("should render only step chip when stepChanged is true and groupChanged is false", () => {
    const divider: HeatDividerInfo = {
      show: true,
      stepChanged: true,
      groupChanged: false,
      stepNumber: 2,
      stepLabel: "Step 2",
    };
    fixture.componentRef.setInput("divider", divider);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains("step-only")).toBeTrue();
    expect(host.classList.contains("group-only")).toBeFalse();

    const stepChip = fixture.debugElement.query(By.css(".step-chip"));
    expect(stepChip).not.toBeNull();
    expect(stepChip.nativeElement.textContent).toContain("Step 2");

    const groupChip = fixture.debugElement.query(By.css(".group-chip"));
    expect(groupChip).toBeNull();
  });

  it("should render both chips when both stepChanged and groupChanged are true", () => {
    const divider: HeatDividerInfo = {
      show: true,
      stepChanged: true,
      groupChanged: true,
      stepNumber: 3,
      groupIndex: 0,
      stepLabel: "Step 3",
      groupLabel: "Group 1",
    };
    fixture.componentRef.setInput("divider", divider);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains("step-and-group")).toBeTrue();

    const stepChip = fixture.debugElement.query(By.css(".step-chip"));
    const groupChip = fixture.debugElement.query(By.css(".group-chip"));
    expect(stepChip).not.toBeNull();
    expect(stepChip.nativeElement.textContent).toContain("Step 3");
    expect(groupChip).not.toBeNull();
    expect(groupChip.nativeElement.textContent).toContain("Group 1");
  });
});
