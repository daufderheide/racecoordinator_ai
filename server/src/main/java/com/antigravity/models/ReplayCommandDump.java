package com.antigravity.models;

public class ReplayCommandDump {

  private String command;
  private Object parameters;

  public ReplayCommandDump() {}

  public ReplayCommandDump(String command, Object parameters) {
    this.command = command;
    this.parameters = parameters;
  }

  public String getCommand() {
    return command;
  }

  public void setCommand(String command) {
    this.command = command;
  }

  public Object getParameters() {
    return parameters;
  }

  public void setParameters(Object parameters) {
    this.parameters = parameters;
  }
}
