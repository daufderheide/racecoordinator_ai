import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { AddLapSectionsDialogComponent } from "./add-lap-sections-dialog.component";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("AddLapSectionsDialogComponent", () => {
  let component: AddLapSectionsDialogComponent;
  let fixture: ComponentFixture<AddLapSectionsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLapSectionsDialogComponent, MockTranslatePipe],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLapSectionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not display content when visible is false", () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector(".modal-backdrop");
    expect(backdrop).toBeNull();
  });

  it("should display content and show correct labels when visible is true", () => {
    const participant = {
      driver: { name: "John Doe", nickname: "Johnny", entity_id: "driver-1" },
    } as any;
    const hd = new DriverHeatData("hd-1", participant, 2);
    hd.userLaps = 0.5;

    fixture.componentRef.setInput("driverHeatData", hd);
    fixture.componentRef.setInput("numTrackSections", 100);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(".modal-backdrop");
    expect(backdrop).not.toBeNull();

    const driverNameEl =
      fixture.nativeElement.querySelector(".driver-info-panel");
    expect(driverNameEl.textContent).toContain("John Doe");

    const laneEl = fixture.nativeElement.querySelector(".lane-pill");
    expect(laneEl.textContent.trim()).toBe("3");

    const trackSectionsEl = fixture.nativeElement.querySelector(
      ".calculation-info .calc-value",
    );
    expect(trackSectionsEl.textContent.trim()).toBe("100");

    const inputEl = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    expect(inputEl.value).toBe("50"); // 0.5 * 100
  });

  it("should calculate laps correctly on input change", () => {
    fixture.componentRef.setInput("numTrackSections", 80);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const inputEl = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    inputEl.value = "20";
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    expect(component.sectionsInput()).toBe(20);
    expect(component.calculatedLaps()).toBe(0.25); // 20 / 80

    const previewValEl = fixture.nativeElement.querySelector(".preview-value");
    expect(previewValEl.textContent).toContain("20");
    expect(previewValEl.textContent).toContain("0.25");
  });

  it("should emit confirm event on apply click", () => {
    spyOn(component.confirm, "emit");

    fixture.componentRef.setInput("numTrackSections", 100);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const inputEl = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    inputEl.value = "25";
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    const applyBtn = fixture.nativeElement.querySelector(
      ".btn-confirm",
    ) as HTMLButtonElement;
    applyBtn.click();

    expect(component.confirm.emit).toHaveBeenCalledWith(0.25);
  });

  it("should emit cancel event on cancel click", () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector(
      ".btn-cancel",
    ) as HTMLButtonElement;
    cancelBtn.click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should display auto segments info only when isAutoSegments is true", () => {
    const participant = {
      driver: { name: "Jane Doe", nickname: "Janie", entity_id: "driver-2" },
    } as any;
    const hd = new DriverHeatData("hd-2", participant, 1);
    hd.autoCalculatedLaps = 0.75;

    fixture.componentRef.setInput("driverHeatData", hd);
    fixture.componentRef.setInput("numTrackSections", 100);
    fixture.componentRef.setInput("visible", true);

    // Case 1: isAutoSegments is false
    fixture.componentRef.setInput("isAutoSegments", false);
    fixture.detectChanges();
    let textContent =
      fixture.nativeElement.querySelector(".result-preview").textContent;
    expect(textContent).not.toContain("RD_ADD_LAP_SECTIONS_AUTO_SEGMENTS");

    // Case 2: isAutoSegments is true
    fixture.componentRef.setInput("isAutoSegments", true);
    fixture.detectChanges();
    textContent =
      fixture.nativeElement.querySelector(".result-preview").textContent;
    expect(textContent).toContain("RD_ADD_LAP_SECTIONS_AUTO_SEGMENTS");
    expect(textContent).toContain("75"); // 0.75 * 100 auto segments
    expect(textContent).toContain("0.75");
  });
});
