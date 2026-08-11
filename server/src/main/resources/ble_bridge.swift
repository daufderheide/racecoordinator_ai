import Foundation
import CoreBluetooth

// CoreBluetooth BLE Helper for Race Coordinator AI
// Modes:
//   swift ble_bridge.swift scan [timeoutSec]
//   swift ble_bridge.swift connect <deviceNameOrUUID>

class BleBridge: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    enum Mode {
        case scan(timeout: Double)
        case connect(target: String)
    }

    let mode: Mode
    var centralManager: CBCentralManager!
    var targetPeripheral: CBPeripheral?
    var txCharacteristic: CBCharacteristic?
    var rxCharacteristic: CBCharacteristic?
    var discoveredNames = Set<String>()
    var isConnected = false
    var scanStarted = false

    init(mode: Mode) {
        self.mode = mode
        super.init()
        self.centralManager = CBCentralManager(delegate: self, queue: nil)
    }

    func start() {
        // Run loop handles delegate callbacks
    }

    // MARK: - CBCentralManagerDelegate
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        fputs("BLE_STATE: \(central.state.rawValue)\n", stderr)
        fflush(stderr)
        switch central.state {
        case .poweredOn:
            guard !scanStarted else { return }
            scanStarted = true
            switch mode {
            case .scan(let timeout):
                centralManager.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
                DispatchQueue.main.asyncAfter(deadline: .now() + timeout) {
                    self.centralManager.stopScan()
                    let list = Array(self.discoveredNames)
                    if let data = try? JSONSerialization.data(withJSONObject: list),
                       let jsonStr = String(data: data, encoding: .utf8) {
                        print(jsonStr)
                    } else {
                        print("[]")
                    }
                    fflush(stdout)
                    exit(0)
                }

            case .connect(let target):
                fputs("STATUS: Checking system connected BLE peripherals for '\(target)'...\n", stderr)
                let serviceUUIDs = [
                    CBUUID(string: "1800"), CBUUID(string: "1801"), CBUUID(string: "180A"),
                    CBUUID(string: "180F"), CBUUID(string: "FFE0"), CBUUID(string: "FFF0"),
                    CBUUID(string: "A500"), CBUUID(string: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E")
                ]
                let connectedList = centralManager.retrieveConnectedPeripherals(withServices: serviceUUIDs)
                for peripheral in connectedList {
                    let identifierStr = peripheral.identifier.uuidString
                    let pName = peripheral.name ?? ""
                    if pName.equalsIgnoreCase(target) || identifierStr.equalsIgnoreCase(target) || pName.localizedCaseInsensitiveContains(target) {
                        fputs("STATUS: Found target BLE peripheral '\(pName)' (\(identifierStr)) in connected system peripherals. Connecting...\n", stderr)
                        targetPeripheral = peripheral
                        peripheral.delegate = self
                        centralManager.connect(peripheral, options: nil)
                        return
                    }
                }
                fputs("STATUS: Scanning for BLE peripheral matching '\(target)'...\n", stderr)
                centralManager.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
            }

        case .unknown, .resetting:
            // Wait for state transition to poweredOn
            break

        case .poweredOff, .unauthorized, .unsupported:
            if case .scan = mode {
                print("[]")
                fflush(stdout)
                exit(0)
            } else {
                fputs("ERROR: Bluetooth unavailable (state: \(central.state.rawValue))\n", stderr)
                exit(1)
            }
        @unknown default:
            break
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        let pName = peripheral.name
        let localName = advertisementData[CBAdvertisementDataLocalNameKey] as? String
        let name = pName ?? localName

        if case .scan = mode {
            if let n = pName, !n.isEmpty {
                discoveredNames.insert(n)
            }
            if let l = localName, !l.isEmpty {
                discoveredNames.insert(l)
            }
            return
        }

        if case .connect(let target) = mode {
            let identifierStr = peripheral.identifier.uuidString
            let pName = name ?? ""
            if pName.equalsIgnoreCase(target) || identifierStr.equalsIgnoreCase(target) || pName.localizedCaseInsensitiveContains(target) {
                fputs("STATUS: Found target BLE peripheral '\(pName)' (\(identifierStr)). Connecting...\n", stderr)
                centralManager.stopScan()
                targetPeripheral = peripheral
                peripheral.delegate = self
                centralManager.connect(peripheral, options: nil)
            }
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        fputs("STATUS: CoreBluetooth connected to peripheral. Discovering services...\n", stderr)
        peripheral.discoverServices(nil)
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        print("DISCONNECTED")
        fputs("ERROR: Failed to connect to peripheral: \(error?.localizedDescription ?? "Unknown")\n", stderr)
        exit(1)
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        print("DISCONNECTED")
        fputs("STATUS: Peripheral disconnected.\n", stderr)
        exit(0)
    }

    // MARK: - CBPeripheralDelegate
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil, let services = peripheral.services, !services.isEmpty else {
            fputs("ERROR: Failed to discover services: \(error?.localizedDescription ?? "None found")\n", stderr)
            disconnectAndExit()
            return
        }

        for service in services {
            peripheral.discoverCharacteristics(nil, for: service)
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard error == nil, let characteristics = service.characteristics else {
            return
        }

        for char in characteristics {
            let props = char.properties

            if props.contains(.notify) || props.contains(.indicate) {
                rxCharacteristic = char
                peripheral.setNotifyValue(true, for: char)
            }

            if props.contains(.write) || props.contains(.writeWithoutResponse) {
                txCharacteristic = char
            }

            if txCharacteristic == nil && (props.contains(.write) || props.contains(.writeWithoutResponse)) {
                txCharacteristic = char
            }
        }

        if !isConnected && (rxCharacteristic != nil || txCharacteristic != nil) {
            isConnected = true
            print("CONNECTED")
            fflush(stdout)
            startStdinListener()
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard error == nil, let data = characteristic.value, !data.isEmpty else {
            return
        }
        let hexString = data.map { String(format: "%02X", $0) }.joined(separator: " ")
        print("RX:\(hexString)")
        fflush(stdout)
    }

    // MARK: - Stdin Listener
    func startStdinListener() {
        DispatchQueue.global(qos: .userInitiated).async {
            while let line = readLine() {
                let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                if trimmed.hasPrefix("HEX:") {
                    let hexStr = trimmed.dropFirst(4)
                    let bytes = self.hexToBytes(String(hexStr))
                    if !bytes.isEmpty {
                        self.sendData(Data(bytes))
                    }
                } else if trimmed == "DISCONNECT" || trimmed == "QUIT" {
                    self.disconnectAndExit()
                    break
                }
            }
        }
    }

    func sendData(_ data: Data) {
        guard let peripheral = targetPeripheral, let char = txCharacteristic else {
            fputs("ERROR: Cannot send data, peripheral or TX characteristic not ready.\n", stderr)
            return
        }
        let writeType: CBCharacteristicWriteType = char.properties.contains(.writeWithoutResponse) ? .withoutResponse : .withResponse
        peripheral.writeValue(data, for: char, type: writeType)
    }

    func disconnectAndExit() {
        if let p = targetPeripheral {
            centralManager.cancelPeripheralConnection(p)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                print("DISCONNECTED")
                fflush(stdout)
                exit(0)
            }
        } else {
            print("DISCONNECTED")
            fflush(stdout)
            exit(0)
        }
    }

    private func hexToBytes(_ hex: String) -> [UInt8] {
        let cleanHex = hex.replacingOccurrences(of: " ", with: "")
        var bytes = [UInt8]()
        var index = cleanHex.startIndex
        while index < cleanHex.endIndex {
            let nextIndex = cleanHex.index(index, offsetBy: 2, limitedBy: cleanHex.endIndex) ?? cleanHex.endIndex
            if let b = UInt8(cleanHex[index..<nextIndex], radix: 16) {
                bytes.append(b)
            }
            index = nextIndex
        }
        return bytes
    }
}

extension String {
    func equalsIgnoreCase(_ other: String) -> Bool {
        return self.compare(other, options: .caseInsensitive) == .orderedSame
    }
}

// MARK: - Main Execution
let args = CommandLine.arguments
guard args.count >= 2 else {
    fputs("Usage: ble_bridge scan [timeoutSec] OR ble_bridge connect <deviceNameOrUUID>\n", stderr)
    exit(1)
}

var globalBridge: BleBridge?

let command = args[1]
if command == "scan" {
    let timeout = args.count >= 3 ? (Double(args[2]) ?? 2.0) : 2.0
    globalBridge = BleBridge(mode: .scan(timeout: timeout))
    RunLoop.main.run()
} else if command == "connect" {
    guard args.count >= 3 else {
        fputs("Usage: ble_bridge connect <deviceNameOrUUID>\n", stderr)
        exit(1)
    }
    let target = args[2]
    globalBridge = BleBridge(mode: .connect(target: target))
    RunLoop.main.run()
} else {
    fputs("Unknown command: \(command)\n", stderr)
    exit(1)
}
