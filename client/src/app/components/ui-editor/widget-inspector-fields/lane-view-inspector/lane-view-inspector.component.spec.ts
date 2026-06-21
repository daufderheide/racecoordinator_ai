import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { LaneViewInspectorComponent } from "./lane-view-inspector.component";

describe("LaneViewInspectorComponent", () => {
  let component: LaneViewInspectorComponent;
  let fixture: ComponentFixture<LaneViewInspectorComponent>;
  let changeSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, LaneViewInspectorComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(LaneViewInspectorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("settings", {
      timeDecimalPlaces: 3,
      lapDecimalPlaces: 2,
    });

    changeSpy = spyOn(component.change, "emit");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change when settings change", () => {
    component.onSettingsChange();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should bind timeDecimalPlaces and emit change on selection", () => {
    const selectEl = fixture.nativeElement.querySelectorAll("select")[0];
    selectEl.value = "1";
    selectEl.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(Number(component.settings().timeDecimalPlaces)).toBe(1);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should bind lapDecimalPlaces and emit change on selection", () => {
    const selectEl = fixture.nativeElement.querySelectorAll("select")[1];
    selectEl.value = "0";
    selectEl.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(Number(component.settings().lapDecimalPlaces)).toBe(0);
    expect(changeSpy).toHaveBeenCalled();
  });
});
