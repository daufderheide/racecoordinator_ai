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

  const createMockRace = (fuelEnabled: boolean = true) =>
    ({
      fuel_options: { enabled: fuelEnabled, capacity: 100 },
      digital_fuel_options: { enabled: false, capacity: 100 },
    }) as any;

  it("should initialize fuel tracking states on reset in a fuel race", () => {
    const heat = createMockHeat();
    const race = createMockRace(true);
    tracker.reset(heat, false, race);

    const states = tracker.getStates();
    expect(states.size).toBe(2);
    expect(states.get(0)?.lastFuelLevel).toBe(100);
    expect(states.get(1)?.lastFuelLevel).toBe(80);
  });

  it("should not track states or play audio in a non-fuel race", () => {
    const heat = createMockHeat();
    const race = createMockRace(false);
    const assets = createMockAssets();
    tracker.reset(heat, false, race);

    expect(tracker.getStates().size).toBe(0);

    tracker.updateLaneFuel(
      0,
      0,
      false,
      heat,
      true,
      race,
      undefined,
      assets,
      true,
    );
    expect(mockPlayer.playCallout).not.toHaveBeenCalled();
  });

  it("should not play 0% fuel audio on heat restart when initial fuel > 0 in a fuel race", () => {
    const heat = createMockHeat();
    const race = createMockRace(true);
    const assets = createMockAssets();

    // Driver 0 has initialFuelLevel 100, but had burned fuel to 0 during the heat
    heat.heatDrivers[0].initialFuelLevel = 100;
    heat.heatDrivers[0].participant.fuelLevel = 0;

    // Heat restart occurs: hasRacedInCurrentHeat = false, heat.started = false
    tracker.reset(heat, false, race);
    expect(tracker.getStates().get(0)?.lastFuelLevel).toBe(100);

    // Initial fuel update arrives on restart (restored to 100)
    tracker.updateLaneFuel(
      0,
      100,
      false,
      heat,
      false,
      race,
      undefined,
      assets,
      true,
    );
    expect(mockPlayer.playCallout).not.toHaveBeenCalled();
  });

  it("should play 0% fuel audio if heat started driver with 0 fuel in a fuel race", () => {
    const heat = createMockHeat();
    const race = createMockRace(true);
    const assets = createMockAssets();

    // Driver starts heat with 0 fuel
    heat.heatDrivers[0].initialFuelLevel = 0;
    heat.heatDrivers[0].participant.fuelLevel = 0;

    tracker.reset(heat, false, race);
    expect(tracker.getStates().get(0)?.lastFuelLevel).toBe(0);

    tracker.updateLaneFuel(
      0,
      0,
      false,
      heat,
      true,
      race,
      undefined,
      assets,
      true,
    );
    expect(mockPlayer.playCallout).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: "preset", url: "empty.wav" }),
      "urgent",
      jasmine.any(Object),
      "empty.wav",
      jasmine.any(Object),
    );
  });

  it("should play pit-in audio with association when refueling gains >= 0.1 fuel", () => {
    const heat = createMockHeat();
    const race = createMockRace(true);
    tracker.reset(heat, false, race);

    // Start refueling at 50%
    tracker.updateLaneFuel(
      0,
      50,
      true,
      heat,
      true,
      race,
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
      race,
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
    const race = createMockRace(true);
    const assets = createMockAssets();
    tracker.reset(heat, false, race);

    // Refueling crosses 100%
    tracker.updateLaneFuel(
      0,
      95,
      true,
      heat,
      true,
      race,
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
      race,
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
    const race = createMockRace(true);
    const assets = createMockAssets();
    tracker.reset(heat, false, race);

    // Cross 25% threshold downwards from 30% to 20%
    tracker.updateLaneFuel(
      0,
      30,
      false,
      heat,
      true,
      race,
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
      race,
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
      race,
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
    const race = createMockRace(true);
    const assets = createMockAssets();
    tracker.reset(heat, false, race);

    // Gain fuel while canPlayAudio is false
    tracker.updateLaneFuel(
      0,
      50,
      true,
      heat,
      true,
      race,
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
      race,
      undefined,
      assets,
      false,
    );

    expect(mockPlayer.playCallout).not.toHaveBeenCalled();
  });
});
