package com.antigravity.resource;

import com.antigravity.auth.Role;
import com.antigravity.race.ClientSubscriptionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Singleton manager that controls access to the TrackResourceLock. */
public class TrackResourceManager {

  private static final Logger logger = LoggerFactory.getLogger(TrackResourceManager.class);
  private static TrackResourceManager instance;

  private final TrackResourceLock currentLock;

  private TrackResourceManager() {
    this.currentLock = new TrackResourceLock();
  }

  public static synchronized TrackResourceManager getInstance() {
    if (instance == null) {
      instance = new TrackResourceManager();
    }
    return instance;
  }

  public synchronized TrackResourceLock.LockState getCurrentState() {
    return currentLock.getState();
  }

  /**
   * Attempts to acquire the lock for a specific state.
   *
   * @param newState The desired state (e.g. RACE_RUNNING)
   * @param userRole The role of the user attempting to acquire the lock
   * @param userId An identifier for the user (IP, session, or username)
   * @return true if granted, false if denied due to another user holding the lock
   */
  public synchronized boolean requestLock(
      TrackResourceLock.LockState newState, Role userRole, String userId) {
    if (currentLock.getState() == TrackResourceLock.LockState.IDLE) {
      currentLock.setLock(newState, userRole, userId);
      logger.info("Lock granted for {} to user {} ({})", newState, userId, userRole);
      broadcastLockState();
      return true;
    }

    // Already locked. Check if the requester is the same user
    if (currentLock.getOwnerId() != null && currentLock.getOwnerId().equals(userId)) {
      if (currentLock.getState() != newState) {
        logger.info(
            "User {} changing lock state from {} to {}", userId, currentLock.getState(), newState);
        currentLock.setLock(newState, userRole, userId);
        broadcastLockState();
      }
      return true;
    }

    // Different user. Admins can preempt.
    if (userRole == Role.ADMIN) {
      logger.warn("ADMIN {} is preempting the lock held by {}", userId, currentLock.getOwnerId());

      // Stop the current race if one is running, to safely release hardware
      if (currentLock.getState() == TrackResourceLock.LockState.RACE_RUNNING) {
        if (ClientSubscriptionManager.getInstance().getRace() != null) {
          ClientSubscriptionManager.getInstance().getRace().stop();
        }
      }

      currentLock.setLock(newState, userRole, userId);
      broadcastLockState();
      return true;
    }

    logger.warn(
        "User {} ({}) denied lock. Currently locked by {}",
        userId,
        userRole,
        currentLock.getOwnerId());
    return false;
  }

  /** Releases the lock if the requester owns it, or if the requester is an ADMIN. */
  public synchronized boolean releaseLock(Role userRole, String userId) {
    if (currentLock.getState() == TrackResourceLock.LockState.IDLE) {
      return true;
    }

    if (userRole == Role.ADMIN
        || (currentLock.getOwnerId() != null && currentLock.getOwnerId().equals(userId))) {
      logger.info("Lock released by {} ({})", userId, userRole);
      currentLock.clear();
      broadcastLockState();
      return true;
    }

    logger.warn(
        "User {} ({}) cannot release lock owned by {}", userId, userRole, currentLock.getOwnerId());
    return false;
  }

  /**
   * Forces a release of the lock. Should only be called internally on system shutdown or cleanup.
   */
  public synchronized void forceRelease() {
    if (currentLock.getState() != TrackResourceLock.LockState.IDLE) {
      logger.info("Forcing lock release");
      currentLock.clear();
      broadcastLockState();
    }
  }

  private void broadcastLockState() {
    // Send a message over WebSockets to inform clients about the new state
    // We will implement this in ClientSubscriptionManager.
    String ownerId = currentLock.getOwnerId() == null ? "" : currentLock.getOwnerId();
    ClientSubscriptionManager.getInstance()
        .broadcastSystemState(currentLock.getState().name(), ownerId);
  }
}
