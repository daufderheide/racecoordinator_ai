import { of, Subject } from "rxjs";
import { MOCK_RACES } from "@app/testing/data/races_data";
import { MOCK_TRACKS } from "@app/testing/data/tracks_data";
import { deepCopy } from "@app/utils/clone.utils";

/**
 * RaceManagerHelper centralizes mock data and service behaviors for race-related components.
 * This ensures consistency across unit and screendiff tests for RaceManager and RaceEditor.
 */
export class RaceManagerHelper {
  /**
   * Configures Playwright routes for race-related data.
   * Used in screendiff tests to ensure consistent UI state across environments.
   */
  static async setupRaceRoutes(page: any) {
    await page.route("**/api/races", async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RACES),
      });
    });

    await page.route("**/api/tracks", async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TRACKS),
      });
    });

    await page.route("**/api/heats/preview**", async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ heats: [] }),
      });
    });
  }
}

/**
 * Factory function to create a mocked DataService for race components.
 * This provides standard return values from races_data, track_data, and default heat previews.
 */
export function createRaceManagerDataServiceMock(): any {
  const mock = jasmine.createSpyObj("DataService", [
    "getRaces",
    "getTracks",
    "createRace",
    "updateRace",
    "deleteRace",
    "generateHeats",
    "previewHeats",
    "listAssets", // Added for image set editing
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
  mock.updateRaceSubscription.and.stub();
  mock.connectToInterfaceDataSocket.and.stub();
  mock.disconnectFromInterfaceDataSocket.and.stub();
  mock.getRaceUpdate.and.returnValue(new Subject().asObservable());
  mock.getRaceTime.and.returnValue(new Subject().asObservable());
  mock.getLaps.and.returnValue(new Subject().asObservable());
  mock.getCarData.and.returnValue(new Subject().asObservable());
  mock.getSegments.and.returnValue(new Subject().asObservable());
  mock.getStandingsUpdate.and.returnValue(new Subject().asObservable());
  mock.getOverallStandingsUpdate.and.returnValue(new Subject().asObservable());
  mock.getInterfaceEvents.and.returnValue(new Subject().asObservable());
  mock.getRaceState.and.returnValue(new Subject().asObservable());
  mock.getRaceFlag.and.returnValue(new Subject().asObservable());
  mock.getHeats.and.returnValue(new Subject().asObservable());
  mock.getRecordData.and.returnValue(of(null));

  mock.getRaces.and.callFake(() => of(deepCopy(MOCK_RACES)));
  mock.getTracks.and.callFake(() => of(deepCopy(MOCK_TRACKS)));
  mock.createRace.and.returnValue(of({ entity_id: "r-new" }));
  mock.updateRace.and.returnValue(of({ entity_id: "r1" }));
  mock.deleteRace.and.returnValue(of({}));
  mock.generateHeats.and.returnValue(of({ heats: [] }));
  mock.previewHeats.and.returnValue(of({ heats: [] }));
  mock.listAssets.and.returnValue(of([]));

  return mock;
}
