package com.antigravity.models;

import org.bson.types.ObjectId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Model extends com.antigravity.race.ServerToClientObject {
    private final ObjectId id;

    @BsonProperty("entity_id")
    @JsonProperty("entity_id")
    private final String entityId;

    @BsonCreator
    public Model(@BsonId ObjectId id, @BsonProperty("entity_id") String entityId) {
        super(entityId);
        this.id = id;
        this.entityId = entityId;
    }

    public ObjectId getId() {
        return id;
    }

    public String getEntityId() {
        return entityId;
    }
}
