package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

public class DriverLabel extends Model {
  private final String name;
  private final String color;

  public DriverLabel(
      @JsonProperty("name") String name,
      @JsonProperty("color") String color,
      @JsonProperty("entity_id") @JsonAlias("entityId") String entityId,
      @JsonProperty("_id") @JsonAlias("id") String id) {
    super(id, entityId);
    this.name = name != null ? name.trim() : "";
    this.color = color != null && !color.trim().isEmpty() ? color.trim() : "#3b82f6";
  }

  public DriverLabel(String name, String color, String entityId) {
    this(name, color, entityId, entityId);
  }

  public DriverLabel(String name, String color) {
    this(name, color, null, null);
  }

  public String getName() {
    return name;
  }

  public String getColor() {
    return color;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof DriverLabel)) {
      return false;
    }
    DriverLabel that = (DriverLabel) o;
    return Objects.equals(getEntityId(), that.getEntityId())
        && Objects.equals(name, that.name)
        && Objects.equals(color, that.color);
  }

  @Override
  public int hashCode() {
    return Objects.hash(getEntityId(), name, color);
  }

  public static class Builder {
    private String id;
    private String entityId;
    private String name = "";
    private String color = "#3b82f6";

    public Builder() {}

    public static Builder from(DriverLabel other) {
      Builder b = new Builder();
      if (other != null) {
        b.id = other.getId();
        b.entityId = other.getEntityId();
        b.name = other.getName();
        b.color = other.getColor();
      }
      return b;
    }

    public Builder withId(String id) {
      this.id = id;
      return this;
    }

    public Builder withEntityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public Builder withName(String name) {
      this.name = name != null ? name.trim() : "";
      return this;
    }

    public Builder withColor(String color) {
      this.color = color != null && !color.trim().isEmpty() ? color.trim() : "#3b82f6";
      return this;
    }

    public DriverLabel build() {
      return new DriverLabel(name, color, entityId, id);
    }
  }
}
