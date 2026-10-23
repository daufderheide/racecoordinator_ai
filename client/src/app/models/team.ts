import { Model } from "./model";

export class Team implements Model {
  entity_id: string;
  name: string;
  avatarUrl?: string;
  driverIds: string[];
  labelIds: string[];

  constructor(
    entity_id: string,
    name: string,
    avatarUrl?: string,
    driverIds: string[] = [],
    labelIds: string[] = [],
  ) {
    this.entity_id = entity_id;
    this.name = name;
    this.avatarUrl = avatarUrl;
    this.driverIds = driverIds;
    this.labelIds = labelIds;
  }

  get objectId(): string {
    return this.entity_id;
  }
}
