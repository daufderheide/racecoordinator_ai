package com.antigravity.models;

import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class Driver extends Model {
    public static final Driver EMPTY_DRIVER = new Driver("Empty", "Empty");

    private final String name;
    private final String nickname;

    @BsonCreator
    public Driver(@BsonProperty("name") String name,
            @BsonProperty("nickname") String nickname,
            @BsonProperty("entity_id") String entityId,
            @BsonId ObjectId id) {
        super(id, entityId);
        this.name = name;
        this.nickname = nickname;
    }

    public Driver(String name) {
        this(name, null, null, null);
    }

    public Driver(String name, String nickname) {
        this(name, nickname, null, null);
    }

    public String getName() {
        return name;
    }

    public String getNickname() {
        return nickname;
    }
}
