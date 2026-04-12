import { of, Subject } from "rxjs";

import { com } from "../../../proto/message";
import { MOCK_DRIVERS } from "../../../testing/data/drivers_data";
import { MOCK_HEATS } from "../../../testing/data/heats_data";
import { MOCK_RACES } from "../../../testing/data/races_data";
import { MOCK_TEAMS } from "../../../testing/data/teams_data";
import { MOCK_TRACKS } from "../../../testing/data/tracks_data";

/**
 * Creates a comprehensive set of mocks for Raceday tests.
 */
export function createRacedayMocks(overrides: any = {}) {
  const interfaceEventsSubject = new Subject<com.antigravity.IInterfaceEvent>();
  const interfaceAlertSubject = new Subject<{
    titleKey: string;
    messageKey: string;
  }>();
  const raceTimeSubject = new Subject<com.antigravity.IRaceTime>();
  const lapsSubject = new Subject<com.antigravity.ILap>();
  const raceStateSubject = new Subject<com.antigravity.RaceState>();
  const standingsUpdateSubject =
    new Subject<com.antigravity.IStandingsUpdate>();
  const participantsSubject = new Subject<any[]>();

  const mockDataService = jasmine.createSpyObj("DataService", [
    "updateRaceSubscription",
    "getRaceUpdate",
    "getRaceTime",
    "getLaps",
    "getReactionTimes",
    "getStandingsUpdate",
    "getOverallStandingsUpdate",
    "getInterfaceEvents",
    "getRaceState",
    "getDrivers",
    "connectToInterfaceDataSocket",
    "disconnectFromInterfaceDataSocket",
    "listAssets",
    "getCarData",
    "getSegments",
  ]);
  mockDataService.listAssets.and.returnValue(of([]));
  mockDataService.getDrivers.and.callFake(() =>
    of(
      JSON.parse(JSON.stringify(MOCK_DRIVERS)).map((d: any) => ({
        ...d,
        lapAudio: { url: "", type: "none", text: "" },
        bestLapAudio: { url: "", type: "none", text: "" },
      })),
    ),
  );
  mockDataService.serverUrl = "http://localhost";

  const mockRaceConnectionService = jasmine.createSpyObj(
    "RaceConnectionService",
    ["connect", "disconnect"],
  );
  mockRaceConnectionService.interfaceEvents$ =
    interfaceEventsSubject.asObservable();
  mockRaceConnectionService.interfaceAlert$ =
    interfaceAlertSubject.asObservable();
  mockRaceConnectionService.raceTime$ = raceTimeSubject.asObservable();
  mockRaceConnectionService.laps$ = lapsSubject.asObservable();
  mockRaceConnectionService.carData$ = of({});
  mockRaceConnectionService.segments$ = of(null);
  mockRaceConnectionService.reactionTimes$ = of(null);
  mockRaceConnectionService.standingsUpdate$ =
    standingsUpdateSubject.asObservable();
  mockRaceConnectionService.raceState$ = raceStateSubject.asObservable();
  mockRaceConnectionService.isInterfaceConnected = false;

  const mockRaceService = jasmine.createSpyObj("RaceService", [
    "setRace",
    "setParticipants",
    "setHeats",
    "setCurrentHeat",
    "getRace",
    "getHeats",
    "getCurrentHeat",
  ]);
  const mockHeatsWithAudio = JSON.parse(JSON.stringify(MOCK_HEATS)).map(
    (h: any) => ({
      ...h,
      heatDrivers: h.heatDrivers.map((hd: any) => ({
        ...hd,
        driver: {
          ...hd.driver,
          lapAudio: { url: "", type: "none", text: "" },
          bestLapAudio: { url: "", type: "none", text: "" },
        },
      })),
    }),
  );

  const mockRaceWithTrack = { ...MOCK_RACES[0], track: MOCK_TRACKS[0] };
  mockRaceService.currentHeat$ = of(mockHeatsWithAudio[0]);
  mockRaceService.race$ = of(mockRaceWithTrack);
  mockRaceService.participants$ = participantsSubject.asObservable();
  mockRaceService.getRace.and.returnValue(mockRaceWithTrack);
  mockRaceService.getHeats.and.returnValue(mockHeatsWithAudio);
  mockRaceService.getCurrentHeat.and.returnValue(mockHeatsWithAudio[0]);

  return {
    mockDataService,
    mockRaceConnectionService,
    mockRaceService,
    interfaceEventsSubject,
    interfaceAlertSubject,
    raceTimeSubject,
    lapsSubject,
    raceStateSubject,
    standingsUpdateSubject,
    participantsSubject,
    ...overrides,
  };
}

/**
 * Playwright route mocking for Raceday.
 */
export async function mockRacedayRoutes(page: any, overrides: any = {}) {
  await page.route("**/api/races/current", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrides.race || MOCK_RACES[0]),
    });
  });

  await page.route("**/api/heats", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrides.heats || MOCK_HEATS),
    });
  });
}
