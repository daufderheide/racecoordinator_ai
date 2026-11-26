package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class StepResults {
  @JsonProperty("step")
  private int step;

  @JsonProperty("group")
  private int group;

  @JsonProperty("next_step")
  @JsonAlias("nextStep")
  private int nextStep;

  @JsonProperty("step_up_count")
  @JsonAlias("stepUpCount")
  private int stepUpCount;

  @JsonProperty("standings")
  private List<StepDriverResult> standings;

  public StepResults() {
    this.standings = new ArrayList<>();
  }

  public StepResults(
      int step, int group, int nextStep, int stepUpCount, List<StepDriverResult> standings) {
    this.step = step;
    this.group = group;
    this.nextStep = nextStep;
    this.stepUpCount = stepUpCount;
    this.standings = standings != null ? standings : new ArrayList<>();
  }

  public int getStep() {
    return step;
  }

  public void setStep(int step) {
    this.step = step;
  }

  public int getGroup() {
    return group;
  }

  public void setGroup(int group) {
    this.group = group;
  }

  public int getNextStep() {
    return nextStep;
  }

  public void setNextStep(int nextStep) {
    this.nextStep = nextStep;
  }

  public int getStepUpCount() {
    return stepUpCount;
  }

  public void setStepUpCount(int stepUpCount) {
    this.stepUpCount = stepUpCount;
  }

  public List<StepDriverResult> getStandings() {
    return standings;
  }

  public void setStandings(List<StepDriverResult> standings) {
    this.standings = standings != null ? standings : new ArrayList<>();
  }

  @JsonProperty("nextStep")
  public int getNextStepCamel() {
    return nextStep;
  }

  @JsonProperty("stepUpCount")
  public int getStepUpCountCamel() {
    return stepUpCount;
  }
}
