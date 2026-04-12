import { of } from "rxjs";
import { MOCK_DRIVERS } from "src/app/testing/data/drivers_data";

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
    ]);

    spy.getDrivers.and.callFake(() =>
      of(JSON.parse(JSON.stringify(MOCK_DRIVERS))),
    );
    spy.deleteDriver.and.returnValue(of({ success: true }));
    spy.updateDriver.and.callFake((id: string, driver: any) => of(driver));
    spy.createDriver.and.callFake((driver: any) =>
      of({ ...driver, entity_id: "d-new-id" }),
    );
    spy.listAssets.and.returnValue(of([]));

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
