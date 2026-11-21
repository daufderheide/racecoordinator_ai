import { Model } from "./model";

export type CarFieldType = "text" | "number" | "boolean" | "choice";

/** The field types, in the order the field manager offers them. */
export const CAR_FIELD_TYPES: { value: CarFieldType; labelKey: string }[] = [
  { value: "text", labelKey: "CFM_TYPE_TEXT" },
  { value: "number", labelKey: "CFM_TYPE_NUMBER" },
  { value: "boolean", labelKey: "CFM_TYPE_BOOLEAN" },
  { value: "choice", labelKey: "CFM_TYPE_CHOICE" },
];

/**
 * A field the user adds to every slotcar. Each car keeps its own value in
 * `Car.customValues[field.entity_id]`, as a string ("true"/"false" for a
 * yes/no field).
 */
export class CarField implements Model {
  constructor(
    public entity_id: string,
    public name: string,
    public type: CarFieldType = "text",
    public options: string[] = [],
    public position: number = 0,
  ) {}

  get objectId(): string {
    return this.entity_id;
  }

  static fromJSON(raw: any): CarField {
    const r = raw || {};
    const type = CAR_FIELD_TYPES.some((t) => t.value === r.type)
      ? (r.type as CarFieldType)
      : "text";
    return new CarField(
      r.entity_id || r.entityId || "",
      r.name || "",
      type,
      Array.isArray(r.options) ? r.options.map((o: any) => String(o)) : [],
      typeof r.position === "number" ? r.position : 0,
    );
  }
}

/** Fields in editor order: position, then name. */
export function sortCarFields(fields: CarField[]): CarField[] {
  return [...fields].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name),
  );
}
