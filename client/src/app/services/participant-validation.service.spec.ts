import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";

import { ParticipantValidationService } from "./participant-validation.service";

describe("ParticipantValidationService", () => {
  let service: ParticipantValidationService;
  let allDrivers: Driver[];
  let allTeams: Team[];

  beforeEach(() => {
    service = new ParticipantValidationService();
    allDrivers = [
      new Driver("d1", "Driver 1", "D1"),
      new Driver("d2", "Driver 2", "D2"),
      new Driver("d3", "Driver 3", "D3"),
    ];
    allTeams = [
      new Team("t1", "Team 1", undefined, ["d1"]),
      new Team("t2", "Team 2", undefined, ["d2"]),
      new Team("t3", "Team 3", undefined, ["d1", "d3"]),
    ];
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should validate individual drivers successfully", () => {
    const participants = [allDrivers[0], allDrivers[1]];
    const result = service.validate(participants, allTeams, allDrivers);
    expect(result.isValid).toBeTrue();
  });

  it("should fail if duplicate individual drivers are added", () => {
    const participants = [allDrivers[0], allDrivers[0]];
    const result = service.validate(participants, allTeams, allDrivers);
    expect(result.isValid).toBeFalse();
    expect(result.errorCode).toBe("DUPE_INDIVIDUAL_TEAM");
    expect(result.driverName).toBe("Driver 1");
  });

  it("should fail if a driver is added both individually and as part of a team", () => {
    const participants = [allDrivers[0], allTeams[0]]; // Both contain 'd1'
    const result = service.validate(participants, allTeams, allDrivers);
    expect(result.isValid).toBeFalse();
    expect(result.errorCode).toBe("DUPE_INDIVIDUAL_TEAM");
    expect(result.driverName).toBe("Driver 1");
    expect(result.teamNames).toContain("Team 1");
  });

  it("should fail if two teams share the same driver", () => {
    const participants = [allTeams[0], allTeams[2]]; // Both contain 'd1'
    const result = service.validate(participants, allTeams, allDrivers);
    expect(result.isValid).toBeFalse();
    expect(result.errorCode).toBe("DUPE_MULTIPLE_TEAMS");
    expect(result.driverName).toBe("Driver 1");
    expect(result.teamNames).toContain("Team 1");
    expect(result.teamNames).toContain("Team 3");
  });

  it("should validate RaceParticipant objects correctly", () => {
    const rp1 = new RaceParticipant(
      "rp1",
      allDrivers[0],
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      100,
    );
    const rp2 = new RaceParticipant(
      "rp2",
      new Driver("EMPTY_LANE", "Empty", "Empty"),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      100,
      0,
      0,
      allTeams[1],
    );

    const participants = [rp1, rp2];
    const result = service.validate(participants, allTeams, allDrivers);
    expect(result.isValid).toBeTrue();
  });

  it("should fail if RaceParticipant overlaps with another participant", () => {
    const rp1 = new RaceParticipant(
      "rp1",
      allDrivers[0],
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      100,
    );
    const rp2 = new RaceParticipant(
      "rp2",
      new Driver("EMPTY_LANE", "Empty", "Empty"),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      100,
      0,
      0,
      allTeams[0],
    ); // team 0 has d1

    const participants = [rp1, rp2];
    const result = service.validate(participants, allTeams, allDrivers);
    expect(result.isValid).toBeFalse();
    expect(result.errorCode).toBe("DUPE_INDIVIDUAL_TEAM");
    expect(result.driverName).toBe("Driver 1");
  });

  it("should ignore EMPTY_LANE IDs", () => {
    const emptyDriver = new Driver("EMPTY_LANE", "Empty", "Empty");
    const participants = [allDrivers[0], emptyDriver, emptyDriver];
    const result = service.validate(participants, allTeams, allDrivers);
    expect(result.isValid).toBeTrue();
  });

  describe("getErrorMessage", () => {
    let mockTranslationService: any;

    beforeEach(() => {
      mockTranslationService = jasmine.createSpyObj("TranslationService", [
        "translate",
      ]);
      mockTranslationService.translate.and.callFake(
        (key: string, params?: any) => {
          if (key === "RDS_ERR_START_RACE_FIX_DESCRIPTION") return "FIX IT";
          if (key === "RDS_ERR_DRIVER_DUPE_IND_TEAM")
            return `DUPE ${params.driver} ${params.team}`;
          if (key === "RDS_ERR_DRIVER_DUPE_TEAMS")
            return `DUPE ${params.driver} TEAMS ${params.teams}`;
          return key;
        },
      );
    });

    it("should return empty string if result is valid", () => {
      const result = { isValid: true };
      expect(service.getErrorMessage(result, mockTranslationService)).toBe("");
    });

    it("should return correct message for DUPE_INDIVIDUAL_TEAM", () => {
      const result: any = {
        isValid: false,
        errorCode: "DUPE_INDIVIDUAL_TEAM",
        driverName: "Alice",
        teamNames: ["Team A"],
      };
      const msg = service.getErrorMessage(result, mockTranslationService);
      expect(msg).toContain("DUPE Alice Team A");
      expect(msg).toContain("FIX IT");
    });

    it("should return correct message for DUPE_MULTIPLE_TEAMS", () => {
      const result: any = {
        isValid: false,
        errorCode: "DUPE_MULTIPLE_TEAMS",
        driverName: "Alice",
        teamNames: ["Team A", "Team B"],
      };
      const msg = service.getErrorMessage(result, mockTranslationService);
      expect(msg).toContain("DUPE Alice TEAMS Team A, Team B");
      expect(msg).toContain("FIX IT");
    });
  });
});
