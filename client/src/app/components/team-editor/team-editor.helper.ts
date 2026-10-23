import { Team } from "@app/models/team";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";
import { isEntityNameUnique } from "@app/utils/editor-utils";

export function cloneTeam(team: Team): Team {
  return new Team(
    team.entity_id,
    team.name,
    team.avatarUrl,
    [...team.driverIds],
    [...(team.labelIds || [])],
  );
}

export function areTeamsEqual(a: Team, b: Team): boolean {
  if (a.name !== b.name) return false;
  if (a.avatarUrl !== b.avatarUrl) return false;
  if (a.driverIds.length !== b.driverIds.length) return false;
  if (!a.driverIds.every((id, i) => id === b.driverIds[i])) return false;
  const aLabels = a.labelIds || [];
  const bLabels = b.labelIds || [];
  if (aLabels.length !== bLabels.length) return false;
  return aLabels.every((id, i) => id === bLabels[i]);
}

export function generateUniqueTeamName(
  baseName: string,
  allTeams: Team[],
  forceSuffix: boolean = false,
): string {
  let counter = forceSuffix ? 1 : 0;
  const pattern = /(_\d+)$/;
  const base = (baseName || "").replace(pattern, "").trim();

  while (true) {
    const candidate = counter === 0 ? base : `${base}_${counter}`;
    if (
      !allTeams.some((t) => t.name.toLowerCase() === candidate.toLowerCase())
    ) {
      return candidate;
    }
    counter++;
  }
}

export function resolveTeamAvatarUrl(
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

export function getTeamUnsavedReasons(
  editingTeam: Team | undefined,
  allTeams: Team[],
  isSaving: boolean,
  isDirtyState: boolean,
): string[] {
  const reasons: string[] = [];
  if (!editingTeam) return reasons;

  const nameTrimmed = editingTeam.name?.trim() || "";
  if (!nameTrimmed) {
    reasons.push("DISCARD_REASON_TEAM_NAME_EMPTY");
  } else if (
    !isEntityNameUnique(editingTeam.name, editingTeam.entity_id, allTeams, true)
  ) {
    reasons.push("DISCARD_REASON_TEAM_NAME_DUPLICATE");
  }

  if (isSaving) {
    reasons.push("DISCARD_REASON_SAVING");
  } else if (reasons.length === 0 && isDirtyState) {
    reasons.push("DISCARD_REASON_EXIT_TOO_QUICKLY");
  }

  return reasons;
}

export function getTeamEditorHelpSteps(
  translationService: TranslationService,
): GuideStep[] {
  return [
    {
      title: translationService.translate("TEM_HELP_WELCOME_TITLE"),
      content: translationService.translate("TEM_HELP_WELCOME_CONTENT"),
      position: "center",
    },
    {
      selector: "#avatar-selector",
      title: translationService.translate("TEM_HELP_AVATAR_TITLE"),
      content: translationService.translate("TEM_HELP_AVATAR_CONTENT"),
      position: "right",
    },
    {
      selector: "#team-name-input",
      title: translationService.translate("TEM_HELP_NAME_TITLE"),
      content: translationService.translate("TEM_HELP_NAME_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#team-labels-section",
      title: translationService.translate("TEM_HELP_LABELS_TITLE"),
      content: translationService.translate("TEM_HELP_LABELS_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#assigned-drivers-list",
      title: translationService.translate("TEM_HELP_ASSIGNED_TITLE"),
      content: translationService.translate("TEM_HELP_ASSIGNED_CONTENT"),
      position: "left",
    },
    {
      selector: "#available-drivers-list",
      title: translationService.translate("TEM_HELP_AVAILABLE_TITLE"),
      content: translationService.translate("TEM_HELP_AVAILABLE_CONTENT"),
      position: "left",
    },
  ];
}
