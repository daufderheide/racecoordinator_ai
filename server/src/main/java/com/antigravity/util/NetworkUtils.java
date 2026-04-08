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
    try {
      // Explicitly check for all common localhost IP and hostname variations
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
      if (addr.isLoopbackAddress()) {
        return true;
      }

      // Check if the address is a private/LAN address (RFC 1918)
      // This allows mobile devices on the same network to be treated as local
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
      // If hostname resolution fails, fallback to simple string check
    }

    return "127.0.0.1".equals(remoteAddr) || "::1".equals(remoteAddr) || "localhost".equals(remoteAddr);
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
