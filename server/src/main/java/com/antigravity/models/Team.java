package com.antigravity.models;

import java.util.ArrayList;
import java.util.List;

import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.antigravity.proto.TeamModel;

public class Team extends Model {
  private final String name;
  private final String avatarUrl;
  private final List<String> driverIds;

  @BsonCreator
  public Team(@BsonProperty("name") @JsonProperty("name") String name,
      @BsonProperty("avatarUrl") @JsonProperty("avatarUrl") String avatarUrl,
      @BsonProperty("driverIds") @JsonProperty("driverIds") List<String> driverIds,
      @BsonProperty("entity_id") @JsonProperty("entity_id") String entityId,
      @BsonId @BsonProperty("_id") @JsonProperty("_id") ObjectId id) {
    super(id, entityId);
    this.name = name;
    this.avatarUrl = avatarUrl;
    this.driverIds = driverIds != null ? new ArrayList<>(driverIds) : new ArrayList<>();
  }

  public Team(String name, String avatarUrl, List<String> driverIds) {
    this(name, avatarUrl, driverIds, null, null);
  }

  public Team(TeamModel model) {
    this(model.getName(), model.getAvatarUrl(), model.getDriverIdsList(),
        model.getModel().getEntityId(), null);
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

  public TeamModel toProto() {
    com.antigravity.proto.Model modelProto = com.antigravity.proto.Model.newBuilder()
        .setEntityId(getEntityId() != null ? getEntityId() : "")
        .build();

    return TeamModel.newBuilder()
        .setModel(modelProto)
        .setName(name)
        .setAvatarUrl(avatarUrl != null ? avatarUrl : "")
        .addAllDriverIds(driverIds)
        .build();
  }
}
