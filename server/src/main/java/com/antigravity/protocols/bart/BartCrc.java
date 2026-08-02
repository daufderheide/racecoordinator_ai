package com.antigravity.protocols.bart;

public class BartCrc {

  public static byte crc8Update(byte crc, byte b) {
    int c = crc & 0xFF;
    c ^= (b & 0xFF);
    for (int i = 0; i < 8; i++) {
      if ((c & 0x80) != 0) {
        c = ((c << 1) ^ 0x07) & 0xFF;
      } else {
        c = (c << 1) & 0xFF;
      }
    }
    return (byte) c;
  }

  public static byte calculateCrc(byte[] data, int offset, int length) {
    byte crc = 0;
    for (int i = offset; i < offset + length; i++) {
      crc = crc8Update(crc, data[i]);
    }
    return crc;
  }

  public static byte calculateCrc(byte[] data) {
    return calculateCrc(data, 0, data.length);
  }
}
