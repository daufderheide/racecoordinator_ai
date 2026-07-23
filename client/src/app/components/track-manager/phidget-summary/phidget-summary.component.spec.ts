import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PhidgetConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { PhidgetSummaryComponent } from "./phidget-summary.component";

describe("PhidgetSummaryComponent", () => {
  let component: PhidgetSummaryComponent;
  let fixture: ComponentFixture<PhidgetSummaryComponent>;
  let translationService: TranslationServiceMock;

  beforeEach(async () => {
    translationService = new TranslationServiceMock();

    await TestBed.configureTestingModule({
      imports: [PhidgetSummaryComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: translationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PhidgetSummaryComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("getDeviceName", () => {
    it("should return empty string if no config", () => {
      fixture.componentRef.setInput("config", undefined);
      expect(component.getDeviceName()).toBe("");
    });

    it("should return config name if present", () => {
      const config: Partial<PhidgetConfig> = {
        name: "My Phidget 8/8/8",
      };
      fixture.componentRef.setInput("config", config as PhidgetConfig);
      expect(component.getDeviceName()).toBe("My Phidget 8/8/8");
    });

    it("should fallback to 'Phidget' if name is empty", () => {
      const config: Partial<PhidgetConfig> = {
        name: "",
      };
      fixture.componentRef.setInput("config", config as PhidgetConfig);
      expect(component.getDeviceName()).toBe("Phidget");
    });
  });

  describe("getSerialNumberStr", () => {
    it("should return PS_NO_SERIAL if serial number is missing or 0", () => {
      fixture.componentRef.setInput("config", undefined);
      expect(component.getSerialNumberStr()).toBe("PS_NO_SERIAL");

      fixture.componentRef.setInput("config", {
        serialNumber: 0,
      } as PhidgetConfig);
      expect(component.getSerialNumberStr()).toBe("PS_NO_SERIAL");
    });

    it("should return serial number as string when > 0", () => {
      fixture.componentRef.setInput("config", {
        serialNumber: 123456,
      } as PhidgetConfig);
      expect(component.getSerialNumberStr()).toBe("123456");
    });
  });

  describe("getHubPortStr", () => {
    it("should return PS_NO_HUB if not hub port", () => {
      fixture.componentRef.setInput("config", {
        isHubPort: false,
      } as PhidgetConfig);
      expect(component.getHubPortStr()).toBe("PS_NO_HUB");
    });

    it("should return formatted port if isHubPort is true", () => {
      fixture.componentRef.setInput("config", {
        isHubPort: true,
        hubPort: 2,
      } as PhidgetConfig);
      expect(component.getHubPortStr()).toBe("Port 2");
    });
  });

  describe("getConfiguredPinCount", () => {
    it("should return 0 if no config", () => {
      fixture.componentRef.setInput("config", undefined);
      expect(component.getConfiguredPinCount()).toBe(0);
    });

    it("should count configured pins excluding unused and reserved", () => {
      const digitalInIds = [
        PinBehavior.BEHAVIOR_UNUSED, // 0
        PinBehavior.BEHAVIOR_RESERVED, // 1
        PinBehavior.BEHAVIOR_CALL_BUTTON, // 2 (Counted)
        -1, // Not counted
        1000, // Counted
      ];
      const digitalOutIds = [
        PinBehavior.BEHAVIOR_RELAY, // Counted
      ];
      const analogIds = [
        PinBehavior.BEHAVIOR_UNUSED, // 0
        2000, // Counted
      ];

      const config: Partial<PhidgetConfig> = {
        digitalInIds,
        digitalOutIds,
        analogIds,
      };
      fixture.componentRef.setInput("config", config as PhidgetConfig);
      expect(component.getConfiguredPinCount()).toBe(4);
    });
  });

  describe("hasBehavior", () => {
    it("should detect laps", () => {
      const digitalInIds = [PinBehavior.BEHAVIOR_LAP_BASE]; // 1000
      const config: Partial<PhidgetConfig> = {
        digitalInIds,
      };
      fixture.componentRef.setInput("config", config as PhidgetConfig);
      expect(component.hasBehavior("lap")).toBeTrue();
    });

    it("should detect segments", () => {
      const digitalInIds = [PinBehavior.BEHAVIOR_SEGMENT_BASE]; // 2000
      const config: Partial<PhidgetConfig> = {
        digitalInIds,
      };
      fixture.componentRef.setInput("config", config as PhidgetConfig);
      expect(component.hasBehavior("segment")).toBeTrue();
    });

    it("should detect call buttons", () => {
      const digitalInIds = [PinBehavior.BEHAVIOR_CALL_BUTTON];
      const config: Partial<PhidgetConfig> = { digitalInIds };
      fixture.componentRef.setInput("config", config as PhidgetConfig);
      expect(component.hasBehavior("call")).toBeTrue();
    });

    it("should detect relays", () => {
      const digitalOutIds = [PinBehavior.BEHAVIOR_RELAY];
      const config: Partial<PhidgetConfig> = { digitalOutIds };
      fixture.componentRef.setInput("config", config as PhidgetConfig);
      expect(component.hasBehavior("relay")).toBeTrue();
    });

    it("should return false if behavior absent", () => {
      const config: Partial<PhidgetConfig> = {
        digitalInIds: [],
        digitalOutIds: [],
        analogIds: [],
      };
      fixture.componentRef.setInput("config", config as PhidgetConfig);
      expect(component.hasBehavior("lap")).toBeFalse();
      expect(component.hasBehavior("segment")).toBeFalse();
      expect(component.hasBehavior("call")).toBeFalse();
      expect(component.hasBehavior("relay")).toBeFalse();
    });
  });
});
