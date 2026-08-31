package com.antigravity.handlers;

import com.antigravity.converters.ArduinoConfigConverter;
import com.antigravity.converters.BartConfigConverter;
import com.antigravity.converters.PhidgetConfigConverter;
import com.antigravity.converters.TrackmateConfigConverter;
import com.antigravity.proto.GetPhidgetDevicesResponse;
import com.antigravity.proto.InitializeInterfaceRequest;
import com.antigravity.proto.InitializeInterfaceResponse;
import com.antigravity.proto.PhidgetDeviceInfo;
import com.antigravity.proto.SetInterfacePinStateRequest;
import com.antigravity.proto.SetInterfacePinStateResponse;
import com.antigravity.proto.SetInterfaceRgbLedStateRequest;
import com.antigravity.proto.SetInterfaceRgbLedStateResponse;
import com.antigravity.proto.UpdateInterfaceConfigRequest;
import com.antigravity.proto.UpdateInterfaceConfigResponse;
import com.antigravity.protocols.IProtocol;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.TestInterfaceListener;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.protocols.bart.BartConfig;
import com.antigravity.protocols.bart.BartProtocol;
import com.antigravity.protocols.interfaces.BleConnection;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.antigravity.protocols.phidget.PhidgetConfig;
import com.antigravity.protocols.phidget.PhidgetProtocol;
import com.antigravity.protocols.trackmate.TrackmateConfig;
import com.antigravity.protocols.trackmate.TrackmateProtocol;
import com.antigravity.race.ClientSubscriptionManager;
import com.google.protobuf.InvalidProtocolBufferException;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class InterfaceHardwareHandler {

  private static final Logger logger = LoggerFactory.getLogger(InterfaceHardwareHandler.class);

  public InterfaceHardwareHandler() {}

  public void updateInterfaceConfig(Context ctx) {
    try {
      UpdateInterfaceConfigRequest request =
          UpdateInterfaceConfigRequest.parseFrom(ctx.bodyAsBytes());
      ArduinoConfig config = null;
      if (request.hasConfig()) {
        config = ArduinoConfigConverter.fromProto(request.getConfig());
      }
      PhidgetConfig phidgetConfig = null;
      if (request.hasPhidgetConfig()) {
        phidgetConfig = PhidgetConfigConverter.fromProto(request.getPhidgetConfig());
      }
      int interfaceIndex = request.getInterfaceIndex();

      ProtocolDelegate current = ClientSubscriptionManager.getInstance().getProtocol();
      IProtocol target = null;

      if (current != null) {
        List<IProtocol> protocols = current.getProtocols();
        if (interfaceIndex >= 0 && interfaceIndex < protocols.size()) {
          IProtocol p = protocols.get(interfaceIndex);
          if (p instanceof ArduinoProtocol || p instanceof PhidgetProtocol) {
            target = p;
          }
        }
      }

      if (target != null) {
        if (target instanceof ArduinoProtocol && config != null) {
          ((ArduinoProtocol) target).updateConfig(config);
        } else if (target instanceof PhidgetProtocol && phidgetConfig != null) {
          ((PhidgetProtocol) target).updateConfig(phidgetConfig);
        }

        UpdateInterfaceConfigResponse response =
            UpdateInterfaceConfigResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Configuration updated")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        String errMsg = "Target interface index " + interfaceIndex + " is invalid. ";
        if (current == null) {
          errMsg += "Current protocol delegate is null. ";
        } else {
          errMsg += "Protocol list size is " + current.getProtocols().size() + ". ";
        }
        UpdateInterfaceConfigResponse response =
            UpdateInterfaceConfigResponse.newBuilder().setSuccess(false).setMessage(errMsg).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error updating interface config", e);
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  public void initializeInterface(Context ctx) {
    try {
      InitializeInterfaceRequest request = InitializeInterfaceRequest.parseFrom(ctx.bodyAsBytes());

      List<IProtocol> protocols = new ArrayList<>();
      List<com.antigravity.proto.ArduinoConfig> configsList = // fqn-collision
          request.getConfigsList();
      int interfaceIndex = 0;
      for (int i = 0; i < configsList.size(); i++) {
        com.antigravity.proto.ArduinoConfig protoConfig = configsList.get(i); // fqn-collision
        ArduinoConfig config = ArduinoConfigConverter.fromProto(protoConfig);
        ArduinoProtocol arduino = new ArduinoProtocol(config, request.getLaneCount(), null);
        arduino.setInterfaceIndex(interfaceIndex++);
        arduino.setListener(new TestInterfaceListener());
        protocols.add(arduino);
      }

      List<com.antigravity.proto.TrackmateConfig> tmConfigsList = // fqn-collision
          request.getTrackmateConfigsList();
      for (int i = 0; i < tmConfigsList.size(); i++) {
        com.antigravity.proto.TrackmateConfig protoConfig = tmConfigsList.get(i); // fqn-collision
        TrackmateConfig config = TrackmateConfigConverter.fromProto(protoConfig);
        TrackmateProtocol trackmate = new TrackmateProtocol(config, request.getLaneCount());
        trackmate.setInterfaceIndex(interfaceIndex++);
        trackmate.setListener(new TestInterfaceListener());
        protocols.add(trackmate);
      }

      List<com.antigravity.proto.PhidgetConfig> phidgetConfigsList = // fqn-collision
          request.getPhidgetConfigsList();
      for (int i = 0; i < phidgetConfigsList.size(); i++) {
        com.antigravity.proto.PhidgetConfig protoConfig = // fqn-collision
            phidgetConfigsList.get(i);
        PhidgetConfig config = PhidgetConfigConverter.fromProto(protoConfig);
        PhidgetProtocol phidget = new PhidgetProtocol(config, request.getLaneCount(), null);
        phidget.setInterfaceIndex(interfaceIndex++);
        phidget.setListener(new TestInterfaceListener());
        protocols.add(phidget);
      }

      List<com.antigravity.proto.BartConfig> bartConfigsList = // fqn-collision
          request.getBartConfigsList();
      for (int i = 0; i < bartConfigsList.size(); i++) {
        com.antigravity.proto.BartConfig protoConfig = bartConfigsList.get(i); // fqn-collision
        BartConfig config = BartConfigConverter.fromProto(protoConfig);
        BartProtocol bart = new BartProtocol(config, request.getLaneCount());
        bart.setInterfaceIndex(interfaceIndex++);
        bart.setListener(new TestInterfaceListener());
        protocols.add(bart);
      }

      ProtocolDelegate finalProtocol;
      if (protocols.size() >= 1) {
        finalProtocol = new ProtocolDelegate(protocols);
      } else {
        throw new IllegalArgumentException("No configurations provided for initialization");
      }

      ClientSubscriptionManager.getInstance().setProtocol(finalProtocol);

      boolean success = finalProtocol.open();
      if (success) {
        logger.info(
            "Interface initialized successfully. Setting initial relay power state to OFF for {} lanes.",
            request.getLaneCount());
        finalProtocol.setMainPower(false);
        for (int i = 0; i < request.getLaneCount(); i++) {
          finalProtocol.setLanePower(false, i);
        }
      }

      InitializeInterfaceResponse response =
          InitializeInterfaceResponse.newBuilder()
              .setSuccess(success)
              .setMessage(
                  success
                      ? "Interfaces initialized successfully"
                      : "Failed to open one or more interfaces")
              .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Throwable e) {
      if (e instanceof ExceptionInInitializerError
          || e instanceof NoClassDefFoundError
          || e instanceof UnsatisfiedLinkError
          || e instanceof LinkageError
          || (e.getCause() != null
              && (e.getCause() instanceof UnsatisfiedLinkError
                  || e.getCause() instanceof LinkageError))) {
        logger.error("Phidget driver not installed. The Phidget22 driver must be installed.");
        ctx.status(500).result("MISSING_PHIDGET_DRIVER");
      } else if (e instanceof IllegalStateException) {
        ctx.status(409).result(e.getMessage());
      } else if (e instanceof InvalidProtocolBufferException) {
        ctx.status(400).result("Invalid message: " + e.getMessage());
      } else {
        logger.error("Error initializing interface", e);
        ctx.status(500).result("Internal Server Error: " + e.toString());
      }
    }
  }

  public void setMainPower(Context ctx) {
    try {
      boolean on = Boolean.parseBoolean(ctx.queryParam("on"));
      logger.info("ClientCommand received: set-main-power {}", on);
      ReplayLogger.logReplayCommand("setMainPower", ReplayLogger.mapOf("on", on));
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race != null) {
        race.forceUserMainPower(on);
        ctx.status(200).result("Main power set to " + on);
      } else {
        ProtocolDelegate protocol = ClientSubscriptionManager.getInstance().getProtocol();
        if (protocol != null) {
          protocol.setMainPower(on);
          if (!protocol.hasMainRelay() && protocol.hasPerLaneRelays()) {
            protocol.setLanePower(on, -1);
          }
          ctx.status(200).result("Main power set to " + on);
        } else {
          ctx.status(404).result("No active race or interface found");
        }
      }
    } catch (Exception e) {
      logger.error("Error setting main power", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void setLanePower(Context ctx) {
    try {
      int lane = Integer.parseInt(ctx.pathParam("lane"));
      boolean on = Boolean.parseBoolean(ctx.queryParam("on"));
      int laneIndex = lane - 1;
      logger.info(
          "ClientCommand received: set-lane-power lane param: {}, 0-based laneIndex: {}, on: {}",
          lane,
          laneIndex,
          on);
      ReplayLogger.logReplayCommand("setLanePower", ReplayLogger.mapOf("lane", lane, "on", on));
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race != null) {
        race.setLanePower(on, laneIndex);
        ctx.status(200).result("Lane " + lane + " power set to " + on);
      } else {
        ProtocolDelegate protocol = ClientSubscriptionManager.getInstance().getProtocol();
        if (protocol != null) {
          protocol.setLanePower(on, laneIndex);
          ctx.status(200).result("Lane " + lane + " power set to " + on);
        } else {
          ctx.status(404).result("No active race or interface found");
        }
      }
    } catch (Exception e) {
      logger.error("Error setting lane power", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void getSerialPorts(Context ctx) {
    try {
      List<String> ports = SerialConnection.getAvailableSerialPorts();
      ctx.json(ports);
    } catch (Exception e) {
      logger.error("Error getting serial ports", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void getBleDevices(Context ctx) {
    try {
      List<String> devices = BleConnection.getDiscoveredBleDevices();
      logger.debug(
          "GET /api/ble-devices - Raw hardware discovered BLE devices (count={}): {}",
          devices.size(),
          devices);
      List<String> bartDevices = new ArrayList<>();
      for (String dev : devices) {
        if (dev != null && dev.toUpperCase().startsWith("BART")) {
          bartDevices.add(dev);
        }
      }
      logger.debug(
          "GET /api/ble-devices - Filtered BART devices (count={}): {}",
          bartDevices.size(),
          bartDevices);
      ctx.json(bartDevices);
    } catch (Exception e) {
      logger.error("Error getting BLE devices", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void getPhidgetDevices(Context ctx) {
    try {
      GetPhidgetDevicesResponse.Builder responseBuilder = GetPhidgetDevicesResponse.newBuilder();

      Map<Integer, PhidgetDeviceInfo> deviceMap = new ConcurrentHashMap<>();
      com.phidget22.Manager manager = new com.phidget22.Manager();

      manager.addAttachListener(
          e -> {
            try {
              com.phidget22.Phidget p = e.getChannel();
              int digitalInputs = 0;
              int digitalOutputs = 0;
              int analogInputs = 0;
              try {
                digitalInputs = p.getDeviceChannelCount(com.phidget22.ChannelClass.DIGITAL_INPUT);
              } catch (Throwable ignored) {
              }
              try {
                digitalOutputs = p.getDeviceChannelCount(com.phidget22.ChannelClass.DIGITAL_OUTPUT);
              } catch (Throwable ignored) {
              }
              try {
                analogInputs =
                    p.getDeviceChannelCount(com.phidget22.ChannelClass.VOLTAGE_RATIO_INPUT);
                if (analogInputs == 0) {
                  analogInputs = p.getDeviceChannelCount(com.phidget22.ChannelClass.VOLTAGE_INPUT);
                }
              } catch (Throwable ignored) {
              }

              PhidgetDeviceInfo info =
                  PhidgetDeviceInfo.newBuilder()
                      .setSerialNumber(p.getDeviceSerialNumber())
                      .setName(p.getDeviceName())
                      .setIsHubPort(p.getIsHubPortDevice())
                      .setHubPort(p.getHubPort())
                      .setDigitalInputCount(digitalInputs)
                      .setDigitalOutputCount(digitalOutputs)
                      .setAnalogInputCount(analogInputs)
                      .build();
              deviceMap.put(p.getDeviceSerialNumber(), info);
            } catch (com.phidget22.PhidgetException ex) {
              logger.error("Error getting phidget info", ex);
            }
          });

      manager.open();
      Thread.sleep(500);
      manager.close();

      responseBuilder.addAllDevices(deviceMap.values());
      ctx.contentType("application/octet-stream").result(responseBuilder.build().toByteArray());
    } catch (Throwable e) {
      if (e instanceof ExceptionInInitializerError
          || e instanceof NoClassDefFoundError
          || e instanceof UnsatisfiedLinkError
          || e instanceof LinkageError
          || (e.getCause() != null
              && (e.getCause() instanceof UnsatisfiedLinkError
                  || e.getCause() instanceof LinkageError))) {
        logger.error("Phidget driver not installed. The Phidget22 driver must be installed.");
        ctx.status(500).result("MISSING_PHIDGET_DRIVER");
      } else {
        logger.error("Error getting Phidget devices", e);
        ctx.status(500).result("Internal Server Error: " + e.getMessage());
      }
    }
  }

  public void setInterfacePinState(Context ctx) {
    try {
      SetInterfacePinStateRequest request =
          SetInterfacePinStateRequest.parseFrom(ctx.bodyAsBytes());
      int interfaceIndex = request.getInterfaceIndex();

      ProtocolDelegate current = ClientSubscriptionManager.getInstance().getProtocol();
      IProtocol target = null;
      boolean pinSetSuccess = true;
      String failureMessage = null;

      if (current != null) {
        List<IProtocol> protocols = current.getProtocols();
        if (interfaceIndex >= 0 && interfaceIndex < protocols.size()) {
          IProtocol p = protocols.get(interfaceIndex);
          // TODO(aufderheide): Remove all the interface specific code from here.
          if (p instanceof ArduinoProtocol) {
            target = p;
            ((ArduinoProtocol) p)
                .setPinState(request.getIsDigital(), request.getPin(), request.getIsHigh());
          } else if (p instanceof PhidgetProtocol) {
            target = p;
            boolean ok =
                ((PhidgetProtocol) p)
                    .setPinState(request.getIsDigital(), request.getPin(), request.getIsHigh());
            if (!ok) {
              pinSetSuccess = false;
              failureMessage =
                  "Phidget digital output channel "
                      + request.getPin()
                      + " is not attached or command failed";
            }
          }
        }
      }

      if (target != null && pinSetSuccess) {
        SetInterfacePinStateResponse response =
            SetInterfacePinStateResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Pin state command sent")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else if (target != null) {
        SetInterfacePinStateResponse response =
            SetInterfacePinStateResponse.newBuilder()
                .setSuccess(false)
                .setMessage(
                    failureMessage != null
                        ? failureMessage
                        : "Failed to set pin state on interface")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        SetInterfacePinStateResponse response =
            SetInterfacePinStateResponse.newBuilder()
                .setSuccess(false)
                .setMessage(
                    "Target interface index "
                        + interfaceIndex
                        + " is invalid or unsupported protocol")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error setting interface pin state", e);
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  public void setInterfaceRgbLedState(Context ctx) {
    try {
      SetInterfaceRgbLedStateRequest request =
          SetInterfaceRgbLedStateRequest.parseFrom(ctx.bodyAsBytes());
      int interfaceIndex = request.getInterfaceIndex();

      ProtocolDelegate current = ClientSubscriptionManager.getInstance().getProtocol();
      ArduinoProtocol target = null;

      if (current != null) {
        List<IProtocol> protocols = current.getProtocols();
        if (interfaceIndex >= 0 && interfaceIndex < protocols.size()) {
          IProtocol p = protocols.get(interfaceIndex);
          if (p instanceof ArduinoProtocol) {
            target = (ArduinoProtocol) p;
          }
        }
      }

      if (target != null) {
        target.setStringRgbLedValues(request.getPin(), request.getLedsList());

        SetInterfaceRgbLedStateResponse response =
            SetInterfaceRgbLedStateResponse.newBuilder()
                .setSuccess(true)
                .setMessage("RGB LED state command sent")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        SetInterfaceRgbLedStateResponse response =
            SetInterfaceRgbLedStateResponse.newBuilder()
                .setSuccess(false)
                .setMessage(
                    "Target interface index "
                        + interfaceIndex
                        + " is invalid or not an ArduinoProtocol")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error setting interface RGB LED state", e);
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  public void closeInterface(Context ctx) {
    try {
      logger.info("Explicit close-interface requested");
      ClientSubscriptionManager.getInstance().setProtocol(null);
      ctx.status(200).result("OK");
    } catch (Exception e) {
      logger.error("Error closing interface", e);
      ctx.status(500).result("Error closing interface: " + e.getMessage());
    }
  }
}
