import { of, Subject } from "rxjs";
import { MOCK_DRIVERS } from "@app/testing/data/drivers_data";
import { deepCopy } from "@app/utils/clone.utils";

/**
 * Shared test helper for DriverManager and DriverEditor.
 * Handles both Jasmine mocks for unit tests and Playwright route mocking for screendiff tests.
 */
export class DriverManagerHelper {
  /**
   * Creates a Jasmine spy object for the DataService with driver-related methods.
   */
  static createDataServiceMock() {
    const spy = jasmine.createSpyObj("DataService", [
      "getDrivers",
      "deleteDriver",
      "updateDriver",
      "createDriver",
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
      "getSystemState",
    ]);
    spy.updateRaceSubscription = jasmine.createSpy("updateRaceSubscription");
    spy.connectToInterfaceDataSocket = jasmine.createSpy(
      "connectToInterfaceDataSocket",
    );
    spy.disconnectFromInterfaceDataSocket = jasmine.createSpy(
      "disconnectFromInterfaceDataSocket",
    );
    spy.getRaceUpdate = jasmine
      .createSpy("getRaceUpdate")
      .and.returnValue(new Subject().asObservable());
    spy.getRaceTime = jasmine
      .createSpy("getRaceTime")
      .and.returnValue(new Subject().asObservable());
    spy.getLaps = jasmine
      .createSpy("getLaps")
      .and.returnValue(new Subject().asObservable());
    spy.getCarData = jasmine
      .createSpy("getCarData")
      .and.returnValue(new Subject().asObservable());
    spy.getSegments = jasmine
      .createSpy("getSegments")
      .and.returnValue(new Subject().asObservable());
    spy.getStandingsUpdate = jasmine
      .createSpy("getStandingsUpdate")
      .and.returnValue(new Subject().asObservable());
    spy.getOverallStandingsUpdate = jasmine
      .createSpy("getOverallStandingsUpdate")
      .and.returnValue(new Subject().asObservable());
    spy.getInterfaceEvents = jasmine
      .createSpy("getInterfaceEvents")
      .and.returnValue(new Subject().asObservable());
    spy.getRaceState = jasmine
      .createSpy("getRaceState")
      .and.returnValue(new Subject().asObservable());
    spy.getRaceFlag = jasmine
      .createSpy("getRaceFlag")
      .and.returnValue(new Subject().asObservable());
    spy.getHeats = jasmine
      .createSpy("getHeats")
      .and.returnValue(new Subject().asObservable());
    spy.getRecordData = jasmine
      .createSpy("getRecordData")
      .and.returnValue(of(null));
    spy.getSystemState = jasmine
      .createSpy("getSystemState")
      .and.returnValue(of(null));

    spy.getDrivers.and.callFake(() => of(deepCopy(MOCK_DRIVERS)));
    spy.deleteDriver.and.returnValue(of({ success: true }));
    spy.updateDriver.and.callFake((id: string, driver: any) => of(driver));
    spy.createDriver.and.callFake((driver: any) =>
      of({ ...driver, entity_id: "d-new-id" }),
    );
    spy.listAssets.and.returnValue(of([]));
    spy.socketConnected$ = of(true);

    return spy;
  }

  /**
   * Configures Playwright routes for driver-related API calls.
   */
  static async setupRoutes(page: any) {
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
export const createDriverManagerDataServiceMock =
  DriverManagerHelper.createDataServiceMock;
