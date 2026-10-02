package com.antigravity.importer.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

public class ExistingDriverSummary {

  private String entityId;
  private String name;
  private String nickname;

  public ExistingDriverSummary() {}

  @JsonCreator
  public ExistingDriverSummary(
      @JsonProperty("entityId") String entityId,
      @JsonProperty("name") String name,
      @JsonProperty("nickname") String nickname) {
    this.entityId = entityId;
    this.name = name;
    this.nickname = nickname;
  }

  public String getEntityId() {
    return entityId;
  }

  public void setEntityId(String entityId) {
    this.entityId = entityId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getNickname() {
    return nickname;
  }

  public void setNickname(String nickname) {
    this.nickname = nickname;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    ExistingDriverSummary that = (ExistingDriverSummary) o;
    return Objects.equals(entityId, that.entityId)
        && Objects.equals(name, that.name)
        && Objects.equals(nickname, that.nickname);
  }

  @Override
  public int hashCode() {
    return Objects.hash(entityId, name, nickname);
  }
}
