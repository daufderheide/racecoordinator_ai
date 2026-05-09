import { Model } from "./model";

export class Team implements Model {
  entity_id: string;
  name: string;
  avatarUrl?: string;
  driverIds: string[];

  constructor(
    entity_id: string,
    name: string,
    avatarUrl?: string,
    driverIds: string[] = []
  ) {
    this.entity_id = entity_id;
    this.name = name;
    this.avatarUrl = avatarUrl;
    this.driverIds = driverIds;
  }

  get objectId(): string {
    return this.entity_id;
  }
}
