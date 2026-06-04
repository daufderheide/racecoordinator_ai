import { of, Subject } from "rxjs";
import { deepCopy } from "@app/utils/clone.utils";

import { Settings } from "../models/settings";
import { MOCK_DRIVERS } from "./data/drivers_data";
import { MOCK_RACES } from "./data/races_data";
import { createDefaultSettings } from "./data/settings_data";
import { MOCK_TEAMS } from "./data/teams_data";

export const mockDataService = {
  listAssets: jasmine.createSpy("listAssets").and.returnValue(of([])),
  deleteAsset: jasmine.createSpy("deleteAsset").and.returnValue(of(true)),
  renameAsset: jasmine.createSpy("renameAsset").and.returnValue(of(true)),
  getDrivers: jasmine
    .createSpy("getDrivers")
    .and.callFake(() => of(deepCopy(MOCK_DRIVERS))),
  getTeams: jasmine
    .createSpy("getTeams")
    .and.callFake(() => of(deepCopy(MOCK_TEAMS))),
  getRaces: jasmine
    .createSpy("getRaces")
    .and.callFake(() => of(deepCopy(MOCK_RACES))),
  createTeam: jasmine
    .createSpy("createTeam")
    .and.returnValue(of({ entity_id: "new_t" })),
  updateTeam: jasmine
    .createSpy("updateTeam")
    .and.returnValue(of({ entity_id: "t1" })),
  deleteTeam: jasmine.createSpy("deleteTeam").and.returnValue(of(true)),
  uploadAsset: jasmine.createSpy("uploadAsset").and.returnValue(of(true)),
  getCurrentDatabase: jasmine
    .createSpy("getCurrentDatabase")
    .and.returnValue(of({ name: "test_db" })),
  getServerVersion: jasmine
    .createSpy("getServerVersion")
    .and.returnValue(of("1.0.0")),
  connectToRaceDataSocket: jasmine.createSpy("connectToRaceDataSocket"),
  getServerAnalyticsConfig: jasmine
    .createSpy("getServerAnalyticsConfig")
    .and.returnValue(of({ measurementId: "G-TEST", clientId: "test-client" })),
  getDatabases: jasmine.createSpy("getDatabases").and.returnValue(of([])),
  switchDatabase: jasmine
    .createSpy("switchDatabase")
    .and.returnValue(of({ success: true })),
  createDatabase: jasmine
    .createSpy("createDatabase")
    .and.returnValue(of({ success: true })),
  copyDatabase: jasmine
    .createSpy("copyDatabase")
    .and.returnValue(of({ success: true })),
  resetDatabase: jasmine
    .createSpy("resetDatabase")
    .and.returnValue(of({ success: true })),
  deleteDatabase: jasmine
    .createSpy("deleteDatabase")
    .and.returnValue(of({ success: true })),
  exportDatabase: jasmine.createSpy("exportDatabase"),
  importDatabase: jasmine
    .createSpy("importDatabase")
    .and.returnValue(of({ success: true })),
  getTracks: jasmine.createSpy("getTracks").and.returnValue(of([])),
  saveCustomRotation: jasmine
    .createSpy("saveCustomRotation")
    .and.returnValue(of({})),
  updateRaceSubscription: jasmine.createSpy("updateRaceSubscription"),
  connectToInterfaceDataSocket: jasmine.createSpy(
    "connectToInterfaceDataSocket",
  ),
  disconnectFromInterfaceDataSocket: jasmine.createSpy(
    "disconnectFromInterfaceDataSocket",
  ),
  getRaceUpdate: jasmine
    .createSpy("getRaceUpdate")
    .and.returnValue(new Subject().asObservable()),
  getRaceTime: jasmine
    .createSpy("getRaceTime")
    .and.returnValue(new Subject().asObservable()),
  getLaps: jasmine
    .createSpy("getLaps")
    .and.returnValue(new Subject().asObservable()),
  getCarData: jasmine
    .createSpy("getCarData")
    .and.returnValue(new Subject().asObservable()),
  getSegments: jasmine
    .createSpy("getSegments")
    .and.returnValue(new Subject().asObservable()),
  getStandingsUpdate: jasmine
    .createSpy("getStandingsUpdate")
    .and.returnValue(new Subject().asObservable()),
  getOverallStandingsUpdate: jasmine
    .createSpy("getOverallStandingsUpdate")
    .and.returnValue(new Subject().asObservable()),
  getInterfaceEvents: jasmine
    .createSpy("getInterfaceEvents")
    .and.returnValue(new Subject().asObservable()),
  getRaceState: jasmine
    .createSpy("getRaceState")
    .and.returnValue(new Subject().asObservable()),
  getRaceFlag: jasmine
    .createSpy("getRaceFlag")
    .and.returnValue(new Subject().asObservable()),
  getHeats: jasmine
    .createSpy("getHeats")
    .and.returnValue(new Subject().asObservable()),
  getRecordData: jasmine.createSpy("getRecordData").and.returnValue(of(null)),
  getSystemState: jasmine
    .createSpy("getSystemState")
    .and.returnValue(new Subject().asObservable()),
  getServerIp: jasmine
    .createSpy("getServerIp")
    .and.returnValue(of("127.0.0.1")),
  socketConnected$: of(true),
  serverUrl: "http://localhost:7070",
};

export const mockTranslationService = {
  translate: jasmine.createSpy("translate").and.callFake((key: string) => key),
  getTranslationsLoaded: jasmine
    .createSpy("getTranslationsLoaded")
    .and.returnValue(of(true)),
  setLanguage: jasmine.createSpy("setLanguage"),
  getBrowserLanguage: jasmine
    .createSpy("getBrowserLanguage")
    .and.returnValue("en"),
  getSupportedLanguages: jasmine
    .createSpy("getSupportedLanguages")
    .and.returnValue([]),
  getCurrentLanguage: jasmine
    .createSpy("getCurrentLanguage")
    .and.returnValue(of("en")),
};

export const mockRouter = {
  navigate: jasmine.createSpy("navigate"),
  events: new Subject().asObservable(),
  serializeUrl: jasmine.createSpy("serializeUrl").and.returnValue("mock-url"),
  createUrlTree: jasmine.createSpy("createUrlTree").and.returnValue({}),
};

export const mockAnalyticsService = {
  isEnabled: jasmine.createSpy("isEnabled").and.returnValue(true),
  toggleAnalytics: jasmine
    .createSpy("toggleAnalytics")
    .and.returnValue(of({ success: true })),
  initTracking: jasmine.createSpy("initTracking"),
  updateOptOutStatus: jasmine.createSpy("updateOptOutStatus"),
  trackClick: jasmine.createSpy("trackClick"),
  trackPageView: jasmine.createSpy("trackPageView"),
};

/** @deprecated Use createDefaultSettings from settings_data.ts instead */
export function createTestSettings(
  overrides: Partial<Settings> = {},
): Settings {
  return createDefaultSettings(overrides);
}

export const mockSettingsService = {
  getSettings: jasmine
    .createSpy("getSettings")
    .and.callFake(() => createDefaultSettings()),
  saveSettings: jasmine.createSpy("saveSettings"),
};

export const mockLoggerService = jasmine.createSpyObj("LoggerService", [
  "debug",
  "info",
  "warn",
  "error",
  "log",
]);

/**
 * Resets all shared mock spies and subjects to their default state.
 */
export function resetMocks() {
  const mocks = [
    mockDataService,
    mockTranslationService,
    mockRouter,
    mockAnalyticsService,
    mockSettingsService,
    mockLoggerService,
  ];

  mocks.forEach((mock) => {
    Object.keys(mock).forEach((key) => {
      const prop = (mock as any)[key];
      if (prop && prop.calls && typeof prop.calls.reset === "function") {
        prop.calls.reset();
      }
    });
  });

  // Restore default behaviors for mockDataService
  mockDataService.getDrivers.and.callFake(() => of(deepCopy(MOCK_DRIVERS)));
  mockDataService.getTeams.and.callFake(() => of(deepCopy(MOCK_TEAMS)));
  mockDataService.getRaces.and.callFake(() => of(deepCopy(MOCK_RACES)));
  mockDataService.listAssets.and.returnValue(of([]));
  mockDataService.getDatabases.and.returnValue(of([]));
  mockDataService.connectToRaceDataSocket.and.stub();
  mockDataService.getRaceUpdate.and.returnValue(new Subject().asObservable());
  mockDataService.getRaceTime.and.returnValue(new Subject().asObservable());
  mockDataService.getLaps.and.returnValue(new Subject().asObservable());
  mockDataService.getCarData.and.returnValue(new Subject().asObservable());
  mockDataService.getSegments.and.returnValue(new Subject().asObservable());
  mockDataService.getStandingsUpdate.and.returnValue(
    new Subject().asObservable(),
  );
  mockDataService.getOverallStandingsUpdate.and.returnValue(
    new Subject().asObservable(),
  );
  mockDataService.getInterfaceEvents.and.returnValue(
    new Subject().asObservable(),
  );
  mockDataService.getRaceState.and.returnValue(new Subject().asObservable());
  mockDataService.getRaceFlag.and.returnValue(new Subject().asObservable());
  mockDataService.getHeats.and.returnValue(new Subject().asObservable());
  mockDataService.getRecordData.and.returnValue(of(null));
  mockDataService.getSystemState.and.returnValue(new Subject().asObservable());
  mockDataService.getServerIp.and.returnValue(of("127.0.0.1"));
  mockDataService.getTracks.and.returnValue(of([]));
  mockDataService.socketConnected$ = of(true);
  mockDataService.saveCustomRotation.and.returnValue(of({}));
  mockDataService.updateRaceSubscription.and.stub();
  mockDataService.connectToInterfaceDataSocket.and.stub();
  mockDataService.disconnectFromInterfaceDataSocket.and.stub();

  // Restore default behaviors for mockTranslationService
  mockTranslationService.translate.and.callFake((key: string) => key);
  mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
  mockTranslationService.setLanguage.and.stub();
  mockTranslationService.getBrowserLanguage.and.returnValue("en");
  mockTranslationService.getSupportedLanguages.and.returnValue([]);
  mockTranslationService.getCurrentLanguage.and.returnValue(of("en"));

  // Restore default behaviors for mockRouter
  mockRouter.navigate.and.stub();
  (mockRouter as any).events = new Subject().asObservable();
  mockRouter.serializeUrl.and.returnValue("mock-url");
  mockRouter.createUrlTree.and.returnValue({});

  // Restore default behaviors for mockAnalyticsService
  mockAnalyticsService.isEnabled.and.returnValue(true);
  mockAnalyticsService.toggleAnalytics.and.returnValue(of({ success: true }));
  mockAnalyticsService.initTracking.and.stub();
  mockAnalyticsService.updateOptOutStatus.and.stub();
  mockAnalyticsService.trackClick.and.stub();
  mockAnalyticsService.trackPageView.and.stub();

  // Restore default behaviors for mockSettingsService
  mockSettingsService.getSettings.and.callFake(() => createDefaultSettings());
  mockSettingsService.saveSettings.and.stub();

  // Restore default behaviors for mockLoggerService
  mockLoggerService.debug.and.stub();
  mockLoggerService.info.and.stub();
  mockLoggerService.warn.and.stub();
  mockLoggerService.error.and.stub();
  mockLoggerService.log.and.stub();
}
