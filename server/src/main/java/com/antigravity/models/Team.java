package com.antigravity.models;

import com.antigravity.proto.TeamModel;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class Team extends Model {

  private final String name;
  private final String avatarUrl;
  private final List<String> driverIds;

  @JsonCreator
  public Team(
      @JsonProperty("name") String name,
      @JsonProperty("avatarUrl") String avatarUrl,
      @JsonProperty("driverIds") List<String> driverIds,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.avatarUrl = avatarUrl;
    this.driverIds = driverIds != null ? new ArrayList<>(driverIds) : new ArrayList<>();
  }

  public Team(String name, String avatarUrl, List<String> driverIds) {
    this(name, avatarUrl, driverIds, null, null);
  }

  public Team(TeamModel model) {
    this(
        model.getName(),
        model.getAvatarUrl(),
        model.getDriverIdsList(),
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
}
