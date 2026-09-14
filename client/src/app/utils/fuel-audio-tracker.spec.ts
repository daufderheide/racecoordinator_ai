import { AudioPlayer } from "@app/utils/audio";

import { FuelAudioTracker } from "./fuel-audio-tracker";

describe("FuelAudioTracker", () => {
  let tracker: FuelAudioTracker;
  let mockPlayer: jasmine.SpyObj<AudioPlayer>;

  beforeEach(() => {
    mockPlayer = jasmine.createSpyObj<AudioPlayer>("AudioPlayer", [
      "playCallout",
      "playSfx",
    ]);
    mockPlayer.playCallout.and.returnValue(true);
    tracker = new FuelAudioTracker(mockPlayer);
  });

  const createMockDriver = (id: string, name: string) => ({
    entity_id: id,
    name,
    nickname: name,
    pitInAudio: { type: "preset", url: "pitin.wav" },
    fuelAudio: {
      type: "audio_set",
      url: "fuel_set_id",
    },
  });

  const createMockHeat = () => {
    const d1 = createMockDriver("driver-1", "Alice");
    const d2 = createMockDriver("driver-2", "Bob");
    return {
      heatDrivers: [
        {
          laneIndex: 0,
          driver: d1,
          participant: { fuelLevel: 100 },
        },
        {
          laneIndex: 1,
          driver: d2,
          participant: { fuelLevel: 80 },
        },
      ],
    } as any;
  };

  const createMockAssets = () => [
    {
      entity_id: "fuel_set_id",
      type: "audio_set",
      audioEntries: [
        { percentage: 100, type: "preset", url: "full.wav" },
        { percentage: 25, type: "preset", url: "warning25.wav" },
        { percentage: 10, type: "preset", url: "warning10.wav" },
        { percentage: 0, type: "preset", url: "empty.wav" },
      ],
    },
  ];

  it("should initialize fuel tracking states on reset", () => {
    const heat = createMockHeat();
    tracker.reset(heat);

    const states = tracker.getStates();
    expect(states.size).toBe(2);
    expect(states.get(0)?.lastFuelLevel).toBe(100);
    expect(states.get(1)?.lastFuelLevel).toBe(80);
  });

  it("should play pit-in audio with association when refueling gains >= 0.1 fuel", () => {
    const heat = createMockHeat();
    tracker.reset(heat);

    // Start refueling at 50%
    tracker.updateLaneFuel(
      0,
      50,
      true,
      heat,
      true,
      undefined,
      undefined,
      undefined,
      true,
    );
    expect(mockPlayer.playCallout).not.toHaveBeenCalled();

    // Gain 5% fuel
    tracker.updateLaneFuel(
      0,
      55,
      true,
      heat,
      true,
      undefined,
      undefined,
      undefined,
      true,
    );

    expect(mockPlayer.playCallout).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: "preset", url: "pitin.wav" }),
      "high",
      jasmine.any(Object),
      "pitin.wav",
      {
        widgetType: "lane-view",
        laneIndex: 0,
        driverId: "driver-1",
      },
    );
  });

  it("should play 100% threshold audio with association during refueling", () => {
    const heat = createMockHeat();
    const assets = createMockAssets();
    tracker.reset(heat);

    // Refueling crosses 100%
    tracker.updateLaneFuel(
      0,
      95,
      true,
      heat,
      true,
      undefined,
      undefined,
      assets,
      true,
    );
    mockPlayer.playCallout.calls.reset();

    tracker.updateLaneFuel(
      0,
      100,
      true,
      heat,
      true,
      undefined,
      undefined,
      assets,
      true,
    );

    expect(mockPlayer.playCallout).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: "preset", url: "full.wav" }),
      "urgent",
      jasmine.any(Object),
      "full.wav",
      {
        widgetType: "lane-view",
        laneIndex: 0,
        driverId: "driver-1",
      },
    );
  });

  it("should play warning and empty thresholds with association when fuel decreases", () => {
    const heat = createMockHeat();
    const assets = createMockAssets();
    tracker.reset(heat);

    // Cross 25% threshold downwards from 30% to 20%
    tracker.updateLaneFuel(
      0,
      30,
      false,
      heat,
      true,
      undefined,
      undefined,
      assets,
      true,
    );
    mockPlayer.playCallout.calls.reset();

    tracker.updateLaneFuel(
      0,
      20,
      false,
      heat,
      true,
      undefined,
      undefined,
      assets,
      true,
    );

    expect(mockPlayer.playCallout).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: "preset", url: "warning25.wav" }),
      "urgent",
      jasmine.any(Object),
      "warning25.wav",
      {
        widgetType: "lane-view",
        laneIndex: 0,
        driverId: "driver-1",
      },
    );

    // Cross 0% threshold
    mockPlayer.playCallout.calls.reset();
    tracker.updateLaneFuel(
      0,
      0,
      false,
      heat,
      true,
      undefined,
      undefined,
      assets,
      true,
    );

    expect(mockPlayer.playCallout).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: "preset", url: "empty.wav" }),
      "urgent",
      jasmine.any(Object),
      "empty.wav",
      {
        widgetType: "lane-view",
        laneIndex: 0,
        driverId: "driver-1",
      },
    );
  });

  it("should not play audio when canPlayAudio is false", () => {
    const heat = createMockHeat();
    const assets = createMockAssets();
    tracker.reset(heat);

    // Gain fuel while canPlayAudio is false
    tracker.updateLaneFuel(
      0,
      50,
      true,
      heat,
      true,
      undefined,
      undefined,
      assets,
      false,
    );
    tracker.updateLaneFuel(
      0,
      60,
      true,
      heat,
      true,
      undefined,
      undefined,
      assets,
      false,
    );

    expect(mockPlayer.playCallout).not.toHaveBeenCalled();
  });
});
