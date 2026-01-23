package com.antigravity.protocols.arduino;

import java.util.List;

import com.antigravity.models.Lane;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.antigravity.util.CircularBuffer;
import java.io.IOException;

public class ArduinoProtocol extends DefaultProtocol {
  private Config config;
  private List<Lane> lanes;

  private SerialConnection serialConnection;
  private CircularBuffer rxBuffer;

  public ArduinoProtocol(Config config, List<Lane> lanes) {
    super(lanes.size());
    this.config = config;
    this.lanes = lanes;

    serialConnection = new SerialConnection();
    rxBuffer = new CircularBuffer(4096);
  }

  @Override
  public boolean open() {
    try {
      serialConnection.connect(config.commPort, config.baudRate);

      serialConnection.addListener(new com.fazecast.jSerialComm.SerialPortDataListener() {
        @Override
        public int getListeningEvents() {
          return com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_AVAILABLE;
        }

        @Override
        public void serialEvent(com.fazecast.jSerialComm.SerialPortEvent event) {
          if (event.getEventType() != com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_AVAILABLE) {
            return;
          }

          byte[] data = event.getReceivedData();
          if (data != null && data.length > 0) {
            rxBuffer.write(data);
          }
        }
      });

      return true;
    } catch (IOException e) {
      return false;
    }
  }
}
