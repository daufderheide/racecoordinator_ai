package com.antigravity.protocols;

import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import java.io.IOException;
import java.util.concurrent.ScheduledExecutorService;

public abstract class AbstractSerialProtocol extends DefaultProtocol {

  protected SerialConnection serialConnection;

  public AbstractSerialProtocol(
      int numLanes, SerialConnection serialConnection, ScheduledExecutorService statusScheduler) {
    super(numLanes);
    this.serialConnection = serialConnection != null ? serialConnection : new SerialConnection();
    this.statusScheduler = statusScheduler;
  }

  protected abstract String getCommPort();

  protected abstract int getBaudRate();

  protected abstract void onPortConnected();

  protected abstract void processData();

  protected abstract void sendTimeReset();

  protected boolean requiresDtrRts() {
    return true;
  }

  @Override
  public synchronized boolean open() {
    if (serialConnection.isOpen()) {
      logger.info("SerialProtocol already open");
      return true;
    }

    String commPort = getCommPort();
    if (commPort == null || commPort.isEmpty()) {
      logger.info("No COM port specified for SerialProtocol, status will be DISCONNECTED");
      if (listener != null) {
        listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, getInterfaceIndex());
      }
      startStatusScheduler();
      return true;
    }

    try {
      int baudRateToUse = getBaudRate();
      logger.info("Attempting to connect to {} at {} baud", commPort, baudRateToUse);
      serialConnection.connect(commPort, baudRateToUse, requiresDtrRts());

      serialConnection.addListener(
          new SerialPortDataListener() {
            @Override
            public int getListeningEvents() {
              return SerialPort.LISTENING_EVENT_DATA_RECEIVED;
            }

            @Override
            public void serialEvent(SerialPortEvent event) {
              if (event.getEventType() != SerialPort.LISTENING_EVENT_DATA_RECEIVED) {
                return;
              }

              byte[] data = event.getReceivedData();
              if (data != null && data.length > 0) {
                // logger.debug("Received: {} bytes", data.length);
                rxBuffer.write(data);
                processData();
              }
            }
          });

      onPortConnected();
      startStatusScheduler();

      return true;
    } catch (IOException e) {
      logger.error("Failed to connect to {}: {}", commPort, e.getMessage());
      if (listener != null) {
        listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, getInterfaceIndex());
      }
      return false;
    }
  }

  @Override
  public void close() {
    logger.info("Closing SerialProtocol (Serial Open: {})", isConnected());

    super.close(); // Stops status scheduler

    if (listener != null) {
      listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, getInterfaceIndex());
    }
    lastHeartbeatTimeMs = 0;

    if (serialConnection != null && serialConnection.isOpen()) {
      logger.info("Disconnecting serial port");
      serialConnection.disconnect();
    }
  }

  @Override
  public void startTimer() {
    super.startTimer();
    sendTimeReset();
  }

  @Override
  protected boolean isConnected() {
    return serialConnection != null && serialConnection.isOpen();
  }

  public int getMaxBufferSize() {
    return 128; // Default max buffer size, subclasses can override
  }

  public void writeData(byte[] message) {
    if (message == null || message.length == 0) {
      return;
    }

    int maxBuffer = getMaxBufferSize();
    if (message.length > maxBuffer) {
      logger.error(
          "Attempted to send message of size {} which exceeds buffer limit of {}",
          message.length,
          maxBuffer);
      return;
    }

    try {
      serialConnection.writeData(message);
    } catch (IOException e) {
      logger.error("Failed to write data to serial port: {}", e.getMessage());
    }
  }
}
