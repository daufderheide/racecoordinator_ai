package com.antigravity.protocols.interfaces;

import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SerialConnection implements ISerialConnection {

  private static final Logger logger = LoggerFactory.getLogger(SerialConnection.class);
  private volatile SerialPort serialPort;
  private volatile OutputStream outputStream;
  private volatile String portName;

  public static List<String> getAvailableSerialPorts() {
    try {
      SerialPort[] ports = SerialPort.getCommPorts();
      List<String> portNames = new ArrayList<>();
      if (ports != null) {
        for (SerialPort port : ports) {
          portNames.add(port.getSystemPortName());
        }
      }
      return portNames;
    } catch (LinkageError | Exception e) {
      logger.warn(
          "Failed to retrieve available serial ports due to native linkage or driver error: {}",
          e.getMessage());
      return Collections.emptyList();
    }
  }

  public void connect(String portName) throws IOException {
    connect(portName, 115200, true);
  }

  public void connect(String portName, int baudRate) throws IOException {
    connect(portName, baudRate, true);
  }

  public synchronized void connect(String portName, int baudRate, boolean setDtrRts)
      throws IOException {
    if (serialPort != null && serialPort.isOpen()) {
      return;
    }

    SerialPort[] ports;
    try {
      ports = SerialPort.getCommPorts();
    } catch (LinkageError e) {
      throw new IOException(
          "Failed to enumerate serial ports due to native library error: " + e.getMessage(), e);
    }
    if (ports != null) {
      for (SerialPort port : ports) {
        if (port.getSystemPortName().equalsIgnoreCase(portName)
            || port.getSystemPortPath().equalsIgnoreCase(portName)) {
          serialPort = port;
          this.portName = portName;
          break;
        }
      }
    }

    if (serialPort == null) {
      throw new IOException("Port not found: " + portName);
    }

    // Note: Except for the baud rate, all other parameters should be default
    serialPort.setComPortParameters(baudRate, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);

    if (setDtrRts) {
      if (serialPort.setDTR()) {
        if (!serialPort.setRTS()) {
          logger.warn("Failed to set RTS");
        }
      } else {
        logger.warn("Failed to set DTR");
      }
    } else {
      serialPort.clearDTR();
      serialPort.clearRTS();
    }

    if (serialPort.openPort()) {
      // Default timeouts: 100ms read timeout, 500ms write timeout
      serialPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 100, 500);
      outputStream = serialPort.getOutputStream();
    } else {
      throw new IOException("Failed to open port: " + portName);
    }
  }

  public synchronized void disconnect() {
    if (serialPort != null) {
      try {
        serialPort.removeDataListener();
      } catch (Exception ignored) {
      }
      if (serialPort.isOpen()) {
        serialPort.closePort();
      }
    }
    serialPort = null;
    outputStream = null;
  }

  public synchronized void writeData(byte[] data) throws IOException {
    logger.debug("Sending: {}", bytesToHex(data));
    if (outputStream == null) {
      throw new IOException("Port not open");
    }
    long startNs = System.nanoTime();
    outputStream.write(data);
    outputStream.flush();
    long elapsedNs = System.nanoTime() - startNs;
    if (elapsedNs > 25_000_000L) {
      logger.warn(
          "[PERF] Serial writeData on {} ({} bytes) took {} ms",
          portName,
          data.length,
          elapsedNs / 1_000_000L);
    }
  }

  public void writeData(String data) throws IOException {
    writeData(data.getBytes(StandardCharsets.UTF_8));
  }

  public void addListener(SerialPortDataListener listener) {
    if (serialPort != null) {
      try {
        serialPort.removeDataListener();
      } catch (Exception ignored) {
      }
      serialPort.addDataListener(
          new SerialPortDataListener() {
            @Override
            public int getListeningEvents() {
              return listener.getListeningEvents();
            }

            @Override
            public void serialEvent(com.fazecast.jSerialComm.SerialPortEvent event) {
              if (!isOpen()) {
                return;
              }
              if (event.getEventType()
                  == com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_RECEIVED) {
                byte[] data = event.getReceivedData();
                if (data != null && data.length > 0) {
                  logger.trace("[{}] Received: {}", portName, bytesToHex(data));
                }
              }
              listener.serialEvent(event);
            }
          });
    }
  }

  @Override
  public void addDataListener(ConnectionDataListener listener) {
    if (listener != null) {
      addListener(
          new SerialPortDataListener() {
            @Override
            public int getListeningEvents() {
              return SerialPort.LISTENING_EVENT_DATA_RECEIVED;
            }

            @Override
            public void serialEvent(com.fazecast.jSerialComm.SerialPortEvent event) {
              if (event.getEventType() == SerialPort.LISTENING_EVENT_DATA_RECEIVED) {
                byte[] data = event.getReceivedData();
                if (data != null && data.length > 0) {
                  listener.onDataReceived(data);
                }
              }
            }
          });
    }
  }

  public synchronized boolean isOpen() {
    return serialPort != null && serialPort.isOpen();
  }

  // Static helper to list ports
  public static String[] getPortNames() {
    try {
      SerialPort[] ports = SerialPort.getCommPorts();
      if (ports == null) {
        return new String[0];
      }
      String[] names = new String[ports.length];
      for (int i = 0; i < ports.length; i++) {
        names[i] = ports[i].getSystemPortName();
      }
      return names;
    } catch (LinkageError | Exception e) {
      logger.warn(
          "Failed to retrieve port names due to native linkage or driver error: {}",
          e.getMessage());
      return new String[0];
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
