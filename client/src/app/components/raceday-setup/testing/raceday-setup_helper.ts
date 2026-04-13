import { BehaviorSubject, of } from "rxjs";

import { com } from "../../../proto/message";
import { MOCK_DRIVERS } from "../../../testing/data/drivers_data";
import { MOCK_RACES } from "../../../testing/data/races_data";
import { createDefaultSettings } from "../../../testing/data/settings_data";
import { MOCK_TEAMS } from "../../../testing/data/teams_data";

export const MOCK_AUTOSAVE_RACES = ["autosave_r1.json", "autosave_r2.json"];

/**
 * Creates a mock DataService configured for Raceday Setup tests.
 */
export function createRacedaySetupDataServiceMock(overrides: any = {}) {
  const mock = jasmine.createSpyObj("DataService", [
    "getDrivers",
    "getTeams",
    "getRaces",
    "initializeRace",
    "getSavedRaces",
    "loadRace",
    "deleteSavedRace",
    "toggleServerAnalytics",
    "getRaceFlag",
  ]);

  mock.getDrivers.and.callFake(() =>
    of(JSON.parse(JSON.stringify(MOCK_DRIVERS))),
  );
  mock.getTeams.and.callFake(() => of(JSON.parse(JSON.stringify(MOCK_TEAMS))));
  mock.getRaces.and.callFake(() => of(JSON.parse(JSON.stringify(MOCK_RACES))));
  mock.getSavedRaces.and.callFake(() =>
    of(JSON.parse(JSON.stringify(MOCK_AUTOSAVE_RACES))),
  );
  mock.loadRace.and.returnValue(of("OK"));
  mock.deleteSavedRace.and.returnValue(of("OK"));
  mock.toggleServerAnalytics.and.returnValue(of("OK"));
  mock.initializeRace.and.returnValue(
    of(com.antigravity.InitializeRaceResponse.create({ success: true })),
  );
  mock.getRaceFlag.and.returnValue(of(com.antigravity.RaceFlag.RED));

  return Object.assign(mock, overrides);
}

/**
 * Creates a mock HelpService configured for Raceday Setup tests.
 */
export function createRacedaySetupHelpServiceMock(overrides: any = {}) {
  const mock = jasmine.createSpyObj("HelpService", [
    "startGuide",
    "nextStep",
    "previousStep",
    "endGuide",
  ]);
  mock.isVisible$ = new BehaviorSubject(false);
  mock.currentStep$ = new BehaviorSubject(null);
  mock.hasNext$ = new BehaviorSubject(false);
  mock.hasPrevious$ = new BehaviorSubject(false);

  return Object.assign(mock, overrides);
}

/**
 * Playwright route mocking for Raceday Setup.
 */
export async function mockRacedaySetupRoutes(page: any, overrides: any = {}) {
  await page.route("**/api/drivers", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrides.drivers || MOCK_DRIVERS),
    });
  });

  await page.route("**/api/teams", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrides.teams || MOCK_TEAMS),
    });
  });

  await page.route("**/api/races", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrides.races || MOCK_RACES),
    });
  });

  await page.route("**/api/races/saved", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrides.savedRaces || MOCK_AUTOSAVE_RACES),
    });
  });
}
