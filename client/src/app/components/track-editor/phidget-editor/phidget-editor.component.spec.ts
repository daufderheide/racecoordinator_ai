import { ComponentRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { PhidgetConfig } from "@app/models/track";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";

import { PhidgetEditorComponent } from "./phidget-editor.component";

describe("PhidgetEditorComponent", () => {
  let component: PhidgetEditorComponent;
  let componentRef: ComponentRef<PhidgetEditorComponent>;
  let fixture: ComponentFixture<PhidgetEditorComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  const sampleConfig: PhidgetConfig = {
    name: "Phidget 8/8/8",
    serialNumber: 12345,
    isHubPort: false,
    hubPort: 0,
    debounceUs: 5000,
    normallyClosedLaneSensors: true,
    normallyClosedRelays: true,
    useLapsForPits: 0,
    useLapsForPitEnd: 0,
    usePitsAsLaps: false,
    useLapsForSegments: true,
    lapPinPitBehavior: 0,
    digitalInIds: [
      PinBehavior.BEHAVIOR_UNUSED,
      PinBehavior.BEHAVIOR_CALL_BUTTON,
    ],
    digitalOutIds: [PinBehavior.BEHAVIOR_RELAY],
    analogIds: [PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE],
  };

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getPhidgetDevices",
      "getInterfaceEvents",
    ]);
    mockDataService.getPhidgetDevices.and.returnValue(
      of([
        {
          serialNumber: 12345,
          name: "PhidgetInterfaceKit 8/8/8 (12345)",
          isHubPort: false,
          hubPort: 0,
          digitalInputCount: 8,
          digitalOutputCount: 8,
          analogInputCount: 8,
        },
        {
          serialNumber: 67890,
          name: "PhidgetInterfaceKit 0/0/4 (67890)",
          isHubPort: false,
          hubPort: 0,
          digitalInputCount: 0,
          digitalOutputCount: 4,
          analogInputCount: 0,
        },
      ]),
    );
    mockDataService.getInterfaceEvents.and.returnValue(of({}));

    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (key === "AE_PIN_UNUSED") return "Unused";
        if (key === "AE_PIN_MASTER_CALL") return "Master Call";
        if (key === "AE_PIN_RELAY") return "Main Relay";
        if (key === "AE_PIN_RELAY_LANE") return `Lane ${params?.lane} Relay`;
        if (key === "AE_PIN_LAP_LANE") return `Lane ${params?.lane} Lap`;
        if (key === "AE_PIN_VOLTAGE_LANE")
          return `Lane ${params?.lane} Voltage`;
        if (key === "AE_PIN_ANALOG_LED_GREEN_FLAG") return "Green Flag LED";
        return key;
      },
    );

    await TestBed.configureTestingModule({
      imports: [PhidgetEditorComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PhidgetEditorComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput("config", { ...sampleConfig });
    componentRef.setInput("interfaceIndex", 0);
    componentRef.setInput("lanes", 4);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should correctly detect capabilities for 8/8/8 board", () => {
    const caps = component.getCapabilities();
    expect(caps.digitalInputs).toBe(8);
    expect(caps.digitalOutputs).toBe(8);
    expect(caps.analogInputs).toBe(8);
    expect(component.availableDigitalInputPins.length).toBe(8);
    expect(component.availableDigitalOutputPins.length).toBe(8);
    expect(component.availableAnalogInputPins.length).toBe(8);
  });

  it("should correctly detect capabilities for 0/0/4 relay board", () => {
    component.onDeviceSelectChange("67890_false_0");
    const caps = component.getCapabilities();
    expect(caps.digitalInputs).toBe(0);
    expect(caps.digitalOutputs).toBe(4);
    expect(caps.analogInputs).toBe(0);
    expect(component.availableDigitalInputPins.length).toBe(0);
    expect(component.availableDigitalOutputPins.length).toBe(4);
    expect(component.availableAnalogInputPins.length).toBe(0);
  });

  it("should set and retrieve digital input pin behavior correctly", () => {
    component.selectPinAction("in", 0, "lap_0");
    expect(component.config().digitalInIds[0]).toBe(
      PinBehavior.BEHAVIOR_LAP_BASE,
    );
    expect(component.getPinAction("in", 0)).toBe("lap_0");

    component.selectPinAction("in", 1, "pitin_1");
    expect(component.config().digitalInIds[1]).toBe(
      PinBehavior.BEHAVIOR_PIT_IN_BASE + 1,
    );
    expect(component.getPinAction("in", 1)).toBe("pitin_1");
  });

  it("should set and retrieve digital output pin behavior correctly", () => {
    component.selectPinAction("out", 0, "master_relay");
    expect(component.config().digitalOutIds[0]).toBe(
      PinBehavior.BEHAVIOR_RELAY,
    );

    component.selectPinAction("out", 1, "relay_2");
    expect(component.config().digitalOutIds[1]).toBe(
      PinBehavior.BEHAVIOR_RELAY_BASE + 2,
    );
    expect(component.getPinAction("out", 1)).toBe("relay_2");

    component.selectPinAction("out", 2, "analogled_green");
    expect(component.config().digitalOutIds[2]).toBe(
      PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG,
    );
    expect(component.getPinAction("out", 2)).toBe("analogled_green");
  });

  it("should set and retrieve analog input pin behavior correctly", () => {
    component.selectPinAction("analog", 0, "voltage_0");
    expect(component.config().analogIds[0]).toBe(
      PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE,
    );
    expect(component.getPinAction("analog", 0)).toBe("voltage_0");
  });

  it("should toggle dropdown state", () => {
    const dummyEvent = new MouseEvent("click");
    component.togglePinDropdown("in-0", dummyEvent);
    expect(component.isPinDropdownOpen("in-0")).toBeTrue();

    component.onDocumentClick();
    expect(component.isPinDropdownOpen("in-0")).toBeFalse();
  });

  it("should include analog LED options for 8/8/8 board and exclude for 0/0/4 relay board", () => {
    expect(component.supportsAnalogLeds()).toBeTrue();
    let outGroups = component.getFilteredActions("out", 0);
    expect(
      outGroups.some((g) => g.key === "AE_BEHAVIOR_GROUP_ANALOG_LED"),
    ).toBeTrue();

    component.onDeviceSelectChange("67890_false_0");
    expect(component.supportsAnalogLeds()).toBeFalse();
    outGroups = component.getFilteredActions("out", 0);
    expect(
      outGroups.some((g) => g.key === "AE_BEHAVIOR_GROUP_ANALOG_LED"),
    ).toBeFalse();
  });

  it("should return correct board image paths for 8/8/8, 0/0/4, and unselected/composite devices", () => {
    expect(component.getBoardImagePath()).toBe(
      "assets/images/phidget_8_8_8_board.png",
    );

    component.onDeviceSelectChange("67890_false_0");
    expect(component.getBoardImagePath()).toBe(
      "assets/images/phidget_0_0_4_board.png",
    );

    component.config().serialNumber = -1;
    component.updateSelectedDeviceKey();
    expect(component.getBoardImagePath()).toBe(
      "assets/images/phidget_composite_boards.png",
    );
  });
});
