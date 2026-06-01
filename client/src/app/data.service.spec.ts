import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { SaveAudioSetResponse } from "@app/proto/antigravity";

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
});
