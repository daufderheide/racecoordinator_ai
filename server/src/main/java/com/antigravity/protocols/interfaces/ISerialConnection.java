package com.antigravity.protocols.interfaces;

import com.fazecast.jSerialComm.SerialPortDataListener;
import java.io.IOException;

public interface ISerialConnection {
  void connect(String portName) throws IOException;

  void connect(String portName, int baudRate) throws IOException;

  void connect(String portName, int baudRate, boolean setDtrRts) throws IOException;

  void disconnect();

  void writeData(byte[] data) throws IOException;

  void writeData(String data) throws IOException;

  void addListener(SerialPortDataListener listener);

  boolean isOpen();
}
