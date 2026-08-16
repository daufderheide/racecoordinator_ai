import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Event } from "@app/models/event";
import { Season } from "@app/models/season";
import { ArduinoConfig, TrackmateConfig } from "@app/models/track";
import {
  EndRaceResponse,
  InitializeInterfaceResponse,
  NextHeatResponse,
  PauseRaceResponse,
  RestartHeatResponse,
  SaveAudioSetResponse,
  SetInterfacePinStateResponse,
  SetInterfaceRgbLedStateResponse,
  SkipHeatResponse,
  SkipRaceResponse,
  StartRaceResponse,
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
});
