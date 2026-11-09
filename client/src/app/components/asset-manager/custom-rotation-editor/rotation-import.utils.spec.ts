import {
  parseAndValidateImportFile,
  parseImportHeats,
} from "./rotation-import.utils";

describe("rotation-import.utils", () => {
  it("should parse import heats preserving negative indices and step-up boundaries", () => {
    const rawHeats = [
      {
        Drivers: [1, 2, 3, 4],
        Group: 1,
        IsStepUpBoundary: true,
        Step: 1,
      },
      {
        drivers: [-1, -2, 3, 4],
        group: 1,
        is_step_up_boundary: false,
        step: 2,
      },
    ];

    const parsed = parseImportHeats(rawHeats, false);
    expect(parsed.length).toBe(2);

    expect(parsed[0].driverIndices).toEqual([1, 2, 3, 4]);
    expect(parsed[0].group).toBe(0); // 0-based internal
    expect(parsed[0].isStepUpBoundary).toBeTrue();
    expect(parsed[0].step).toBe(1);

    expect(parsed[1].driverIndices).toEqual([-1, -2, 3, 4]);
    expect(parsed[1].group).toBe(0);
    expect(parsed[1].isStepUpBoundary).toBeFalse();
    expect(parsed[1].step).toBe(2);
  });

  it("should handle RC1 0-based drivers and groups correctly", () => {
    const rawHeats = [
      {
        Drivers: [0, 1, 2, 3],
        Group: 0,
      },
    ];

    const parsed = parseImportHeats(rawHeats, true);
    expect(parsed[0].driverIndices).toEqual([1, 2, 3, 4]);
    expect(parsed[0].group).toBe(0);
    expect(parsed[0].isStepUpBoundary).toBeFalse();
    expect(parsed[0].step).toBe(1);
  });

  it("should import single rotation JSON with step-up drivers", async () => {
    const json = {
      NumDrivers: 4,
      NumLanes: 4,
      Heats: [
        { Drivers: [1, 2, 3, 4], IsStepUpBoundary: true, Step: 1, Group: 1 },
        { Drivers: [-1, 2, 3, 4], IsStepUpBoundary: false, Step: 2, Group: 1 },
      ],
    };

    const file = new File([JSON.stringify(json)], "test.json", {
      type: "application/json",
    });

    const result = await parseAndValidateImportFile(file, 4, [2]);

    expect(result.success).toBeTrue();
    expect(result.newRotations?.length).toBe(1);
    const rot = result.newRotations![0];
    expect(rot.numDrivers).toBe(4);
    expect(rot.heats?.length).toBe(2);
    expect(rot.heats?.[1].driverIndices?.[0]).toBe(-1);
    expect(rot.heats?.[0].isStepUpBoundary).toBeTrue();
  });
});
