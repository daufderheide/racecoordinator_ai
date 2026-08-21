import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Event } from "@app/models/event";
import { Season } from "@app/models/season";
import {
  ArduinoConfig,
  PhidgetConfig,
  TrackmateConfig,
} from "@app/models/track";
import {
  DeferHeatResponse,
  DeleteAssetResponse,
  EndRaceResponse,
  GetPhidgetDevicesResponse,
  InitializeInterfaceResponse,
  InitializeRaceResponse,
  InterfaceEvent,
  ListAssetsResponse,
  ModifyHeatsResponse,
  NextHeatResponse,
  PauseRaceResponse,
  RaceData,
  RaceFlag,
  RaceState,
  RegenerateHeatsResponse,
  RenameAssetResponse,
  RestartHeatResponse,
  SaveAudioSetResponse,
  SaveCustomRotationResponse,
  SaveImageSetResponse,
  SetInterfacePinStateResponse,
  SetInterfaceRgbLedStateResponse,
  SkipHeatResponse,
  SkipRaceResponse,
  StartRaceResponse,
  UpdateInterfaceConfigResponse,
  UploadAssetResponse,
} from "@app/proto/antigravity";

import { DataService } from "./data.service";

describe("DataService", () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService],
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should get server version and server IP", (done) => {
    service.getServerVersion().subscribe((v) => {
      expect(v).toBe("1.0.0");
      service.getServerIp().subscribe((ip) => {
        expect(ip).toBe("127.0.0.1");
        done();
      });
    });

    const req1 = httpMock.expectOne((r) => r.url.endsWith("/api/version"));
    expect(req1.request.method).toBe("GET");
    req1.flush("1.0.0");

    const req2 = httpMock.expectOne((r) => r.url.endsWith("/api/server-ip"));
    expect(req2.request.method).toBe("GET");
    req2.flush("127.0.0.1");
  });

  it("should set server log level", (done) => {
    service.setServerLogLevel("DEBUG").subscribe((res) => {
      expect(res).toBe("OK");
      done();
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith("/api/settings/log-level?level=DEBUG"),
    );
    expect(req.request.method).toBe("POST");
    req.flush("OK");
  });

  it("should handle Driver CRUD operations", (done) => {
    const mockDriver = { name: "Racer 1", entity_id: "d1" };

    service.getDrivers().subscribe((drivers) => {
      expect(drivers.length).toBe(1);
      service.createDriver(mockDriver).subscribe((created) => {
        expect(created.name).toBe("Racer 1");
        service.updateDriver("d1", mockDriver).subscribe((updated) => {
          expect(updated.name).toBe("Racer 1");
          service.deleteDriver("d1").subscribe((del) => {
            expect(del.success).toBeTrue();
            done();
          });
        });
      });
    });

    const req1 = httpMock.expectOne((r) => r.url.endsWith("/api/drivers"));
    expect(req1.request.method).toBe("GET");
    req1.flush([mockDriver]);

    const req2 = httpMock.expectOne((r) => r.url.endsWith("/api/drivers"));
    expect(req2.request.method).toBe("POST");
    req2.flush(mockDriver);

    const req3 = httpMock.expectOne((r) => r.url.endsWith("/api/drivers/d1"));
    expect(req3.request.method).toBe("PUT");
    req3.flush(mockDriver);

    const req4 = httpMock.expectOne((r) => r.url.endsWith("/api/drivers/d1"));
    expect(req4.request.method).toBe("DELETE");
    req4.flush({ success: true });
  });

  it("should handle Race CRUD operations", (done) => {
    const mockRace = { name: "Grand Prix", entity_id: "r1" };

    service.getRaces().subscribe((races) => {
      expect(races.length).toBe(1);
      service.createRace(mockRace).subscribe((created) => {
        expect(created.name).toBe("Grand Prix");
        service.updateRace("r1", mockRace).subscribe((updated) => {
          expect(updated.name).toBe("Grand Prix");
          service.deleteRace("r1").subscribe((del) => {
            expect(del.success).toBeTrue();
            done();
          });
        });
      });
    });

    const req1 = httpMock.expectOne((r) => r.url.endsWith("/api/races"));
    expect(req1.request.method).toBe("GET");
    req1.flush([mockRace]);

    const req2 = httpMock.expectOne((r) => r.url.endsWith("/api/races"));
    expect(req2.request.method).toBe("POST");
    req2.flush(mockRace);

    const req3 = httpMock.expectOne((r) => r.url.endsWith("/api/races/r1"));
    expect(req3.request.method).toBe("PUT");
    req3.flush(mockRace);

    const req4 = httpMock.expectOne((r) => r.url.endsWith("/api/races/r1"));
    expect(req4.request.method).toBe("DELETE");
    req4.flush({ success: true });
  });

  it("should handle Event CRUD operations", (done) => {
    const mockEvent = {
      name: "Cup Event",
      entity_id: "e1",
    } as unknown as Event;

    service.getEvents().subscribe((events) => {
      expect(events.length).toBe(1);
      service.getEvent("e1").subscribe((ev) => {
        expect(ev.name).toBe("Cup Event");
        service.createEvent(mockEvent).subscribe((created) => {
          expect(created.name).toBe("Cup Event");
          service.updateEvent("e1", mockEvent).subscribe((updated) => {
            expect(updated.name).toBe("Cup Event");
            service.deleteEvent("e1").subscribe((del) => {
              expect(del.success).toBeTrue();
              done();
            });
          });
        });
      });
    });

    const req1 = httpMock.expectOne((r) => r.url.endsWith("/api/events"));
    expect(req1.request.method).toBe("GET");
    req1.flush([mockEvent]);

    const req2 = httpMock.expectOne((r) => r.url.endsWith("/api/events/e1"));
    expect(req2.request.method).toBe("GET");
    req2.flush(mockEvent);

    const req3 = httpMock.expectOne((r) => r.url.endsWith("/api/events"));
    expect(req3.request.method).toBe("POST");
    req3.flush(mockEvent);

    const req4 = httpMock.expectOne((r) => r.url.endsWith("/api/events/e1"));
    expect(req4.request.method).toBe("PUT");
    req4.flush(mockEvent);

    const req5 = httpMock.expectOne((r) => r.url.endsWith("/api/events/e1"));
    expect(req5.request.method).toBe("DELETE");
    req5.flush({ success: true });
  });

  it("should handle Season CRUD operations", (done) => {
    const mockSeason = {
      name: "Season 2026",
      entity_id: "s1",
    } as unknown as Season;

    service.getSeasons().subscribe((seasons) => {
      expect(seasons.length).toBe(1);
      service.getSeason("s1").subscribe((s) => {
        expect(s.name).toBe("Season 2026");
        service.createSeason(mockSeason).subscribe((created) => {
          expect(created.name).toBe("Season 2026");
          service.updateSeason("s1", mockSeason).subscribe((updated) => {
            expect(updated.name).toBe("Season 2026");
            service.deleteSeason("s1").subscribe((del) => {
              expect(del.success).toBeTrue();
              done();
            });
          });
        });
      });
    });

    const req1 = httpMock.expectOne((r) => r.url.endsWith("/api/seasons"));
    expect(req1.request.method).toBe("GET");
    req1.flush([mockSeason]);

    const req2 = httpMock.expectOne((r) => r.url.endsWith("/api/seasons/s1"));
    expect(req2.request.method).toBe("GET");
    req2.flush(mockSeason);

    const req3 = httpMock.expectOne((r) => r.url.endsWith("/api/seasons"));
    expect(req3.request.method).toBe("POST");
    req3.flush(mockSeason);

    const req4 = httpMock.expectOne((r) => r.url.endsWith("/api/seasons/s1"));
    expect(req4.request.method).toBe("PUT");
    req4.flush(mockSeason);

    const req5 = httpMock.expectOne((r) => r.url.endsWith("/api/seasons/s1"));
    expect(req5.request.method).toBe("DELETE");
    req5.flush({ success: true });
  });

  it("should call race control protobuf endpoints (start, pause, end, abort, nextHeat, restartHeat, skipHeat, skipRace)", (done) => {
    service.startRace().subscribe((startOk) => {
      expect(startOk).toBeTrue();
      service.pauseRace().subscribe((pauseOk) => {
        expect(pauseOk).toBeTrue();
        service.endRace().subscribe((endOk) => {
          expect(endOk).toBeTrue();
          service.abortTimers().subscribe((abortOk) => {
            expect(abortOk).toBeTrue();
            service.nextHeat().subscribe((nextOk) => {
              expect(nextOk).toBeTrue();
              service.restartHeat().subscribe((restartOk) => {
                expect(restartOk).toBeTrue();
                service.skipHeat().subscribe((skipOk) => {
                  expect(skipOk).toBeTrue();
                  service.skipRace().subscribe((skipRaceOk) => {
                    expect(skipRaceOk).toBeTrue();
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });

    const req1 = httpMock.expectOne((r) => r.url.endsWith("/api/start-race"));
    const startBuf = StartRaceResponse.encode(
      StartRaceResponse.create({ success: true }),
    ).finish();
    req1.flush(startBuf.slice().buffer);

    const req2 = httpMock.expectOne((r) => r.url.endsWith("/api/pause-race"));
    const pauseBuf = PauseRaceResponse.encode(
      PauseRaceResponse.create({ success: true }),
    ).finish();
    req2.flush(pauseBuf.slice().buffer);

    const req3 = httpMock.expectOne((r) => r.url.endsWith("/api/end-race"));
    const endBuf = EndRaceResponse.encode(
      EndRaceResponse.create({ success: true }),
    ).finish();
    req3.flush(endBuf.slice().buffer);

    const req4 = httpMock.expectOne((r) => r.url.endsWith("/api/abort-timers"));
    const abortBuf = PauseRaceResponse.encode(
      PauseRaceResponse.create({ success: true }),
    ).finish();
    req4.flush(abortBuf.slice().buffer);

    const req5 = httpMock.expectOne((r) => r.url.endsWith("/api/next-heat"));
    const nextBuf = NextHeatResponse.encode(
      NextHeatResponse.create({ success: true }),
    ).finish();
    req5.flush(nextBuf.slice().buffer);

    const req6 = httpMock.expectOne((r) => r.url.endsWith("/api/restart-heat"));
    const restartBuf = RestartHeatResponse.encode(
      RestartHeatResponse.create({ success: true }),
    ).finish();
    req6.flush(restartBuf.slice().buffer);

    const req7 = httpMock.expectOne((r) => r.url.endsWith("/api/skip-heat"));
    const skipBuf = SkipHeatResponse.encode(
      SkipHeatResponse.create({ success: true }),
    ).finish();
    req7.flush(skipBuf.slice().buffer);

    const req8 = httpMock.expectOne((r) => r.url.endsWith("/api/skip-race"));
    const skipRaceBuf = SkipRaceResponse.encode(
      SkipRaceResponse.create({ success: true }),
    ).finish();
    req8.flush(skipRaceBuf.slice().buffer);
  });

  it("should call setInterfacePinState and setInterfaceRgbLedState", (done) => {
    service.setInterfacePinState(5, true, true, 0).subscribe((res) => {
      expect(res.success).toBeTrue();
      service.setInterfaceRgbLedState(6, [], 0).subscribe((rgbRes) => {
        expect(rgbRes.success).toBeTrue();
        done();
      });
    });

    const req1 = httpMock.expectOne((r) =>
      r.url.endsWith("/api/set-interface-pin-state"),
    );
    const pinBuf = SetInterfacePinStateResponse.encode(
      SetInterfacePinStateResponse.create({ success: true }),
    ).finish();
    req1.flush(pinBuf.slice().buffer);

    const req2 = httpMock.expectOne((r) =>
      r.url.endsWith("/api/set-interface-rgb-led-state"),
    );
    const rgbBuf = SetInterfaceRgbLedStateResponse.encode(
      SetInterfaceRgbLedStateResponse.create({ success: true }),
    ).finish();
    req2.flush(rgbBuf.slice().buffer);
  });

  it("should get default demo config", () => {
    const config = service.getDefaultDemoConfig();
    expect(config.minLapTimeMs).toBe(3000);
    expect(config.maxLapTimeMs).toBe(5000);
    expect(config.numSegments).toBe(2);
  });

  it("should call exportRaceToCsv endpoint", (done) => {
    service.exportRaceToCsv().subscribe((csv) => {
      expect(csv).toBe("Driver,Laps,Time\nRacer1,10,12.34");
      done();
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith("/api/races/current/export-csv"),
    );
    expect(req.request.method).toBe("GET");
    req.flush("Driver,Laps,Time\nRacer1,10,12.34");
  });

  it("should call initialize-interface endpoint with configs", (done) => {
    const arduinoConfigs: ArduinoConfig[] = [
      {
        name: "Arduino 1",
        commPort: "COM1",
        baudRate: 9600,
        debounceUs: 1000,
        hardwareType: 0,
        normallyClosedLaneSensors: true,
        normallyClosedRelays: true,
        globalInvertLights: 0,
        usePitsAsLaps: false,
        useLapsForSegments: false,
        lapPinPitBehavior: 0,
        digitalIds: [],
        analogIds: [],
        ledStrings: [],
      } as ArduinoConfig,
    ];
    const trackmateConfigs: TrackmateConfig[] = [
      {
        name: "Trackmate 1",
        commPort: "COM2",
        normallyClosedRelays: true,
        normallyClosedLaneSensors: false,
        useIR: false,
        debounce: 5,
        numLanes: 4,
        hasPerLaneRelays: false,
        lapPinPitBehavior: 0,
        lapPinBehaviors: [],
      } as TrackmateConfig,
    ];

    service
      .initializeInterface(arduinoConfigs, trackmateConfigs, [], 4)
      .subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.success).toBeTrue();
        done();
      });

    const req = httpMock.expectOne((request) =>
      request.url.endsWith("/api/initialize-interface"),
    );
    expect(req.request.method).toBe("POST");
    expect(
      req.request.body instanceof ArrayBuffer ||
        req.request.body instanceof Blob,
    ).toBeTrue();

    const mockResponse = InitializeInterfaceResponse.create({
      success: true,
      message: "OK",
    });
    const buffer = InitializeInterfaceResponse.encode(mockResponse).finish();
    req.flush(buffer.slice().buffer);
  });

  it("should call save-audio-set endpoint", (done) => {
    const entries = [
      { name: "test.wav", timeSeconds: 5, data: new Uint8Array([1, 2, 3]) },
    ];

    service
      .saveAudioSet("My Set", entries as any, "id-123")
      .subscribe((asset) => {
        expect(asset).toBeTruthy();
        expect(asset.model?.entityId).toBe("new-id");
        done();
      });

    const req = httpMock.expectOne((request) =>
      request.url.endsWith("/api/assets/save-audio-set"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body instanceof Blob).toBeTrue();

    const saveResponse = SaveAudioSetResponse.create({
      success: true,
      asset: {
        model: { entityId: "new-id" },
        name: "My Set",
        type: "audio_set",
      },
    });
    const buffer = SaveAudioSetResponse.encode(saveResponse).finish();
    req.flush(
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ),
    );
  });

  it("should call updateUserLaps endpoint", (done) => {
    service.updateUserLaps(1, 1.25).subscribe((response) => {
      expect(response.adjustedLapCount).toBe(1.25);
      done();
    });

    const req = httpMock.expectOne(
      (request) =>
        request.url.endsWith("/api/races/current-heat/drivers/1/user-laps") &&
        request.body.userLaps === 1.25,
    );
    expect(req.request.method).toBe("POST");
    req.flush({ adjustedLapCount: 1.25 });
  });

  it("should call resetLaneHeatData endpoint", (done) => {
    service.resetLaneHeatData(2).subscribe((response) => {
      expect(response).toBeTrue();
      done();
    });

    const req = httpMock.expectOne((request) =>
      request.url.endsWith("/api/races/current-heat/drivers/2/reset"),
    );
    expect(req.request.method).toBe("POST");
    req.flush({});
  });

  it("should not close websocket if server address has not changed", () => {
    service["serverIp"] = "192.168.1.10";
    service["serverPort"] = 4200;

    const mockSocket = {
      close: jasmine.createSpy("close"),
    } as unknown as WebSocket;
    service["raceDataSocket"] = mockSocket;

    service.setServerAddress("192.168.1.10", 4200);

    expect(mockSocket.close).not.toHaveBeenCalled();
    expect(service["raceDataSocket"]).toBe(mockSocket);
  });

  it("should close websocket if server address changes", () => {
    service["serverIp"] = "192.168.1.10";
    service["serverPort"] = 4200;

    const mockSocket = {
      close: jasmine.createSpy("close"),
    } as unknown as WebSocket;
    service["raceDataSocket"] = mockSocket;

    service.setServerAddress("192.168.1.11", 4200);

    expect(mockSocket.close).toHaveBeenCalled();
    expect(service["raceDataSocket"]).toBeUndefined();
  });

  it("should set connection intent property", () => {
    service.setConnectionIntent("preview");
    expect(service["connectionIntent"]).toBe("preview");
  });

  it("should call setMainPower endpoint", (done) => {
    service.setMainPower(true).subscribe((response) => {
      expect(response).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne((request) =>
      request.url.endsWith("/api/track/power/main?on=true"),
    );
    expect(req.request.method).toBe("POST");
    req.flush({});
  });

  it("should call setLanePower endpoint", (done) => {
    service.setLanePower(2, false).subscribe((response) => {
      expect(response).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne((request) =>
      request.url.endsWith("/api/track/power/lane/2?on=false"),
    );
    expect(req.request.method).toBe("POST");
    req.flush({});
  });

  it("should call exportRaceXls endpoint", (done) => {
    service.exportRaceToXls().subscribe((response: any) => {
      expect(response).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne((request) =>
      request.url.endsWith("/api/races/current/export-xls"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob(["mock data"]));
  });

  it("should call getBleDevices endpoint", (done) => {
    service.getBleDevices().subscribe((devices) => {
      expect(devices).toEqual(["BART_0001", "BART_0002"]);
      done();
    });

    const req = httpMock.expectOne((request) =>
      request.url.endsWith("/api/ble-devices"),
    );
    expect(req.request.method).toBe("GET");
    req.flush(["BART_0001", "BART_0002"]);
  });

  it("should call resetRaceRecords endpoint", (done) => {
    service.resetRaceRecords("race_123").subscribe(() => {
      done();
    });

    const req = httpMock.expectOne((request) =>
      request.url.endsWith("/api/races/race_123/reset-records"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  describe("Exports, History, and Demo Configs", () => {
    it("should call exportRaceToCsv endpoint", (done) => {
      service.exportRaceToCsv().subscribe((csv) => {
        expect(csv).toBe("Lap,Driver,Time\n1,Speedy,5.2");
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.endsWith("/api/races/current/export-csv"),
      );
      expect(req.request.method).toBe("GET");
      req.flush("Lap,Driver,Time\n1,Speedy,5.2");
    });

    it("should provide default demo config with expected timing ranges", () => {
      const demoConfig = service.getDefaultDemoConfig();
      expect(demoConfig.minLapTimeMs).toBe(3000);
      expect(demoConfig.maxLapTimeMs).toBe(5000);
      expect(demoConfig.numSegments).toBe(2);
    });

    it("should retrieve and merge finished race history", (done) => {
      service.getAllFinishedRaceHistory().subscribe((history) => {
        expect(history.length).toBe(2);
        expect(history[0].is_demo).toBeFalse();
        expect(history[1].is_demo).toBeTrue();
        done();
      });

      const reqProd = httpMock.expectOne((r) =>
        r.url.endsWith("/api/history/races"),
      );
      expect(reqProd.request.method).toBe("GET");
      reqProd.flush([{ name: "Championship" }]);

      const reqDemo = httpMock.expectOne((r) =>
        r.url.endsWith("/api/history/races?demo=true"),
      );
      expect(reqDemo.request.method).toBe("GET");
      reqDemo.flush([{ name: "Demo Race" }]);
    });
  });

  describe("Teams and Themes API", () => {
    it("should handle Team CRUD operations", (done) => {
      const mockTeam = { name: "Ferrari", entity_id: "t1" };

      service.getTeams().subscribe((teams) => {
        expect(teams.length).toBe(1);
        service.createTeam(mockTeam).subscribe((created) => {
          expect(created.name).toBe("Ferrari");
          service.updateTeam("t1", mockTeam).subscribe((updated) => {
            expect(updated.name).toBe("Ferrari");
            service.deleteTeam("t1").subscribe((del) => {
              expect(del.success).toBeTrue();
              done();
            });
          });
        });
      });

      const reqGet = httpMock.expectOne((r) => r.url.endsWith("/api/teams"));
      expect(reqGet.request.method).toBe("GET");
      reqGet.flush([mockTeam]);

      const reqPost = httpMock.expectOne((r) => r.url.endsWith("/api/teams"));
      expect(reqPost.request.method).toBe("POST");
      reqPost.flush(mockTeam);

      const reqPut = httpMock.expectOne((r) => r.url.endsWith("/api/teams/t1"));
      expect(reqPut.request.method).toBe("PUT");
      reqPut.flush(mockTeam);

      const reqDel = httpMock.expectOne((r) => r.url.endsWith("/api/teams/t1"));
      expect(reqDel.request.method).toBe("DELETE");
      reqDel.flush({ success: true });
    });

    it("should handle Theme operations including duplicate and default", (done) => {
      const mockTheme = { name: "Dark Theme", entity_id: "th1" };

      service.getThemes().subscribe((themes) => {
        expect(themes.length).toBe(1);
        service.getDefaultTheme().subscribe((def) => {
          expect(def.name).toBe("Dark Theme");
          service.getTheme("th1").subscribe((t) => {
            expect(t.name).toBe("Dark Theme");
            service.createTheme(mockTheme).subscribe((created) => {
              expect(created.name).toBe("Dark Theme");
              service.updateTheme("th1", mockTheme).subscribe((updated) => {
                expect(updated.name).toBe("Dark Theme");
                service.duplicateTheme("th1", "Dark Copy").subscribe((dup) => {
                  expect(dup.name).toBe("Dark Copy");
                  service.deleteTheme("th1").subscribe((del) => {
                    expect(del.success).toBeTrue();
                    done();
                  });
                });
              });
            });
          });
        });
      });

      const reqList = httpMock.expectOne((r) => r.url.endsWith("/api/themes"));
      reqList.flush([mockTheme]);

      const reqDef = httpMock.expectOne((r) =>
        r.url.endsWith("/api/themes/default"),
      );
      reqDef.flush(mockTheme);

      const reqGet = httpMock.expectOne((r) =>
        r.url.endsWith("/api/themes/th1"),
      );
      reqGet.flush(mockTheme);

      const reqCreate = httpMock.expectOne((r) =>
        r.url.endsWith("/api/themes"),
      );
      reqCreate.flush(mockTheme);

      const reqUpdate = httpMock.expectOne((r) =>
        r.url.endsWith("/api/themes/th1"),
      );
      reqUpdate.flush(mockTheme);

      const reqDup = httpMock.expectOne((r) =>
        r.url.endsWith("/api/themes/th1/duplicate"),
      );
      expect(reqDup.request.body).toEqual({ name: "Dark Copy" });
      reqDup.flush({ name: "Dark Copy", entity_id: "th2" });

      const reqDel = httpMock.expectOne((r) =>
        r.url.endsWith("/api/themes/th1"),
      );
      reqDel.flush({ success: true });
    });
  });

  describe("Database Administration API", () => {
    it("should handle database management endpoints", (done) => {
      service.getDatabases().subscribe((dbs) => {
        expect(dbs).toEqual(["default", "season2026"]);
        service.getCurrentDatabase().subscribe((curr) => {
          expect(curr.name).toBe("default");
          service.createDatabase("new_db").subscribe((created) => {
            expect(created.success).toBeTrue();
            service.switchDatabase("new_db").subscribe((switched) => {
              expect(switched.success).toBeTrue();
              service.copyDatabase("copy_db", "default").subscribe((copied) => {
                expect(copied.success).toBeTrue();
                service.resetDatabase("copy_db").subscribe((reset) => {
                  expect(reset.success).toBeTrue();
                  service.deleteDatabase("copy_db").subscribe((del) => {
                    expect(del.success).toBeTrue();
                    done();
                  });
                });
              });
            });
          });
        });
      });

      const reqList = httpMock.expectOne((r) =>
        r.url.endsWith("/api/databases"),
      );
      reqList.flush(["default", "season2026"]);

      const reqCurr = httpMock.expectOne((r) =>
        r.url.includes("/api/databases/current"),
      );
      reqCurr.flush({ name: "default" });

      const reqCreate = httpMock.expectOne((r) =>
        r.url.endsWith("/api/databases/create"),
      );
      expect(reqCreate.request.body).toEqual({ name: "new_db" });
      reqCreate.flush({ success: true });

      const reqSwitch = httpMock.expectOne((r) =>
        r.url.endsWith("/api/databases/switch"),
      );
      expect(reqSwitch.request.body).toEqual({ name: "new_db" });
      reqSwitch.flush({ success: true });

      const reqCopy = httpMock.expectOne((r) =>
        r.url.endsWith("/api/databases/copy"),
      );
      expect(reqCopy.request.body).toEqual({
        name: "copy_db",
        source: "default",
      });
      reqCopy.flush({ success: true });

      const reqReset = httpMock.expectOne((r) =>
        r.url.endsWith("/api/databases/reset"),
      );
      expect(reqReset.request.body).toEqual({ name: "copy_db" });
      reqReset.flush({ success: true });

      const reqDel = httpMock.expectOne((r) =>
        r.url.endsWith("/api/databases/delete"),
      );
      expect(reqDel.request.body).toEqual({ name: "copy_db" });
      reqDel.flush({ success: true });
    });

    it("should handle database file import", (done) => {
      const mockFile = new File(["dummy db content"], "backup.db", {
        type: "application/x-sqlite3",
      });

      service.importDatabase("imported_db", mockFile).subscribe((res) => {
        expect(res.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.endsWith("/api/databases/import"),
      );
      expect(req.request.method).toBe("POST");
      req.flush({ success: true });
    });
  });

  describe("Asset Management API", () => {
    it("should list assets and format asset URL", (done) => {
      const mockProto = ListAssetsResponse.encode({
        assets: [
          {
            model: { entityId: "asset1" },
            name: "flag.png",
            type: "image",
            size: "1024",
          },
        ],
      }).finish();

      service.listAssets().subscribe((assets) => {
        expect(assets.length).toBe(1);
        expect(assets[0].name).toBe("flag.png");
        expect(service.getAssetUrl("asset1")).toContain(
          "/api/assets/download/asset1",
        );
        done();
      });

      const req = httpMock.expectOne((r) => r.url.endsWith("/api/assets/list"));
      req.flush(mockProto.slice().buffer);
    });

    it("should handle asset upload, rename, and delete", (done) => {
      const uploadProto = UploadAssetResponse.encode({
        success: true,
        asset: {
          model: { entityId: "a2" },
          name: "avatar.png",
          type: "image",
          size: "2048",
        },
      }).finish();

      const renameProto = RenameAssetResponse.encode({
        success: true,
      }).finish();

      const deleteProto = DeleteAssetResponse.encode({
        success: true,
      }).finish();

      service
        .uploadAsset("avatar.png", "image", new Uint8Array([1, 2, 3]))
        .subscribe((upRes) => {
          expect(upRes.name).toBe("avatar.png");
          service.renameAsset("a2", "avatar_renamed.png").subscribe((rnRes) => {
            expect(rnRes).toBeTrue();
            service.deleteAsset("a2").subscribe((delRes) => {
              expect(delRes).toBeTrue();
              done();
            });
            const reqDel = httpMock.expectOne((r) =>
              r.url.endsWith("/api/assets/delete"),
            );
            reqDel.flush(deleteProto.slice().buffer);
          });
          const reqRn = httpMock.expectOne((r) =>
            r.url.endsWith("/api/assets/rename"),
          );
          reqRn.flush(renameProto.slice().buffer);
        });

      const reqUp = httpMock.expectOne((r) =>
        r.url.endsWith("/api/assets/upload"),
      );
      reqUp.flush(uploadProto.slice().buffer);
    });

    it("should handle saveImageSet and saveAudioSet", (done) => {
      const imageSetProto = SaveImageSetResponse.encode({
        success: true,
        asset: {
          model: { entityId: "set1" },
          name: "Flag Set",
          type: "image-set",
        },
      }).finish();

      const audioSetProto = SaveAudioSetResponse.encode({
        success: true,
        asset: {
          model: { entityId: "set2" },
          name: "Beep Set",
          type: "audio-set",
        },
      }).finish();

      service
        .saveImageSet("Flag Set", [{ name: "green.png", percentage: 100 }])
        .subscribe((imgRes) => {
          expect(imgRes.name).toBe("Flag Set");
          service
            .saveAudioSet("Beep Set", [{ name: "lap.wav", timeSeconds: 1.5 }])
            .subscribe((audRes) => {
              expect(audRes.name).toBe("Beep Set");
              done();
            });
          const reqAud = httpMock.expectOne((r) =>
            r.url.endsWith("/api/assets/save-audio-set"),
          );
          reqAud.flush(audioSetProto.slice().buffer);
        });

      const reqImg = httpMock.expectOne((r) =>
        r.url.endsWith("/api/assets/save-image-set"),
      );
      reqImg.flush(imageSetProto.slice().buffer);
    });
  });

  describe("Heat Operations & In-Race Manipulation", () => {
    it("should handle skipRace and deferHeat commands", (done) => {
      const skipRaceProto = SkipRaceResponse.encode({ success: true }).finish();
      const deferHeatProto = DeferHeatResponse.encode({
        success: true,
      }).finish();

      service.skipRace().subscribe((sRace) => {
        expect(sRace).toBeTrue();
        service.deferHeat().subscribe((dHeat) => {
          expect(dHeat).toBeTrue();
          done();
        });
        const reqDefer = httpMock.expectOne((r) =>
          r.url.endsWith("/api/defer-heat"),
        );
        reqDefer.flush(deferHeatProto.slice().buffer);
      });

      const reqSkip = httpMock.expectOne((r) =>
        r.url.endsWith("/api/skip-race"),
      );
      reqSkip.flush(skipRaceProto.slice().buffer);
    });

    it("should handle modifyHeats, regenerateHeats, and finalizeModifyHeats", (done) => {
      const modProto = ModifyHeatsResponse.encode({ success: true }).finish();
      const regenProto = RegenerateHeatsResponse.encode({
        success: true,
      }).finish();

      service.modifyHeats([], []).subscribe((modRes) => {
        expect(modRes.success).toBeTrue();
        service.regenerateHeats([]).subscribe((regenRes) => {
          expect(regenRes.success).toBeTrue();
          service.finalizeModifyHeats().subscribe((fin) => {
            expect(fin).toBe("OK");
            done();
          });
          const reqFin = httpMock.expectOne((r) =>
            r.url.endsWith("/api/finalize-modify-heats"),
          );
          reqFin.flush("OK");
        });
        const reqRegen = httpMock.expectOne((r) =>
          r.url.endsWith("/api/regenerate-heats"),
        );
        reqRegen.flush(regenProto.slice().buffer);
      });

      const reqMod = httpMock.expectOne((r) =>
        r.url.endsWith("/api/modify-heats"),
      );
      reqMod.flush(modProto.slice().buffer);
    });

    it("should handle driver substitution and lap update commands", (done) => {
      service.changeActualDriver(0, "d_new").subscribe((r1) => {
        expect(r1).toBeTrue();
        service.changeActualDriverForHeat(1, 0, "d_new").subscribe((r2) => {
          expect(r2).toBeTrue();
          service.resetLaneHeatData(0).subscribe((r3) => {
            expect(r3).toBeTrue();
            service.updateUserLaps(0, 5).subscribe((r4) => {
              expect(r4.success).toBeTrue();
              service
                .updateBatchUserLaps([
                  { heatNumber: 1, laneIndex: 0, userLaps: 6 },
                ])
                .subscribe((r5) => {
                  expect(r5.success).toBeTrue();
                  done();
                });
              const req5 = httpMock.expectOne((r) =>
                r.url.endsWith("/api/races/heats/user-laps/batch"),
              );
              req5.flush({ success: true });
            });
            const req4 = httpMock.expectOne((r) =>
              r.url.endsWith("/api/races/current-heat/drivers/0/user-laps"),
            );
            req4.flush({ success: true });
          });
          const req3 = httpMock.expectOne((r) =>
            r.url.endsWith("/api/races/current-heat/drivers/0/reset"),
          );
          req3.flush({ success: true });
        });
        const req2 = httpMock.expectOne((r) =>
          r.url.endsWith("/api/races/heats/1/drivers/0/actual-driver"),
        );
        req2.flush({ success: true });
      });

      const req1 = httpMock.expectOne((r) =>
        r.url.endsWith("/api/races/current-heat/drivers/0/actual-driver"),
      );
      req1.flush({ success: true });
    });
  });

  describe("Hardware Configuration & Custom Rotations", () => {
    it("should get Phidget devices and close interface", (done) => {
      const phidgetProto = GetPhidgetDevicesResponse.encode({
        devices: [
          {
            serialNumber: 12345,
            name: "Phidget InterfaceKit",
            digitalInputCount: 8,
            digitalOutputCount: 8,
          },
        ],
      }).finish();

      service.getPhidgetDevices().subscribe((devices) => {
        expect(devices.length).toBe(1);
        expect(devices[0].serialNumber).toBe(12345);
        service.closeInterface().subscribe((res) => {
          expect(res.success).toBeTrue();
          done();
        });
        const reqClose = httpMock.expectOne((r) =>
          r.url.endsWith("/api/close-interface"),
        );
        reqClose.flush({ success: true });
      });

      const reqPhidget = httpMock.expectOne((r) =>
        r.url.endsWith("/api/phidgets"),
      );
      reqPhidget.flush(phidgetProto.slice().buffer);
    });

    it("should update interface configs for Phidget and Arduino", (done) => {
      const updateProto = UpdateInterfaceConfigResponse.encode({
        success: true,
      }).finish();

      const phidgetConfig: PhidgetConfig = {
        name: "Phidget Hub",
        serialNumber: 123456,
        isHubPort: false,
        hubPort: 0,
        normallyClosedLaneSensors: false,
        normallyClosedRelays: false,
        useLapsForSegments: false,
        lapPinPitBehavior: 0,
        digitalInIds: [],
        digitalOutIds: [],
        analogIds: [],
      };

      service
        .updateInterfaceConfig(null, 0, phidgetConfig)
        .subscribe((res1) => {
          expect(res1.success).toBeTrue();
          done();
        });

      const req1 = httpMock.expectOne((r) =>
        r.url.endsWith("/api/update-interface-config"),
      );
      req1.flush(updateProto.slice().buffer);
    });

    it("should save custom rotation and generate heats", (done) => {
      const customRotProto = SaveCustomRotationResponse.encode({
        success: true,
        asset: {
          model: { entityId: "rot1" },
          name: "Custom 4 Lane",
          type: "rotation",
        },
      }).finish();

      service
        .saveCustomRotation("Custom 4 Lane", 4, [
          {
            numDrivers: 4,
            heats: [{ driverIndices: [0, 1, 2, 3], group: 1 }],
          },
        ])
        .subscribe((res) => {
          expect(res.name).toBe("Custom 4 Lane");
          service.generateHeats("race1", 4).subscribe((heatsRes) => {
            expect(heatsRes.length).toBe(4);
            done();
          });
          const reqGen = httpMock.expectOne((r) =>
            r.url.endsWith("/api/races/race1/generate-heats"),
          );
          expect(reqGen.request.method).toBe("POST");
          expect(reqGen.request.body).toEqual({ driverCount: 4 });
          reqGen.flush([{}, {}, {}, {}]);
        });

      const reqRot = httpMock.expectOne((r) =>
        r.url.endsWith("/api/assets/save-custom-rotation"),
      );
      reqRot.flush(customRotProto.slice().buffer);
    });
  });

  describe("Saved Race Operations and Analytics API", () => {
    it("should handle saveRace, getSavedRaces, loadRace, and deleteSavedRace", (done) => {
      service.saveRace().subscribe((sRes) => {
        expect(sRes).toBe("saved_race.json");
        service.getSavedRaces(false).subscribe((races) => {
          expect(races.length).toBe(1);
          expect(races[0].filename).toBe("saved_race.json");
          service.loadRace("saved_race.json", false).subscribe((loadRes) => {
            expect(loadRes).toBe("OK");
            service
              .deleteSavedRace("saved_race.json", false)
              .subscribe((delRes) => {
                expect(delRes).toBe("DELETED");
                done();
              });
            const reqDel = httpMock.expectOne((r) =>
              r.url.endsWith("/api/saved-races/saved_race.json"),
            );
            expect(reqDel.request.method).toBe("DELETE");
            reqDel.flush("DELETED");
          });
          const reqLoad = httpMock.expectOne((r) =>
            r.url.endsWith("/api/load-race"),
          );
          expect(reqLoad.request.body).toEqual({
            filename: "saved_race.json",
            isDemo: false,
          });
          reqLoad.flush("OK");
        });
        const reqList = httpMock.expectOne((r) =>
          r.url.endsWith("/api/saved-races"),
        );
        reqList.flush([{ filename: "saved_race.json", corrupt: false }]);
      });

      const reqSave = httpMock.expectOne((r) =>
        r.url.endsWith("/api/save-race"),
      );
      reqSave.flush("saved_race.json");
    });

    it("should handle analytics toggling and querying driver & global statistics", (done) => {
      service.toggleServerAnalytics(true).subscribe((tRes) => {
        expect(tRes).toBe("ENABLED");
        service.getServerAnalyticsConfig().subscribe((cfg) => {
          expect(cfg.measurementId).toBe("G-12345");
          service.getDriverStatistics("d1", "r1", false).subscribe((stats) => {
            expect(stats.totalLaps).toBe(50);
            service.getGlobalStatistics("r1", false).subscribe((gStats) => {
              expect(gStats.totalRaces).toBe(10);
              done();
            });
            const reqGlob = httpMock.expectOne((r) =>
              r.url.includes("/api/history/stats?raceId=r1&isDemo=false"),
            );
            reqGlob.flush({ totalRaces: 10 });
          });
          const reqDriver = httpMock.expectOne((r) =>
            r.url.includes(
              "/api/history/drivers/d1/stats?raceId=r1&isDemo=false",
            ),
          );
          reqDriver.flush({ totalLaps: 50 });
        });
        const reqCfg = httpMock.expectOne((r) =>
          r.url.endsWith("/api/analytics/config"),
        );
        reqCfg.flush({ clientId: "c1", measurementId: "G-12345" });
      });

      const reqToggle = httpMock.expectOne((r) =>
        r.url.endsWith("/api/analytics/toggle"),
      );
      reqToggle.flush("ENABLED");
    });

    it("should handle changeLane endpoint", (done) => {
      service.changeLane(0, 1).subscribe((res) => {
        expect(res).toBeTrue();
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.endsWith("/api/races/current-heat/drivers/0/change-lane/1"),
      );
      expect(req.request.method).toBe("POST");
      req.flush("OK");
    });
  });

  describe("WebSocket Telemetry Stream Handlers & Getters", () => {
    it("should dispatch received race data message to all observable streams", (done) => {
      const mockRaceData = RaceData.encode({
        raceTime: { time: 123456 },
        lap: { driverId: "d1", lapTime: 4.5 },
        standingsUpdate: { updates: [] },
        overallStandingsUpdate: { participants: [] },
        groupStandingsUpdate: { group: 1 },
        raceState: RaceState.RACING,
        race: { state: RaceState.RACING, flag: RaceFlag.GREEN },
        carData: { lane: 1, fuelLevel: 100 },
        segment: { segmentNumber: 1, segmentTime: 2.1 },
        flag: RaceFlag.GREEN,
        recordData: { overall: { fastestLap: { value: 3.2 } } },
        heat: { heatNumber: 1 },
        systemState: { resourceLockState: "ACTIVE" },
      }).finish();

      service.getRaceTime().subscribe((t) => {
        if (t.time === 123456) {
          expect(t.time).toBe(123456);
        }
      });
      service.getLaps().subscribe((l) => {
        if (l.driverId === "d1") {
          expect(l.driverId).toBe("d1");
        }
      });
      service.getRaceState().subscribe((st) => {
        if (st === RaceState.RACING) {
          expect(st).toBe(RaceState.RACING);
        }
      });
      service.getSystemState().subscribe((ss) => {
        if (ss?.resourceLockState === "ACTIVE") {
          expect(service.getSystemStateValue()?.resourceLockState).toBe(
            "ACTIVE",
          );
          done();
        }
      });

      // Invoke private handler with binary message
      (service as any).handleRaceDataMessage({
        data: mockRaceData.slice().buffer,
      });
    });

    it("should expose interfaceEvents observable stream", (done) => {
      const mockInterfaceEvent = InterfaceEvent.encode({
        digitalPin: {
          pin: 3,
          state: 1,
        },
      }).finish();

      service.getInterfaceEvents().subscribe((ev) => {
        expect(ev.digitalPin?.pin).toBe(3);
        done();
      });

      (service as any).interfaceEventSubject.next(
        InterfaceEvent.decode(mockInterfaceEvent.slice()),
      );
    });

    it("should handle connectToRaceDataSocket life cycle and reconnection", () => {
      // Mock WebSocket
      const mockWs: any = {
        readyState: WebSocket.OPEN,
        close: jasmine.createSpy("close"),
        send: jasmine.createSpy("send"),
      };
      (service as any).raceDataSocket = mockWs;

      // Early return if already open
      service.connectToRaceDataSocket();
      expect(mockWs.close).not.toHaveBeenCalled();

      // Closed state
      mockWs.readyState = WebSocket.CLOSED;
      (service as any).connectionIntent = "VIEWER";
      localStorage.setItem("director_token", "test_tok");

      let createdSocket: any;
      function MockWs(this: any) {
        createdSocket = this;
        this.binaryType = "arraybuffer";
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        this.close = jasmine.createSpy("close");
      }
      spyOn(window as any, "WebSocket").and.callFake(MockWs as any);

      service.connectToRaceDataSocket();
      expect(createdSocket).toBeDefined();

      // Trigger onopen with shouldSubscribeToRaceData
      (service as any).shouldSubscribeToRaceData = true;
      spyOn(service as any, "sendRaceSubscriptionRequest");
      createdSocket.onopen();
      expect((service as any).sendRaceSubscriptionRequest).toHaveBeenCalledWith(
        true,
      );

      // Trigger onerror & onclose
      createdSocket.onerror(new Event("error"));
      createdSocket.onclose();
      expect((service as any).raceDataSocket).toBeUndefined();
      localStorage.removeItem("director_token");
    });

    it("should handle connectToInterfaceDataSocket life cycle and message decoding", () => {
      const mockWs: any = {
        readyState: WebSocket.OPEN,
        close: jasmine.createSpy("close"),
      };
      (service as any).interfaceDataSocket = mockWs;
      service.connectToInterfaceDataSocket();
      expect(mockWs.close).not.toHaveBeenCalled();

      mockWs.readyState = WebSocket.CLOSED;
      let createdSocket: any;
      function MockInterfaceWs(this: any) {
        createdSocket = this;
        this.binaryType = "arraybuffer";
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        this.close = jasmine.createSpy("close");
      }
      spyOn(window as any, "WebSocket").and.callFake(MockInterfaceWs as any);

      service.connectToInterfaceDataSocket();
      createdSocket.onopen();

      // Message with Base64 data
      const mockEvt = InterfaceEvent.encode({
        digitalPin: { pin: 7, state: 0 },
      }).finish();
      const base64Str = btoa(
        String.fromCharCode.apply(null, Array.from(mockEvt)),
      );
      let receivedEv: any;
      service.getInterfaceEvents().subscribe((ev) => {
        receivedEv = ev;
      });

      createdSocket.onmessage({ data: `"${base64Str}"` });
      expect(receivedEv?.digitalPin?.pin).toBe(7);

      // Message with unknown data type
      createdSocket.onmessage({ data: { unknown: true } });
      // Invalid base64
      createdSocket.onmessage({ data: "!!!not_base64!!!" });
    });

    it("should provide observable streams for race events, telemetry, and system state", () => {
      expect(service.getLaps()).toBeDefined();
      expect(service.getStandingsUpdate()).toBeDefined();
      expect(service.getOverallStandingsUpdate()).toBeDefined();
      expect(service.getGroupStandingsUpdate()).toBeDefined();
      expect(service.getRaceUpdate()).toBeDefined();
      expect(service.getInterfaceEvents()).toBeDefined();
      expect(service.getRaceState()).toBeDefined();
      expect(service.getRaceFlag()).toBeDefined();
      expect(service.getCarData()).toBeDefined();
      expect(service.getSegments()).toBeDefined();
      expect(service.getRecordData()).toBeDefined();
      expect(service.getHeats()).toBeDefined();
      expect(service.getSystemState()).toBeDefined();
    });

    it("should fetch track factory settings and serial/ble devices", () => {
      service.getTrackFactorySettings().subscribe();
      const req1 = httpMock.expectOne((r) =>
        r.url.endsWith("/api/tracks/factory-settings"),
      );
      expect(req1.request.method).toBe("GET");
      req1.flush({});

      service.getSerialPorts().subscribe();
      const req2 = httpMock.expectOne((r) =>
        r.url.endsWith("/api/serial-ports"),
      );
      expect(req2.request.method).toBe("GET");
      req2.flush(["COM1", "COM2"]);

      service.getBleDevices().subscribe();
      const req3 = httpMock.expectOne((r) =>
        r.url.endsWith("/api/ble-devices"),
      );
      expect(req3.request.method).toBe("GET");
      req3.flush([]);
    });

    it("should initialize race and encode themeId in protobuf request", (done) => {
      const mockResp = InitializeRaceResponse.create({ success: true });
      const respBuffer = InitializeRaceResponse.encode(mockResp).finish();

      service
        .initializeRace(
          "race-1",
          ["d1", "d2"],
          false,
          undefined,
          undefined,
          undefined,
          "custom-theme-id-456",
        )
        .subscribe((res) => {
          expect(res.success).toBeTrue();
          done();
        });

      const req = httpMock.expectOne((r) =>
        r.url.endsWith("/api/initialize-race"),
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.headers.get("Content-Type")).toBe(
        "application/octet-stream",
      );
      expect(req.request.body instanceof Blob).toBeTrue();

      req.flush(respBuffer.slice().buffer);
    });
  });
});
