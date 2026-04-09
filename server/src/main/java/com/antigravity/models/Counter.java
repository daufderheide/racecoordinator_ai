package com.antigravity.models;

import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class Counter {
  @BsonId
  @BsonProperty("_id")
  private String id;
  
  @BsonProperty("seq")
  private int seq;

  public Counter() {
  }

  public Counter(String id, int seq) {
    this.id = id;
    this.seq = seq;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public int getSeq() {
    return seq;
  }

  public void setSeq(int seq) {
    this.seq = seq;
  }
}
