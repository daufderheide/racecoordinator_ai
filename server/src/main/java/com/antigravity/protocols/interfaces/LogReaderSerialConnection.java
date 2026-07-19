package com.antigravity.protocols.interfaces;

import com.antigravity.service.LogReplayService;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LogReaderSerialConnection implements ISerialConnection {

  private static final Logger logger = LoggerFactory.getLogger(LogReaderSerialConnection.class);

  private String portName;
  private final List<SerialPortDataListener> listeners = new ArrayList<>();
  private boolean isOpen = false;

  public LogReaderSerialConnection() {}

  @Override
  public void connect(String portName) throws IOException {
    connect(portName, 115200, true);
  }

  @Override
  public void connect(String portName, int baudRate) throws IOException {
    connect(portName, baudRate, true);
  }

  @Override
  public void connect(String portName, int baudRate, boolean setDtrRts) throws IOException {
    this.portName = portName;
    isOpen = true;
    logger.info("LogReaderSerialConnection opened for port {}", portName);

    LogReplayService service = LogReplayService.getInstance();
    if (service != null) {
      service.registerSerialConnection(this);
    }
  }

  @Override
  public void disconnect() {
    isOpen = false;
    listeners.clear();
    logger.info("LogReaderSerialConnection disconnected for port {}", portName);

    LogReplayService service = LogReplayService.getInstance();
    if (service != null) {
      service.unregisterSerialConnection(this);
    }
  }

  @Override
  public void writeData(byte[] data) throws IOException {
    // We do not actually write anything to physical hardware in replay mode.
    // We could log this if needed, but it's typically already logged by the caller.
  }

  @Override
  public void writeData(String data) throws IOException {
    writeData(data.getBytes());
  }

  @Override
  public void addListener(SerialPortDataListener listener) {
    listeners.add(listener);
  }

  @Override
  public boolean isOpen() {
    return isOpen;
  }

  public String getPortName() {
    return portName;
  }

  /** Called by the generic log reader service to inject bytes into the mock connection. */
  public void injectReceivedData(byte[] data) {
    if (!isOpen) {
      return;
    }

    // Create a mock SerialPortEvent. We only need it to return getReceivedData()
    // Unfortunately, SerialPortEvent constructor requires a SerialPort object.
    // In jSerialComm, SerialPortEvent is public but doesn't easily let us set receivedData
    // unless we construct it properly or use a subclass/mock if possible.
    // Wait, let's see how we can construct a SerialPortEvent with data.

    // As a workaround, we can create a dummy SerialPort object for the event,
    // though the protocols mostly just call event.getReceivedData().

    // Let's create a standard SerialPortEvent object
    SerialPort dummyPort = null;
    try {
      java.lang.reflect.Constructor<SerialPort> constructor =
          SerialPort.class.getDeclaredConstructor();
      constructor.setAccessible(true);
      dummyPort = constructor.newInstance();
    } catch (Exception e) {
      SerialPort[] ports = SerialPort.getCommPorts();
      if (ports.length > 0) {
        dummyPort = ports[0];
      }
    }

    if (dummyPort == null) {
      logger.error("Could not create dummy SerialPort for LogReaderSerialConnection mock event.");
      return; // Cannot proceed without a valid source for the event
    }

    SerialPortEvent mockEvent =
        new SerialPortEvent(dummyPort, SerialPort.LISTENING_EVENT_DATA_RECEIVED, data);

    for (SerialPortDataListener listener : listeners) {
      listener.serialEvent(mockEvent);
    }
  }
}
