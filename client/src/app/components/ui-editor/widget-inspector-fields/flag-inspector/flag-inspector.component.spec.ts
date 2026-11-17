import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { FlagInspectorComponent } from "./flag-inspector.component";

describe("FlagInspectorComponent", () => {
  let component: FlagInspectorComponent;
  let fixture: ComponentFixture<FlagInspectorComponent>;
  let changeSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, FlagInspectorComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(FlagInspectorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("settings", {
      displayMode: "image",
      backgroundColor: "",
    });

    changeSpy = spyOn(component.change, "emit");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change on onSettingsChange", () => {
    component.onSettingsChange();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    const event = {
      target: {
        value: "#ff5500",
      },
    } as any;

    component.onColorChange("backgroundColor", event);
    expect(component.settings().backgroundColor).toBe("#ff5500");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().backgroundColor = "#ffffff";
    component.resetColor("backgroundColor");
    expect(component.settings().backgroundColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should render widget border inspector component", () => {
    const borderInspector = fixture.nativeElement.querySelector(
      "app-widget-border-inspector",
    );
    expect(borderInspector).toBeTruthy();
  });

  it("should display default color placeholder when backgroundColor is empty", () => {
    const placeholder = fixture.nativeElement.querySelector(
      ".color-picker-placeholder",
    );
    expect(placeholder).toBeTruthy();
    expect(placeholder.textContent).toContain("UE_INSPECTOR_COLOR_DEFAULT");
  });

  it("should display reset button when backgroundColor is set", () => {
    component.settings().backgroundColor = "#112233";
    fixture.detectChanges();

    const resetBtn = fixture.nativeElement.querySelector(".color-reset-btn");
    expect(resetBtn).toBeTruthy();
  });
});
