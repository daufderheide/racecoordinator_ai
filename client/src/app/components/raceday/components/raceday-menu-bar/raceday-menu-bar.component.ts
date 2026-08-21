import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  HostListener,
  input,
  OnDestroy,
  OnInit,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { LanguageSelectorComponent } from "@app/components/shared/language-selector/language-selector.component";
import { UpdateSelectorComponent } from "@app/components/shared/update-selector/update-selector.component";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";

@Component({
  standalone: true,
  selector: "app-raceday-menu-bar",
  templateUrl: "./raceday-menu-bar.component.html",
  styleUrls: ["./raceday-menu-bar.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    LanguageSelectorComponent,
    UpdateSelectorComponent,
    TranslatePipe,
  ],
})
export class RacedayMenuBarComponent implements OnInit, OnDestroy {
  track = input<Track | undefined>(undefined);
  race = input<any | undefined>(undefined);
  isSeasonRace = computed(() => {
    const r = this.race();
    return Boolean(r?.season_id || r?.seasonId || r?.is_season || r?.isSeason);
  });
  participants = input<any[]>([]);
  isSaveDisabled = input<boolean>(false);
  isStartResumeDisabled = input<boolean>(false);
  isPauseDisabled = input<boolean>(false);
  isNextHeatDisabled = input<boolean>(false);
  isRestartHeatDisabled = input<boolean>(false);
  isDeferHeatDisabled = input<boolean>(false);
  isSkipHeatDisabled = input<boolean>(false);
  isSkipRaceDisabled = input<boolean>(false);
  isAddLapDisabled = input<boolean>(false);
  isModifyDisabled = input<boolean>(false);

  startResumeShortcut = input<string>("");
  pauseShortcut = input<string>("");
  nextHeatShortcut = input<string>("");
  restartHeatShortcut = input<string>("");
  skipHeatShortcut = input<string>("");
  deferHeatShortcut = input<string>("");

  fileMenuSelect = output<string>();
  menuSelect = output<string>();
  laneMenuSelect = output<number>();
  windowsMenuSelect = output<string>();
  driverViewMenuSelect = output<string>();
  optionsMenuSelect = output<string>();
  languageSelected = output<void>();
  checkForUpdatesRequested = output<void>();

  trackPowerMainSelect = output<boolean>();
  trackPowerLaneSelect = output<{ lane: number; on: boolean }>();

  isFileMenuOpen = false;
  isMenuOpen = false;
  isDriversStationOpen = false;
  isWindowsMenuOpen = false;
  isDriversViewOpen = false;
  isOptionsMenuOpen = false;
  isHelpMenuOpen = false;
  isTrackPowerMenuOpen = false;

  get driverViewMenuOptions(): { id: string; value: string; label: string }[] {
    const options: { id: string; value: string; label: string }[] = [];
    for (const p of this.participants()) {
      if (p.team && p.team.name) {
        const teamId = p.team.entity_id || p.team.name;
        if (teamId && !options.find((o) => o.value === teamId)) {
          options.push({
            id: teamId,
            value: teamId,
            label: p.team.name,
          });

          // Add all team members if we have their names loaded
          if (p.team.driverIds && p.team.driverIds.length > 0) {
            for (const driverId of p.team.driverIds) {
              const d = this.allDrivers.find(
                (d) => d.objectId === driverId || d.entity_id === driverId,
              );
              if (d && !options.find((o) => o.id === `${teamId}_${driverId}`)) {
                const name = d.nickname || d.name;
                options.push({
                  id: `${teamId}_${driverId}`,
                  value: d.entity_id || d.name || driverId,
                  label: ` - ${name}`,
                });
              }
            }
          }
        }
      } else if (!p.team && p.driver && !p.driver.isEmpty()) {
        const name = p.driver.nickname || p.driver.name;
        const driverId = p.driver.entity_id || p.driver.name || p.objectId;
        if (driverId && !options.find((o) => o.value === driverId)) {
          options.push({
            id: driverId,
            value: driverId,
            label: name,
          });
        }
      }
    }
    return options;
  }

  Role = Role;
  private allDrivers: any[] = [];
  private subscriptions: any[] = [];

  constructor(
    public authService: AuthService,
    public dataService: DataService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.dataService.getDrivers().subscribe((drivers) => {
        this.allDrivers = drivers || [];
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  trackPowerShortcut(digit: number, off: boolean): string {
    if (digit > 9) return "";
    const key =
      navigator.userAgent.toUpperCase().indexOf("MAC") >= 0 ? "Option" : "Alt";
    return off ? `${key}-Shift-${digit}` : `${key}-${digit}`;
  }

  hasMainRelay(): boolean {
    const s = this.dataService.getSystemStateValue();
    return s ? !!s.hasMainRelay || !!s.hasPerLaneRelays : false;
  }

  hasPerLaneRelays(): boolean {
    const s = this.dataService.getSystemStateValue();
    return s ? !!s.hasPerLaneRelays : false;
  }

  toggleFileMenu() {
    this.isFileMenuOpen = !this.isFileMenuOpen;
    this.closeOthers("file");
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.closeOthers("menu");
  }

  toggleTrackPowerMenu() {
    this.isTrackPowerMenuOpen = !this.isTrackPowerMenuOpen;
  }

  toggleDriversStationMenu() {
    this.isDriversStationOpen = !this.isDriversStationOpen;
    if (this.isDriversStationOpen) {
      this.isDriversViewOpen = false;
    }
  }

  toggleDriversViewMenu() {
    this.isDriversViewOpen = !this.isDriversViewOpen;
    if (this.isDriversViewOpen) {
      this.isDriversStationOpen = false;
    }
  }

  toggleWindowsMenu() {
    this.isWindowsMenuOpen = !this.isWindowsMenuOpen;
    this.closeOthers("windows");
  }

  toggleOptionsMenu() {
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
    this.closeOthers("options");
  }

  toggleHelpMenu() {
    this.isHelpMenuOpen = !this.isHelpMenuOpen;
    this.closeOthers("help");
  }

  onMenuItemHover(menu: string) {
    if (
      this.isFileMenuOpen ||
      this.isMenuOpen ||
      this.isWindowsMenuOpen ||
      this.isOptionsMenuOpen ||
      this.isHelpMenuOpen
    ) {
      this.isFileMenuOpen = menu === "file";
      this.isMenuOpen = menu === "race";
      this.isWindowsMenuOpen = menu === "windows";
      this.isOptionsMenuOpen = menu === "options";
      this.isHelpMenuOpen = menu === "help";
      if (!this.isWindowsMenuOpen) {
        this.isDriversStationOpen = false;
        this.isDriversViewOpen = false;
      }
      if (!this.isMenuOpen) {
        this.isTrackPowerMenuOpen = false;
      }
    }
  }

  onFileMenuSelect(action: string) {
    this.fileMenuSelect.emit(action);
    this.closeAll();
  }

  onMenuSelect(action: string) {
    this.menuSelect.emit(action);
    this.closeAll();
  }

  onTrackPowerSelect(action: string) {
    if (!this.hasMainRelay()) return;
    this.trackPowerMainSelect.emit(action === "MAIN_ON");
    this.closeAll();
  }

  onLanePowerSelect(laneIndex: number, on: boolean) {
    if (!this.hasPerLaneRelays()) return;
    this.trackPowerLaneSelect.emit({ lane: laneIndex, on });
    this.closeAll();
  }

  onLaneMenuSelect(laneIndex: number) {
    this.laneMenuSelect.emit(laneIndex);
    this.closeAll();
  }

  onWindowsMenuSelect(action: string) {
    this.windowsMenuSelect.emit(action);
    this.closeAll();
  }

  onDriverViewMenuSelect(driverId: string) {
    this.driverViewMenuSelect.emit(driverId);
    this.closeAll();
  }

  onOptionsSelect(action: string) {
    this.optionsMenuSelect.emit(action);
    this.closeAll();
  }

  onLanguageSelected() {
    this.languageSelected.emit();
    this.closeAll();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isInsideMenu =
      target &&
      typeof target.closest === "function" &&
      (target.closest(".menu-wrapper") || target.closest(".teammate-select"));
    if (!isInsideMenu) {
      this.closeAll();
    }
  }

  private closeOthers(active: string) {
    if (active !== "file") this.isFileMenuOpen = false;
    if (active !== "menu") {
      this.isMenuOpen = false;
      this.isTrackPowerMenuOpen = false;
    }
    if (active !== "windows") {
      this.isWindowsMenuOpen = false;
      this.isDriversStationOpen = false;
      this.isDriversViewOpen = false;
    }
    if (active !== "options") this.isOptionsMenuOpen = false;
    if (active !== "help") this.isHelpMenuOpen = false;
  }

  private closeAll() {
    this.isFileMenuOpen = false;
    this.isMenuOpen = false;
    this.isDriversStationOpen = false;
    this.isDriversViewOpen = false;
    this.isWindowsMenuOpen = false;
    this.isOptionsMenuOpen = false;
    this.isHelpMenuOpen = false;
    this.isTrackPowerMenuOpen = false;
  }
}
