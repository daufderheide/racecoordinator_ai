import { of } from "rxjs";
import { MOCK_CARS } from "@app/testing/data/cars_data";
import { deepCopy } from "@app/utils/clone.utils";

/** A Jasmine DataService mock with the calls the Slotcar editor makes. */
export function createCarEditorDataServiceMock() {
  const spy = jasmine.createSpyObj("DataService", [
    "getCars",
    "createCar",
    "updateCar",
    "deleteCar",
    "listAssets",
  ]);
  spy.getCars.and.callFake(() => of(deepCopy(MOCK_CARS)));
  spy.createCar.and.callFake((car: any) => of({ ...car, entity_id: "c-new" }));
  spy.updateCar.and.callFake((_id: string, car: any) => of(car));
  spy.deleteCar.and.returnValue(of(null));
  spy.listAssets.and.returnValue(of([]));
  return spy;
}
