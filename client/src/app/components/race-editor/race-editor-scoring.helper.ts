import { Track } from "@app/models/track";
import { TranslationService } from "@app/services/translation.service";

export class RaceEditorScoringHelper {
  static syncHeatScoringProperties(editingRace: any): void {
    if (!editingRace?.heat_scoring) return;
    const hs = editingRace.heat_scoring;
    const allowFinish = hs.allow_finish ?? hs.allowFinish ?? "None";
    hs.allow_finish = allowFinish;
    hs.allowFinish = allowFinish;
    const finishMethod = hs.finish_method ?? hs.finishMethod ?? "Lap";
    hs.finish_method = finishMethod;
    hs.finishMethod = finishMethod;
    const finishValue = hs.finish_value ?? hs.finishValue ?? 10;
    hs.finish_value = finishValue;
    hs.finishValue = finishValue;
    const heatRanking = hs.heat_ranking ?? hs.heatRanking ?? "LAP_COUNT";
    hs.heat_ranking = heatRanking;
    hs.heatRanking = heatRanking;
    const tiebreaker =
      hs.heat_ranking_tiebreaker ??
      hs.heatRankingTiebreaker ??
      "FASTEST_LAP_TIME";
    hs.heat_ranking_tiebreaker = tiebreaker;
    hs.heatRankingTiebreaker = tiebreaker;
  }

  static validateHeatConfigurations(editingRace: any): void {
    if (!editingRace) return;
    if (
      editingRace.heat_times_through === null ||
      editingRace.heat_times_through < 1
    ) {
      editingRace.heat_times_through = 1;
    }
  }

  static validateWarmupTimes(editingRace: any): void {
    if (!editingRace) return;

    if (editingRace.auto_advance_warmup_time > editingRace.auto_advance_time) {
      editingRace.auto_advance_warmup_time = editingRace.auto_advance_time;
    }

    if (editingRace.auto_start_warmup_time > editingRace.auto_start_time) {
      editingRace.auto_start_warmup_time = editingRace.auto_start_time;
    }
  }

  static hasDigitalFuel(editingRace: any, tracks: Track[]): boolean {
    if (!editingRace?.track_entity_id || !tracks) return false;
    const track = tracks.find(
      (t) => t.entity_id === editingRace.track_entity_id,
    );
    if (!track) return false;

    if (typeof track.hasDigitalFuel === "function") {
      return track.hasDigitalFuel();
    }
    return !!(track as any).has_digital_fuel;
  }

  static enforceFuelRules(editingRace: any, tracks: Track[]): void {
    if (!editingRace) return;

    if (this.hasDigitalFuel(editingRace, tracks)) {
      if (editingRace.fuel_options?.enabled) {
        editingRace.fuel_options.enabled = false;
      }
    } else {
      if (editingRace.digital_fuel_options?.enabled) {
        editingRace.digital_fuel_options.enabled = false;
      }
    }
  }

  static getAnalogFuelTooltip(
    editingRace: any,
    tracks: Track[],
    translationService: TranslationService,
  ): string {
    if (this.hasDigitalFuel(editingRace, tracks)) {
      return translationService.translate("RE_ANALOG_FUEL_DISABLED_TOOLTIP");
    }
    return "";
  }

  static getDigitalFuelTooltip(
    editingRace: any,
    tracks: Track[],
    translationService: TranslationService,
  ): string {
    if (!this.hasDigitalFuel(editingRace, tracks)) {
      return translationService.translate("RE_DIGITAL_FUEL_DISABLED_TOOLTIP");
    }
    return "";
  }

  static addSeasonPositionPoint(
    editingRace: any,
    captureState: () => void,
    scrollFn?: () => void,
  ): void {
    if (!editingRace) return;
    if (!editingRace.season_scoring) {
      editingRace.season_scoring = {
        position_points: [],
        heat_position_points: [],
      };
    }
    if (!editingRace.season_scoring.position_points) {
      editingRace.season_scoring.position_points = [];
    }
    editingRace.season_scoring.position_points.push(0);
    captureState();
    if (scrollFn) {
      scrollFn();
    }
  }

  static removeSeasonPositionPoint(
    editingRace: any,
    index: number,
    captureState: () => void,
  ): void {
    if (
      !editingRace ||
      !editingRace.season_scoring ||
      !editingRace.season_scoring.position_points
    )
      return;
    editingRace.season_scoring.position_points.splice(index, 1);
    captureState();
  }

  static syncHeatPositionPoints(editingRace: any, tracks: Track[]): void {
    if (!editingRace) return;
    if (!editingRace.season_scoring) {
      editingRace.season_scoring = {
        position_points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
        heat_position_points: [],
      };
    }
    if (!Array.isArray(editingRace.season_scoring.heat_position_points)) {
      editingRace.season_scoring.heat_position_points = [];
    }

    const track = (tracks || []).find(
      (t) => t.entity_id === editingRace?.track_entity_id,
    );
    if (!track) return;

    const laneCount = track.lanes ? track.lanes.length : 0;
    const currentPoints = editingRace.season_scoring.heat_position_points;

    if (currentPoints.length === 0 && laneCount > 0) {
      const defaultPoints = [3, 2, 1, 0];
      const initialPoints = defaultPoints.slice(0, laneCount);
      while (initialPoints.length < laneCount) {
        initialPoints.push(0);
      }
      editingRace.season_scoring.heat_position_points = initialPoints;
    } else if (currentPoints.length < laneCount) {
      while (currentPoints.length < laneCount) {
        currentPoints.push(0);
      }
    } else if (currentPoints.length > laneCount) {
      editingRace.season_scoring.heat_position_points = currentPoints.slice(
        0,
        laneCount,
      );
    }
  }
}
