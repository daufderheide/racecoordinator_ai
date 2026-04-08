package com.antigravity.util;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

/**
 * Utility class for network-related operations.
 */
public class NetworkUtils {

  /**
   * Checks if the given remote address is a local address (localhost or same LAN).
   * This includes loopback addresses (127.0.0.1, ::1) and private network addresses
   * (RFC 1918: 192.168.x.x, 10.x.x.x, 172.16-31.x.x).
   *
   * @param remoteAddr the remote IP address
   * @param remoteHost the remote hostname
   * @return true if the address is considered local
   */
  public static boolean isLocalAddress(String remoteAddr, String remoteHost) {
    return isLocalhost(remoteAddr, remoteHost) || isLocalNetwork(remoteAddr);
  }

  /**
   * Checks if the given remote address is localhost (same PC).
   * This includes loopback addresses (127.0.0.1, ::1) and localhost hostname.
   *
   * @param remoteAddr the remote IP address
   * @param remoteHost the remote hostname
   * @return true if the address is localhost (same machine)
   */
  public static boolean isLocalhost(String remoteAddr, String remoteHost) {
    try {
      // Check for all common localhost IP and hostname variations
      if ("127.0.0.1".equals(remoteAddr) ||
          "0:0:0:0:0:0:0:1".equals(remoteAddr) ||
          "::1".equals(remoteAddr) ||
          "localhost".equals(remoteAddr) ||
          "localhost".equals(remoteHost) ||
          "127.0.0.1".equals(remoteHost) ||
          "::1".equals(remoteHost) ||
          "0:0:0:0:0:0:0:1".equals(remoteHost) ||
          "::ffff:127.0.0.1".equals(remoteAddr) ||
          "0.0.0.0".equals(remoteAddr)) {
        return true;
      }

      InetAddress addr = InetAddress.getByName(remoteAddr);
      return addr.isLoopbackAddress();
    } catch (Exception e) {
      // Fallback to simple string check
    }

    return "127.0.0.1".equals(remoteAddr) || "::1".equals(remoteAddr) || "localhost".equals(remoteAddr);
  }

  /**
   * Checks if the given remote address is on the local network (same LAN, different machine).
   * This includes private network addresses (RFC 1918: 192.168.x.x, 10.x.x.x, 172.16-31.x.x).
   * Excludes localhost/loopback addresses.
   *
   * @param remoteAddr the remote IP address
   * @return true if the address is on the same LAN but not localhost
   */
  public static boolean isLocalNetwork(String remoteAddr) {
    try {
      // First check it's not localhost
      if (isLocalhost(remoteAddr, null)) {
        return false;
      }

      InetAddress addr = InetAddress.getByName(remoteAddr);

      // Check if the address is a private/LAN address (RFC 1918)
      if (addr.isSiteLocalAddress()) {
        return true;
      }

      // Verify if the remote address matches any address on the local network interfaces
      Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
      while (interfaces.hasMoreElements()) {
        Enumeration<InetAddress> addresses = interfaces.nextElement().getInetAddresses();
        while (addresses.hasMoreElements()) {
          if (addresses.nextElement().getHostAddress().equals(remoteAddr)) {
            return true;
          }
        }
      }
    } catch (Exception e) {
      // If hostname resolution fails, return false
    }

    return false;
  }

  /**
   * Checks if the given remote address is a local address (localhost or same LAN).
   * Convenience method that only takes the IP address.
   *
   * @param remoteAddr the remote IP address
   * @return true if the address is considered local
   */
  public static boolean isLocalAddress(String remoteAddr) {
    return isLocalAddress(remoteAddr, null);
  }
}
