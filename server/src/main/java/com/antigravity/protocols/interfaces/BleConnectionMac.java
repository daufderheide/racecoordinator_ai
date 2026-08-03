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

public class BleConnectionMac {

  private static final Logger logger = LoggerFactory.getLogger(BleConnectionMac.class);

  public static List<String> scan() {
    String scriptPath = getBleBridgeScriptPath();
    if (scriptPath == null) {
      logger.warn("macOS ble_bridge script/binary not found");
      return new ArrayList<>();
    }
    List<String> list = new ArrayList<>();
    try {
      ProcessBuilder pb;
      File scriptFile = new File(scriptPath);
      File compiledBinary = new File(scriptFile.getParentFile(), "ble_bridge");
      if (compiledBinary.exists() && compiledBinary.canExecute()) {
        pb = new ProcessBuilder(compiledBinary.getAbsolutePath(), "scan", "2.5");
      } else {
        pb = new ProcessBuilder("swift", scriptPath, "scan", "2.5");
      }
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
      logger.error("Error executing macOS native BLE scan", e);
    }
    return list;
  }

  public static Process startBridgeProcess(String target) throws Exception {
    String scriptPath = getBleBridgeScriptPath();
    if (scriptPath == null) {
      throw new IllegalStateException("macOS ble_bridge script/binary not found");
    }
    File scriptFile = new File(scriptPath);
    File compiledBinary = new File(scriptFile.getParentFile(), "ble_bridge");
    ProcessBuilder pb;
    if (compiledBinary.exists() && compiledBinary.canExecute()) {
      pb = new ProcessBuilder(compiledBinary.getAbsolutePath(), "connect", target);
    } else {
      pb = new ProcessBuilder("swift", scriptPath, "connect", target);
    }
    return pb.start();
  }

  public static String getBleBridgeScriptPath() {
    File f1 = new File("server/src/main/resources/ble_bridge.swift");
    if (f1.exists()) return f1.getAbsolutePath();
    File f2 = new File("src/main/resources/ble_bridge.swift");
    if (f2.exists()) return f2.getAbsolutePath();
    URL resource = BleConnectionMac.class.getResource("/ble_bridge.swift");
    if (resource != null) {
      return resource.getPath();
    }
    return null;
  }
}
