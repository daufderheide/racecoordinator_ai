import { ILaneModel } from "@app/proto/antigravity";

import { LaneConverter } from "./lane.converter";

describe("LaneConverter", () => {
  beforeEach(() => {
    LaneConverter.clearCache();
  });

  it("should convert full proto to Lane and cache it", () => {
    const proto: ILaneModel = {
      objectId: "lane-1",
      foregroundColor: "#ff0000",
      backgroundColor: "#000000",
      length: 50.75,
    };

    const lane = LaneConverter.fromProto(proto);
    expect(lane.objectId).toBe("lane-1");
    expect(lane.foreground_color).toBe("#ff0000");
    expect(lane.background_color).toBe("#000000");
    expect(lane.length).toBe(50.75);
  });

  it("should resolve from cache when reference proto is passed", () => {
    const fullProto: ILaneModel = {
      objectId: "lane-1",
      foregroundColor: "#ff0000",
      backgroundColor: "#000000",
      length: 50,
    };
    LaneConverter.fromProto(fullProto);

    const refProto: ILaneModel = {
      objectId: "lane-1",
    };
    const resolved = LaneConverter.fromProto(refProto);

    expect(resolved.objectId).toBe("lane-1");
    expect(resolved.foreground_color).toBe("#ff0000");
  });
});
