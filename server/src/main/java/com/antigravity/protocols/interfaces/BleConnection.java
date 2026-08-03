package com.antigravity.protocols.interfaces;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BleConnection implements IBleConnection {

  private static final Logger logger = LoggerFactory.getLogger(BleConnection.class);

  private String deviceName;
  private String deviceAddress;
  private boolean open = false;
  private final List<ConnectionDataListener> listeners = new ArrayList<>();
  private static final List<String> discoveredBleDevices =
      new java.util.concurrent.CopyOnWriteArrayList<>();

  public static List<String> getDiscoveredBleDevices() {
    return new ArrayList<>(discoveredBleDevices);
  }

  public static void registerDiscoveredBleDevice(String name) {
    if (name != null && !name.trim().isEmpty() && !discoveredBleDevices.contains(name)) {
      discoveredBleDevices.add(name);
    }
  }

  public static void clearDiscoveredBleDevices() {
    discoveredBleDevices.clear();
  }

  public BleConnection() {}

  public BleConnection(String deviceName, String deviceAddress) {
    this.deviceName = deviceName;
    this.deviceAddress = deviceAddress;
    if (deviceName != null && !deviceName.isEmpty()) {
      registerDiscoveredBleDevice(deviceName);
    }
  }

  @Override
  public void connect(String target) throws IOException {
    this.deviceName = target;
    this.deviceAddress = target;
    this.open = true;
    logger.info("BLE Connection established to target: {}", target);
  }

  @Override
  public void disconnect() {
    this.open = false;
    logger.info(
        "BLE Connection disconnected from: {}", deviceAddress != null ? deviceAddress : deviceName);
  }

  @Override
  public void writeData(byte[] data) throws IOException {
    if (!open) {
      throw new IOException("BLE connection not open");
    }
    logger.info("BLE Outbound -> {}", bytesToHex(data));
  }

  @Override
  public void writeData(String data) throws IOException {
    writeData(data.getBytes(StandardCharsets.UTF_8));
  }

  @Override
  public boolean isOpen() {
    return open;
  }

  @Override
  public void addDataListener(ConnectionDataListener listener) {
    if (listener != null) {
      listeners.add(listener);
    }
  }

  @Override
  public String getDeviceName() {
    return deviceName;
  }

  @Override
  public String getDeviceAddress() {
    return deviceAddress;
  }

  public void injectReceivedData(byte[] data) {
    if (!open || data == null) return;
    logger.info("BLE Connection RX <- {}", bytesToHex(data));
    for (ConnectionDataListener listener : listeners) {
      listener.onDataReceived(data);
    }
  }

  private static String bytesToHex(byte[] bytes) {
    StringBuilder sb = new StringBuilder();
    for (byte b : bytes) {
      sb.append(String.format("%02X ", b));
    }
    return sb.toString().trim();
  }
}
