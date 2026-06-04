import { BehaviorSubject, of, Subject } from "rxjs";
import {
  ICarData,
  IInterfaceEvent,
  ILap,
  InterfaceStatus,
  IRaceTime,
  IRecordData,
  ISegment,
  IStandingsUpdate,
  RaceFlag,
  RaceState,
} from "@app/proto/antigravity";
import { IReactionTime } from "@app/services/race-connection.service";
import { deepCopy } from "@app/utils/clone.utils";

import { MOCK_DRIVERS } from "../../../testing/data/drivers_data";
import { MOCK_HEATS } from "../../../testing/data/heats_data";
import { MOCK_RACES } from "../../../testing/data/races_data";
import { MOCK_TEAMS as _MOCK_TEAMS } from "../../../testing/data/teams_data";
import {
  MOCK_TRACK_INSTANCES,
  MOCK_TRACKS as _MOCK_TRACKS,
} from "../../../testing/data/tracks_data";
/**
 * Creates a comprehensive set of mocks for Raceday tests.
 */
export function createRacedayMocks(overrides: any = {}) {
  const interfaceEventsSubject = new Subject<IInterfaceEvent>();
  const interfaceAlertSubject = new Subject<{
    titleKey: string;
    messageKey: string;
  }>();
  const raceTimeSubject = new BehaviorSubject<IRaceTime>({
    time: 0,
  });
  const lapsSubject = new Subject<ILap>();
  const raceStateSubject = new BehaviorSubject<RaceState>(
    RaceState.UNKNOWN_STATE,
  );
  const standingsUpdateSubject = new Subject<IStandingsUpdate>();
  const participantsSubject = new Subject<any[]>();
  const recordDataSubject = new BehaviorSubject<IRecordData | null>(null);
  const segmentSubject = new BehaviorSubject<ISegment | null>(null);
  const reactionTimeSubject = new BehaviorSubject<IReactionTime | null>(null);
  const carDataSubject = new BehaviorSubject<ICarData>({});
  const raceFlagSubject = new BehaviorSubject<RaceFlag>(RaceFlag.RED);
  const interfaceStatusSubject = new BehaviorSubject<InterfaceStatus>(
    InterfaceStatus.DISCONNECTED,
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
    "getThemes",
    "connectToInterfaceDataSocket",
    "disconnectFromInterfaceDataSocket",
    "listAssets",
    "getCarData",
    "getSegments",
    "getRaceFlag",
    "getRecordData",
    "abortTimers",
    "changeLane",
    "getAssetUrl",
    "updateUserLaps",
    "getServerIp",
    "startRace",
    "pauseRace",
    "nextHeat",
    "restartHeat",
    "deferHeat",
    "skipHeat",
    "getSystemState",
  ]);
  mockDataService.listAssets.and.returnValue(of([]));
  mockDataService.getRaceFlag.and.returnValue(of(RaceFlag.RED));
  mockDataService.getThemes.and.returnValue(of([]));
  mockDataService.startRace.and.returnValue(of(true));
  mockDataService.pauseRace.and.returnValue(of(true));
  mockDataService.nextHeat.and.returnValue(of(true));
  mockDataService.restartHeat.and.returnValue(of(true));
  mockDataService.deferHeat.and.returnValue(of(true));
  mockDataService.skipHeat.and.returnValue(of(true));
  mockDataService.getDrivers.and.callFake(() =>
    of(
      deepCopy(MOCK_DRIVERS).map((d: any) => ({
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
  mockDataService.getAssetUrl.and.callFake(
    (id: string) => `/api/assets/download/${id}`,
  );
  mockDataService.getServerIp.and.returnValue(of("127.0.0.1"));
  mockDataService.getSystemState.and.returnValue(
    new BehaviorSubject<any>({ resourceLockState: "ACTIVE" }),
  );
  mockDataService.serverUrl = "http://localhost/";
  mockDataService.socketConnected$ = of(true);

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
  const mockHeatsWithAudio = deepCopy(MOCK_HEATS).map((h: any) => ({
    ...h,
    heatDrivers: h.heatDrivers.map((hd: any) => ({
      ...hd,
      driver: {
        ...hd.driver,
        lapAudio: { url: "", type: "none", text: "" },
        bestLapAudio: { url: "", type: "none", text: "" },
      },
    })),
  }));

  const mockRaceWithTrack = {
    ...MOCK_RACES[0],
    track: MOCK_TRACK_INSTANCES[0],
  };
  mockRaceService.currentHeat$ = of(mockHeatsWithAudio[0]);
  mockRaceService.selectedRace$ = of(mockRaceWithTrack);
  mockRaceService.heats$ = of(mockHeatsWithAudio);
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
        "getFlagUrl",
      ]);
      spy.getFlagType.and.returnValue("red");
      spy.getFlagColor.and.returnValue("red");
      spy.getFlagNameKey.and.returnValue("RACE_FLAG_RED");
      spy.getFlagUrl.and.callFake((flag: any) => {
        const flagType = typeof flag === "string" ? flag : "red";
        const enumMap: Record<number, string> = {
          [RaceFlag.RED]: "red",
          [RaceFlag.GREEN]: "green",
          [RaceFlag.YELLOW]: "yellow",
          [RaceFlag.WHITE]: "white",
          [RaceFlag.CHECKERED]: "checkered",
          [RaceFlag.GREEN_YELLOW]: "green_yellow",
          [RaceFlag.BLACK]: "black",
        };
        const type =
          typeof flag === "number" ? enumMap[flag] || "red" : flagType;

        const nameMap: Record<string, string> = {
          green: "green",
          yellow: "yellow",
          red: "red",
          white: "white",
          checkered: "checkered",
          green_yellow: "yellow_green",
          black: "black",
        };
        const name = nameMap[type] || "red";
        const ext = name === "black" ? "svg" : "png";
        return `/assets/images/flags/${name}.${ext}`;
      });
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
