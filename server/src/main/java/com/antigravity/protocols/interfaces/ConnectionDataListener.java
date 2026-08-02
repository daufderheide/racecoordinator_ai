package com.antigravity.protocols.interfaces;

@FunctionalInterface
public interface ConnectionDataListener {
  void onDataReceived(byte[] data);
}
