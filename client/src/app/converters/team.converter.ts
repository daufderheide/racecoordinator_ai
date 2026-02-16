import { Team } from "../models/team";
import { com } from "../proto/message";
import { ConverterCache } from "./converter_cache";

export class TeamConverter {
  private static cache = new ConverterCache<Team>();

  static clearCache() {
    this.cache.clear();
  }

  static get(id: string): Team | undefined {
    return this.cache.get(id);
  }

  static fromProto(proto: com.antigravity.ITeamModel): Team {
    const objectId = proto.model?.entityId;

    // Is Reference if name is falsey (undefined, null, empty string)
    const isReference = !proto.name;

    return this.cache.process(objectId, isReference, () => {
      return new Team(
        objectId || '',
        proto.name || '',
        proto.avatarUrl || undefined,
        proto.driverIds || []
      );
    });
  }
}
