import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ChildWindowManagerService {
  private heatResultsWindow: Window | null = null;
  private raceResultsWindow: Window | null = null;
  private seasonResultsWindow: Window | null = null;
  private predictionResultsWindow: Window | null = null;
  private leaderBoardWindow: Window | null = null;
  private driverStationTabs: Window[] = [];
  private themeTabs: Window[] = [];

  getHeatResultsWindow(): Window | null {
    return this.heatResultsWindow;
  }

  setHeatResultsWindow(win: Window | null): void {
    this.heatResultsWindow = win;
  }

  getRaceResultsWindow(): Window | null {
    return this.raceResultsWindow;
  }

  setRaceResultsWindow(win: Window | null): void {
    this.raceResultsWindow = win;
  }

  getSeasonResultsWindow(): Window | null {
    return this.seasonResultsWindow;
  }

  setSeasonResultsWindow(win: Window | null): void {
    this.seasonResultsWindow = win;
  }

  getPredictionResultsWindow(): Window | null {
    return this.predictionResultsWindow;
  }

  setPredictionResultsWindow(win: Window | null): void {
    this.predictionResultsWindow = win;
  }

  getLeaderBoardWindow(): Window | null {
    return this.leaderBoardWindow;
  }

  setLeaderBoardWindow(win: Window | null): void {
    this.leaderBoardWindow = win;
  }

  getDriverStationTabs(): Window[] {
    return this.driverStationTabs;
  }

  addDriverStationTab(win: Window | null): void {
    if (win) {
      this.driverStationTabs.push(win);
    }
  }

  clearDriverStationTabs(): void {
    this.driverStationTabs = [];
  }

  getThemeTabs(): Window[] {
    return this.themeTabs;
  }

  addThemeTab(win: Window | null): void {
    if (win) {
      this.themeTabs.push(win);
    }
  }

  clearThemeTabs(): void {
    this.themeTabs = [];
  }

  openThemeWindow(url: string): Window | null {
    const win = window.open(url, "_blank");
    if (win) {
      this.themeTabs.push(win);
    }
    return win;
  }

  openWindow(action: string, url: string): Window | null {
    const win = window.open(url, "_blank");
    if (!win) {
      return null;
    }

    if (action === "HEAT_RESULTS") {
      this.heatResultsWindow = win;
    } else if (action === "RACE_RESULTS") {
      this.raceResultsWindow = win;
    } else if (action === "SEASON_RESULTS") {
      this.seasonResultsWindow = win;
    } else if (action === "PREDICTION_RESULTS") {
      this.predictionResultsWindow = win;
    } else if (action === "LEADERBOARD") {
      this.leaderBoardWindow = win;
    } else if (action.startsWith("THEME:") || action === "THEME") {
      this.themeTabs.push(win);
    }

    return win;
  }

  closeAllWindows(): void {
    if (this.leaderBoardWindow && !this.leaderBoardWindow.closed) {
      this.leaderBoardWindow.close();
    }
    this.leaderBoardWindow = null;

    if (this.heatResultsWindow && !this.heatResultsWindow.closed) {
      this.heatResultsWindow.close();
    }
    this.heatResultsWindow = null;

    if (this.raceResultsWindow && !this.raceResultsWindow.closed) {
      this.raceResultsWindow.close();
    }
    this.raceResultsWindow = null;

    if (this.seasonResultsWindow && !this.seasonResultsWindow.closed) {
      this.seasonResultsWindow.close();
    }
    this.seasonResultsWindow = null;

    if (this.predictionResultsWindow && !this.predictionResultsWindow.closed) {
      this.predictionResultsWindow.close();
    }
    this.predictionResultsWindow = null;

    this.driverStationTabs.forEach((tab) => {
      if (tab && !tab.closed) {
        tab.close();
      }
    });
    this.driverStationTabs = [];

    this.themeTabs.forEach((tab) => {
      if (tab && !tab.closed) {
        tab.close();
      }
    });
    this.themeTabs = [];
  }

  isRacePreservingRoute(url?: string): boolean {
    if (!url) {
      return false;
    }
    const cleanUrl = url.split("?")[0].split("#")[0];
    if (cleanUrl.includes("raceday-setup")) {
      return false;
    }
    return (
      cleanUrl === "/raceday" ||
      cleanUrl === "/default-raceday" ||
      cleanUrl.startsWith("/ui-editor") ||
      cleanUrl.startsWith("/modify-heats") ||
      cleanUrl.startsWith("/driver-station") ||
      cleanUrl.startsWith("/driver-view") ||
      cleanUrl.startsWith("/team-manager") ||
      cleanUrl.startsWith("/driver-manager")
    );
  }
}
