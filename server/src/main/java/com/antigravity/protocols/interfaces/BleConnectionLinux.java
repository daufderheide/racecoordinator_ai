package com.antigravity.protocols.interfaces;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BleConnectionLinux {

  private static final Logger logger = LoggerFactory.getLogger(BleConnectionLinux.class);

  public static List<String> scan() {
    String scriptPath = getBleBridgeScriptPath();
    if (scriptPath == null) {
      logger.warn("Linux ble_bridge_linux.py script not found");
      return new ArrayList<>();
    }
    List<String> list = new ArrayList<>();
    try {
      ProcessBuilder pb = new ProcessBuilder("python3", scriptPath, "scan", "2.0");
      Process p = pb.start();
      try (BufferedReader reader =
          new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
        String line;
        while ((line = reader.readLine()) != null) {
          line = line.trim();
          if (line.startsWith("[") && line.endsWith("]")) {
            String content = line.substring(1, line.length() - 1).trim();
            if (!content.isEmpty()) {
              String[] parts = content.split(",");
              for (String part : parts) {
                String clean = part.trim().replaceAll("^\"|\"$", "");
                if (!clean.isEmpty() && !list.contains(clean)) {
                  list.add(clean);
                }
              }
            }
          }
        }
      }
      p.waitFor();
      return list;
    } catch (Exception e) {
      logger.error("Error executing Linux native BLE scan", e);
    }
    return list;
  }

  public static Process startBridgeProcess(String target) throws Exception {
    String scriptPath = getBleBridgeScriptPath();
    if (scriptPath == null) {
      throw new IllegalStateException("Linux ble_bridge_linux.py script not found");
    }
    ProcessBuilder pb = new ProcessBuilder("python3", scriptPath, "connect", target);
    return pb.start();
  }

  public static String getBleBridgeScriptPath() {
    File f1 = new File("server/src/main/resources/ble_bridge_linux.py");
    if (f1.exists()) return f1.getAbsolutePath();
    File f2 = new File("src/main/resources/ble_bridge_linux.py");
    if (f2.exists()) return f2.getAbsolutePath();
    URL resource = BleConnectionLinux.class.getResource("/ble_bridge_linux.py");
    if (resource != null) {
      return resource.getPath();
    }
    return null;
  }
}
