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
    private final AudioConfig lapAudio;
    private final AudioConfig bestLapAudio;

    @BsonCreator
    public Driver(@BsonProperty("name") @JsonProperty("name") String name,
            @BsonProperty("nickname") @JsonProperty("nickname") String nickname,
            @BsonProperty("avatarUrl") @JsonProperty("avatarUrl") String avatarUrl,
            @BsonProperty("lapAudio") @JsonProperty("lapAudio") AudioConfig lapAudio,
            @BsonProperty("bestLapAudio") @JsonProperty("bestLapAudio") AudioConfig bestLapAudio,
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

        if (lapAudio != null) {
            this.lapAudio = lapAudio;
        } else if (lapSoundUrl != null || lapSoundType != null || lapSoundText != null) {
            this.lapAudio = new AudioConfig(lapSoundType, lapSoundUrl, lapSoundText);
        } else {
            this.lapAudio = new AudioConfig();
        }

        if (bestLapAudio != null) {
            this.bestLapAudio = bestLapAudio;
        } else if (bestLapSoundUrl != null || bestLapSoundType != null || bestLapSoundText != null) {
            this.bestLapAudio = new AudioConfig(bestLapSoundType, bestLapSoundUrl, bestLapSoundText);
        } else {
            this.bestLapAudio = new AudioConfig();
        }
    }

    public Driver(String name, String nickname, String entityId, ObjectId id) {
        this(name, nickname, null, null, null, null, null, null, null, null, null, entityId, id);
    }

    public Driver(String name) {
        this(name, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    public Driver(String name, String nickname) {
        this(name, nickname, null, null, null, null, null, null, null, null, null, null, null);
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

    public AudioConfig getLapAudio() {
        return lapAudio;
    }

    public AudioConfig getBestLapAudio() {
        return bestLapAudio;
    }

    public static class AudioConfig {
        private final String type;
        private final String url;
        private final String text;

        @BsonCreator
        public AudioConfig(@BsonProperty("type") @JsonProperty("type") String type,
                @BsonProperty("url") @JsonProperty("url") String url,
                @BsonProperty("text") @JsonProperty("text") String text) {
            this.type = type != null ? type : "preset";
            this.url = url;
            this.text = text;
        }

        public AudioConfig() {
            this("preset", null, null);
        }

        public String getType() {
            return type;
        }

        public String getUrl() {
            return url;
        }

        public String getText() {
            return text;
        }
    }
}
