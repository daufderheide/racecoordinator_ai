import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { ThemeService } from "@app/services/theme.service";

import { RacedayCountdownComponent } from "./raceday-countdown.component";

describe("RacedayCountdownComponent", () => {
  let component: RacedayCountdownComponent;
  let fixture: ComponentFixture<RacedayCountdownComponent>;

  const defaultWidget: AbsoluteWidgetNode = {
    id: "widget-countdown",
    widgetType: "countdown",
    x: 460,
    y: 390,
    width: 1000,
    height: 250,
    zIndex: 2000,
    scaleMode: "auto",
    customSettings: {
      orientation: "horizontal",
      lampScale: 1.0,
      blurArea: "fullscreen",
      blurAmount: 50,
    },
  };

  const mockParent = {
    showCountdownOverlay: false,
    countdownLamps: [
      { url: "red-on.png", state: "on" },
      { url: "red-on.png", state: "on" },
      { url: "red-dim.png", state: "dim" },
    ],
    layout: { baseWidth: 1920, baseHeight: 1080 },
    resolveAssetUrlBySlot: (slot: string) => `${slot}.png`,
    getAssetUrl: (name: string) => `${name}.png`,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayCountdownComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            resolveAssetId: (slot: string) => `asset-${slot}`,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayCountdownComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("widget", defaultWidget);
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput("isCustomizing", false);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be hidden when showCountdownOverlay is false and not customizing", () => {
    expect(component.isVisible).toBeFalse();
    const overlay = fixture.nativeElement.querySelector(".countdown-overlay");
    expect(overlay).toBeNull();
  });

  it("should be visible when showCountdownOverlay is true", () => {
    const activeParent = { ...mockParent, showCountdownOverlay: true };
    fixture.componentRef.setInput("parent", activeParent);
    fixture.detectChanges();

    expect(component.isVisible).toBeTrue();
    const overlay = fixture.nativeElement.querySelector(".countdown-overlay");
    expect(overlay).not.toBeNull();

    const lamps = fixture.nativeElement.querySelectorAll(".start-lamp");
    expect(lamps.length).toBe(3);
    expect(lamps[0].classList.contains("on")).toBeTrue();
    expect(lamps[1].classList.contains("on")).toBeTrue();
    expect(lamps[2].classList.contains("on")).toBeFalse();
  });

  it("should be visible with preview lamps when isCustomizing is true", () => {
    const idleParent = {
      ...mockParent,
      showCountdownOverlay: false,
      countdownLamps: [],
    };
    fixture.componentRef.setInput("parent", idleParent);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    expect(component.isVisible).toBeTrue();
    const overlay = fixture.nativeElement.querySelector(".countdown-overlay");
    expect(overlay).not.toBeNull();

    const lamps = fixture.nativeElement.querySelectorAll(".start-lamp");
    expect(lamps.length).toBe(5);
    // Half red ('on'), half green ('go')
    expect(lamps[0].classList.contains("on")).toBeTrue();
    expect(lamps[1].classList.contains("on")).toBeTrue();
    expect(lamps[2].classList.contains("on")).toBeTrue();
    expect(lamps[3].classList.contains("go")).toBeTrue();
    expect(lamps[4].classList.contains("go")).toBeTrue();
  });

  it("should render vertically when orientation is vertical", () => {
    const verticalWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        orientation: "vertical",
      },
    };
    fixture.componentRef.setInput("widget", verticalWidget);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    expect(component.isVertical).toBeTrue();
    const lampsContainer =
      fixture.nativeElement.querySelector(".lamps-container");
    expect(lampsContainer.classList.contains("vertical")).toBeTrue();
  });

  it("should apply lamp scale to lamp elements", () => {
    const scaledWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        lampScale: 1.5,
      },
    };
    fixture.componentRef.setInput("widget", scaledWidget);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    expect(component.startLampStyles).toEqual({
      width: "180px",
      height: "180px",
      "max-width": "100%",
      "max-height": "100%",
    });
  });

  it("should configure fullscreen blur backdrop styles", () => {
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const styles = component.blurBackdropStyles;
    expect(styles["backdrop-filter"]).toBe("blur(8px)");
    expect(styles["left"]).toBe(`${(-460 / 1000) * 100}%`);
    expect(styles["top"]).toBe(`${(-390 / 250) * 100}%`);
    expect(styles["width"]).toBe(`${(1920 / 1000) * 100}%`);
    expect(styles["height"]).toBe(`${(1080 / 250) * 100}%`);
  });

  it("should configure widget-area blur backdrop styles", () => {
    const widgetAreaWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        blurArea: "widget",
      },
    };
    fixture.componentRef.setInput("widget", widgetAreaWidget);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const styles = component.blurBackdropStyles;
    expect(styles["left"]).toBe("0");
    expect(styles["top"]).toBe("0");
    expect(styles["width"]).toBe("100%");
    expect(styles["height"]).toBe("100%");
  });

  it("should configure custom-area blur backdrop styles", () => {
    const customAreaWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        blurArea: "custom",
        blurCustomX: 200,
        blurCustomY: 100,
        blurCustomWidth: 800,
        blurCustomHeight: 400,
      },
    };
    fixture.componentRef.setInput("widget", customAreaWidget);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const styles = component.blurBackdropStyles;
    expect(styles["left"]).toBe(`${((200 - 460) / 1000) * 100}%`);
    expect(styles["top"]).toBe(`${((100 - 390) / 250) * 100}%`);
    expect(styles["width"]).toBe(`${(800 / 1000) * 100}%`);
    expect(styles["height"]).toBe(`${(400 / 250) * 100}%`);
  });

  it("should hide blur backdrop when blurArea is none or blurAmount is 0", () => {
    const noBlurWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        blurArea: "none",
      },
    };
    fixture.componentRef.setInput("widget", noBlurWidget);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    expect(component.blurBackdropStyles).toEqual({ display: "none" });

    const zeroAmountWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        blurAmount: 0,
      },
    };
    fixture.componentRef.setInput("widget", zeroAmountWidget);
    fixture.detectChanges();
    expect(component.blurBackdropStyles).toEqual({ display: "none" });
  });

  it("should apply fully opaque background when blurAmount is 100", () => {
    const opaqueWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        blurAmount: 100,
      },
    };
    fixture.componentRef.setInput("widget", opaqueWidget);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const styles = component.blurBackdropStyles;
    expect(styles["background"]).toBe("rgba(0, 0, 0, 0.95)");
    expect(styles["backdrop-filter"]).toBe("blur(16px)");
  });

  it("should calculate dynamic lamp size when lampSizingMode is fit", () => {
    const fitWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      width: 1000,
      height: 250,
      customSettings: {
        ...defaultWidget.customSettings,
        lampSizingMode: "fit",
        previewLampCount: 5,
      },
    };
    fixture.componentRef.setInput("parent", {
      ...mockParent,
      countdownLamps: [],
    });
    fixture.componentRef.setInput("widget", fitWidget);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    expect(component.lampSizingMode).toBe("fit");
    const styles = component.startLampStyles;
    expect(styles["width"]).toBeDefined();
    expect(styles["height"]).toBeDefined();
    expect(parseInt(styles["width"], 10)).toBeGreaterThan(50);
    expect(component.lampsContainerStyles["gap"]).toBeDefined();

    // With 10 lamps, size should scale down proportionally
    const fit10Widget: AbsoluteWidgetNode = {
      ...fitWidget,
      customSettings: {
        ...fitWidget.customSettings,
        previewLampCount: 10,
      },
    };
    fixture.componentRef.setInput("widget", fit10Widget);
    fixture.detectChanges();
    const styles10 = component.startLampStyles;
    expect(parseInt(styles10["width"], 10)).toBeLessThan(
      parseInt(styles["width"], 10),
    );
    expect(component.displayLamps.length).toBe(10);
  });

  it("should calculate dynamic lamp size in vertical orientation when fit", () => {
    const verticalFitWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      width: 250,
      height: 1000,
      customSettings: {
        ...defaultWidget.customSettings,
        orientation: "vertical",
        lampSizingMode: "fit",
        previewLampCount: 5,
      },
    };
    fixture.componentRef.setInput("widget", verticalFitWidget);
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const styles = component.startLampStyles;
    expect(styles["width"]).toBeDefined();
    expect(parseInt(styles["width"], 10)).toBeGreaterThan(50);
  });

  it("should default glowEffect to true, glowIntensity to 100, glowRedOverlap to 100, and glowGreenOverlap to 100", () => {
    expect(component.glowEffect).toBeTrue();
    expect(component.glowIntensity).toBe(100);
    expect(component.glowRedOverlap).toBe(100);
    expect(component.glowGreenOverlap).toBe(100);
    expect(component.glowOverlap).toBe(100);
  });

  it("should respect custom glowEffect, glowIntensity, glowRedOverlap, and glowGreenOverlap settings", () => {
    const customGlowWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        glowEffect: false,
        glowIntensity: 60,
        glowRedOverlap: 40,
        glowGreenOverlap: 80,
      },
    };
    fixture.componentRef.setInput("widget", customGlowWidget);
    fixture.detectChanges();

    expect(component.glowEffect).toBeFalse();
    expect(component.glowIntensity).toBe(60);
    expect(component.glowRedOverlap).toBe(40);
    expect(component.glowGreenOverlap).toBe(80);
    expect(component.glowOverlap).toBe(40);
  });

  it("should fallback glowRedOverlap to glowOverlap when glowRedOverlap is omitted", () => {
    const legacyGlowWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        glowOverlap: 35,
      },
    };
    fixture.componentRef.setInput("widget", legacyGlowWidget);
    fixture.detectChanges();

    expect(component.glowRedOverlap).toBe(35);
    expect(component.glowOverlap).toBe(35);
  });

  it("should dynamically scale illuminated lamps based on glowRedOverlap and glowGreenOverlap settings independently", () => {
    const onLamp = { url: "red-on.png", state: "on" };
    const goLamp = { url: "green.png", state: "go" };

    // Default: red is 1.250 (100%), green is 1.400 (100%)
    expect(component.getLampStyles(onLamp)["transform"]).toBe("scale(1.250)");
    expect(component.getLampStyles(goLamp)["transform"]).toBe("scale(1.400)");

    // Independent overlap settings: red = 0, green = 50
    const independentWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        glowEffect: true,
        glowRedOverlap: 0,
        glowGreenOverlap: 50,
      },
    };
    fixture.componentRef.setInput("widget", independentWidget);
    fixture.detectChanges();
    expect(component.getLampStyles(onLamp)["transform"]).toBe("scale(1.000)");
    expect(component.getLampStyles(goLamp)["transform"]).toBe("scale(1.200)");

    // Independent overlap settings: red = 50, green = 0
    const reverseWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        glowEffect: true,
        glowRedOverlap: 50,
        glowGreenOverlap: 0,
      },
    };
    fixture.componentRef.setInput("widget", reverseWidget);
    fixture.detectChanges();
    expect(component.getLampStyles(onLamp)["transform"]).toBe("scale(1.125)");
    expect(component.getLampStyles(goLamp)["transform"]).toBe("scale(1.000)");
  });

  it("should provide consistent gap and glow clearance padding in lampsContainerStyles when glowEffect is true", () => {
    // Custom mode with glow
    const containerStylesCustom = component.lampsContainerStyles;
    expect(containerStylesCustom["gap"]).toBeDefined();
    expect(parseInt(containerStylesCustom["gap"], 10)).toBeGreaterThan(0);
    expect(containerStylesCustom["padding"]).toBe("30px"); // 20px glow radius + 10px

    // Fit mode with glow
    const fitWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        lampSizingMode: "fit",
        glowEffect: true,
        glowIntensity: 100,
      },
    };
    fixture.componentRef.setInput("widget", fitWidget);
    fixture.detectChanges();

    const containerStylesFit = component.lampsContainerStyles;
    expect(containerStylesFit["gap"]).toBeDefined();
    expect(parseInt(containerStylesFit["gap"], 10)).toBeGreaterThan(0);
    expect(containerStylesFit["padding"]).toBeDefined();
  });

  it("should maintain consistent gap and revert to standard padding when glowEffect is false", () => {
    // Custom mode with glowEffect disabled
    const noGlowCustomWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        glowEffect: false,
      },
    };
    fixture.componentRef.setInput("widget", noGlowCustomWidget);
    fixture.detectChanges();
    expect(component.lampsContainerStyles["gap"]).toBeDefined();
    expect(component.lampsContainerStyles["padding"]).toBe("10px");

    // Fit mode with glowEffect disabled
    const noGlowFitWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        lampSizingMode: "fit",
        glowEffect: false,
      },
    };
    fixture.componentRef.setInput("widget", noGlowFitWidget);
    fixture.detectChanges();
    const fitStyles = component.lampsContainerStyles;
    expect(fitStyles["gap"]).toBeDefined();
    expect(parseInt(fitStyles["gap"], 10)).toBeGreaterThan(0);
  });

  it("should apply outer glow filter in getLampStyles for on (red) and go (green) lamps when glowEffect is true", () => {
    const dimLamp = { url: "red-dim.png", state: "dim" };
    const onLamp = { url: "red-on.png", state: "on" };
    const goLamp = { url: "green.png", state: "go" };

    // Unilluminated: unmodified, no filter
    const dimStyles = component.getLampStyles(dimLamp);
    expect(dimStyles["filter"]).toBeUndefined();

    // Red on: contains red drop shadow
    const onStyles = component.getLampStyles(onLamp);
    expect(onStyles["filter"]).toBeDefined();
    expect(onStyles["filter"]).toContain("rgba(255, 30, 30");

    // Green go: contains green drop shadow
    const goStyles = component.getLampStyles(goLamp);
    expect(goStyles["filter"]).toBeDefined();
    expect(goStyles["filter"]).toContain("rgba(0, 255, 70");
  });

  it("should NOT apply outer glow filter in getLampStyles when glowEffect is false", () => {
    const noGlowWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        glowEffect: false,
      },
    };
    fixture.componentRef.setInput("widget", noGlowWidget);
    fixture.detectChanges();

    const onLamp = { url: "red-on.png", state: "on" };
    const goLamp = { url: "green.png", state: "go" };

    expect(component.getLampStyles(onLamp)["filter"]).toBeUndefined();
    expect(component.getLampStyles(goLamp)["filter"]).toBeUndefined();
  });

  it("should render DOM elements with has-glow class when glowEffect is true and without when false", () => {
    const activeParent = {
      ...mockParent,
      showCountdownOverlay: true,
      countdownLamps: [
        { url: "red-on.png", state: "on" },
        { url: "green.png", state: "go" },
        { url: "red-dim.png", state: "dim" },
      ],
    };
    fixture.componentRef.setInput("parent", activeParent);
    fixture.detectChanges();

    const lamps = fixture.nativeElement.querySelectorAll(".start-lamp");
    expect(lamps.length).toBe(3);
    expect(lamps[0].classList.contains("has-glow")).toBeTrue();
    expect(lamps[0].classList.contains("on")).toBeTrue();
    expect(lamps[1].classList.contains("has-glow")).toBeTrue();
    expect(lamps[1].classList.contains("go")).toBeTrue();
    expect(lamps[2].classList.contains("has-glow")).toBeTrue();
    expect(lamps[2].classList.contains("on")).toBeFalse();
    expect(lamps[2].classList.contains("go")).toBeFalse();

    // Disable glowEffect
    const noGlowWidget: AbsoluteWidgetNode = {
      ...defaultWidget,
      customSettings: {
        ...defaultWidget.customSettings,
        glowEffect: false,
      },
    };
    fixture.componentRef.setInput("widget", noGlowWidget);
    fixture.detectChanges();

    const noGlowLamps = fixture.nativeElement.querySelectorAll(".start-lamp");
    expect(noGlowLamps[0].classList.contains("has-glow")).toBeFalse();
    expect(noGlowLamps[1].classList.contains("has-glow")).toBeFalse();
    expect(noGlowLamps[2].classList.contains("has-glow")).toBeFalse();
  });
});
