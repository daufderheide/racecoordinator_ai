import { of } from "rxjs";

import { createDefaultSettings } from "../../../testing/data/settings_data";
import {
  MOCK_FACTORY_SETTINGS,
  MOCK_TRACK_INSTANCES,
  MOCK_TRACKS,
} from "../../../testing/data/tracks_data";

/**
 * Creates a mock DataService configured for Track Manager tests.
 */
export function createTrackManagerDataServiceMock(overrides: any = {}) {
  const mock = jasmine.createSpyObj("DataService", [
    "getTracks",
    "deleteTrack",
    "createTrack",
    "getTrackFactorySettings",
    "connectToInterfaceDataSocket",
    "disconnectFromInterfaceDataSocket",
    "getInterfaceEvents",
    "getRaceState",
    "closeInterface",
    "updateTrack",
    "initializeInterface",
  ]);

  mock.getTracks.and.callFake(() =>
    of(JSON.parse(JSON.stringify(MOCK_TRACK_INSTANCES))),
  );
  mock.deleteTrack.and.returnValue(of(true));
  mock.createTrack.and.callFake((track: any) =>
    of({ ...track, entity_id: "t-new-id" }),
  );
  mock.updateTrack.and.callFake((id: any, track: any) => of(track));
  mock.getTrackFactorySettings.and.callFake(() =>
    of(JSON.parse(JSON.stringify(MOCK_FACTORY_SETTINGS))),
  );
  mock.getInterfaceEvents.and.returnValue(of({}));
  mock.getRaceState.and.returnValue(of(0)); // com.antigravity.RaceState.NOT_STARTED
  mock.closeInterface.and.returnValue(of({ success: true }));
  mock.initializeInterface.and.returnValue(of({ success: true }));

  return Object.assign(mock, overrides);
}

/**
 * Playwright route mocking for Track Manager.
 */
export async function mockTrackManagerRoutes(page: any, overrides: any = {}) {
  await page.route("**/api/tracks", async (route: any) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(overrides.tracks || MOCK_TRACKS),
      });
    } else if (method === "POST") {
      const postData = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...postData, entity_id: "t-new-id" }),
      });
    }
  });

  await page.route("**/api/tracks/factory-settings", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrides.factorySettings || MOCK_FACTORY_SETTINGS),
    });
  });

  await page.route("**/api/tracks/*", async (route: any) => {
    const method = route.request().method();
    if (method === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }
  });
}
