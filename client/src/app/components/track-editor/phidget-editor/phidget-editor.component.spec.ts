import { ComponentRef } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { PhidgetConfig } from "@app/models/track";
import {
  InterfaceStatus,
  PinBehavior,
  SetInterfacePinStateResponse,
} from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";

import { PhidgetEditorComponent } from "./phidget-editor.component";

describe("PhidgetEditorComponent", () => {
  let component: PhidgetEditorComponent;
  let componentRef: ComponentRef<PhidgetEditorComponent>;
  let fixture: ComponentFixture<PhidgetEditorComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let eventsSubject: Subject<any>;

  const sampleConfig: PhidgetConfig = {
    name: "Phidget 8/8/8",
    serialNumber: 12345,
    isHubPort: false,
    hubPort: 0,
    normallyClosedLaneSensors: true,
    normallyClosedRelays: true,
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
    eventsSubject = new Subject<any>();
    mockDataService = jasmine.createSpyObj("DataService", [
      "getPhidgetDevices",
      "getInterfaceEvents",
      "setInterfacePinState",
      "updateInterfaceConfig",
    ]);
    mockDataService.setInterfacePinState.and.returnValue(
      of(SetInterfacePinStateResponse.create({ success: true, message: "OK" })),
    );
    mockDataService.updateInterfaceConfig.and.returnValue(
      of({ success: true, message: "Config updated" } as any),
    );
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
    mockDataService.getInterfaceEvents.and.returnValue(eventsSubject);

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
  });

  it("should correctly detect capabilities for 0/0/4 relay board", () => {
    component.config().digitalInIds = [];
    component.config().analogIds = [];
    component.onDeviceSelectChange("67890_false_0");
    const caps = component.getCapabilities();
    expect(caps.digitalInputs).toBe(0);
    expect(caps.digitalOutputs).toBe(4);
    expect(caps.analogInputs).toBe(0);
    expect(component.availableDigitalInputPins.length).toBe(0);
    expect(component.availableDigitalOutputPins.length).toBe(4);
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

  it("should not render analog inputs in the template", () => {
    fixture.detectChanges();
    const analogItem = fixture.nativeElement.querySelector(
      "#phidget-analog-item-0-0",
    );
    expect(analogItem).toBeNull();
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

  it("should update status and status badge element class on interface status events", () => {
    eventsSubject.next({
      status: {
        interfaceIndex: 0,
        status: InterfaceStatus.CONNECTED,
      },
    });
    fixture.detectChanges();
    expect(component.status).toBe("CONNECTED");
    const badgeEl: HTMLElement = fixture.nativeElement.querySelector(
      "#phidget-status-badge-0",
    );
    expect(badgeEl.classList.contains("connected")).toBeTrue();

    eventsSubject.next({
      status: {
        interfaceIndex: 0,
        status: InterfaceStatus.DISCONNECTED,
      },
    });
    fixture.detectChanges();
    expect(component.status).toBe("DISCONNECTED");
    expect(badgeEl.classList.contains("connected")).toBeFalse();
  });

  it("should reset status to DISCONNECTED when switching device", () => {
    component.status = "CONNECTED";
    fixture.detectChanges();
    const badgeEl: HTMLElement = fixture.nativeElement.querySelector(
      "#phidget-status-badge-0",
    );
    expect(badgeEl.classList.contains("connected")).toBeTrue();

    component.onDeviceSelectChange("67890_false_0");
    fixture.detectChanges();
    expect(component.status).toBe("DISCONNECTED");
    expect(badgeEl.classList.contains("connected")).toBeFalse();
  });

  it("should toggle output pin state high/low when output status badge is pressed", () => {
    // Digital Output pin 0 is set to BEHAVIOR_RELAY in sampleConfig
    fixture.detectChanges();
    const outBadgeEl: HTMLElement = fixture.nativeElement.querySelector(
      "#phidget-out-status-0",
    );
    expect(outBadgeEl).toBeTruthy();
    expect(outBadgeEl.classList.contains("connected")).toBeFalse();

    // Click badge to toggle high (true)
    outBadgeEl.click();
    fixture.detectChanges();

    expect(mockDataService.setInterfacePinState).toHaveBeenCalledWith(
      0,
      true,
      true,
      0,
    );
    expect(component.isPinActive("out", 0)).toBeTrue();
    expect(outBadgeEl.classList.contains("connected")).toBeTrue();

    // Click badge again to toggle low (false)
    outBadgeEl.click();
    fixture.detectChanges();

    expect(mockDataService.setInterfacePinState).toHaveBeenCalledWith(
      0,
      true,
      false,
      0,
    );
    expect(component.isPinActive("out", 0)).toBeFalse();
    expect(outBadgeEl.classList.contains("connected")).toBeFalse();
  });

  it("should disable phidget device options in dropdown if selected by another interface on the track", () => {
    const config1: PhidgetConfig = {
      ...sampleConfig,
      serialNumber: 12345,
    };
    const config2: PhidgetConfig = {
      ...sampleConfig,
      serialNumber: 67890,
    };

    componentRef.setInput("config", config2);
    componentRef.setInput("allPhidgetConfigs", [config1, config2]);
    fixture.detectChanges();

    const device1 = {
      serialNumber: 12345,
      name: "PhidgetInterfaceKit 8/8/8 (12345)",
      isHubPort: false,
      hubPort: 0,
    };
    const device2 = {
      serialNumber: 67890,
      name: "PhidgetInterfaceKit 0/0/4 (67890)",
      isHubPort: false,
      hubPort: 0,
    };

    // device1 is selected by config1, which is another interface
    expect(component.isDeviceSelectedByOther(device1)).toBeTrue();
    // device2 is selected by config2, which is the current interface
    expect(component.isDeviceSelectedByOther(device2)).toBeFalse();

    const selectEl: HTMLSelectElement =
      fixture.nativeElement.querySelector("#device-0");
    const options = Array.from(selectEl.options);

    const option1 = options.find((opt) => opt.value === "12345_false_0");
    const option2 = options.find((opt) => opt.value === "67890_false_0");

    expect(option1?.disabled).toBeTrue();
    expect(option2?.disabled).toBeFalse();
  });

  it("should normalize hubPort to 0 when isHubPort is false or hubPort is negative", () => {
    const usbDevice = {
      serialNumber: 99999,
      isHubPort: false,
      hubPort: -1,
    };
    expect(component.getDeviceKey(usbDevice)).toBe("99999_false_0");

    const hubDevice = {
      serialNumber: 88888,
      isHubPort: true,
      hubPort: 2,
    };
    expect(component.getDeviceKey(hubDevice)).toBe("88888_true_2");
  });

  it("should expand all sections when ensureSectionsExpanded is called", () => {
    component.sectionsExpanded = {
      phidget: false,
      main: false,
      pins: false,
      digitalIn: false,
      digitalOut: false,
    };
    component.ensureSectionsExpanded();
    expect(component.sectionsExpanded.phidget).toBeTrue();
    expect(component.sectionsExpanded.main).toBeTrue();
    expect(component.sectionsExpanded.pins).toBeTrue();
    expect(component.sectionsExpanded.digitalIn).toBeTrue();
    expect(component.sectionsExpanded.digitalOut).toBeTrue();
  });

  it("should return guide steps and expand appropriate sections onEnter", () => {
    const steps = component.getHelpSteps();
    expect(steps.length).toBeGreaterThanOrEqual(5);
    expect(steps[0].selector).toBe("#phidget-editor-0");
    expect(steps[0].title).toBe("TE_HELP_PHIDGET_TITLE");

    component.sectionsExpanded.phidget = false;
    component.sectionsExpanded.main = false;
    steps[0].onEnter!();
    expect(component.sectionsExpanded.phidget).toBeTrue();
    expect(component.sectionsExpanded.main).toBeTrue();

    // Check digital in step onEnter if digital in pins exist
    if (steps.length > 5) {
      component.sectionsExpanded.digitalIn = false;
      steps[5].onEnter!();
      expect(component.sectionsExpanded.digitalIn).toBeTrue();
    }
  });

  it("should evaluate real-time trip state for Normally Closed lane sensors", () => {
    component.config().normallyClosedLaneSensors = true;

    // NC Untripped (closed circuit, state 1)
    eventsSubject.next({
      digitalPin: {
        interfaceIndex: 0,
        pin: 0,
        isDigital: true,
        state: 1,
      },
    });
    fixture.detectChanges();
    expect(component.isPinActive("in", 0)).toBeFalse();

    // NC Tripped (open circuit, state 0)
    eventsSubject.next({
      digitalPin: {
        interfaceIndex: 0,
        pin: 0,
        isDigital: true,
        state: 0,
      },
    });
    fixture.detectChanges();
    expect(component.isPinActive("in", 0)).toBeTrue();
  });

  it("should evaluate real-time trip state for Normally Open lane sensors", () => {
    component.config().normallyClosedLaneSensors = false;

    // NO Untripped (open circuit, state 0)
    eventsSubject.next({
      digitalPin: {
        interfaceIndex: 0,
        pin: 0,
        isDigital: true,
        state: 0,
      },
    });
    fixture.detectChanges();
    expect(component.isPinActive("in", 0)).toBeFalse();

    // NO Tripped (closed circuit, state 1)
    eventsSubject.next({
      digitalPin: {
        interfaceIndex: 0,
        pin: 0,
        isDigital: true,
        state: 1,
      },
    });
    fixture.detectChanges();
    expect(component.isPinActive("in", 0)).toBeTrue();
  });

  it("should trigger pulse on lap and callbutton events", () => {
    eventsSubject.next({
      lap: {
        interfaceIndex: 0,
        interfaceId: 1,
      },
    });
    fixture.detectChanges();
    expect(component.isPinActive("in", 1)).toBeTrue();

    // Trigger callbutton event
    eventsSubject.next({
      callbutton: {
        interfaceIndex: 0,
        lane: 0,
      },
    });
    fixture.detectChanges();
    // sampleConfig has PinBehavior.BEHAVIOR_CALL_BUTTON on pin 1
    expect(component.isPinActive("in", 1)).toBeTrue();
  });

  it("should not light up badge if setInterfacePinState returns success false", () => {
    mockDataService.setInterfacePinState.and.returnValue(
      of(
        SetInterfacePinStateResponse.create({
          success: false,
          message: "Channel not attached",
        }),
      ),
    );

    fixture.detectChanges();
    const outBadgeEl: HTMLElement = fixture.nativeElement.querySelector(
      "#phidget-out-status-0",
    );
    expect(outBadgeEl).toBeTruthy();

    outBadgeEl.click();
    fixture.detectChanges();

    expect(mockDataService.setInterfacePinState).toHaveBeenCalledWith(
      0,
      true,
      true,
      0,
    );
    expect(component.isPinActive("out", 0)).toBeFalse();
    expect(outBadgeEl.classList.contains("connected")).toBeFalse();
  });

  it("should not light up badge if setInterfacePinState throws error", () => {
    mockDataService.setInterfacePinState.and.returnValue(
      throwError(() => new Error("Network failure")),
    );

    fixture.detectChanges();
    const outBadgeEl: HTMLElement = fixture.nativeElement.querySelector(
      "#phidget-out-status-0",
    );
    expect(outBadgeEl).toBeTruthy();

    outBadgeEl.click();
    fixture.detectChanges();

    expect(component.isPinActive("out", 0)).toBeFalse();
    expect(outBadgeEl.classList.contains("connected")).toBeFalse();
  });

  it("should call updateInterfaceConfig and emit change on onConfigChange", () => {
    spyOn(component.change, "emit");
    component.onConfigChange();

    expect(mockDataService.updateInterfaceConfig).toHaveBeenCalledWith(
      null,
      0,
      component.config(),
    );
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should toggle output pin on and off when status badge is clicked", () => {
    mockDataService.setInterfacePinState.and.returnValue(
      of(
        SetInterfacePinStateResponse.create({
          success: true,
          message: "Pin state updated",
        }),
      ),
    );

    fixture.detectChanges();
    const outBadgeEl: HTMLElement = fixture.nativeElement.querySelector(
      "#phidget-out-status-0",
    );
    expect(outBadgeEl).toBeTruthy();
    expect(component.isPinActive("out", 0)).toBeFalse();
    expect(outBadgeEl.classList.contains("connected")).toBeFalse();

    // Click 1: Turn ON
    outBadgeEl.click();
    fixture.detectChanges();

    expect(mockDataService.setInterfacePinState).toHaveBeenCalledWith(
      0,
      true,
      true,
      0,
    );
    expect(component.isPinActive("out", 0)).toBeTrue();
    expect(outBadgeEl.classList.contains("connected")).toBeTrue();

    // Click 2: Turn OFF
    outBadgeEl.click();
    fixture.detectChanges();

    expect(mockDataService.setInterfacePinState).toHaveBeenCalledWith(
      0,
      true,
      false,
      0,
    );
    expect(component.isPinActive("out", 0)).toBeFalse();
    expect(outBadgeEl.classList.contains("connected")).toBeFalse();
  });

  it("should trigger pulse on analogData event", fakeAsync(() => {
    fixture.detectChanges();
    expect(component.isPinActive("analog", 2)).toBeFalse();

    eventsSubject.next({
      analogData: {
        interfaceIndex: 0,
        pin: 2,
        value: 512,
      },
    });
    tick();
    fixture.detectChanges();

    expect(component.isPinActive("analog", 2)).toBeTrue();

    tick(600);
    fixture.detectChanges();
    expect(component.isPinActive("analog", 2)).toBeFalse();
  }));

  it("should clear pinState when selecting new pin behavior for output", () => {
    component.pinState["out-0"] = true;
    expect(component.isPinActive("out", 0)).toBeTrue();

    component.selectPinAction("out", 0, "unused");
    expect(component.isPinActive("out", 0)).toBeFalse();
  });

  it("should show 0 pins when no device is selected and no pins are assigned", () => {
    componentRef.setInput("config", {
      name: "Phidget 1",
      serialNumber: -1,
      isHubPort: false,
      hubPort: 0,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: true,
      useLapsForSegments: false,
      lapPinPitBehavior: 3,
      digitalInIds: Array(32).fill(0),
      digitalOutIds: Array(32).fill(0),
      analogIds: Array(16).fill(0),
    });
    component.updateSelectedDeviceKey();
    fixture.detectChanges();

    const caps = component.getCapabilities();
    expect(caps.digitalInputs).toBe(0);
    expect(caps.digitalOutputs).toBe(0);
    expect(caps.analogInputs).toBe(0);
    expect(component.availableDigitalInputPins.length).toBe(0);
    expect(component.availableDigitalOutputPins.length).toBe(0);
  });

  it("should show sections with assigned pins when board is disconnected and 8/8/8 is configured", () => {
    componentRef.setInput("config", {
      name: "Phidget 8/8/8",
      serialNumber: 99999,
      isHubPort: false,
      hubPort: 0,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: true,
      useLapsForSegments: true,
      lapPinPitBehavior: 0,
      digitalInIds: [PinBehavior.BEHAVIOR_LAP_BASE, 0, 0, 0],
      digitalOutIds: [PinBehavior.BEHAVIOR_RELAY, 0, 0, 0],
      analogIds: [0],
    });
    component.updateSelectedDeviceKey();
    fixture.detectChanges();

    expect(component.isConfiguredDeviceDisconnected).toBeTrue();
    const caps = component.getCapabilities();
    expect(caps.digitalInputs).toBe(8);
    expect(caps.digitalOutputs).toBe(8);
    expect(component.availableDigitalInputPins.length).toBe(8);
    expect(component.availableDigitalOutputPins.length).toBe(8);

    const selectEl: HTMLSelectElement =
      fixture.nativeElement.querySelector("#device-0");
    const options = Array.from(selectEl.options);
    const discOpt = options.find((opt) => opt.value === "99999_false_0");
    expect(discOpt).toBeTruthy();
    expect(discOpt?.textContent).toContain("Phidget 8/8/8 (99999)");
    expect(discOpt?.textContent).toContain("PHIDGET_STATUS_DISCONNECTED");
  });

  it("should show assigned pins even if device type has 0 inputs", () => {
    componentRef.setInput("config", {
      name: "Phidget 0/0/4",
      serialNumber: 88888,
      isHubPort: false,
      hubPort: 0,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: true,
      useLapsForSegments: true,
      lapPinPitBehavior: 0,
      digitalInIds: [
        PinBehavior.BEHAVIOR_LAP_BASE,
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
      ],
      digitalOutIds: [PinBehavior.BEHAVIOR_RELAY],
      analogIds: [],
    });
    component.updateSelectedDeviceKey();
    fixture.detectChanges();

    const caps = component.getCapabilities();
    expect(caps.digitalInputs).toBe(2);
    expect(caps.digitalOutputs).toBe(4);
    expect(component.availableDigitalInputPins.length).toBe(2);
    expect(component.availableDigitalOutputPins.length).toBe(4);
  });

  describe("Heat Leader Analog LED Options", () => {
    it("should include heat leader analog LED actions in analog LED group for all lanes", () => {
      componentRef.setInput("lanes", 2);
      fixture.detectChanges();

      const groups = component.getFilteredActions("out", 0);
      const analogGroup = groups.find(
        (g) => g.key === "AE_BEHAVIOR_GROUP_ANALOG_LED",
      );
      expect(analogGroup).toBeDefined();

      const lane1Leader = analogGroup?.actions.find(
        (a) => a.value === "analogled_heat_leader_0",
      );
      const lane2Leader = analogGroup?.actions.find(
        (a) => a.value === "analogled_heat_leader_1",
      );

      expect(lane1Leader).toBeDefined();
      expect(lane2Leader).toBeDefined();
    });

    it("should select and get pin action for heat leader analog LEDs", () => {
      component.selectPinAction("out", 0, "analogled_heat_leader_0");
      expect(component.getPinAction("out", 0)).toBe("analogled_heat_leader_0");
      expect(component.config()?.digitalOutIds?.[0]).toBe(
        (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE,
      );

      component.selectPinAction("out", 1, "analogled_heat_leader_1");
      expect(component.getPinAction("out", 1)).toBe("analogled_heat_leader_1");
      expect(component.config()?.digitalOutIds?.[1]).toBe(
        (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE + 1,
      );
    });
  });
});
