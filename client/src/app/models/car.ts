import { Model } from "./model";

/** The scales a slotcar can have; "" means not set. */
export const CAR_SCALE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "", labelKey: "CE_SCALE_NONE" },
  { value: "1/24", labelKey: "CE_SCALE_1_24" },
  { value: "1/32", labelKey: "CE_SCALE_1_32" },
  { value: "1/43", labelKey: "CE_SCALE_1_43" },
  { value: "1/64", labelKey: "CE_SCALE_1_64" },
  { value: "other", labelKey: "CE_SCALE_OTHER" },
];

/** The free-text setup fields of a car, in the order the editor shows them. */
export const CAR_TEXT_FIELDS = [
  "brand",
  "carClass",
  "motor",
  "magnet",
  "chassis",
  "gears",
  "tyres",
  "notes",
] as const;

export type CarTextField = (typeof CAR_TEXT_FIELDS)[number];

export interface CarInit {
  avatarUrl?: string;
  brand?: string;
  carClass?: string;
  scale?: string;
  motor?: string;
  magnet?: string;
  chassis?: string;
  gears?: string;
  tyres?: string;
  modified?: boolean;
  notes?: string;
  customValues?: Record<string, string>;
}

/** The values of the user's own fields from server JSON: a list of {fieldId, value}. */
export function parseCustomValues(raw: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (const v of raw) {
      const id = v?.fieldId ?? v?.field_id;
      if (id && v.value !== undefined && v.value !== null) {
        out[id] = String(v.value);
      }
    }
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      if (v !== undefined && v !== null) out[k] = String(v);
    }
  }
  return out;
}

/** A slotcar in the Slotcar database. Only the name is required. */
export class Car implements Model {
  entity_id: string;
  name: string;
  avatarUrl?: string;
  brand: string;
  carClass: string;
  scale: string;
  motor: string;
  magnet: string;
  chassis: string;
  gears: string;
  tyres: string;
  modified: boolean;
  notes: string;
  /** Values of the user's own fields, keyed by field id ("" values are left out). */
  customValues: Record<string, string>;

  constructor(entity_id: string, name: string, init: CarInit = {}) {
    this.entity_id = entity_id;
    this.name = name;
    this.avatarUrl = init.avatarUrl || undefined;
    this.brand = init.brand ?? "";
    this.carClass = init.carClass ?? "";
    this.scale = init.scale ?? "";
    this.motor = init.motor ?? "";
    this.magnet = init.magnet ?? "";
    this.chassis = init.chassis ?? "";
    this.gears = init.gears ?? "";
    this.tyres = init.tyres ?? "";
    this.modified = init.modified === true;
    this.notes = init.notes ?? "";
    this.customValues = { ...(init.customValues || {}) };
  }

  get objectId(): string {
    return this.entity_id;
  }

  /** Builds a car from server JSON (camelCase or snake_case ids). */
  static fromJSON(raw: any): Car {
    const r = raw || {};
    return new Car(r.entity_id || r.entityId || "", r.name || "", {
      avatarUrl: r.avatarUrl,
      brand: r.brand,
      carClass: r.carClass ?? r.car_class,
      scale: r.scale,
      motor: r.motor,
      magnet: r.magnet,
      chassis: r.chassis,
      gears: r.gears,
      tyres: r.tyres,
      modified: r.modified,
      notes: r.notes,
      customValues: parseCustomValues(r.customValues ?? r.custom_values),
    });
  }

  /**
   * What is sent to the server. Custom values go as a list, because the
   * server keeps object keys a save leaves out, so a cleared value would
   * come back.
   */
  toJSON(): Record<string, unknown> {
    return {
      entity_id: this.entity_id,
      name: this.name,
      avatarUrl: this.avatarUrl,
      brand: this.brand,
      carClass: this.carClass,
      scale: this.scale,
      motor: this.motor,
      magnet: this.magnet,
      chassis: this.chassis,
      gears: this.gears,
      tyres: this.tyres,
      modified: this.modified,
      notes: this.notes,
      customValues: Object.entries(this.customValues).map(
        ([fieldId, value]) => ({ fieldId, value }),
      ),
    };
  }
}
