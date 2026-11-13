package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class RaceCompatibility {

  public enum Status {
    COMPATIBLE,
    DEGRADED,
    INCOMPATIBLE
  }

  @JsonProperty("status")
  private final Status status;

  @JsonProperty("can_run")
  private final boolean canRun;

  @JsonProperty("is_read_only")
  private final boolean isReadOnly;

  @JsonProperty("ignored_features")
  private final List<String> ignoredFeatures;

  @JsonProperty("blocking_features")
  private final List<String> blockingFeatures;

  public RaceCompatibility() {
    this(Status.COMPATIBLE, true, false, Collections.emptyList(), Collections.emptyList());
  }

  public RaceCompatibility(
      @JsonProperty("status") Status status,
      @JsonProperty("can_run") boolean canRun,
      @JsonProperty("is_read_only") boolean isReadOnly,
      @JsonProperty("ignored_features") List<String> ignoredFeatures,
      @JsonProperty("blocking_features") List<String> blockingFeatures) {
    this.status = status != null ? status : Status.COMPATIBLE;
    this.canRun = canRun;
    this.isReadOnly = isReadOnly;
    this.ignoredFeatures =
        ignoredFeatures != null ? new ArrayList<>(ignoredFeatures) : Collections.emptyList();
    this.blockingFeatures =
        blockingFeatures != null ? new ArrayList<>(blockingFeatures) : Collections.emptyList();
  }

  public Status getStatus() {
    return status;
  }

  public boolean isCanRun() {
    return canRun;
  }

  public boolean isReadOnly() {
    return isReadOnly;
  }

  public List<String> getIgnoredFeatures() {
    return ignoredFeatures;
  }

  public List<String> getBlockingFeatures() {
    return blockingFeatures;
  }

  public static RaceCompatibility compatible() {
    return new RaceCompatibility(
        Status.COMPATIBLE, true, false, Collections.emptyList(), Collections.emptyList());
  }
}
