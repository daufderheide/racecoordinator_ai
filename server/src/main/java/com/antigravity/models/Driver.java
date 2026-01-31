package com.antigravity.models;

import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Driver extends Model {
    public static final Driver EMPTY_DRIVER = new Driver("Empty", "Empty");

    private final String name;
    private final String nickname;
    private final String avatarUrl;
    private final String lapSoundUrl;
    private final String bestLapSoundUrl;
    private final String lapSoundType;
    private final String bestLapSoundType;
    private final String lapSoundText;
    private final String bestLapSoundText;

    @BsonCreator
    public Driver(@BsonProperty("name") @JsonProperty("name") String name,
            @BsonProperty("nickname") @JsonProperty("nickname") String nickname,
            @BsonProperty("avatarUrl") @JsonProperty("avatarUrl") String avatarUrl,
            @BsonProperty("lapSoundUrl") @JsonProperty("lapSoundUrl") String lapSoundUrl,
            @BsonProperty("bestLapSoundUrl") @JsonProperty("bestLapSoundUrl") String bestLapSoundUrl,
            @BsonProperty("lapSoundType") @JsonProperty("lapSoundType") String lapSoundType,
            @BsonProperty("bestLapSoundType") @JsonProperty("bestLapSoundType") String bestLapSoundType,
            @BsonProperty("lapSoundText") @JsonProperty("lapSoundText") String lapSoundText,
            @BsonProperty("bestLapSoundText") @JsonProperty("bestLapSoundText") String bestLapSoundText,
            @BsonProperty("entity_id") @JsonProperty("entity_id") String entityId,
            @BsonId @BsonProperty("_id") @JsonProperty("_id") ObjectId id) {
        super(id, entityId);
        this.name = name;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.lapSoundUrl = lapSoundUrl;
        this.bestLapSoundUrl = bestLapSoundUrl;
        this.lapSoundType = lapSoundType;
        this.bestLapSoundType = bestLapSoundType;
        this.lapSoundText = lapSoundText;
        this.bestLapSoundText = bestLapSoundText;
    }

    public Driver(String name, String nickname, String entityId, ObjectId id) {
        this(name, nickname, null, null, null, null, null, null, null, entityId, id);
    }

    public Driver(String name) {
        this(name, null, null, null, null, null, null, null, null, null, null);
    }

    public Driver(String name, String nickname) {
        this(name, nickname, null, null, null, null, null, null, null, null, null);
    }

    public String getName() {
        return name;
    }

    public String getNickname() {
        return nickname;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getLapSoundUrl() {
        return lapSoundUrl;
    }

    public String getBestLapSoundUrl() {
        return bestLapSoundUrl;
    }

    public String getLapSoundType() {
        return lapSoundType;
    }

    public String getBestLapSoundType() {
        return bestLapSoundType;
    }

    public String getLapSoundText() {
        return lapSoundText;
    }

    public String getBestLapSoundText() {
        return bestLapSoundText;
    }
}
