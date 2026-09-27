import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
} from "@angular/core";
import { Driver } from "@app/models/driver";
import { Team } from "@app/models/team";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { naturalSortCompare } from "@app/utils/sorting.utils";

export interface RosterItem {
  seed: number;
  name: string;
  nickname: string;
  primaryName: string;
  secondaryName: string;
  teamName?: string;
  avatarUrl?: string;
  isTeam?: boolean;
}

export type RosterSortOption = "seed" | "nickname" | "driverName" | "name";

@Component({
  standalone: true,
  selector: "app-racing-roster-dialog",
  templateUrl: "./racing-roster-dialog.component.html",
  styleUrl: "./racing-roster-dialog.component.css",
  imports: [TranslatePipe],
})
export class RacingRosterDialogComponent implements AfterViewInit, OnDestroy {
  private translationService = inject(TranslationService);
  private elementRef = inject(ElementRef);

  visible = input<boolean>(false);
  participants = input<any[]>([]);
  teams = input<Team[]>([]);
  allDrivers = input<Driver[]>([]);

  close = output<void>();

  sortBy = signal<RosterSortOption>("nickname");

  private resizeObserver?: ResizeObserver;
  private canvasContext?: CanvasRenderingContext2D | null;

  constructor() {
    let prevVisible = false;
    effect(
      () => {
        const isVis = this.visible();
        if (isVis && !prevVisible) {
          untracked(() => this.sortBy.set("nickname"));
        }
        prevVisible = isVis;

        const items = this.rosterItems();
        if (isVis && items.length > 0) {
          requestAnimationFrame(() => {
            this.scaleText();
          });
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngAfterViewInit(): void {
    const hostEl = this.elementRef.nativeElement as HTMLElement;
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.scaleText();
      });
      this.resizeObserver.observe(hostEl);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    this.scaleText();
  }

  setSort(option: RosterSortOption): void {
    this.sortBy.set(option);
  }

  @HostListener("document:keydown.escape")
  onEscapePress(): void {
    if (this.visible()) {
      this.onClose();
    }
  }

  rosterItems = computed<RosterItem[]>(() => {
    this.visible();
    const rawList = this.participants() || [];
    const teamsList = this.teams() || [];
    const driversList = this.allDrivers() || [];

    const { teamIds, teamNames } = this.collectRacingTeams(rawList);

    const items: RosterItem[] = rawList.map((p, index) =>
      this.mapParticipantToRosterItem(
        p,
        index,
        teamsList,
        driversList,
        teamIds,
        teamNames,
      ),
    );

    if (this.sortBy() === "nickname" || this.sortBy() === "name") {
      return [...items].sort((a, b) => {
        const cmp = naturalSortCompare(
          a.primaryName || "",
          b.primaryName || "",
        );
        return cmp !== 0 ? cmp : a.seed - b.seed;
      });
    }

    if (this.sortBy() === "driverName") {
      return [...items].sort((a, b) => {
        const cmp = naturalSortCompare(a.name || "", b.name || "");
        return cmp !== 0 ? cmp : a.seed - b.seed;
      });
    }

    return items;
  });

  private collectRacingTeams(rawList: any[]): {
    teamIds: Set<string>;
    teamNames: Set<string>;
  } {
    const teamIds = new Set<string>();
    const teamNames = new Set<string>();
    for (const p of rawList) {
      if (p && ("driverIds" in p || p instanceof Team)) {
        if (p.entity_id) {
          teamIds.add(p.entity_id);
          teamIds.add(p.entity_id.replace(/^t_/, ""));
          teamIds.add(`t_${p.entity_id}`);
        }
        if (p.name) teamNames.add(p.name);
      } else if (p && p.team) {
        if (p.team.entity_id) {
          teamIds.add(p.team.entity_id);
          teamIds.add(p.team.entity_id.replace(/^t_/, ""));
          teamIds.add(`t_${p.team.entity_id}`);
        }
        if (p.team.name) teamNames.add(p.team.name);
      }
    }
    return { teamIds, teamNames };
  }

  private mapParticipantToRosterItem(
    p: any,
    index: number,
    teamsList: Team[],
    driversList: Driver[],
    racingTeamIds: Set<string>,
    racingTeamNames: Set<string>,
  ): RosterItem {
    const isTeamParticipant = !!(p && ("driverIds" in p || p instanceof Team));
    let name = "";
    let nickname = "";
    let teamName = "";

    if (p && "driver" in p && p.driver) {
      name = p.driver.name || "";
      nickname = p.driver.nickname || "";
      teamName = p.team?.name || "";
    } else if (isTeamParticipant) {
      name = p?.name || "";
      teamName = p?.name || "";
      const memberDrivers = driversList.filter(
        (d) =>
          p.driverIds &&
          (p.driverIds.includes(d.entity_id) ||
            p.driverIds.includes(d.entity_id.replace(/^d_/, "")) ||
            p.driverIds.map((id: string) => `d_${id}`).includes(d.entity_id)),
      );
      if (memberDrivers.length > 0) {
        nickname = memberDrivers
          .map((d) => d.nickname || d.name)
          .filter(Boolean)
          .join(", ");
      } else if (p && "nickname" in p && p.nickname) {
        nickname = p.nickname;
      } else if (p && "driverIds" in p && Array.isArray(p.driverIds)) {
        nickname = `${p.driverIds.length} ${this.translationService.translate("RDS_TEAM_DRIVERS")}`;
      }
    } else {
      name = p?.name || "";
      if (p && "nickname" in p && p.nickname) {
        nickname = p.nickname;
      }
      if (p?.team?.name) {
        teamName = p.team.name;
      } else if (
        (p as any)?.teamName &&
        racingTeamNames.has((p as any).teamName)
      ) {
        teamName = (p as any).teamName;
      } else if (teamsList.length > 0 && p?.entity_id) {
        const dId = p.entity_id;
        const matchedTeam = teamsList.find(
          (t) =>
            t.driverIds &&
            (t.driverIds.includes(dId) ||
              t.driverIds.includes(dId.replace(/^d_/, "")) ||
              t.driverIds.map((id) => `d_${id}`).includes(dId)),
        );
        if (
          matchedTeam &&
          (racingTeamIds.has(matchedTeam.entity_id) ||
            racingTeamNames.has(matchedTeam.name))
        ) {
          teamName = matchedTeam.name;
        }
      }
    }

    if (
      (name === "Empty" || name === "Unknown") &&
      (!p?.entity_id || p?.entity_id === "" || p?.entity_id === "empty")
    ) {
      name = this.translationService.translate("RD_EMPTY_LANE");
    }

    if (
      (nickname === "Empty" || nickname === "Unknown") &&
      (!p?.entity_id || p?.entity_id === "" || p?.entity_id === "empty")
    ) {
      nickname = this.translationService.translate("RD_EMPTY_LANE");
    }

    const primaryName = isTeamParticipant ? name : nickname || name;
    const secondaryName = isTeamParticipant
      ? nickname
      : nickname && nickname !== name
        ? name
        : "";

    return {
      seed: index + 1,
      name,
      nickname,
      primaryName,
      secondaryName,
      teamName: teamName || undefined,
      avatarUrl: p?.avatarUrl,
      isTeam: isTeamParticipant,
    };
  }

  gridColumns = computed<number>(() => {
    const n = this.rosterItems().length;
    if (n <= 4) return 1;
    if (n <= 10) return 2;
    if (n <= 21) return 3;
    if (n <= 36) return 4;
    if (n <= 55) return 5;
    if (n <= 78) return 6;
    if (n <= 105) return 7;
    return 8;
  });

  gridRows = computed<number>(() => {
    const n = this.rosterItems().length;
    const cols = this.gridColumns();
    return Math.max(1, Math.ceil(n / cols));
  });

  densityClass = computed<string>(() => {
    const n = this.rosterItems().length;
    if (n <= 8) return "density-spacious";
    if (n <= 20) return "density-regular";
    if (n <= 40) return "density-compact";
    if (n <= 70) return "density-dense";
    return "density-ultra";
  });

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains("roster-backdrop")) {
      this.onClose();
    }
  }

  getItemTooltip(item: RosterItem): string {
    const parts: string[] = [`(#${item.seed})`];
    if (item.primaryName) {
      parts.push(item.primaryName);
    }
    if (item.secondaryName) {
      parts.push(`(${item.secondaryName})`);
    }
    if (item.teamName && (!item.isTeam || item.teamName !== item.primaryName)) {
      parts.push(`[${item.teamName}]`);
    }
    return parts.join(" ");
  }

  scaleText(): void {
    if (!this.visible()) return;
    const hostEl = this.elementRef.nativeElement as HTMLElement;
    const cardEls = hostEl.querySelectorAll<HTMLElement>(".roster-card");
    if (cardEls.length === 0) return;

    if (!this.canvasContext) {
      const canvas = document.createElement("canvas");
      this.canvasContext = canvas.getContext("2d");
    }
    const ctx = this.canvasContext;
    if (!ctx) return;

    const items = this.rosterItems();
    const fontFamily =
      typeof window !== "undefined"
        ? window.getComputedStyle(document.body).fontFamily || "sans-serif"
        : "sans-serif";

    for (let i = 0; i < cardEls.length; i++) {
      const card = cardEls[i];
      const infoEl = card.querySelector<HTMLElement>(".driver-info");
      if (!infoEl) continue;

      const cardHeight = card.clientHeight;
      const availableWidth = Math.max(20, infoEl.clientWidth - 4);
      if (availableWidth <= 0 || cardHeight <= 0) continue;

      const item = items[i];
      if (!item) continue;

      // Measure line 1 (driver nickname / team name) at 100px
      ctx.font = `600 100px ${fontFamily}`;
      const nameWidth100 = ctx.measureText(item.primaryName || "").width || 1;

      // Measure line 2 (driver name / member nicknames and/or team name) at 100px
      const secondaryText = item.secondaryName || "";
      const showTeamName = !!(
        item.teamName &&
        (!item.isTeam || item.teamName !== item.primaryName)
      );
      const teamText = showTeamName ? item.teamName! : "";

      let line2Width100 = 0;
      if (secondaryText && teamText) {
        ctx.font = `italic 400 100px ${fontFamily}`;
        const secWidth100 = ctx.measureText(secondaryText).width;
        ctx.font = `500 100px ${fontFamily}`;
        const teamWidth100 = ctx.measureText(teamText).width;
        const gap100 = 20;
        line2Width100 = secWidth100 + teamWidth100 + gap100;
      } else if (secondaryText) {
        ctx.font = `italic 400 100px ${fontFamily}`;
        line2Width100 = ctx.measureText(secondaryText).width;
      } else if (teamText) {
        ctx.font = `500 100px ${fontFamily}`;
        line2Width100 = ctx.measureText(teamText).width;
      }

      const hasTwoLines = !!(secondaryText || teamText);
      const gapPx = hasTwoLines
        ? Math.max(2, Math.min(6, Math.round(cardHeight * 0.04)))
        : 0;

      // Allocate available vertical height (leaving subtle top/bottom breathing margin)
      const availableHeight = Math.min(
        cardHeight - (hasTwoLines ? 10 : 8),
        Math.floor(cardHeight * 0.86),
      );

      // Line-height is 1.2. Meta text is 74% of primary name size.
      const metaRatio = 0.74;
      const heightUnits = hasTwoLines ? 1.2 + metaRatio * 1.2 : 1.2;
      const maxNameFromHeight = (availableHeight - gapPx) / heightUnits;
      const maxNameFromWidth = (availableWidth / nameWidth100) * 100;

      // Ceiling based on card height and readability
      const maxNameCeiling = Math.min(
        38,
        Math.floor(cardHeight * (hasTwoLines ? 0.44 : 0.52)),
      );
      const minNameFloor = 8;

      let targetNamePx = Math.min(maxNameFromHeight, maxNameFromWidth);
      targetNamePx = Math.max(
        minNameFloor,
        Math.min(maxNameCeiling, Math.floor(targetNamePx)),
      );

      let targetMetaPx = 8;
      if (hasTwoLines) {
        const maxMetaFromWidth =
          line2Width100 > 0 ? (availableWidth / line2Width100) * 100 : 100;
        const maxMetaFromHeight = targetNamePx * metaRatio;
        targetMetaPx = Math.min(maxMetaFromHeight, maxMetaFromWidth);
        targetMetaPx = Math.max(
          8,
          Math.min(Math.floor(targetNamePx * 0.85), Math.floor(targetMetaPx)),
        );
      }

      infoEl.style.setProperty("--card-name-font-size", `${targetNamePx}px`);
      infoEl.style.setProperty("--card-meta-font-size", `${targetMetaPx}px`);
      infoEl.style.setProperty("--card-lines-gap", `${gapPx}px`);
    }
  }
}
