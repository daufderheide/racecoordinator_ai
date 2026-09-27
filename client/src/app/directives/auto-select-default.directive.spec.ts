import { Component } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";

import { AutoSelectDefaultDirective } from "./auto-select-default.directive";

@Component({
  standalone: true,
  imports: [AutoSelectDefaultDirective, FormsModule],
  template: `
    <input
      id="test-input"
      type="text"
      [(ngModel)]="name"
      [appAutoSelectDefault]="defaultName"
    />
  `,
})
class TestHostComponent {
  name = "Driver_1";
  defaultName = "Driver_1";
}

describe("AutoSelectDefaultDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.debugElement.query(By.css("#test-input")).nativeElement;
  });

  it("should select all text on focus when input value matches defaultName", fakeAsync(() => {
    spyOn(inputEl, "select").and.callThrough();

    inputEl.dispatchEvent(new Event("focus"));
    tick(10);

    expect(inputEl.select).toHaveBeenCalled();
  }));

  it("should not select text on focus when input value differs from defaultName", fakeAsync(() => {
    host.name = "Custom Name";
    fixture.detectChanges();
    tick();

    spyOn(inputEl, "select").and.callThrough();

    inputEl.dispatchEvent(new Event("focus"));
    tick(10);

    expect(inputEl.select).not.toHaveBeenCalled();
  }));

  it("should not select text if defaultName is empty or undefined", fakeAsync(() => {
    host.defaultName = "";
    host.name = "";
    fixture.detectChanges();
    tick();

    spyOn(inputEl, "select").and.callThrough();

    inputEl.dispatchEvent(new Event("focus"));
    tick(10);

    expect(inputEl.select).not.toHaveBeenCalled();
  }));

  it("should select text on mouseup if it has not yet been selected on this focus cycle", fakeAsync(() => {
    spyOn(inputEl, "select").and.callThrough();

    inputEl.dispatchEvent(new MouseEvent("mouseup"));
    tick(10);

    expect(inputEl.select).toHaveBeenCalled();
  }));

  it("should reset selection flag on blur allowing subsequent focus to select if value still matches default", fakeAsync(() => {
    spyOn(inputEl, "select").and.callThrough();

    inputEl.dispatchEvent(new Event("focus"));
    tick(10);
    expect(inputEl.select).toHaveBeenCalledTimes(1);

    inputEl.dispatchEvent(new Event("blur"));
    tick();

    inputEl.dispatchEvent(new Event("focus"));
    tick(10);
    expect(inputEl.select).toHaveBeenCalledTimes(2);
  }));
});
