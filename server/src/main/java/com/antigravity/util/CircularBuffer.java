package com.antigravity.util;

/**
 * A thread-safe circular buffer for bytes.
 */
public class CircularBuffer {

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

  /**
   * Returns the number of bytes currently in the buffer.
   */
  public synchronized int size() {
    return count;
  }

  /**
   * Returns the total capacity of the buffer.
   */
  public synchronized int capacity() {
    return capacity;
  }

  /**
   * Returns true if the buffer is empty.
   */
  public synchronized boolean isEmpty() {
    return count == 0;
  }

  /**
   * Returns true if the buffer is full.
   */
  public synchronized boolean isFull() {
    return count == capacity;
  }

  /**
   * Clears the buffer.
   */
  public synchronized void clear() {
    head = 0;
    tail = 0;
    count = 0;
  }

  /**
   * Writes an array of bytes to the buffer.
   * Throws an exception if the buffer becomes full.
   * 
   * @param data the data to write
   * @return the number of bytes actually written
   */
  public synchronized int write(byte[] data) {
    if (capacity - count < data.length) {
      throw new java.nio.BufferOverflowException();
    }
    int written = 0;
    for (byte b : data) {
      buffer[tail] = b;
      tail = (tail + 1) % capacity;
      count++;
      written++;
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
}
