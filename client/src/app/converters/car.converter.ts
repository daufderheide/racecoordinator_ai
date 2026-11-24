import { Car } from "@app/models/car";
import { ICarModel, ILaneCar } from "@app/proto/antigravity";

/**
 * Slotcars in race data (#1210). No cache: a heat's car is a snapshot, so the
 * same car id can hold different values in different heats.
 */
export class CarConverter {
  /** Cars stay in their lanes: the car on each lane, by lane index (undefined = none). */
  static laneCarsFromProto(
    list: ILaneCar[] | null | undefined,
  ): (Car | undefined)[] {
    const cars: (Car | undefined)[] = [];
    for (const lc of list || []) {
      const lane = lc?.lane ?? 0;
      while (cars.length <= lane) cars.push(undefined);
      cars[lane] = CarConverter.fromProto(lc?.car);
    }
    return cars;
  }

  static fromProto(proto: ICarModel | null | undefined): Car | undefined {
    const id = proto?.model?.entityId;
    if (!proto || !id) return undefined;
    return Car.fromJSON({ ...proto, entity_id: id });
  }

  /** The car as race data, for Modify Heats. */
  static toProto(car: Car | null | undefined): ICarModel | undefined {
    if (!car || !car.entity_id) return undefined;
    return {
      model: { entityId: car.entity_id },
      name: car.name,
      avatarUrl: car.avatarUrl || "",
      brand: car.brand,
      carClass: car.carClass,
      scale: car.scale,
      motor: car.motor,
      magnet: car.magnet,
      chassis: car.chassis,
      gears: car.gears,
      tyres: car.tyres,
      modified: car.modified,
      notes: car.notes,
      customValues: Object.entries(car.customValues).map(
        ([fieldId, value]) => ({
          fieldId,
          value,
        }),
      ),
    };
  }
}
