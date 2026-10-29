import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AudioConfig } from "@app/models/driver";

import { DriverAudioConfigComponent } from "./driver-audio-config.component";

describe("DriverAudioConfigComponent", () => {
  let component: DriverAudioConfigComponent;
  let fixture: ComponentFixture<DriverAudioConfigComponent>;

  const mockDriver: any = {
    name: "John",
    lapAudio: { type: "preset", url: "beep.wav", text: "" },
    bestLapAudio: { type: "preset", url: "best.wav", text: "" },
    penaltyAudio: { type: "preset", url: "pen.wav", text: "" },
    raceBestLapAudio: { type: "preset", url: "rb.wav", text: "" },
    raceLaneBestLapAudio: { type: "preset", url: "rlb.wav", text: "" },
    heatBestLapAudio: { type: "preset", url: "hb.wav", text: "" },
    newRaceLeaderAudio: { type: "preset", url: "nrl.wav", text: "" },
    newHeatLeaderAudio: { type: "preset", url: "nhl.wav", text: "" },
    overallBestLapAudio: { type: "preset", url: "ob.wav", text: "" },
    overallLaneBestLapAudio: { type: "preset", url: "olb.wav", text: "" },
    pitInAudio: { type: "preset", url: "pit.wav", text: "" },
    fuelAudio: { type: "audio_set", url: "fuel_set", text: "" },
    driftLapAudio: { type: "preset", url: "drift.wav", text: "" },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverAudioConfigComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverAudioConfigComponent);
    component = fixture.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  describe("Driver Mode (isOverrideMode = false)", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("driver", mockDriver);
      fixture.componentRef.setInput("isOverrideMode", false);
      fixture.detectChanges();
    });

    it("should render all 4 audio groups", () => {
      const groups = fixture.debugElement.queryAll(By.css(".audio-group"));
      expect(groups.length).toBe(4);
    });

    it("should render all 13 audio selectors", () => {
      const selectors = fixture.debugElement.queryAll(
        By.css("app-audio-selector"),
      );
      expect(selectors.length).toBe(13);
    });

    it("should not render the override toolbar in driver mode", () => {
      const toolbar = fixture.debugElement.query(
        By.css(".driver-audio-toolbar"),
      );
      expect(toolbar).toBeNull();
    });

    it("should emit driverAudioChange when a property changes", () => {
      spyOn(component.driverAudioChange, "emit");
      const lapItem = component.groups[0].items[0];

      component.onTypeChange(lapItem, "tts");
      expect(component.driverAudioChange.emit).toHaveBeenCalledWith({
        key: "lapAudio",
        field: "type",
        value: "tts",
      });

      component.onUrlChange(lapItem, "new_beep.wav");
      expect(component.driverAudioChange.emit).toHaveBeenCalledWith({
        key: "lapAudio",
        field: "url",
        value: "new_beep.wav",
      });

      component.onTextChange(lapItem, "Lap text");
      expect(component.driverAudioChange.emit).toHaveBeenCalledWith({
        key: "lapAudio",
        field: "text",
        value: "Lap text",
      });
    });
  });

  describe("Theme Override Mode (isOverrideMode = true)", () => {
    let mockOverrides: { [key: string]: AudioConfig };

    beforeEach(() => {
      mockOverrides = {
        lapAudio: { type: "preset", url: "custom_lap.wav", text: "" },
      };
      fixture.componentRef.setInput("overrides", mockOverrides);
      fixture.componentRef.setInput("isOverrideMode", true);
      fixture.detectChanges();
    });

    it("should render the override toolbar in override mode", () => {
      const toolbar = fixture.debugElement.query(
        By.css(".driver-audio-toolbar"),
      );
      expect(toolbar).not.toBeNull();
    });

    it("should correctly identify overridden items", () => {
      expect(component.isOverridden("lapAudio")).toBeTrue();
      expect(component.isOverridden("bestLapAudio")).toBeFalse();
    });

    it("should emit overrideChange when toggling an override on", () => {
      spyOn(component.overrideChange, "emit");
      const bestLapItem = component.groups[0].items[1];

      component.onToggleOverride(bestLapItem, true);
      expect(component.overrideChange.emit).toHaveBeenCalledWith({
        key: "bestLapAudio",
        config: jasmine.objectContaining({
          type: "preset",
          url: "default_driveby",
        }),
      });
    });

    it("should emit overrideChange with null when toggling an override off", () => {
      spyOn(component.overrideChange, "emit");
      const lapItem = component.groups[0].items[0];

      component.onToggleOverride(lapItem, false);
      expect(component.overrideChange.emit).toHaveBeenCalledWith({
        key: "lapAudio",
        config: null,
      });
    });

    it("should emit overrideChange when modifying overridden configuration", () => {
      spyOn(component.overrideChange, "emit");
      const lapItem = component.groups[0].items[0];

      component.onTypeChange(lapItem, "none");
      expect(component.overrideChange.emit).toHaveBeenCalledWith({
        key: "lapAudio",
        config: jasmine.objectContaining({ type: "none" }),
      });

      component.onUrlChange(lapItem, "changed_url.wav");
      expect(component.overrideChange.emit).toHaveBeenCalledWith({
        key: "lapAudio",
        config: jasmine.objectContaining({ url: "changed_url.wav" }),
      });
    });

    it("should emit resetAllOverrides when reset button is clicked", () => {
      spyOn(component.resetAllOverrides, "emit");
      component.onResetAll();
      expect(component.resetAllOverrides.emit).toHaveBeenCalled();
    });
  });
});
