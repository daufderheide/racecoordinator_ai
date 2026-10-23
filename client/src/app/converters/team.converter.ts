import { Team } from "@app/models/team";
import { ITeamModel } from "@app/proto/antigravity";

import { ConverterCache } from "./converter_cache";

export class TeamConverter {
  private static cache = new ConverterCache<Team>();

  static clearCache() {
    this.cache.clear();
  }

  static get(id: string): Team | undefined {
    return this.cache.get(id);
  }

  static fromProto(proto: ITeamModel): Team {
    const objectId = proto.model?.entityId;

    // Is Reference if name is falsey (undefined, null, empty string)
    const isReference = !proto.name;

    if (objectId) {
      const cached = this.cache.get(objectId);
      if (cached) {
        if (isReference) {
          return cached;
        }
        // Update in place to preserve references
        cached.name = proto.name || "";
        cached.avatarUrl = proto.avatarUrl || undefined;
        cached.driverIds = proto.driverIds || [];
        cached.labelIds = proto.labelIds || [];
        return cached;
      }
    }

    return this.cache.process(objectId, isReference, () => {
      return new Team(
        objectId || "",
        proto.name || "",
        proto.avatarUrl || undefined,
        proto.driverIds || [],
        proto.labelIds || [],
      );
    });
  }

  static fromJSON(json: any): Team {
    const id = json.entity_id || json.entityId || json.id || "";
    const driverIds = Array.isArray(json.driverIds)
      ? [...json.driverIds]
      : Array.isArray(json.driver_ids)
        ? [...json.driver_ids]
        : [];
    const labelIds = Array.isArray(json.labelIds)
      ? [...json.labelIds]
      : Array.isArray(json.label_ids)
        ? [...json.label_ids]
        : Array.isArray(json.labels)
          ? [...json.labels]
          : [];

    const cached = this.cache.get(id);
    if (cached) {
      cached.name = json.name || "";
      cached.avatarUrl = json.avatarUrl || json.avatar_url || undefined;
      cached.driverIds = driverIds;
      cached.labelIds = labelIds.length > 0 ? labelIds : cached.labelIds || [];
      return cached;
    }

    const team = new Team(
      id,
      json.name || "",
      json.avatarUrl || json.avatar_url || undefined,
      driverIds,
      labelIds,
    );
    this.cache.process(id, false, () => team);
    return team;
  }

  static register(team: Team): void {
    if (!team || !team.entity_id) return;
    const existing = this.cache.get(team.entity_id);
    if (existing) {
      existing.name = team.name;
      existing.avatarUrl = team.avatarUrl;
      existing.driverIds = [...(team.driverIds || [])];
      existing.labelIds = [...(team.labelIds || [])];
    } else {
      this.cache.process(team.entity_id, false, () => team);
    }
  }
}
