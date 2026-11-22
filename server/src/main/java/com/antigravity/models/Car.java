package com.antigravity.models;

import com.antigravity.proto.CarModel;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
  private final Map<String, String> customValues;

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
      @JsonProperty("customValues") @JsonAlias({"custom_values"}) List<CustomValue> customValues,
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
    this.customValues = fromList(customValues);
  }

  /** A car without custom values (the step 1 fields only). */
  public Car(
      String name,
      String avatarUrl,
      String brand,
      String carClass,
      String scale,
      String motor,
      String magnet,
      String chassis,
      String gears,
      String tyres,
      boolean modified,
      String notes,
      String entityId,
      String id) {
    this(
        name, avatarUrl, brand, carClass, scale, motor, magnet, chassis, gears, tyres, modified,
        notes, null, entityId, id);
  }

  /**
   * One value of a user's field. Stored as a list of these, not as a JSON object: the repository
   * keeps object keys that a save leaves out, so a removed value would come back.
   */
  public static class CustomValue {
    private final String fieldId;
    private final String value;

    @JsonCreator
    public CustomValue(
        @JsonProperty("fieldId") @JsonAlias({"field_id"}) String fieldId,
        @JsonProperty("value") String value) {
      this.fieldId = fieldId;
      this.value = value;
    }

    public String getFieldId() {
      return fieldId;
    }

    public String getValue() {
      return value;
    }
  }

  private static Map<String, String> fromList(List<CustomValue> values) {
    Map<String, String> map = new LinkedHashMap<>();
    if (values != null) {
      for (CustomValue v : values) {
        if (v != null && v.getFieldId() != null && v.getValue() != null) {
          map.put(v.getFieldId(), v.getValue());
        }
      }
    }
    return map;
  }

  private static List<CustomValue> toList(Map<String, String> values) {
    List<CustomValue> list = new ArrayList<>();
    values.forEach((k, v) -> list.add(new CustomValue(k, v)));
    return list;
  }

  /** Keeps the order, drops null keys and values. */
  private static Map<String, String> copyValues(Map<String, String> values) {
    Map<String, String> copy = new LinkedHashMap<>();
    if (values != null) {
      values.forEach(
          (k, v) -> {
            if (k != null && v != null) {
              copy.put(k, v);
            }
          });
    }
    return copy;
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
        protoValues(model),
        model.getModel().getEntityId(),
        null);
  }

  private static List<CustomValue> protoValues(CarModel model) {
    List<CustomValue> list = new ArrayList<>();
    model
        .getCustomValuesList()
        .forEach(v -> list.add(new CustomValue(v.getFieldId(), v.getValue())));
    return list;
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

  /** The values of the user's own fields, keyed by field id. */
  @JsonIgnore
  public Map<String, String> getCustomValues() {
    return Collections.unmodifiableMap(customValues);
  }

  /** The values as stored and sent: a list of {fieldId, value}. */
  @JsonProperty("customValues")
  public List<CustomValue> getCustomValueList() {
    return toList(customValues);
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
    private Map<String, String> customValues = new LinkedHashMap<>();
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
        b.customValues = new LinkedHashMap<>(other.getCustomValues());
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

    public Builder withCustomValues(Map<String, String> customValues) {
      this.customValues = copyValues(customValues);
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
          name,
          avatarUrl,
          brand,
          carClass,
          scale,
          motor,
          magnet,
          chassis,
          gears,
          tyres,
          modified,
          notes,
          toList(customValues),
          entityId,
          id);
    }
  }
}
