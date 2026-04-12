import { of } from "rxjs";
import { MOCK_RACES } from "src/app/testing/data/races_data";
import { MOCK_TRACKS } from "src/app/testing/data/tracks_data";

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
  ]);

  mock.getRaces.and.callFake(() => of(JSON.parse(JSON.stringify(MOCK_RACES))));
  mock.getTracks.and.callFake(() =>
    of(JSON.parse(JSON.stringify(MOCK_TRACKS))),
  );
  mock.createRace.and.returnValue(of({ entity_id: "r-new" }));
  mock.updateRace.and.returnValue(of({ entity_id: "r1" }));
  mock.deleteRace.and.returnValue(of({}));
  mock.generateHeats.and.returnValue(of({ heats: [] }));
  mock.previewHeats.and.returnValue(of({ heats: [] }));
  mock.listAssets.and.returnValue(of([]));

  return mock;
}
