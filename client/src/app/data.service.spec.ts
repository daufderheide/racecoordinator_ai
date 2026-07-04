import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ArduinoConfig, TrackmateConfig } from "@app/models/track";
import {
  InitializeInterfaceResponse,
  SaveAudioSetResponse,
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
        useLapsForPits: 0,
        useLapsForPitEnd: 0,
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
      .initializeInterface(arduinoConfigs, trackmateConfigs, 4)
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
    // Angular HttpTestingController requires ArrayBuffer for arraybuffer response types
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

    // Mock response using SaveAudioSetResponse
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

    // Mock the websocket
    const mockSocket = {
      close: jasmine.createSpy("close"),
    } as unknown as WebSocket;
    service["raceDataSocket"] = mockSocket;

    // Call with SAME address
    service.setServerAddress("192.168.1.10", 4200);

    expect(mockSocket.close).not.toHaveBeenCalled();
    expect(service["raceDataSocket"]).toBe(mockSocket); // Should still be defined
  });

  it("should close websocket if server address changes", () => {
    service["serverIp"] = "192.168.1.10";
    service["serverPort"] = 4200;

    // Mock the websocket
    const mockSocket = {
      close: jasmine.createSpy("close"),
    } as unknown as WebSocket;
    service["raceDataSocket"] = mockSocket;

    // Call with NEW address
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
});
