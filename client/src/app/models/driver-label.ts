import { Model } from "./model";

export interface DriverLabel extends Model {
  entity_id: string;
  name: string;
  color: string;
}
