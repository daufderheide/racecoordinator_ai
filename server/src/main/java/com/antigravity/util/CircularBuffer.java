package com.antigravity.util;

import java.nio.BufferOverflowException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** A thread-safe circular buffer for bytes. */
public class CircularBuffer {

  private static final Logger logger = LoggerFactory.getLogger(CircularBuffer.class);

  private final byte[] buffer;
  private final int capacity;
  private int head; // Read position
  private int tail; // Write position
  private int count; // Current number of elements

  public CircularBuffer(int capacity) {
    if (capacity <= 0) {
      throw new IllegalArgumentException("Capacity must be positive");
    }
    this.capacity = capacity;
    this.buffer = new byte[capacity];
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  /**
   * Adds a byte to the buffer.
   *
   * @param b the byte to add
   * @return true if added, false if buffer is full
   */
  public synchronized boolean add(byte b) {
    if (count == capacity) {
      return false;
    }
    buffer[tail] = b;
    tail = (tail + 1) % capacity;
    count++;
    return true;
  }

  /**
   * Retrieves and removes the next byte from the buffer.
   *
   * @return the next byte
   * @throws IllegalStateException if buffer is empty
   */
  public synchronized byte get() {
    if (count == 0) {
      throw new IllegalStateException("Buffer is empty");
    }
    byte b = buffer[head];
    head = (head + 1) % capacity;
    count--;
    return b;
  }

  /** Returns the number of bytes currently in the buffer. */
  public synchronized int size() {
    return count;
  }

  /** Returns the total capacity of the buffer. */
  public synchronized int capacity() {
    return capacity;
  }

  /** Returns true if the buffer is empty. */
  public synchronized boolean isEmpty() {
    return count == 0;
  }

  /** Returns true if the buffer is full. */
  public synchronized boolean isFull() {
    return count == capacity;
  }

  /** Clears the buffer. */
  public synchronized void clear() {
    head = 0;
    tail = 0;
    count = 0;
  }

  /**
   * Writes an array of bytes to the buffer. Throws an exception if the buffer becomes full.
   *
   * @param data the data to write
   * @return the number of bytes actually written
   */
  public synchronized int write(byte[] data) {
    if (capacity - count < data.length) {
      throw new BufferOverflowException();
    }
    int written = 0;
    for (byte b : data) {
      buffer[tail] = b;
      tail = (tail + 1) % capacity;
      count++;
      written++;
    }
    if (logger.isDebugEnabled()) {
      StringBuilder newBytes = new StringBuilder();
      for (byte b : data) {
        newBytes.append(String.format("%02X ", b));
      }
      logger.debug("Wrote bytes: {}. Full buffer: {}", newBytes.toString().trim(), toHexString());
    }
    return written;
  }

  /**
   * Reads up to 'length' bytes from the buffer.
   *
   * @param length maximum number of bytes to read
   * @return array containing the bytes read
   */
  public synchronized byte[] read(int length) {
    int actualLen = Math.min(length, count);
    byte[] result = new byte[actualLen];
    for (int i = 0; i < actualLen; i++) {
      result[i] = buffer[head];
      head = (head + 1) % capacity;
      count--;
    }
    if (logger.isDebugEnabled()) {
      StringBuilder readBytes = new StringBuilder();
      for (byte b : result) {
        readBytes.append(String.format("%02X ", b));
      }
      logger.debug("Read bytes: {}. Full buffer: {}", readBytes.toString().trim(), toHexString());
    }
    return result;
  }

  /**
   * Peeks at a byte at the given offset from the head without removing it.
   *
   * @param offset the offset from the head (0 is the next byte to read)
   * @return the byte at the given offset
   * @throws IndexOutOfBoundsException if offset is invalid
   */
  public synchronized byte peek(int offset) {
    if (offset < 0 || offset >= count) {
      throw new IndexOutOfBoundsException("Offset out of bounds: " + offset);
    }
    return buffer[(head + offset) % capacity];
  }

  /**
   * Returns a hex string representation of the current contents of the buffer.
   *
   * @return hex string
   */
  public synchronized String toHexString() {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < count; i++) {
      byte b = buffer[(head + i) % capacity];
      sb.append(String.format("%02X ", b));
    }
    return sb.toString().trim();
  }
}
