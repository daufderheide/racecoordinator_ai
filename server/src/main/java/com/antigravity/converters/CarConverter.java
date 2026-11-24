package com.antigravity.converters;

import com.antigravity.models.Car;
import com.antigravity.proto.CarCustomValue;
import com.antigravity.proto.CarModel;
import com.antigravity.proto.Model;

/** Slotcar to proto, for cars in race data (#1210). Always the whole car, never an id stub. */
public class CarConverter {

  private CarConverter() {}

  public static CarModel toProto(Car car) {
    if (car == null) {
      return null;
    }
    CarModel.Builder builder =
        CarModel.newBuilder()
            .setModel(
                Model.newBuilder()
                    .setEntityId(car.getEntityId() != null ? car.getEntityId() : "")
                    .build())
            .setName(nz(car.getName()))
            .setAvatarUrl(nz(car.getAvatarUrl()))
            .setBrand(nz(car.getBrand()))
            .setCarClass(nz(car.getCarClass()))
            .setScale(nz(car.getScale()))
            .setMotor(nz(car.getMotor()))
            .setMagnet(nz(car.getMagnet()))
            .setChassis(nz(car.getChassis()))
            .setGears(nz(car.getGears()))
            .setTyres(nz(car.getTyres()))
            .setModified(car.isModified())
            .setNotes(nz(car.getNotes()));
    for (Car.CustomValue v : car.getCustomValueList()) {
      builder.addCustomValues(
          CarCustomValue.newBuilder().setFieldId(nz(v.getFieldId())).setValue(nz(v.getValue())));
    }
    return builder.build();
  }

  /** A car from race data, or null when the proto has none. */
  public static Car fromProto(CarModel proto) {
    if (proto == null || proto.getModel().getEntityId().isEmpty()) {
      return null;
    }
    return new Car(proto);
  }

  private static String nz(String s) {
    return s != null ? s : "";
  }
}
