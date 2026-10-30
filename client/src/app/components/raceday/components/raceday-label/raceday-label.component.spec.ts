import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayLabelComponent } from "./raceday-label.component";

describe("RacedayLabelComponent", () => {
  let component: RacedayLabelComponent;
  let fixture: ComponentFixture<RacedayLabelComponent>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayLabelComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayLabelComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should return correct flex alignment for getJustify", () => {
    expect(component.getJustify("left")).toBe("flex-start");
    expect(component.getJustify("start")).toBe("flex-start");
    expect(component.getJustify("right")).toBe("flex-end");
    expect(component.getJustify("end")).toBe("flex-end");
    expect(component.getJustify("center")).toBe("center");
    expect(component.getJustify(undefined)).toBe("center");
  });

  it("should return flipped flex alignment for getJustify when vertical", () => {
    const vertWidget: AbsoluteWidgetNode = {
      id: "label-vert",
      widgetType: "label",
      x: 10,
      y: 20,
      width: 40,
      height: 200,
      zIndex: 10,
      customSettings: {
        text: "Vertical Label",
        vertical: true,
      },
    };
    fixture.componentRef.setInput("widget", vertWidget);
    expect(component.isVertical()).toBeTrue();
    expect(component.getJustify("left")).toBe("flex-end");
    expect(component.getJustify("start")).toBe("flex-end");
    expect(component.getJustify("right")).toBe("flex-start");
    expect(component.getJustify("end")).toBe("flex-start");
    expect(component.getJustify("center")).toBe("center");
  });

  it("should render text and styles from widget settings", () => {
    const mockWidget: AbsoluteWidgetNode = {
      id: "label-1",
      widgetType: "label",
      x: 10,
      y: 20,
      width: 200,
      height: 40,
      zIndex: 10,
      customSettings: {
        text: "Custom Leaderboard",
        fontSize: 22,
        fontFamily: "Arial",
        textColor: "#ff0000",
        backgroundColor: "#00ff00",
        fontBold: true,
        fontItalic: true,
        alignment: "right",
        showBorder: true,
        borderColor: "#0000ff",
        borderWidth: 2,
        borderRadius: 8,
      },
    };

    fixture.componentRef.setInput("widget", mockWidget);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector(
      ".raceday-label-widget",
    );
    expect(el).toBeTruthy();
    expect(el.textContent?.trim()).toBe("Custom Leaderboard");
    expect(el.style.fontSize).toBe("22px");
    expect(el.style.fontFamily).toBe("Arial");
    expect(el.style.fontWeight).toBe("bold");
    expect(el.style.fontStyle).toBe("italic");
    expect(el.style.justifyContent).toBe("flex-end");
    expect(el.style.borderStyle).toBe("solid");
    expect(el.style.borderWidth).toBe("2px");
    expect(el.style.borderRadius).toBe("8px");
  });

  it("should preserve fixed fontSize and nowrap when scaleMode is fixed", () => {
    const fixedWidget: AbsoluteWidgetNode = {
      id: "label-fixed",
      widgetType: "label",
      x: 10,
      y: 20,
      width: 100,
      height: 40,
      zIndex: 10,
      scaleMode: "fixed",
      customSettings: {
        text: "Very Long Text That Exceeds Width",
        fontSize: 24,
      },
    };

    fixture.componentRef.setInput("widget", fixedWidget);
    fixture.detectChanges();

    expect(component.isScaleAuto()).toBeFalse();
    expect(component.effectiveFont().fontSize).toBe(24);
    expect(component.effectiveFont().shouldWrap).toBeFalse();

    const el: HTMLElement = fixture.nativeElement.querySelector(
      ".raceday-label-widget",
    );
    expect(el.classList.contains("scale-auto")).toBeFalse();
    expect(el.classList.contains("label-wrap")).toBeFalse();
    expect(el.style.fontSize).toBe("24px");
  });

  it("should auto-scale and wrap text when scaleMode is auto and space allows multi-line", () => {
    const autoWidget: AbsoluteWidgetNode = {
      id: "label-auto",
      widgetType: "label",
      x: 10,
      y: 20,
      width: 120,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        text: "Grid Title Multi Word",
        fontSize: 24,
      },
    };

    fixture.componentRef.setInput("widget", autoWidget);
    fixture.detectChanges();

    expect(component.isScaleAuto()).toBeTrue();
    const eff = component.effectiveFont();
    expect(eff.fontSize).toBeGreaterThan(0);

    const el: HTMLElement = fixture.nativeElement.querySelector(
      ".raceday-label-widget",
    );
    expect(el.classList.contains("scale-auto")).toBeTrue();
  });

  it("should scale down single line text when text has no spaces in auto scaleMode", () => {
    const autoWidget: AbsoluteWidgetNode = {
      id: "label-auto-single",
      widgetType: "label",
      x: 10,
      y: 20,
      width: 80,
      height: 30,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        text: "SuperLongWordWithoutSpaces",
        fontSize: 24,
      },
    };

    fixture.componentRef.setInput("widget", autoWidget);
    fixture.detectChanges();

    expect(component.isScaleAuto()).toBeTrue();
    const eff = component.effectiveFont();
    expect(eff.shouldWrap).toBeFalse();
    expect(eff.fontSize).toBeLessThan(24);
  });
});
