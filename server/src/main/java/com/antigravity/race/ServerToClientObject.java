package com.antigravity.race;

import java.util.UUID;

public abstract class ServerToClientObject {
  private String objectId;

  public ServerToClientObject() {
    this.objectId = UUID.randomUUID().toString();
  }

  public ServerToClientObject(String objectId) {
    if (objectId == null) {
      this.objectId = UUID.randomUUID().toString();
    } else {
      this.objectId = objectId;
    }
  }

  public String getObjectId() {
    return objectId;
  }

  public void setObjectId(String objectId) {
    this.objectId = objectId;
  }
}
