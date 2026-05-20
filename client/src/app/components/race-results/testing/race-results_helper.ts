import { RaceData } from "@app/proto/antigravity";

/**
 * Shared test helper for RaceResults component.
 * Handles both Jasmine/unit-test mock data and Playwright page injections.
 */
export class RaceResultsHelper {
  /**
   * Helper to construct fully compliant mock RaceData structure.
   */
  static createMockRaceData() {
    return {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Grand Prix",
          track: {
            model: { entityId: "t1" },
            name: "Screendiff Raceway",
            lanes: [
              { backgroundColor: "#ef4444", foregroundColor: "#ffffff" },
              { backgroundColor: "#3b82f6", foregroundColor: "#ffffff" },
              { backgroundColor: "#10b981", foregroundColor: "#ffffff" },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            rank: 1,
            totalLaps: 3,
            totalTime: 31.1,
            bestLapTime: 10.2,
            averageLapTime: 10.366,
            medianLapTime: 10.4,
            rankValue: 100,
            seed: 1,
            driver: {
              model: { entityId: "d1" },
              name: "Alice",
              nickname: "Alice",
            },
          },
          {
            objectId: "rp2",
            rank: 2,
            totalLaps: 3,
            totalTime: 32.6,
            bestLapTime: 10.7,
            averageLapTime: 10.866,
            medianLapTime: 10.8,
            rankValue: 80,
            seed: 2,
            driver: {
              model: { entityId: "d2" },
              name: "Bob",
              nickname: "Bob",
            },
          },
          {
            objectId: "rp3",
            rank: 3,
            totalLaps: 3,
            totalTime: 34.7,
            bestLapTime: 11.2,
            averageLapTime: 11.566,
            medianLapTime: 11.5,
            rankValue: 60,
            seed: 3,
            driver: {
              model: { entityId: "d3" },
              name: "Charlie",
              nickname: "Charlie",
            },
          },
        ],
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            started: true,
            heatDrivers: [
              {
                objectId: "hd1",
                driver: {
                  objectId: "rp1",
                  driver: { model: { entityId: "d1" }, name: "Alice" },
                },
                actualDriver: { model: { entityId: "d1" }, name: "Alice" },
                laps: [{ lapTime: 10.5 }, { lapTime: 10.2 }, { lapTime: 10.4 }],
              },
              {
                objectId: "hd2",
                driver: {
                  objectId: "rp2",
                  driver: { model: { entityId: "d2" }, name: "Bob" },
                },
                actualDriver: { model: { entityId: "d2" }, name: "Bob" },
                laps: [{ lapTime: 11.1 }, { lapTime: 10.8 }, { lapTime: 10.7 }],
              },
              {
                objectId: "hd3",
                driver: {
                  objectId: "rp3",
                  driver: { model: { entityId: "d3" }, name: "Charlie" },
                },
                actualDriver: { model: { entityId: "d3" }, name: "Charlie" },
                laps: [{ lapTime: 12.0 }, { lapTime: 11.2 }, { lapTime: 11.5 }],
              },
            ],
          },
        ],
      },
    };
  }

  /**
   * Inject mock race data buffer into the Playwright page.
   */
  static async injectMockRaceData(page: any, mockData: any) {
    const buffer = RaceData.encode(mockData).finish();
    const dataArray = Array.from(buffer);
    await page.addInitScript((data: number[]) => {
      // @ts-ignore
      window.mockRaceDataBuffer = new Uint8Array(data).buffer;
    }, dataArray);
  }
}
