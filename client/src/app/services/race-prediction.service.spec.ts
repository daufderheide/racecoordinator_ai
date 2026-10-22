import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { DataService } from "@app/data.service";

import {
  PredictionEvaluationRecord,
  PredictionSnapshot,
  RacePredictionRecord,
  RacePredictionService,
} from "./race-prediction.service";

describe("RacePredictionService", () => {
  let service: RacePredictionService;
  let httpMock: HttpTestingController;
  let mockDataService: any;

  beforeEach(() => {
    mockDataService = {
      serverUrl: "http://localhost:8080",
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RacePredictionService,
        { provide: DataService, useValue: mockDataService },
      ],
    });

    service = TestBed.inject(RacePredictionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should update live prediction snapshot via currentPrediction$", (done) => {
    const mockSnapshot: PredictionSnapshot = {
      heat_index: 1,
      completed_laps: 10,
      win_probabilities: { driver_1: 0.7 },
      podium_probabilities: { driver_1: 0.9 },
      projected_standings: [],
      heat_forecasts: [],
    };

    service.currentPrediction$.subscribe((snapshot) => {
      if (snapshot) {
        expect(snapshot).toEqual(mockSnapshot);
        done();
      }
    });

    service.updateLivePrediction(mockSnapshot);
  });

  it("should append cache-busting timestamp parameter when fetching race predictions", () => {
    const mockRecord: RacePredictionRecord = {
      race_id: "race_123",
      timestamp: 1000,
      pre_race: {} as any,
      realtime_snapshots: [],
    };

    service.getRacePredictions("race_123", true).subscribe((result) => {
      expect(result).toEqual(mockRecord);
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.urlWithParams.includes("/api/predictions/races/race_123") &&
        request.urlWithParams.includes("isDemo=true") &&
        request.urlWithParams.includes("&t=")
      );
    });

    expect(req.request.method).toBe("GET");
    req.flush(mockRecord);
  });

  it("should append cache-busting timestamp parameter when fetching prediction evaluation", () => {
    const mockEvaluation: PredictionEvaluationRecord = {
      race_id: "race_123",
      evaluated_at: 1000,
      brier_score: 0.02,
      rank_mae: 0.1,
      lap_projection_mae: 0.5,
      driver_evaluations: [],
    };

    service.getPredictionEvaluation("race_123", false).subscribe((result) => {
      expect(result).toEqual(mockEvaluation);
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.urlWithParams.includes(
          "/api/predictions/evaluations/race_123",
        ) &&
        request.urlWithParams.includes("isDemo=false") &&
        request.urlWithParams.includes("&t=")
      );
    });

    expect(req.request.method).toBe("GET");
    req.flush(mockEvaluation);
  });

  it("should handle error gracefully and return null when getRacePredictions fails", () => {
    service.getRacePredictions("race_999", false).subscribe((result) => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne((request) =>
      request.url.startsWith(
        "http://localhost:8080/api/predictions/races/race_999",
      ),
    );

    req.flush("Server error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  });

  it("should handle empty or missing serverUrl gracefully", () => {
    mockDataService.serverUrl = "";

    service.getRacePredictions("race_123", false).subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.startsWith("/api/predictions/races/race_123"),
    );
    expect(req.request.method).toBe("GET");
    req.flush({} as any);
  });

  it("should handle error gracefully and return null when getPredictionEvaluation fails", () => {
    service.getPredictionEvaluation("race_999", false).subscribe((result) => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne((request) =>
      request.url.startsWith(
        "http://localhost:8080/api/predictions/evaluations/race_999",
      ),
    );

    req.flush("Not found", { status: 404, statusText: "Not Found" });
  });

  it("should deduplicate concurrent in-flight calls to getRacePredictions", () => {
    const mockRecord: RacePredictionRecord = {
      race_id: "race_dedup",
      timestamp: 123456,
      pre_race: {} as any,
      realtime_snapshots: [],
    };

    let result1: any = null;
    let result2: any = null;

    service.getRacePredictions("race_dedup", true).subscribe((r) => {
      result1 = r;
    });
    service.getRacePredictions("race_dedup", true).subscribe((r) => {
      result2 = r;
    });

    // Only one HTTP request should be made
    const requests = httpMock.match((req) =>
      req.url.includes("/api/predictions/races/race_dedup"),
    );
    expect(requests.length).toBe(1);

    requests[0].flush(mockRecord);
    expect(result1).toEqual(mockRecord);
    expect(result2).toEqual(mockRecord);
  });

  it("should deduplicate concurrent in-flight calls to getPredictionEvaluation", () => {
    const mockEvaluation: PredictionEvaluationRecord = {
      race_id: "race_dedup",
      evaluated_at: 1000,
      brier_score: 0.02,
      rank_mae: 0.1,
      lap_projection_mae: 0.5,
      driver_evaluations: [],
    };

    let result1: any = null;
    let result2: any = null;

    service.getPredictionEvaluation("race_dedup", false).subscribe((r) => {
      result1 = r;
    });
    service.getPredictionEvaluation("race_dedup", false).subscribe((r) => {
      result2 = r;
    });

    const requests = httpMock.match((req) =>
      req.url.includes("/api/predictions/evaluations/race_dedup"),
    );
    expect(requests.length).toBe(1);

    requests[0].flush(mockEvaluation);
    expect(result1).toEqual(mockEvaluation);
    expect(result2).toEqual(mockEvaluation);
  });
});
