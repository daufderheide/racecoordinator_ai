import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayAbsoluteWidgetComponent } from "./raceday-absolute-widget.component";
import { RacedayAbsoluteWidgetHarness } from "./testing/raceday-absolute-widget.harness";

describe("RacedayAbsoluteWidgetComponent", () => {
  let component: RacedayAbsoluteWidgetComponent;
  let fixture: ComponentFixture<RacedayAbsoluteWidgetComponent>;
  let harness: RacedayAbsoluteWidgetHarness;
  let mockParent: any;
  let mockWidget: AbsoluteWidgetNode;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockWidget = {
      id: "test-widget",
      widgetType: "timer",
      x: 10,
      y: 20,
      width: 150,
      height: 80,
      zIndex: 100,
    };

    mockParent = {
      visualScale: 1,
      track: undefined,
      heat: undefined,
      heats: [],
      isTeam: () => false,
      getTeammates: () => [],
      getDropdownIcon: () => "",
      getDriverStats: () => "",
      snapToEdges: jasmine
        .createSpy("snapToEdges")
        .and.callFake((x, y, w, h) => ({ x, y, w, h })),
      moveWidgetForward: jasmine.createSpy("moveWidgetForward"),
      moveWidgetBackward: jasmine.createSpy("moveWidgetBackward"),
      removeWidget: jasmine.createSpy("removeWidget"),
      bringToFront: jasmine.createSpy("bringToFront"),
      layoutChanged: {
        emit: jasmine.createSpy("emit"),
      },
      layout: {
        widgets: [],
        baseWidth: 1920,
        baseHeight: 1080,
      },
    };

    await TestBed.configureTestingModule({
      imports: [RacedayAbsoluteWidgetComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayAbsoluteWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("widget", mockWidget);
    fixture.componentRef.setInput("parentComponent", mockParent);
    fixture.componentRef.setInput("isCustomizing", true);
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayAbsoluteWidgetHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should correctly compute isSelected", () => {
    expect(component.isSelected).toBeFalse();
    fixture.componentRef.setInput("selectedWidgetId", "test-widget");
    expect(component.isSelected).toBeTrue();
  });

  it("should use harness to check customization state and labels", async () => {
    expect(await harness.isCustomizing()).toBeTrue();
    expect(await harness.getWidgetTypeLabel()).toBe("timer");
  });

  it("should delegate removeWidget to parent removeWidget via harness", async () => {
    await harness.clickRemove();
    expect(mockParent.removeWidget).toHaveBeenCalledWith("test-widget");
  });

  it("should delegate bringToFront to parent bringToFront", () => {
    component.bringToFront();
    expect(mockParent.bringToFront).toHaveBeenCalledWith("test-widget");
  });

  it("should handle resize start, move, and pointerup with edge snapping and minimum bounds", () => {
    const fakeStartEvent = new PointerEvent("pointerdown", {
      clientX: 100,
      clientY: 100,
    });
    spyOn(fakeStartEvent, "preventDefault");
    spyOn(fakeStartEvent, "stopPropagation");

    // Test resize with 'se' handle
    component.onResizeStart(fakeStartEvent, "se");
    expect(fakeStartEvent.preventDefault).toHaveBeenCalled();

    // Trigger document pointermove
    const fakeMoveEvent = new PointerEvent("pointermove", {
      clientX: 150,
      clientY: 130,
    });
    document.dispatchEvent(fakeMoveEvent);

    expect(mockParent.snapToEdges).toHaveBeenCalled();

    // Trigger document pointerup
    const fakeUpEvent = new PointerEvent("pointerup");
    document.dispatchEvent(fakeUpEvent);
    expect(mockParent.layoutChanged.emit).toHaveBeenCalled();
  });

  it("should handle resize with 'nw' handle and enforce min 50px dimensions", () => {
    const fakeStartEvent = new PointerEvent("pointerdown", {
      clientX: 100,
      clientY: 100,
    });

    component.onResizeStart(fakeStartEvent, "nw");

    // Move so much that it would shrink below 50px
    const fakeMoveEvent = new PointerEvent("pointermove", {
      clientX: 300,
      clientY: 300,
    });
    document.dispatchEvent(fakeMoveEvent);

    expect(component.widget().width).toBe(50);
    expect(component.widget().height).toBe(50);

    document.dispatchEvent(new PointerEvent("pointerup"));
  });

  it("should ignore resize start if isCustomizing is false", () => {
    fixture.componentRef.setInput("isCustomizing", false);
    const fakeStartEvent = new PointerEvent("pointerdown");
    spyOn(fakeStartEvent, "preventDefault");

    component.onResizeStart(fakeStartEvent, "se");
    expect(fakeStartEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("should handle dragging widget with snapping and pointermove/pointerup", () => {
    const target = document.createElement("div");
    const fakeStartEvent = new PointerEvent("pointerdown", {
      clientX: 50,
      clientY: 50,
    });
    Object.defineProperty(fakeStartEvent, "target", { value: target });
    spyOn(fakeStartEvent, "preventDefault");

    component.onDragStart(fakeStartEvent);
    expect(fakeStartEvent.preventDefault).toHaveBeenCalled();
    expect(mockParent.bringToFront).toHaveBeenCalledWith("test-widget");

    // Move
    const fakeMoveEvent = new PointerEvent("pointermove", {
      clientX: 70,
      clientY: 80,
    });
    document.dispatchEvent(fakeMoveEvent);

    expect(mockParent.snapToEdges).toHaveBeenCalled();

    // Up
    document.dispatchEvent(new PointerEvent("pointerup"));
    expect(mockParent.layoutChanged.emit).toHaveBeenCalled();
  });

  it("should not start dragging if clicking resize handle or button", () => {
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "resize-handle";
    const fakeResizeEvent = new PointerEvent("pointerdown");
    Object.defineProperty(fakeResizeEvent, "target", { value: resizeHandle });
    spyOn(fakeResizeEvent, "preventDefault");

    component.onDragStart(fakeResizeEvent);
    expect(fakeResizeEvent.preventDefault).not.toHaveBeenCalled();

    const btn = document.createElement("button");
    const fakeBtnEvent = new PointerEvent("pointerdown");
    Object.defineProperty(fakeBtnEvent, "target", { value: btn });
    spyOn(fakeBtnEvent, "preventDefault");

    component.onDragStart(fakeBtnEvent);
    expect(fakeBtnEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("should handle removeWidget directly", () => {
    const fakeEvent = new Event("click");
    spyOn(fakeEvent, "stopPropagation");
    component.removeWidget(fakeEvent);
    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(mockParent.removeWidget).toHaveBeenCalledWith("test-widget");
  });

  it("should apply scale-auto class when scaleMode is 'auto'", () => {
    mockWidget.scaleMode = "auto";
    mockWidget.textScaleFactor = 1.2;
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.classList.contains("scale-auto")).toBeTrue();
    expect(wrapper.classList.contains("scale-fixed")).toBeFalse();
  });

  it("should apply scale-fixed class and fontSize styles when scaleMode is 'fixed'", () => {
    mockWidget.scaleMode = "fixed";
    mockWidget.fontSize = 32;
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.classList.contains("scale-fixed")).toBeTrue();
    expect(wrapper.classList.contains("scale-auto")).toBeFalse();
  });

  it("should apply custom color and background classes when set", () => {
    mockWidget.textColor = "#ff0000";
    mockWidget.backgroundColor = "#00ff00";
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.classList.contains("has-custom-color")).toBeTrue();
    expect(wrapper.classList.contains("has-custom-bg")).toBeTrue();
  });

  it("should render on-deck widget", () => {
    mockWidget.widgetType = "on-deck";
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const onDeck = fixture.nativeElement.querySelector("app-raceday-on-deck");
    expect(onDeck).toBeTruthy();
  });

  it("should render next-heat widget", () => {
    mockWidget.widgetType = "next-heat";
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
    const nextHeat = fixture.nativeElement.querySelector(
      "app-raceday-next-heat",
    );
    expect(nextHeat).toBeTruthy();
  });

  it("should apply pointer-events: none to interactive elements inside widgets when in edit mode", () => {
    mockWidget.widgetType = "on-deck";
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.classList.contains("edit-mode")).toBeTrue();

    const select = document.createElement("select");
    const button = document.createElement("button");
    const anchor = document.createElement("a");
    const content = fixture.nativeElement.querySelector(".widget-content");
    content.appendChild(select);
    content.appendChild(button);
    content.appendChild(anchor);

    const selectStyle = window.getComputedStyle(select);
    const buttonStyle = window.getComputedStyle(button);
    const anchorStyle = window.getComputedStyle(anchor);

    expect(selectStyle.pointerEvents).toBe("none");
    expect(buttonStyle.pointerEvents).toBe("none");
    expect(anchorStyle.pointerEvents).toBe("none");

    const deleteColBtn = document.createElement("button");
    deleteColBtn.className = "delete-col-btn";
    const colVisibilitySelect = document.createElement("select");
    colVisibilitySelect.className = "col-visibility-select";
    const deleteAnchorBtn = document.createElement("button");
    deleteAnchorBtn.className = "delete-anchor-btn";

    content.appendChild(deleteColBtn);
    content.appendChild(colVisibilitySelect);
    content.appendChild(deleteAnchorBtn);

    const deleteColStyle = window.getComputedStyle(deleteColBtn);
    const colVisStyle = window.getComputedStyle(colVisibilitySelect);
    const deleteAnchorStyle = window.getComputedStyle(deleteAnchorBtn);

    expect(deleteColStyle.pointerEvents).toBe("auto");
    expect(colVisStyle.pointerEvents).toBe("auto");
    expect(deleteAnchorStyle.pointerEvents).toBe("auto");
  });

  it("should apply widget zIndex for menu-bar when isCustomizing is true", () => {
    mockWidget.widgetType = "menu-bar";
    mockWidget.zIndex = 105;
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.style.zIndex).toBe("105");
  });

  it("should apply 99999 zIndex for menu-bar when isCustomizing is false", () => {
    mockWidget.widgetType = "menu-bar";
    mockWidget.zIndex = 105;
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.componentRef.setInput("isCustomizing", false);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.style.zIndex).toBe("99999");
  });

  it("should apply regular zIndex for other widgets in both customizing and live modes", () => {
    mockWidget.widgetType = "timer";
    mockWidget.zIndex = 120;
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.componentRef.setInput("isCustomizing", true);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector(".widget-wrapper");
    expect(wrapper.style.zIndex).toBe("120");

    fixture.componentRef.setInput("isCustomizing", false);
    fixture.detectChanges();
    expect(wrapper.style.zIndex).toBe("120");
  });
});
