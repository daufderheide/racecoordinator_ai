package com.antigravity.models;

import com.antigravity.proto.CarModel;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/** A slotcar in the Slotcar database. Only the name is required. */
public class Car extends Model {

  private final String name;
  private final String avatarUrl;
  private final String brand;
  private final String carClass;
  private final String scale;
  private final String motor;
  private final String magnet;
  private final String chassis;
  private final String gears;
  private final String tyres;
  private final boolean modified;
  private final String notes;

  @JsonCreator
  public Car(
      @JsonProperty("name") String name,
      @JsonProperty("avatarUrl") String avatarUrl,
      @JsonProperty("brand") String brand,
      @JsonProperty("carClass") @JsonAlias({"car_class"}) String carClass,
      @JsonProperty("scale") String scale,
      @JsonProperty("motor") String motor,
      @JsonProperty("magnet") String magnet,
      @JsonProperty("chassis") String chassis,
      @JsonProperty("gears") String gears,
      @JsonProperty("tyres") String tyres,
      @JsonProperty("modified") boolean modified,
      @JsonProperty("notes") String notes,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.avatarUrl = avatarUrl;
    this.brand = brand;
    this.carClass = carClass;
    this.scale = scale;
    this.motor = motor;
    this.magnet = magnet;
    this.chassis = chassis;
    this.gears = gears;
    this.tyres = tyres;
    this.modified = modified;
    this.notes = notes;
  }

  public Car(CarModel model) {
    this(
        model.getName(),
        model.getAvatarUrl(),
        model.getBrand(),
        model.getCarClass(),
        model.getScale(),
        model.getMotor(),
        model.getMagnet(),
        model.getChassis(),
        model.getGears(),
        model.getTyres(),
        model.getModified(),
        model.getNotes(),
        model.getModel().getEntityId(),
        null);
  }

  public String getName() {
    return name;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public String getBrand() {
    return brand;
  }

  public String getCarClass() {
    return carClass;
  }

  public String getScale() {
    return scale;
  }

  public String getMotor() {
    return motor;
  }

  public String getMagnet() {
    return magnet;
  }

  public String getChassis() {
    return chassis;
  }

  public String getGears() {
    return gears;
  }

  public String getTyres() {
    return tyres;
  }

  public boolean isModified() {
    return modified;
  }

  public String getNotes() {
    return notes;
  }

  public static class Builder {
    private String name;
    private String avatarUrl;
    private String brand;
    private String carClass;
    private String scale;
    private String motor;
    private String magnet;
    private String chassis;
    private String gears;
    private String tyres;
    private boolean modified;
    private String notes;
    private String entityId;
    private String id;

    public static Builder from(Car other) {
      Builder b = new Builder();
      if (other != null) {
        b.name = other.getName();
        b.avatarUrl = other.getAvatarUrl();
        b.brand = other.getBrand();
        b.carClass = other.getCarClass();
        b.scale = other.getScale();
        b.motor = other.getMotor();
        b.magnet = other.getMagnet();
        b.chassis = other.getChassis();
        b.gears = other.getGears();
        b.tyres = other.getTyres();
        b.modified = other.isModified();
        b.notes = other.getNotes();
        b.entityId = other.getEntityId();
        b.id = other.getId();
      }
      return b;
    }

    public Builder withName(String name) {
      this.name = name;
      return this;
    }

    public Builder withAvatarUrl(String avatarUrl) {
      this.avatarUrl = avatarUrl;
      return this;
    }

    public Builder withBrand(String brand) {
      this.brand = brand;
      return this;
    }

    public Builder withCarClass(String carClass) {
      this.carClass = carClass;
      return this;
    }

    public Builder withScale(String scale) {
      this.scale = scale;
      return this;
    }

    public Builder withMotor(String motor) {
      this.motor = motor;
      return this;
    }

    public Builder withMagnet(String magnet) {
      this.magnet = magnet;
      return this;
    }

    public Builder withChassis(String chassis) {
      this.chassis = chassis;
      return this;
    }

    public Builder withGears(String gears) {
      this.gears = gears;
      return this;
    }

    public Builder withTyres(String tyres) {
      this.tyres = tyres;
      return this;
    }

    public Builder withModified(boolean modified) {
      this.modified = modified;
      return this;
    }

    public Builder withNotes(String notes) {
      this.notes = notes;
      return this;
    }

    public Builder withEntityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public Builder withId(String id) {
      this.id = id;
      return this;
    }

    public Car build() {
      return new Car(
          name, avatarUrl, brand, carClass, scale, motor, magnet, chassis, gears, tyres, modified,
          notes, entityId, id);
    }
  }
}
