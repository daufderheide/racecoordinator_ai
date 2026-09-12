import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { TemplateVariablesModalComponent } from "./template-variables-modal.component";

@Pipe({
  name: "translate",
  standalone: true,
})
class MockTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe("TemplateVariablesModalComponent", () => {
  let component: TemplateVariablesModalComponent;
  let fixture: ComponentFixture<TemplateVariablesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateVariablesModalComponent],
    })
      .overrideComponent(TemplateVariablesModalComponent, {
        remove: { imports: [TranslatePipe] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TemplateVariablesModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display all variables by default", () => {
    expect(component.filteredVariables().length).toBe(
      component.variables.length,
    );
  });

  it("should filter variables by category", () => {
    component.selectedCategory.set("standings");
    const filtered = component.filteredVariables();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((v) => v.category === "standings")).toBeTrue();
  });

  it("should filter variables by search query", () => {
    component.searchQuery.set("bestlap");
    const filtered = component.filteredVariables();
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every((v) => v.expression.toLowerCase().includes("bestlap")),
    ).toBeTrue();
  });

  it("should copy variable to clipboard", async () => {
    const writeTextSpy = jasmine
      .createSpy("writeText")
      .and.returnValue(Promise.resolve());
    if (!navigator.clipboard) {
      (navigator as any).clipboard = { writeText: writeTextSpy };
    } else {
      spyOn(navigator.clipboard, "writeText").and.callFake(writeTextSpy);
    }

    component.copyVariable("${driver.rank}");
    expect(writeTextSpy).toHaveBeenCalledWith("${driver.rank}");
    await Promise.resolve();
    expect(component.copiedVar()).toBe("${driver.rank}");
  });

  it("should emit close event on close button click", () => {
    spyOn(component.close, "emit");
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should emit close event on overlay click", () => {
    spyOn(component.close, "emit");
    const mockOverlay = document.createElement("div");
    mockOverlay.className = "modal-overlay";
    component.onOverlayClick({ target: mockOverlay } as any);
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should have mandatory autofill ignore attributes on search input", () => {
    const inputEl = fixture.nativeElement.querySelector(".search-input");
    expect(inputEl).toBeTruthy();
    expect(inputEl.getAttribute("autocomplete")).toBe("off");
    expect(inputEl.getAttribute("data-dashlane-ignore")).toBe("true");
    expect(inputEl.getAttribute("data-1p-ignore")).toBe("true");
    expect(inputEl.getAttribute("data-lpignore")).toBe("true");
    expect(inputEl.getAttribute("data-bwignore")).toBe("true");
    expect(inputEl.getAttribute("data-form-type")).toBe("other");
  });
});
