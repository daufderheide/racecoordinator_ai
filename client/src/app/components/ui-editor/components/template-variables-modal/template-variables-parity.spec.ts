import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CustomWidgetBaseComponent } from "@app/components/shared/custom-widget-base/custom-widget-base.component";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
import {
  createTTSContext,
  interpolate,
  mockTTSContext,
} from "@app/utils/audio";

import { TEMPLATE_VARIABLES } from "./template-variables.data";

@Component({
  standalone: true,
  template: `<div></div>`,
})
class TestCustomWidgetComponent extends CustomWidgetBaseComponent {}

describe("Template & Telemetry Variable Parity (XLS, Raceday UI, TTS)", () => {
  let fixture: ComponentFixture<TestCustomWidgetComponent>;
  let component: TestCustomWidgetComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestCustomWidgetComponent],
    });
    fixture = TestBed.createComponent(TestCustomWidgetComponent);
    component = fixture.componentInstance;
  });

  describe("Syntax Interoperability (${...} and {...})", () => {
    it("should resolve identical values for both {...} and ${...} across all core variables", () => {
      const driver = new Driver("d1", "Mario", "Mario");
      const participant = new RaceParticipant(
        "p1",
        driver,
        1,
        15,
        45.123,
        3.001,
        3.008,
        3.008,
        15,
        1,
        100,
        0.5,
      );

      const heatDriver = new DriverHeatData(
        "hd1",
        participant as any,
        0,
        driver,
      );
      heatDriver.addLapTime(1, 3.01, 3.01, 3.01, 3.001, 15);

      fixture.componentRef.setInput("parent", {
        race: { name: "Mushroom Cup" },
        track: { name: "Rainbow Road" },
        participants: [participant],
        sortedHeatDrivers: [heatDriver],
      });
      fixture.detectChanges();

      const standing = component.driverStandings[0];
      const context = {
        driver: standing,
        race: { name: component.raceName },
        track: { name: component.trackName },
      };

      const testBindings = [
        ["{driver.name}", "${driver.name}"],
        ["{driver.totalLaps}", "${driver.totalLaps}"],
        ["{driver.totalTime}", "${driver.totalTime}"],
        ["{driver.bestLapTime}", "${driver.bestLapTime}"],
        ["{driver.lastLapTime}", "${driver.lastLapTime}"],
        ["{driver.averageLapTime}", "${driver.averageLapTime}"],
        ["{driver.medianLapTime}", "${driver.medianLapTime}"],
        ["{race.name}", "${race.name}"],
        ["{track.name}", "${track.name}"],
      ];

      for (const [curly, dollarCurly] of testBindings) {
        const curlyResult = component.interpolate(curly, context);
        const dollarResult = component.interpolate(dollarCurly, context);
        expect(curlyResult)
          .withContext(`Mismatch for ${curly} vs ${dollarCurly}`)
          .toBe(dollarResult);
        expect(curlyResult)
          .withContext(`Expected ${curly} to resolve a value`)
          .not.toContain("{");
      }
    });
  });

  describe("Domain & Telemetry Property Parity in CustomWidgetBaseComponent", () => {
    it("should populate all unified camelCase telemetry fields in driverStandings", () => {
      const driver = new Driver("d1", "Luigi", "Luigi");
      const p = new RaceParticipant(
        "p1",
        driver,
        2,
        10,
        32.456,
        3.123,
        3.245,
        3.245,
        10,
        2,
        100,
        1.25,
        1.25,
      );
      const hd = new DriverHeatData("hd1", p as any, 0, driver);
      hd.addLapTime(1, 3.25, 3.25, 3.25, 3.123, 10);

      fixture.componentRef.setInput("parent", {
        participants: [p],
        sortedHeatDrivers: [hd],
      });
      fixture.detectChanges();

      const d = component.driverStandings[0];
      expect(d.name).toBe("Luigi");
      expect(d.totalLaps).toBe(10);
      expect(d.totalTime).toBe(32.456);
      expect(d.bestLapTime).toBe(3.123);
      expect(d.lastLapTime).toBe(3.25);
      expect(d.averageLapTime).toBe(3.245);
      expect(d.medianLapTime).toBe(3.245);
      expect(d.gapLeader).toBe(1.25);
      expect(d.gapPosition).toBe(1.25);
      expect(d.lane).toBe(1);

      // Verify legacy snake_case properties have been eliminated
      expect((d as any).best_lap_time).toBeUndefined();
      expect((d as any).last_lap_time).toBeUndefined();
      expect((d as any).avg_lap_time).toBeUndefined();
      expect((d as any).total_time).toBeUndefined();
      expect((d as any).gap_leader).toBeUndefined();
      expect((d as any).gap_position).toBeUndefined();
    });
  });

  describe("TTS Context Parity", () => {
    it("should provide consistent camelCase properties matching XLS & UI telemetry", () => {
      const driver = { name: "Peach", nickname: "Princess" };
      const telemetry = {
        lastLapTime: 3.456,
        bestLapTime: 3.21,
        averageLapTime: 3.33,
        medianLapTime: 3.3,
        totalLaps: 12,
        totalTime: 40.0,
        gapLeader: 0.8,
        gapPosition: 0.3,
      };
      const context = createTTSContext(
        driver,
        telemetry,
        { name: "Grand Prix" },
        { name: "Choco Mountain" },
      );

      expect(context.driver.name).toBe("Peach");
      expect(context.driver.driver.name).toBe("Peach");
      expect(context.driver.bestLapTime).toBe(3.21);
      expect(context.driver.lastLapTime).toBe(3.456);
      expect(context.driver.averageLapTime).toBe(3.33);
      expect(context.driver.medianLapTime).toBe(3.3);
      expect(context.driver.totalLaps).toBe(12);
      expect(context.driver.totalTime).toBe(40.0);
      expect(context.driver.gapLeader).toBe(0.8);
      expect(context.driver.gapPosition).toBe(0.3);

      const ttsMessage1 = interpolate(
        "Fast lap for {driver.nickname}: {driver.bestLapTime}",
        context,
      );
      const ttsMessage2 = interpolate(
        "Fast lap for ${driver.nickname}: ${driver.bestLapTime}",
        context,
      );
      expect(ttsMessage1).toBe("Fast lap for Princess: 3.210");
      expect(ttsMessage2).toBe(ttsMessage1);
    });

    it("should format mockTTSContext cleanly for preview", () => {
      const mock = mockTTSContext();
      expect(mock.driver.totalLaps).toBeDefined();
      expect(mock.driver.totalTime).toBeDefined();
      expect(mock.driver.bestLapTime).toBeDefined();
      expect(mock.driver.averageLapTime).toBeDefined();
      expect(mock.driver.medianLapTime).toBeDefined();
      expect(mock.driver.driver.name).toBe(mock.driver.name);
    });
  });

  describe("TEMPLATE_VARIABLES Catalog Integrity", () => {
    it("should have valid syntax for every catalog variable", () => {
      for (const v of TEMPLATE_VARIABLES) {
        expect(v.expression).toMatch(/^\$\{([a-zA-Z0-9_.()[\]]+)\}$/);
        expect(v.type).toBeTruthy();
        expect(v.categoryKey).toBeTruthy();
        expect(v.descriptionKey).toBeTruthy();
      }
    });
  });
});
