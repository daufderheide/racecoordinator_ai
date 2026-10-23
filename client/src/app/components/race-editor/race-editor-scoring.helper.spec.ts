import { Track } from "@app/models/track";

import { RaceEditorScoringHelper } from "./race-editor-scoring.helper";

describe("RaceEditorScoringHelper", () => {
  let mockEditingRace: any;
  let mockTracks: Track[];
  let mockTranslationService: any;

  beforeEach(() => {
    mockEditingRace = {
      heat_scoring: {
        finish_method: "Lap",
        finish_value: 10,
      },
      heat_times_through: 0,
      auto_advance_warmup_time: 15,
      auto_advance_time: 10,
      auto_start_warmup_time: 20,
      auto_start_time: 10,
      track_entity_id: "t1",
      fuel_options: { enabled: true },
      digital_fuel_options: { enabled: true },
      season_scoring: {
        position_points: [10, 8, 6],
        heat_position_points: [3, 2],
      },
    };
    mockTracks = [
      new Track({
        entity_id: "t1",
        name: "Test Track",
        has_digital_fuel: false,
        lanes: [{}, {}, {}, {}] as any,
      }),
      new Track({
        entity_id: "t2_digital",
        name: "Digital Track",
        has_digital_fuel: true,
        lanes: [{}, {}] as any,
      }),
    ];
    mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((k: string) => k),
    };
  });

  describe("Validation", () => {
    it("should sync heat scoring properties between snake and camel", () => {
      RaceEditorScoringHelper.syncHeatScoringProperties(mockEditingRace);
      expect(mockEditingRace.heat_scoring.allowFinish).toBe("None");
      expect(mockEditingRace.heat_scoring.finishMethod).toBe("Lap");
      expect(mockEditingRace.heat_scoring.heatRanking).toBe("LAP_COUNT");
    });

    it("should clamp heat times through to at least 1", () => {
      RaceEditorScoringHelper.validateHeatConfigurations(mockEditingRace);
      expect(mockEditingRace.heat_times_through).toBe(1);
    });

    it("should clamp warmup times to main times", () => {
      RaceEditorScoringHelper.validateWarmupTimes(mockEditingRace);
      expect(mockEditingRace.auto_advance_warmup_time).toBe(10);
      expect(mockEditingRace.auto_start_warmup_time).toBe(10);
    });
  });

  describe("Fuel Rules & Tooltips", () => {
    it("should detect digital fuel based on track", () => {
      expect(
        RaceEditorScoringHelper.hasDigitalFuel(mockEditingRace, mockTracks),
      ).toBeFalse();

      mockEditingRace.track_entity_id = "t2_digital";
      expect(
        RaceEditorScoringHelper.hasDigitalFuel(mockEditingRace, mockTracks),
      ).toBeTrue();
    });

    it("should enforce fuel rules disabling inapplicable fuel options", () => {
      mockEditingRace.track_entity_id = "t1"; // Analog
      RaceEditorScoringHelper.enforceFuelRules(mockEditingRace, mockTracks);
      expect(mockEditingRace.fuel_options.enabled).toBeTrue();
      expect(mockEditingRace.digital_fuel_options.enabled).toBeFalse();

      mockEditingRace.track_entity_id = "t2_digital"; // Digital
      mockEditingRace.digital_fuel_options.enabled = true;
      RaceEditorScoringHelper.enforceFuelRules(mockEditingRace, mockTracks);
      expect(mockEditingRace.fuel_options.enabled).toBeFalse();
      expect(mockEditingRace.digital_fuel_options.enabled).toBeTrue();
    });

    it("should provide tooltips based on track digital fuel capability", () => {
      mockEditingRace.track_entity_id = "t1";
      expect(
        RaceEditorScoringHelper.getAnalogFuelTooltip(
          mockEditingRace,
          mockTracks,
          mockTranslationService,
        ),
      ).toBe("");
      expect(
        RaceEditorScoringHelper.getDigitalFuelTooltip(
          mockEditingRace,
          mockTracks,
          mockTranslationService,
        ),
      ).toBe("RE_DIGITAL_FUEL_DISABLED_TOOLTIP");

      mockEditingRace.track_entity_id = "t2_digital";
      expect(
        RaceEditorScoringHelper.getAnalogFuelTooltip(
          mockEditingRace,
          mockTracks,
          mockTranslationService,
        ),
      ).toBe("RE_ANALOG_FUEL_DISABLED_TOOLTIP");
      expect(
        RaceEditorScoringHelper.getDigitalFuelTooltip(
          mockEditingRace,
          mockTracks,
          mockTranslationService,
        ),
      ).toBe("");
    });
  });

  describe("Season Scoring", () => {
    it("should add season position point and trigger capture & scroll", () => {
      const captureSpy = jasmine.createSpy("captureState");
      const scrollSpy = jasmine.createSpy("scroll");
      RaceEditorScoringHelper.addSeasonPositionPoint(
        mockEditingRace,
        captureSpy,
        scrollSpy,
      );
      expect(mockEditingRace.season_scoring.position_points.length).toBe(4);
      expect(captureSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalled();
    });

    it("should remove season position point and trigger capture", () => {
      const captureSpy = jasmine.createSpy("captureState");
      RaceEditorScoringHelper.removeSeasonPositionPoint(
        mockEditingRace,
        1,
        captureSpy,
      );
      expect(mockEditingRace.season_scoring.position_points).toEqual([10, 6]);
      expect(captureSpy).toHaveBeenCalled();
    });

    it("should sync heat position points to track lane count", () => {
      mockEditingRace.track_entity_id = "t1"; // 4 lanes
      mockEditingRace.season_scoring.heat_position_points = [5, 4];
      RaceEditorScoringHelper.syncHeatPositionPoints(
        mockEditingRace,
        mockTracks,
      );
      expect(mockEditingRace.season_scoring.heat_position_points.length).toBe(
        4,
      );
      expect(mockEditingRace.season_scoring.heat_position_points).toEqual([
        5, 4, 0, 0,
      ]);

      mockEditingRace.track_entity_id = "t2_digital"; // 2 lanes
      RaceEditorScoringHelper.syncHeatPositionPoints(
        mockEditingRace,
        mockTracks,
      );
      expect(mockEditingRace.season_scoring.heat_position_points.length).toBe(
        2,
      );
      expect(mockEditingRace.season_scoring.heat_position_points).toEqual([
        5, 4,
      ]);
    });
  });
});
