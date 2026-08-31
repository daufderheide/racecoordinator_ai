import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ArduinoConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { ArduinoSummaryComponent } from "./arduino-summary.component";

describe("ArduinoSummaryComponent", () => {
  let component: ArduinoSummaryComponent;
  let fixture: ComponentFixture<ArduinoSummaryComponent>;
  let translationService: TranslationServiceMock;

  beforeEach(async () => {
    translationService = new TranslationServiceMock();

    await TestBed.configureTestingModule({
      imports: [ArduinoSummaryComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: translationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArduinoSummaryComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("getBoardName", () => {
    it("should return empty string if no track", () => {
      fixture.componentRef.setInput("config", undefined);
      expect(component.getBoardName()).toBe("");
    });

    it("should return AS_BOARD_MEGA for hardware type 1", () => {
      const config: Partial<ArduinoConfig> = {
        hardwareType: 1,
        lapPinPitBehavior: 3,
      };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.getBoardName()).toBe("AS_BOARD_MEGA");
    });

    it("should return AS_BOARD_UNO for hardware type 0", () => {
      const config: Partial<ArduinoConfig> = {
        hardwareType: 0,
        lapPinPitBehavior: 3,
      };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.getBoardName()).toBe("AS_BOARD_UNO");
    });
  });

  describe("getConfiguredPinCount", () => {
    it("should return 0 if no config", () => {
      fixture.componentRef.setInput("config", undefined);
      expect(component.getConfiguredPinCount()).toBe(0);
    });

    it("should count configured pins excluding unused and reserved", () => {
      const digitalIds = [
        PinBehavior.BEHAVIOR_UNUSED, // 0
        PinBehavior.BEHAVIOR_RESERVED, // 1
        PinBehavior.BEHAVIOR_CALL_BUTTON, // 2 (Counted)
        -1, // Not counted
        1000, // Counted
      ];
      const analogIds = [
        PinBehavior.BEHAVIOR_UNUSED, // 0
        2000, // Counted
      ];

      const config: Partial<ArduinoConfig> = {
        digitalIds,
        analogIds,
        lapPinPitBehavior: 3,
      };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.getConfiguredPinCount()).toBe(3);
    });
  });

  describe("hasBehavior", () => {
    it("should detect laps", () => {
      const digitalIds = [PinBehavior.BEHAVIOR_LAP_BASE]; // 1000
      const config: Partial<ArduinoConfig> = {
        digitalIds,
        lapPinPitBehavior: 3,
      };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("lap")).toBeTrue();
    });

    it("should detect segments", () => {
      const digitalIds = [PinBehavior.BEHAVIOR_SEGMENT_BASE]; // 2000
      const config: Partial<ArduinoConfig> = {
        digitalIds,
        lapPinPitBehavior: 3,
      };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("segment")).toBeTrue();
    });

    it("should detect call buttons", () => {
      let digitalIds = [PinBehavior.BEHAVIOR_CALL_BUTTON]; // 2
      let config: Partial<ArduinoConfig> = { digitalIds, lapPinPitBehavior: 3 };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("call")).toBeTrue();

      digitalIds = [PinBehavior.BEHAVIOR_CALL_BUTTON_BASE]; // 3000
      config = { digitalIds };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("call")).toBeTrue();
    });

    it("should detect relays", () => {
      let digitalIds = [PinBehavior.BEHAVIOR_RELAY]; // 3
      let config: Partial<ArduinoConfig> = { digitalIds, lapPinPitBehavior: 3 };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("relay")).toBeTrue();

      digitalIds = [PinBehavior.BEHAVIOR_RELAY_BASE]; // 4000
      config = { digitalIds };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("relay")).toBeTrue();
    });

    it("should detect leds including analog heat leaders", () => {
      let digitalIds = [PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG];
      let config: Partial<ArduinoConfig> = { digitalIds, lapPinPitBehavior: 3 };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("led")).toBeTrue();

      digitalIds = [(PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE];
      config = { digitalIds, lapPinPitBehavior: 3 };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("led")).toBeTrue();
    });

    it("should return false if behavior absent", () => {
      const config: Partial<ArduinoConfig> = {
        digitalIds: [],
        analogIds: [],
        lapPinPitBehavior: 3,
      };
      fixture.componentRef.setInput("config", config as ArduinoConfig);
      expect(component.hasBehavior("lap")).toBeFalse();
      expect(component.hasBehavior("segment")).toBeFalse();
      expect(component.hasBehavior("call")).toBeFalse();
      expect(component.hasBehavior("relay")).toBeFalse();
      expect(component.hasBehavior("led")).toBeFalse();
    });
  });
});
