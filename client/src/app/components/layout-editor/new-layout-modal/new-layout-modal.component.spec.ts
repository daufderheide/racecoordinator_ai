import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { NewLayoutModalComponent } from "./new-layout-modal.component";

@Pipe({
  name: "translate",
  standalone: true,
})
class MockTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe("NewLayoutModalComponent", () => {
  let component: NewLayoutModalComponent;
  let fixture: ComponentFixture<NewLayoutModalComponent>;

  const mockOptions = [
    { id: "default_ui_layout_rc_ai", name: "RaceCoordinator AI" },
    { id: "practice_ui_layout_rc_ai", name: "RaceCoordinator AI (Practice)" },
    { id: "default_fuel_ui_layout_rc_ai", name: "RaceCoordinator AI (Fuel)" },
    {
      id: "driver_station_ui_layout_rc_ai",
      name: "RaceCoordinator AI (Driver Station)",
    },
    { id: "empty", name: "Empty Layout" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewLayoutModalComponent],
    })
      .overrideComponent(NewLayoutModalComponent, {
        remove: { imports: [TranslatePipe] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NewLayoutModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not display content when visible is false", () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();
    const content = fixture.debugElement.query(
      By.css("#new-layout-modal-content"),
    );
    expect(content).toBeNull();
  });

  it("should display content and options when visible is true", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("options", mockOptions);
    fixture.detectChanges();

    const content = fixture.debugElement.query(
      By.css("#new-layout-modal-content"),
    );
    expect(content).not.toBeNull();

    const optionButtons = fixture.debugElement.queryAll(
      By.css(".template-option-btn"),
    );
    expect(optionButtons.length).toBe(mockOptions.length);

    // Verify Create button is removed
    const createBtn = fixture.debugElement.query(
      By.css("#btn-confirm-new-layout"),
    );
    expect(createBtn).toBeNull();
  });

  it("should immediately emit confirm with template ID when user clicks a template option", () => {
    spyOn(component.confirm, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("options", mockOptions);
    fixture.detectChanges();

    const optionButtons = fixture.debugElement.queryAll(
      By.css(".template-option-btn"),
    );
    // Click on the 5th option ("empty")
    optionButtons[4].nativeElement.click();

    expect(component.confirm.emit).toHaveBeenCalledWith("empty");
  });

  it("should immediately emit confirm with template ID when user clicks the practice template option", () => {
    spyOn(component.confirm, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("options", mockOptions);
    fixture.detectChanges();

    const practiceOption = fixture.debugElement.query(
      By.css(
        '.template-option-btn[data-template-id="practice_ui_layout_rc_ai"]',
      ),
    );
    practiceOption.nativeElement.click();

    expect(component.confirm.emit).toHaveBeenCalledWith(
      "practice_ui_layout_rc_ai",
    );
  });

  it("should emit cancel when close button is clicked", () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const closeBtn = fixture.debugElement.query(By.css(".close-btn"));
    closeBtn.nativeElement.click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should emit cancel when cancel button is clicked", () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const cancelBtn = fixture.debugElement.query(
      By.css("#btn-cancel-new-layout"),
    );
    cancelBtn.nativeElement.click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should emit cancel on backdrop click", () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(
      By.css("#new-layout-modal-backdrop"),
    );
    backdrop.nativeElement.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should not emit cancel when clicking inside modal content", () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const content = fixture.debugElement.query(
      By.css("#new-layout-modal-content"),
    );
    content.nativeElement.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(component.cancel.emit).not.toHaveBeenCalled();
  });

  it("should emit cancel on Escape key when visible", () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should not emit cancel on Escape key when not visible", () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(component.cancel.emit).not.toHaveBeenCalled();
  });

  it("should emit confirm on Enter key when visible", () => {
    spyOn(component.confirm, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput(
      "selectedTemplateId",
      "driver_station_ui_layout_rc_ai",
    );
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(component.confirm.emit).toHaveBeenCalledWith(
      "driver_station_ui_layout_rc_ai",
    );
  });
});
