import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { ReplicateLaneDialogComponent } from "./replicate-lane-dialog.component";

@Pipe({
  name: "translate",
  standalone: true,
})
class MockTranslatePipe implements PipeTransform {
  transform(key: string, _params?: any): string {
    return key;
  }
}

describe("ReplicateLaneDialogComponent", () => {
  let component: ReplicateLaneDialogComponent;
  let fixture: ComponentFixture<ReplicateLaneDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplicateLaneDialogComponent],
    })
      .overrideComponent(ReplicateLaneDialogComponent, {
        remove: { imports: [TranslatePipe] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReplicateLaneDialogComponent);
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
      By.css("#replicate-lane-modal-content"),
    );
    expect(modalContent).toBeNull();
  });

  it("should display content when visible", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("bindingMode", "lane");
    fixture.componentRef.setInput("sourceIndex", 0);
    fixture.detectChanges();

    const modalContent = fixture.debugElement.query(
      By.css("#replicate-lane-modal-content"),
    );
    expect(modalContent).toBeTruthy();
  });

  it("should update targetCount when defaultCount changes while visible", () => {
    fixture.componentRef.setInput("defaultCount", 6);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    expect(component.targetCount()).toBe(6);
  });

  it("should emit cancel on onCancel()", () => {
    spyOn(component.cancel, "emit");
    component.onCancel();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should emit cancel on Escape key when visible", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
    spyOn(component.cancel, "emit");

    component.onEscape();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should emit cancel on backdrop click", () => {
    spyOn(component.cancel, "emit");
    const fakeEvent = {
      target: { id: "replicate-lane-modal-backdrop" },
    } as unknown as MouseEvent;
    component.onBackdropClick(fakeEvent);
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should not emit cancel when clicking inside modal content", () => {
    spyOn(component.cancel, "emit");
    const fakeEvent = {
      target: { id: "replicate-lane-modal-content" },
    } as unknown as MouseEvent;
    component.onBackdropClick(fakeEvent);
    expect(component.cancel.emit).not.toHaveBeenCalled();
  });

  it("should emit confirm with correct options on onConfirm()", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("sourceIndex", 1);
    fixture.componentRef.setInput("bindingMode", "position");
    component.direction.set("vertical");
    component.targetCount.set(4);
    component.distributionMode.set("preserve-spacing");
    component.replaceExisting.set(false);
    fixture.detectChanges();

    spyOn(component.confirm, "emit");
    component.onConfirm();

    expect(component.confirm.emit).toHaveBeenCalledWith({
      direction: "vertical",
      targetCount: 4,
      distributionMode: "preserve-spacing",
      replaceExisting: false,
      sourceIndex: 1,
      sourceBindingMode: "position",
    });
  });

  it("should toggle replaceExisting when checkbox is toggled", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    expect(component.replaceExisting()).toBeTrue();
    const checkbox = fixture.debugElement.query(By.css("input.form-checkbox"));
    checkbox.nativeElement.click();
    fixture.detectChanges();

    expect(component.replaceExisting()).toBeFalse();
  });
});
