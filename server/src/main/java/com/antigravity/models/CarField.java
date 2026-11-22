package com.antigravity.models;

import com.antigravity.proto.CarFieldModel;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * A field the user adds to every slotcar. Each car keeps its own value for it in {@link
 * Car#getCustomValues()}, keyed by this field's id.
 */
public class CarField extends Model {

  public static final String TYPE_TEXT = "text";
  public static final String TYPE_NUMBER = "number";
  public static final String TYPE_BOOLEAN = "boolean";
  public static final String TYPE_CHOICE = "choice";

  /** The types a field can have. */
  public static final List<String> TYPES =
      Collections.unmodifiableList(
          Arrays.asList(TYPE_TEXT, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_CHOICE));

  private final String name;
  private final String type;
  private final List<String> options;
  private final int position;

  @JsonCreator
  public CarField(
      @JsonProperty("name") String name,
      @JsonProperty("type") String type,
      @JsonProperty("options") List<String> options,
      @JsonProperty("position") int position,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.type = type;
    this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
    this.position = position;
  }

  public CarField(CarFieldModel model) {
    this(
        model.getName(),
        model.getType(),
        model.getOptionsList(),
        model.getPosition(),
        model.getModel().getEntityId(),
        null);
  }

  public String getName() {
    return name;
  }

  public String getType() {
    return type;
  }

  public List<String> getOptions() {
    return new ArrayList<>(options);
  }

  public int getPosition() {
    return position;
  }

  public static class Builder {
    private String name;
    private String type;
    private List<String> options = new ArrayList<>();
    private int position;
    private String entityId;
    private String id;

    public static Builder from(CarField other) {
      Builder b = new Builder();
      if (other != null) {
        b.name = other.getName();
        b.type = other.getType();
        b.options = other.getOptions();
        b.position = other.getPosition();
        b.entityId = other.getEntityId();
        b.id = other.getId();
      }
      return b;
    }

    public Builder withName(String name) {
      this.name = name;
      return this;
    }

    public Builder withType(String type) {
      this.type = type;
      return this;
    }

    public Builder withOptions(List<String> options) {
      this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
      return this;
    }

    public Builder withPosition(int position) {
      this.position = position;
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

    public CarField build() {
      return new CarField(name, type, options, position, entityId, id);
    }
  }
}
