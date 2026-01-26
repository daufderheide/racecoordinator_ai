package com.antigravity.protocols.interfaces;

import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class SerialConnection {
  private SerialPort serialPort;
  private OutputStream outputStream;

  public static List<String> getAvailableSerialPorts() {
    SerialPort[] ports = SerialPort.getCommPorts();
    List<String> portNames = new ArrayList<>();
    for (SerialPort port : ports) {
      portNames.add(port.getSystemPortName());
    }
    return portNames;
  }

  public void connect(String portName) throws IOException {
    connect(portName, 9600);
  }

  public void connect(String portName, int baudRate) throws IOException {
    if (serialPort != null && serialPort.isOpen()) {
      return;
    }

    SerialPort[] ports = SerialPort.getCommPorts();
    for (SerialPort port : ports) {
      if (port.getSystemPortName().equals(portName)) {
        serialPort = port;
        break;
      }
    }

    if (serialPort == null) {
      throw new IOException("Port not found: " + portName);
    }

    // Note: Except for the baud rate, all other parameters should be default
    serialPort.setComPortParameters(baudRate, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);

    if (serialPort.setDTR()) {
      if (!serialPort.setRTS()) {
        // TODO(aufderheide): Log the failure
      }
    } else {
      // TODO(aufderheide): Log the failure
    }

    if (serialPort.openPort()) {
      // Default timeouts
      serialPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 100, 0);
      outputStream = serialPort.getOutputStream();
    } else {
      throw new IOException("Failed to open port: " + portName);
    }
  }

  public void disconnect() {
    if (serialPort != null && serialPort.isOpen()) {
      serialPort.closePort();
    }
    serialPort = null;
    outputStream = null;
  }

  public void writeData(byte[] data) throws IOException {
    if (outputStream == null) {
      throw new IOException("Port not open");
    }
    outputStream.write(data);
    outputStream.flush();
  }

  public void writeData(String data) throws IOException {
    writeData(data.getBytes(StandardCharsets.UTF_8));
  }

  public void addListener(SerialPortDataListener listener) {
    if (serialPort != null) {
      serialPort.addDataListener(listener);
    }
  }

  public boolean isOpen() {
    return serialPort != null && serialPort.isOpen();
  }

  // Static helper to list ports
  public static String[] getPortNames() {
    SerialPort[] ports = SerialPort.getCommPorts();
    String[] names = new String[ports.length];
    for (int i = 0; i < ports.length; i++) {
      names[i] = ports[i].getSystemPortName();
    }
    return names;
  }
}
