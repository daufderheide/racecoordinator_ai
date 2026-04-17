import { BehaviorSubject, of, Subject } from "rxjs";

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
  const raceTimeSubject = new BehaviorSubject<com.antigravity.IRaceTime>({
    time: 0,
  });
  const lapsSubject = new Subject<com.antigravity.ILap>();
  const raceStateSubject = new BehaviorSubject<com.antigravity.RaceState>(
    com.antigravity.RaceState.UNKNOWN_STATE,
  );
  const standingsUpdateSubject =
    new Subject<com.antigravity.IStandingsUpdate>();
  const participantsSubject = new Subject<any[]>();
  const recordDataSubject =
    new BehaviorSubject<com.antigravity.IRecordData | null>(null);
  const segmentSubject = new BehaviorSubject<com.antigravity.ISegment | null>(
    null,
  );
  const reactionTimeSubject =
    new BehaviorSubject<com.antigravity.IReactionTime | null>(null);
  const carDataSubject = new BehaviorSubject<com.antigravity.ICarData>({});
  const raceFlagSubject = new BehaviorSubject<com.antigravity.RaceFlag>(
    com.antigravity.RaceFlag.RED,
  );
  const interfaceStatusSubject =
    new BehaviorSubject<com.antigravity.InterfaceStatus>(
      com.antigravity.InterfaceStatus.DISCONNECTED,
    );

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
    "getRaceFlag",
    "getRecordData",
  ]);
  mockDataService.listAssets.and.returnValue(of([]));
  mockDataService.getRaceFlag.and.returnValue(of(com.antigravity.RaceFlag.RED));
  mockDataService.getDrivers.and.callFake(() =>
    of(
      JSON.parse(JSON.stringify(MOCK_DRIVERS)).map((d: any) => ({
        ...d,
        lapAudio: { url: "", type: "none", text: "" },
        bestLapAudio: { url: "", type: "none", text: "" },
      })),
    ),
  );
  mockDataService.getReactionTimes.and.returnValue(
    reactionTimeSubject.asObservable(),
  );
  mockDataService.getCarData.and.returnValue(carDataSubject.asObservable());
  mockDataService.getSegments.and.returnValue(segmentSubject.asObservable());
  mockDataService.getRecordData.and.returnValue(
    recordDataSubject.asObservable(),
  );
  mockDataService.serverUrl = "http://localhost/";

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
  mockRaceConnectionService.carData$ = carDataSubject.asObservable();
  mockRaceConnectionService.segments$ = segmentSubject.asObservable();
  mockRaceConnectionService.reactionTimes$ = reactionTimeSubject.asObservable();
  mockRaceConnectionService.standingsUpdate$ =
    standingsUpdateSubject.asObservable();
  mockRaceConnectionService.raceState$ = raceStateSubject.asObservable();
  mockRaceConnectionService.recordData$ = recordDataSubject.asObservable();
  mockRaceConnectionService.raceFlag$ = raceFlagSubject.asObservable();
  mockRaceConnectionService.interfaceStatus$ =
    interfaceStatusSubject.asObservable();
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
    mockRaceFlagService: (() => {
      const spy = jasmine.createSpyObj("RaceFlagService", [
        "getFlagType",
        "getFlagColor",
        "getFlagNameKey",
      ]);
      spy.getFlagType.and.returnValue("red");
      spy.getFlagColor.and.returnValue("red");
      spy.getFlagNameKey.and.returnValue("RACE_FLAG_RED");
      return spy;
    })(),
    interfaceEventsSubject,
    interfaceAlertSubject,
    raceTimeSubject,
    lapsSubject,
    raceStateSubject,
    standingsUpdateSubject,
    participantsSubject,
    recordDataSubject,
    segmentSubject,
    reactionTimeSubject,
    carDataSubject,
    raceFlagSubject,
    interfaceStatusSubject,
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
