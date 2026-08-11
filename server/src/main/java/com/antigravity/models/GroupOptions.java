package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class GroupOptions {

  @JsonProperty("enabled")
  private final boolean enabled;

  @JsonProperty("max_groups")
  private final int maxGroups;

  @JsonProperty("balance")
  private final boolean balance;

  @JsonProperty("allow_empty_lanes")
  private final boolean allowEmptyLanes;

  @JsonProperty("force_multiple_of_max")
  private final boolean forceMultipleOfMax;

  @JsonProperty("rotate_group_heats")
  private final boolean rotateGroupHeats;

  @JsonProperty("min_advancing")
  private final int minAdvancing;

  public GroupOptions() {
    this.enabled = false;
    this.maxGroups = 1;
    this.balance = false;
    this.allowEmptyLanes = true;
    this.forceMultipleOfMax = false;
    this.rotateGroupHeats = true;
    this.minAdvancing = 0;
  }

  @JsonCreator
  public GroupOptions(
      @JsonProperty("enabled") Boolean enabled,
      @JsonProperty("max_groups") Integer maxGroups,
      @JsonProperty("balance") Boolean balance,
      @JsonProperty("allow_empty_lanes") Boolean allowEmptyLanes,
      @JsonProperty("force_multiple_of_max") Boolean forceMultipleOfMax,
      @JsonProperty("rotate_group_heats") Boolean rotateGroupHeats,
      @JsonProperty("min_advancing") Integer minAdvancing) {
    this.enabled = enabled != null ? enabled : false;
    this.maxGroups = maxGroups != null ? maxGroups : 1;
    this.balance = balance != null ? balance : false;
    this.allowEmptyLanes = allowEmptyLanes != null ? allowEmptyLanes : true;
    this.forceMultipleOfMax = forceMultipleOfMax != null ? forceMultipleOfMax : false;
    this.rotateGroupHeats = rotateGroupHeats != null ? rotateGroupHeats : true;
    this.minAdvancing = minAdvancing != null ? minAdvancing : 0;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public int getMaxGroups() {
    return maxGroups;
  }

  public boolean isBalance() {
    return balance;
  }

  public boolean isAllowEmptyLanes() {
    return allowEmptyLanes;
  }

  public boolean isForceMultipleOfMax() {
    return forceMultipleOfMax;
  }

  public boolean isRotateGroupHeats() {
    return rotateGroupHeats;
  }

  public int getMinAdvancing() {
    return minAdvancing;
  }
}
