package com.antigravity.models;

import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class Lane extends Model {
    private final String background_color;
    private final String foreground_color;
    private final int length;

    @BsonCreator
    public Lane(@BsonProperty("background_color") String background_color,
            @BsonProperty("foreground_color") String foreground_color,
            @BsonProperty("length") int length,
            @BsonProperty("entity_id") String entityId,
            @BsonId ObjectId id) {
        super(id, entityId);
        this.background_color = background_color;
        this.foreground_color = foreground_color;
        this.length = length;
    }

    public Lane(String background_color, String foreground_color, int length) {
        this(background_color, foreground_color, length, null, null);
    }

    public String getBackground_color() {
        return background_color;
    }

    public String getForeground_color() {
        return foreground_color;
    }

    public int getLength() {
        return length;
    }
}
