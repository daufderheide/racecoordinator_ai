package com.antigravity.protocols.ds;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DsConfig {

  @JsonProperty("name")
  public String name;

  @JsonProperty("commPort")
  @JsonAlias({"comm_port", "commPort"})
  public String commPort;

  @JsonProperty("type")
  public DsType type;

  @JsonProperty("baudRate")
  @JsonAlias({"baud_rate", "baudRate"})
  public int baudRate;

  public DsConfig() {
    this.name = "DS-300";
    this.commPort = "";
    this.type = DsType.DS_300;
    this.baudRate = 57600;
  }

  @JsonCreator
  public DsConfig(
      @JsonProperty("name") String name,
      @JsonProperty("commPort") @JsonAlias({"comm_port", "commPort"}) String commPort,
      @JsonProperty("type") DsType type,
      @JsonProperty("baudRate") @JsonAlias({"baud_rate", "baudRate"}) Integer baudRate) {
    this.name = name != null ? name : "DS-300";
    this.commPort = commPort != null ? commPort : "";
    this.type = type != null ? type : DsType.DS_300;
    this.baudRate = (baudRate != null && baudRate > 0) ? baudRate : this.type.getBaudRate();
  }

  public DsConfig(String name, String commPort, DsType type) {
    this(name, commPort, type, null);
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCommPort() {
    return commPort;
  }

  public void setCommPort(String commPort) {
    this.commPort = commPort;
  }

  public DsType getType() {
    return type != null ? type : DsType.DS_300;
  }

  public void setType(DsType type) {
    this.type = type != null ? type : DsType.DS_300;
    this.baudRate = this.type.getBaudRate();
  }

  public int getBaudRate() {
    return baudRate > 0 ? baudRate : getType().getBaudRate();
  }

  public void setBaudRate(int baudRate) {
    this.baudRate = baudRate;
  }

  public boolean isDs200() {
    return getType().isDs200();
  }

  public boolean isDs030() {
    return getType().isDs030();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    DsConfig dsConfig = (DsConfig) o;
    return Objects.equals(name, dsConfig.name)
        && Objects.equals(commPort, dsConfig.commPort)
        && type == dsConfig.type;
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, commPort, type);
  }

  @Override
  public String toString() {
    return "DsConfig{"
        + "name='"
        + name
        + '\''
        + ", commPort='"
        + commPort
        + '\''
        + ", type="
        + type
        + ", baudRate="
        + getBaudRate()
        + '}';
  }

  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private String name = "DS-300";
    private String commPort = "";
    private DsType type = DsType.DS_300;
    private Integer baudRate = null;

    public Builder() {}

    public static Builder from(DsConfig other) {
      Builder builder = new Builder();
      if (other != null) {
        builder.name = other.name;
        builder.commPort = other.commPort;
        builder.type = other.type;
        builder.baudRate = other.getBaudRate();
      }
      return builder;
    }

    public Builder name(String name) {
      this.name = name;
      return this;
    }

    public Builder commPort(String commPort) {
      this.commPort = commPort;
      return this;
    }

    public Builder type(DsType type) {
      this.type = type;
      return this;
    }

    public Builder baudRate(int baudRate) {
      this.baudRate = baudRate;
      return this;
    }

    public DsConfig build() {
      int resolvedBaud =
          (baudRate != null && baudRate > 0)
              ? baudRate
              : (type != null ? type.getBaudRate() : 57600);
      return new DsConfig(name, commPort, type, resolvedBaud);
    }
  }
}
