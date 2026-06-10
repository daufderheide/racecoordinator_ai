import { CommonModule } from "@angular/common";
import {
  Component,
  HostListener,
  input,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { LanguageSelectorComponent } from "@app/components/shared/language-selector/language-selector.component";
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
  imports: [CommonModule, LanguageSelectorComponent, TranslatePipe],
})
export class RacedayMenuBarComponent {
  track = input<Track | undefined>(undefined);
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
  optionsMenuSelect = output<string>();
  languageSelected = output<void>();

  isFileMenuOpen = false;
  isMenuOpen = false;
  isLanesMenuOpen = false;
  isDriversStationOpen = false;
  isWindowsMenuOpen = false;
  isOptionsMenuOpen = false;

  Role = Role;

  constructor(public authService: AuthService) {}

  toggleFileMenu() {
    this.isFileMenuOpen = !this.isFileMenuOpen;
    this.closeOthers("file");
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.closeOthers("menu");
  }

  toggleLanesMenu() {
    this.isLanesMenuOpen = !this.isLanesMenuOpen;
    if (!this.isLanesMenuOpen) {
      this.isDriversStationOpen = false;
    }
    this.closeOthers("lanes");
  }

  toggleDriversStationMenu() {
    this.isDriversStationOpen = !this.isDriversStationOpen;
  }

  toggleWindowsMenu() {
    this.isWindowsMenuOpen = !this.isWindowsMenuOpen;
    this.closeOthers("windows");
  }

  toggleOptionsMenu() {
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
    this.closeOthers("options");
  }

  onMenuItemHover(menu: string) {
    if (
      this.isFileMenuOpen ||
      this.isMenuOpen ||
      this.isLanesMenuOpen ||
      this.isWindowsMenuOpen ||
      this.isOptionsMenuOpen
    ) {
      this.isFileMenuOpen = menu === "file";
      this.isMenuOpen = menu === "race";
      this.isLanesMenuOpen = menu === "lanes";
      this.isWindowsMenuOpen = menu === "windows";
      this.isOptionsMenuOpen = menu === "options";
      if (!this.isLanesMenuOpen) {
        this.isDriversStationOpen = false;
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

  onLaneMenuSelect(laneIndex: number) {
    this.laneMenuSelect.emit(laneIndex);
    this.closeAll();
  }

  onWindowsMenuSelect(action: string) {
    this.windowsMenuSelect.emit(action);
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
    if (active !== "menu") this.isMenuOpen = false;
    if (active !== "lanes") {
      this.isLanesMenuOpen = false;
      this.isDriversStationOpen = false;
    }
    if (active !== "windows") this.isWindowsMenuOpen = false;
    if (active !== "options") this.isOptionsMenuOpen = false;
  }

  private closeAll() {
    this.isFileMenuOpen = false;
    this.isMenuOpen = false;
    this.isLanesMenuOpen = false;
    this.isDriversStationOpen = false;
    this.isWindowsMenuOpen = false;
    this.isOptionsMenuOpen = false;
  }
}
