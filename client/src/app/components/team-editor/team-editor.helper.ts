import { getEditorToolbarHelpStep } from "@app/components/shared/toolbar/toolbar.component";
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
  const t = translationService;
  return [
    // 1) Team editor: Brief overview of the team editor and a link to the help center
    {
      title: t.translate("TEM_HELP_WELCOME_TITLE"),
      content: t.translate("TEM_HELP_WELCOME_CONTENT"),
      position: "center",
    },
    // 2) Select team: Setup same as the driver editor. Highlight the selector and count
    {
      targetId: "editor-object-nav",
      selector: "#editor-object-nav",
      title: t.translate("TEM_HELP_SELECTOR_TITLE"),
      content: t.translate("TEM_HELP_SELECTOR_CONTENT"),
      position: "bottom",
    },
    // 3) Toolbar: use the same text and help center link as the driver. Point to the pencil directly.
    getEditorToolbarHelpStep(t, true),
    // 4) LHS: Points to the avatar, name, and label selector. Generically describe with link to help center
    {
      targetId: "team-profile-panel",
      selector: "#team-profile-panel",
      title: t.translate("TEM_HELP_PROFILE_TITLE"),
      content: t.translate("TEM_HELP_PROFILE_CONTENT"),
      position: "right",
    },
    // 5) Point to the entire team member section and quickly explain it
    {
      targetId: "assigned-drivers-section",
      selector: "#assigned-drivers-section",
      title: t.translate("TEM_HELP_MEMBERS_TITLE"),
      content: t.translate("TEM_HELP_MEMBERS_CONTENT"),
      position: "left",
    },
    // 6) Point to the available driver section with a brief description and help center link
    {
      targetId: "available-drivers-section",
      selector: "#available-drivers-section",
      title: t.translate("TEM_HELP_AVAILABLE_TITLE"),
      content: t.translate("TEM_HELP_AVAILABLE_CONTENT"),
      position: "left",
    },
  ];
}
