package com.antigravity.models;

import com.antigravity.race.ServerToClientObject;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Model extends ServerToClientObject {

  @JsonProperty("_id")
  private final String id;

  @JsonProperty("entity_id")
  private final String entityId;

  public Model(@JsonProperty("_id") String id, @JsonProperty("entity_id") String entityId) {
    super(entityId);
    this.id = id != null ? id : getObjectId();
    this.entityId = (entityId != null) ? entityId : this.id;
  }

  public String getId() {
    return id;
  }

  public String getEntityId() {
    return entityId;
  }
}
