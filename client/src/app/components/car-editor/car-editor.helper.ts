import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
import { Car, CAR_TEXT_FIELDS } from "@app/models/car";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";
import { isEntityNameUnique } from "@app/utils/editor-utils";
import { naturalSortCompare } from "@app/utils/sorting.utils";

export function cloneCar(car: Car): Car {
  return new Car(car.entity_id, car.name, {
    avatarUrl: car.avatarUrl,
    brand: car.brand,
    carClass: car.carClass,
    scale: car.scale,
    motor: car.motor,
    magnet: car.magnet,
    chassis: car.chassis,
    gears: car.gears,
    tyres: car.tyres,
    modified: car.modified,
    notes: car.notes,
  });
}

export function areCarsEqual(a: Car, b: Car): boolean {
  if (a.name !== b.name) return false;
  if ((a.avatarUrl || "") !== (b.avatarUrl || "")) return false;
  if (a.scale !== b.scale) return false;
  if (a.modified !== b.modified) return false;
  return CAR_TEXT_FIELDS.every((f) => a[f] === b[f]);
}

/** "Base", or "Base_1", "Base_2" ... when the name is taken (or forced). */
export function generateUniqueCarName(
  baseName: string,
  allCars: Car[],
  forceSuffix: boolean = false,
): string {
  let counter = forceSuffix ? 1 : 0;
  const base = (baseName || "").replace(/(_\d+)$/, "").trim();
  while (true) {
    const candidate = counter === 0 ? base : `${base}_${counter}`;
    if (
      !allCars.some((c) => c.name.toLowerCase() === candidate.toLowerCase())
    ) {
      return candidate;
    }
    counter++;
  }
}

/**
 * The classes already used on other cars, for the Class suggestions: each
 * spelling once (first one wins, ignoring case), sorted.
 */
export function getKnownCarClasses(allCars: Car[]): string[] {
  const seen = new Map<string, string>();
  for (const car of allCars) {
    const cls = (car.carClass || "").trim();
    if (cls && !seen.has(cls.toLowerCase())) {
      seen.set(cls.toLowerCase(), cls);
    }
  }
  return [...seen.values()].sort(naturalSortCompare);
}

export function resolveCarImageUrl(
  url?: string,
  dataService?: { serverUrl?: string; resolveAssetUrl?: (u: string) => string },
): string {
  if (!url) return "assets/images/default_avatar.svg";
  const resolved = dataService?.resolveAssetUrl
    ? dataService.resolveAssetUrl(url)
    : url;
  if (resolved && resolved.startsWith("/")) {
    return `${dataService?.serverUrl || ""}${resolved}`;
  }
  return resolved;
}

export function getCarUnsavedReasons(
  editingCar: Car | undefined,
  allCars: Car[],
  isSaving: boolean,
  isDirtyState: boolean,
): string[] {
  const reasons: string[] = [];
  if (!editingCar) return reasons;

  if (!(editingCar.name?.trim() || "")) {
    reasons.push("DISCARD_REASON_CAR_NAME_EMPTY");
  } else if (
    !isEntityNameUnique(editingCar.name, editingCar.entity_id, allCars, true)
  ) {
    reasons.push("DISCARD_REASON_CAR_NAME_DUPLICATE");
  }

  if (isSaving) {
    reasons.push("DISCARD_REASON_SAVING");
  } else if (reasons.length === 0 && isDirtyState) {
    reasons.push("DISCARD_REASON_EXIT_TOO_QUICKLY");
  }
  return reasons;
}

export function getCarEditorHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  const t = translationService;
  return [
    {
      title: t.translate("CE_HELP_WELCOME_TITLE"),
      content: t.translate("CE_HELP_WELCOME_CONTENT"),
      position: "center",
    },
    {
      targetId: "editor-object-nav",
      selector: "#editor-object-nav",
      title: t.translate("CE_HELP_SELECTOR_TITLE"),
      content: t.translate("CE_HELP_SELECTOR_CONTENT"),
      position: "bottom",
    },
    getEditorToolbarHelpStep(t, true),
    {
      targetId: "car-profile-panel",
      selector: "#car-profile-panel",
      title: t.translate("CE_HELP_PROFILE_TITLE"),
      content: t.translate("CE_HELP_PROFILE_CONTENT"),
      position: "right",
    },
    {
      targetId: "car-setup-section",
      selector: "#car-setup-section",
      title: t.translate("CE_HELP_SETUP_TITLE"),
      content: t.translate("CE_HELP_SETUP_CONTENT"),
      position: "left",
    },
  ];
}
