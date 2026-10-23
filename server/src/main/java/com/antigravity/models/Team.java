package com.antigravity.models;

import com.antigravity.proto.TeamModel;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class Team extends Model {

  private final String name;
  private final String avatarUrl;
  private final List<String> driverIds;
  private final List<String> labelIds;

  @JsonCreator
  public Team(
      @JsonProperty("name") String name,
      @JsonProperty("avatarUrl") String avatarUrl,
      @JsonProperty("driverIds") List<String> driverIds,
      @JsonProperty("labelIds") @JsonAlias({"label_ids", "labels"}) List<String> labelIds,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.avatarUrl = avatarUrl;
    this.driverIds = driverIds != null ? new ArrayList<>(driverIds) : new ArrayList<>();
    this.labelIds = labelIds != null ? new ArrayList<>(labelIds) : new ArrayList<>();
  }

  public Team(String name, String avatarUrl, List<String> driverIds, String entityId, String id) {
    this(name, avatarUrl, driverIds, null, entityId, id);
  }

  public Team(String name, String avatarUrl, List<String> driverIds, List<String> labelIds) {
    this(name, avatarUrl, driverIds, labelIds, null, null);
  }

  public Team(String name, String avatarUrl, List<String> driverIds) {
    this(name, avatarUrl, driverIds, null, null, null);
  }

  public Team(TeamModel model) {
    this(
        model.getName(),
        model.getAvatarUrl(),
        model.getDriverIdsList(),
        model.getLabelIdsList(),
        model.getModel().getEntityId(),
        null);
  }

  public String getName() {
    return name;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public List<String> getDriverIds() {
    return new ArrayList<>(driverIds);
  }

  public List<String> getLabelIds() {
    return new ArrayList<>(labelIds);
  }

  public static class Builder {
    private String name;
    private String avatarUrl;
    private List<String> driverIds = new ArrayList<>();
    private List<String> labelIds = new ArrayList<>();
    private String entityId;
    private String id;

    public static Builder from(Team other) {
      Builder b = new Builder();
      if (other != null) {
        b.name = other.getName();
        b.avatarUrl = other.getAvatarUrl();
        b.driverIds = other.getDriverIds();
        b.labelIds = other.getLabelIds();
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

    public Builder withDriverIds(List<String> driverIds) {
      this.driverIds = driverIds != null ? new ArrayList<>(driverIds) : new ArrayList<>();
      return this;
    }

    public Builder withLabelIds(List<String> labelIds) {
      this.labelIds = labelIds != null ? new ArrayList<>(labelIds) : new ArrayList<>();
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

    public Team build() {
      return new Team(name, avatarUrl, driverIds, labelIds, entityId, id);
    }
  }
}
