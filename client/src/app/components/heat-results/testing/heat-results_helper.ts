import { RaceData } from "@app/proto/antigravity";

export class HeatResultsHelper {
  static createMockHeatData(): any {
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
            totalTime: 30.5,
            bestLapTime: 9.8,
            averageLapTime: 10.166,
            medianLapTime: 10.2,
            rankValue: 100,
            seed: 1,
            driver: {
              model: { entityId: "d1" },
              name: "Alice",
              nickname: "Ally",
            },
          },
          {
            objectId: "rp2",
            rank: 2,
            totalLaps: 3,
            totalTime: 32.1,
            bestLapTime: 10.5,
            averageLapTime: 10.7,
            medianLapTime: 10.6,
            rankValue: 80,
            seed: 2,
            driver: {
              model: { entityId: "d2" },
              name: "Bob",
              nickname: "Bobby",
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
            completed: true,
            standings: ["hd1", "hd2", "hd3"],
            heatDrivers: [
              {
                objectId: "hd1",
                laneIndex: 0,
                driver: {
                  objectId: "rp1",
                  driver: {
                    model: { entityId: "d1" },
                    name: "Alice",
                    nickname: "Ally",
                  },
                },
                actualDriver: {
                  model: { entityId: "d1" },
                  name: "Alice",
                  nickname: "Ally",
                },
                adjustedLapCount: 3,
                totalTime: 30.5,
                bestLapTime: 9.8,
                averageLapTime: 10.166,
                medianLapTime: 10.2,
                reactionTime: 0.15,
                laps: [
                  { lapTime: 10.5, segments: [3.2, 4.1, 3.2] },
                  { lapTime: 9.8, segments: [2.9, 3.8, 3.1] },
                  { lapTime: 10.2, segments: [3.1, 4.0, 3.1] },
                ],
              },
              {
                objectId: "hd2",
                laneIndex: 1,
                driver: {
                  objectId: "rp2",
                  driver: {
                    model: { entityId: "d2" },
                    name: "Bob",
                    nickname: "Bobby",
                  },
                },
                actualDriver: {
                  model: { entityId: "d2" },
                  name: "Bob",
                  nickname: "Bobby",
                },
                adjustedLapCount: 3,
                totalTime: 32.1,
                bestLapTime: 10.5,
                averageLapTime: 10.7,
                medianLapTime: 10.6,
                reactionTime: 0.22,
                laps: [
                  { lapTime: 11.0, segments: [3.5, 4.3, 3.2] },
                  { lapTime: 10.5, segments: [3.2, 4.1, 3.2] },
                  { lapTime: 10.6, segments: [3.3, 4.1, 3.2] },
                ],
              },
              {
                objectId: "hd3",
                laneIndex: 2,
                driver: {
                  objectId: "rp3",
                  driver: {
                    model: { entityId: "d3" },
                    name: "Charlie",
                    nickname: "Charlie",
                  },
                },
                actualDriver: {
                  model: { entityId: "d3" },
                  name: "Charlie",
                  nickname: "Charlie",
                },
                adjustedLapCount: 3,
                totalTime: 34.7,
                bestLapTime: 11.2,
                averageLapTime: 11.566,
                medianLapTime: 11.5,
                reactionTime: 0.35,
                laps: [
                  { lapTime: 12.0, segments: [3.8, 4.5, 3.7] },
                  { lapTime: 11.2, segments: [3.6, 4.2, 3.4] },
                  { lapTime: 11.5, segments: [3.7, 4.4, 3.4] },
                ],
              },
            ],
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          started: true,
          completed: true,
          standings: ["hd1", "hd2", "hd3"],
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              driver: {
                objectId: "rp1",
                driver: {
                  model: { entityId: "d1" },
                  name: "Alice",
                  nickname: "Ally",
                },
              },
              actualDriver: {
                model: { entityId: "d1" },
                name: "Alice",
                nickname: "Ally",
              },
              adjustedLapCount: 3,
              totalTime: 30.5,
              bestLapTime: 9.8,
              averageLapTime: 10.166,
              medianLapTime: 10.2,
              reactionTime: 0.15,
              laps: [
                { lapTime: 10.5, segments: [3.2, 4.1, 3.2] },
                { lapTime: 9.8, segments: [2.9, 3.8, 3.1] },
                { lapTime: 10.2, segments: [3.1, 4.0, 3.1] },
              ],
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              driver: {
                objectId: "rp2",
                driver: {
                  model: { entityId: "d2" },
                  name: "Bob",
                  nickname: "Bobby",
                },
              },
              actualDriver: {
                model: { entityId: "d2" },
                name: "Bob",
                nickname: "Bobby",
              },
              adjustedLapCount: 3,
              totalTime: 32.1,
              bestLapTime: 10.5,
              averageLapTime: 10.7,
              medianLapTime: 10.6,
              reactionTime: 0.22,
              laps: [
                { lapTime: 11.0, segments: [3.5, 4.3, 3.2] },
                { lapTime: 10.5, segments: [3.2, 4.1, 3.2] },
                { lapTime: 10.6, segments: [3.3, 4.1, 3.2] },
              ],
            },
            {
              objectId: "hd3",
              laneIndex: 2,
              driver: {
                objectId: "rp3",
                driver: {
                  model: { entityId: "d3" },
                  name: "Charlie",
                  nickname: "Charlie",
                },
              },
              actualDriver: {
                model: { entityId: "d3" },
                name: "Charlie",
                nickname: "Charlie",
              },
              adjustedLapCount: 3,
              totalTime: 34.7,
              bestLapTime: 11.2,
              averageLapTime: 11.566,
              medianLapTime: 11.5,
              reactionTime: 0.35,
              laps: [
                { lapTime: 12.0, segments: [3.8, 4.5, 3.7] },
                { lapTime: 11.2, segments: [3.6, 4.2, 3.4] },
                { lapTime: 11.5, segments: [3.7, 4.4, 3.4] },
              ],
            },
          ],
        },
      },
      heat: {
        objectId: "h1",
        heatNumber: 1,
        started: true,
        completed: true,
        standings: ["hd1", "hd2", "hd3"],
        heatDrivers: [
          {
            objectId: "hd1",
            laneIndex: 0,
            driver: {
              objectId: "rp1",
              driver: {
                model: { entityId: "d1" },
                name: "Alice",
                nickname: "Ally",
              },
            },
            actualDriver: {
              model: { entityId: "d1" },
              name: "Alice",
              nickname: "Ally",
            },
            adjustedLapCount: 3,
            totalTime: 30.5,
            bestLapTime: 9.8,
            averageLapTime: 10.166,
            medianLapTime: 10.2,
            reactionTime: 0.15,
            laps: [
              { lapTime: 10.5, segments: [3.2, 4.1, 3.2] },
              { lapTime: 9.8, segments: [2.9, 3.8, 3.1] },
              { lapTime: 10.2, segments: [3.1, 4.0, 3.1] },
            ],
          },
          {
            objectId: "hd2",
            laneIndex: 1,
            driver: {
              objectId: "rp2",
              driver: {
                model: { entityId: "d2" },
                name: "Bob",
                nickname: "Bobby",
              },
            },
            actualDriver: {
              model: { entityId: "d2" },
              name: "Bob",
              nickname: "Bobby",
            },
            adjustedLapCount: 3,
            totalTime: 32.1,
            bestLapTime: 10.5,
            averageLapTime: 10.7,
            medianLapTime: 10.6,
            reactionTime: 0.22,
            laps: [
              { lapTime: 11.0, segments: [3.5, 4.3, 3.2] },
              { lapTime: 10.5, segments: [3.2, 4.1, 3.2] },
              { lapTime: 10.6, segments: [3.3, 4.1, 3.2] },
            ],
          },
          {
            objectId: "hd3",
            laneIndex: 2,
            driver: {
              objectId: "rp3",
              driver: {
                model: { entityId: "d3" },
                name: "Charlie",
                nickname: "Charlie",
              },
            },
            actualDriver: {
              model: { entityId: "d3" },
              name: "Charlie",
              nickname: "Charlie",
            },
            adjustedLapCount: 3,
            totalTime: 34.7,
            bestLapTime: 11.2,
            averageLapTime: 11.566,
            medianLapTime: 11.5,
            reactionTime: 0.35,
            laps: [
              { lapTime: 12.0, segments: [3.8, 4.5, 3.7] },
              { lapTime: 11.2, segments: [3.6, 4.2, 3.4] },
              { lapTime: 11.5, segments: [3.7, 4.4, 3.4] },
            ],
          },
        ],
      },
    };
  }

  static async injectMockRaceData(page: any, mockData: any) {
    const buffer = RaceData.encode(mockData).finish();
    const dataArray = Array.from(buffer);
    await page.addInitScript((data: number[]) => {
      // @ts-ignore
      window.mockRaceDataBuffer = new Uint8Array(data).buffer;
    }, dataArray);
  }
}
