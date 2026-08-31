import {
  Component,
  computed,
  HostListener,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { naturalSortCompare } from "@app/utils/sorting.utils";

export interface RosterItem {
  seed: number;
  name: string;
  nickname: string;
  avatarUrl?: string;
  isTeam?: boolean;
}

export type RosterSortOption = "seed" | "name";

@Component({
  standalone: true,
  selector: "app-racing-roster-dialog",
  templateUrl: "./racing-roster-dialog.component.html",
  styleUrl: "./racing-roster-dialog.component.css",
  imports: [TranslatePipe],
})
export class RacingRosterDialogComponent {
  private translationService = inject(TranslationService);

  visible = input<boolean>(false);
  participants = input<any[]>([]);

  close = output<void>();

  sortBy = signal<RosterSortOption>("seed");

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
    const rawList = this.participants() || [];
    const items: RosterItem[] = rawList.map((p, index) => {
      let name = p?.name || "";
      if (
        (name === "Empty" || name === "Unknown") &&
        (!p?.entity_id || p?.entity_id === "" || p?.entity_id === "empty")
      ) {
        name = this.translationService.translate("RD_EMPTY_LANE");
      }

      let nickname = "";
      if (p && "nickname" in p && p.nickname) {
        nickname = p.nickname;
        if (
          (nickname === "Empty" || nickname === "Unknown") &&
          (!p?.entity_id || p?.entity_id === "" || p?.entity_id === "empty")
        ) {
          nickname = this.translationService.translate("RD_EMPTY_LANE");
        }
      } else if (p && "driverIds" in p && Array.isArray(p.driverIds)) {
        nickname = `${p.driverIds.length} ${this.translationService.translate("RDS_TEAM_DRIVERS")}`;
      }

      return {
        seed: index + 1,
        name,
        nickname,
        avatarUrl: p?.avatarUrl,
        isTeam: !!(p && "driverIds" in p),
      };
    });

    if (this.sortBy() === "name") {
      return [...items].sort((a, b) => {
        const cmp = naturalSortCompare(a.name || "", b.name || "");
        return cmp !== 0 ? cmp : a.seed - b.seed;
      });
    }

    return items;
  });

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
    if (item.nickname && item.nickname !== item.name) {
      return `(#${item.seed}) ${item.name} "${item.nickname}"`;
    }
    return `(#${item.seed}) ${item.name}`;
  }
}
