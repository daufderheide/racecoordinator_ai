import { of, Subject } from "rxjs";
import { MOCK_DRIVERS } from "@app/testing/data/drivers_data";
import { MOCK_TEAMS } from "@app/testing/data/teams_data";
import { deepCopy } from "@app/utils/clone.utils";

/**
 * Shared test helper for TeamManager and TeamEditor.
 * Handles both Jasmine mocks for unit tests and Playwright route mocking for screendiff tests.
 */
export class TeamManagerHelper {
  /**
   * Creates a Jasmine spy object for the DataService with team-related methods.
   */
  static createDataServiceMock() {
    const spy = jasmine.createSpyObj("DataService", [
      "getTeams",
      "getDrivers",
      "deleteTeam",
      "updateTeam",
      "createTeam",
      "listAssets",
      "updateRaceSubscription",
      "connectToInterfaceDataSocket",
      "disconnectFromInterfaceDataSocket",
      "getRaceUpdate",
      "getRaceTime",
      "getLaps",
      "getCarData",
      "getSegments",
      "getStandingsUpdate",
      "getOverallStandingsUpdate",
      "getInterfaceEvents",
      "getRaceState",
      "getRaceFlag",
      "getHeats",
      "getRecordData",
    ]);
    spy.updateRaceSubscription.and.stub();
    spy.connectToInterfaceDataSocket.and.stub();
    spy.disconnectFromInterfaceDataSocket.and.stub();
    spy.getRaceUpdate.and.returnValue(new Subject().asObservable());
    spy.getRaceTime.and.returnValue(new Subject().asObservable());
    spy.getLaps.and.returnValue(new Subject().asObservable());
    spy.getCarData.and.returnValue(new Subject().asObservable());
    spy.getSegments.and.returnValue(new Subject().asObservable());
    spy.getStandingsUpdate.and.returnValue(new Subject().asObservable());
    spy.getOverallStandingsUpdate.and.returnValue(new Subject().asObservable());
    spy.getInterfaceEvents.and.returnValue(new Subject().asObservable());
    spy.getRaceState.and.returnValue(new Subject().asObservable());
    spy.getRaceFlag.and.returnValue(new Subject().asObservable());
    spy.getHeats.and.returnValue(new Subject().asObservable());
    spy.getRecordData.and.returnValue(of(null));

    spy.getTeams.and.callFake(() => of(deepCopy(MOCK_TEAMS)));
    spy.getDrivers.and.callFake(() => of(deepCopy(MOCK_DRIVERS)));
    spy.deleteTeam.and.returnValue(of({ success: true }));
    spy.updateTeam.and.callFake((id: string, team: any) => of(team));
    spy.createTeam.and.callFake((team: any) =>
      of({ ...team, entity_id: "t-new-id" }),
    );
    spy.listAssets.and.returnValue(of([]));

    return spy;
  }

  /**
   * Configures Playwright routes for team-related API calls.
   */
  static async setupRoutes(page: any) {
    await page.route("**/api/teams", async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TEAMS),
      });
    });

    await page.route("**/api/drivers", async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DRIVERS),
      });
    });

    await page.route("**/api/assets**", async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
  }
}

// Export factory function for consistency with other helpers
export const createTeamManagerDataServiceMock =
  TeamManagerHelper.createDataServiceMock;
