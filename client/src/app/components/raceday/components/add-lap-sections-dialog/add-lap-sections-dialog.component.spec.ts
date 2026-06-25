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

  it("should display heat and driver selectors in menu mode", () => {
    const mockHeats = [
      {
        heatNumber: 1,
        started: true,
        heatDrivers: [
          {
            laneIndex: 0,
            userLaps: 1.0,
            driver: { name: "Alice" },
          },
          {
            laneIndex: 1,
            userLaps: 2.0,
            driver: { name: "Bob" },
          },
        ],
      },
      {
        heatNumber: 2,
        started: true,
        heatDrivers: [
          {
            laneIndex: 0,
            userLaps: 3.0,
            driver: { name: "Charlie" },
          },
        ],
      },
    ] as any[];

    fixture.componentRef.setInput("heats", mockHeats);
    fixture.componentRef.setInput("isMenuMode", true);
    fixture.componentRef.setInput("numTrackSections", 100);
    fixture.componentRef.setInput("currentHeatNumber", 1);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const heatSelect = fixture.nativeElement.querySelector(
      "#heatSelect",
    ) as HTMLSelectElement;
    const driverSelect = fixture.nativeElement.querySelector(
      "#driverSelect",
    ) as HTMLSelectElement;
    expect(heatSelect).not.toBeNull();
    expect(driverSelect).not.toBeNull();

    // Alice is selected by default in Heat 1
    const driverInfoText =
      fixture.nativeElement.querySelector(".driver-info-panel").textContent;
    expect(driverInfoText).toContain("Alice");

    // Change heat to 2
    heatSelect.value = "1";
    heatSelect.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    // Charlie should be active
    const driverInfoText2 =
      fixture.nativeElement.querySelector(".driver-info-panel").textContent;
    expect(driverInfoText2).toContain("Charlie");
  });

  it("should display no heats message and disable apply button if no heats are started in menu mode", () => {
    const mockHeats = [
      {
        heatNumber: 1,
        started: false,
        heatDrivers: [],
      },
    ] as any[];

    fixture.componentRef.setInput("heats", mockHeats);
    fixture.componentRef.setInput("isMenuMode", true);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const noHeatsPanel = fixture.nativeElement.querySelector(".no-heats-panel");
    expect(noHeatsPanel).not.toBeNull();
    expect(noHeatsPanel.textContent).toContain("RD_ADD_LAP_SECTIONS_NO_HEATS");

    const confirmBtn = fixture.nativeElement.querySelector(
      ".btn-confirm",
    ) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBeTrue();
  });

  it("should preserve edits across selectors and emit batch confirm payload on confirm in menu mode", () => {
    spyOn(component.confirm, "emit");

    const mockHeats = [
      {
        heatNumber: 1,
        started: true,
        heatDrivers: [
          {
            laneIndex: 0,
            userLaps: 1.0,
            driver: { name: "Alice" },
          },
          {
            laneIndex: 1,
            userLaps: 2.0,
            driver: { name: "Bob" },
          },
        ],
      },
    ] as any[];

    fixture.componentRef.setInput("heats", mockHeats);
    fixture.componentRef.setInput("isMenuMode", true);
    fixture.componentRef.setInput("numTrackSections", 100);
    fixture.componentRef.setInput("currentHeatNumber", 1);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    // Set Alice's input to 50
    const inputEl = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    inputEl.value = "50";
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    // Select Bob
    const driverSelect = fixture.nativeElement.querySelector(
      "#driverSelect",
    ) as HTMLSelectElement;
    driverSelect.value = "1";
    driverSelect.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    // Verify Bob's value loads (2.0 * 100 = 200)
    expect(inputEl.value).toBe("200");

    // Set Bob's input to 250
    inputEl.value = "250";
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    // Select Alice again
    driverSelect.value = "0";
    driverSelect.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    // Verify Alice's edited value (50) is preserved
    expect(inputEl.value).toBe("50");

    // Confirm/Apply
    component.onConfirm();

    expect(component.confirm.emit).toHaveBeenCalledWith({
      isBatch: true,
      updates: [
        { heatNumber: 1, laneIndex: 0, userLaps: 0.5 },
        { heatNumber: 1, laneIndex: 1, userLaps: 2.5 },
      ],
    });
  });

  it("should default to the current heat if it has started, or the last started heat in the list if the current heat is not started", () => {
    const mockHeats = [
      {
        heatNumber: 1,
        started: true,
        heatDrivers: [
          { laneIndex: 0, userLaps: 1.0, driver: { name: "Alice" } },
        ],
      },
      {
        heatNumber: 2,
        started: true,
        heatDrivers: [{ laneIndex: 0, userLaps: 2.0, driver: { name: "Bob" } }],
      },
      {
        heatNumber: 3,
        started: false,
        heatDrivers: [
          { laneIndex: 0, userLaps: 3.0, driver: { name: "Charlie" } },
        ],
      },
    ] as any[];

    // Case 1: Current heat has started (heat 2)
    fixture.componentRef.setInput("heats", mockHeats);
    fixture.componentRef.setInput("isMenuMode", true);
    fixture.componentRef.setInput("currentHeatNumber", 2);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    // Since heat 2 is started, it should default to heat 2 (index 1 of active/started heats)
    expect(component.selectedHeatIndex()).toBe(1);

    // Close and reset visible to re-trigger dialog opening effect
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();

    // Case 2: Current heat has not started (heat 3 is unstarted)
    fixture.componentRef.setInput("currentHeatNumber", 3);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    // Since heat 3 is not started, it should default to the last started heat in the list (heat 2, index 1)
    expect(component.selectedHeatIndex()).toBe(1);
  });

  it("should register updates specifically to the selected heat instead of the current heat when selecting a different heat in the dropdown", () => {
    spyOn(component.confirm, "emit");

    const mockHeats = [
      {
        heatNumber: 1,
        started: true,
        heatDrivers: [
          { laneIndex: 0, userLaps: 1.0, driver: { name: "Alice" } },
        ],
      },
      {
        heatNumber: 2,
        started: true,
        heatDrivers: [{ laneIndex: 0, userLaps: 2.0, driver: { name: "Bob" } }],
      },
    ] as any[];

    fixture.componentRef.setInput("heats", mockHeats);
    fixture.componentRef.setInput("isMenuMode", true);
    fixture.componentRef.setInput("currentHeatNumber", 2);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    // Default should be index 1 (Heat 2) because currentHeatNumber is 2 and it has started
    expect(component.selectedHeatIndex()).toBe(1);

    // Simulate changing dropdown to index 0 (Heat 1)
    component.onHeatSelectChange(0);
    fixture.detectChanges();

    // Set input to 150 sections (1.5 laps)
    const inputEl = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    inputEl.value = "150";
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();

    // Confirm/Apply
    component.onConfirm();

    // Verification: updates must only contain Heat 1 update, NOT Heat 2
    expect(component.confirm.emit).toHaveBeenCalledWith({
      isBatch: true,
      updates: [{ heatNumber: 1, laneIndex: 0, userLaps: 1.5 }],
    });
  });

  it("should focus and select the input when heat or driver changes in menu mode", async () => {
    const mockHeats = [
      {
        heatNumber: 1,
        started: true,
        heatDrivers: [
          { laneIndex: 0, userLaps: 1.0, driver: { name: "Alice" } },
          { laneIndex: 1, userLaps: 1.0, driver: { name: "Charlie" } },
        ],
      },
      {
        heatNumber: 2,
        started: true,
        heatDrivers: [{ laneIndex: 0, userLaps: 2.0, driver: { name: "Bob" } }],
      },
    ] as any[];

    fixture.componentRef.setInput("heats", mockHeats);
    fixture.componentRef.setInput("isMenuMode", true);
    fixture.componentRef.setInput("currentHeatNumber", 1);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0)); // clear initial timeout

    const inputEl = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    spyOn(inputEl, "focus");
    spyOn(inputEl, "select");

    // Change heat
    component.onHeatSelectChange(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(inputEl.focus).toHaveBeenCalled();
    expect(inputEl.select).toHaveBeenCalled();

    (inputEl.focus as jasmine.Spy).calls.reset();
    (inputEl.select as jasmine.Spy).calls.reset();

    // Change heat back to test driver change
    component.onHeatSelectChange(0);
    await new Promise((r) => setTimeout(r, 0));
    (inputEl.focus as jasmine.Spy).calls.reset();
    (inputEl.select as jasmine.Spy).calls.reset();

    // Change driver
    component.onDriverSelectChange(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(inputEl.focus).toHaveBeenCalled();
    expect(inputEl.select).toHaveBeenCalled();
  });
});
