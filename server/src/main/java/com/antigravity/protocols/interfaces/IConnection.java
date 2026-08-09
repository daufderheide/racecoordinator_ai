package com.antigravity.protocols.interfaces;

import java.io.IOException;

public interface IConnection {
  void connect(String target) throws IOException;

  void disconnect();

  void writeData(byte[] data) throws IOException;

  void writeData(String data) throws IOException;

  boolean isOpen();

  void addDataListener(ConnectionDataListener listener);
}
