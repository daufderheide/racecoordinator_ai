package com.antigravity.mocks;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class MockScheduler implements ScheduledExecutorService {
  public Runnable command;
  public boolean shutdown = false;

  @Override
  public ScheduledFuture<?> scheduleAtFixedRate(Runnable command, long initialDelay, long period,
      TimeUnit unit) {
    this.command = command;
    return null; // For this test we don't strictly need the future yet
  }

  // Methods we don't need to implement for this test
  public ScheduledFuture<?> schedule(Runnable command, long delay, TimeUnit unit) {
    return null;
  }

  public <V> ScheduledFuture<V> schedule(Callable<V> callable, long delay, TimeUnit unit) {
    return null;
  }

  public ScheduledFuture<?> scheduleWithFixedDelay(Runnable command, long initialDelay, long delay, TimeUnit unit) {
    return null;
  }

  public void shutdown() {
    shutdown = true;
  }

  public List<Runnable> shutdownNow() {
    shutdown = true;
    return Collections.emptyList();
  }

  public boolean isShutdown() {
    return shutdown;
  }

  public boolean isTerminated() {
    return shutdown;
  }

  public boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException {
    return true;
  }

  public <T> Future<T> submit(Callable<T> task) {
    return null;
  }

  public <T> Future<T> submit(Runnable task, T result) {
    return null;
  }

  public Future<?> submit(Runnable task) {
    return null;
  }

  public <T> java.util.List<Future<T>> invokeAll(java.util.Collection<? extends Callable<T>> tasks)
      throws InterruptedException {
    return null;
  }

  public <T> java.util.List<Future<T>> invokeAll(java.util.Collection<? extends Callable<T>> tasks, long timeout,
      TimeUnit unit) throws InterruptedException {
    return null;
  }

  public <T> T invokeAny(java.util.Collection<? extends Callable<T>> tasks)
      throws java.util.concurrent.ExecutionException, InterruptedException {
    return null;
  }

  public <T> T invokeAny(java.util.Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit)
      throws java.util.concurrent.ExecutionException, InterruptedException {
    return null;
  }

  public void execute(Runnable command) {
  }

  public void tick() {
    if (command != null && !shutdown) {
      command.run();
    }
  }
}
