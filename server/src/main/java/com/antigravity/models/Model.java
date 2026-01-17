package com.antigravity.models;

import org.bson.types.ObjectId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Model {
    private ObjectId id;

    @BsonProperty("entity_id")
    @JsonProperty("entity_id")
    private String entityId;

    public ObjectId getId() {
        return id;
    }

    public void setId(ObjectId id) {
        this.id = id;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }
}
