import {
  arbitrateLapAudioCandidates,
  LapAudioCandidate,
} from "./lap-audio-arbitrator";

describe("arbitrateLapAudioCandidates", () => {
  it("should return null winner and empty arrays for empty or null candidate lists", () => {
    expect(arbitrateLapAudioCandidates([])).toEqual({
      winner: null,
      toQueue: [],
      dropped: [],
    });

    expect(arbitrateLapAudioCandidates([null, undefined])).toEqual({
      winner: null,
      toQueue: [],
      dropped: [],
    });
  });

  it("should ignore candidates with type 'none' or missing audio url/text", () => {
    const noneCandidate: LapAudioCandidate = {
      id: "none_cand",
      config: { type: "none" },
      priority: "high",
    };
    const emptyPreset: LapAudioCandidate = {
      id: "empty_preset",
      config: { type: "preset", url: "" },
      priority: "high",
    };
    const emptyTts: LapAudioCandidate = {
      id: "empty_tts",
      config: { type: "tts", text: "" },
      priority: "urgent",
    };

    expect(
      arbitrateLapAudioCandidates([noneCandidate, emptyPreset, emptyTts]),
    ).toEqual({
      winner: null,
      toQueue: [],
      dropped: [],
    });
  });

  it("should select single candidate as winner", () => {
    const candidate: LapAudioCandidate = {
      id: "laps_left",
      config: { type: "tts", text: "10 laps to go" },
      priority: "normal",
    };

    const result = arbitrateLapAudioCandidates([candidate]);
    expect(result.winner).toBe(candidate);
    expect(result.toQueue).toEqual([]);
    expect(result.dropped).toEqual([]);
  });

  it("should drop lower priority candidate when higher priority candidate is present (e.g. high vs normal)", () => {
    const lapsLeft: LapAudioCandidate = {
      id: "laps_left",
      config: { type: "tts", text: "20 laps to go" },
      priority: "normal",
    };
    const newRaceLeader: LapAudioCandidate = {
      id: "race_leader",
      config: { type: "preset", url: "leader.wav" },
      priority: "high",
    };

    const result = arbitrateLapAudioCandidates([lapsLeft, newRaceLeader]);
    expect(result.winner).toBe(newRaceLeader);
    expect(result.toQueue).toEqual([]);
    expect(result.dropped).toEqual([lapsLeft]);
  });

  it("should queue equal priority candidate sequentially (e.g. normal + normal)", () => {
    const halfway: LapAudioCandidate = {
      id: "halfway",
      config: { type: "tts", text: "Halfway" },
      priority: "normal",
    };
    const lapsLeft: LapAudioCandidate = {
      id: "laps_left",
      config: { type: "tts", text: "25 laps to go" },
      priority: "normal",
    };

    const result = arbitrateLapAudioCandidates([halfway, lapsLeft]);
    expect(result.winner).toBe(halfway);
    expect(result.toQueue).toEqual([lapsLeft]);
    expect(result.dropped).toEqual([]);
  });

  it("should handle urgent infraction dropping both high and normal candidates", () => {
    const lapsLeft: LapAudioCandidate = {
      id: "laps_left",
      config: { type: "tts", text: "10 laps to go" },
      priority: "normal",
    };
    const recordLap: LapAudioCandidate = {
      id: "record_lap",
      config: { type: "preset", url: "record.wav" },
      priority: "high",
    };
    const falseStart: LapAudioCandidate = {
      id: "false_start",
      config: { type: "tts", text: "False start penalty" },
      priority: "urgent",
    };

    const result = arbitrateLapAudioCandidates([
      lapsLeft,
      recordLap,
      falseStart,
    ]);
    expect(result.winner).toBe(falseStart);
    expect(result.toQueue).toEqual([]);
    expect(result.dropped).toEqual([lapsLeft, recordLap]);
  });

  it("should handle multiple equal top priority candidates and drop lower priority", () => {
    const halfway: LapAudioCandidate = {
      id: "halfway",
      config: { type: "tts", text: "Halfway" },
      priority: "normal",
    };
    const lapsLeft: LapAudioCandidate = {
      id: "laps_left",
      config: { type: "tts", text: "10 laps to go" },
      priority: "normal",
    };
    const routineLap: LapAudioCandidate = {
      id: "routine_lap",
      config: { type: "tts", text: "Lap 10" },
      priority: "low",
    };

    const result = arbitrateLapAudioCandidates([halfway, lapsLeft, routineLap]);
    expect(result.winner).toBe(halfway);
    expect(result.toQueue).toEqual([lapsLeft]);
    expect(result.dropped).toEqual([routineLap]);
  });
});
