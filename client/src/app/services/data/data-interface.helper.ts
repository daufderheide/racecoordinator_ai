import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Reader } from "protobufjs/minimal";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BartConfigConverter } from "@app/converters/bart_config.converter";
import {
  ArduinoConfig,
  BartConfig,
  PhidgetConfig,
  TrackmateConfig,
} from "@app/models/track";
import {
  ArduinoConfig as ProtoArduinoConfig,
  GetPhidgetDevicesResponse,
  InitializeInterfaceRequest,
  InitializeInterfaceResponse,
  IPhidgetDeviceInfo,
  IRgbLedState,
  LedString as ProtoLedString,
  PhidgetConfig as ProtoPhidgetConfig,
  RgbLedState,
  SetInterfacePinStateRequest,
  SetInterfacePinStateResponse,
  SetInterfaceRgbLedStateRequest,
  SetInterfaceRgbLedStateResponse,
  TrackmateConfig as ProtoTrackmateConfig,
  UpdateInterfaceConfigRequest,
  UpdateInterfaceConfigResponse,
  VoltageConfig as ProtoVoltageConfig,
} from "@app/proto/antigravity";

export class DataInterfaceHelper {
  constructor(
    private http: HttpClient,
    private getBaseUrl: () => string,
  ) {}

  mapArduinoConfigsToProto(configs: ArduinoConfig[]) {
    return configs.map((config) =>
      ProtoArduinoConfig.create({
        name: config.name,
        commPort: config.commPort,
        baudRate: config.baudRate,
        debounceUs: config.debounceUs,
        hardwareType: config.hardwareType,
        normallyClosedLaneSensors: config.normallyClosedLaneSensors,
        normallyClosedRelays: config.normallyClosedRelays,
        activeLowAnalogLeds: config.activeLowAnalogLeds,
        usePitsAsLaps: config.usePitsAsLaps,
        useLapsForSegments: config.useLapsForSegments,
        digitalIds: config.digitalIds,
        analogIds: config.analogIds,
        ledStrings:
          config.ledStrings?.map((ls) =>
            ProtoLedString.create({
              pin: ls.pin,
              leds: ls.leds,
              numUsedLeds: ls.numUsedLeds,
              addressableLeds: ls.addressableLeds,
              brightness: ls.brightness,
              colorOrder: ls.colorOrder,
              flagFlashRate: ls.flagFlashRate,
              ledLaneColorOverrides: ls.ledLaneColorOverrides,
            }),
          ) || [],
        voltageConfigs: Object.entries(config.voltageConfigs || {}).map(
          ([lane, maxVoltage]) =>
            ProtoVoltageConfig.create({
              lane: parseInt(lane, 10),
              maxVoltage: maxVoltage as number,
            }),
        ),
      }),
    );
  }

  mapTrackmateConfigsToProto(trackmateConfigs: TrackmateConfig[]) {
    return trackmateConfigs.map((config) =>
      ProtoTrackmateConfig.create({
        name: config.name,
        commPort: config.commPort,
        normallyClosedRelays: config.normallyClosedRelays,
        useIr: config.useIR,
        debounce: config.debounce,
        numLanes: config.numLanes,
        normallyClosedLaneSensors: config.normallyClosedLaneSensors,
        hasPerLaneRelays: config.hasPerLaneRelays,
        lapPinPitBehavior: config.lapPinPitBehavior,
        lapPinBehaviors: config.lapPinBehaviors,
      }),
    );
  }

  mapPhidgetConfigsToProto(phidgetConfigs: any[]) {
    return (
      phidgetConfigs?.map((config) =>
        ProtoPhidgetConfig.create({
          name: config.name,
          serialNumber: config.serialNumber,
          isHubPort: config.isHubPort,
          hubPort: config.hubPort,
          normallyClosedLaneSensors: config.normallyClosedLaneSensors,
          normallyClosedRelays: config.normallyClosedRelays,
          activeLowAnalogLeds: config.activeLowAnalogLeds,
          useLapsForSegments: config.useLapsForSegments,
          lapPinPitBehavior: config.lapPinPitBehavior,
          digitalInIds: config.digitalInIds,
          digitalOutIds: config.digitalOutIds,
          analogIds: config.analogIds,
          voltageConfigs: Object.entries(config.voltageConfigs || {}).map(
            ([lane, maxVoltage]) =>
              ProtoVoltageConfig.create({
                lane: parseInt(lane, 10),
                maxVoltage: maxVoltage as number,
              }),
          ),
        }),
      ) || []
    );
  }

  mapBartConfigsToProto(configs: BartConfig[]) {
    return (configs || []).map((c) => BartConfigConverter.toProto(c));
  }

  getSerialPorts(): Observable<string[]> {
    return this.http.get<string[]>(`${this.getBaseUrl()}/api/serial-ports`);
  }

  getBleDevices(): Observable<string[]> {
    return this.http.get<string[]>(`${this.getBaseUrl()}/api/ble-devices`);
  }

  getPhidgetDevices(): Observable<IPhidgetDeviceInfo[]> {
    return this.http
      .get(`${this.getBaseUrl()}/api/phidgets`, {
        responseType: "arraybuffer",
      })
      .pipe(
        map((buffer) => {
          const response = GetPhidgetDevicesResponse.decode(
            new Uint8Array(buffer),
          );
          return response.devices;
        }),
      );
  }

  initializeInterface(
    configs: ArduinoConfig[],
    trackmateConfigs: TrackmateConfig[],
    phidgetConfigsOrLaneCount: any[] | number = [],
    laneCountParam?: number,
    bartConfigs: BartConfig[] = [],
  ): Observable<InitializeInterfaceResponse> {
    let phidgetConfigs: any[] = [];
    let laneCount = 0;

    if (typeof phidgetConfigsOrLaneCount === "number") {
      laneCount = phidgetConfigsOrLaneCount;
    } else {
      phidgetConfigs = phidgetConfigsOrLaneCount;
      laneCount = laneCountParam || 0;
    }

    const request = InitializeInterfaceRequest.create({
      configs: this.mapArduinoConfigsToProto(configs),
      trackmateConfigs: this.mapTrackmateConfigsToProto(trackmateConfigs),
      phidgetConfigs: this.mapPhidgetConfigsToProto(phidgetConfigs),
      bartConfigs: this.mapBartConfigsToProto(bartConfigs),
      laneCount,
    });
    const buffer = InitializeInterfaceRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/initialize-interface`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return InitializeInterfaceResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  updateInterfaceConfig(
    config: ArduinoConfig | null,
    interfaceIndex: number,
    phidgetConfig?: PhidgetConfig | null,
  ): Observable<UpdateInterfaceConfigResponse> {
    const request = UpdateInterfaceConfigRequest.create({
      config: config
        ? ProtoArduinoConfig.create({
            name: config.name,
            commPort: config.commPort,
            baudRate: config.baudRate,
            debounceUs: config.debounceUs,
            hardwareType: config.hardwareType,
            normallyClosedLaneSensors: config.normallyClosedLaneSensors,
            normallyClosedRelays: config.normallyClosedRelays,
            activeLowAnalogLeds: config.activeLowAnalogLeds,
            usePitsAsLaps: config.usePitsAsLaps,
            useLapsForSegments: config.useLapsForSegments,
            digitalIds: config.digitalIds,
            analogIds: config.analogIds,
            ledStrings:
              config.ledStrings?.map((ls) =>
                ProtoLedString.create({
                  pin: ls.pin,
                  leds: ls.leds,
                  numUsedLeds: ls.numUsedLeds,
                  addressableLeds: ls.addressableLeds,
                  brightness: ls.brightness,
                  colorOrder: ls.colorOrder,
                  flagFlashRate: ls.flagFlashRate,
                  ledLaneColorOverrides: ls.ledLaneColorOverrides,
                }),
              ) || [],
            voltageConfigs: Object.entries(config.voltageConfigs || {}).map(
              ([lane, maxVoltage]) =>
                ProtoVoltageConfig.create({
                  lane: parseInt(lane, 10),
                  maxVoltage: maxVoltage as number,
                }),
            ),
          })
        : undefined,
      phidgetConfig: phidgetConfig
        ? ProtoPhidgetConfig.create({
            name: phidgetConfig.name,
            serialNumber: phidgetConfig.serialNumber,
            isHubPort: phidgetConfig.isHubPort,
            hubPort: phidgetConfig.hubPort,
            normallyClosedLaneSensors: phidgetConfig.normallyClosedLaneSensors,
            normallyClosedRelays: phidgetConfig.normallyClosedRelays,
            activeLowAnalogLeds: phidgetConfig.activeLowAnalogLeds,
            useLapsForSegments: phidgetConfig.useLapsForSegments,
            lapPinPitBehavior: phidgetConfig.lapPinPitBehavior,
            digitalInIds: phidgetConfig.digitalInIds,
            digitalOutIds: phidgetConfig.digitalOutIds,
            analogIds: phidgetConfig.analogIds,
            voltageConfigs: Object.entries(
              phidgetConfig.voltageConfigs || {},
            ).map(([lane, maxVoltage]) =>
              ProtoVoltageConfig.create({
                lane: parseInt(lane, 10),
                maxVoltage: maxVoltage as number,
              }),
            ),
          })
        : undefined,
      interfaceIndex,
    });
    const buffer = UpdateInterfaceConfigRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/update-interface-config`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return UpdateInterfaceConfigResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  setInterfacePinState(
    pin: number,
    isDigital: boolean,
    isHigh: boolean,
    interfaceIndex: number,
  ): Observable<SetInterfacePinStateResponse> {
    const request = SetInterfacePinStateRequest.create({
      pin,
      isDigital,
      isHigh,
      interfaceIndex,
    });
    const buffer = SetInterfacePinStateRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/set-interface-pin-state`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return SetInterfacePinStateResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  setInterfaceRgbLedState(
    pin: number,
    leds: IRgbLedState[],
    interfaceIndex: number,
  ): Observable<SetInterfaceRgbLedStateResponse> {
    const request = SetInterfaceRgbLedStateRequest.create({
      pin,
      leds: leds.map((l) => RgbLedState.create(l)),
      interfaceIndex,
    });
    const buffer = SetInterfaceRgbLedStateRequest.encode(request).finish();

    const headers = new HttpHeaders({
      "Content-Type": "application/octet-stream",
      Accept: "application/octet-stream",
    });

    return this.http
      .post(
        `${this.getBaseUrl()}/api/set-interface-rgb-led-state`,
        new Blob([buffer as any]),
        {
          headers,
          responseType: "arraybuffer",
        },
      )
      .pipe(
        map((response) => {
          return SetInterfaceRgbLedStateResponse.decode(
            Reader.create(new Uint8Array(response as any)),
          );
        }),
      );
  }

  closeInterface(): Observable<any> {
    return this.http.post(`${this.getBaseUrl()}/api/close-interface`, {});
  }
}
