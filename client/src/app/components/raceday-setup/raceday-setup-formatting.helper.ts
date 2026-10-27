import { getThemeDisplayNameKey as getThemeKey } from "@app/components/ui-editor/ui-editor-crud.helper";
import { Race } from "@app/models/race";
import { TranslationService } from "@app/services/translation.service";
import { getContrastColor as utilsGetContrastColor } from "@app/utils/color.utils";

export function formatEnumDisplay(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getHeatRotationTypeDisplay(
  type: string | undefined,
  translationService: TranslationService,
): string {
  if (!type) return "";
  const key = `RE_ROTATION_${type
    .replace(/([A-Z])/g, "_$1")
    .toUpperCase()
    .replace(/^_/, "")}`;
  const translated = translationService.translate(key);
  return translated && translated !== key
    ? translated
    : type.replace(/([A-Z])/g, " $1").trim();
}

export function isPracticeRace(race: any): boolean {
  return !!(race?.practice || race?.heat_rotation_type === "Practice");
}

export function getHeatRankingDisplay(
  race: any,
  translationService: TranslationService,
): string {
  if (isPracticeRace(race)) {
    return translationService.translate("GEN_UNRANKED");
  }
  return formatEnumDisplay(race?.heat_scoring?.heat_ranking);
}

export function getOverallRankingDisplay(
  race: any,
  translationService: TranslationService,
): string {
  if (isPracticeRace(race)) {
    return translationService.translate("GEN_UNRANKED");
  }
  return formatEnumDisplay(race?.overall_scoring?.ranking_method);
}

export function getFinishValueDisplay(
  race: any,
  translationService: TranslationService,
): string {
  const val = race?.heat_scoring?.finish_value;
  if (val === 0 || val === "0") {
    return translationService.translate("GEN_INFINITE");
  }
  return val !== undefined && val !== null ? String(val) : "";
}

export function getThemeDisplayNameKey(
  theme: any,
  translationService: TranslationService,
): string {
  if (!theme) return "";
  return getThemeKey(theme, translationService);
}

export function getThemeDisplay(
  race: any,
  themes: any[],
  translationService: TranslationService,
): string {
  const themeList = themes || [];
  const defaultTheme = themeList.find(
    (t) => t.is_default || t.entity_id === "default_classic_rc_ai",
  );
  const themeId =
    race?.theme_id || defaultTheme?.entity_id || "default_classic_rc_ai";
  const theme = themeList.find(
    (t) => (t.entity_id || (t as any).id || (t as any)._id) === themeId,
  );
  if (theme) {
    const key = getThemeDisplayNameKey(theme, translationService);
    return translationService.translate(key) || theme.name || themeId;
  }
  if (themeId === "default_classic_rc_ai") {
    return translationService.translate("UE_LABEL_DEFAULT_THEME") || "Default";
  }
  if (themeId === "practice_theme_rc_ai") {
    return (
      translationService.translate("UE_LABEL_PRACTICE_THEME") || "Practice"
    );
  }
  if (themeId === "default_fuel_theme_rc_ai") {
    return translationService.translate("UE_LABEL_FUEL_THEME") || "Fuel";
  }
  return themeId;
}

export function isHandsFree(race?: any): boolean {
  if (!race) {
    return false;
  }
  return (race.auto_advance_time ?? 0) > 0 && (race.auto_start_time ?? 0) > 0;
}

export function hasWarmup(race?: any): boolean {
  if (!race) {
    return false;
  }
  return (
    (race.auto_advance_warmup_time ?? 0) > 0 ||
    (race.auto_start_warmup_time ?? 0) > 0
  );
}

export function getItemRaceId(item: any): string {
  if (!item) return "";
  return item.raceId || item.race_id || "";
}

export function getItemMaxDrivers(item: any): number {
  if (!item) return 0;
  return item.maxDrivers !== undefined
    ? item.maxDrivers
    : item.max_drivers !== undefined
      ? item.max_drivers
      : 0;
}

export function getRaceFinishMethod(raceId: string, races: Race[]): string {
  const race: any = races.find((rc) => rc.entity_id === raceId);
  if (!race) return "";
  const fm =
    race.heat_scoring?.finish_method || race.heat_scoring?.finishMethod;
  return formatEnumDisplay(fm);
}

export function getRaceFinishValue(
  raceId: string,
  races: Race[],
  translationService: TranslationService,
): string {
  const race: any = races.find((rc) => rc.entity_id === raceId);
  if (!race) return "";
  const val =
    race.heat_scoring?.finish_value !== undefined
      ? race.heat_scoring?.finish_value
      : race.heat_scoring?.finishValue;
  if (val === 0 || val === "0") {
    return translationService.translate("GEN_INFINITE");
  }
  return val !== undefined && val !== null ? String(val) : "";
}

export function getEventDriverLimitWarning(
  event: any,
  selectedParticipantsCount: number,
  races: Race[],
  translationService: TranslationService,
): string | null {
  if (event && event.races && event.races.length > 0) {
    const race0 = event.races[0];
    const maxDrivers = getItemMaxDrivers(race0);
    const raceId = getItemRaceId(race0);
    if (maxDrivers > 0 && selectedParticipantsCount > maxDrivers) {
      const r = races.find((rc) => rc.entity_id === raceId);
      const raceName = r ? r.name : raceId;
      return (
        translationService.translate("RDS_EVENT_WARNING_LIMIT", {
          limit: maxDrivers,
          raceName: raceName,
        }) ||
        `Warning: Only the top ${maxDrivers} drivers will participate in ${raceName}.`
      );
    }
  }
  return null;
}

export function getStartRaceTooltip(
  hasSelectedParticipants: boolean,
  translationService: TranslationService,
): string {
  if (hasSelectedParticipants) return "";
  return translationService.translate("RDS_START_RACE_TOOLTIP");
}

export function getRaceCardBackgroundClass(index: number): string {
  const backgrounds = ["card-bg-gp", "card-bg-tt"];
  return backgrounds[index % backgrounds.length];
}

export function getContrastColor(color: string | undefined): string {
  return utilsGetContrastColor(color);
}
