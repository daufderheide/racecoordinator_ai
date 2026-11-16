import { DsConfig, DsType } from "@app/models/ds_config";
import { IDsConfig } from "@app/proto/antigravity";

export class DsConfigConverter {
  static fromProto(proto: IDsConfig): DsConfig {
    const rawType = proto.type as any;
    let type: DsType = DsType.DS_300;
    if (typeof rawType === "number" && rawType >= 0 && rawType <= 4) {
      type = rawType as DsType;
    } else if (typeof rawType === "string") {
      switch (rawType) {
        case "DS_030":
          type = DsType.DS_030;
          break;
        case "DS_200":
          type = DsType.DS_200;
          break;
        case "DS_200B":
          type = DsType.DS_200B;
          break;
        case "DS_300":
          type = DsType.DS_300;
          break;
        case "DS_300RC":
          type = DsType.DS_300RC;
          break;
        default:
          const p = parseInt(rawType, 10);
          if (!isNaN(p) && p >= 0 && p <= 4) {
            type = p as DsType;
          }
          break;
      }
    }

    return {
      name: proto.name || "DS-300",
      commPort: proto.commPort || "",
      type,
      baudRate:
        proto.baudRate != null
          ? proto.baudRate
          : type === DsType.DS_030 || type === DsType.DS_200
            ? 4800
            : 57600,
    };
  }

  static toProto(config: DsConfig): IDsConfig {
    return {
      name: config.name,
      commPort: config.commPort,
      type: config.type as unknown as any,
      baudRate: config.baudRate,
    };
  }
}
