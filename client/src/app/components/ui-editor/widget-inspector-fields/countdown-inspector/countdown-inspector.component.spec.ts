import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { CountdownInspectorComponent } from "./countdown-inspector.component";

@Pipe({
  name: "translate",
  standalone: true,
})
class MockTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe("CountdownInspectorComponent", () => {
  let component: CountdownInspectorComponent;
  let fixture: ComponentFixture<CountdownInspectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountdownInspectorComponent],
    })
      .overrideComponent(CountdownInspectorComponent, {
        remove: { imports: [TranslatePipe] },
        add: { imports: [MockTranslatePipe] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CountdownInspectorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("settings", {
      orientation: "horizontal",
      lampScale: 1.0,
      blurArea: "fullscreen",
      blurAmount: 50,
      blurCustomX: 0,
      blurCustomY: 0,
      blurCustomWidth: 1920,
      blurCustomHeight: 1080,
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate lamp scale percentage correctly", () => {
    expect(component.getLampScalePercent()).toBe(100);
    component.settings().lampScale = 1.5;
    expect(component.getLampScalePercent()).toBe(150);
  });

  it("should emit change on settings change", () => {
    spyOn(component.change, "emit");
    component.onSettingsChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should render custom area inputs with password manager ignore attributes when blurArea is custom", () => {
    component.settings().blurArea = "custom";
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll(
      "input[type='number']",
    );
    expect(inputs.length).toBe(4);

    for (const input of Array.from(inputs) as HTMLInputElement[]) {
      expect(input.getAttribute("autocomplete")).toBe("off");
      expect(input.getAttribute("data-dashlane-ignore")).toBe("true");
      expect(input.getAttribute("data-1p-ignore")).toBe("true");
      expect(input.getAttribute("data-lpignore")).toBe("true");
      expect(input.getAttribute("data-bwignore")).toBe("true");
      expect(input.getAttribute("data-form-type")).toBe("other");
    }
  });

  it("should show lamp scale slider when sizing mode is custom and hide when fit", () => {
    component.setLampSizingMode("custom");
    fixture.detectChanges();
    let slider = fixture.nativeElement.querySelector("input[max='3.0']");
    expect(slider).not.toBeNull();

    component.setLampSizingMode("fit");
    fixture.detectChanges();
    slider = fixture.nativeElement.querySelector("input[max='3.0']");
    expect(slider).toBeNull();
  });

  it("should default lampSizingMode to custom and previewLampCount to 5 when not set in settings", () => {
    expect(component.lampSizingMode).toBe("custom");
    expect(component.previewLampCount).toBe(5);
    expect(component.settings().lampSizingMode).toBe("custom");
    expect(component.settings().previewLampCount).toBe(5);

    // Verify custom selects have these values set
    const selects = fixture.nativeElement.querySelectorAll("app-custom-select");
    // selects: 0: orientation, 1: lampSizingMode, 2: previewLampCount, 3: blurArea
    expect(selects[1].getAttribute("data-value")).toBe("custom");
    expect(selects[2].getAttribute("data-value")).toBe("5");
  });

  it("should update settings and emit change when setters are invoked", () => {
    spyOn(component.change, "emit");

    component.setLampSizingMode("fit");
    expect(component.settings().lampSizingMode).toBe("fit");
    expect(component.lampSizingMode).toBe("fit");
    expect(component.change.emit).toHaveBeenCalled();

    component.setPreviewLampCount(8);
    expect(component.settings().previewLampCount).toBe(8);
    expect(component.previewLampCount).toBe(8);

    component.setOrientation("vertical");
    expect(component.settings().orientation).toBe("vertical");
    expect(component.orientation).toBe("vertical");

    component.setBlurArea("none");
    expect(component.settings().blurArea).toBe("none");
    expect(component.blurArea).toBe("none");
  });
});
