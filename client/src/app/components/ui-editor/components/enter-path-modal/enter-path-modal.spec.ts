import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { EnterPathModalComponent } from "./enter-path-modal";

@Pipe({
  name: "translate",
  standalone: true,
})
class MockTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe("EnterPathModalComponent", () => {
  let component: EnterPathModalComponent;
  let fixture: ComponentFixture<EnterPathModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterPathModalComponent],
    })
      .overrideComponent(EnterPathModalComponent, {
        remove: { imports: [TranslatePipe] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EnterPathModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not display content when not visible", () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();
    const modalContent = fixture.debugElement.query(
      By.css("#enter-path-modal-content"),
    );
    expect(modalContent).toBeNull();
  });

  it("should display content and populate initialPath when visible", () => {
    fixture.componentRef.setInput("initialPath", "/path/to/custom");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    expect(component.pathValue()).toBe("/path/to/custom");
    const inputEl = fixture.debugElement.query(By.css("input.path-input"));
    expect(inputEl).toBeTruthy();
    expect(inputEl.nativeElement.value).toBe("/path/to/custom");
  });

  it("should handle onInputChange", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const inputEl = fixture.debugElement.query(By.css("input.path-input"));
    inputEl.nativeElement.value = "/typed/folder";
    inputEl.nativeElement.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    expect(component.pathValue()).toBe("/typed/folder");
  });

  it("should emit confirm event with trimmed path on confirm", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    spyOn(component.confirm, "emit");
    component.pathValue.set("  /custom/widgets  ");
    component.onConfirm();

    expect(component.confirm.emit).toHaveBeenCalledWith("/custom/widgets");
  });

  it("should not emit confirm event when path is blank", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    spyOn(component.confirm, "emit");
    component.pathValue.set("   ");
    component.onConfirm();

    expect(component.confirm.emit).not.toHaveBeenCalled();
  });

  it("should emit cancel event on cancel", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    spyOn(component.cancel, "emit");
    component.onCancel();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should display error message when provided", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("errorMessage", "UE_ERROR_DIR_NOT_FOUND");
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css(".error-message"));
    expect(errorEl).toBeTruthy();
    expect(errorEl.nativeElement.textContent).toContain(
      "UE_ERROR_DIR_NOT_FOUND",
    );
  });

  it("should have mandatory autofill ignore attributes on the text input", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const inputEl = fixture.debugElement.query(By.css("input.path-input"));
    expect(inputEl.attributes["autocomplete"]).toBe("off");
    expect(inputEl.attributes["data-dashlane-ignore"]).toBe("true");
    expect(inputEl.attributes["data-1p-ignore"]).toBe("true");
    expect(inputEl.attributes["data-lpignore"]).toBe("true");
    expect(inputEl.attributes["data-bwignore"]).toBe("true");
    expect(inputEl.attributes["data-form-type"]).toBe("other");
  });
});
