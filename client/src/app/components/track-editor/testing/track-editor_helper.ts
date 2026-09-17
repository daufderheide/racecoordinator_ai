import { of, Subject } from "rxjs";
import {
  MOCK_FACTORY_SETTINGS,
  MOCK_TRACK_INSTANCES,
  MOCK_TRACKS,
} from "@app/testing/data/tracks_data";
import { deepCopy } from "@app/utils/clone.utils";

/**
 * Shared test helper for TrackEditor.
 * Handles both Jasmine mocks for unit tests and Playwright route mocking for screendiff tests.
 */
export class TrackEditorHelper {
  /**
   * Creates a mock DataService configured for Track Editor tests.
   */
  static createDataServiceMock(overrides: any = {}) {
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
      "getSerialPorts",
      "getBleDevices",
      "updateInterfaceConfig",
      "setInterfacePinState",
      "setInterfaceRgbLedState",
      "updateRaceSubscription",
      "getRaceUpdate",
      "getRaceTime",
      "getLaps",
      "getCarData",
      "getSegments",
      "getStandingsUpdate",
      "getOverallStandingsUpdate",
      "getHeats",
      "getRecordData",
      "getRaceFlag",
      "getDrivers",
      "getSystemState",
      "getPhidgetDevices",
      "endRace",
    ]);
    mock.endRace = jasmine.createSpy("endRace").and.returnValue(of(true));
    mock.getPhidgetDevices = jasmine
      .createSpy("getPhidgetDevices")
      .and.returnValue(of([]));
    mock.updateRaceSubscription = jasmine.createSpy("updateRaceSubscription");
    mock.getRaceUpdate = jasmine
      .createSpy("getRaceUpdate")
      .and.returnValue(new Subject().asObservable());
    mock.getRaceTime = jasmine
      .createSpy("getRaceTime")
      .and.returnValue(new Subject().asObservable());
    mock.getLaps = jasmine
      .createSpy("getLaps")
      .and.returnValue(new Subject().asObservable());
    mock.getCarData = jasmine
      .createSpy("getCarData")
      .and.returnValue(new Subject().asObservable());
    mock.getSegments = jasmine
      .createSpy("getSegments")
      .and.returnValue(new Subject().asObservable());
    mock.getStandingsUpdate = jasmine
      .createSpy("getStandingsUpdate")
      .and.returnValue(new Subject().asObservable());
    mock.getOverallStandingsUpdate = jasmine
      .createSpy("getOverallStandingsUpdate")
      .and.returnValue(new Subject().asObservable());
    mock.getHeats = jasmine
      .createSpy("getHeats")
      .and.returnValue(new Subject().asObservable());
    mock.getRecordData = jasmine
      .createSpy("getRecordData")
      .and.returnValue(of(null));
    mock.getRaceFlag = jasmine
      .createSpy("getRaceFlag")
      .and.returnValue(new Subject().asObservable());
    mock.getDrivers = jasmine.createSpy("getDrivers").and.returnValue(of([]));
    mock.getSystemState = jasmine
      .createSpy("getSystemState")
      .and.returnValue(of(null));

    mock.getTracks.and.callFake(() => of(deepCopy(MOCK_TRACK_INSTANCES)));
    mock.deleteTrack.and.returnValue(of(true));
    mock.createTrack.and.callFake((track: any) =>
      of({ ...track, entity_id: "t-new-id" }),
    );
    mock.updateTrack.and.callFake((id: any, track: any) => of(track));
    mock.getTrackFactorySettings.and.callFake(() =>
      of(deepCopy(MOCK_FACTORY_SETTINGS)),
    );
    mock.getInterfaceEvents.and.returnValue(of({}));
    mock.getRaceState.and.returnValue(of(0)); // RaceState.NOT_STARTED
    mock.closeInterface.and.returnValue(of({ success: true }));
    mock.initializeInterface.and.returnValue(of({ success: true }));
    mock.getSerialPorts.and.returnValue(of(["COM1", "COM2"]));
    mock.getBleDevices.and.returnValue(of(["BART_0001", "BART_0002"]));
    mock.updateInterfaceConfig.and.returnValue(of({ success: true }));
    mock.setInterfacePinState.and.returnValue(of({ success: true }));
    mock.setInterfaceRgbLedState.and.returnValue(of({ success: true }));

    return Object.assign(mock, overrides);
  }

  /**
   * Configures Playwright routes for track-related API calls.
   */
  static async setupRoutes(page: any, overrides: any = {}) {
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
        body: JSON.stringify(
          overrides.factorySettings || MOCK_FACTORY_SETTINGS,
        ),
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
}

export const createTrackEditorDataServiceMock =
  TrackEditorHelper.createDataServiceMock;
export const createTrackManagerDataServiceMock =
  TrackEditorHelper.createDataServiceMock;
export const mockTrackManagerRoutes = TrackEditorHelper.setupRoutes;
