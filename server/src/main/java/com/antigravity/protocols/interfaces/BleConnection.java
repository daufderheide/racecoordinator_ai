package com.antigravity.protocols.interfaces;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BleConnection implements IBleConnection {

  private static final Logger logger = LoggerFactory.getLogger(BleConnection.class);

  public static boolean mockMode = detectTestEnvironment();
  private static final List<String> mockDiscoveredDevices = new CopyOnWriteArrayList<>();

  private String deviceName;
  private String deviceAddress;
  private volatile boolean open = false;
  private final List<ConnectionDataListener> listeners = new ArrayList<>();

  private Process bridgeProcess;
  private BufferedWriter bridgeWriter;

  private static boolean detectTestEnvironment() {
    if (Boolean.getBoolean("mockBle")) {
      return true;
    }
    for (StackTraceElement el : Thread.currentThread().getStackTrace()) {
      String cls = el.getClassName().toLowerCase();
      if (cls.contains("org.junit") || cls.contains("junit.runner")) {
        return true;
      }
    }
    return false;
  }

  private static final java.util.Map<String, Long> discoveredCache =
      new java.util.concurrent.ConcurrentHashMap<>();

  private static final java.util.Set<String> activeConnectedDevices =
      java.util.Collections.newSetFromMap(new java.util.concurrent.ConcurrentHashMap<>());

  private static volatile long lastScanTimeMs = 0;
  private static final long SCAN_CACHE_TTL_MS = 10000;

  private static final java.util.concurrent.atomic.AtomicInteger connectingCount =
      new java.util.concurrent.atomic.AtomicInteger(0);

  private static final Object SCAN_LOCK = new Object();

  public static List<String> getDiscoveredBleDevices() {
    if (mockMode) {
      logger.info(
          "GET /api/ble-devices - BleConnection in MOCK mode, returning mock devices: {}",
          mockDiscoveredDevices);
      return new ArrayList<>(mockDiscoveredDevices);
    }
    long now = System.currentTimeMillis();

    for (String dev : activeConnectedDevices) {
      if (dev != null && !dev.trim().isEmpty()) {
        discoveredCache.put(dev, now);
      }
    }
    for (String dev : mockDiscoveredDevices) {
      if (dev != null && !dev.trim().isEmpty()) {
        discoveredCache.put(dev, now);
      }
    }

    if (connectingCount.get() > 0 || !activeConnectedDevices.isEmpty()) {
      logger.debug(
          "GET /api/ble-devices - BLE connection active or in progress; returning cached devices.");
      return new ArrayList<>(discoveredCache.keySet());
    }

    if (now - lastScanTimeMs >= SCAN_CACHE_TTL_MS) {
      synchronized (SCAN_LOCK) {
        if (connectingCount.get() > 0 || !activeConnectedDevices.isEmpty()) {
          return new ArrayList<>(discoveredCache.keySet());
        }
        if (now - lastScanTimeMs >= SCAN_CACHE_TTL_MS) {
          logger.debug("GET /api/ble-devices - Executing native BLE discovery scan...");
          List<String> devices = runNativeBleScan();
          for (String dev : devices) {
            if (dev != null && !dev.trim().isEmpty()) {
              discoveredCache.put(dev, now);
            }
          }
          lastScanTimeMs = now;
        }
      }
    }

    // Retain entries for 30 seconds
    discoveredCache.entrySet().removeIf(entry -> (now - entry.getValue()) > 30000);

    List<String> aggregated = new ArrayList<>(discoveredCache.keySet());
    logger.debug(
        "GET /api/ble-devices - Active BLE devices count={}: {}", aggregated.size(), aggregated);
    return aggregated;
  }

  public static void registerDiscoveredBleDevice(String name) {
    if (name != null && !name.trim().isEmpty() && !mockDiscoveredDevices.contains(name)) {
      mockDiscoveredDevices.add(name);
      discoveredCache.put(name, System.currentTimeMillis());
    }
  }

  public static void clearDiscoveredBleDevices() {
    mockDiscoveredDevices.clear();
    discoveredCache.clear();
    activeConnectedDevices.clear();
    lastScanTimeMs = 0;
  }

  public BleConnection() {}

  public BleConnection(String deviceName, String deviceAddress) {
    this.deviceName = deviceName;
    this.deviceAddress = deviceAddress;
    if (deviceName != null && !deviceName.isEmpty()) {
      registerDiscoveredBleDevice(deviceName);
    }
  }

  public static boolean isMac() {
    String os = System.getProperty("os.name", "").toLowerCase();
    return os.contains("mac") || os.contains("darwin");
  }

  public static boolean isWindows() {
    String os = System.getProperty("os.name", "").toLowerCase();
    return os.contains("win");
  }

  public static boolean isLinux() {
    String os = System.getProperty("os.name", "").toLowerCase();
    return os.contains("nux") || os.contains("nix");
  }

  @Override
  public synchronized void connect(String target) throws IOException {
    connectingCount.incrementAndGet();
    try {
      this.deviceName = target;
      this.deviceAddress = target;

      if (mockMode) {
        this.open = true;
        if (target != null && !target.isEmpty()) {
          activeConnectedDevices.add(target);
        }
        logger.info("BLE Connection (MOCK) established to target: {}", target);
        return;
      }

      logger.info(
          "Initiating native BLE connection to peripheral ({}) on OS: {}",
          target,
          System.getProperty("os.name"));
      synchronized (SCAN_LOCK) {
        if (!startNativeBridgeProcess(target)) {
          return;
        }
      }

      this.bridgeWriter =
          new BufferedWriter(
              new OutputStreamWriter(bridgeProcess.getOutputStream(), StandardCharsets.UTF_8));

      CountDownLatch connectLatch = new CountDownLatch(1);
      final boolean[] connectSuccess = new boolean[1];

      startRxThread(target, connectLatch, connectSuccess);

      try {
        if (!connectLatch.await(5, TimeUnit.SECONDS) || !connectSuccess[0]) {
          disconnect();
          throw new IOException(
              "Failed to connect to native BLE peripheral within 5 seconds: " + target);
        }
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        disconnect();
        throw new IOException("Interrupted waiting for BLE connection to: " + target, e);
      }
    } finally {
      connectingCount.decrementAndGet();
    }
  }

  private boolean startNativeBridgeProcess(String target) throws IOException {
    try {
      if (isMac()) {
        this.bridgeProcess = BleConnectionMac.startBridgeProcess(target);
      } else if (isWindows()) {
        this.bridgeProcess = BleConnectionWindows.startBridgeProcess(target);
      } else if (isLinux()) {
        this.bridgeProcess = BleConnectionLinux.startBridgeProcess(target);
      } else {
        this.open = true;
        if (target != null && !target.isEmpty()) {
          activeConnectedDevices.add(target);
        }
        logger.warn(
            "Unsupported OS for native BLE, falling back to mock BLE for target: {}", target);
        return false;
      }
      return true;
    } catch (Exception e) {
      throw new IOException("Failed to start native BLE process for target " + target, e);
    }
  }

  private void startRxThread(String target, CountDownLatch connectLatch, boolean[] connectSuccess) {
    Thread rxThread =
        new Thread(
            () -> {
              try (BufferedReader reader =
                  new BufferedReader(
                      new InputStreamReader(
                          bridgeProcess.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                  line = line.trim();
                  if ("CONNECTED".equals(line)) {
                    this.open = true;
                    if (target != null && !target.isEmpty()) {
                      activeConnectedDevices.add(target);
                    }
                    connectSuccess[0] = true;
                    connectLatch.countDown();
                    logger.info("Native CoreBluetooth connected to BART peripheral: {}", target);
                  } else if ("DISCONNECTED".equals(line)) {
                    this.open = false;
                    if (target != null) {
                      activeConnectedDevices.remove(target);
                    }
                    connectLatch.countDown();
                    logger.info(
                        "Native CoreBluetooth disconnected from BART peripheral: {}", target);
                    break;
                  } else if (line.startsWith("RX:")) {
                    String hex = line.substring(3).trim();
                    byte[] bytes = hexToBytes(hex);
                    if (bytes.length > 0) {
                      injectReceivedData(bytes);
                    }
                  }
                }
              } catch (Exception e) {
                logger.debug("BLE bridge RX thread ended: {}", e.getMessage());
              } finally {
                this.open = false;
                if (target != null) {
                  activeConnectedDevices.remove(target);
                }
                connectLatch.countDown();
              }
            },
            "BLE-Bridge-RX-" + target);

    rxThread.setDaemon(true);
    rxThread.start();
  }

  @Override
  public synchronized void disconnect() {
    this.open = false;
    String target = deviceAddress != null ? deviceAddress : deviceName;
    if (target != null) {
      activeConnectedDevices.remove(target);
    }
    if (bridgeWriter != null) {
      try {
        bridgeWriter.write("DISCONNECT\n");
        bridgeWriter.flush();
      } catch (Exception ignored) {
      }
    }
    if (bridgeProcess != null && bridgeProcess.isAlive()) {
      try {
        if (!bridgeProcess.waitFor(1500, java.util.concurrent.TimeUnit.MILLISECONDS)) {
          bridgeProcess.destroyForcibly();
        }
      } catch (Exception e) {
        bridgeProcess.destroyForcibly();
      }
    }
    this.bridgeProcess = null;
    this.bridgeWriter = null;
    logger.info("BLE Connection disconnected from: {}", target);
  }

  private final java.io.ByteArrayOutputStream sentBuffer = new java.io.ByteArrayOutputStream();

  public synchronized byte[] getSentBytes() {
    return sentBuffer.toByteArray();
  }

  public synchronized void clearSentBytes() {
    sentBuffer.reset();
  }

  @Override
  public synchronized void writeData(byte[] data) throws IOException {
    if (!open) {
      throw new IOException("BLE connection not open");
    }
    logger.info("BLE Outbound -> {}", bytesToHex(data));
    if (data != null) {
      sentBuffer.write(data, 0, data.length);
    }
    if (mockMode || bridgeWriter == null) {
      return;
    }
    String hex = bytesToHex(data);
    bridgeWriter.write("HEX:" + hex + "\n");
    bridgeWriter.flush();
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
    if (data == null) return;
    logger.info("BLE Connection RX <- {}", bytesToHex(data));
    for (ConnectionDataListener listener : listeners) {
      listener.onDataReceived(data);
    }
  }

  private static List<String> runNativeBleScan() {
    if (isMac()) {
      return BleConnectionMac.scan();
    } else if (isWindows()) {
      return BleConnectionWindows.scan();
    } else if (isLinux()) {
      return BleConnectionLinux.scan();
    }
    return new ArrayList<>(mockDiscoveredDevices);
  }

  private static String bytesToHex(byte[] bytes) {
    if (bytes == null) return "";
    StringBuilder sb = new StringBuilder();
    for (byte b : bytes) {
      sb.append(String.format("%02X ", b));
    }
    return sb.toString().trim();
  }

  private static byte[] hexToBytes(String hex) {
    if (hex == null || hex.trim().isEmpty()) return new byte[0];
    String cleanHex = hex.replace(" ", "");
    int len = cleanHex.length();
    byte[] data = new byte[len / 2];
    for (int i = 0; i < len; i += 2) {
      data[i / 2] =
          (byte)
              ((Character.digit(cleanHex.charAt(i), 16) << 4)
                  + Character.digit(cleanHex.charAt(i + 1), 16));
    }
    return data;
  }
}
