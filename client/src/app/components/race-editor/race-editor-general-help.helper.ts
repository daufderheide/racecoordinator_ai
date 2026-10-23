import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export class RaceEditorGeneralHelpHelper {
  static getGeneralBasicHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        title: translationService.translate("RE_HELP_WELCOME_TITLE"),
        content: translationService.translate("RE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: "#race-name-input",
        title: translationService.translate("RM_LABEL_NAME"),
        content: translationService.translate("RE_HELP_NAME_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#heat-rotation-select",
        title: translationService.translate("RE_HELP_HEAT_ROTATION_TITLE"),
        content: translationService.translate("RE_HELP_HEAT_ROTATION_CONTENT"),
        position: "right",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#heat-list-section",
        title: translationService.translate("RE_HELP_HEAT_LIST_TITLE"),
        content: translationService.translate("RE_HELP_HEAT_LIST_CONTENT"),
        position: "right",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#driver-count-section",
        title: translationService.translate("RE_HELP_DRIVER_COUNT_TITLE"),
        content: translationService.translate("RE_HELP_DRIVER_COUNT_CONTENT"),
        position: "right",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#track-select",
        title: translationService.translate("RM_LABEL_TRACK"),
        content: translationService.translate("RE_HELP_TRACK_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
    ];
  }
  static getGeneralAdvancedHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#theme-select",
        title: translationService.translate("RM_LABEL_THEME"),
        content: translationService.translate("RE_HELP_THEME_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#min-lap-time-input",
        title: translationService.translate("RE_HELP_MIN_LAP_TIME_TITLE"),
        content: translationService.translate("RE_HELP_MIN_LAP_TIME_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#drift-time-input",
        title: translationService.translate("RE_HELP_DRIFT_TIME_TITLE"),
        content: translationService.translate("RE_HELP_DRIFT_TIME_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#practice-input",
        title: translationService.translate("RE_HELP_PRACTICE_TITLE"),
        content: translationService.translate("RE_HELP_PRACTICE_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#adjust-drift-laps-input",
        title: translationService.translate("RE_HELP_ADJUST_DRIFT_LAPS_TITLE"),
        content: translationService.translate(
          "RE_HELP_ADJUST_DRIFT_LAPS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.general) {
            sectionsExpanded.general = true;
          }
        },
      },
    ];
  }
  static getGeneralHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      ...RaceEditorGeneralHelpHelper.getGeneralBasicHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getGeneralAdvancedHelpSteps(
        translationService,
        sectionsExpanded,
      ),
    ];
  }
  static getStartMethodTimingHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#start-time-input",
        title: translationService.translate("RE_HELP_START_TIME_TITLE"),
        content: translationService.translate("RE_HELP_START_TIME_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#restart-time-input",
        title: translationService.translate("RE_HELP_RESTART_TIME_TITLE"),
        content: translationService.translate("RE_HELP_RESTART_TIME_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#start-randomizer-input",
        title: translationService.translate("RE_HELP_START_RANDOMIZER_TITLE"),
        content: translationService.translate(
          "RE_HELP_START_RANDOMIZER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#restart-randomizer-input",
        title: translationService.translate("RE_HELP_RESTART_RANDOMIZER_TITLE"),
        content: translationService.translate(
          "RE_HELP_RESTART_RANDOMIZER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#start-behind-sensor-input",
        title: translationService.translate(
          "RE_HELP_START_BEHIND_SENSOR_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_START_BEHIND_SENSOR_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
    ];
  }
  static getStartMethodPenaltyHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#start-at-current-input",
        title: translationService.translate("RE_HELP_START_AT_CURRENT_TITLE"),
        content: translationService.translate(
          "RE_HELP_START_AT_CURRENT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#hot-start-input",
        title: translationService.translate("RE_HELP_HOT_START_TITLE"),
        content: translationService.translate("RE_HELP_HOT_START_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#restart-on-false-start-input",
        title: translationService.translate(
          "RE_HELP_RESTART_ON_FALSE_START_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_RESTART_ON_FALSE_START_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#false-start-lap-penalty-input",
        title: translationService.translate(
          "RE_HELP_FALSE_START_LAP_PENALTY_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_FALSE_START_LAP_PENALTY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#false-start-time-penalty-input",
        title: translationService.translate(
          "RE_HELP_FALSE_START_TIME_PENALTY_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_FALSE_START_TIME_PENALTY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.start_method) {
            sectionsExpanded.start_method = true;
          }
        },
      },
    ];
  }
  static getStartMethodHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      ...RaceEditorGeneralHelpHelper.getStartMethodTimingHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getStartMethodPenaltyHelpSteps(
        translationService,
        sectionsExpanded,
      ),
    ];
  }
  static getHeatScoringHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#heat-ranking-select",
        title: translationService.translate("RE_HELP_HEAT_RANKING_TITLE"),
        content: translationService.translate("RE_HELP_HEAT_RANKING_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.scoring) {
            sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#heat-tiebreaker-select",
        title: translationService.translate("RE_HELP_HEAT_TIEBREAKER_TITLE"),
        content: translationService.translate(
          "RE_HELP_HEAT_TIEBREAKER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.scoring) {
            sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#finish-method-select",
        title: translationService.translate("RE_HELP_FINISH_METHOD_TITLE"),
        content: translationService.translate("RE_HELP_FINISH_METHOD_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.scoring) {
            sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#finish-value-input",
        title: translationService.translate("RE_HELP_FINISH_VALUE_TITLE"),
        content: translationService.translate("RE_HELP_FINISH_VALUE_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.scoring) {
            sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#allow-finish-select",
        title: translationService.translate("RE_HELP_ALLOW_FINISH_TITLE"),
        content: translationService.translate("RE_HELP_ALLOW_FINISH_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.scoring) {
            sectionsExpanded.scoring = true;
          }
        },
      },
    ];
  }
  static getOverallScoringHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#overall-ranking-select",
        title: translationService.translate("RE_HELP_OVERALL_RANKING_TITLE"),
        content: translationService.translate(
          "RE_HELP_OVERALL_RANKING_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.scoring) {
            sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#overall-tiebreaker-select",
        title: translationService.translate("RE_HELP_OVERALL_TIEBREAKER_TITLE"),
        content: translationService.translate(
          "RE_HELP_OVERALL_TIEBREAKER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.scoring) {
            sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#dropped-heats-input",
        title: translationService.translate("RE_HELP_DROPPED_HEATS_TITLE"),
        content: translationService.translate("RE_HELP_DROPPED_HEATS_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.scoring) {
            sectionsExpanded.scoring = true;
          }
        },
      },
    ];
  }
  static getScoringHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      ...RaceEditorGeneralHelpHelper.getHeatScoringHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getOverallScoringHelpSteps(
        translationService,
        sectionsExpanded,
      ),
    ];
  }
  static getSeasonPointsPrimaryHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#season-position-points-section",
        title: translationService.translate(
          "RE_HELP_SEASON_POSITION_POINTS_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_POSITION_POINTS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-position-points-section",
        title: translationService.translate(
          "RE_HELP_SEASON_HEAT_POSITION_POINTS_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_HEAT_POSITION_POINTS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-overall-carry-over-input",
        title: translationService.translate(
          "RE_HELP_SEASON_OVERALL_CARRY_OVER_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_OVERALL_CARRY_OVER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-overall-fastest-lap-input",
        title: translationService.translate(
          "RE_HELP_SEASON_OVERALL_FASTEST_LAP_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_OVERALL_FASTEST_LAP_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
    ];
  }
  static getSeasonPointsSecondaryHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#season-overall-fastest-lap-lane-input",
        title: translationService.translate(
          "RE_HELP_SEASON_OVERALL_FASTEST_LAP_LANE_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_OVERALL_FASTEST_LAP_LANE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-overall-most-laps-led-input",
        title: translationService.translate(
          "RE_HELP_SEASON_OVERALL_MOST_LAPS_LED_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_OVERALL_MOST_LAPS_LED_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-overall-led-lap-input",
        title: translationService.translate(
          "RE_HELP_SEASON_OVERALL_LED_LAP_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_OVERALL_LED_LAP_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
    ];
  }
  static getSeasonPointsBonusHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#season-overall-one-bonus-input",
        title: translationService.translate(
          "RE_HELP_SEASON_OVERALL_ONE_BONUS_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_OVERALL_ONE_BONUS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-carry-over-input",
        title: translationService.translate(
          "RE_HELP_SEASON_HEAT_CARRY_OVER_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_HEAT_CARRY_OVER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-fastest-lap-input",
        title: translationService.translate(
          "RE_HELP_SEASON_HEAT_FASTEST_LAP_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_HEAT_FASTEST_LAP_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-most-laps-led-input",
        title: translationService.translate(
          "RE_HELP_SEASON_HEAT_MOST_LAPS_LED_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_HEAT_MOST_LAPS_LED_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-led-lap-input",
        title: translationService.translate(
          "RE_HELP_SEASON_HEAT_LED_LAP_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_HEAT_LED_LAP_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-one-bonus-input",
        title: translationService.translate(
          "RE_HELP_SEASON_HEAT_ONE_BONUS_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_SEASON_HEAT_ONE_BONUS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.season_points) {
            sectionsExpanded.season_points = true;
          }
        },
      },
    ];
  }
  static getSeasonPointsHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      ...RaceEditorGeneralHelpHelper.getSeasonPointsPrimaryHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getSeasonPointsSecondaryHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getSeasonPointsBonusHelpSteps(
        translationService,
        sectionsExpanded,
      ),
    ];
  }
  static getHeatsHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#auto-advance-time-input",
        title: translationService.translate("RE_HELP_AUTO_ADVANCE_TIME_TITLE"),
        content: translationService.translate(
          "RE_HELP_AUTO_ADVANCE_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.heats) {
            sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#auto-advance-warmup-time-input",
        title: translationService.translate(
          "RE_HELP_AUTO_ADVANCE_COOLDOWN_TIME_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_AUTO_ADVANCE_COOLDOWN_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.heats) {
            sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#auto-start-time-input",
        title: translationService.translate("RE_HELP_AUTO_START_TIME_TITLE"),
        content: translationService.translate(
          "RE_HELP_AUTO_START_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.heats) {
            sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#auto-start-warmup-time-input",
        title: translationService.translate(
          "RE_HELP_AUTO_START_WARMUP_TIME_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_AUTO_START_WARMUP_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.heats) {
            sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#heat-times-through-input",
        title: translationService.translate("RE_HELP_HEAT_TIMES_THROUGH_TITLE"),
        content: translationService.translate(
          "RE_HELP_HEAT_TIMES_THROUGH_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.heats) {
            sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#reverse-heats-input",
        title: translationService.translate("RE_HELP_REVERSE_HEATS_TITLE"),
        content: translationService.translate("RE_HELP_REVERSE_HEATS_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.heats) {
            sectionsExpanded.heats = true;
          }
        },
      },
    ];
  }
  static getGroupsBasicHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#groups-enabled-input",
        title: translationService.translate("RE_HELP_GROUPS_ENABLED_TITLE"),
        content: translationService.translate("RE_HELP_GROUPS_ENABLED_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.groups) {
            sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-max-input",
        title: translationService.translate("RE_HELP_GROUPS_MAX_TITLE"),
        content: translationService.translate("RE_HELP_GROUPS_MAX_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.groups) {
            sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-balance-input",
        title: translationService.translate("RE_HELP_GROUPS_BALANCE_TITLE"),
        content: translationService.translate("RE_HELP_GROUPS_BALANCE_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.groups) {
            sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-allow-empty-input",
        title: translationService.translate("RE_HELP_GROUPS_ALLOW_EMPTY_TITLE"),
        content: translationService.translate(
          "RE_HELP_GROUPS_ALLOW_EMPTY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.groups) {
            sectionsExpanded.groups = true;
          }
        },
      },
    ];
  }
  static getGroupsAdvancingHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#groups-force-multiple-input",
        title: translationService.translate(
          "RE_HELP_GROUPS_FORCE_MULTIPLE_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_GROUPS_FORCE_MULTIPLE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.groups) {
            sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-rotate-heats-input",
        title: translationService.translate(
          "RE_HELP_GROUPS_ROTATE_HEATS_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_GROUPS_ROTATE_HEATS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.groups) {
            sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-min-advancing-input",
        title: translationService.translate(
          "RE_HELP_GROUPS_MIN_ADVANCING_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_GROUPS_MIN_ADVANCING_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.groups) {
            sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-names-section",
        title: translationService.translate("RE_HELP_GROUPS_NAMES_TITLE"),
        content: translationService.translate("RE_HELP_GROUPS_NAMES_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.groups) {
            sectionsExpanded.groups = true;
          }
        },
      },
    ];
  }
  static getGroupsHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      ...RaceEditorGeneralHelpHelper.getGroupsBasicHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorGeneralHelpHelper.getGroupsAdvancingHelpSteps(
        translationService,
        sectionsExpanded,
      ),
    ];
  }
  static getTeamOptionsHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#team-pit-stop-change-driver-input",
        title: translationService.translate(
          "RE_HELP_TEAM_PIT_STOP_CHANGE_DRIVER_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_TEAM_PIT_STOP_CHANGE_DRIVER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.team) {
            sectionsExpanded.team = true;
          }
        },
      },
      {
        selector: "#team-heat-lap-limit-input",
        title: translationService.translate(
          "RE_HELP_TEAM_HEAT_LAP_LIMIT_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_TEAM_HEAT_LAP_LIMIT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.team) {
            sectionsExpanded.team = true;
          }
        },
      },
      {
        selector: "#team-heat-time-limit-input",
        title: translationService.translate(
          "RE_HELP_TEAM_HEAT_TIME_LIMIT_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_TEAM_HEAT_TIME_LIMIT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.team) {
            sectionsExpanded.team = true;
          }
        },
      },
      {
        selector: "#team-overall-lap-limit-input",
        title: translationService.translate(
          "RE_HELP_TEAM_OVERALL_LAP_LIMIT_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_TEAM_OVERALL_LAP_LIMIT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.team) {
            sectionsExpanded.team = true;
          }
        },
      },
      {
        selector: "#team-overall-time-limit-input",
        title: translationService.translate(
          "RE_HELP_TEAM_OVERALL_TIME_LIMIT_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_TEAM_OVERALL_TIME_LIMIT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.team) {
            sectionsExpanded.team = true;
          }
        },
      },
    ];
  }
}
