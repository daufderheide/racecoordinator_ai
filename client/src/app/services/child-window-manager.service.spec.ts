import { TestBed } from "@angular/core/testing";

import { ChildWindowManagerService } from "./child-window-manager.service";

describe("ChildWindowManagerService", () => {
  let service: ChildWindowManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChildWindowManagerService],
    });
    service = TestBed.inject(ChildWindowManagerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("window opening and getters/setters", () => {
    let mockWindow: any;

    beforeEach(() => {
      mockWindow = {
        close: jasmine.createSpy("close"),
        closed: false,
      };
      spyOn(window, "open").and.returnValue(mockWindow);
    });

    it("should open and store heatResultsWindow", () => {
      const win = service.openWindow("HEAT_RESULTS", "/heat-results");
      expect(window.open).toHaveBeenCalledWith("/heat-results", "_blank");
      expect(win).toBe(mockWindow);
      expect(service.getHeatResultsWindow()).toBe(mockWindow);
    });

    it("should open and store raceResultsWindow", () => {
      const win = service.openWindow("RACE_RESULTS", "/race-results");
      expect(window.open).toHaveBeenCalledWith("/race-results", "_blank");
      expect(win).toBe(mockWindow);
      expect(service.getRaceResultsWindow()).toBe(mockWindow);
    });

    it("should open and store seasonResultsWindow", () => {
      const win = service.openWindow("SEASON_RESULTS", "/season-results");
      expect(window.open).toHaveBeenCalledWith("/season-results", "_blank");
      expect(win).toBe(mockWindow);
      expect(service.getSeasonResultsWindow()).toBe(mockWindow);
    });

    it("should open and store predictionResultsWindow", () => {
      const win = service.openWindow(
        "PREDICTION_RESULTS",
        "/prediction-results",
      );
      expect(window.open).toHaveBeenCalledWith("/prediction-results", "_blank");
      expect(win).toBe(mockWindow);
      expect(service.getPredictionResultsWindow()).toBe(mockWindow);
    });

    it("should open and store leaderBoardWindow", () => {
      const win = service.openWindow("LEADERBOARD", "/leaderboard");
      expect(window.open).toHaveBeenCalledWith("/leaderboard", "_blank");
      expect(win).toBe(mockWindow);
      expect(service.getLeaderBoardWindow()).toBe(mockWindow);
    });

    it("should return null if window.open fails", () => {
      (window.open as jasmine.Spy).and.returnValue(null);
      const win = service.openWindow("HEAT_RESULTS", "/heat-results");
      expect(win).toBeNull();
    });

    it("should allow setting windows manually via setters", () => {
      service.setHeatResultsWindow(mockWindow);
      expect(service.getHeatResultsWindow()).toBe(mockWindow);

      service.setRaceResultsWindow(mockWindow);
      expect(service.getRaceResultsWindow()).toBe(mockWindow);

      service.setSeasonResultsWindow(mockWindow);
      expect(service.getSeasonResultsWindow()).toBe(mockWindow);

      service.setPredictionResultsWindow(mockWindow);
      expect(service.getPredictionResultsWindow()).toBe(mockWindow);

      service.setLeaderBoardWindow(mockWindow);
      expect(service.getLeaderBoardWindow()).toBe(mockWindow);
    });

    it("should manage driverStationTabs correctly", () => {
      service.addDriverStationTab(mockWindow);
      expect(service.getDriverStationTabs().length).toBe(1);
      expect(service.getDriverStationTabs()[0]).toBe(mockWindow);

      service.addDriverStationTab(null);
      expect(service.getDriverStationTabs().length).toBe(1);

      service.clearDriverStationTabs();
      expect(service.getDriverStationTabs().length).toBe(0);
    });

    it("should manage themeTabs correctly via openThemeWindow", () => {
      const win = service.openThemeWindow("/default-raceday?themeId=t1");
      expect(window.open).toHaveBeenCalledWith(
        "/default-raceday?themeId=t1",
        "_blank",
      );
      expect(win).toBe(mockWindow);
      expect(service.getThemeTabs().length).toBe(1);
      expect(service.getThemeTabs()[0]).toBe(mockWindow);

      service.addThemeTab(null);
      expect(service.getThemeTabs().length).toBe(1);

      service.clearThemeTabs();
      expect(service.getThemeTabs().length).toBe(0);
    });
  });

  describe("closeAllWindows", () => {
    it("should close all active windows and clear references", () => {
      const win1 = { close: jasmine.createSpy("close1"), closed: false };
      const win2 = { close: jasmine.createSpy("close2"), closed: false };
      const win3 = { close: jasmine.createSpy("close3"), closed: false };
      const win4 = { close: jasmine.createSpy("close4"), closed: false };
      const win5 = { close: jasmine.createSpy("close5"), closed: false };
      const tab1 = { close: jasmine.createSpy("closeTab1"), closed: false };
      const tabClosed = {
        close: jasmine.createSpy("closeTabClosed"),
        closed: true,
      };
      const themeTab1 = {
        close: jasmine.createSpy("closeTheme1"),
        closed: false,
      };
      const themeTabClosed = {
        close: jasmine.createSpy("closeThemeClosed"),
        closed: true,
      };

      service.setLeaderBoardWindow(win1 as any);
      service.setHeatResultsWindow(win2 as any);
      service.setRaceResultsWindow(win3 as any);
      service.setSeasonResultsWindow(win4 as any);
      service.setPredictionResultsWindow(win5 as any);
      service.addDriverStationTab(tab1 as any);
      service.addDriverStationTab(tabClosed as any);
      service.addThemeTab(themeTab1 as any);
      service.addThemeTab(themeTabClosed as any);

      service.closeAllWindows();

      expect(win1.close).toHaveBeenCalled();
      expect(win2.close).toHaveBeenCalled();
      expect(win3.close).toHaveBeenCalled();
      expect(win4.close).toHaveBeenCalled();
      expect(win5.close).toHaveBeenCalled();
      expect(tab1.close).toHaveBeenCalled();
      expect(tabClosed.close).not.toHaveBeenCalled();
      expect(themeTab1.close).toHaveBeenCalled();
      expect(themeTabClosed.close).not.toHaveBeenCalled();

      expect(service.getLeaderBoardWindow()).toBeNull();
      expect(service.getHeatResultsWindow()).toBeNull();
      expect(service.getRaceResultsWindow()).toBeNull();
      expect(service.getSeasonResultsWindow()).toBeNull();
      expect(service.getPredictionResultsWindow()).toBeNull();
      expect(service.getDriverStationTabs().length).toBe(0);
      expect(service.getThemeTabs().length).toBe(0);
    });
  });

  describe("isRacePreservingRoute", () => {
    it("should return false for falsy URLs or raceday-setup", () => {
      expect(service.isRacePreservingRoute()).toBeFalse();
      expect(service.isRacePreservingRoute("")).toBeFalse();
      expect(service.isRacePreservingRoute("/raceday-setup")).toBeFalse();
      expect(
        service.isRacePreservingRoute("/raceday-setup?param=1"),
      ).toBeFalse();
      expect(service.isRacePreservingRoute("/")).toBeFalse();
      expect(service.isRacePreservingRoute("/database-manager")).toBeFalse();
    });

    it("should return true for race-preserving routes", () => {
      expect(service.isRacePreservingRoute("/raceday")).toBeTrue();
      expect(service.isRacePreservingRoute("/default-raceday")).toBeTrue();
      expect(service.isRacePreservingRoute("/ui-editor")).toBeTrue();
      expect(
        service.isRacePreservingRoute("/ui-editor?returnUrl=%2Fraceday"),
      ).toBeTrue();
      expect(service.isRacePreservingRoute("/modify-heats")).toBeTrue();
      expect(service.isRacePreservingRoute("/driver-station/1")).toBeTrue();
      expect(
        service.isRacePreservingRoute("/driver-view/driver-123"),
      ).toBeTrue();
      expect(service.isRacePreservingRoute("/team-manager")).toBeTrue();
      expect(service.isRacePreservingRoute("/driver-manager")).toBeTrue();
    });
  });
});
