package com.antigravity.models;

import java.util.Collections;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import com.antigravity.protocols.arduino.ArduinoConfig;
import org.bson.types.ObjectId;

public class Track extends Model {
  private final String name;
  private final List<Lane> lanes;
  private final ArduinoConfig arduinoConfig;

  @BsonCreator
  @com.fasterxml.jackson.annotation.JsonCreator
  public Track(@BsonProperty("name") @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
      @BsonProperty("lanes") @com.fasterxml.jackson.annotation.JsonProperty("lanes") List<Lane> lanes,
      @BsonProperty("arduino_config") @com.fasterxml.jackson.annotation.JsonProperty("arduino_config") ArduinoConfig arduinoConfig,
      @BsonProperty("entity_id") @com.fasterxml.jackson.annotation.JsonProperty("entity_id") String entityId,
      @BsonId @com.fasterxml.jackson.annotation.JsonProperty("_id") ObjectId id) {
    super(id, entityId);
    this.name = name;
    this.lanes = lanes != null ? Collections.unmodifiableList(lanes) : Collections.emptyList();
    this.arduinoConfig = arduinoConfig;
  }

  public Track(String name, List<Lane> lanes, String entityId, ObjectId id) {
    this(name, lanes, null, entityId, id);
  }

  // Legacy constructor or convenience
  public Track(String name, List<Lane> lanes) {
    this(name, lanes, null, null, null);
  }

  public String getName() {
    return name;
  }

  public List<Lane> getLanes() {
    return lanes;
  }

  @com.fasterxml.jackson.annotation.JsonProperty("arduino_config")
  @org.bson.codecs.pojo.annotations.BsonProperty("arduino_config")
  public ArduinoConfig getArduinoConfig() {
    return arduinoConfig;
  }
}
