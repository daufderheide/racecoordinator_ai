import { DsConfig, DsType } from "@app/models/ds_config";
import { IDsConfig } from "@app/proto/antigravity";

import { DsConfigConverter } from "./ds_config.converter";

describe("DsConfigConverter", () => {
  it("should convert from proto with defaults", () => {
    const proto = {
      name: "",
      commPort: "",
    };

    const config: DsConfig = DsConfigConverter.fromProto(
      proto as unknown as IDsConfig,
    );

    expect(config.name).toBe("DS-300");
    expect(config.commPort).toBe("");
    expect(config.type).toBe(DsType.DS_300);
  });

  it("should convert from proto with explicit values", () => {
    const proto = {
      name: "DS Box",
      commPort: "COM4",
      type: DsType.DS_030,
      baudRate: 4800,
    };

    const config: DsConfig = DsConfigConverter.fromProto(
      proto as unknown as IDsConfig,
    );

    expect(config.name).toBe("DS Box");
    expect(config.commPort).toBe("COM4");
    expect(config.type).toBe(DsType.DS_030);
    expect(config.baudRate).toBe(4800);
  });

  it("should convert from proto with string enum name", () => {
    const proto = {
      name: "DS Box",
      commPort: "COM4",
      type: "DS_300RC",
    };

    const config: DsConfig = DsConfigConverter.fromProto(
      proto as unknown as IDsConfig,
    );
    expect(config.type).toBe(DsType.DS_300RC);
    expect(config.baudRate).toBe(57600);
  });

  it("should convert to proto", () => {
    const config: DsConfig = {
      name: "DS-200 Box",
      commPort: "COM5",
      type: DsType.DS_200,
      baudRate: 4800,
    };

    const proto = DsConfigConverter.toProto(config);

    expect(proto.name).toBe("DS-200 Box");
    expect(proto.commPort).toBe("COM5");
    expect(proto.type).toBe(DsType.DS_200 as any);
    expect(proto.baudRate).toBe(4800);
  });
});
